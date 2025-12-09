import apiClient from './client';

export interface CodeExecutionRequest {
  code: string;
  dataset_token?: string;
}

export interface CodeExecutionResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  execution_time: number;
  timeout: boolean;
  error?: string | null;
  visualizations?: string[] | null;
  metrics?: Record<string, any> | null;
}

export interface SandboxStatusResponse {
  available: boolean;
  image_name: string;
  timeout_seconds: number;
  memory_limit: string;
  cpu_limit: number;
  message?: string | null;
}

export interface LibraryInfo {
  name: string;
  version: string;
  description: string;
}

export interface LibrariesResponse {
  python_version: string;
  libraries: LibraryInfo[];
  resource_limits: {
    timeout_seconds: number;
    memory_limit: string;
    cpu_cores: number;
    network_access: boolean;
  };
  security: {
    network_isolation: boolean;
    non_root_user: boolean;
    read_only_filesystem: boolean;
  };
}

export const mlExecuteApi = {
  // Execute Python code in sandbox
  executeCode: async (request: CodeExecutionRequest): Promise<CodeExecutionResponse> => {
    const response = await apiClient.post('/api/v1/ml/execute', request);
    return response.data;
  },

  // Get sandbox status
  getStatus: async (): Promise<SandboxStatusResponse> => {
    const response = await apiClient.get('/api/v1/ml/status');
    return response.data;
  },

  // Get available libraries
  getLibraries: async (): Promise<LibrariesResponse> => {
    const response = await apiClient.get('/api/v1/ml/libraries');
    return response.data;
  },
};
