export interface Patient {
  id?: string;
  patient_id?: string;
  patient_name: string;
  gender?: string;
  date_of_birth?: string;
  nationality?: string;
  address?: Record<string, any>;
  diagnosis_date: string;
  age_at_diagnosis?: number;
  icd11_main_code: string;
  icd11_description?: string;
  icd11_composite_expression?: string;
  icd11_topography_code?: string;
  icd11_topography?: string;
  icd11_morphology_code?: string;
  icd11_morphology?: string;
  icd11_behavior_code?: string;
  icd11_stage_code?: string;
  laterality?: string;
  t_category?: string;
  n_category?: string;
  m_category?: string;
  [key: string]: any;
}

export interface ICD11Code {
  code: string;
  title: string;
  uri?: string;
}

export interface ICD11Details {
  code: string;
  raw: any;
  parsed: {
    icd11_main_code?: string;
    icd11_description?: string;
    icd11_composite_expression?: string;
    icd11_topography_code?: string;
    icd11_topography?: string;
    icd11_morphology_code?: string;
    icd11_morphology?: string;
    icd11_behavior_code?: string;
    icd11_stage_code?: string;
    laterality?: string;
  };
  auto_fill_fields: any;
}

export interface ResearchRequest {
  id: string;
  request_id: string;
  researcher_name: string;
  researcher_email: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface ResearchStatistics {
  summary: {
    total_anonymized_patients: number;
    data_available: boolean;
  };
  statistics: {
    by_cancer_type: Array<{ cancer_type_code: string; patient_count: number }>;
    by_year: Array<{ year: number; patient_count: number }>;
    by_age_group: Array<{ age_group: string; patient_count: number }>;
  };
}

