'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Activity, Heart, Calendar, AlertCircle } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function AnalyticsDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check authentication before making the query
  const hasToken = mounted && typeof window !== 'undefined' ? !!localStorage.getItem('access_token') : false;
  
  const { data, isLoading, error } = useQuery<any>({
    queryKey: ['anonymized-analytics'],
    queryFn: async () => {
      try {
        return await analyticsApi.getAnonymizedAnalytics();
      } catch (err: any) {
        // Better error handling with more details
        let errorMessage = 'Network Error';
        
        if (err?.response) {
          // Server responded with error
          const status = err.response.status;
          const detail = err.response.data?.detail || err.response.data?.message;
          
          if (status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
            // Clear tokens and redirect to login
            if (typeof window !== 'undefined') {
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              setTimeout(() => {
                window.location.href = '/auth/login';
              }, 2000);
            }
          } else if (status === 403) {
            errorMessage = 'Access denied. You do not have permission to view analytics.';
          } else if (status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else {
            errorMessage = detail || `HTTP ${status}: ${err.response.statusText}`;
          }
        } else if (err?.request) {
          // Request was made but no response received
          errorMessage = 'Network error: Could not reach the server. Please check if the backend is running on http://127.0.0.1:8000';
        } else if (err?.message) {
          errorMessage = err.message;
        }
        
        // Check if it's an authentication error
        if (errorMessage.includes('Authentication required') || errorMessage.includes('Not authenticated') || errorMessage.includes('log in')) {
          errorMessage = 'Authentication required. Please log in to view analytics data.';
        }
        
        console.error('Analytics API Error:', err);
        throw new Error(errorMessage);
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.message?.includes('Authentication') || error?.message?.includes('Not authenticated')) {
        return false;
      }
      return failureCount < 2;
    },
    retryDelay: 1000, // Wait 1 second between retries
    enabled: mounted && hasToken, // Only run query if mounted and user is authenticated
  });

  // Don't render until mounted to prevent hydration errors
  if (!mounted) {
    return (
      <div className="glass-card p-8 rounded-2xl">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication required message if no token
  if (!hasToken) {
    return (
      <div className="glass-card p-6 rounded-2xl border-2 border-yellow-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-yellow-900 mb-1">Authentication Required</h3>
            <p className="text-yellow-700 text-sm mb-2">Please log in to view analytics data.</p>
            <a 
              href="/auth/login" 
              className="inline-block mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="glass-card p-8 rounded-2xl">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isAuthError = errorMessage.includes('Authentication') || errorMessage.includes('Not authenticated') || errorMessage.includes('log in');
    
    return (
      <div className="glass-card p-6 rounded-2xl border-2 border-red-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-900 mb-1">Error Loading Analytics</h3>
            <p className="text-red-700 text-sm mb-2">{errorMessage}</p>
            {isAuthError ? (
              <p className="text-red-600 text-xs">Redirecting to login page...</p>
            ) : (
              <div className="mt-3">
                <p className="text-red-600 text-xs mb-2">Troubleshooting steps:</p>
                <ul className="text-red-600 text-xs list-disc list-inside space-y-1">
                  <li>Ensure you are logged in</li>
                  <li>Check that the backend is running on http://127.0.0.1:8000</li>
                  <li>Try refreshing the page</li>
                  <li>Check browser console for more details</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="glass-card p-8 rounded-2xl">
        <div className="text-center py-12">
          <p className="text-slate-600 text-lg mb-2">No analytics data available</p>
          <p className="text-slate-500 text-sm">Data will appear once patient records are added to the system.</p>
        </div>
      </div>
    );
  }

  // Ensure we have valid data structure
  const overview = data?.overview || { total_patients: 0, last_updated: new Date().toISOString() };
  const trends = data?.trends || { diagnosis_by_year: [], entry_by_year: [] };
  const distributions = data?.distributions || {
    cancer_types: [],
    age_groups: [],
    gender: [],
    tnm_staging: { t_category: [], n_category: [], m_category: [] },
  };
  const treatment = data?.treatment || {
    modalities: { surgery: 0, chemotherapy: 0, radiotherapy: 0, hormonal_therapy: 0, immunotherapy: 0 },
  };
  const outcomes = data?.outcomes || {
    vital_status: [],
    recurrence_metastasis: { recurrence: 0, metastasis: 0, total: 0 },
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Analytics Dashboard</h2>
        <p className="text-slate-600 text-sm">Comprehensive insights from anonymized patient data</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-md border border-slate-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Total Patients</p>
              <p className="text-3xl font-bold text-slate-900">{overview.total_patients.toLocaleString()}</p>
            </div>
            <Users className="w-10 h-10 text-blue-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-md border border-slate-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Surgery Cases</p>
              <p className="text-3xl font-bold text-slate-900">{treatment.modalities.surgery.toLocaleString()}</p>
            </div>
            <Activity className="w-10 h-10 text-green-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-md border border-slate-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Recurrence</p>
              <p className="text-3xl font-bold text-slate-900">{outcomes.recurrence_metastasis.recurrence.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-amber-600" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-md border border-slate-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-sm mb-1">Alive</p>
              <p className="text-3xl font-bold text-slate-900">
                {outcomes.vital_status.find((s: any) => s.status === 'Alive')?.count.toLocaleString() || '0'}
              </p>
            </div>
            <Heart className="w-10 h-10 text-red-600" />
          </div>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Diagnosis Trend Over Time */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-xl shadow-md border border-slate-200"
        >
          <h3 className="text-lg font-bold mb-4 text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Diagnosis Trend Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends.diagnosis_by_year.length > 0 ? trends.diagnosis_by_year : [{ year: new Date().getFullYear(), count: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Cancer Types */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-xl shadow-md border border-slate-200"
        >
          <h3 className="text-lg font-bold mb-4 text-slate-900">Top Cancer Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distributions.cancer_types.length > 0 ? distributions.cancer_types.slice(0, 8) : [{ code: 'N/A', description: 'No data', count: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="code"
                stroke="#64748b"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => value.toLocaleString()}
                labelFormatter={(label) => `Code: ${label}`}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Age Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-md border border-slate-200"
        >
          <h3 className="text-lg font-bold mb-4 text-slate-900">Age Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distributions.age_groups.length > 0 ? distributions.age_groups : [{ age_group: 'N/A', count: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="age_group" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gender Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-md border border-slate-200"
        >
          <h3 className="text-lg font-bold mb-4 text-slate-900">Gender Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributions.gender.length > 0 ? distributions.gender : [{ gender: 'No data', count: 0 }]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ gender, percent }: any) => `${gender}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {(distributions.gender.length > 0 ? distributions.gender : [{ gender: 'No data', count: 0 }]).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Treatment Modalities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-md border border-slate-200"
        >
          <h3 className="text-lg font-bold mb-4 text-slate-900">Treatment Modalities</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { name: 'Surgery', value: treatment.modalities.surgery },
                { name: 'Chemotherapy', value: treatment.modalities.chemotherapy },
                { name: 'Radiotherapy', value: treatment.modalities.radiotherapy },
                { name: 'Hormonal', value: treatment.modalities.hormonal_therapy },
                { name: 'Immunotherapy', value: treatment.modalities.immunotherapy },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Vital Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-md border border-slate-200"
        >
          <h3 className="text-lg font-bold mb-4 text-slate-900">Vital Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={outcomes.vital_status.length > 0 ? outcomes.vital_status : [{ status: 'No data', count: 0 }]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percent }: any) => `${status}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {(outcomes.vital_status.length > 0 ? outcomes.vital_status : [{ status: 'No data', count: 0 }]).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}

