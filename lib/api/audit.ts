import apiClient from './client';

export interface AuditLogFilter {
  action_type?: string;
  resource_type?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  limit?: number;
  skip?: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  user_roles?: string[];
  tenant_id?: string;
  tenant_name?: string;
  organization_id?: string;
  organization_name?: string;
  action_type: string;
  resource_type: string;
  resource_id?: string;
  resource_identifier?: string;
  change_summary: string;
  change_details?: Record<string, any>;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  session_id?: string;
  status: string;
  error_message?: string;
  error_code?: string;
  severity: string;
  category?: string;
  tags?: string[];
  retention_until?: string;
  compliance_flags?: string[];
  is_sensitive: boolean;
  created_at: string;
  checksum?: string;
}

export interface AuditLogListResponse {
  logs: AuditLog[];
  items?: AuditLog[]; // Alias for logs for backward compatibility
  total: number;
  skip: number;
  limit: number;
}

export interface AuditStatistics {
  total_logs: number;
  logs_by_action: Record<string, number>;
  logs_by_severity: Record<string, number>;
  logs_by_category: Record<string, number>;
  recent_activity: AuditLog[];
}

export const auditApi = {
  getAll: async (filters: AuditLogFilter = {}): Promise<AuditLogListResponse> => {
    console.log('🌐 [AUDIT API] getAll called with filters:', filters);
    const params = new URLSearchParams();
    // Always include skip and limit for pagination
    params.append('skip', (filters.skip || 0).toString());
    params.append('limit', (filters.limit || 100).toString());
    
    // Optional filters
    if (filters.action_type) params.append('action_type', filters.action_type);
    if (filters.resource_type) params.append('resource_type', filters.resource_type);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.search) params.append('search', filters.search);
    
    const url = `/api/v1/audit/logs?${params.toString()}`;
    console.log('🌐 [AUDIT API] Making GET request to:', url);
    
    try {
      const response = await apiClient.get(url);
      console.log('🌐 [AUDIT API] Response received:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataKeys: Object.keys(response.data || {})
      });
      
      const data = response.data;
      // Debug: Log the response structure
      console.log('📦 [AUDIT API] Response data:', { 
        hasLogs: !!data.logs, 
        logsLength: data.logs?.length, 
        total: data.total,
        skip: data.skip,
        limit: data.limit,
        dataKeys: Object.keys(data || {})
      });
      
      // Map 'logs' to 'items' for backward compatibility
      const result = {
        ...data,
        items: data.logs || data.items || [],
        logs: data.logs || data.items || [],
      };
      
      console.log('✅ [AUDIT API] Mapped result:', { 
        hasItems: !!result.items, 
        itemsLength: result.items?.length,
        hasLogs: !!result.logs,
        logsLength: result.logs?.length,
        total: result.total
      });
      
      return result;
    } catch (error: any) {
      console.error('❌ [AUDIT API] Error in getAll:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw error;
    }
  },

  getById: async (id: string): Promise<AuditLog> => {
    const response = await apiClient.get(`/api/v1/audit/logs/${id}`);
    return response.data;
  },

  getStatistics: async (): Promise<AuditStatistics> => {
    const response = await apiClient.get('/api/v1/audit/stats/summary');
    const data = response.data;
    // Map backend response to frontend format
    return {
      total_logs: data.total || 0,
      logs_by_action: data.by_action_type || {},
      logs_by_severity: data.by_severity || {},
      logs_by_category: {},
      recent_activity: [],
    };
  },

  export: async (filters: AuditLogFilter = {}): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters.action_type) params.append('action_type', filters.action_type);
    if (filters.resource_type) params.append('resource_type', filters.resource_type);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.search) params.append('search', filters.search);
    
    const response = await apiClient.get(`/api/v1/audit/logs/export/csv?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// Blockchain API removed - endpoints not available
export const blockchainApi = {
  getConfigs: async () => {
    throw new Error('Blockchain API not available');
  },
  getStatus: async () => {
    throw new Error('Blockchain API not available');
  },
  createConfig: async () => {
    throw new Error('Blockchain API not available');
  },
  updateConfig: async () => {
    throw new Error('Blockchain API not available');
  },
  testConnection: async () => {
    throw new Error('Blockchain API not available');
  },
  disable: async () => {
    throw new Error('Blockchain API not available');
  },
};
