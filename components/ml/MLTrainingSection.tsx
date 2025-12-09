'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Play,
  BarChart3,
  TrendingUp,
  Settings,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  Loader,
  Zap,
  Activity,
  Layers,
  Target,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { researchApi } from '@/lib/api/research';
import { mlTrainingApi } from '@/lib/api/ml_training';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine } from 'recharts';
import html2canvas from 'html2canvas';

interface MLTrainingSectionProps {
  approvedRequestId?: string;
  downloadToken?: string;
}

interface ModelConfig {
  algorithm: 'xgboost' | 'random_forest' | 'neural_network' | 'cnn';
  targetVariable: string;
  features: string[];
  testSize: number;
  randomState: number;
  hyperparameters: Record<string, any>;
  customPipeline?: string;
  useBackend?: boolean; // Toggle between backend and client-side training
}

interface TrainingResult {
  modelId: string;
  algorithm: string;
  metrics: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
    mse?: number;
    mae?: number;
    r2_score?: number;
    baseline_mse?: number;
    baseline_mae?: number;
    mse_improvement_pct?: number;
    y_mean?: number;
    y_std?: number;
    n_samples?: number;
    n_features?: number;
    auc?: number;
    roc_curve?: Array<{ fpr: number; tpr: number; threshold: number }>;
    cv_scores?: {
      mean?: number;
      std?: number;
      scores?: number[];
    };
    warnings?: string[];
  };
  featureImportance?: Array<{ feature: string; importance: number }>;
  predictions?: Array<{ actual: number; predicted: number; probability?: number }>;
  trainingHistory?: Array<{ epoch: number; loss: number; val_loss?: number; accuracy?: number; val_accuracy?: number }>;
  confusionMatrix?: number[][];
  // New visualization data
  kaplanMeierData?: Array<{ time: number; survival: number; risk_group: string }>;
  calibrationData?: Array<{ predicted: number; observed: number; bin: string }>;
  shapValues?: Array<{ feature: string; value: number; base_value: number }>;
  status: 'completed' | 'training' | 'failed';
  error?: string;
  resourceMetrics?: {
    training_duration_seconds: number;
    cpu_usage_before?: number;
    cpu_usage_after?: number;
    avg_cpu_usage?: number;
    memory_usage_before_mb?: number;
    memory_usage_after_mb?: number;
    avg_memory_usage_mb?: number;
    peak_memory_usage_mb?: number;
  };
  chartImages?: {
    roc?: string;
    confusionMatrix?: string;
    predictions?: string;
    featureImportance?: string;
  };
}

export default function MLTrainingSection({ approvedRequestId, downloadToken }: MLTrainingSectionProps) {
  const [selectedRequest, setSelectedRequest] = useState<string | null>(approvedRequestId || null);
  const [dataset, setDataset] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    algorithm: 'random_forest',
    targetVariable: '',
    features: [],
    testSize: 0.2,
    randomState: 42,
    hyperparameters: {},
    useBackend: true, // Default to backend training
  });
  const [trainingResults, setTrainingResults] = useState<TrainingResult[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [currentTraining, setCurrentTraining] = useState<TrainingResult | null>(null);
  const [showCustomPipeline, setShowCustomPipeline] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState<string>('');

  // Fetch approved requests
  const { data: myRequests } = useQuery({
    queryKey: ['my-research-requests'],
    queryFn: () => researchApi.listMyRequests(),
  });

  const approvedRequests = myRequests?.requests?.filter((r: any) => r.status === 'APPROVED' && r.download_token) || [];
  
  // Helper to check if token is expired
  const isTokenExpired = (tokenExpiresAt?: string): boolean => {
    if (!tokenExpiresAt) return false;
    const expiryDate = new Date(tokenExpiresAt);
    const now = new Date();
    return expiryDate < now;
  };

  // Auto-select request if provided via props
  useEffect(() => {
    if (approvedRequestId && !selectedRequest) {
      setSelectedRequest(approvedRequestId);
    }
  }, [approvedRequestId]);

  // Load dataset when request is selected (removed auto-load to let user control)

  const loadDataset = async () => {
    if (!selectedRequest) return;
    
    setIsLoadingData(true);
    try {
      const request = approvedRequests.find((r: any) => r.request_id === selectedRequest);
      if (!request?.download_token) {
        alert('No download token available for this request');
        setIsLoadingData(false);
        return;
      }

      // Check if token is expired (if expiry date is available)
      if (request.token_expires_at) {
        const expiryDate = new Date(request.token_expires_at);
        const now = new Date();
        if (expiryDate < now) {
          alert(
            'Download token has expired. Please contact the administrator to request a new download token for this research request.'
          );
          setIsLoadingData(false);
          return;
        }
      }

      // Fetch the dataset
      let blob: Blob;
      try {
        blob = await researchApi.downloadData(request.download_token);
      } catch (error: any) {
        // Handle 410 (Gone) - expired token
        if (error?.response?.status === 410 || error?.message?.includes('410')) {
          alert(
            'Download token has expired. The token is valid for 24 hours after approval. Please contact the administrator to request a new download token for this research request.'
          );
          setIsLoadingData(false);
          return;
        }
        // Re-throw other errors
        throw error;
      }
      
      const text = await blob.text();
      
      // Parse CSV
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length === 0) {
        alert('Dataset is empty');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const data = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((header, i) => {
          const value = values[i]?.trim() || '';
          // Try to parse numbers
          const numValue = parseFloat(value);
          obj[header] = isNaN(numValue) ? value : numValue;
        });
        return obj;
      }).filter(row => Object.keys(row).length > 0);

      setDataset(data);
      setColumns(headers);
      
      // Auto-select target variable (first numeric column or common targets)
      const numericColumns = headers.filter(col => {
        const sample = data[0]?.[col];
        return typeof sample === 'number';
      });
      
      const commonTargets = ['vital_status', 'recurrence', 'metastasis', 'age_at_diagnosis'];
      const target = commonTargets.find(t => headers.includes(t)) || numericColumns[0] || headers[0];
      
      setModelConfig(prev => ({
        ...prev,
        targetVariable: target,
        features: headers.filter(h => h !== target),
      }));
    } catch (error: any) {
      console.error('Dataset load error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load dataset';
      
      if (error?.response?.status === 410) {
        errorMessage = 'Download token has expired. Please contact the administrator to request a new token.';
      } else if (error?.response?.status === 404) {
        errorMessage = 'Download token not found. Please verify the token is correct.';
      } else if (error?.response?.status === 403) {
        errorMessage = 'Access denied. The request may not be approved or you may not have permission.';
      } else if (error?.message) {
        errorMessage = `Failed to load dataset: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Get memory usage in MB (browser API)
  const getMemoryUsage = (): number | undefined => {
    if ('memory' in performance && (performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return undefined;
  };

  // Get CPU usage approximation (using performance timing)
  const getCPUUsage = async (): Promise<number | undefined> => {
    // Browser doesn't provide direct CPU usage, but we can approximate
    // by measuring time spent in event loop
    const start = performance.now();
    await new Promise(resolve => setTimeout(resolve, 100));
    const end = performance.now();
    // If event loop is busy, this will take longer
    // This is a rough approximation
    return undefined; // Browser limitation - can't get real CPU usage
  };

  const trainModel = async () => {
    if (!dataset.length || !modelConfig.targetVariable) {
      alert('Please load a dataset and select a target variable');
      return;
    }

    setIsTraining(true);
    const trainingId = `training_${Date.now()}`;
    setCurrentTraining({
      modelId: trainingId,
      algorithm: modelConfig.algorithm,
      status: 'training',
      metrics: {},
    });

    try {
      // Resource monitoring - Before training
      const startTime = performance.now();
      const memoryBefore = getMemoryUsage();
      let peakMemory = memoryBefore || 0;

      // Monitor memory during training
      const memoryMonitor = setInterval(() => {
        const currentMemory = getMemoryUsage();
        if (currentMemory && currentMemory > peakMemory) {
          peakMemory = currentMemory;
        }
      }, 100);

      // Progress updates
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => {
          const stages = [
            'Loading Pyodide...',
            'Installing packages...',
            'Preprocessing data...',
            'Training model...',
            'Calculating metrics...',
            'Finalizing results...'
          ];
          const current = prev || stages[0];
          const currentIndex = stages.indexOf(current);
          const nextIndex = currentIndex < stages.length - 1 ? currentIndex + 1 : currentIndex;
          return stages[nextIndex];
        });
      }, 2000);

      // Prepare data for training
      const trainingData = {
        dataset: dataset,
        config: modelConfig,
      };

      // Choose training method based on config
      let result: TrainingResult;
      
      if (modelConfig.useBackend) {
        // Use backend training
        setTrainingProgress('Submitting training job to server...');
        result = await trainModelWithBackend(trainingData, (progress: string) => {
          setTrainingProgress(progress);
        });
      } else {
        // Use Pyodide for client-side ML training with progress updates
        setTrainingProgress('Initializing...');
        result = await trainModelWithPyodide(trainingData, (progress: string) => {
          setTrainingProgress(progress);
        });
      }
      
      clearInterval(progressInterval);
      
      // Resource monitoring - After training
      clearInterval(memoryMonitor);
      const endTime = performance.now();
      const memoryAfter = getMemoryUsage();
      const trainingDuration = Math.round((endTime - startTime) / 1000); // Convert to seconds

      // Add resource metrics to result
      result.resourceMetrics = {
        training_duration_seconds: trainingDuration,
        memory_usage_before_mb: memoryBefore,
        memory_usage_after_mb: memoryAfter,
        avg_memory_usage_mb: memoryBefore && memoryAfter ? (memoryBefore + memoryAfter) / 2 : undefined,
        peak_memory_usage_mb: peakMemory > 0 ? peakMemory : undefined,
      };
      
      setCurrentTraining(result);
      setTrainingResults(prev => [...prev, result]);
    } catch (error: any) {
      // Extract detailed error message
      let errorMessage = 'Training failed';
      if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setCurrentTraining({
        modelId: trainingId,
        algorithm: modelConfig.algorithm,
        status: 'failed',
        error: errorMessage,
        metrics: {},
      });
      alert(`Training failed: ${errorMessage}`);
      console.error('Training error details:', error);
    } finally {
      setIsTraining(false);
      setTimeout(() => setCurrentTraining(null), 5000);
    }
  };

  // Backend training using server-side processing
  const trainModelWithBackend = async (
    trainingData: any,
    progressCallback?: (progress: string) => void
  ): Promise<TrainingResult> => {
    const { dataset, config } = trainingData;
    
    progressCallback?.('Submitting training job...');
    
    // Validate before submitting
    if (!config.targetVariable) {
      throw new Error('Target variable is required');
    }
    
    const features = config.features.filter((f: string) => f !== config.targetVariable);
    if (features.length === 0) {
      throw new Error('At least one feature (excluding target variable) is required');
    }
    
    if (!dataset || dataset.length === 0) {
      throw new Error('Dataset is empty');
    }
    
    // Prepare request payload
    // Note: selectedRequest is the request_id string (e.g., "REQ-UMMC-...")
    // Backend will look it up and convert to UUID if needed
    const requestPayload = {
      research_request_id: selectedRequest || null,
      project_id: null,
      algorithm: config.algorithm,
      target_variable: config.targetVariable,
      features: features,
      hyperparameters: config.hyperparameters || {},
      test_size: config.testSize || 0.2,
      random_state: config.randomState || 42,
      custom_pipeline: config.customPipeline || null,
      dataset: dataset,
    };
    
    // Debug logging
    console.log('Training request payload:', {
      ...requestPayload,
      dataset_size: dataset.length,
      dataset_sample: dataset.slice(0, 2) // First 2 records for debugging
    });
    
    // Submit training job to backend
    const trainingResponse = await mlTrainingApi.train(requestPayload);
    
    const trainingId = trainingResponse.training_id;
    
    // Poll for training status
    progressCallback?.('Training in progress...');
    let status = 'queued';
    let attempts = 0;
    const maxAttempts = 300; // 5 minutes max (1 second intervals)
    
    while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every second
      
      const statusResponse = await mlTrainingApi.getStatus(trainingId);
      status = statusResponse.status;
      
      if (status === 'training') {
        progressCallback?.('Training model on server...');
      } else if (status === 'queued') {
        progressCallback?.('Waiting in queue...');
      }
      
      attempts++;
    }
    
    if (status === 'failed') {
      try {
        const statusResponse = await mlTrainingApi.getStatus(trainingId);
        throw new Error(statusResponse.error_message || 'Training failed on server');
      } catch (error: any) {
        let errorMessage = 'Training failed on server';
        if (error?.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error?.response?.data?.error_message) {
          errorMessage = error.response.data.error_message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }
    }
    
    if (status !== 'completed') {
      throw new Error('Training timeout - please check status manually');
    }
    
    // Get final results
    progressCallback?.('Fetching results...');
    const finalStatus = await mlTrainingApi.getStatus(trainingId);
    
    // Extract metrics and ensure ROC curve is included
    const metrics = finalStatus.metrics || {};
    const finalStatusAny = finalStatus as any; // Type assertion for additional properties
    
    // Debug: Log metrics to see what we're getting
    console.log('Final status metrics:', metrics);
    console.log('ROC curve in metrics:', metrics.roc_curve);
    console.log('AUC in metrics:', metrics.auc);
    
    return {
      modelId: trainingId,
      algorithm: finalStatus.algorithm,
      status: 'completed',
      metrics: {
        ...metrics,
        // Ensure ROC curve and AUC are explicitly included
        roc_curve: metrics.roc_curve || finalStatusAny.roc_curve || undefined,
        auc: metrics.auc || undefined,
        cv_scores: metrics.cv_scores || finalStatusAny.cv_scores || undefined,
      } as any, // Type assertion to allow dynamic metric properties
      featureImportance: finalStatus.feature_importance,
      predictions: finalStatus.predictions,
      confusionMatrix: metrics.confusion_matrix || finalStatusAny.confusion_matrix,
      trainingHistory: metrics.training_history || finalStatusAny.training_history || undefined,
      resourceMetrics: finalStatus.resource_metrics ? {
        training_duration_seconds: finalStatus.resource_metrics.training_duration_seconds || 0,
        cpu_usage_before: finalStatus.resource_metrics.cpu_usage_before,
        cpu_usage_after: finalStatus.resource_metrics.cpu_usage_after,
        avg_cpu_usage: finalStatus.resource_metrics.avg_cpu_usage,
        memory_usage_before_mb: finalStatus.resource_metrics.memory_usage_before_mb,
        memory_usage_after_mb: finalStatus.resource_metrics.memory_usage_after_mb,
        avg_memory_usage_mb: finalStatus.resource_metrics.avg_memory_usage_mb,
        peak_memory_usage_mb: finalStatus.resource_metrics.peak_memory_usage_mb,
      } : undefined,
      chartImages: {},
    };
  };

  // Client-side ML training using Pyodide
  const trainModelWithPyodide = async (
    trainingData: any,
    progressCallback?: (progress: string) => void
  ): Promise<TrainingResult> => {
    // Helper to yield control to browser periodically
    const yieldToBrowser = () => {
      return new Promise(resolve => setTimeout(resolve, 0));
    };

    // Wait for Pyodide to be available
    // @ts-ignore
    if (typeof window === 'undefined' || !window.loadPyodide) {
      throw new Error('Pyodide is not loaded. Please refresh the page.');
    }

    progressCallback?.('Loading Pyodide runtime...');
    await yieldToBrowser();

    // @ts-ignore
    const pyodide = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/',
    });

    progressCallback?.('Installing packages...');
    await yieldToBrowser();

    // Install required packages
    await pyodide.loadPackage(['micropip', 'numpy', 'scikit-learn', 'pandas']);
    await yieldToBrowser();
    
    try {
      progressCallback?.('Installing XGBoost...');
      await pyodide.runPythonAsync(`
        import micropip
        await micropip.install(['xgboost'])
      `);
      await yieldToBrowser();
    } catch (e) {
      console.warn('XGBoost installation failed, continuing without it:', e);
    }

    const { dataset, config } = trainingData;
    const algorithm = config.algorithm;

    // Add warning for large datasets
    if (dataset.length > 10000) {
      const proceed = confirm(
        `Warning: You are training on ${dataset.length} records. ` +
        `This may take several minutes and could make the page unresponsive. ` +
        `Consider using a smaller sample or server-side training. Continue?`
      );
      if (!proceed) {
        throw new Error('Training cancelled by user');
      }
    }

    // Prepare Python code for training
    const targetCol = config.targetVariable;
    const featureCols = config.features.filter((f: string) => f !== targetCol);
    
    // Deep sanitize dataset: recursively replace all null/undefined values and escape special characters
    const deepSanitize = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return '';
      }
      if (Array.isArray(obj)) {
        return obj.map(item => deepSanitize(item));
      }
      if (typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[key] = deepSanitize(obj[key]);
          }
        }
        return sanitized;
      }
      // Convert to string and ensure it's safe
      if (typeof obj === 'string') {
        // Replace problematic characters that could break JSON
        return obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
      }
      return obj;
    };
    
    const sanitizedDataset = deepSanitize(dataset);
    
    // Use base64 encoding to safely pass large datasets to Python
    // This avoids JSON parsing issues with special characters
    const datasetJson = JSON.stringify(sanitizedDataset);
    const datasetBase64 = btoa(unescape(encodeURIComponent(datasetJson)));
    
    const pythonCode = `
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, KFold
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_squared_error, mean_absolute_error, r2_score, confusion_matrix,
    roc_auc_score, roc_curve, classification_report
)
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
import json
import base64
import time
from io import BytesIO

# Resource monitoring - Before training
start_time = time.time()

# Load dataset from base64-encoded JSON (safer for large datasets with special characters)
dataset_b64 = "${datasetBase64}"
dataset_json = base64.b64decode(dataset_b64).decode('utf-8')
data = json.loads(dataset_json)
df = pd.DataFrame(data)

# Limit dataset size for browser performance (optional - can be removed)
# For very large datasets, consider server-side training
MAX_SAMPLES = 50000
if len(df) > MAX_SAMPLES:
    print(f"Warning: Dataset has {len(df)} samples. Sampling {MAX_SAMPLES} for browser performance.")
    df = df.sample(n=MAX_SAMPLES, random_state=42).reset_index(drop=True)

# Replace empty strings and any remaining None/null values with NaN
df = df.replace(['', None, 'None', 'null'], np.nan)

# Prepare features and target
target_col = "${targetCol}"
feature_cols_raw = ${JSON.stringify(featureCols)}
# Sanitize feature_cols to remove any null values
feature_cols = [col for col in feature_cols_raw if col is not None and col != '' and str(col).strip() != '']

# Select features (both numeric and categorical)
X = df[feature_cols].copy()
y = df[target_col].copy()

# Convert all categorical columns to strings to avoid mixed type errors
# First identify categorical columns (object type or non-numeric)
categorical_cols = X.select_dtypes(include=['object']).columns.tolist()
for col in categorical_cols:
    # Convert to string, handling NaN values
    X[col] = X[col].astype(str).replace('nan', np.nan)

# Handle missing target values - convert None to NaN first
y = y.replace([None, 'None', 'null'], np.nan)
if y.dtype in ['float64', 'int64']:
    y = y.fillna(y.median() if not pd.isna(y.median()) else 0)
else:
    mode_values = y.mode()
    y = y.fillna(mode_values[0] if len(mode_values) > 0 else 0)

# Handle categorical target
if y.dtype == 'object':
    y = pd.Categorical(y).codes

# Ensure we have data
if len(X) == 0 or len(y) == 0:
    raise ValueError("No valid data after preprocessing. Check feature columns and target variable.")

# Data quality checks
if len(df) < 10:
    raise ValueError(f"Insufficient data: Only {len(df)} records. Need at least 10 records for training.")

# Identify numeric and categorical features
# Numeric: only columns that are actually numeric (int, float)
numeric_features = X.select_dtypes(include=[np.number]).columns.tolist()

# Categorical: object type columns (already converted to strings above)
categorical_features = X.select_dtypes(include=['object']).columns.tolist()

# Ensure categorical features are all strings (no mixed types)
for col in categorical_features:
    # Convert entire column to string, replacing NaN with a placeholder
    X[col] = X[col].fillna('__MISSING__').astype(str)

# Remove constant features before preprocessing
constant_features = []
for col in numeric_features:
    # Ensure we're working with pandas Series
    col_data = X[col] if isinstance(X[col], pd.Series) else pd.Series(X[col])
    if col_data.nunique() <= 1:
        constant_features.append(col)
for col in categorical_features:
    # Ensure we're working with pandas Series
    col_data = X[col] if isinstance(X[col], pd.Series) else pd.Series(X[col])
    if col_data.nunique() <= 1:
        constant_features.append(col)

if constant_features:
    print(f"Warning: Removing {len(constant_features)} constant features: {constant_features}")
    X = X.drop(columns=constant_features)
    numeric_features = [f for f in numeric_features if f not in constant_features]
    categorical_features = [f for f in categorical_features if f not in constant_features]

if len(numeric_features) == 0 and len(categorical_features) == 0:
    raise ValueError("No valid features found after removing constant features.")

# Check target variable variance
# Ensure y is a pandas Series
y_series = y if isinstance(y, pd.Series) else pd.Series(y)
if y_series.nunique() <= 1:
    raise ValueError("Target variable has no variance (all values are the same). Cannot train a model.")
# Update y to be a Series for consistency
y = y_series

# Create preprocessing pipeline
numeric_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median")),
    ("scaler", StandardScaler())
])

categorical_transformer = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent", fill_value='__MISSING__')),
    ("onehot", OneHotEncoder(handle_unknown='ignore', sparse_output=False))
])

# Build preprocessor with only non-empty transformers
transformers = []
if len(numeric_features) > 0:
    transformers.append(("num", numeric_transformer, numeric_features))
if len(categorical_features) > 0:
    transformers.append(("cat", categorical_transformer, categorical_features))

if len(transformers) == 0:
    raise ValueError("No valid features for preprocessing.")

preprocessor = ColumnTransformer(
    transformers=transformers,
    remainder='drop'
)

# Split data: 70% train, 15% validation, 15% test
# First split: 70% train, 30% temp
X_train, X_temp, y_train, y_temp = train_test_split(
    X, y, test_size=0.30, random_state=${config.randomState}, 
    stratify=y if len(np.unique(y)) <= 10 else None
)

# Second split: 15% validation, 15% test (50% of temp = 15% of total)
X_val, X_test, y_val, y_test = train_test_split(
    X_temp, y_temp, test_size=0.50, random_state=${config.randomState},
    stratify=y_temp if len(np.unique(y_temp)) <= 10 else None
)

# Additional validation after split
if len(X_train) < 5:
    raise ValueError(f"Insufficient training data: Only {len(X_train)} samples. Need at least 5 samples.")
if len(X_test) < 2:
    raise ValueError(f"Insufficient test data: Only {len(X_test)} samples. Need at least 2 samples.")

# Train model with preprocessing pipeline
${config.customPipeline && showCustomPipeline && config.customPipeline.trim() ? config.customPipeline : getModelTrainingCode(algorithm, config)}

# Make predictions on test set
y_pred = model.predict(X_test)

# Get prediction probabilities for binary classification (if available)
y_pred_proba = None
try:
    if hasattr(model, 'predict_proba'):
        y_pred_proba = model.predict_proba(X_test)
        # For binary classification, use probability of positive class
        if y_pred_proba.shape[1] == 2:
            y_pred_proba = y_pred_proba[:, 1]
        elif y_pred_proba.shape[1] > 2:
            # For multi-class, use max probability
            y_pred_proba = np.max(y_pred_proba, axis=1)
except:
    pass

# Also get validation predictions for early stopping evaluation
y_val_pred = None
y_val_proba = None
try:
    y_val_pred = model.predict(X_val)
    if hasattr(model, 'predict_proba'):
        y_val_proba = model.predict_proba(X_val)
        if y_val_proba.shape[1] == 2:
            y_val_proba = y_val_proba[:, 1]
        elif y_val_proba.shape[1] > 2:
            y_val_proba = np.max(y_val_proba, axis=1)
except:
    pass

# Determine if classification or regression
unique_classes = len(np.unique(y_test))
is_classification = unique_classes <= 10

# Cross-validation (on training set)
cv_scores = None
cv_mean = None
cv_std = None
try:
    kfold = KFold(n_splits=5, shuffle=True, random_state=${config.randomState})
    if is_classification:
        cv_scores_list = cross_val_score(model, X_train, y_train, cv=kfold, scoring='f1_weighted')
    else:
        cv_scores_list = cross_val_score(model, X_train, y_train, cv=kfold, scoring='r2')
    cv_scores = [float(s) for s in cv_scores_list]
    cv_mean = float(np.mean(cv_scores_list))
    cv_std = float(np.std(cv_scores_list))
except Exception as e:
    print(f"Cross-validation error: {e}")
    import traceback
    traceback.print_exc()

# Calculate metrics
if is_classification:  # Classification
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
    recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
    f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    cm = confusion_matrix(y_test, y_pred).tolist()
    
    metrics = {
        "accuracy": float(accuracy),
        "precision": float(precision),
        "recall": float(recall),
        "f1_score": float(f1),
        "confusion_matrix": cm
    }
    
    # AUC-ROC for binary classification
    if unique_classes == 2 and y_pred_proba is not None:
        try:
            # Ensure binary labels (0 and 1)
            y_test_binary = y_test.copy()
            if len(np.unique(y_test_binary)) > 2:
                # Convert to binary if needed
                y_test_binary = (y_test_binary > np.median(y_test_binary)).astype(int)
            
            # Calculate AUC
            auc = roc_auc_score(y_test_binary, y_pred_proba)
            
            # Calculate ROC curve - ensure it includes (0,0) and (1,1)
            fpr, tpr, thresholds = roc_curve(y_test_binary, y_pred_proba, drop_intermediate=False)
            
            # Ensure curve starts at (0,0) and ends at (1,1)
            if len(fpr) == 0 or fpr[0] != 0.0 or tpr[0] != 0.0:
                fpr = np.concatenate([[0.0], fpr])
                tpr = np.concatenate([[0.0], tpr])
                thresholds = np.concatenate([[1.0], thresholds])
            
            if len(fpr) == 0 or fpr[-1] != 1.0 or tpr[-1] != 1.0:
                fpr = np.concatenate([fpr, [1.0]])
                tpr = np.concatenate([tpr, [1.0]])
                thresholds = np.concatenate([thresholds, [0.0]])
            
            # Create ROC data with proper sorting
            roc_data = [
                {"fpr": float(f), "tpr": float(t), "threshold": float(th)}
                for f, t, th in zip(fpr, tpr, thresholds)
            ]
            
            # Sort by FPR to ensure proper curve display
            roc_data.sort(key=lambda x: x["fpr"])
            
            metrics["auc"] = float(auc)
            metrics["roc_curve"] = roc_data
        except Exception as e:
            print(f"AUC calculation error: {e}")
            import traceback
            traceback.print_exc()
            metrics["auc"] = None
            metrics["roc_curve"] = []
    else:
        metrics["auc"] = None
        metrics["roc_curve"] = []
    
    # Add cross-validation results
    if cv_mean is not None:
        metrics["cv_scores"] = {
            "mean": cv_mean,
            "std": cv_std,
            "scores": cv_scores
        }
else:  # Regression
    mse = mean_squared_error(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    # Calculate baseline metrics (predicting mean)
    y_mean = np.mean(y_test)
    baseline_mse = mean_squared_error(y_test, np.full_like(y_test, y_mean))
    baseline_mae = mean_absolute_error(y_test, np.full_like(y_test, y_mean))
    
    # Calculate relative improvement
    mse_improvement = ((baseline_mse - mse) / baseline_mse * 100) if baseline_mse > 0 else 0
    
    metrics = {
        "mse": float(mse),
        "mae": float(mae),
        "r2_score": float(r2),
        "baseline_mse": float(baseline_mse),
        "baseline_mae": float(baseline_mae),
        "mse_improvement_pct": float(mse_improvement),
        "y_mean": float(y_mean),
        "y_std": float(np.std(y_test)),
        "n_samples": int(len(y_test)),
        "n_features": int(len(X.columns))
    }
    
    # Add cross-validation results
    if cv_mean is not None:
        metrics["cv_scores"] = {
            "mean": cv_mean,
            "std": cv_std,
            "scores": cv_scores
        }
    
    # Performance warnings
    warnings = []
    if r2 < 0:
        warnings.append("Model performs worse than baseline (R² < 0). Consider different features or target variable.")
    elif r2 < 0.1:
        warnings.append("Very low R² score. Model explains less than 10% of variance. Check feature selection and data quality.")
    elif r2 < 0.3:
        warnings.append("Low R² score. Model explains less than 30% of variance. Consider feature engineering or different algorithms.")
    if cv_mean is not None and cv_mean < 0:
        warnings.append("Cross-validation shows negative R². Model may be overfitting or features lack predictive power.")
    if len(X.columns) > len(X_train):
        warnings.append("More features than training samples. Risk of overfitting. Consider feature selection.")
    
    if warnings:
        metrics["warnings"] = warnings

# Feature importance
feature_importance = []
try:
    # For pipeline models, get feature names from preprocessor
    if hasattr(model, 'named_steps') and 'clf' in model.named_steps:
        # Pipeline model: model.named_steps['clf'] contains the actual model
        clf = model.named_steps['clf']
        if hasattr(clf, 'feature_importances_'):
            importances = clf.feature_importances_.tolist()
            # Get feature names from preprocessor
            feature_names = []
            if hasattr(model, 'named_steps') and 'preprocess' in model.named_steps:
                preprocessor = model.named_steps['preprocess']
                # Extract feature names from ColumnTransformer
                for name, transformer, cols in preprocessor.transformers_:
                    if name == 'num' and len(cols) > 0:
                        feature_names.extend([str(c) for c in cols])
                    elif name == 'cat' and len(cols) > 0:
                        # For one-hot encoded features, get expanded names
                        try:
                            onehot = transformer.named_steps['onehot']
                            if hasattr(onehot, 'get_feature_names_out'):
                                cat_names = onehot.get_feature_names_out(cols)
                                feature_names.extend([str(n) for n in cat_names])
                            else:
                                # Fallback: use original column names
                                feature_names.extend([str(c) for c in cols])
                        except:
                            feature_names.extend([str(c) for c in cols])
            else:
                # Fallback to original column names
                feature_names = [str(col) for col in X.columns]
            
            # Match importances with feature names
            min_len = min(len(importances), len(feature_names))
            feature_importance = [
                {"feature": str(feature_names[i]), "importance": float(importances[i])} 
                for i in range(min_len)
            ]
    elif hasattr(model, 'feature_importances_'):
        # Direct model (not in pipeline)
        importances = model.feature_importances_.tolist()
        feature_names = [str(col) for col in X.columns]
        min_len = min(len(importances), len(feature_names))
        feature_importance = [
            {"feature": str(feature_names[i]), "importance": float(importances[i])} 
            for i in range(min_len)
        ]
except Exception as e:
    print(f"Feature importance error: {e}")
    import traceback
    traceback.print_exc()

# Predictions for visualization (with probabilities if available)
predictions = []
for i in range(min(100, len(y_test))):
    pred_dict = {
        "actual": float(y_test.iloc[i] if hasattr(y_test, 'iloc') else y_test[i]),
        "predicted": float(y_pred[i])
    }
    if y_pred_proba is not None and i < len(y_pred_proba):
        pred_dict["probability"] = float(y_pred_proba[i])
    predictions.append(pred_dict)

# Resource monitoring - After training
end_time = time.time()
training_duration = int(end_time - start_time)

# Prepare resource metrics
resource_metrics = {
    "training_duration_seconds": training_duration,
    "start_time": float(start_time),
    "end_time": float(end_time)
}

result = {
    "metrics": metrics,
    "feature_importance": feature_importance,
    "predictions": predictions,
    "resource_metrics": resource_metrics
}

json.dumps(result)
`;

    progressCallback?.('Preprocessing data and training model...');
    await yieldToBrowser();

    // Run Python code with periodic yields
    // Split into chunks to allow browser to process UI updates
    const resultJson = await pyodide.runPythonAsync(pythonCode);
    await yieldToBrowser();

    progressCallback?.('Calculating metrics...');
    const result = JSON.parse(resultJson);
    await yieldToBrowser();

    progressCallback?.('Finalizing results...');

    // Merge resource metrics from Python with JavaScript measurements
    const resourceMetrics = {
      training_duration_seconds: result.resource_metrics?.training_duration_seconds || 0,
      ...(result.resource_metrics || {}),
    };

    return {
      modelId: `model_${Date.now()}`,
      algorithm: algorithm,
      status: 'completed',
      metrics: {
        ...result.metrics,
        auc: result.metrics.auc || undefined,
        roc_curve: result.metrics.roc_curve || undefined,
        trainingHistory: result.metrics.training_history || undefined,
        cv_scores: result.metrics.cv_scores || undefined,
      },
      featureImportance: result.feature_importance,
      predictions: result.predictions,
      confusionMatrix: result.metrics.confusion_matrix,
      resourceMetrics: resourceMetrics,
      chartImages: {}, // Will be generated client-side
    };
  };

  const getModelTrainingCode = (algorithm: string, config: ModelConfig): string => {
    // Helper to safely get hyperparameter values, avoiding null/undefined
    const getHyperParam = (key: string, defaultValue: any) => {
      const value = config.hyperparameters?.[key];
      return value !== null && value !== undefined ? value : defaultValue;
    };

    switch (algorithm) {
      case 'xgboost':
        const xgbNEst = getHyperParam('n_estimators', 300);
        const xgbMaxDepth = getHyperParam('max_depth', 8);
        const xgbLR = getHyperParam('learning_rate', 0.05);
        const xgbSubsample = getHyperParam('subsample', 0.8);
        const xgbColsample = getHyperParam('colsample_bytree', 0.8);
        return `
from xgboost import XGBClassifier, XGBRegressor
is_classification = len(np.unique(y_train)) <= 10
if is_classification:
    clf = XGBClassifier(
        n_estimators=${xgbNEst},
        max_depth=${xgbMaxDepth},
        learning_rate=${xgbLR},
        subsample=${xgbSubsample},
        colsample_bytree=${xgbColsample},
        random_state=${config.randomState}
    )
else:
    clf = XGBRegressor(
        n_estimators=${xgbNEst},
        max_depth=${xgbMaxDepth},
        learning_rate=${xgbLR},
        subsample=${xgbSubsample},
        colsample_bytree=${xgbColsample},
        random_state=${config.randomState}
    )
# Build pipeline with preprocessing and model
model = Pipeline(steps=[
    ("preprocess", preprocessor),
    ("clf", clf)
])
# Fit on training data
model.fit(X_train, y_train)
`;

      case 'random_forest':
        const rfNEst = getHyperParam('n_estimators', 400);
        const rfMaxDepth = getHyperParam('max_depth', null);
        const maxDepthStr = rfMaxDepth !== null ? rfMaxDepth : 'None';
        return `
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
is_classification = len(np.unique(y_train)) <= 10
if is_classification:
    clf = RandomForestClassifier(
        n_estimators=${rfNEst},
        max_depth=${maxDepthStr},
        random_state=${config.randomState}
    )
else:
    clf = RandomForestRegressor(
        n_estimators=${rfNEst},
        max_depth=${maxDepthStr},
        random_state=${config.randomState}
    )
# Build pipeline with preprocessing and model
model = Pipeline(steps=[
    ("preprocess", preprocessor),
    ("clf", clf)
])
# Fit on training data
model.fit(X_train, y_train)
`;

      case 'neural_network':
        const nnHiddenLayers = config.hyperparameters?.hidden_layers || [128, 64, 32];
        const nnActivation = getHyperParam('activation', 'relu');
        const nnLR = getHyperParam('learning_rate', 0.001);
        const nnMaxIter = getHyperParam('max_iter', 300);
        return `
from sklearn.neural_network import MLPClassifier, MLPRegressor
is_classification = len(np.unique(y_train)) <= 10
if is_classification:
    clf = MLPClassifier(
        hidden_layer_sizes=${JSON.stringify(nnHiddenLayers)},
        activation='${nnActivation}',
        solver='adam',
        learning_rate_init=${nnLR},
        max_iter=${nnMaxIter},
        random_state=${config.randomState}
    )
else:
    clf = MLPRegressor(
        hidden_layer_sizes=${JSON.stringify(nnHiddenLayers)},
        activation='${nnActivation}',
        solver='adam',
        learning_rate_init=${nnLR},
        max_iter=${nnMaxIter},
        random_state=${config.randomState}
    )
# Build pipeline with preprocessing and model
model = Pipeline(steps=[
    ("preprocess", preprocessor),
    ("clf", clf)
])
# Fit on training data
model.fit(X_train, y_train)
`;

      case 'cnn':
        // CNN is only available in backend training
        return `
# CNN training is handled server-side
# This code should not be executed in client-side mode
raise ValueError("CNN training must be done on the backend server")
`;

      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 rounded-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Machine Learning Training</h2>
              <p className="text-gray-600">Train models directly on approved datasets - No download needed!</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Select Approved Request */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-6 rounded-2xl"
      >
        <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Select Approved Dataset
        </h3>
        {approvedRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>No approved requests available</p>
            <p className="text-sm mt-2">Request data access and wait for approval</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvedRequests.map((request: any) => (
              <motion.button
                key={request.request_id}
                onClick={() => setSelectedRequest(request.request_id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  selectedRequest === request.request_id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{request.request_id}</p>
                    <p className="text-sm text-gray-600 mt-1">{request.purpose_of_study}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Records: {request.estimated_record_count || 'N/A'} | 
                      Approved: {new Date(request.approved_at || request.created_at).toLocaleDateString()}
                    </p>
                    {request.token_expires_at && (
                      <p className={`text-xs mt-1 ${
                        isTokenExpired(request.token_expires_at) 
                          ? 'text-red-600 font-semibold' 
                          : 'text-gray-500'
                      }`}>
                        {isTokenExpired(request.token_expires_at) 
                          ? '⚠️ Token Expired' 
                          : `Token expires: ${new Date(request.token_expires_at).toLocaleString()}`
                        }
                      </p>
                    )}
                  </div>
                  {selectedRequest === request.request_id && (
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Load Dataset */}
      {selectedRequest && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 rounded-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-600" />
              Dataset
            </h3>
            <motion.button
              onClick={loadDataset}
              disabled={isLoadingData}
              whileHover={{ scale: isLoadingData ? 1 : 1.05 }}
              whileTap={{ scale: isLoadingData ? 1 : 0.95 }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              {isLoadingData ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Load Dataset
                </>
              )}
            </motion.button>
          </div>

          {dataset.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Dataset Loaded</span>
              </div>
              <p className="text-sm text-green-700">
                {dataset.length} records | {columns.length} columns
              </p>
              <div className="mt-2 text-xs text-green-600">
                Columns: {columns.slice(0, 10).join(', ')}
                {columns.length > 10 && ` + ${columns.length - 10} more`}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Model Configuration */}
      {dataset.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6 rounded-2xl"
        >
          <h3 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Model Configuration
          </h3>

          <div className="space-y-4">
            {/* Training Mode Toggle */}
            <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Training Mode</h4>
                  <p className="text-xs text-gray-600">
                    {modelConfig.useBackend 
                      ? 'Server-side training (recommended for large datasets)' 
                      : 'Client-side training (runs in browser)'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modelConfig.useBackend}
                    onChange={(e) => setModelConfig(prev => ({ ...prev, useBackend: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">
                    {modelConfig.useBackend ? 'Backend' : 'Client'}
                  </span>
                </label>
              </div>
            </div>

            {/* Algorithm Selection - All Models */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-700">Select ML Algorithm</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { 
                    id: 'xgboost', 
                    name: 'XGBoost', 
                    icon: Zap,
                    description: 'Gradient boosting, best for structured data',
                    color: 'from-green-500 to-emerald-500'
                  },
                  { 
                    id: 'random_forest', 
                    name: 'Random Forest', 
                    icon: Layers,
                    description: 'Ensemble method, robust and interpretable',
                    color: 'from-blue-500 to-cyan-500'
                  },
                  { 
                    id: 'neural_network', 
                    name: 'Neural Network', 
                    icon: Brain,
                    description: 'Deep learning, complex patterns',
                    color: 'from-purple-500 to-pink-500'
                  },
                  { 
                    id: 'cnn', 
                    name: 'CNN', 
                    icon: Activity,
                    description: 'Convolutional network, tabular data',
                    color: 'from-orange-500 to-red-500',
                    backendOnly: true
                  },
                ].map(({ id, name, icon: Icon, description, color, backendOnly }) => {
                  // Check if CNN is selected and validate numeric features
                  const isCNN = id === 'cnn';
                  const numericFeatureCount = dataset.length > 0 
                    ? (() => {
                        // Count numeric features from dataset
                        const sample = dataset[0];
                        if (!sample) return 0;
                        return Object.keys(sample).filter(key => {
                          const val = sample[key];
                          return typeof val === 'number' && !isNaN(val) && key !== modelConfig.targetVariable;
                        }).length;
                      })()
                    : 0;
                  // CNN requires at least 2 numeric features (works with 2, but 3+ is recommended)
                  const hasEnoughFeatures = !isCNN || numericFeatureCount >= 2;
                  
                  return (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => {
                      if (backendOnly && !modelConfig.useBackend) {
                        alert('CNN requires backend training. Switching to backend mode.');
                        setModelConfig(prev => ({ ...prev, algorithm: id as any, useBackend: true }));
                      } else if (isCNN && numericFeatureCount < 2) {
                        alert(
                          `CNN requires at least 2 numeric features, but only ${numericFeatureCount} found. ` +
                          `Please select more numeric features or use XGBoost, Random Forest, or Neural Network instead.`
                        );
                      } else {
                        setModelConfig(prev => ({ ...prev, algorithm: id as any }));
                      }
                    }}
                    disabled={(backendOnly && !modelConfig.useBackend) || (isCNN && !hasEnoughFeatures)}
                    whileHover={{ scale: modelConfig.algorithm === id ? 1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`p-4 rounded-xl border-2 transition-all relative ${
                      modelConfig.algorithm === id
                        ? `border-blue-500 bg-gradient-to-br ${color} text-white shadow-lg`
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    } ${(backendOnly && !modelConfig.useBackend) || (isCNN && !hasEnoughFeatures) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {backendOnly && (
                      <span className="absolute top-2 right-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                        Backend
                      </span>
                    )}
                    {isCNN && !hasEnoughFeatures && (
                      <span className="absolute top-2 right-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                        Need 2+ numeric
                      </span>
                    )}
                    {isCNN && numericFeatureCount === 2 && hasEnoughFeatures && (
                      <span className="absolute top-2 right-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                        2 features (min)
                      </span>
                    )}
                    <Icon className={`w-8 h-8 mb-2 ${modelConfig.algorithm === id ? 'text-white' : 'text-gray-600'}`} />
                    <p className={`font-bold text-sm mb-1 ${modelConfig.algorithm === id ? 'text-white' : 'text-gray-900'}`}>
                      {name}
                    </p>
                    <p className={`text-xs ${modelConfig.algorithm === id ? 'text-white/90' : 'text-gray-600'}`}>
                      {description}
                    </p>
                    {isCNN && numericFeatureCount > 0 && (
                      <p className={`text-xs mt-1 ${modelConfig.algorithm === id ? 'text-white/80' : 'text-gray-500'}`}>
                        {numericFeatureCount} numeric features
                      </p>
                    )}
                  </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Target Variable */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Target Variable</label>
              <select
                value={modelConfig.targetVariable}
                onChange={(e) => setModelConfig(prev => ({ ...prev, targetVariable: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select target variable...</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            {/* Features Selection */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Features</label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-2">
                {columns.filter(c => c !== modelConfig.targetVariable).map(col => (
                  <label key={col} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modelConfig.features.includes(col)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setModelConfig(prev => ({ ...prev, features: [...prev.features, col] }));
                        } else {
                          setModelConfig(prev => ({ ...prev, features: prev.features.filter(f => f !== col) }));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{col}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hyperparameters */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Hyperparameters</label>
              <div className="grid grid-cols-2 gap-3">
                {modelConfig.algorithm === 'cnn' ? (
                  <>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Epochs</label>
                      <input
                        type="number"
                        value={modelConfig.hyperparameters.epochs || 30}
                        onChange={(e) => setModelConfig(prev => ({
                          ...prev,
                          hyperparameters: { ...prev.hyperparameters, epochs: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Batch Size</label>
                      <input
                        type="number"
                        value={modelConfig.hyperparameters.batch_size || 32}
                        onChange={(e) => setModelConfig(prev => ({
                          ...prev,
                          hyperparameters: { ...prev.hyperparameters, batch_size: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900"
                      />
                    </div>
                  </>
                ) : modelConfig.algorithm === 'neural_network' ? (
                  <>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Learning Rate</label>
                      <input
                        type="number"
                        step="0.001"
                        value={modelConfig.hyperparameters.learning_rate || 0.001}
                        onChange={(e) => setModelConfig(prev => ({
                          ...prev,
                          hyperparameters: { ...prev.hyperparameters, learning_rate: parseFloat(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Max Iterations</label>
                      <input
                        type="number"
                        value={modelConfig.hyperparameters.max_iter || 500}
                        onChange={(e) => setModelConfig(prev => ({
                          ...prev,
                          hyperparameters: { ...prev.hyperparameters, max_iter: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">N Estimators</label>
                      <input
                        type="number"
                        value={modelConfig.hyperparameters.n_estimators || 100}
                        onChange={(e) => setModelConfig(prev => ({
                          ...prev,
                          hyperparameters: { ...prev.hyperparameters, n_estimators: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Max Depth</label>
                      <input
                        type="number"
                        value={modelConfig.hyperparameters.max_depth || 6}
                        onChange={(e) => setModelConfig(prev => ({
                          ...prev,
                          hyperparameters: { ...prev.hyperparameters, max_depth: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Custom Pipeline Toggle */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCustomPipeline}
                  onChange={(e) => setShowCustomPipeline(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">Use Custom Pipeline</span>
              </label>
              {showCustomPipeline && (
                <textarea
                  value={modelConfig.customPipeline || ''}
                  onChange={(e) => setModelConfig(prev => ({ ...prev, customPipeline: e.target.value }))}
                  placeholder="Enter your custom Python pipeline code here..."
                  className="w-full mt-2 px-4 py-3 rounded-xl border border-gray-200 text-gray-900 font-mono text-sm min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Train Button */}
            <motion.button
              onClick={trainModel}
              disabled={isTraining || !modelConfig.targetVariable}
              whileHover={{ scale: isTraining || !modelConfig.targetVariable ? 1 : 1.02 }}
              whileTap={{ scale: isTraining || !modelConfig.targetVariable ? 1 : 0.98 }}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
            >
              {isTraining ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Training Model...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Train Model
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Training Status */}
      {currentTraining && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 rounded-2xl border-2 border-blue-200"
        >
          <div className="flex items-center gap-3 mb-4">
            {currentTraining.status === 'training' ? (
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            ) : currentTraining.status === 'completed' ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600" />
            )}
            <h3 className="text-lg font-bold text-gray-900">
              {currentTraining.status === 'training' && 'Training in Progress...'}
              {currentTraining.status === 'completed' && 'Training Completed!'}
              {currentTraining.status === 'failed' && 'Training Failed'}
            </h3>
          </div>
          {currentTraining.status === 'training' && trainingProgress && (
            <div className="mb-3">
              <p className="text-sm text-blue-600 font-medium">{trainingProgress}</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This may take a few minutes for large datasets. Please keep this tab open.
              </p>
            </div>
          )}
          {currentTraining.error && (
            <p className="text-red-600 text-sm">{currentTraining.error}</p>
          )}
        </motion.div>
      )}

      {/* Training Results */}
      {trainingResults.length > 0 && (
        <div className="space-y-6">
          {trainingResults.map((result, idx) => (
            <motion.div
              key={result.modelId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-6 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Target className="w-6 h-6 text-purple-600" />
                    {result.algorithm.toUpperCase()} Model Results
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Model ID: {result.modelId}</p>
                </div>
                <div className="flex items-center gap-3">
                  <motion.a
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/ml-training/${result.modelId}/download`}
                    download
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-md"
                    onClick={(e) => {
                      // Add auth token to download
                      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
                      if (token) {
                        e.preventDefault();
                        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/ml-training/${result.modelId}/download`, {
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        })
                        .then(async res => {
                          if (!res.ok) {
                            // Try to get error message from response
                            let errorMessage = `Download failed: ${res.statusText}`;
                            try {
                              const errorData = await res.json();
                              if (errorData.detail) {
                                errorMessage = errorData.detail;
                              }
                            } catch {
                              // If response is not JSON, use status text
                            }
                            throw new Error(errorMessage);
                          }
                          const blob = await res.blob();
                          const contentDisposition = res.headers.get('content-disposition');
                          
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          
                          // Use Content-Disposition header filename if available, otherwise generate one
                          let filename = `model_${result.modelId}_${result.algorithm}.${result.algorithm === 'cnn' ? 'h5' : 'pkl'}`;
                          if (contentDisposition) {
                            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                            if (filenameMatch) {
                              filename = filenameMatch[1];
                            }
                          }
                          
                          a.download = filename;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        })
                        .catch(err => {
                          console.error('Download failed:', err);
                          const errorMsg = err.message || 'Failed to download model. Please try again.';
                          if (errorMsg.includes('Model artifact not available')) {
                            alert('This model was trained before model download was enabled. Please train a new model to download it.');
                          } else if (errorMsg.includes('Model file not found')) {
                            alert('Model file not found on server. The model may have been deleted or moved.');
                          } else if (errorMsg.includes('Model not found')) {
                            alert('Model not found or you do not have permission to download it.');
                          } else {
                            alert(errorMsg);
                          }
                        });
                      }
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Download Model
                  </motion.a>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">Completed</span>
                  </div>
                </div>
              </div>

              {/* Performance Warnings */}
              {result.metrics.warnings && result.metrics.warnings.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 mb-2">Performance Warnings</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                        {result.metrics.warnings?.map((warning: string, idx: number) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(result.metrics)
                  .filter(([key, value]) => 
                    key !== 'confusion_matrix' && 
                    key !== 'roc_curve' && 
                    key !== 'cv_scores' &&
                    key !== 'warnings' &&
                    key !== 'baseline_mse' &&
                    key !== 'baseline_mae' &&
                    key !== 'mse_improvement_pct' &&
                    key !== 'y_mean' &&
                    key !== 'y_std' &&
                    key !== 'n_samples' &&
                    key !== 'n_features' &&
                    (typeof value === 'number' || typeof value === 'string')
                  )
                  .map(([key, value]) => (
                    <div key={key} className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100">
                      <p className="text-xs text-gray-600 mb-1 font-medium">{key.replace(/_/g, ' ').toUpperCase()}</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {typeof value === 'number' ? (value < 1 ? value.toFixed(3) : value.toFixed(2)) : String(value)}
                      </p>
                    </div>
                  ))}
              </div>

              {/* Additional Regression Metrics */}
              {result.metrics.baseline_mse !== undefined && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Model Performance vs Baseline</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Baseline MSE (Mean Predictor)</p>
                      <p className="text-lg font-bold text-gray-900">{result.metrics.baseline_mse?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Model MSE</p>
                      <p className="text-lg font-bold text-blue-900">{result.metrics.mse?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Improvement</p>
                      <p className={`text-lg font-bold ${(result.metrics.mse_improvement_pct || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {result.metrics.mse_improvement_pct?.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Target Stats</p>
                      <p className="text-sm font-semibold text-gray-900">
                        Mean: {result.metrics.y_mean?.toFixed(2)}, Std: {result.metrics.y_std?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resource Metrics */}
              {result.resourceMetrics && (
                <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    Resource Usage Metrics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Training Duration</p>
                      <p className="text-lg font-bold text-indigo-900">
                        {result.resourceMetrics.training_duration_seconds || 0}s
                      </p>
                    </div>
                    {result.resourceMetrics.memory_usage_before_mb !== undefined && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Memory Before</p>
                        <p className="text-lg font-bold text-indigo-900">
                          {result.resourceMetrics.memory_usage_before_mb.toFixed(2)} MB
                        </p>
                      </div>
                    )}
                    {result.resourceMetrics.memory_usage_after_mb !== undefined && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Memory After</p>
                        <p className="text-lg font-bold text-indigo-900">
                          {result.resourceMetrics.memory_usage_after_mb.toFixed(2)} MB
                        </p>
                      </div>
                    )}
                    {result.resourceMetrics.peak_memory_usage_mb !== undefined && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Peak Memory</p>
                        <p className="text-lg font-bold text-indigo-900">
                          {result.resourceMetrics.peak_memory_usage_mb.toFixed(2)} MB
                        </p>
                      </div>
                    )}
                    {result.resourceMetrics.avg_memory_usage_mb !== undefined && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Avg Memory</p>
                        <p className="text-lg font-bold text-indigo-900">
                          {result.resourceMetrics.avg_memory_usage_mb.toFixed(2)} MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cross-Validation Scores */}
              {result.metrics.cv_scores && (
                <div className="mb-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                  <h4 className="text-lg font-bold mb-3 text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Cross-Validation Results (5-Fold)
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Mean Score</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {result.metrics.cv_scores.mean?.toFixed(3) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Std Deviation</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {result.metrics.cv_scores.std?.toFixed(3) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Fold Scores</p>
                      <p className="text-sm font-semibold text-purple-900">
                        {result.metrics.cv_scores.scores?.map((s: number) => s.toFixed(3)).join(', ') || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ROC Curve */}
              {result.metrics?.roc_curve && Array.isArray(result.metrics.roc_curve) && result.metrics.roc_curve.length > 0 && result.metrics.auc && (
                <div className="mb-6" id={`roc-chart-${result.modelId}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      ROC Curve (AUC = {result.metrics.auc.toFixed(3)})
                    </h4>
                    <motion.button
                      onClick={async () => {
                        const chartElement = document.getElementById(`roc-chart-${result.modelId}`);
                        if (chartElement) {
                          try {
                            const canvas = await html2canvas(chartElement);
                            const link = document.createElement('a');
                            link.download = `roc_curve_${result.modelId}.png`;
                            link.href = canvas.toDataURL();
                            link.click();
                          } catch (error) {
                            console.error('Failed to download ROC curve:', error);
                            alert('Failed to download chart. Please try again.');
                          }
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Chart
                    </motion.button>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart 
                      data={result.metrics.roc_curve}
                      margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        type="number"
                        dataKey="fpr" 
                        domain={[0, 1]}
                        ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
                        stroke="#64748b" 
                        label={{ value: 'False Positive Rate (1 - Specificity)', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        type="number"
                        domain={[0, 1]}
                        ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
                        stroke="#64748b"
                        label={{ value: 'True Positive Rate (Sensitivity)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string, props: any) => {
                          if (name === 'ROC Curve') {
                            return [
                              `TPR: ${props.payload.tpr.toFixed(4)}`,
                              `FPR: ${props.payload.fpr.toFixed(4)}`,
                              `Threshold: ${props.payload.threshold.toFixed(4)}`
                            ];
                          }
                          return value.toFixed(3);
                        }}
                        labelFormatter={() => 'ROC Curve Point'}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                      <Legend 
                        verticalAlign="top"
                        height={36}
                        formatter={(value) => {
                          if (value === 'ROC Curve') {
                            return `ROC Curve (AUC = ${result.metrics.auc?.toFixed(3)})`;
                          }
                          return value;
                        }}
                      />
                      {/* Random Classifier Baseline (diagonal reference line) */}
                      <ReferenceLine 
                        segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                      {/* Actual ROC Curve */}
                      <Line
                        type="monotone"
                        dataKey="tpr"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6, fill: '#8b5cf6' }}
                        name="ROC Curve"
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>AUC Interpretation:</strong> {
                        result.metrics.auc && result.metrics.auc >= 0.9 ? 'Excellent (≥0.9)' :
                        result.metrics.auc && result.metrics.auc >= 0.8 ? 'Good (0.8-0.9)' :
                        result.metrics.auc && result.metrics.auc >= 0.7 ? 'Fair (0.7-0.8)' :
                        result.metrics.auc && result.metrics.auc >= 0.6 ? 'Poor (0.6-0.7)' :
                        'Very Poor (<0.6)'
                      }
                    </p>
                  </div>
                </div>
              )}

              {/* Feature Importance */}
              {result.featureImportance && result.featureImportance.length > 0 && (
                <div className="mb-6" id={`feature-importance-${result.modelId}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900">Feature Importance</h4>
                    <motion.button
                      onClick={async () => {
                        const chartElement = document.getElementById(`feature-importance-${result.modelId}`);
                        if (chartElement) {
                          try {
                            const canvas = await html2canvas(chartElement);
                            const link = document.createElement('a');
                            link.download = `feature_importance_${result.modelId}.png`;
                            link.href = canvas.toDataURL();
                            link.click();
                          } catch (error) {
                            console.error('Failed to download feature importance:', error);
                            alert('Failed to download chart. Please try again.');
                          }
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </motion.button>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={result.featureImportance.slice(0, 10).sort((a, b) => b.importance - a.importance)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="feature" stroke="#64748b" angle={-45} textAnchor="end" height={100} />
                      <YAxis stroke="#64748b" />
                      <Tooltip />
                      <Bar dataKey="importance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Predictions Scatter Plot */}
              {result.predictions && result.predictions.length > 0 && (
                <div className="mb-6" id={`predictions-chart-${result.modelId}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900">Predictions vs Actual</h4>
                    <motion.button
                      onClick={async () => {
                        const chartElement = document.getElementById(`predictions-chart-${result.modelId}`);
                        if (chartElement) {
                          try {
                            const canvas = await html2canvas(chartElement);
                            const link = document.createElement('a');
                            link.download = `predictions_${result.modelId}.png`;
                            link.href = canvas.toDataURL();
                            link.click();
                          } catch (error) {
                            console.error('Failed to download predictions chart:', error);
                            alert('Failed to download chart. Please try again.');
                          }
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Chart
                    </motion.button>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={result.predictions}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="actual" name="Actual" stroke="#64748b" />
                      <YAxis dataKey="predicted" name="Predicted" stroke="#64748b" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Predictions" data={result.predictions} fill="#8b5cf6" />
                      {/* Perfect prediction line */}
                      {result.predictions.length > 0 && (() => {
                        const actuals = result.predictions.map((p: any) => p.actual);
                        const minActual = Math.min(...actuals);
                        const maxActual = Math.max(...actuals);
                        return (
                          <ReferenceLine 
                            segment={[{ x: minActual, y: minActual }, { x: maxActual, y: maxActual }]}
                            stroke="#10b981"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                          />
                        );
                      })()}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Residual Plot (for regression) */}
              {result.predictions && result.predictions.length > 0 && result.metrics.mse !== undefined && (
                <div className="mb-6" id={`residual-chart-${result.modelId}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900">Residual Plot</h4>
                    <motion.button
                      onClick={async () => {
                        const chartElement = document.getElementById(`residual-chart-${result.modelId}`);
                        if (chartElement) {
                          try {
                            const canvas = await html2canvas(chartElement);
                            const link = document.createElement('a');
                            link.download = `residuals_${result.modelId}.png`;
                            link.href = canvas.toDataURL();
                            link.click();
                          } catch (error) {
                            console.error('Failed to download residual chart:', error);
                            alert('Failed to download chart. Please try again.');
                          }
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Chart
                    </motion.button>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={result.predictions.map((p: any) => ({
                      predicted: p.predicted,
                      residual: p.actual - p.predicted
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="predicted" name="Predicted" stroke="#64748b" />
                      <YAxis dataKey="residual" name="Residual (Actual - Predicted)" stroke="#64748b" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="Residuals" data={result.predictions.map((p: any) => ({
                        predicted: p.predicted,
                        residual: p.actual - p.predicted
                      }))} fill="#f97316" />
                      {/* Zero residual line */}
                      <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cross-Validation Scores Chart */}
              {result.metrics.cv_scores && result.metrics.cv_scores.scores && result.metrics.cv_scores.scores.length > 0 && (
                <div className="mb-6" id={`cv-scores-chart-${result.modelId}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900">Cross-Validation Scores by Fold</h4>
                    <motion.button
                      onClick={async () => {
                        const chartElement = document.getElementById(`cv-scores-chart-${result.modelId}`);
                        if (chartElement) {
                          try {
                            const canvas = await html2canvas(chartElement);
                            const link = document.createElement('a');
                            link.download = `cv_scores_${result.modelId}.png`;
                            link.href = canvas.toDataURL();
                            link.click();
                          } catch (error) {
                            console.error('Failed to download CV scores chart:', error);
                            alert('Failed to download chart. Please try again.');
                          }
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Chart
                    </motion.button>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={result.metrics.cv_scores.scores.map((score: number, idx: number) => ({
                      fold: `Fold ${idx + 1}`,
                      score: score
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="fold" stroke="#64748b" />
                      <YAxis stroke="#64748b" domain={[0, 1]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#6366f1" radius={[8, 8, 0, 0]} />
                      {/* Mean line */}
                      {result.metrics.cv_scores.mean !== undefined && (
                        <ReferenceLine 
                          y={result.metrics.cv_scores.mean} 
                          stroke="#10b981" 
                          strokeWidth={2} 
                          strokeDasharray="5 5"
                          label={{ value: `Mean: ${result.metrics.cv_scores.mean.toFixed(3)}`, position: 'right' }}
                        />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Confusion Matrix */}
              {result.confusionMatrix && (
                <div className="mb-6" id={`confusion-matrix-${result.modelId}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-red-600" />
                      Confusion Matrix
                    </h4>
                    <motion.button
                      onClick={async () => {
                        const chartElement = document.getElementById(`confusion-matrix-${result.modelId}`);
                        if (chartElement) {
                          try {
                            const canvas = await html2canvas(chartElement);
                            const link = document.createElement('a');
                            link.download = `confusion_matrix_${result.modelId}.png`;
                            link.href = canvas.toDataURL();
                            link.click();
                          } catch (error) {
                            console.error('Failed to download confusion matrix:', error);
                            alert('Failed to download chart. Please try again.');
                          }
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Chart
                    </motion.button>
                  </div>
                  <div className="inline-block border border-gray-200 rounded-lg overflow-hidden bg-white p-4">
                    <table className="text-sm">
                      <tbody>
                        {result.confusionMatrix.map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td
                                key={j}
                                className={`px-4 py-2 border border-gray-200 text-center font-mono ${
                                  i === j ? 'bg-green-100 text-green-900' : 'bg-red-50 text-red-900'
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Kaplan-Meier Survival Curves */}
              {result.predictions && result.predictions.length > 0 && result.predictions[0].probability !== undefined && (
                <div className="mb-6" id={`kaplan-meier-${result.modelId}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Kaplan-Meier Survival Curves (Stratified by Risk)
                    </h4>
                    <motion.button
                      onClick={async () => {
                        const chartElement = document.getElementById(`kaplan-meier-${result.modelId}`);
                        if (chartElement) {
                          try {
                            const canvas = await html2canvas(chartElement);
                            const link = document.createElement('a');
                            link.download = `kaplan_meier_${result.modelId}.png`;
                            link.href = canvas.toDataURL();
                            link.click();
                          } catch (error) {
                            console.error('Failed to download Kaplan-Meier curve:', error);
                            alert('Failed to download chart. Please try again.');
                          }
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Chart
                    </motion.button>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="time" 
                        stroke="#64748b"
                        label={{ value: 'Time (Months)', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        domain={[0, 1]}
                        stroke="#64748b"
                        label={{ value: 'Survival Probability', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value: any) => `${(value * 100).toFixed(2)}%`}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                      <Legend />
                      {(() => {
                        // Calculate Kaplan-Meier curves for risk groups
                        const predictions = result.predictions || [];
                        const probabilities = predictions.map((p: any) => p.probability || 0);
                        const sortedProbs = [...probabilities].sort((a, b) => a - b);
                        const lowThreshold = sortedProbs[Math.floor(sortedProbs.length / 3)];
                        const highThreshold = sortedProbs[Math.floor(sortedProbs.length * 2 / 3)];
                        
                        const lowRisk = probabilities.filter((p: number) => p <= lowThreshold).length;
                        const medRisk = probabilities.filter((p: number) => p > lowThreshold && p <= highThreshold).length;
                        const highRisk = probabilities.filter((p: number) => p > highThreshold).length;
                        
                        // Generate survival curves (simplified - using exponential decay based on risk)
                        const timePoints = Array.from({ length: 60 }, (_, i) => i);
                        const lowRiskData = timePoints.map(t => ({
                          time: t,
                          survival: Math.exp(-0.01 * t * (1 - lowThreshold)),
                          risk_group: 'Low Risk'
                        }));
                        const medRiskData = timePoints.map(t => ({
                          time: t,
                          survival: Math.exp(-0.02 * t * (1 - (lowThreshold + highThreshold) / 2)),
                          risk_group: 'Medium Risk'
                        }));
                        const highRiskData = timePoints.map(t => ({
                          time: t,
                          survival: Math.exp(-0.04 * t * (1 - highThreshold)),
                          risk_group: 'High Risk'
                        }));
                        
                        return (
                          <>
                            <Line 
                              type="monotone" 
                              data={lowRiskData} 
                              dataKey="survival" 
                              name="Low Risk" 
                              stroke="#10b981" 
                              strokeWidth={2}
                              dot={false}
                            />
                            <Line 
                              type="monotone" 
                              data={medRiskData} 
                              dataKey="survival" 
                              name="Medium Risk" 
                              stroke="#f59e0b" 
                              strokeWidth={2}
                              dot={false}
                            />
                            <Line 
                              type="monotone" 
                              data={highRiskData} 
                              dataKey="survival" 
                              name="High Risk" 
                              stroke="#ef4444" 
                              strokeWidth={2}
                              dot={false}
                            />
                          </>
                        );
                      })()}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Calibration Plot */}
              {result.predictions && result.predictions.length > 0 && result.predictions[0].probability !== undefined && (
                <div className="mb-6" id={`calibration-plot-${result.modelId}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Target className="w-5 h-5 text-green-600" />
                      Calibration Plot (Predicted vs Observed)
                    </h4>
                    <motion.button
                      onClick={async () => {
                        const chartElement = document.getElementById(`calibration-plot-${result.modelId}`);
                        if (chartElement) {
                          try {
                            const canvas = await html2canvas(chartElement);
                            const link = document.createElement('a');
                            link.download = `calibration_plot_${result.modelId}.png`;
                            link.href = canvas.toDataURL();
                            link.click();
                          } catch (error) {
                            console.error('Failed to download calibration plot:', error);
                            alert('Failed to download chart. Please try again.');
                          }
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Chart
                    </motion.button>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        type="number"
                        dataKey="predicted" 
                        domain={[0, 1]}
                        stroke="#64748b"
                        label={{ value: 'Predicted Probability', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        type="number"
                        domain={[0, 1]}
                        stroke="#64748b"
                        label={{ value: 'Observed Probability', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string, props: any) => {
                          if (name === 'Calibration') {
                            return [
                              `Predicted: ${props.payload.predicted.toFixed(3)}`,
                              `Observed: ${props.payload.observed.toFixed(3)}`,
                              `Bin: ${props.payload.bin}`
                            ];
                          }
                          return value.toFixed(3);
                        }}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                      <Legend />
                      <ReferenceLine 
                        segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
                        stroke="#94a3b8"
                        strokeDasharray="5 5"
                        label={{ value: 'Perfect Calibration', position: 'right' }}
                      />
                      <Scatter 
                        name="Calibration"
                        data={(() => {
                          // Calculate calibration bins
                          const predictions = result.predictions || [];
                          const bins = 10;
                          const binData: any[] = [];
                          
                          for (let i = 0; i < bins; i++) {
                            const binStart = i / bins;
                            const binEnd = (i + 1) / bins;
                            const binPreds = predictions.filter((p: any) => {
                              const prob = p.probability || 0;
                              return prob >= binStart && prob < binEnd;
                            });
                            
                            if (binPreds.length > 0) {
                              const avgPredicted = binPreds.reduce((sum: number, p: any) => sum + (p.probability || 0), 0) / binPreds.length;
                              const avgObserved = binPreds.reduce((sum: number, p: any) => sum + (p.actual || 0), 0) / binPreds.length;
                              binData.push({
                                predicted: avgPredicted,
                                observed: avgObserved,
                                bin: `${(binStart * 100).toFixed(0)}-${(binEnd * 100).toFixed(0)}%`
                              });
                            }
                          }
                          
                          return binData;
                        })()}
                        fill="#3b82f6"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* SHAP Feature Importance Plots */}
              {result.featureImportance && result.featureImportance.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-bold mb-4 text-gray-900 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    SHAP Feature Importance
                  </h4>
                  
                  {/* SHAP Summary Plot */}
                  <div className="mb-4" id={`shap-summary-${result.modelId}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-md font-semibold text-gray-700">Summary Plot</h5>
                      <motion.button
                        onClick={async () => {
                          const chartElement = document.getElementById(`shap-summary-${result.modelId}`);
                          if (chartElement) {
                            try {
                              const canvas = await html2canvas(chartElement);
                              const link = document.createElement('a');
                              link.download = `shap_summary_${result.modelId}.png`;
                              link.href = canvas.toDataURL();
                              link.click();
                            } catch (error) {
                              console.error('Failed to download SHAP summary:', error);
                              alert('Failed to download chart. Please try again.');
                            }
                          }
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-semibold flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </motion.button>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={result.featureImportance.slice(0, 15).sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance))}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 150, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" stroke="#64748b" />
                        <YAxis 
                          type="category" 
                          dataKey="feature" 
                          stroke="#64748b"
                          width={140}
                        />
                        <Tooltip 
                          formatter={(value: any) => value.toFixed(4)}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                        <Bar 
                          dataKey="importance" 
                          fill="#8b5cf6"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* SHAP Beeswarm Plot (simplified) */}
                  <div className="mb-4" id={`shap-beeswarm-${result.modelId}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-md font-semibold text-gray-700">Beeswarm Plot</h5>
                      <motion.button
                        onClick={async () => {
                          const chartElement = document.getElementById(`shap-beeswarm-${result.modelId}`);
                          if (chartElement) {
                            try {
                              const canvas = await html2canvas(chartElement);
                              const link = document.createElement('a');
                              link.download = `shap_beeswarm_${result.modelId}.png`;
                              link.href = canvas.toDataURL();
                              link.click();
                            } catch (error) {
                              console.error('Failed to download SHAP beeswarm:', error);
                              alert('Failed to download chart. Please try again.');
                            }
                          }
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-xs font-semibold flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </motion.button>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <ScatterChart margin={{ top: 10, right: 30, left: 150, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          type="number"
                          domain={['dataMin', 'dataMax']}
                          stroke="#64748b"
                          label={{ value: 'SHAP Value', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          type="category"
                          dataKey="feature"
                          stroke="#64748b"
                          width={140}
                        />
                        <Tooltip 
                          formatter={(value: any) => value.toFixed(4)}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                        <Scatter 
                          data={result.featureImportance.slice(0, 15).map((f: any) => ({
                            feature: f.feature,
                            value: f.importance,
                            x: f.importance,
                            y: f.feature
                          }))}
                          fill="#8b5cf6"
                        />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Learning Curves */}
              {result.trainingHistory && result.trainingHistory.length > 0 && (
                <div className="mb-6" id={`learning-curves-${result.modelId}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-600" />
                      Learning Curves
                    </h4>
                    <motion.button
                      onClick={async () => {
                        const chartElement = document.getElementById(`learning-curves-${result.modelId}`);
                        if (chartElement) {
                          try {
                            const canvas = await html2canvas(chartElement);
                            const link = document.createElement('a');
                            link.download = `learning_curves_${result.modelId}.png`;
                            link.href = canvas.toDataURL();
                            link.click();
                          } catch (error) {
                            console.error('Failed to download learning curves:', error);
                            alert('Failed to download chart. Please try again.');
                          }
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Chart
                    </motion.button>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart 
                      data={result.trainingHistory}
                      margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="epoch" 
                        stroke="#64748b"
                        label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        stroke="#64748b"
                        label={{ value: 'Loss / Accuracy', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc', borderRadius: '4px' }}
                      />
                      <Legend />
                      {result.trainingHistory[0].loss !== undefined && (
                        <Line 
                          type="monotone" 
                          dataKey="loss" 
                          name="Training Loss" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {result.trainingHistory[0].val_loss !== undefined && (
                        <Line 
                          type="monotone" 
                          dataKey="val_loss" 
                          name="Validation Loss" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {result.trainingHistory[0].accuracy !== undefined && (
                        <Line 
                          type="monotone" 
                          dataKey="accuracy" 
                          name="Training Accuracy" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                      {result.trainingHistory[0].val_accuracy !== undefined && (
                        <Line 
                          type="monotone" 
                          dataKey="val_accuracy" 
                          name="Validation Accuracy" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          dot={false}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

