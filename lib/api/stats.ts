import apiClient from './client';

export interface SystemStats {
  total_users?: number;
  total_organizations?: number;
  total_patients?: number;
  pending_requests?: number;
}

export const statsApi = {
  // Note: These endpoints may need to be created in backend
  // For now, we'll calculate from existing data
  getSystemStats: async (): Promise<SystemStats> => {
    // This would call a stats endpoint if it exists
    // For now, return empty stats
    return {
      total_users: 0,
      total_organizations: 0,
      total_patients: 0,
      pending_requests: 0,
    };
  },
};

