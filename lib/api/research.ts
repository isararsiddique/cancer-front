import apiClient from './client';

export interface ResearcherSignup {
  email: string;
  full_name: string;
  password: string;
  affiliation: string;
  research_interests?: string | null;
}

export interface ResearchRequestCreate {
  researcher_name: string;
  researcher_email: string;
  researcher_affiliation?: string | null;
  purpose_of_study: string;
  icd11_main_code?: string | null;
  icd11_description?: string | null; // Can contain keywords for filtering (e.g., "colon", "breast")
  diagnosis_year_from?: number | null;
  diagnosis_year_to?: number | null;
  age_from?: number | null;
  age_to?: number | null;
  gender?: string | null;
  t_category?: string | null;
  n_category?: string | null;
  m_category?: string | null;
  icd11_morphology_code?: string | null;
  icd11_topography_code?: string | null;
  surgery_done?: boolean | null;
  chemotherapy_done?: boolean | null;
  radiotherapy_done?: boolean | null;
  hormonal_therapy?: boolean | null;
  immunotherapy?: boolean | null;
  recurrence?: boolean | null;
  metastasis?: boolean | null;
  vital_status?: string | null;
  treatment_intent?: string | null;
  manual_record_count?: number | null; // Manual override for estimated count
}

export interface ResearchRequest {
  id?: string;
  request_id: string;
  researcher_name: string;
  researcher_email: string;
  researcher_affiliation?: string;
  purpose_of_study: string;
  status: string;
  created_at: string;
  estimated_count?: number;
  estimated_record_count?: number;
  download_token?: string;
  download_link?: string;
  token_expires_at?: string;
  rejection_reason?: string;
  approved_at?: string;
  rejected_at?: string;
  filters?: any;
}

export interface ApprovalDecision {
  request_id: string;
  decision: 'APPROVE' | 'REJECT';
  rejection_reason?: string | null;
}

export interface DataStatistics {
  summary: {
    total_anonymized_patients: number;
    data_available: boolean;
  };
  statistics: {
    by_cancer_type?: Array<{
      icd11_main_code: string;
      description: string;
      patient_count: number;
    }>;
    by_year?: Array<{
      year: number;
      patient_count: number;
    }>;
    by_age_group?: Array<{
      age_group: string;
      patient_count: number;
    }>;
    by_gender?: Array<{
      gender: string;
      patient_count: number;
    }>;
  };
}

export const researchApi = {
  // Researcher signup
  signup: async (data: ResearcherSignup): Promise<any> => {
    const response = await apiClient.post('/api/v1/research/signup', data);
    return response.data;
  },

  // Get data statistics
  getStatistics: async (): Promise<DataStatistics> => {
    const response = await apiClient.get('/api/v1/research/data/statistics');
    return response.data;
  },

  // Get filter options (public - no auth required)
  getFilterOptions: async (): Promise<{
    cancer_types: Array<{ icd11_code: string; description: string; patient_count: number }>;
    years: Array<{ year: number; patient_count: number }>;
    total_patients: number;
  }> => {
    // Use fetch directly since this endpoint doesn't require auth
    const API_BASE = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')
      : 'http://127.0.0.1:8000';
    const response = await fetch(`${API_BASE}/api/v1/research/data/filter-options`);
    if (!response.ok) {
      throw new Error('Failed to fetch filter options');
    }
    return response.json();
  },

  // Preview data
  previewData: async (params?: { cancer_type?: string; year?: number }): Promise<any> => {
    const response = await apiClient.get('/api/v1/research/data/preview', { params });
    return response.data;
  },

  // Estimate record count
  estimateCount: async (filters: Partial<ResearchRequestCreate>): Promise<number> => {
    const response = await apiClient.post('/api/v1/research/estimate-count', filters);
    return response.data.estimated_count || 0;
  },

  // Create research request
  createRequest: async (data: ResearchRequestCreate): Promise<any> => {
    const response = await apiClient.post('/api/v1/research/request/create', data);
    return response.data;
  },

  // List my requests
  listMyRequests: async (): Promise<{
    requests: ResearchRequest[];
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> => {
    const response = await apiClient.get('/api/v1/research/requests/my');
    return response.data;
  },

  // Get request status
  getRequestStatus: async (requestId: string): Promise<any> => {
    const response = await apiClient.get(`/api/v1/research/request/status/${requestId}`);
    return response.data;
  },

  // Admin: List pending requests
  listPendingRequests: async (): Promise<{
    pending_requests: ResearchRequest[];
    approved_requests?: ResearchRequest[];
    rejected_requests?: ResearchRequest[];
  }> => {
    const response = await apiClient.get('/api/v1/research/admin/review');
    return response.data;
  },

  // Admin: Get request details
  getRequestDetails: async (requestId: string): Promise<ResearchRequest> => {
    const response = await apiClient.get(`/api/v1/research/admin/review/${requestId}`);
    return response.data;
  },

  // Admin: Approve or reject request
  approveOrReject: async (decision: ApprovalDecision): Promise<any> => {
    const response = await apiClient.post('/api/v1/research/admin/approve', decision);
    return response.data;
  },

  // Download research data
  downloadData: async (token: string): Promise<Blob> => {
    // Ensure token is properly encoded
    const cleanToken = token.trim();
    console.log('Download request - Token:', cleanToken.substring(0, 30) + '...', 'Length:', cleanToken.length);
    
    // Use axios directly to avoid auth interceptor for this public endpoint
    const axios = (await import('axios')).default;
    const API_BASE_URL = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')
      : 'http://127.0.0.1:8000';
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/research/download`, {
        params: { token: cleanToken },
        responseType: 'blob',
        // No auth header needed - this endpoint uses token parameter
      });
      return response.data;
    } catch (error: any) {
      // Preserve status code for better error handling
      if (error?.response) {
        const httpError = new Error(error.response.data?.detail || error.message || 'Download failed');
        (httpError as any).response = error.response;
        (httpError as any).status = error.response.status;
        throw httpError;
      }
      throw error;
    }
  },
};

