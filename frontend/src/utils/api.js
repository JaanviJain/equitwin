const API_BASE = 'http://localhost:8000/api';

// Helper function with NO timeout limit
async function apiRequest(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 900000); // 15 minutes
  
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('timeout of 900000ms exceeded');
    }
    throw error;
  }
}

export const uploadDataset = async (file, targetColumn = null) => {
  const formData = new FormData();
  formData.append('file', file);
  if (targetColumn) {
    formData.append('target_column', targetColumn);
  }
  
  return apiRequest('/upload', {
    method: 'POST',
    body: formData,
  });
};

export const startAnalysis = async (taskId, sensitiveColumns = [], epochs = 20) => {
  const params = new URLSearchParams();
  if (sensitiveColumns && sensitiveColumns.length > 0) {
    sensitiveColumns.forEach(col => params.append('sensitive_columns', col));
  }
  params.append('epochs', Math.min(epochs, 20).toString());
  
  return apiRequest(`/analyze/${taskId}?${params.toString()}`, {
    method: 'POST',
  });
};

export const getAnalysisStatus = async (taskId) => {
  return apiRequest(`/analysis/${taskId}`);
};

export const certifyModel = async (taskId, modelHash) => {
  re