const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) {
    // Default fallback: relative '/api' (for Vite proxy) or localhost
    return typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? '/api'
      : 'http://localhost:3000/api';
  }
  const trimmed = envUrl.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Helper to make HTTP requests with automatic auth headers and error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(url, config);
  } catch (err) {
    throw new Error(
      'Unable to connect to server. Please check that the backend is running on port 3000.'
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return null;
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (data && typeof data === 'object' && data.error) ||
      (typeof data === 'string' && data) ||
      `Request failed with status ${response.status}`;
    
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// Authentication API methods
export const authAPI = {
  async register(email, password) {
    return request('/auth/register', {
      method: 'POST',
      body: { email, password },
    });
  },

  async login(email, password) {
    return request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  async getMe() {
    return request('/auth/me', {
      method: 'GET',
    });
  },
};

// Tasks CRUD API methods
export const tasksAPI = {
  async getAll() {
    const data = await request('/tasks', { method: 'GET' });
    return data.tasks || [];
  },

  async getById(id) {
    const data = await request(`/tasks/${id}`, { method: 'GET' });
    return data.task;
  },

  async create({ title, description, completed }) {
    const data = await request('/tasks', {
      method: 'POST',
      body: { title, description: description || '', completed: Boolean(completed) },
    });
    return data.task;
  },

  async update(id, { title, description, completed }) {
    const data = await request(`/tasks/${id}`, {
      method: 'PUT',
      body: { title, description: description || '', completed: Boolean(completed) },
    });
    return data.task;
  },

  async patch(id, partialData) {
    const data = await request(`/tasks/${id}`, {
      method: 'PATCH',
      body: partialData,
    });
    return data.task;
  },

  async delete(id) {
    return request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};
