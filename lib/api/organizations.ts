import apiClient from './client';

export interface Organization {
  id: string;
  tenant_id?: string | null;
  name: string;
  code?: string | null;
  meta?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationCreate {
  tenant_id?: string;
  name: string;
  code?: string | null;
  meta?: Record<string, any>;
}

export interface OrganizationUpdate {
  name?: string;
  code?: string | null;
  meta?: Record<string, any>;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  meta?: Record<string, any>;
}

export const organizationsApi = {
  // Get all organizations
  getAll: async (): Promise<Organization[]> => {
    const response = await apiClient.get('/api/v1/organizations/');
    return response.data;
  },

  // Get organization by ID
  getById: async (id: string): Promise<Organization> => {
    const response = await apiClient.get(`/api/v1/organizations/${id}`);
    return response.data;
  },

  // Create organization
  create: async (data: OrganizationCreate): Promise<Organization> => {
    const response = await apiClient.post('/api/v1/organizations/', data);
    return response.data;
  },

  // Update organization
  update: async (id: string, data: OrganizationUpdate): Promise<Organization> => {
    const response = await apiClient.put(`/api/v1/organizations/${id}`, data);
    return response.data;
  },

  // Delete organization
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/organizations/${id}`);
  },

  // Get all tenants
  getTenants: async (): Promise<Tenant[]> => {
    const response = await apiClient.get('/api/v1/tenants/');
    return response.data;
  },
};

