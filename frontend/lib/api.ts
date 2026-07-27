const API_BASE_URL = 'http://localhost:8000/api';

export const api = {
  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },
  
  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    });
  },

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },

  async request(endpoint: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vocalis_token') : null;
    
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      // Unauthorized, clear token and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vocalis_token');
        localStorage.removeItem('vocalis_user_email');
        window.dispatchEvent(new Event('auth-change'));
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'API request failed');
    }

    return response.json();
  }
};
