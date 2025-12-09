import apiClient from './client';

export interface TrainingRequest {
  research_request_id?: string | null;
  project_id?: string | null;
  algorithm: 'xgboost' | 'random_forest' | 'neural_network' | 'cnn';
  target_variable: string;
  features: string[];
  hyperparameters?: Record<string, any>;
  test_size?: number;
  random_state?: number;
  custom_pipeline?: string;
  dataset: Array<Record<string, any>>;
}

export interface TrainingResponse {
  training_id: string;
  status: 'queued' | 'training' | 'completed' | 'failed';
  message: string;
}

export interface TrainingStatus {
  training_id: string;
  status: 'queued' | 'training' | 'completed' | 'failed';
  algorithm: string;
  target_variable: string;
  created_at: string;
  metrics?: Record<string, any>;
  feature_importance?: Array<{ feature: string; importance: number }>;
  predictions?: Array<{ actual: number; predicted: number; probability?: number }>;
  resource_metrics?: Record<string, any>;
  error_message?: string;
}

export const mlTrainingApi = {
  // Start training on backend
  train: async (request: TrainingRequest): Promise<TrainingResponse> => {
    try {
      const response = await apiClient.post('/api/v1/ml-training/train', request);
      return response.data;
    } catch (error: any) {
      // Extract detailed error message from API response
      let errorMessage = 'Training request failed';
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  },

  // Get training status
  getStatus: async (trainingId: string): Promise<TrainingStatus> => {
    const response = await apiClient.get(`/api/v1/ml-training/train/${trainingId}`);
    return response.data;
  },

  // Save training result (for client-side training)
  save: async (result: any): Promise<any> => {
    const response = await apiClient.post('/api/v1/ml-training/save', result);
    return response.data;
  },

  // List training results
  list: async (params?: {
    research_request_id?: string;
    algorithm?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> => {
    const response = await apiClient.get('/api/v1/ml-training/list', { params });
    return response.data;
  },

  // Get training result by ID
  get: async (modelId: string): Promise<any> => {
    const response = await apiClient.get(`/api/v1/ml-training/${modelId}`);
    return response.data;
  },

  // Get training statistics
  getStats: async (): Promise<any> => {
    const response = await apiClient.get('/api/v1/ml-training/stats/summary');
    return response.data;
  },

  // Download model artifact
  downloadModel: async (modelId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/v1/ml-training/${modelId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

