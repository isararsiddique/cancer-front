'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, AlertCircle, CheckCircle, LogIn, UserPlus, X, RefreshCw } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { researchApi, ResearchRequestCreate } from '@/lib/api/research';
import { authApi } from '@/lib/api/auth';
import Link from 'next/link';

// No ICD-11 codes needed - using keyword search instead

export default function CreateResearchRequest() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [manualCount, setManualCount] = useState<number | null>(null);
  const [selectedCancerTypes, setSelectedCancerTypes] = useState<string[]>([]);
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [formData, setFormData] = useState<ResearchRequestCreate>({
    researcher_name: '',
    researcher_email: '',
    researcher_affiliation: '',
    purpose_of_study: '',
    icd11_main_code: '',
    icd11_description: '',
    diagnosis_year_from: undefined,
    diagnosis_year_to: undefined,
    age_from: undefined,
    age_to: undefined,
    gender: '',
    t_category: '',
    n_category: '',
    m_category: '',
    icd11_morphology_code: '',
    icd11_topography_code: '',
    surgery_done: undefined,
    chemotherapy_done: undefined,
    radiotherapy_done: undefined,
    hormonal_therapy: undefined,
    immunotherapy: undefined,
    recurrence: undefined,
    metastasis: undefined,
    vital_status: '',
    treatment_intent: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: ResearchRequestCreate) => researchApi.createRequest(data),
    onSuccess: (data) => {
      // Store success message in sessionStorage to show on next page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('research_request_success', JSON.stringify({
          request_id: data.request_id,
          message: data.message || 'Research request created successfully!',
          estimated_record_count: data.estimated_record_count,
          privacy_warning: data.privacy_warning,
        }));
      }
      // Redirect to research dashboard
      router.push('/research');
    },
  });

  // Fetch filter options (available cancer types and years)
  const { data: filterOptions, isLoading: filterOptionsLoading, refetch: refetchFilterOptions } = useQuery({
    queryKey: ['research-filter-options'],
    queryFn: () => researchApi.getFilterOptions(),
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Check if user is authenticated (optional - allow viewing form without auth)
  const { data: userData } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => authApi.getMe(),
    retry: false,
    refetchOnWindowFocus: false,
    enabled: false, // Don't auto-fetch, only fetch when needed
  });

  // Check authentication status on mount and restore form data
  useEffect(() => {
    const checkAuth = async () => {
      // First, check if there's saved form data from before signup/login
      if (typeof window !== 'undefined') {
        const savedFormData = localStorage.getItem('pending_research_request');
        if (savedFormData) {
          try {
            const parsed = JSON.parse(savedFormData);
            setFormData(prev => ({ ...prev, ...parsed }));
            // Clear saved data after restoring
            localStorage.removeItem('pending_research_request');
          } catch (e) {
            console.error('Failed to restore form data:', e);
          }
        }
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // Try to get user data silently
        const user = await authApi.getMe();
        setIsAuthenticated(true);
        // Auto-fill user data
        if (user && !formData.researcher_email) {
          setFormData(prev => ({
            ...prev,
            researcher_email: user.email,
            researcher_name: user.full_name || '',
          }));
        }
      } catch (error) {
        setIsAuthenticated(false);
        // Clear invalid tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
    };

    checkAuth();
  }, []);

  // Update form data when selected cancer types change
  useEffect(() => {
    if (selectedCancerTypes.length > 0) {
      // Join multiple ICD-11 codes with comma for backend
      setFormData(prev => ({
        ...prev,
        icd11_main_code: selectedCancerTypes.join(','),
        icd11_description: undefined, // Clear description when using ICD codes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        icd11_main_code: undefined,
      }));
    }
  }, [selectedCancerTypes]);

  // Auto-estimate count when filters change
  useEffect(() => {
    const estimateCount = async () => {
      // Check if ALL_CANCER_TYPES or ALL_DATA is selected
      const isAllCancerTypes = selectedCancerTypes.includes('ALL_CANCER_TYPES');
      const isAllData = formData.icd11_main_code === 'ALL_DATA';
      
      // Only estimate if we have at least one filter OR if ALL_CANCER_TYPES/ALL_DATA is selected
      const hasFilters = 
        isAllCancerTypes ||
        isAllData ||
        selectedCancerTypes.length > 0 ||
        formData.diagnosis_year_from ||
        formData.diagnosis_year_to ||
        formData.age_from ||
        formData.age_to ||
        formData.gender;

      if (!hasFilters) {
        setEstimatedCount(null);
        return;
      }

      setIsEstimating(true);
      try {
        // Build filter data with selected cancer types
        // If ALL_CANCER_TYPES is selected, use that instead of joining codes
        const filterData = {
          ...formData,
          icd11_main_code: isAllCancerTypes 
            ? 'ALL_CANCER_TYPES' 
            : (selectedCancerTypes.length > 0 && !isAllCancerTypes 
                ? selectedCancerTypes.filter(c => c !== 'ALL_CANCER_TYPES').join(',') 
                : formData.icd11_main_code),
        };
        const count = await researchApi.estimateCount(filterData);
        setEstimatedCount(count);
      } catch (error) {
        console.error('Failed to estimate count:', error);
        setEstimatedCount(null);
      } finally {
        setIsEstimating(false);
      }
    };

    // Debounce the estimation
    const timeoutId = setTimeout(estimateCount, 500);
    return () => clearTimeout(timeoutId);
  }, [formData, selectedCancerTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication before submitting
    if (isAuthenticated === false) {
      // Show signup/login prompt modal
      setShowAuthPrompt(true);
      return;
    }

    // If still checking, wait
    if (isAuthenticated === null) {
      // Double-check authentication
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        setIsAuthenticated(false);
        setShowAuthPrompt(true);
        return;
      }
    }

    // Validate that at least one cancer type is selected OR all data/cancer types is requested
    if (selectedCancerTypes.length === 0 && 
        formData.icd11_main_code !== 'ALL_DATA' && 
        formData.icd11_main_code !== 'ALL_CANCER_TYPES') {
      alert('Please select at least one cancer type, choose "All Cancer Types", or select "All Data" option.');
      return;
    }

    // Clean up undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(formData).filter(([_, v]) => v !== '' && v !== undefined)
    ) as ResearchRequestCreate;
    
    // Add manual count if provided, otherwise use estimated count
    if (manualCount !== null && manualCount >= 0) {
      (cleanedData as any).manual_record_count = manualCount;
    } else if (estimatedCount !== null && estimatedCount >= 0) {
      (cleanedData as any).manual_record_count = estimatedCount;
    }
    
    createMutation.mutate(cleanedData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 p-8">
      <div className="container mx-auto max-w-4xl">
        <motion.button
          onClick={() => router.back()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mb-6 glass-card px-4 py-2 rounded-xl text-gray-700 hover:bg-white/20 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-8"
        >
          <h1 className="text-3xl font-bold text-gradient mb-6">Create Research Request</h1>

          {createMutation.error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50/90 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700">
                  {(createMutation.error as any)?.response?.data?.detail || 'Failed to create request'}
                </p>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Researcher Info */}
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="font-bold text-lg mb-4 text-gray-900">Researcher Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Name *</label>
                  <input
                    type="text"
                    value={formData.researcher_name}
                    onChange={(e) => setFormData({ ...formData, researcher_name: e.target.value })}
                    className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={formData.researcher_email}
                    onChange={(e) => setFormData({ ...formData, researcher_email: e.target.value })}
                    className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Affiliation</label>
                  <input
                    type="text"
                    value={formData.researcher_affiliation || ''}
                    onChange={(e) => setFormData({ ...formData, researcher_affiliation: e.target.value })}
                    className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Purpose of Study *</label>
                  <textarea
                    value={formData.purpose_of_study}
                    onChange={(e) => setFormData({ ...formData, purpose_of_study: e.target.value })}
                    className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                    rows={4}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900">Data Filters</h3>
                <motion.button
                  type="button"
                  onClick={() => refetchFilterOptions()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Refresh filter options to see latest data"
                >
                  <RefreshCw className={`w-4 h-4 ${filterOptionsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </motion.button>
              </div>
              
              {/* All Data Option */}
              <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="all-data"
                    checked={formData.icd11_main_code === 'ALL_DATA'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({
                          ...prev,
                          icd11_main_code: 'ALL_DATA',
                          icd11_description: 'All Data - No Filters',
                          diagnosis_year_from: undefined,
                          diagnosis_year_to: undefined,
                          age_from: undefined,
                          age_to: undefined,
                          gender: undefined,
                          t_category: undefined,
                          n_category: undefined,
                          m_category: undefined,
                        }));
                        setSelectedCancerTypes([]);
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          icd11_main_code: undefined,
                          icd11_description: undefined,
                        }));
                      }
                    }}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="all-data" className="text-base font-bold text-gray-900 cursor-pointer flex-1">
                    Request All Data (No Filters)
                  </label>
                </div>
                <p className="text-sm text-gray-600 mt-2 ml-8">
                  Select this option to request all anonymized data without any filters. This will include all cancer types, all years, and all patient records.
                </p>
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold text-md text-gray-800 mb-2">Or Apply Specific Filters:</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cancer Type Multi-Select */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Cancer Type(s) * <span className="text-xs font-normal text-gray-500">(Select one or more, or "All Cancer Types")</span>
                  </label>
                  {filterOptionsLoading ? (
                    <div className="glass-input w-full px-4 py-3 rounded-xl text-gray-500 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading available cancer types...
                    </div>
                  ) : filterOptions?.cancer_types && filterOptions.cancer_types.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          id="all-cancer-types"
                          checked={selectedCancerTypes.includes('ALL_CANCER_TYPES')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCancerTypes(['ALL_CANCER_TYPES']);
                              setFormData(prev => ({
                                ...prev,
                                icd11_main_code: 'ALL_CANCER_TYPES',
                                icd11_description: 'All Cancer Types'
                              }));
                            } else {
                              setSelectedCancerTypes([]);
                              setFormData(prev => ({
                                ...prev,
                                icd11_main_code: undefined,
                                icd11_description: undefined
                              }));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="all-cancer-types" className="text-sm font-semibold text-gray-700 cursor-pointer">
                          All Cancer Types (Request all available cancer types)
                        </label>
                      </div>
                      <select
                        multiple
                        value={selectedCancerTypes.filter(c => c !== 'ALL_CANCER_TYPES')}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          if (selected.length > 0) {
                            setSelectedCancerTypes(selected);
                            setFormData(prev => ({
                              ...prev,
                              icd11_main_code: selected.join(','),
                              icd11_description: undefined
                            }));
                          }
                        }}
                        disabled={selectedCancerTypes.includes('ALL_CANCER_TYPES')}
                        className="glass-input w-full px-4 py-3 rounded-xl text-gray-900 min-h-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                        size={5}
                      >
                        {filterOptions.cancer_types.map((type) => (
                          <option key={type.icd11_code} value={type.icd11_code}>
                            {type.icd11_code} - {type.description} ({type.patient_count} records)
                          </option>
                        ))}
                      </select>
                      {selectedCancerTypes.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedCancerTypes.map((code) => {
                            if (code === 'ALL_CANCER_TYPES') {
                              return (
                                <span
                                  key={code}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium font-semibold"
                                >
                                  All Cancer Types
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCancerTypes([]);
                                      setFormData(prev => ({
                                        ...prev,
                                        icd11_main_code: undefined,
                                        icd11_description: undefined
                                      }));
                                    }}
                                    className="hover:bg-purple-200 rounded-full p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              );
                            }
                            const type = filterOptions.cancer_types.find(t => t.icd11_code === code);
                            return (
                              <span
                                key={code}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"
                              >
                                {code} - {type?.description}
                                <button
                                  type="button"
                                  onClick={() => setSelectedCancerTypes(prev => prev.filter(c => c !== code))}
                                  className="hover:bg-blue-200 rounded-full p-0.5"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-xs text-gray-600 mt-1">
                        Hold Ctrl/Cmd to select multiple cancer types. Only cancer types with available data are shown.
                      </p>
                    </div>
                  ) : (
                    <div className="glass-input w-full px-4 py-3 rounded-xl text-gray-500">
                      No cancer type data available
                    </div>
                  )}
                </div>
                
                {/* Year From */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Year From</label>
                  {filterOptionsLoading ? (
                    <div className="glass-input w-full px-4 py-3 rounded-xl text-gray-500">Loading...</div>
                  ) : filterOptions?.years && filterOptions.years.length > 0 ? (
                    <select
                      value={formData.diagnosis_year_from || ''}
                      onChange={(e) => setFormData({ ...formData, diagnosis_year_from: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                    >
                      <option value="">Select year...</option>
                      {filterOptions.years.map((year) => (
                        <option key={year.year} value={year.year}>
                          {year.year} ({year.patient_count} records)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={formData.diagnosis_year_from || ''}
                      onChange={(e) => setFormData({ ...formData, diagnosis_year_from: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                      placeholder="Enter year..."
                    />
                  )}
                </div>
                
                {/* Year To */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Year To</label>
                  {filterOptionsLoading ? (
                    <div className="glass-input w-full px-4 py-3 rounded-xl text-gray-500">Loading...</div>
                  ) : filterOptions?.years && filterOptions.years.length > 0 ? (
                    <select
                      value={formData.diagnosis_year_to || ''}
                      onChange={(e) => setFormData({ ...formData, diagnosis_year_to: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                    >
                      <option value="">Select year...</option>
                      {filterOptions.years.map((year) => (
                        <option key={year.year} value={year.year}>
                          {year.year} ({year.patient_count} records)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      value={formData.diagnosis_year_to || ''}
                      onChange={(e) => setFormData({ ...formData, diagnosis_year_to: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                      placeholder="Enter year..."
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Age From</label>
                  <input
                    type="number"
                    value={formData.age_from || ''}
                    onChange={(e) => setFormData({ ...formData, age_from: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Age To</label>
                  <input
                    type="number"
                    value={formData.age_to || ''}
                    onChange={(e) => setFormData({ ...formData, age_to: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Gender</label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value || undefined })}
                    className="glass-input w-full px-4 py-3 rounded-xl text-gray-900"
                  >
                    <option value="">Any</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Record Count */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 rounded-2xl"
            >
              <h3 className="font-bold text-lg mb-4 text-gray-900">Estimated Record Count</h3>
              <div className="space-y-4">
                {/* Auto-estimated count */}
                {isEstimating ? (
                  <div className="flex items-center gap-2 text-gray-600">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Calculating estimated count...</span>
                  </div>
                ) : estimatedCount !== null ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Auto-Estimated Count</p>
                        <p className="text-2xl font-bold text-blue-700 mt-1">{estimatedCount.toLocaleString()}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          Based on current filters and available data
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-sm text-gray-600">
                      Select filters above to see estimated record count
                    </p>
                  </div>
                )}

                {/* Manual override option */}
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Manual Override (Optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      value={manualCount || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseInt(e.target.value) : null;
                        setManualCount(value);
                      }}
                      placeholder="Enter manual count if different"
                      className="glass-input flex-1 px-4 py-3 rounded-xl text-gray-900"
                    />
                    {manualCount !== null && (
                      <button
                        type="button"
                        onClick={() => setManualCount(null)}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Clear
                    </button>
                  )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {estimatedCount !== null 
                      ? `Auto-estimated: ${estimatedCount.toLocaleString()} records. Override if you have a different estimate.`
                      : 'You can manually enter an estimated count if needed.'}
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="flex gap-3">
              <motion.button
                type="button"
                onClick={() => router.back()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 glass-card py-3.5 rounded-xl font-semibold text-gray-700"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                disabled={createMutation.isPending}
                whileHover={{ scale: createMutation.isPending ? 1 : 1.02 }}
                whileTap={{ scale: createMutation.isPending ? 1 : 0.98 }}
                className="flex-1 glass-button py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Submit Request
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Authentication Prompt Modal */}
      {showAuthPrompt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowAuthPrompt(false)}
        >
          <div className="min-h-screen flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-3xl p-8 max-w-md w-full text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gradient mb-4">Sign Up Required</h2>
              <p className="text-gray-700 mb-8">
                To submit your research data request, please sign up as a researcher or login if you already have an account.
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/research/signup">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Save form data to localStorage before redirecting
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('pending_research_request', JSON.stringify(formData));
                      }
                    }}
                    className="w-full glass-button py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    Sign Up as Researcher
                  </motion.button>
                </Link>
                <Link href="/auth/login">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Save form data to localStorage before redirecting
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('pending_research_request', JSON.stringify(formData));
                      }
                    }}
                    className="w-full glass-card py-3.5 rounded-xl font-semibold text-gray-700 border border-white/30 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-5 h-5" />
                    Login
                  </motion.button>
                </Link>
                <motion.button
                  onClick={() => setShowAuthPrompt(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full text-gray-600 hover:text-gray-900 py-2"
                >
                  Continue filling form
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

