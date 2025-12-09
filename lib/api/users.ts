import apiClient from './client';

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name?: string | null;
  tenant_id?: string | null;
  organization_id?: string | null;
}

export const usersApi = {
  create: async (data: CreateUserRequest): Promise<any> => {
    const response = await apiClient.post('/api/v1/users/', data);
    return response.data;
  },
};

