import apiClient from './client';

export interface Patient {
  id?: string;
  patient_id?: string | null;
  patient_name: string;
  gender?: string | null;
  date_of_birth?: string | null;
  nationality?: string | null;
  diagnosis_date: string;
  icd11_main_code: string;
  icd11_description?: string | null;
  icd11_composite_expression?: string | null;
  icd11_manifestation_code?: string | null;
  manifestation?: string | null;
  icd11_topography_code?: string | null;
  icd11_topography?: string | null;
  icd11_morphology_code?: string | null;
  icd11_morphology?: string | null;
  icd11_behavior_code?: string | null;
  icd11_stage_code?: string | null;
  laterality?: string | null;
  t_category?: string | null;
  n_category?: string | null;
  m_category?: string | null;
  multiple_primary_flag?: boolean | null;
  basis_of_diagnosis?: string | null;
  primary_site_confirmed?: boolean | null;
  surgery_done?: boolean | null;
  surgery_date?: string | null;
  chemotherapy_done?: boolean | null;
  chemo_start_date?: string | null;
  radiotherapy_done?: boolean | null;
  hormonal_therapy?: boolean | null;
  immunotherapy?: boolean | null;
  treatment_intent?: string | null;
  treatment_notes?: string | null;
  followup_date?: string | null;
  vital_status?: string | null;
  cause_of_death_icd11?: string | null;
  recurrence?: boolean | null;
  recurrence_date?: string | null;
  metastasis?: boolean | null;
  survival_months?: number | null;
  followup_notes?: string | null;
  data_source?: string | null;
  entry_mode?: string | null;
  validation_status?: string | null;
  entry_timestamp?: string;
  last_modified?: string;
}

export interface PatientCreate extends Partial<Patient> {
  patient_name: string;
  diagnosis_date: string;
  icd11_main_code: string;
}

export interface FollowupData {
  followup_date?: string;
  vital_status?: string;
  recurrence?: boolean;
  recurrence_date?: string;
  metastasis?: boolean;
  survival_months?: number;
  followup_notes?: string;
}

export interface PatientsListResponse {
  items: Patient[];
  total: number;
  skip: number;
  limit: number;
}

export interface AllPatientsResponse {
  count: number;
  total: number;
  skip: number;
  limit: number | null;
  items: Patient[];
}

export const patientsApi = {
  // Get all patients with pagination
  getAll: async (skip: number = 0, limit: number = 1000, search?: string, validation_status?: string): Promise<PatientsListResponse> => {
    const params = new URLSearchParams();
    params.append('skip', skip.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);
    if (validation_status) params.append('validation_status', validation_status);
    
    const response = await apiClient.get(`/api/v1/patients/?${params.toString()}`);
    return response.data;
  },

  // Get patient by UUID
  getById: async (patientUuid: string): Promise<Patient> => {
    const response = await apiClient.get(`/api/v1/patients/${patientUuid}`);
    return response.data;
  },

  // Create patient
  create: async (data: PatientCreate): Promise<Patient> => {
    const response = await apiClient.post('/api/v1/patients/', data);
    return response.data;
  },

  // Update patient
  update: async (patientUuid: string, data: Partial<PatientCreate>): Promise<Patient> => {
    const response = await apiClient.put(`/api/v1/patients/${patientUuid}`, data);
    return response.data;
  },

  // Add followup
  addFollowup: async (patientId: string, followupData: FollowupData): Promise<any> => {
    const response = await apiClient.post(`/api/v1/patients/${patientId}/followup`, followupData);
    return response.data;
  },


  // Get ALL patients with all fields
  getAllPatients: async (
    mode: 'all' | 'export' = 'all',
    search?: string,
    status?: string,
    skip: number = 0,
    limit?: number
  ): Promise<AllPatientsResponse | Patient[]> => {
    const params = new URLSearchParams();
    params.append('mode', mode);
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (mode === 'all') {
      params.append('skip', skip.toString());
      if (limit) params.append('limit', limit.toString());
    }
    
    const response = await apiClient.get(`/api/v1/patients/all?${params.toString()}`);
    return response.data;
  },

  // Export all patients as CSV (download)
  exportAllPatients: async (search?: string, status?: string): Promise<Blob> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    
    const response = await apiClient.get(`/api/v1/patients/all/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export patients as Excel (download)
  exportExcel: async (
    dateFrom?: string,
    dateTo?: string,
    search?: string,
    status?: string
  ): Promise<Blob> => {
    const params = new URLSearchParams();
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    
    const response = await apiClient.get(`/api/v1/patients/export/excel?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

