import apiClient from './client';

export interface Role {
  id: string;
  name: string;
  slug: string;
  description?: string;
  tenant_scoped: boolean;
  user_count?: number;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface RoleCreate {
  name: string;
  slug: string;
  description?: string;
  tenant_scoped?: boolean;
  permission_ids?: string[];
}

export interface RoleUpdate {
  name?: string;
  description?: string;
  tenant_scoped?: boolean;
  permission_ids?: string[];
}

export const rolesApi = {
  // Get all roles
  getAll: async (): Promise<Role[]> => {
    const response = await apiClient.get('/api/v1/roles/');
    return response.data;
  },

  // Get role by ID
  getById: async (roleId: string): Promise<Role> => {
    const response = await apiClient.get(`/api/v1/roles/${roleId}`);
    return response.data;
  },

  // Create role
  create: async (data: RoleCreate): Promise<Role> => {
    const response = await apiClient.post('/api/v1/roles/', data);
    return response.data;
  },

  // Update role
  update: async (roleId: string, data: RoleUpdate): Promise<Role> => {
    const response = await apiClient.put(`/api/v1/roles/${roleId}`, data);
    return response.data;
  },

  // Delete role
  delete: async (roleId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/roles/${roleId}`);
  },

  // Get all permissions
  getPermissions: async (): Promise<Permission[]> => {
    const response = await apiClient.get('/api/v1/roles/permissions');
    return response.data;
  },
};

