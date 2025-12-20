const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const airaApi = {
  async analyzePdf(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(API_BASE + '/api/analyze_pdf', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Analysis failed');
    }
    
    return response.json();
  },
  
  async healthCheck() {
    const response = await fetch(API_BASE + '/healthz');
    return response.json();
  }
};

