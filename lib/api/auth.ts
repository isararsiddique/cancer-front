import apiClient from './client';

export interface LoginCredentials {
  username: string;
  password: string;
  dashboard_type?: 'hospital' | 'researcher';
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  roles: string[];
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    if (credentials.dashboard_type) {
      formData.append('dashboard_type', credentials.dashboard_type);
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      // Store dashboard type for validation
      if (credentials.dashboard_type) {
        localStorage.setItem('dashboard_type', credentials.dashboard_type);
      }
    }

    return data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (refreshToken) {
      try {
        await apiClient.post('/api/v1/auth/logout', { refresh_token: refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('dashboard_type');
    }
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/api/v1/auth/me');
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post('/api/v1/auth/refresh', {
      refresh_token: refreshToken,
    });

    const data = response.data;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
    }

    return data;
  },
};

