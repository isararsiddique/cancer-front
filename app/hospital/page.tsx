'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, FileText, Search, X, Save, LogOut, Menu, Calendar, Filter, Download, Edit, Eye, CheckCircle, Clock, AlertCircle, TrendingUp, BarChart3, Upload, Brain, CheckCircle2, XCircle, FileImage, FileText as FileTextIcon, Image as ImageIcon, Sparkles, User } from 'lucide-react';
import { ICD11ECTSearch } from '@/components/ICD11ECTSearch';
import ProfileModal from '@/components/ProfileModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { patientsApi, Patient, PatientCreate } from '@/lib/api/patients';
import { ICD11Details } from '@/lib/types';
import { clearNonEssentialCache } from '@/lib/utils/auth';
import { checkDashboardSwitch } from '@/lib/utils/dashboardAuth';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Header } from '@/components/shared/Header';
import { StatCard } from '@/components/shared/StatCard';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { designTokens, cn } from '@/lib/styles/tokens';
// AnalyticsDashboard removed - analytics endpoints removed

export default function HospitalDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [followupFilter, setFollowupFilter] = useState<'all' | 'has_followup' | 'needs_followup' | 'overdue'>('all');
  const [followupDateFilter, setFollowupDateFilter] = useState('');
  const [showAIRAGUpload, setShowAIRAGUpload] = useState(false);
  const [aiUploadFiles, setAiUploadFiles] = useState<File[]>([]);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiProcessedData, setAiProcessedData] = useState<any[]>([]);
  const [showAIReview, setShowAIReview] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkCsvFile, setBulkCsvFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadResult, setBulkUploadResult] = useState<any>(null);
  const [icdData, setIcdData] = useState<ICD11Details | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({
    patient_id: '',
    patient_name: '',
    gender: '',
    date_of_birth: '',
    nationality: '',
    diagnosis_date: '',
    icd11_main_code: '',
    icd11_description: '',
    icd11_composite_expression: '',
    icd11_topography_code: '',
    icd11_topography: '',
    icd11_morphology_code: '',
    icd11_morphology: '',
    icd11_behavior_code: '',
    icd11_stage_code: '',
    laterality: '',
    t_category: '',
    n_category: '',
    m_category: '',
    followup_date: '',
    vital_status: '',
    cause_of_death_icd11: '',
    recurrence: false,
    recurrence_date: '',
    metastasis: false,
    survival_months: undefined,
    followup_notes: '',
    icd11_manifestation_code: '',
    manifestation: '',
  });

  const queryClient = useQueryClient();

  // Helper function to extract error message
  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return String(error.message);
    if (error?.response?.data) {
      const data = error.response.data;
      if (typeof data === 'string') return data;
      if (data?.detail) {
        if (typeof data.detail === 'string') return data.detail;
        if (Array.isArray(data.detail)) {
          return data.detail.map((d: any) => {
            if (typeof d === 'string') return d;
            if (d?.msg) return d.msg;
            if (d?.message) return d.message;
            return JSON.stringify(d);
          }).join(', ');
        }
        return String(data.detail);
      }
      if (data?.message) return String(data.message);
      return JSON.stringify(data);
    }
    if (error?.request) return 'Network error: Could not reach the server';
    return error?.toString() || 'An unexpected error occurred';
  };

  // Fetch patients - optimized for performance
  // Only fetch first 1000 patients initially, use search to narrow down
  const { data: patientsResponse, isLoading } = useQuery({
    queryKey: ['patients', searchQuery],
    queryFn: async () => {
      // Fetch only first 1000 patients for performance
      // Users can use search to find specific patients
      const response = await patientsApi.getAll(0, 1000, searchQuery || undefined);
      return response;
    },
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce load
    refetchOnMount: false, // Don't refetch on mount
    staleTime: 60000, // Consider data fresh for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes (formerly cacheTime)
  });
  
  const patients = (patientsResponse && 'items' in patientsResponse ? patientsResponse.items : Array.isArray(patientsResponse) ? patientsResponse : []) || [];

  // Get current user
  const { data: userData } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      return await authApi.getMe();
    },
  });

  // Create patient mutation - using simple fetch like HTML version
  const createMutation = useMutation({
    mutationFn: async (data: PatientCreate) => {
      // Use simple fetch directly (like HTML version)
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE}/api/v1/patients/`, {
        method: 'POST',
        headers: headers as HeadersInit,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || errorJson.message || errorText;
        } catch {}
        throw new Error(`HTTP ${response.status}: ${errorMessage}`);
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setShowCreateForm(false);
      resetForm();
      alert('Patient created successfully!');
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error);
      alert(`Error: ${errorMessage}`);
      console.error('Create patient error:', error);
    },
  });


  // Handle AI file upload
  const handleAIFileUpload = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      return validTypes.includes(file.type) || 
             file.name.endsWith('.pdf') || 
             file.name.endsWith('.doc') || 
             file.name.endsWith('.docx') ||
             file.name.endsWith('.txt');
    });
    setAiUploadFiles(prev => [...prev, ...validFiles]);
  };

  // Handle AI processing
  const handleAIProcess = async () => {
    if (aiUploadFiles.length === 0) return;

    setAiProcessing(true);
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      const formData = new FormData();
      aiUploadFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${API_BASE}/api/v1/ai/rag-process`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'AI processing failed' }));
        throw new Error(errorData.detail || 'AI processing failed');
      }

      const data = await response.json();
      
      // Add source file info to each record
      const processedData = data.processed_records.map((record: any, index: number) => ({
        ...record,
        source_file: aiUploadFiles[index]?.name || 'Unknown',
        ai_confidence: record.ai_confidence || 0,
      }));

      setAiProcessedData(prev => [...prev, ...processedData]);
      setShowAIRAGUpload(false);
      setAiUploadFiles([]);
      setShowAIReview(true);
      alert(`AI processing completed! Extracted ${processedData.length} patient records.`);
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      alert(`Error processing files: ${errorMsg}`);
    } finally {
      setAiProcessing(false);
    }
  };

  // Update patient mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PatientCreate> }) => {
      // Clean up the data: remove empty strings, convert to proper types
      const cleanedData: any = {};
      
      for (const [key, value] of Object.entries(data)) {
        // Skip empty strings - convert to null or undefined
        if (value === '' || value === null) {
          continue; // Skip empty values
        }
        
        // Handle date fields - convert string dates to proper format
        if (key.includes('date') && typeof value === 'string' && value) {
          // Try to parse the date
          try {
            const dateValue = new Date(value);
            if (!isNaN(dateValue.getTime())) {
              cleanedData[key] = dateValue.toISOString().split('T')[0]; // YYYY-MM-DD format
            }
          } catch {
            // If date parsing fails, skip this field
            continue;
          }
        } else if (value !== undefined && value !== null && value !== '') {
          cleanedData[key] = value;
        }
      }
      
      return patientsApi.update(id, cleanedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setShowEditForm(false);
      setEditingPatient(null);
      setIcdData(null);
      setFormData({
        patient_id: '',
        patient_name: '',
        gender: '',
        date_of_birth: '',
        nationality: '',
        diagnosis_date: '',
        icd11_main_code: '',
        icd11_description: '',
        icd11_topography_code: '',
        icd11_topography: '',
        icd11_morphology_code: '',
        icd11_morphology: '',
        t_category: '',
        n_category: '',
        m_category: '',
      });
      alert('Patient updated successfully!');
    },
    onError: (error: any) => {
      const errorMsg = getErrorMessage(error);
      alert(`Error: ${errorMsg}`);
    },
  });

  // Handle bulk CSV upload
  const handleBulkUpload = async () => {
    if (!bulkCsvFile) {
      alert('Please select a CSV file');
      return;
    }

    setBulkUploading(true);
    setBulkUploadResult(null);

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      const formData = new FormData();
      formData.append('file', bulkCsvFile);

      const response = await fetch(`${API_BASE}/api/v1/patients/bulk-upload`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Bulk upload failed' }));
        throw new Error(errorData.detail || 'Bulk upload failed');
      }

      const data = await response.json();
      setBulkUploadResult(data);
      
      // Refresh patient list
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      
      alert(`Bulk upload completed!\n\nSuccessful: ${data.successful}\nFailed: ${data.failed}\nTotal: ${data.total_rows}`);
      
      // Clear file if all successful
      if (data.failed === 0) {
        setBulkCsvFile(null);
        setShowBulkUpload(false);
      }
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      alert(`Error uploading CSV: ${errorMsg}`);
    } finally {
      setBulkUploading(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      patient_id: '',
      patient_name: '',
      gender: '',
      date_of_birth: '',
      nationality: '',
      diagnosis_date: '',
      icd11_main_code: '',
      icd11_description: '',
      icd11_composite_expression: '',
      icd11_topography_code: '',
      icd11_topography: '',
      icd11_morphology_code: '',
      icd11_morphology: '',
      icd11_behavior_code: '',
      icd11_stage_code: '',
      laterality: '',
      t_category: '',
      n_category: '',
      m_category: '',
      followup_date: '',
      vital_status: '',
      cause_of_death_icd11: '',
      recurrence: false,
      recurrence_date: '',
      metastasis: false,
      survival_months: undefined,
      followup_notes: '',
    });
    setIcdData(null);
  };

  // Handle ICD-11 selection
  const handleICDSelect = (details: ICD11Details) => {
    setIcdData(details);
    const parsed = details.parsed;
    const autoFill = details.auto_fill_fields || {};
    setFormData((prev) => ({
      ...prev,
      icd11_main_code: parsed.icd11_main_code || autoFill.icd11_main_code || prev.icd11_main_code || '',
      icd11_description: parsed.icd11_description || autoFill.icd11_description || prev.icd11_description || '',
      icd11_composite_expression: parsed.icd11_composite_expression || autoFill.icd11_composite_expression || prev.icd11_composite_expression || '',
      icd11_topography_code: parsed.icd11_topography_code || autoFill.icd11_topography_code || prev.icd11_topography_code || '',
      icd11_topography: parsed.icd11_topography || autoFill.icd11_topography || prev.icd11_topography || '',
      icd11_morphology_code: parsed.icd11_morphology_code || autoFill.icd11_morphology_code || prev.icd11_morphology_code || '',
      icd11_morphology: parsed.icd11_morphology || autoFill.icd11_morphology || prev.icd11_morphology || '',
      icd11_behavior_code: parsed.icd11_behavior_code || autoFill.icd11_behavior_code || prev.icd11_behavior_code || '',
      icd11_stage_code: parsed.icd11_stage_code || autoFill.icd11_stage_code || prev.icd11_stage_code || '',
      laterality: parsed.laterality || autoFill.laterality || prev.laterality || '',
      icd11_manifestation_code: (autoFill as any).icd11_manifestation_code || prev.icd11_manifestation_code || '',
      manifestation: (autoFill as any).manifestation || prev.manifestation || '',
    }));
  };

  // ICD-11 ECT is now handled by ICD11ECTSearch component using npm package

  // Open create form - ECT will load automatically at top
  const handleCreateClick = () => {
    resetForm();
    setShowCreateForm(true);
  };

  // Open edit form
  const handleEditClick = async (patient: Patient) => {
    try {
      const patientData = await patientsApi.getById(patient.id!);
      setEditingPatient(patientData);
      setFormData({
        patient_id: patientData.patient_id || '',
        patient_name: patientData.patient_name || '',
        gender: patientData.gender || '',
        date_of_birth: patientData.date_of_birth || '',
        nationality: patientData.nationality || '',
        diagnosis_date: patientData.diagnosis_date || '',
        icd11_main_code: patientData.icd11_main_code || '',
        icd11_description: patientData.icd11_description || '',
        icd11_topography_code: patientData.icd11_topography_code || '',
        icd11_topography: patientData.icd11_topography || '',
        icd11_morphology_code: patientData.icd11_morphology_code || '',
        icd11_morphology: patientData.icd11_morphology || '',
        t_category: patientData.t_category || '',
        n_category: patientData.n_category || '',
        m_category: patientData.m_category || '',
        followup_date: patientData.followup_date || '',
        vital_status: patientData.vital_status || '',
        cause_of_death_icd11: patientData.cause_of_death_icd11 || '',
        recurrence: patientData.recurrence || false,
        recurrence_date: patientData.recurrence_date || '',
        metastasis: patientData.metastasis || false,
        survival_months: patientData.survival_months || undefined,
        followup_notes: patientData.followup_notes || '',
      });
      setShowEditForm(true);
    } catch (error) {
      const errorMsg = getErrorMessage(error);
      alert(`Failed to load patient data for editing: ${errorMsg}`);
    }
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/auth/login');
  };

  // Set mounted state to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // AGGRESSIVE AUTH CHECK - Force login on every page visit
  // Clear tokens and redirect to login when switching dashboards
  useEffect(() => {
    if (!mounted) return;
    
    const checkAuth = async () => {
      // Check if user is switching from another dashboard
      // If yes, clear tokens to force re-login
      const isSwitching = checkDashboardSwitch('/hospital');
      
      // Clear all cache
      clearNonEssentialCache();
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      // If no token or switching dashboards, redirect to login immediately
      if (!token || isSwitching) {
        router.push('/auth/login');
        return;
      }
      
      // Verify token is valid by calling getMe()
      try {
        await authApi.getMe();
      } catch (error) {
        // Token invalid or expired - clear and redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        router.push('/auth/login');
      }
    };
    
    checkAuth();
  }, [router, mounted]);

  // Show ALL patients from this hospital (backend already filters by organization_id)
  // Include bulk CSV uploads, manual entries, web entries, and all other records
  const hospitalPatients = Array.isArray(patients) ? patients : [];
  
  // Apply followup filters
  const filteredPatients = hospitalPatients.filter((p: Patient) => {
    // Apply followup filter
    if (followupFilter === 'has_followup') {
      // Has followup date or followup notes
      if (!p.followup_date && !p.followup_notes) {
        return false;
      }
    } else if (followupFilter === 'needs_followup') {
      // Needs followup: has diagnosis date but no followup date
      if (p.diagnosis_date && !p.followup_date) {
        return true;
      }
      return false;
    } else if (followupFilter === 'overdue') {
      // Overdue: has followup date in the past or followup interval passed
      if (p.followup_date) {
        const followupDate = new Date(p.followup_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (followupDate < today) {
          return true;
        }
      }
      if (p.survival_months && p.diagnosis_date) {
        const diagnosisDate = new Date(p.diagnosis_date);
        const nextFollowup = new Date(diagnosisDate);
        nextFollowup.setMonth(nextFollowup.getMonth() + p.survival_months);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (nextFollowup < today) {
          return true;
        }
      }
      return false;
    }
    
    // Apply followup date filter
    if (followupDateFilter && p.followup_date) {
      const followupDate = new Date(p.followup_date).toISOString().split('T')[0];
      if (followupDate !== followupDateFilter) {
        return false;
      }
    }
    
    return true;
  });
  
  // State for showing more records (pagination-like)
  const [showAllNewPatients, setShowAllNewPatients] = useState(false);
  
  const displayedNewPatients = showAllNewPatients ? filteredPatients : filteredPatients.slice(0, 5);

  // Calculate statistics based on hospital patients
  // Show actual total from API, not just loaded patients
  const totalPatients = patientsResponse?.total || hospitalPatients.length;
  const loadedPatients = hospitalPatients.length;
  const thisMonthPatients = hospitalPatients.filter((p: Patient) => {
    const created = new Date(p.entry_timestamp || '');
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;
  const pendingValidation = hospitalPatients.filter((p: Patient) => p.validation_status === 'Pending').length;

  // Chart data based on hospital patients
  const monthlyData = hospitalPatients.reduce((acc: any, p: Patient) => {
    const date = new Date(p.entry_timestamp || p.diagnosis_date || '');
    const month = date.toLocaleString('default', { month: 'short' });
    const existing = acc.find((item: any) => item.month === month);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ month, count: 1 });
    }
    return acc;
  }, []).slice(-6);

  // Don't render until authenticated
  if (!mounted) {
    return null;
  }

  // Block rendering if no token
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (!token) {
    return null; // Will redirect to login
  }

  return (
    <div className={cn('min-h-screen relative overflow-hidden', designTokens.colors.background.gradient)}>
      {/* Subtle background pattern */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(rgba(15, 23, 42, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(15, 23, 42, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Professional Header */}
      <Header
        title="University Malaya Medical Centre Cancer Registry"
        subtitle={mounted && userData?.email ? userData.email : 'Registrar'}
        icon={<FileText className="w-6 h-6 text-white" />}
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<User className="w-4 h-4" />}
              onClick={() => setShowProfile(true)}
              title="View Profile"
            >
              Profile
            </Button>
            <Button variant="secondary" size="sm" icon={<LogOut className="w-4 h-4" />} onClick={handleLogout}>
              Logout
            </Button>
          </>
        }
      />

      <div className={cn('container mx-auto', designTokens.spacing.container, designTokens.spacing.section, 'relative z-10')}>
        {/* Stats Cards with 3D effects */}
        <div className={cn('grid grid-cols-1 md:grid-cols-3', designTokens.spacing.gap.lg, 'mb-8')} style={{ perspective: '1000px' }}>
          <div onClick={() => {/* No onClick for first card */}}>
            <StatCard
              icon={Users}
              label="Total Patients"
              value={totalPatients}
              change={loadedPatients < totalPatients ? `Showing ${loadedPatients} of ${totalPatients} (use search to find more)` : `All ${totalPatients} patients loaded`}
              gradient="info"
              trend="up"
              index={0}
            />
          </div>
          <div onClick={() => {/* No onClick for second card */}}>
            <StatCard
              icon={Calendar}
              label="This Month"
              value={thisMonthPatients}
              change="New registrations"
              gradient="primary"
              trend="up"
              index={1}
            />
          </div>
          <div onClick={() => setShowAIRAGUpload(true)} className="cursor-pointer">
            <StatCard
              icon={Brain}
              label="AI & RAG Data Processor"
              value="Ready"
              change="Process unstructured documents"
              gradient="primary"
              trend="neutral"
              index={2}
            />
          </div>
        </div>

        {/* Analytics Dashboard - Smart Graphs & Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          {/* AnalyticsDashboard removed - analytics endpoints removed */}
        </motion.div>

        {/* Actions Bar with 3D effect */}
        <motion.div 
          className="p-6 rounded-3xl mb-6 backdrop-blur-xl border border-cyan-500/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
          whileHover={{ scale: 1.01 }}
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full lg:w-auto flex gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patients by name, ID, or ICD code..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={followupFilter}
                  onChange={(e) => setFollowupFilter(e.target.value as any)}
                  className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="all">All Patients</option>
                  <option value="has_followup">Has Followup</option>
                  <option value="needs_followup">Needs Followup</option>
                  <option value="overdue">Overdue Followup</option>
                </select>
                <input
                  type="date"
                  value={followupDateFilter}
                  onChange={(e) => setFollowupDateFilter(e.target.value)}
                  placeholder="Filter by followup date"
                  className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                {followupDateFilter && (
                  <button
                    onClick={() => setFollowupDateFilter('')}
                    className="px-3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    title="Clear date filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <motion.button
                onClick={() => setShowBulkUpload(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold flex items-center gap-2 shadow-md hover:bg-green-700 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Bulk Upload CSV
              </motion.button>
              <motion.a
                href="/create-patient.html"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                New Patient
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Monthly Trend Chart */}
        {monthlyData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-2xl mb-8 shadow-md border border-slate-200/60"
          >
            <h3 className="font-bold text-xl mb-4 text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Monthly Patient Registrations
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Create Patient Form Modal */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm p-4"
          >
            <div className="min-h-screen flex items-center justify-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass-strong w-full max-w-5xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gradient">Create New Patient</h2>
                    <p className="text-gray-700 mt-1">Register a new cancer patient record</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-700" />
                  </button>
                </div>

                {/* Open HTML Form Button */}
                <div className="mb-6">
                  <motion.a
                    href="/create-patient"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-button py-3 px-6 rounded-xl font-semibold text-white flex items-center gap-2 shadow-lg inline-block"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus className="w-5 h-5 text-white" />
                    Open Patient Creation Form (HTML)
                  </motion.a>
                </div>

                {/* Patient Form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    
                    // Validate required fields
                    if (!formData.patient_name || !formData.diagnosis_date || !formData.icd11_main_code) {
                      alert('Please fill in all required fields: Patient Name, Diagnosis Date, and ICD-11 Main Code');
                      return;
                    }

                    // Prepare form data
                    const submitData: PatientCreate = {
                      patient_id: formData.patient_id || undefined,
                      patient_name: formData.patient_name,
                      gender: formData.gender || undefined,
                      date_of_birth: formData.date_of_birth || undefined,
                      nationality: formData.nationality || undefined,
                      diagnosis_date: formData.diagnosis_date,
                      icd11_main_code: formData.icd11_main_code,
                      icd11_description: formData.icd11_description || undefined,
                      icd11_composite_expression: formData.icd11_composite_expression || undefined,
                      icd11_topography_code: formData.icd11_topography_code || undefined,
                      icd11_topography: formData.icd11_topography || undefined,
                      icd11_morphology_code: formData.icd11_morphology_code || undefined,
                      icd11_morphology: formData.icd11_morphology || undefined,
                      icd11_behavior_code: formData.icd11_behavior_code || undefined,
                      icd11_stage_code: formData.icd11_stage_code || undefined,
                      laterality: formData.laterality || undefined,
                      t_category: formData.t_category || undefined,
                      n_category: formData.n_category || undefined,
                      m_category: formData.m_category || undefined,
                      followup_date: formData.followup_date || undefined,
                      vital_status: formData.vital_status || undefined,
                      cause_of_death_icd11: formData.cause_of_death_icd11 || undefined,
                      recurrence: formData.recurrence || undefined,
                      recurrence_date: formData.recurrence_date || undefined,
                      metastasis: formData.metastasis || undefined,
                      survival_months: formData.survival_months || undefined,
                      followup_notes: formData.followup_notes || undefined,
                    };

                    createMutation.mutate(submitData);
                  }}
                  className="space-y-6"
                >
                  {/* Demographics */}
                  <div className="glass-card p-4 rounded-xl">
                    <h3 className="font-semibold text-base mb-3 text-gray-900">Patient Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Patient ID *</label>
                        <input
                          type="text"
                          value={formData.patient_id || ''}
                          onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Patient Name *</label>
                        <input
                          type="text"
                          value={formData.patient_name || ''}
                          onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Gender</label>
                        <select
                          value={formData.gender || ''}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                        >
                          <option value="">Select...</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Date of Birth</label>
                        <input
                          type="date"
                          value={formData.date_of_birth || ''}
                          onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Nationality</label>
                        <input
                          type="text"
                          value={formData.nationality || ''}
                          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Diagnosis Date *</label>
                        <input
                          type="date"
                          value={formData.diagnosis_date || ''}
                          onChange={(e) => setFormData({ ...formData, diagnosis_date: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* ICD-11 Fields (Auto-filled but editable) */}
                  <div className="glass-card p-4 rounded-xl">
                    <h3 className="font-semibold text-base mb-3 text-gray-900">ICD-11 Details (Auto-filled)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Main Code *</label>
                        <input
                          type="text"
                          value={formData.icd11_main_code || ''}
                          onChange={(e) => setFormData({ ...formData, icd11_main_code: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-gray-900 font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Description</label>
                        <input
                          type="text"
                          value={formData.icd11_description || ''}
                          onChange={(e) => setFormData({ ...formData, icd11_description: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Topography</label>
                        <input
                          type="text"
                          value={formData.icd11_topography || ''}
                          onChange={(e) => setFormData({ ...formData, icd11_topography: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">Morphology</label>
                        <input
                          type="text"
                          value={formData.icd11_morphology || ''}
                          onChange={(e) => setFormData({ ...formData, icd11_morphology: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* TNM Staging */}
                  <div className="glass-card p-4 rounded-xl">
                    <h3 className="font-semibold text-base mb-3 text-gray-900">TNM Staging</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">T Category</label>
                        <input
                          type="text"
                          value={formData.t_category || ''}
                          onChange={(e) => setFormData({ ...formData, t_category: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                          placeholder="T1, T2..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">N Category</label>
                        <input
                          type="text"
                          value={formData.n_category || ''}
                          onChange={(e) => setFormData({ ...formData, n_category: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                          placeholder="N0, N1..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">M Category</label>
                        <input
                          type="text"
                          value={formData.m_category || ''}
                          onChange={(e) => setFormData({ ...formData, m_category: e.target.value })}
                          className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                          placeholder="M0, M1..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <motion.button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        resetForm();
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 glass-card py-3.5 rounded-xl font-semibold text-gray-700"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={resetForm}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 glass-card py-3.5 rounded-xl font-semibold text-gray-700"
                    >
                      Clear Form
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={createMutation.isPending || !formData.patient_name || !formData.diagnosis_date || !formData.icd11_main_code}
                      whileHover={{ scale: (createMutation.isPending || !formData.patient_name || !formData.diagnosis_date || !formData.icd11_main_code) ? 1 : 1.02 }}
                      whileTap={{ scale: (createMutation.isPending || !formData.patient_name || !formData.diagnosis_date || !formData.icd11_main_code) ? 1 : 0.98 }}
                      className="flex-1 glass-button py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {createMutation.isPending ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 text-white" />
                          Create Patient
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Patients List */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Patient Records</h2>
            <div className="flex items-center gap-4">
              <motion.button
                onClick={async () => {
                  // Manual refresh button for Patient Records
                  console.log('🔄 Manual refresh triggered for Patient Records...');
                  queryClient.invalidateQueries({ queryKey: ['patients'] });
                  queryClient.invalidateQueries({ queryKey: ['patients', searchQuery] });
                  queryClient.invalidateQueries({ queryKey: ['patients', ''] });
                  
                  await queryClient.refetchQueries({ queryKey: ['patients'] });
                  await queryClient.refetchQueries({ queryKey: ['patients', searchQuery] });
                  
                  setTimeout(() => {
                    const currentPatients = queryClient.getQueryData(['patients', searchQuery]) as any;
                    const currentNewCount = currentPatients?.items 
                      ? currentPatients.items.filter((p: Patient) => {
                          const em = (p.entry_mode || '').toString().toLowerCase();
                          const ds = (p.data_source || '').toString().toLowerCase();
                          return (em === 'web' || em === 'manual' || ds === 'manual') && 
                                 !em.includes('bulk') && !ds.includes('bulk') && 
                                 em !== 'ai' && ds !== 'ai';
                        }).length
                      : 0;
                    alert(`Data refreshed!\n\nTotal patients: ${currentPatients?.items?.length || 0}\nHospital patient records: ${currentNewCount}\n\nPatient Records section updated.`);
                  }, 500);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold flex items-center gap-2 shadow-md hover:bg-blue-700 transition-colors text-sm"
                title="Refresh to see latest patients from HTML form"
              >
                <Download className="w-4 h-4 rotate-180" />
                Refresh
              </motion.button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-semibold">{displayedNewPatients.length}</span>
                {filteredPatients.length > 5 && (
                  <>
                    <span>of</span>
                    <span className="font-semibold">{filteredPatients.length}</span>
                  </>
                )}
                <span>patients</span>
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-700">Loading patient records...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              {searchQuery && (
                <p className="text-cyan-200/70 text-sm">
                  No patients found matching your search
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b-2 border-cyan-400/30">
                      <th className="text-left py-4 px-4 font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Patient ID</th>
                      <th className="text-left py-4 px-4 font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Name</th>
                      <th className="text-left py-4 px-4 font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">ICD-11 Code</th>
                      <th className="text-left py-4 px-4 font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Diagnosis Date</th>
                      <th className="text-left py-4 px-4 font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Status</th>
                      <th className="text-left py-4 px-4 font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedNewPatients.map((patient: Patient, index: number) => (
                    <motion.tr
                      key={patient.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors group"
                    >
                      <td className="py-4 px-4 font-mono text-sm text-slate-600">{patient.patient_id || '-'}</td>
                      <td className="py-4 px-4 font-semibold text-slate-900">{patient.patient_name}</td>
                      <td className="py-4 px-4">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-blue-200">
                          {patient.icd11_main_code}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600">{patient.diagnosis_date}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                          patient.validation_status === 'Approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                          patient.validation_status === 'Pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                          patient.validation_status === 'Rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                          'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {patient.validation_status || 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <motion.button
                            onClick={async () => {
                              try {
                                const patientData = await patientsApi.getById(patient.id!);
                                alert(`Patient Details:\n\nName: ${patientData.patient_name}\nID: ${patientData.patient_id || 'N/A'}\nICD-11: ${patientData.icd11_main_code}\nDiagnosis Date: ${patientData.diagnosis_date}\nStatus: ${patientData.validation_status || 'Pending'}`);
                              } catch (error) {
                                const errorMsg = getErrorMessage(error);
                                alert(`Failed to load patient details: ${errorMsg}`);
                              }
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors text-blue-700 hover:text-blue-800 shadow-sm"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleEditClick(patient)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors text-indigo-700 hover:text-indigo-800 shadow-sm"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredPatients.length > 5 && (
                <div className="mt-4 text-center">
                  <motion.button
                    onClick={() => setShowAllNewPatients(!showAllNewPatients)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-lg transition-all"
                  >
                    {showAllNewPatients ? `Show Less (5 of ${filteredPatients.length})` : `Show All (${filteredPatients.length} patients)`}
                  </motion.button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AI Processed Data Review Section */}
        {aiProcessedData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60 mt-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">AI Processed Data - Pending Review</h2>
                  <p className="text-sm text-slate-600">{aiProcessedData.length} records ready for review</p>
                </div>
              </div>
              <motion.button
                onClick={() => setShowAIReview(!showAIReview)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                {showAIReview ? 'Hide' : 'Review'}
              </motion.button>
            </div>

            {showAIReview && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Patient Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">ICD-11 Code</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Diagnosis Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">AI Confidence</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Source File</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-700 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiProcessedData.map((record: any, index: number) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4 px-4 font-semibold text-slate-900">{record.patient_name || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold border border-blue-200">
                            {record.icd11_main_code || 'N/A'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600">{record.diagnosis_date || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  record.ai_confidence >= 80 ? 'bg-green-500' :
                                  record.ai_confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${record.ai_confidence || 0}%` }}
                              />
                            </div>
                            <span className="text-sm text-slate-600">{record.ai_confidence || 0}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-600 text-sm">{record.source_file || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <motion.button
                              onClick={async () => {
                                try {
                                  // Approve and create patient
                                  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
                                  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
                                  
                                  const response = await fetch(`${API_BASE}/api/v1/patients/`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      ...(token && { 'Authorization': `Bearer ${token}` }),
                                    },
                                    body: JSON.stringify({
                                      ...record,
                                      validation_status: 'Pending',
                                      entry_mode: 'AI',
                                    }),
                                  });

                                  if (response.ok) {
                                    // Remove from review list
                                    setAiProcessedData(prev => prev.filter((_, i) => i !== index));
                                    alert('Patient record approved and created successfully!');
                                    queryClient.invalidateQueries({ queryKey: ['patients'] });
                                  } else {
                                    throw new Error('Failed to create patient');
                                  }
                                } catch (error) {
                                  const errorMsg = getErrorMessage(error);
                                  alert(`Error approving record: ${errorMsg}`);
                                }
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 hover:bg-green-50 rounded-lg transition-colors text-green-600 hover:text-green-700"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => {
                                // Reject - remove from list
                                setAiProcessedData(prev => prev.filter((_, i) => i !== index));
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600 hover:text-red-700"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => {
                                // View details
                                alert(`Patient Details:\n\n${JSON.stringify(record, null, 2)}`);
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* AI RAG Upload Modal */}
      {showAIRAGUpload && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm p-4"
        >
          <div className="min-h-screen flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-4xl rounded-2xl p-8 shadow-xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Brain className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">AI Document Processing</h2>
                    <p className="text-sm text-slate-600">Upload unstructured documents for AI extraction</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAIRAGUpload(false);
                    setAiUploadFiles([]);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-slate-700">
                  Upload Documents (PDF, Images, Clinical Notes, DOC)
                </label>
                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                    const files = Array.from(e.dataTransfer.files);
                    handleAIFileUpload(files);
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.multiple = true;
                    input.accept = '.pdf,.png,.jpg,.jpeg,.doc,.docx,.txt';
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || []);
                      handleAIFileUpload(files);
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium mb-1">Drag & drop files here or click to browse</p>
                  <p className="text-xs text-slate-500">Supports: PDF, PNG, JPG, DOC, DOCX, TXT</p>
                </div>

                {aiUploadFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {aiUploadFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {file.type.startsWith('image/') ? (
                            <ImageIcon className="w-5 h-5 text-blue-600" />
                          ) : file.type === 'application/pdf' ? (
                            <FileTextIcon className="w-5 h-5 text-red-600" />
                          ) : (
                            <FileText className="w-5 h-5 text-slate-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-900">{file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setAiUploadFiles(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <motion.button
                  onClick={() => {
                    setShowAIRAGUpload(false);
                    setAiUploadFiles([]);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleAIProcess}
                  disabled={aiUploadFiles.length === 0 || aiProcessing}
                  whileHover={{ scale: aiUploadFiles.length === 0 || aiProcessing ? 1 : 1.02 }}
                  whileTap={{ scale: aiUploadFiles.length === 0 || aiProcessing ? 1 : 0.98 }}
                  className="flex-1 px-6 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {aiProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5" />
                      Process with AI
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Bulk CSV Upload Modal */}
      {showBulkUpload && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm p-4"
        >
          <div className="min-h-screen flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white w-full max-w-4xl rounded-2xl p-8 shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <Upload className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Bulk CSV Upload</h2>
                    <p className="text-sm text-slate-600">Upload multiple patients from CSV file</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowBulkUpload(false);
                    setBulkCsvFile(null);
                    setBulkUploadResult(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* CSV Format Instructions */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CSV Format Requirements
                </h3>
                <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                  <li><strong>Required columns:</strong> patient_name, diagnosis_date (YYYY-MM-DD), icd11_main_code</li>
                  <li><strong>Optional columns:</strong> All patient fields supported (50+ columns including demographics, ICD-11, TNM staging, treatment, follow-up)</li>
                  <li><strong>Date format:</strong> YYYY-MM-DD (e.g., 2025-01-15)</li>
                  <li><strong>Boolean values:</strong> true/false, 1/0, yes/no, y/n (or leave empty)</li>
                </ul>
                <div className="mt-3">
                  <a
                    href="/sample-patients.csv"
                    download
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                  >
                    Download sample CSV template
                  </a>
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-3 text-slate-700">
                  Upload CSV File
                </label>
                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors cursor-pointer"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-green-500', 'bg-green-50');
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove('border-green-500', 'bg-green-50');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-green-500', 'bg-green-50');
                    const files = Array.from(e.dataTransfer.files);
                    if (files[0] && files[0].name.endsWith('.csv')) {
                      setBulkCsvFile(files[0]);
                    } else {
                      alert('Please upload a CSV file');
                    }
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.csv';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        setBulkCsvFile(file);
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium mb-1">Drag & drop CSV file here or click to browse</p>
                  <p className="text-xs text-slate-500">Only CSV files are supported</p>
                </div>

                {bulkCsvFile && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{bulkCsvFile.name}</p>
                        <p className="text-xs text-slate-500">{(bulkCsvFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setBulkCsvFile(null)}
                      className="p-1 hover:bg-green-100 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* Upload Result */}
              {bulkUploadResult && (
                <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <h3 className="font-semibold text-slate-900 mb-3">Upload Results</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-slate-200">
                      <p className="text-2xl font-bold text-slate-900">{bulkUploadResult.total_rows}</p>
                      <p className="text-xs text-slate-600">Total Rows</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-2xl font-bold text-green-600">{bulkUploadResult.successful}</p>
                      <p className="text-xs text-green-700">Successful</p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-2xl font-bold text-red-600">{bulkUploadResult.failed}</p>
                      <p className="text-xs text-red-700">Failed</p>
                    </div>
                  </div>

                  {bulkUploadResult.failed_imports && bulkUploadResult.failed_imports.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-red-900 mb-2 text-sm">Failed Imports:</h4>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {bulkUploadResult.failed_imports.map((fail: any, index: number) => (
                          <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-xs">
                            <p className="font-semibold text-red-900">Row {fail.row}: {fail.error}</p>
                            <p className="text-red-700 mt-1">Data: {JSON.stringify(fail.data).substring(0, 100)}...</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={() => {
                    setShowBulkUpload(false);
                    setBulkCsvFile(null);
                    setBulkUploadResult(null);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
                >
                  {bulkUploadResult ? 'Close' : 'Cancel'}
                </motion.button>
                <motion.button
                  onClick={handleBulkUpload}
                  disabled={!bulkCsvFile || bulkUploading}
                  whileHover={{ scale: !bulkCsvFile || bulkUploading ? 1 : 1.02 }}
                  whileTap={{ scale: !bulkCsvFile || bulkUploading ? 1 : 0.98 }}
                  className="flex-1 px-6 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {bulkUploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload CSV
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Edit Patient Form Modal */}
      {showEditForm && editingPatient && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm p-4"
        >
          <div className="min-h-screen flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-strong w-full max-w-5xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gradient">Edit Patient</h2>
                  <p className="text-gray-600 mt-1">Update patient record: {editingPatient.patient_name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingPatient(null);
                    setIcdData(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-700" />
                </button>
              </div>

              {/* Patient Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingPatient.id) {
                    updateMutation.mutate({ id: editingPatient.id, data: formData as Partial<PatientCreate> });
                  }
                }}
                className="space-y-6"
              >
                {/* Demographics */}
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">1</span>
                    Patient Demographics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Patient ID</label>
                      <input
                        type="text"
                        value={formData.patient_id || ''}
                        onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Patient Name *</label>
                      <input
                        type="text"
                        value={formData.patient_name || ''}
                        onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Gender</label>
                      <select
                        value={formData.gender || ''}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.date_of_birth || ''}
                        onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Nationality</label>
                      <input
                        type="text"
                        value={formData.nationality || ''}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Diagnosis Date *</label>
                      <input
                        type="date"
                        value={formData.diagnosis_date || ''}
                        onChange={(e) => setFormData({ ...formData, diagnosis_date: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* ICD-11 Fields */}
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">2</span>
                    ICD-11 Coding
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Main Code *</label>
                      <input
                        type="text"
                        value={formData.icd11_main_code || ''}
                        onChange={(e) => setFormData({ ...formData, icd11_main_code: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900 font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Description</label>
                      <input
                        type="text"
                        value={formData.icd11_description || ''}
                        onChange={(e) => setFormData({ ...formData, icd11_description: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Topography</label>
                      <input
                        type="text"
                        value={formData.icd11_topography || ''}
                        onChange={(e) => setFormData({ ...formData, icd11_topography: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Morphology</label>
                      <input
                        type="text"
                        value={formData.icd11_morphology || ''}
                        onChange={(e) => setFormData({ ...formData, icd11_morphology: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* TNM Staging */}
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">TNM Staging</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">T Category</label>
                      <input
                        type="text"
                        value={formData.t_category || ''}
                        onChange={(e) => setFormData({ ...formData, t_category: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                        placeholder="T1, T2..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">N Category</label>
                      <input
                        type="text"
                        value={formData.n_category || ''}
                        onChange={(e) => setFormData({ ...formData, n_category: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                        placeholder="N0, N1..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">M Category</label>
                      <input
                        type="text"
                        value={formData.m_category || ''}
                        onChange={(e) => setFormData({ ...formData, m_category: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                        placeholder="M0, M1..."
                      />
                    </div>
                  </div>
                </div>

                {/* Follow-up Section */}
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">4</span>
                    Follow-up Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Follow-up Date</label>
                      <input
                        type="date"
                        value={formData.followup_date || ''}
                        onChange={(e) => setFormData({ ...formData, followup_date: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Vital Status</label>
                      <select
                        value={formData.vital_status || ''}
                        onChange={(e) => setFormData({ ...formData, vital_status: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                      >
                        <option value="">Select...</option>
                        <option value="Alive">Alive</option>
                        <option value="Dead">Dead</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Cause of Death (ICD-11)</label>
                      <input
                        type="text"
                        value={formData.cause_of_death_icd11 || ''}
                        onChange={(e) => setFormData({ ...formData, cause_of_death_icd11: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                        placeholder="ICD-11 code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Survival (Months)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.survival_months || ''}
                        onChange={(e) => setFormData({ ...formData, survival_months: e.target.value ? parseInt(e.target.value) : undefined })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                        placeholder="e.g., 12"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Recurrence</label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.recurrence || false}
                            onChange={(e) => setFormData({ ...formData, recurrence: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                          <span className="text-gray-700">Recurrence occurred</span>
                        </label>
                        {formData.recurrence && (
                          <div className="flex-1">
                            <input
                              type="date"
                              value={formData.recurrence_date || ''}
                              onChange={(e) => setFormData({ ...formData, recurrence_date: e.target.value })}
                              className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                              placeholder="Recurrence date"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.metastasis || false}
                          onChange={(e) => setFormData({ ...formData, metastasis: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                        />
                        <span className="text-gray-700 font-semibold">Metastasis occurred</span>
                      </label>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold mb-2 text-gray-700">Follow-up Notes</label>
                      <textarea
                        value={formData.followup_notes || ''}
                        onChange={(e) => setFormData({ ...formData, followup_notes: e.target.value })}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900 min-h-[100px]"
                        placeholder="Additional follow-up information..."
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingPatient(null);
                      setIcdData(null);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 glass-card py-3.5 rounded-xl font-semibold text-gray-700"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    disabled={updateMutation.isPending}
                    whileHover={{ scale: updateMutation.isPending ? 1 : 1.02 }}
                    whileTap={{ scale: updateMutation.isPending ? 1 : 0.98 }}
                    className="flex-1 glass-button py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 text-white" />
                        Update Patient
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={userData}
      />

    </div>
  );
}
