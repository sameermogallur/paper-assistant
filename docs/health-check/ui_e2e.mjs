// Drive the real AIRA frontend in headless Chromium.
// Usage: node ui_e2e.mjs <playwright_dir> <scratch_dir> [scenarios]
//   scenarios: comma list, default "all" (fresh,slow,stats,library,detail,project,scanned,design,dark,streamlit)
import path from 'node:path';

const [PW_DIR, SCR, ONLY = 'all'] = process.argv.slice(2);
const { chromium } = await import(path.join(PW_DIR, 'node_modules/playwright/index.mjs'));

const APP = 'http://localhost:5173';
const SHOTS = path.join(SCR, 'shots');
const FIX = path.join(SCR, 'gen');
const ARXIV = path.join(SCR, 'dl/arxiv/paper.pdf');
const want = (s) => ONLY === 'all' || ONLY.split(',').includes(s);
const results = {};
const consoleErrors = [];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`${page.url()} :: ${m.text().slice(0, 200)}`); });
page.on('pageerror', (e) => consoleErrors.push(`${page.url()} :: pageerror ${String(e).slice(0, 200)}`));
const dialogs = [];
page.on('dialog', async (d) => { dialogs.push(d.message()); await d.accept(); });

const shot = (name, full = false) => page.screenshot({ path: path.join(SHOTS, name), fullPage: full });
const visible = (loc) => loc.first().isVisible().catch(() => false);

async function homeState() {
  if (await visible(page.getByRole('button', { name: /Download Report/ }))) return 'dashboard';
  if (await visible(page.getByRole('heading', { name: /Analyzing Your/ }))) return 'progress';
  if (await visible(page.getByRole('heading', { name: /Analyze Content/ }))) return 'upload';
  if (await visible(page.getByText(/Still analyzing/))) return 'waiting-message';
  return 'blank';
}

async function uploadViaHome(file) {
  await page.goto(APP + '/');
  await page.getByRole('button', { name: /Analyze Your Paper/ }).click();
  await page.locator('input[type=file]').setInputFiles(file);
  await page.getByRole('button', { name: /Start Analysis/ }).click();
  await page.getByRole('button', { name: /Research Paper/ }).click();
}

async function timeline(limitMs, snapshotAtMs) {
  const t0 = Date.now();
  const events = [];
  let last = null;
  let snapped = false;
  while (Date.now() - t0 < limitMs) {
    const s = await homeState();
    if (s !== last) { events.push([Math.round((Date.now() - t0) / 100) / 10, s]); last = s; }
    if (snapshotAtMs && !snapped && Date.now() - t0 > snapshotAtMs) { await shot('03-slow-analysis-at-12s.png'); snapped = true; }
    if (s === 'dashboard' || s === 'upload' && events.length > 1) break;
    await page.waitForTimeout(250);
  }
  return events;
}

async function citationCounts() {
  const nums = await page.locator('.grid.grid-cols-3 p.text-2xl').allInnerTexts();
  const rows = await page.locator('table tbody tr').evaluateAll((trs) => trs.map((tr) => {
    const badge = [...tr.querySelectorAll('div')].map((d) => d.textContent).find((t) => /^(Verified|Partial Match|Unverified)$/.test(t?.trim()));
    const bar = tr.querySelector('.h-full.rounded-full');
    const pct = tr.querySelector('td:last-child span')?.textContent;
    return { badge: badge?.trim(), bar: bar?.className.match(/bg-(\w+)-500/)?.[1], pct };
  }));
  return { cards: { verified: nums[0], partial: nums[1], unverified: nums[2] }, rows };
}

async function run(name, fn) {
  if (!want(name)) return;
  const t = Date.now();
  try { results[name] = { ok: true, ...(await fn()) }; }
  catch (e) { results[name] = { ok: false, error: String(e).slice(0, 300) }; }
  results[name].secs = Math.round((Date.now() - t) / 100) / 10;
  console.log(`[${name}]`, JSON.stringify(results[name]));
}

await run('fresh', async () => {
  await page.goto(APP + '/');
  await shot('01-landing.png');
  let apiMs = null;
  const started = Date.now();
  const onResp = (r) => { if (r.url().endsWith('/api/papers') && r.request().method() === 'POST') apiMs = Date.now() - started; };
  page.on('response', onResp);
  await uploadViaHome(ARXIV);
  const events = await timeline(120000);
  page.off('response', onResp);
  await page.waitForTimeout(500);
  await shot('02-dashboard-arxiv.png', true);
  return { events, apiMs_from_click: apiMs, counts: await citationCounts().then((c) => c.cards) };
});

await run('slow', async () => {
  // Simulate a slow analysis (e.g. Crossref retries): hold the ingest request 15 s.
  await page.route('**/api/papers', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    await new Promise((r) => setTimeout(r, 15000));
    await route.continue();
  });
  await uploadViaHome(path.join(FIX, 'synthetic.pdf'));
  const events = await timeline(60000, 12000);
  await page.unroute('**/api/papers');
  const counts = await citationCounts();
  await shot('04-dashboard-synthetic-citations.png', true);
  return { events, counts };
});

await run('stats', async () => {
  // Continues on the synthetic paper's dashboard from 'slow'.
  await page.getByRole('tab', { name: /Statistics/ }).click();
  await page.waitForTimeout(400);
  const flags = await page.locator('span.text-amber-800').allTextContents();
  await shot('05-statistics-flags.png', true);
  return {
    flags: flags.map((f) => ({ text: f.slice(0, 60), firstCodeUnit: f.charCodeAt(0).toString(16), loneSurrogate: /^[\uDC00-\uDFFF]/.test(f) })),
  };
});

await run('library', async () => {
  await page.goto(APP + '/library');
  await page.getByText(/Library/).first().waitFor();
  await page.waitForTimeout(800);
  await shot('06-library.png', true);
  const cards = await page.locator('h3.font-semibold').allInnerTexts();
  const grades = await page.locator('div.rounded-xl span.inline-flex, div.rounded-xl div.inline-flex').allInnerTexts().catch(() => []);
  const scores = await page.getByText(/\/100$/).allInnerTexts();
  return { cards, scores, gradesSample: grades.slice(0, 8) };
});

await run('detail', async () => {
  await page.goto(APP + '/papers/1');
  await page.getByText('Similar in your library').waitFor();
  await page.waitForTimeout(2500);
  await shot('07-paper-detail-plos.png', true);
  const similar = await page.locator('h3:has-text("Similar in your library") + *').innerText().catch(() => '');
  const related = await page.locator('h3:has-text("Related on OpenAlex") ~ *').allInnerTexts().catch(() => []);
  return { title: await page.locator('h1').first().innerText(), counts: await citationCounts(), similar: similar.slice(0, 200), related: related.join(' | ').slice(0, 200) };
});

await run('project', async () => {
  await page.goto(APP + '/library');
  await page.getByPlaceholder('New project name').fill('UI check');
  await page.getByRole('button', { name: /Create/ }).click();
  await page.getByRole('link', { name: /UI check/ }).click();
  await page.locator('#add-paper').waitFor();
  await page.waitForFunction(() => !document.querySelector('#add-paper')?.disabled);
  const options = await page.locator('#add-paper option').allInnerTexts();
  await page.locator('#add-paper').selectOption({ index: 1 });
  await page.getByRole('button', { name: /^Add$/ }).click();
  await page.getByRole('button', { name: /Remove from project/ }).waitFor();
  const afterAdd = await page.getByText(/\d+ papers?$/).first().innerText();
  await shot('08-project.png', true);
  await page.getByRole('button', { name: /Remove from project/ }).click();
  await page.getByText(/No papers in this project yet/).waitFor();
  return { options: options.length, afterAdd, removed: true, noRenameOrDeleteControls: !(await visible(page.getByRole('button', { name: /Delete|Rename/ }))) };
});

await run('scanned', async () => {
  dialogs.length = 0;
  await uploadViaHome(path.join(FIX, 'scanned.pdf'));
  await page.waitForEvent('dialog', { timeout: 30000 }).catch(() => null);
  await page.waitForTimeout(500);
  return { dialogs: [...dialogs], landedOn: await homeState() };
});

await run('design', async () => {
  await page.goto(APP + '/styleguide');
  await shot('09-styleguide-light.png', true);
  await page.goto(APP + '/styleguide/paper');
  await shot('10-mock-paper-light.png', true);
  await page.getByRole('button', { name: /Switch to dark mode/ }).click();
  await page.waitForTimeout(300);
  await shot('11-mock-paper-dark.png', true);
  return {};
});

await run('dark', async () => {
  // next-themes persisted "dark" from the toggle above; production pages hardcode light colors.
  await page.goto(APP + '/library');
  await page.waitForTimeout(800);
  await shot('12-library-dark.png', true);
  const colors = await page.evaluate(() => ({
    html: document.documentElement.className,
    body: getComputedStyle(document.body).backgroundColor,
    main: getComputedStyle(document.querySelector('main > div') || document.body).backgroundColor,
    header: getComputedStyle(document.querySelector('header')).backgroundColor,
  }));
  await page.evaluate(() => localStorage.setItem('theme', 'light'));
  return { colors };
});

await run('streamlit', async () => {
  await page.goto('http://localhost:8501/');
  await page.locator('input[type=file]').first().waitFor({ state: 'attached', timeout: 30000 });
  await page.locator('input[type=file]').first().setInputFiles(path.join(FIX, 'synthetic.pdf'));
  await page.getByRole('tab', { name: /AI Summary/ }).waitFor({ timeout: 60000 });
  await page.getByRole('tab', { name: /AI Summary/ }).click();
  await page.getByText(/OpenAI API key not configured/).waitFor({ timeout: 20000 });
  await shot('13-streamlit-ai-tab-no-key.png', true);
  return { message: (await page.getByText(/OpenAI API key not configured/).first().innerText()).slice(0, 120) };
});

console.log('CONSOLE_ERRORS', JSON.stringify(consoleErrors.slice(0, 20)));
await browser.close();
