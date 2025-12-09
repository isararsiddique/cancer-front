'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Code, Brain, Zap, TrendingUp, BarChart3, LogOut, User, Play, Download, Save, Trash2, RefreshCw, ChevronDown, ChevronUp, FileText, AlertTriangle, Plus, Calendar, CheckCircle, X } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { researchApi } from '@/lib/api/research';
import { mlExecuteApi } from '@/lib/api/ml_execute';
import ProfileModal from '@/components/ProfileModal';

export default function MLTrainingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'builtin' | 'custom'>('builtin');
  const [showProfile, setShowProfile] = useState(false);
  
  // Built-in Model State
  const [selectedRequest, setSelectedRequest] = useState<string>('');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('xgboost');
  
  // Get request_id from URL params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const requestId = params.get('request_id');
      if (requestId) {
        setSelectedRequest(requestId);
      }
    }
  }, []);
  const [targetVariable, setTargetVariable] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [featureToAdd, setFeatureToAdd] = useState('');
  const [testSize, setTestSize] = useState(0.2);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState<any>(null);
  
  // Data columns state
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);
  
  // Custom Code State
  const [customCode, setCustomCode] = useState(`# ═══════════════════════════════════════════════════════════════════════════
# 🎯 COMPLETE ML TRAINING PIPELINE - READY TO RUN!
# ═══════════════════════════════════════════════════════════════════════════
# 
# 📊 Your data is already loaded as 'df' (pandas DataFrame)
# 🚀 Just click "Run Code" button to train a model!
# ✏️  Or edit the code below to customize your analysis
#
# 💡 TIP: Uncomment different models to try them out!
# ═══════════════════════════════════════════════════════════════════════════

# ═══════════════════════════════════════════════════════════════════════════
# STEP 1: Import Required Libraries
# ═══════════════════════════════════════════════════════════════════════════
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, roc_curve
)

# ═══════════════════════════════════════════════════════════════════════════
# STEP 2: Choose Your ML Model (Uncomment ONE model below)
# ═══════════════════════════════════════════════════════════════════════════
from sklearn.ensemble import RandomForestClassifier as Model  # ✓ Currently selected
# from sklearn.linear_model import LogisticRegression as Model  # Fast & interpretable
# from sklearn.ensemble import GradientBoostingClassifier as Model  # High accuracy
# from xgboost import XGBClassifier as Model  # Industry standard
# from sklearn.svm import SVC as Model  # Good for small datasets
# from sklearn.neighbors import KNeighborsClassifier as Model  # Simple baseline

print("=" * 80)
print("🚀 ML TRAINING PIPELINE STARTED")
print("=" * 80)

# ═══════════════════════════════════════════════════════════════════════════
# STEP 3: Explore Your Data
# ═══════════════════════════════════════════════════════════════════════════
print("\\n📊 STEP 3: EXPLORING YOUR DATA")
print("-" * 80)
print(f"Dataset size: {df.shape[0]} rows × {df.shape[1]} columns")
print(f"\\nColumn names:\\n{df.columns.tolist()}")
print(f"\\nData types:\\n{df.dtypes}")
print(f"\\nMissing values:\\n{df.isnull().sum()}")
print(f"\\nFirst 5 rows:\\n{df.head()}")

# ═══════════════════════════════════════════════════════════════════════════
# STEP 4: Prepare Data for Training
# ═══════════════════════════════════════════════════════════════════════════
print("\\n🔧 STEP 4: PREPARING DATA FOR TRAINING")
print("-" * 80)

# 4.1: Select target variable (the column you want to predict)
# 💡 TIP: Change this to match your target column name
# Common examples: 'vital_status', 'diagnosis', 'outcome', 'class', 'label'
target_col = df.columns[-1]  # Currently using the LAST column as target
print(f"✓ Target variable: '{target_col}'")

# 4.2: Separate features (X) and target (y)
X = df.drop(columns=[target_col])  # Features = all columns except target
y = df[target_col]  # Target = the column we want to predict

# 4.3: Convert text labels to numbers (if target is text)
if y.dtype == 'object':
    le = LabelEncoder()
    y = le.fit_transform(y)
    print(f"✓ Target classes: {le.classes_}")

# 4.4: Use only numeric features (easier for beginners)
numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
X = X[numeric_cols]
print(f"✓ Using {len(numeric_cols)} numeric features")

# 4.5: Fill missing values with median
imputer = SimpleImputer(strategy='median')
X = pd.DataFrame(imputer.fit_transform(X), columns=X.columns)
print("✓ Missing values filled")

# ═══════════════════════════════════════════════════════════════════════════
# STEP 5: Split Data into Training and Testing Sets
# ═══════════════════════════════════════════════════════════════════════════
print("\\n✂️  STEP 5: SPLITTING DATA")
print("-" * 80)

# Split: 80% for training, 20% for testing
X_train, X_test, y_train, y_test = train_test_split(
    X, y, 
    test_size=0.2,  # 20% for testing
    random_state=42,  # For reproducible results
    stratify=y  # Keep same class distribution
)
print(f"✓ Training set: {len(X_train)} samples (80%)")
print(f"✓ Test set: {len(X_test)} samples (20%)")

# Scale features (make all numbers similar range)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)
print("✓ Features scaled")

# ═══════════════════════════════════════════════════════════════════════════
# STEP 6: Train the Machine Learning Model
# ═══════════════════════════════════════════════════════════════════════════
print("\\n🤖 STEP 6: TRAINING THE MODEL")
print("-" * 80)

# Create and train the model
model = Model(random_state=42)
model.fit(X_train_scaled, y_train)
print("✓ Model trained successfully!")

# ═══════════════════════════════════════════════════════════════════════════
# STEP 7: Make Predictions and Evaluate Performance
# ═══════════════════════════════════════════════════════════════════════════
print("\\n📈 STEP 7: EVALUATING MODEL PERFORMANCE")
print("-" * 80)

# Make predictions on test data
y_pred = model.predict(X_test_scaled)
y_pred_proba = model.predict_proba(X_test_scaled)[:, 1] if hasattr(model, 'predict_proba') else None

# Calculate performance metrics
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred, average='weighted', zero_division=0)
recall = recall_score(y_test, y_pred, average='weighted', zero_division=0)
f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)

# Display results
print("\\n" + "=" * 80)
print("📊 FINAL RESULTS:")
print("=" * 80)
print(f"✓ Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)")
print(f"✓ Precision: {precision:.4f}")
print(f"✓ Recall:    {recall:.4f}")
print(f"✓ F1-Score:  {f1:.4f}")

# Cross-validation (test model stability)
cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='f1_weighted')
print(f"\\n✓ Cross-Validation F1: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
print("  (This shows how stable the model is across different data splits)")

# ═══════════════════════════════════════════════════════════════════════════
# STEP 8: Create Visualizations
# ═══════════════════════════════════════════════════════════════════════════
print("\\n📊 STEP 8: CREATING VISUALIZATIONS")
print("-" * 80)

# Plot 1: Confusion Matrix
plt.figure(figsize=(8, 6))
cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', cbar=True)
plt.title('Confusion Matrix', fontsize=14, fontweight='bold')
plt.ylabel('True Label')
plt.xlabel('Predicted Label')
plt.tight_layout()
plt.savefig('confusion_matrix.png', dpi=300, bbox_inches='tight')
print("✓ Confusion matrix saved")

# Plot 2: ROC Curve (if binary classification)
if len(np.unique(y_test)) == 2 and y_pred_proba is not None:
    plt.figure(figsize=(8, 6))
    fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
    auc = roc_auc_score(y_test, y_pred_proba)
    plt.plot(fpr, tpr, linewidth=2, label=f'ROC Curve (AUC = {auc:.4f})')
    plt.plot([0, 1], [0, 1], 'k--', linewidth=1, label='Random Classifier')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve', fontsize=14, fontweight='bold')
    plt.legend()
    plt.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig('roc_curve.png', dpi=300, bbox_inches='tight')
    print(f"✓ ROC curve saved (AUC = {auc:.4f})")

# Plot 3: Feature Importance (if available)
if hasattr(model, 'feature_importances_'):
    plt.figure(figsize=(10, 6))
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1][:15]
    plt.barh(range(len(indices)), importances[indices], color='steelblue')
    plt.yticks(range(len(indices)), [X.columns[i] for i in indices])
    plt.xlabel('Importance')
    plt.title('Top 15 Feature Importance', fontsize=14, fontweight='bold')
    plt.gca().invert_yaxis()
    plt.tight_layout()
    plt.savefig('feature_importance.png', dpi=300, bbox_inches='tight')
    print("✓ Feature importance saved")

# Plot 4: Metrics Comparison
plt.figure(figsize=(8, 6))
metrics_names = ['Accuracy', 'Precision', 'Recall', 'F1-Score']
metrics_values = [accuracy, precision, recall, f1]
colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12']
bars = plt.bar(metrics_names, metrics_values, color=colors, alpha=0.7, edgecolor='black')
plt.ylim(0, 1.1)
plt.ylabel('Score')
plt.title('Model Performance Metrics', fontsize=14, fontweight='bold')
plt.grid(axis='y', alpha=0.3)
for bar in bars:
    height = bar.get_height()
    plt.text(bar.get_x() + bar.get_width()/2., height,
             f'{height:.3f}', ha='center', va='bottom', fontweight='bold')
plt.tight_layout()
plt.savefig('metrics_comparison.png', dpi=300, bbox_inches='tight')
print("✓ Metrics comparison saved")

print("\\n" + "=" * 70)
print("✅ TRAINING COMPLETE!")
print("=" * 70)
print("\\nAll results and visualizations are ready for download.")
print("Click 'Download Complete Package (ZIP)' to get everything!")
`);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [dataPreview, setDataPreview] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: userData } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => authApi.getMe(),
  });

  const { data: myRequests, isLoading: requestsLoading, error: requestsError } = useQuery({
    queryKey: ['my-research-requests'],
    queryFn: async () => {
      try {
        const result = await researchApi.listMyRequests();
        console.log('ML Training - Requests loaded:', result);
        return result;
      } catch (error) {
        console.error('ML Training - Failed to load requests:', error);
        return { requests: [], total: 0, pending: 0, approved: 0, rejected: 0 };
      }
    },
    retry: false,
  });

  const { data: trainingHistory } = useQuery({
    queryKey: ['training-history'],
    queryFn: async () => {
      const response = await fetch('/api/v1/ml-training/results', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      if (!response.ok) return { results: [] };
      return response.json();
    },
  });

  useEffect(() => {
    if (!mounted) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      router.push('/auth/login');
    }
  }, [router, mounted]);

  // Fetch data preview when request is selected
  useEffect(() => {
    if (selectedRequest && myRequests?.requests) {
      fetchDataPreview();
    }
  }, [selectedRequest, myRequests]);

  const fetchDataPreview = async () => {
    try {
      const request = myRequests?.requests?.find((r: any) => r.request_id === selectedRequest);
      if (!request) {
        console.log('Request not found:', selectedRequest);
        setAvailableColumns([]);
        setDataPreview(null);
        return;
      }
      
      if (!request.download_token) {
        console.log('No download token found for request:', request);
        alert('This request does not have a download token. Please ensure it is approved.');
        setAvailableColumns([]);
        setDataPreview(null);
        return;
      }

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const apiUrl = `${API_BASE}/api/v1/research/download-json?token=${request.download_token}`;
      
      console.log('Fetching data for request:', selectedRequest);
      console.log('Download token:', request.download_token);
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Data fetched successfully:', data.length, 'records');
        
        if (data.length > 0) {
          setDataPreview(data.slice(0, 5)); // Preview first 5 rows
          
          // Extract column names
          const columns = Object.keys(data[0]);
          console.log('✅ Available columns:', columns);
          setAvailableColumns(columns);
          
          // Set default target variable if not set
          if (!targetVariable) {
            const defaultTargets = ['icd11_main_code', 'vital_status', 'cancer_type', 'diagnosis_year', 'age_at_diagnosis'];
            const foundDefault = defaultTargets.find(t => columns.includes(t));
            if (foundDefault) {
              console.log('✅ Setting default target variable:', foundDefault);
              setTargetVariable(foundDefault);
            } else if (columns.length > 0) {
              console.log('✅ Using first column as target:', columns[0]);
              setTargetVariable(columns[0]);
            }
          }
          
          // Set default features if not set
          if (selectedFeatures.length === 0) {
            const defaultFeatures = ['age_at_diagnosis', 'gender', 'diagnosis_year', 't_category', 'n_category', 'm_category'];
            const availableDefaults = defaultFeatures.filter(f => columns.includes(f) && f !== targetVariable);
            if (availableDefaults.length > 0) {
              console.log('✅ Setting default features:', availableDefaults);
              setSelectedFeatures(availableDefaults);
            }
          }
        } else {
          console.warn('⚠️ No data returned from API');
          alert('No data available for this request');
          setDataPreview(null);
          setAvailableColumns([]);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch data:', response.status, response.statusText);
        console.error('❌ Error details:', errorText);
        alert(`Failed to fetch data: ${response.status} - ${errorText.substring(0, 100)}`);
        setDataPreview(null);
        setAvailableColumns([]);
      }
    } catch (error: any) {
      console.error('❌ Exception while fetching data:', error);
      alert(`Error fetching data: ${error.message}`);
      setDataPreview(null);
      setAvailableColumns([]);
    }
  };

  const handleBuiltInTrain = async () => {
    if (!selectedRequest || !targetVariable || selectedFeatures.length === 0) {
      alert('Please select request, target variable, and features');
      return;
    }

    setIsTraining(true);
    setTrainingResult(null);

    try {
      const request = myRequests?.requests?.find((r: any) => r.request_id === selectedRequest);
      
      if (!request?.download_token) {
        throw new Error('No download token available for this request');
      }

      console.log('Fetching dataset for training...');
      
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Fetch full dataset as JSON
      const dataResponse = await fetch(`${API_BASE}/api/v1/research/download-json?token=${request.download_token}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!dataResponse.ok) {
        const errorText = await dataResponse.text();
        throw new Error(`Failed to fetch data: ${dataResponse.status} - ${errorText}`);
      }

      const dataset = await dataResponse.json();
      console.log('Dataset fetched:', dataset.length, 'records');

      if (!Array.isArray(dataset) || dataset.length === 0) {
        throw new Error('Dataset is empty or invalid');
      }

      // Train model
      console.log('Starting model training...');
      const response = await fetch(`${API_BASE}/api/v1/ml-training/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          research_request_id: selectedRequest,
          algorithm: selectedAlgorithm,
          target_variable: targetVariable,
          features: selectedFeatures,
          test_size: testSize,
          dataset: dataset
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Training failed' }));
        throw new Error(errorData.detail || 'Training failed');
      }

      const startResult = await response.json();
      console.log('Training started:', startResult);
      
      // Poll for training completion
      const trainingId = startResult.training_id;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes max (5 seconds * 60)
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const statusResponse = await fetch(`${API_BASE}/api/v1/ml-training/train/${trainingId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('Training status:', statusData.status);
          
          if (statusData.status === 'completed') {
            console.log('Training completed successfully!');
            setTrainingResult(statusData);
            alert('Model training completed successfully! You can now download the complete package.');
            return;
          } else if (statusData.status === 'failed') {
            throw new Error(statusData.error_message || 'Training failed');
          }
          // If status is 'training' or 'queued', continue polling
        }
        
        attempts++;
      }
      
      throw new Error('Training timeout - please check training history');
    } catch (error: any) {
      console.error('Training error:', error);
      alert('Training failed: ' + error.message);
    } finally {
      setIsTraining(false);
    }
  };

  const handleCustomExecute = async () => {
    if (!selectedRequest || !customCode.trim()) {
      alert('Please select data source and enter code');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const request = myRequests?.requests?.find((r: any) => r.request_id === selectedRequest);
      
      if (!request?.download_token) {
        throw new Error('No download token available for this request');
      }

      console.log('Starting custom code execution...');
      
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      // Fetch dataset
      const dataResponse = await fetch(`${API_BASE}/api/v1/research/download-json?token=${request.download_token}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!dataResponse.ok) {
        throw new Error(`Failed to fetch data: ${dataResponse.status}`);
      }

      const dataset = await dataResponse.json();
      console.log('Dataset fetched:', dataset.length, 'records');

      // Execute code on backend (similar to built-in models)
      const response = await fetch(`${API_BASE}/api/v1/ml-training/execute-custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          code: customCode,
          dataset: dataset,
          research_request_id: selectedRequest
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Execution failed' }));
        throw new Error(errorData.detail || 'Execution failed');
      }

      const result = await response.json();
      console.log('✅ Execution completed:', result);
      setExecutionResult(result);
      alert('Code executed successfully! Check results below.');
    } catch (error: any) {
      console.error('❌ Execution error:', error);
      alert(`Execution failed: ${error.message}`);
      setExecutionResult({
        success: false,
        error: error.message,
        stdout: '',
        stderr: error.message,
        execution_time: 0,
        timeout: false,
        plots: []
      });
    } finally {
      setIsExecuting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ML Training Lab...</p>
        </div>
      </div>
    );
  }

  // Filter approved requests with download tokens
  const approvedRequests = myRequests?.requests?.filter((r: any) => 
    r.status === 'approved' || r.status === 'APPROVED'
  ) || [];
  
  const selectedRequestData = approvedRequests.find((r: any) => r.request_id === selectedRequest);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Brain className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">ML Training Lab</h1>
                <p className="text-purple-100 text-sm">Train models and execute custom code</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/research')}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={() => setShowProfile(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={async () => {
                  await authApi.logout();
                  router.push('/auth/login');
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('builtin')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'builtin'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Zap className="w-5 h-5" />
              Built-in Models
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'custom'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Code className="w-5 h-5" />
              Custom Code (Colab-like)
            </button>
          </div>
        </div>

        {/* Data Source Selector - Simple Dropdown */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Select Approved Data Source
            </label>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-medium text-green-700">Data Secure - No External Downloads</span>
            </div>
          </div>
          
          {requestsLoading ? (
            <div className="flex items-center gap-3 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
              <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">Loading approved data sources...</span>
            </div>
          ) : (
            <>
              <select
                value={selectedRequest}
                onChange={(e) => setSelectedRequest(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                disabled={approvedRequests.length === 0}
              >
                <option value="">
                  {approvedRequests.length === 0 
                    ? '-- No approved data sources available --' 
                    : '-- Select approved data source --'}
                </option>
                {approvedRequests.map((request: any) => (
                  <option key={request.request_id} value={request.request_id}>
                    {request.purpose_of_study || 'Research Request'} ({request.estimated_record_count || 0} records)
                  </option>
                ))}
              </select>
              
              {approvedRequests.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  Go to <button onClick={() => router.push('/research')} className="text-purple-600 hover:underline">Research Dashboard</button> to create and submit a research request for approval.
                </p>
              )}
              
              {selectedRequestData && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Purpose:</strong> {selectedRequestData.purpose_of_study}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    <strong>Status:</strong> {selectedRequestData.status.toUpperCase()}
                  </p>
                  {selectedRequestData.download_token && (
                    <p className="text-xs text-green-700 mt-1">
                      ✓ Data download available
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Built-in Models Tab */}
        {activeTab === 'builtin' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-purple-600" />
                Configure Model Training
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Algorithm Selection - All 8 Models */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select ML Algorithm
                  </label>
                  <select
                    value={selectedAlgorithm}
                    onChange={(e) => setSelectedAlgorithm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="logistic_regression">Logistic Regression (Fast, Interpretable)</option>
                    <option value="random_forest">Random Forest (High Accuracy)</option>
                    <option value="gradient_boosting">Gradient Boosting (Best Performance)</option>
                    <option value="xgboost">XGBoost (Industry Standard)</option>
                    <option value="svm_rbf">SVM with RBF Kernel (Non-linear)</option>
                    <option value="neural_network">Neural Network MLP (Deep Learning)</option>
                    <option value="knn">K-Nearest Neighbors (Simple)</option>
                    <option value="adaboost">AdaBoost (Ensemble)</option>
                    <option value="decision_tree">Decision Tree (Interpretable)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Choose the algorithm that best fits your research needs
                  </p>
                </div>

                {/* Test Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Size: {(testSize * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.4"
                    step="0.05"
                    value={testSize}
                    onChange={(e) => setTestSize(parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Target Variable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Variable {availableColumns.length > 0 && <span className="text-xs text-green-600">({availableColumns.length} columns available)</span>}
                  </label>
                  {selectedRequest && availableColumns.length === 0 ? (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600">Loading columns...</span>
                    </div>
                  ) : availableColumns.length > 0 ? (
                    <select
                      value={targetVariable}
                      onChange={(e) => setTargetVariable(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">-- Select target variable --</option>
                      {availableColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value=""
                      placeholder="Select a data source first"
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                    />
                  )}
                </div>

                {/* Features */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Features {selectedFeatures.length > 0 && <span className="text-xs text-green-600">({selectedFeatures.length} selected)</span>}
                  </label>
                  
                  {/* Selected Features Tags */}
                  {selectedFeatures.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {selectedFeatures.map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                        >
                          {feature}
                          <button
                            onClick={() => setSelectedFeatures(selectedFeatures.filter(f => f !== feature))}
                            className="hover:text-purple-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      <button
                        onClick={() => setSelectedFeatures([])}
                        className="text-xs text-red-600 hover:text-red-800 px-2"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                  
                  {/* Add Feature Dropdown */}
                  <div className="flex gap-2">
                    <select
                      value={featureToAdd}
                      onChange={(e) => setFeatureToAdd(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      disabled={availableColumns.length === 0}
                    >
                      <option value="">-- Select feature to add --</option>
                      {availableColumns
                        .filter(col => col !== targetVariable && !selectedFeatures.includes(col))
                        .map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        if (featureToAdd && !selectedFeatures.includes(featureToAdd)) {
                          setSelectedFeatures([...selectedFeatures, featureToAdd]);
                          setFeatureToAdd('');
                        }
                      }}
                      disabled={!featureToAdd}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBuiltInTrain}
                disabled={isTraining || !selectedRequest}
                className="mt-6 w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold text-lg"
              >
                {isTraining ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Training Model...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Train Model
                  </>
                )}
              </button>
            </div>

            {/* Training Results */}
            {trainingResult && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                      Training Results
                    </h3>
                    <button
                      onClick={async () => {
                        try {
                          const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                          const response = await fetch(`${API_BASE}/api/v1/ml-training/download-package/${trainingResult.training_id}`, {
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                            }
                          });
                          
                          if (response.ok) {
                            const blob = await response.blob();
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `ML_Training_Package_${selectedAlgorithm}_${Date.now()}.zip`;
                            a.click();
                            URL.revokeObjectURL(url);
                          } else {
                            alert('Failed to download package');
                          }
                        } catch (error) {
                          console.error('Download error:', error);
                          alert('Error downloading package');
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold shadow-lg"
                    >
                      <Download className="w-5 h-5" />
                      Download Complete Package (ZIP)
                    </button>
                  </div>
                  
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {trainingResult.metrics && Object.entries(trainingResult.metrics)
                      .filter(([key, value]) => {
                        // Only show simple numeric metrics, exclude complex objects
                        return typeof value === 'number' && 
                               !['roc_curve', 'confusion_matrix', 'cv_scores', 'training_history'].includes(key);
                      })
                      .map(([key, value]: [string, any]) => (
                        <div key={key} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                          <p className="text-xs text-gray-600 mb-1 uppercase font-medium">{key.replace(/_/g, ' ')}</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {value.toFixed(4)}
                          </p>
                        </div>
                      ))}
                  </div>

                  {/* ROC Curve with actual plotting */}
                  {trainingResult.metrics?.roc_curve && trainingResult.metrics.roc_curve.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">ROC Curve</h4>
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="text-center mb-4">
                          <p className="text-sm text-gray-600">
                            AUC-ROC: <span className="font-bold text-green-600 text-lg">
                              {trainingResult.metrics?.auc?.toFixed(4) || 'N/A'}
                            </span>
                          </p>
                        </div>
                        <div className="relative w-full" style={{ height: '400px' }}>
                          <svg viewBox="0 0 500 500" className="w-full h-full">
                            {/* Grid lines */}
                            {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((val) => (
                              <g key={val}>
                                <line
                                  x1="50"
                                  y1={450 - val * 400}
                                  x2="450"
                                  y2={450 - val * 400}
                                  stroke="#e5e7eb"
                                  strokeWidth="1"
                                />
                                <line
                                  x1={50 + val * 400}
                                  y1="50"
                                  x2={50 + val * 400}
                                  y2="450"
                                  stroke="#e5e7eb"
                                  strokeWidth="1"
                                />
                              </g>
                            ))}
                            
                            {/* Axes */}
                            <line x1="50" y1="450" x2="450" y2="450" stroke="#374151" strokeWidth="2" />
                            <line x1="50" y1="50" x2="50" y2="450" stroke="#374151" strokeWidth="2" />
                            
                            {/* Diagonal reference line */}
                            <line x1="50" y1="450" x2="450" y2="50" stroke="#9ca3af" strokeWidth="1" strokeDasharray="5,5" />
                            
                            {/* ROC Curve */}
                            <polyline
                              points={trainingResult.metrics.roc_curve
                                .map((p: any) => `${50 + p.fpr * 400},${450 - p.tpr * 400}`)
                                .join(' ')}
                              fill="none"
                              stroke="#8b5cf6"
                              strokeWidth="3"
                            />
                            
                            {/* Axis labels */}
                            <text x="250" y="490" textAnchor="middle" fontSize="14" fill="#374151">
                              False Positive Rate
                            </text>
                            <text x="20" y="250" textAnchor="middle" fontSize="14" fill="#374151" transform="rotate(-90 20 250)">
                              True Positive Rate
                            </text>
                            
                            {/* Tick labels */}
                            {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((val) => (
                              <g key={val}>
                                <text x={50 + val * 400} y="470" textAnchor="middle" fontSize="12" fill="#6b7280">
                                  {val.toFixed(1)}
                                </text>
                                <text x="35" y={455 - val * 400} textAnchor="end" fontSize="12" fill="#6b7280">
                                  {val.toFixed(1)}
                                </text>
                              </g>
                            ))}
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Confusion Matrix */}
                  {trainingResult.metrics?.confusion_matrix && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Confusion Matrix</h4>
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="max-w-md mx-auto">
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <div></div>
                            <div className="text-center font-semibold text-sm text-gray-700">Predicted 0</div>
                            <div className="text-center font-semibold text-sm text-gray-700">Predicted 1</div>
                          </div>
                          {trainingResult.metrics.confusion_matrix.map((row: number[], i: number) => (
                            <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                              <div className="flex items-center justify-end pr-2 font-semibold text-sm text-gray-700">
                                Actual {i}
                              </div>
                              {row.map((val: number, j: number) => (
                                <div 
                                  key={`${i}-${j}`} 
                                  className={`p-6 rounded text-center border-2 ${
                                    i === j 
                                      ? 'bg-green-100 border-green-400' 
                                      : 'bg-red-100 border-red-400'
                                  }`}
                                >
                                  <p className="text-3xl font-bold text-gray-900">{val}</p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {i === 0 && j === 0 && 'True Neg'}
                                    {i === 0 && j === 1 && 'False Pos'}
                                    {i === 1 && j === 0 && 'False Neg'}
                                    {i === 1 && j === 1 && 'True Pos'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cross-Validation Scores */}
                  {trainingResult.metrics?.cv_scores && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Cross-Validation Scores (5-Fold)</h4>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          <div className="bg-white p-4 rounded-lg border border-gray-300">
                            <p className="text-xs text-gray-600 uppercase mb-1">Mean Score</p>
                            <p className="text-2xl font-bold text-green-600">
                              {trainingResult.metrics.cv_scores.mean.toFixed(4)}
                            </p>
                          </div>
                          <div className="bg-white p-4 rounded-lg border border-gray-300">
                            <p className="text-xs text-gray-600 uppercase mb-1">Std Deviation</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {trainingResult.metrics.cv_scores.std.toFixed(4)}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700">Individual Fold Scores:</p>
                          {trainingResult.metrics.cv_scores.scores.map((score: number, idx: number) => (
                            <div key={idx} className="flex items-center gap-3">
                              <span className="text-sm text-gray-700 w-16">Fold {idx + 1}:</span>
                              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-6 rounded-full flex items-center justify-end pr-2"
                                  style={{ width: `${(score * 100).toFixed(1)}%` }}
                                >
                                  <span className="text-xs text-white font-medium">
                                    {score.toFixed(4)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Learning Curves (for CNN models) */}
                  {trainingResult.metrics?.training_history && trainingResult.metrics.training_history.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 mb-3">Learning Curves</h4>
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="relative w-full" style={{ height: '400px' }}>
                          <svg viewBox="0 0 600 400" className="w-full h-full">
                            {/* Grid */}
                            {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((val) => (
                              <line
                                key={val}
                                x1="60"
                                y1={350 - val * 300}
                                x2="580"
                                y2={350 - val * 300}
                                stroke="#e5e7eb"
                                strokeWidth="1"
                              />
                            ))}
                            
                            {/* Axes */}
                            <line x1="60" y1="350" x2="580" y2="350" stroke="#374151" strokeWidth="2" />
                            <line x1="60" y1="50" x2="60" y2="350" stroke="#374151" strokeWidth="2" />
                            
                            {/* Training Loss */}
                            <polyline
                              points={trainingResult.metrics.training_history
                                .map((h: any, i: number) => 
                                  `${60 + (i / (trainingResult.metrics.training_history.length - 1)) * 520},${350 - (1 - Math.min(h.loss || 0, 1)) * 300}`
                                )
                                .join(' ')}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="2"
                            />
                            
                            {/* Validation Loss */}
                            {trainingResult.metrics.training_history[0]?.val_loss !== undefined && (
                              <polyline
                                points={trainingResult.metrics.training_history
                                  .map((h: any, i: number) => 
                                    `${60 + (i / (trainingResult.metrics.training_history.length - 1)) * 520},${350 - (1 - Math.min(h.val_loss || 0, 1)) * 300}`
                                  )
                                  .join(' ')}
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2"
                                strokeDasharray="5,5"
                              />
                            )}
                            
                            {/* Labels */}
                            <text x="300" y="390" textAnchor="middle" fontSize="14" fill="#374151">Epoch</text>
                            <text x="20" y="200" textAnchor="middle" fontSize="14" fill="#374151" transform="rotate(-90 20 200)">Loss</text>
                            
                            {/* Legend */}
                            <rect x="450" y="70" width="15" height="3" fill="#3b82f6" />
                            <text x="470" y="75" fontSize="12" fill="#374151">Training Loss</text>
                            {trainingResult.metrics.training_history[0]?.val_loss !== undefined && (
                              <>
                                <rect x="450" y="90" width="15" height="3" fill="#ef4444" strokeDasharray="5,5" />
                                <text x="470" y="95" fontSize="12" fill="#374151">Validation Loss</text>
                              </>
                            )}
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feature Importance */}
                  {trainingResult.feature_importance && trainingResult.feature_importance.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Feature Importance</h4>
                      <div className="space-y-2">
                        {trainingResult.feature_importance.slice(0, 10).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3">
                            <span className="text-sm text-gray-700 w-32 truncate">{item.feature}</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-6 rounded-full flex items-center justify-end pr-2"
                                style={{ width: `${(item.importance * 100).toFixed(1)}%` }}
                              >
                                <span className="text-xs text-white font-medium">
                                  {(item.importance * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Code Tab */}
        {activeTab === 'custom' && (
          <div className="space-y-6">
            {/* Data Preview */}
            {dataPreview && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Data Preview (First 5 rows)</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(dataPreview[0] || {}).map((key) => (
                          <th key={key} className="px-4 py-2 text-left font-medium text-gray-700">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dataPreview.map((row: any, idx: number) => (
                        <tr key={idx} className="border-t">
                          {Object.values(row).map((val: any, i: number) => (
                            <td key={i} className="px-4 py-2 text-gray-600">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Code Editor */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Code className="w-6 h-6 text-purple-600" />
                  Python Code Editor
                </h3>
                <button
                  onClick={handleCustomExecute}
                  disabled={isExecuting || !selectedRequest}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold"
                >
                  {isExecuting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Executing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Code
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="w-full h-96 px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50"
                placeholder="Write your Python code here..."
                spellCheck={false}
              />

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Available:</strong> pandas (pd), numpy (np), matplotlib (plt), seaborn (sns), sklearn, xgboost
                  <br />
                  <strong>Data:</strong> Your dataset is available as <code className="bg-blue-100 px-2 py-1 rounded">df</code> DataFrame
                </p>
              </div>
            </div>

            {/* Execution Results */}
            {executionResult && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Execution Results</h3>
                  {executionResult.success && (
                    <button
                      onClick={async () => {
                        try {
                          // Create ZIP package with all results
                          const JSZip = (await import('jszip')).default;
                          const zip = new JSZip();
                          
                          // Add code
                          zip.file("code/custom_code.py", customCode);
                          
                          // Add stdout
                          if (executionResult.stdout) {
                            zip.file("results/output.txt", executionResult.stdout);
                          }
                          
                          // Add plots
                          if (executionResult.plots && executionResult.plots.length > 0) {
                            const plotsFolder = zip.folder("visualizations");
                            executionResult.plots.forEach((plot: string, idx: number) => {
                              const base64Data = plot.replace(/^data:image\/\w+;base64,/, '');
                              plotsFolder?.file(`plot_${idx + 1}.png`, base64Data, {base64: true});
                            });
                          }
                          
                          // Add results JSON
                          zip.file("results/execution_results.json", JSON.stringify(executionResult, null, 2));
                          
                          // Add README
                          const readme = `
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║              CUSTOM ML EXECUTION RESULTS - COMPLETE PACKAGE                ║
║                                                                            ║
║                     Generated: ${new Date().toLocaleString()}                      ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝

📦 PACKAGE CONTENTS
════════════════════════════════════════════════════════════════════════════

Custom_ML_Execution/
├── code/                      (Your Custom Code)
│   └── custom_code.py
│
├── results/                   (Execution Results)
│   ├── output.txt            Console output
│   └── execution_results.json Complete results in JSON
│
├── visualizations/            (Generated Plots)
│   ├── plot_1.png
│   ├── plot_2.png
│   └── ... (all generated plots)
│
└── documentation/
    └── README.txt            (This file)

════════════════════════════════════════════════════════════════════════════

📊 EXECUTION SUMMARY
════════════════════════════════════════════════════════════════════════════

Status:           ${executionResult.success ? 'SUCCESS ✓' : 'FAILED ✗'}
Execution Time:   ${executionResult.execution_time || 'N/A'}s
Plots Generated:  ${executionResult.plots?.length || 0}

════════════════════════════════════════════════════════════════════════════

💻 YOUR CODE
════════════════════════════════════════════════════════════════════════════

See: code/custom_code.py

This file contains the exact Python code you executed.

════════════════════════════════════════════════════════════════════════════

📈 VISUALIZATIONS
════════════════════════════════════════════════════════════════════════════

All plots generated by your code are saved in the visualizations/ folder.
Each plot is saved as a high-quality PNG image.

════════════════════════════════════════════════════════════════════════════

✨ NEXT STEPS
════════════════════════════════════════════════════════════════════════════

1. Review your code in code/custom_code.py
2. Check execution output in results/output.txt
3. Analyze visualizations in visualizations/ folder
4. Use results for your research or publication

════════════════════════════════════════════════════════════════════════════
`;
                          zip.file("documentation/README.txt", readme);
                          
                          // Generate and download ZIP
                          const content = await zip.generateAsync({type: 'blob'});
                          const url = URL.createObjectURL(content);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `Custom_ML_Execution_${Date.now()}.zip`;
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch (error) {
                          console.error('Error creating ZIP:', error);
                          alert('Error creating download package. Downloading JSON instead.');
                          // Fallback to JSON download
                          const blob = new Blob([JSON.stringify(executionResult, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `execution_results_${Date.now()}.json`;
                          a.click();
                        }
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold shadow-lg"
                    >
                      <Download className="w-5 h-5" />
                      Download Complete Package (ZIP)
                    </button>
                  )}
                </div>
                
                {executionResult.success ? (
                  <div className="space-y-4">
                    {executionResult.stdout && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Output:</h4>
                        <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm border border-gray-200">
                          {executionResult.stdout}
                        </pre>
                      </div>
                    )}
                    
                    {executionResult.plots && executionResult.plots.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3">Generated Plots ({executionResult.plots.length}):</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {executionResult.plots.map((plot: string, idx: number) => (
                            <div key={idx} className="relative">
                              <img
                                src={`data:image/png;base64,${plot}`}
                                alt={`Plot ${idx + 1}`}
                                className="rounded-lg border-2 border-gray-200 w-full shadow-md"
                              />
                              <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 text-white rounded text-xs font-medium">
                                Plot {idx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 mt-3 text-center">
                          💡 All plots are included in the downloadable ZIP package above
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-800 mb-2">Error:</h4>
                    <pre className="text-sm text-red-700 whitespace-pre-wrap">
                      {executionResult.error || executionResult.stderr}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Training History */}
        {trainingHistory && trainingHistory.results && trainingHistory.results.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-purple-600" />
              Training History
            </h3>
            <div className="space-y-3">
              {trainingHistory.results.slice(0, 5).map((result: any) => (
                <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{result.algorithm}</p>
                      <p className="text-sm text-gray-600">
                        Target: {result.target_variable} | Features: {result.features?.length || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(result.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {result.metrics?.accuracy && (
                        <p className="text-lg font-bold text-green-600">
                          {(result.metrics.accuracy * 100).toFixed(2)}%
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Accuracy</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showProfile && (
        <ProfileModal
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
          user={userData}
        />
      )}
    </div>
  );
}
