const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const response = await fetch(API_BASE + path, options);

  if (!response.ok) {
    const body = await response.text();
    // Unwrap FastAPI's {"detail": ...} envelope so UI error states stay readable
    let message = body;
    try {
      const detail = JSON.parse(body).detail;
      if (typeof detail === 'string') message = detail;
      else if (Array.isArray(detail)) message = detail.map((d) => d.msg || String(d)).join('; ');
    } catch {
      // not JSON — keep raw text
    }
    const error = new Error(message || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export const airaApi = {
  async analyzePdf(file) {
    const formData = new FormData();
    formData.append('file', file);
    return request('/api/analyze_pdf', { method: 'POST', body: formData });
  },

  // Analyze AND persist: the paper lands in the library (SHA256-deduped)
  async ingestPdf(file) {
    const formData = new FormData();
    formData.append('file', file);
    return request('/api/papers', { method: 'POST', body: formData });
  },

  async healthCheck() {
    return request('/healthz');
  },

  getPapers({ projectId, limit = 50, offset = 0 } = {}) {
    const params = new URLSearchParams({ limit, offset });
    if (projectId != null) params.set('project_id', projectId);
    return request(`/api/papers?${params}`);
  },

  // Pages through the capped list endpoint until every paper is loaded.
  // Fine at this app's scale (10²–10³ papers); revisit if that changes.
  async getAllPapers({ projectId } = {}) {
    const pageSize = 200;
    const first = await this.getPapers({ projectId, limit: pageSize, offset: 0 });
    const items = [...first.items];
    while (items.length < first.total) {
      const page = await this.getPapers({ projectId, limit: pageSize, offset: items.length });
      if (page.items.length === 0) break;
      items.push(...page.items);
    }
    return { items, total: first.total };
  },

  getPaper(id) {
    return request(`/api/papers/${id}`);
  },

  getSimilarPapers(id, { topK = 5, projectId } = {}) {
    const params = new URLSearchParams({ top_k: topK });
    if (projectId != null) params.set('project_id', projectId);
    return request(`/api/papers/${id}/similar?${params}`);
  },

  getRelatedPapers(id, { limit = 10 } = {}) {
    return request(`/api/papers/${id}/related?limit=${limit}`);
  },

  getProjects() {
    return request('/api/projects');
  },

  getProject(id) {
    return request(`/api/projects/${id}`);
  },

  createProject(name, description = null) {
    return request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
  },

  addPaperToProject(projectId, paperId) {
    return request(`/api/projects/${projectId}/papers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paper_id: paperId }),
    });
  },

  removePaperFromProject(projectId, paperId) {
    return request(`/api/projects/${projectId}/papers/${paperId}`, { method: 'DELETE' });
  },
};
