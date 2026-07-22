// Transforms a backend IntegrityReport into the content shape the dashboard
// components consume. Shared by the fresh-upload flow (Home) and the stored
// report view (PaperDetail) — one copy so the two paths can't drift.

export function generateScoreBreakdown(result) {
  const breakdown = [];

  const signals = result.integrity_signals || [];

  // Citations Verified
  const citationScore = result.references_found > 0
    ? Math.round((result.references_verified / result.references_found) * 20)
    : 0;
  breakdown.push({
    criterion: 'Citations Verified',
    score: citationScore,
    maxScore: 20,
    status: citationScore >= 16 ? 'pass' : citationScore >= 10 ? 'partial' : 'fail'
  });

  // Statistical Reporting
  const hasStats = result.statistics && result.statistics.p_values && result.statistics.p_values.length > 0;
  const statScore = hasStats ? 12 : 5;
  breakdown.push({
    criterion: 'Statistical Reporting',
    score: statScore,
    maxScore: 15,
    status: hasStats ? 'pass' : 'partial'
  });

  // Limitations Section
  const hasLimitations = !signals.some(s => s.toLowerCase().includes('no limitations'));
  breakdown.push({
    criterion: 'Limitations Discussed',
    score: hasLimitations ? 10 : 0,
    maxScore: 10,
    status: hasLimitations ? 'pass' : 'fail'
  });

  // Ethics Statement
  const hasEthics = !signals.some(s => s.toLowerCase().includes('no ethics'));
  breakdown.push({
    criterion: 'Ethics Statement',
    score: hasEthics ? 10 : 0,
    maxScore: 10,
    status: hasEthics ? 'pass' : 'fail'
  });

  // Conflict of Interest
  const hasCOI = !signals.some(s => s.toLowerCase().includes('conflict of interest'));
  breakdown.push({
    criterion: 'Conflict of Interest Disclosed',
    score: hasCOI ? 10 : 0,
    maxScore: 10,
    status: hasCOI ? 'pass' : 'fail'
  });

  // Pre-registration (bonus)
  const hasPreReg = signals.some(s => s.toLowerCase().includes('pre-registered'));
  breakdown.push({
    criterion: 'Pre-registration',
    score: hasPreReg ? 10 : 0,
    maxScore: 10,
    status: hasPreReg ? 'pass' : 'partial'
  });

  // Open Data (bonus)
  const hasOpenData = signals.some(s => s.toLowerCase().includes('open data') || s.toLowerCase().includes('data/code'));
  breakdown.push({
    criterion: 'Open Data/Code',
    score: hasOpenData ? 10 : 0,
    maxScore: 10,
    status: hasOpenData ? 'pass' : 'partial'
  });

  // Replication
  const hasReplication = signals.some(s => s.toLowerCase().includes('replication'));
  breakdown.push({
    criterion: 'Replication Discussed',
    score: hasReplication ? 5 : 0,
    maxScore: 5,
    status: hasReplication ? 'pass' : 'partial'
  });

  return breakdown;
}

export function buildAnalysisContent(report, meta = {}) {
  return {
    title: meta.title,
    paper_id: meta.paper_id,
    created_date: meta.created_date,
    source_type: meta.source_type || 'research',
    input_type: meta.input_type || 'pdf',
    status: 'analyzed',
    page_count: report.pages,
    word_count: report.word_count,
    sections_detected: report.sections_detected,
    quality_score: report.integrity_score,
    quality_grade: report.integrity_grade,
    citations: report.citations.map(c => ({
      text: c.raw_text,
      title: c.title || c.normalized,
      authors: c.authors ? c.authors.join(', ') : '',
      doi: c.doi || '',
      verified: c.status === 'verified',
      confidence: c.confidence
    })),
    statistics: [
      ...report.statistics.p_values.map(p => ({
        type: 'p-value',
        value: p,
        context: p.includes('0.05') || p.includes('0.04') ? 'Near significance threshold' : null,
        flag: (p.includes('0.05') || p.includes('0.04') || p.includes('0.06')) ? 'Borderline significance' : null
      })),
      ...report.statistics.sample_sizes.map(n => ({
        type: 'sample_size',
        value: n,
        context: null,
        flag: parseInt(n.match(/\d+/)?.[0] || '0') < 30 ? 'Small sample' : null
      })),
      ...report.statistics.effect_sizes.map(e => ({
        type: 'effect_size',
        value: e,
        context: null,
        flag: null
      })),
      ...report.statistics.cis.map(ci => ({
        type: 'confidence_interval',
        value: ci,
        context: null,
        flag: null
      }))
    ],
    red_flags: report.statistics.red_flags.filter(f => !f.startsWith('✅')),
    good_practices: report.statistics.red_flags.filter(f => f.startsWith('✅')),
    score_breakdown: generateScoreBreakdown(report),
    summary: {
      key_findings: [
        report.references_verified + ' of ' + report.references_found + ' citations verified',
        report.statistics.p_values.length + ' p-values extracted',
        report.intext_total + ' in-text citations found'
      ]
    },
    _raw: report,
  };
}
