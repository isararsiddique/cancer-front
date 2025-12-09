'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Users, FileCheck, BarChart3, LogOut, Shield, CheckCircle, XCircle, Settings, Activity, TrendingUp, AlertCircle, Eye, X, Calendar, Filter, FileText, Mail, Building, Search, User, Download } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { researchApi } from '@/lib/api/research';
import { patientsApi } from '@/lib/api/patients';
import ProfileModal from '@/components/ProfileModal';
import { clearNonEssentialCache } from '@/lib/utils/auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Header } from '@/components/shared/Header';
import { StatCard } from '@/components/shared/StatCard';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { designTokens, cn } from '@/lib/styles/tokens';

// Excel Export Button Component
function ExcelExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      // Call the export API
      const blob = await patientsApi.exportExcel();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      link.download = `patients_export_all_${dateStr}_${now.getTime()}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Excel export failed:', err);
      setError(err.response?.data?.detail || 'Failed to export Excel file. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        variant="primary"
        size="md"
        icon={<Download className="w-5 h-5" />}
        onClick={handleExport}
        disabled={isExporting}
        className="bg-green-600 hover:bg-green-700"
      >
        {isExporting ? 'Exporting...' : 'Download Excel'}
      </Button>
      {error && (
        <p className="text-xs text-red-600 max-w-xs text-right">{error}</p>
      )}
    </div>
  );
}

export default function UMMCAdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [detailedRequest, setDetailedRequest] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['research-requests'],
    queryFn: () => researchApi.listPendingRequests(),
  });

  // Fetch research data statistics
  const { data: dataStats, isLoading: statsLoading } = useQuery({
    queryKey: ['research-data-statistics'],
    queryFn: () => researchApi.getStatistics(),
  });

  // Fetch detailed request information
  const { data: requestDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ['request-details', detailedRequest?.request_id],
    queryFn: () => researchApi.getRequestDetails(detailedRequest?.request_id || ''),
    enabled: !!detailedRequest?.request_id && showDetailModal,
  });

  const { data: userData } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      return await authApi.getMe();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, decision, reason }: { requestId: string; decision: string; reason?: string }) => {
      return researchApi.approveOrReject({
        request_id: requestId,
        decision: decision as 'APPROVE' | 'REJECT',
        rejection_reason: reason || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-requests'] });
      setSelectedRequest(null);
      // Force refetch to update counts immediately
      queryClient.refetchQueries({ queryKey: ['research-requests'] });
    },
  });

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/auth/login');
  };

  // Set mounted state to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check authentication on mount - show login first if not authenticated
  useEffect(() => {
    if (!mounted) return;
    
    const checkAuth = async () => {
      // Clear non-essential cache when entering dashboard
      clearNonEssentialCache();
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      try {
        const user = await authApi.getMe();
        // Check if user has ummc_admin or super_admin role
        if (!user.roles || (!user.roles.includes('ummc_admin') && !user.roles.includes('super_admin'))) {
          if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
          }
          router.push('/auth/login');
        }
      } catch (error) {
        // Token invalid, clear cache and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        router.push('/auth/login');
      }
    };
    
    checkAuth();
  }, [router, mounted]);

  // Don't render dashboard until mounted and authenticated
  if (!mounted) {
    return null;
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (!token) {
    return null; // Will redirect to login
  }

  const handleApprove = (requestId: string) => {
    if (confirm('Are you sure you want to approve this research request?')) {
      approveMutation.mutate({ requestId, decision: 'APPROVE' });
    }
  };

  const handleReject = (requestId: string) => {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason && reason.trim()) {
      approveMutation.mutate({ requestId, decision: 'REJECT', reason: reason.trim() });
    }
  };

  const handleViewDetails = async (request: any) => {
    setDetailedRequest(request);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setDetailedRequest(null);
  };

  const handleApproveFromModal = () => {
    if (detailedRequest && confirm('Are you sure you want to approve this research request?')) {
      approveMutation.mutate({ requestId: detailedRequest.request_id, decision: 'APPROVE' });
      handleCloseDetailModal();
    }
  };

  const handleRejectFromModal = () => {
    if (detailedRequest) {
      const reason = prompt('Please provide a reason for rejection:');
      if (reason && reason.trim()) {
        approveMutation.mutate({ requestId: detailedRequest.request_id, decision: 'REJECT', reason: reason.trim() });
        handleCloseDetailModal();
      }
    }
  };

  // Format filters for display
  const formatFilters = (filters: any) => {
    if (!filters || typeof filters !== 'object') return [];
    
    const formatted: Array<{ label: string; value: any }> = [];
    
    // Cancer type keywords
    if (filters.icd11_description) {
      formatted.push({ label: 'Cancer Type Keywords', value: filters.icd11_description });
    }
    
    // ICD-11 code
    if (filters.icd11_main_code) {
      formatted.push({ label: 'ICD-11 Code', value: filters.icd11_main_code });
    }
    
    // Year range
    if (filters.diagnosis_year_from || filters.diagnosis_year_to) {
      const yearRange = filters.diagnosis_year_from && filters.diagnosis_year_to
        ? `${filters.diagnosis_year_from} - ${filters.diagnosis_year_to}`
        : filters.diagnosis_year_from
        ? `From ${filters.diagnosis_year_from}`
        : `Until ${filters.diagnosis_year_to}`;
      formatted.push({ label: 'Diagnosis Year', value: yearRange });
    }
    
    // Age range
    if (filters.age_from || filters.age_to) {
      const ageRange = filters.age_from && filters.age_to
        ? `${filters.age_from} - ${filters.age_to} years`
        : filters.age_from
        ? `${filters.age_from}+ years`
        : `Up to ${filters.age_to} years`;
      formatted.push({ label: 'Age Range', value: ageRange });
    }
    
    // Gender
    if (filters.gender) {
      formatted.push({ label: 'Gender', value: filters.gender });
    }
    
    // TNM Staging
    if (filters.t_category || filters.n_category || filters.m_category) {
      const tnm = [filters.t_category, filters.n_category, filters.m_category].filter(Boolean).join(', ');
      formatted.push({ label: 'TNM Staging', value: tnm });
    }
    
    // Treatment filters
    const treatmentFilters: string[] = [];
    if (filters.surgery_done === true) treatmentFilters.push('Surgery');
    if (filters.chemotherapy_done === true) treatmentFilters.push('Chemotherapy');
    if (filters.radiotherapy_done === true) treatmentFilters.push('Radiotherapy');
    if (filters.hormonal_therapy === true) treatmentFilters.push('Hormonal Therapy');
    if (filters.immunotherapy === true) treatmentFilters.push('Immunotherapy');
    if (treatmentFilters.length > 0) {
      formatted.push({ label: 'Treatment Types', value: treatmentFilters.join(', ') });
    }
    
    // Outcomes
    if (filters.recurrence === true) formatted.push({ label: 'Recurrence', value: 'Yes' });
    if (filters.metastasis === true) formatted.push({ label: 'Metastasis', value: 'Yes' });
    if (filters.vital_status) formatted.push({ label: 'Vital Status', value: filters.vital_status });
    if (filters.treatment_intent) formatted.push({ label: 'Treatment Intent', value: filters.treatment_intent });
    
    return formatted;
  };

  const pendingRequests = requests?.pending_requests || [];
  const approvedRequests = requests?.approved_requests || [];
  const rejectedRequests = requests?.rejected_requests || [];

  // Calculate chart data from all requests (pending, approved, rejected)
  const allRequests = requests ? [
    ...(requests.pending_requests || []).map((r: any) => ({ ...r, status: 'PENDING' })),
    ...(requests.approved_requests || []).map((r: any) => ({ ...r, status: 'APPROVED' })),
    ...(requests.rejected_requests || []).map((r: any) => ({ ...r, status: 'REJECTED' }))
  ] : [];

  // Monthly data for requests and approvals
  const monthlyData = allRequests.reduce((acc: any, req: any) => {
    if (!req.created_at) return acc;
    const date = new Date(req.created_at);
    const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    const existing = acc.find((item: any) => item.month === month);
    if (existing) {
      existing.requests++;
      if (req.status === 'APPROVED') existing.approvals++;
      if (req.status === 'PENDING') existing.pending++;
      if (req.status === 'REJECTED') existing.rejected++;
    } else {
      acc.push({ 
        month, 
        requests: 1, 
        approvals: req.status === 'APPROVED' ? 1 : 0,
        pending: req.status === 'PENDING' ? 1 : 0,
        rejected: req.status === 'REJECTED' ? 1 : 0,
      });
    }
    return acc;
  }, []).slice(-6);

  // Chart data for approve/create trends - simplified
  const approveCreateData = allRequests.reduce((acc: any, req: any) => {
    if (!req.created_at) return acc;
    
    // Track when request was created
    const createDate = new Date(req.created_at);
    const createMonth = createDate.toLocaleString('default', { month: 'short', year: 'numeric' });
    let createEntry = acc.find((item: any) => item.month === createMonth);
    if (!createEntry) {
      createEntry = { month: createMonth, created: 0, approved: 0 };
      acc.push(createEntry);
    }
    createEntry.created++;
    
    // Track when request was approved (if approved)
    if (req.status === 'APPROVED' && req.approved_at) {
      const approveDate = new Date(req.approved_at);
      const approveMonth = approveDate.toLocaleString('default', { month: 'short', year: 'numeric' });
      let approveEntry = acc.find((item: any) => item.month === approveMonth);
      if (!approveEntry) {
        approveEntry = { month: approveMonth, created: 0, approved: 0 };
        acc.push(approveEntry);
      }
      approveEntry.approved++;
    }
    
    return acc;
  }, []).sort((a: any, b: any) => {
    // Sort by month
    return new Date(a.month).getTime() - new Date(b.month).getTime();
  }).slice(-6);

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
        subtitle={userData?.email || 'UMMC Administrator'}
        icon={<Shield className="w-6 h-6 text-white" />}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={<Settings className="w-4 h-4" />}>
              Settings
            </Button>
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
        {/* Stats Cards */}
        <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4', designTokens.spacing.gap.lg, 'mb-8')} style={{ perspective: '1000px' }}>
          <StatCard
            icon={FileCheck}
            label="Pending Requests"
            value={pendingRequests.length}
            change={pendingRequests.length > 0 ? 'Action Required' : 'All Clear'}
            gradient="warning"
            trend={pendingRequests.length > 0 ? 'alert' : 'neutral'}
            index={0}
          />
          <StatCard
            icon={CheckCircle}
            label="Approved Requests"
            value={approvedRequests.length || 0}
            change="Total approved"
            gradient="success"
            trend="up"
            index={1}
          />
          <StatCard
            icon={XCircle}
            label="Rejected Requests"
            value={rejectedRequests.length || 0}
            change="Total rejected"
            gradient="error"
            trend="neutral"
            index={2}
          />
          <StatCard
            icon={Activity}
            label="Total Requests"
            value={pendingRequests.length + (approvedRequests.length || 0) + (rejectedRequests.length || 0)}
            change="All time"
            gradient="info"
            trend="up"
            index={3}
          />
        </div>

        {/* Charts Section */}
        <div className={cn('grid grid-cols-1 lg:grid-cols-2', designTokens.spacing.gap.lg, 'mb-8')}>
          <Card>
            <h3 className={cn(designTokens.typography.heading.h2, designTokens.colors.text.primary, 'mb-4 flex items-center gap-2')}>
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Approve/Create Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={approveCreateData.length > 0 ? approveCreateData : monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="month" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    color: '#1e293b',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="created" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ fill: '#3b82f6', r: 4 }} 
                  name="Created"
                />
                <Line 
                  type="monotone" 
                  dataKey="approved" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ fill: '#10b981', r: 4 }} 
                  name="Approved"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <h3 className={cn(designTokens.typography.heading.h2, designTokens.colors.text.primary, 'mb-4 flex items-center gap-2')}>
              <Activity className="w-5 h-5 text-blue-600" />
              Request Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { name: 'Pending', value: pendingRequests.length, color: '#f59e0b' },
                { name: 'Approved', value: approvedRequests.length || 0, color: '#10b981' },
                { name: 'Rejected', value: rejectedRequests.length || 0, color: '#ef4444' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    color: '#1e293b',
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Research Data Statistics Section */}
        {dataStats && (
          <Card className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className={cn(designTokens.typography.heading.h1, designTokens.colors.text.primary, 'flex items-center gap-3')}>
                <BarChart3 className="w-6 h-6 text-blue-600" />
                Research Data Statistics
              </h2>
              <div className="flex items-center gap-4">
                <ExcelExportButton />
                {dataStats.summary && (
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{dataStats.summary.total_anonymized_patients?.toLocaleString() || 0}</p>
                    <p className="text-sm text-slate-600">Total Anonymized Patients</p>
                  </div>
                )}
              </div>
            </div>

            {statsLoading ? (
              <div className="text-center py-12 text-slate-600">Loading statistics...</div>
            ) : dataStats.statistics ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-sm text-blue-700 font-medium mb-1">Total Patients</p>
                    <p className="text-2xl font-bold text-blue-900">{dataStats.summary.total_anonymized_patients?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <p className="text-sm text-green-700 font-medium mb-1">Cancer Types</p>
                    <p className="text-2xl font-bold text-green-900">{dataStats.statistics.by_cancer_type?.length || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <p className="text-sm text-purple-700 font-medium mb-1">Years Covered</p>
                    <p className="text-2xl font-bold text-purple-900">{dataStats.statistics.by_year?.length || 0}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                    <p className="text-sm text-orange-700 font-medium mb-1">Age Groups</p>
                    <p className="text-2xl font-bold text-orange-900">{dataStats.statistics.by_age_group?.length || 0}</p>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Cancer Type Distribution */}
                  {dataStats.statistics.by_cancer_type && dataStats.statistics.by_cancer_type.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h3 className="text-lg font-bold mb-4 text-slate-900">Top Cancer Types</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dataStats.statistics.by_cancer_type.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                          <XAxis 
                            dataKey="cancer_type_code" 
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
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            }}
                            formatter={(value: any) => value.toLocaleString()}
                          />
                          <Bar dataKey="patient_count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Year-wise Distribution */}
                  {dataStats.statistics.by_year && dataStats.statistics.by_year.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h3 className="text-lg font-bold mb-4 text-slate-900">Patients by Year</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dataStats.statistics.by_year}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                          <XAxis dataKey="year" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip
                            contentStyle={{
                              background: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            }}
                            formatter={(value: any) => value.toLocaleString()}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="patient_count" 
                            stroke="#10b981" 
                            strokeWidth={3} 
                            dot={{ fill: '#10b981', r: 5 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Gender Distribution */}
                  {dataStats.statistics.by_gender && dataStats.statistics.by_gender.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h3 className="text-lg font-bold mb-4 text-slate-900">Gender Distribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={dataStats.statistics.by_gender}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="patient_count"
                          >
                            {dataStats.statistics.by_gender.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#10b981'} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            }}
                            formatter={(value: any) => value.toLocaleString()}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Age Group Distribution */}
                  {dataStats.statistics.by_age_group && dataStats.statistics.by_age_group.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h3 className="text-lg font-bold mb-4 text-slate-900">Age Group Distribution</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={dataStats.statistics.by_age_group}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                          <XAxis dataKey="age_group" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip
                            contentStyle={{
                              background: 'white',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            }}
                            formatter={(value: any) => value.toLocaleString()}
                          />
                          <Bar dataKey="patient_count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Treatment Statistics - REMOVED (not supported by API) */}
                {/* Top Cancer Types Table */}
                {dataStats.statistics.by_cancer_type && dataStats.statistics.by_cancer_type.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-xl">
                    <h3 className="text-lg font-bold mb-4 text-slate-900">Cancer Type Details</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-300">
                            <th className="text-left py-2 px-4 text-sm font-semibold text-slate-700">ICD-11 Code</th>
                            <th className="text-left py-2 px-4 text-sm font-semibold text-slate-700">Description</th>
                            <th className="text-right py-2 px-4 text-sm font-semibold text-slate-700">Patient Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dataStats.statistics.by_cancer_type.slice(0, 10).map((item: any, index: number) => (
                            <tr key={index} className="border-b border-slate-200 hover:bg-white">
                              <td className="py-2 px-4 text-sm font-mono text-slate-900">{item.icd11_main_code}</td>
                              <td className="py-2 px-4 text-sm text-slate-700">{item.description}</td>
                              <td className="py-2 px-4 text-sm text-right font-semibold text-slate-900">{item.patient_count.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={cn('text-center py-12', designTokens.colors.text.secondary)}>No statistics available</div>
            )}
          </Card>
        )}

        {/* Research Requests Table */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className={cn(designTokens.typography.heading.h1, designTokens.colors.text.primary, 'flex items-center gap-3')}>
              <FileCheck className="w-6 h-6 text-blue-600" />
              Research Requests
            </h2>
            <div className="flex gap-2">
              <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-semibold border border-yellow-200">
                {pendingRequests.length} Pending
              </span>
              <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-sm font-semibold border border-green-200">
                {approvedRequests.length || 0} Approved
              </span>
            </div>
          </div>

          {requestsLoading ? (
            <div className="text-center py-12 text-slate-600">Loading requests...</div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-slate-700 text-lg">All requests have been processed</p>
              <p className="text-slate-600 text-sm mt-2">No pending requests at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request: any, index: number) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn('w-12 h-12 bg-gradient-to-br', designTokens.gradients.primary, designTokens.radius.md, 'flex items-center justify-center', designTokens.shadows.md)}>
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-lg">{request.researcher_name}</p>
                          <p className="text-slate-600 text-sm">{request.researcher_email}</p>
                        </div>
                        <span className="px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-semibold border border-yellow-200">
                          {request.status}
                        </span>
                      </div>
                      
                      <div className="ml-16 space-y-2">
                        <div>
                          <p className="text-sm text-slate-600 mb-1 font-medium">Purpose of Study</p>
                          <p className="text-slate-900 line-clamp-2">{request.purpose_of_study}</p>
                        </div>
                        {request.researcher_affiliation && (
                          <div>
                            <p className="text-sm text-slate-600 mb-1 font-medium">Affiliation</p>
                            <p className="text-slate-900">{request.researcher_affiliation}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-slate-600">Request ID: <span className="font-mono text-slate-700">{request.request_id}</span></span>
                          <span className="text-xs text-slate-600">
                            Created: {new Date(request.created_at).toLocaleDateString()}
                          </span>
                          {request.estimated_record_count !== undefined && (
                            <span className="text-xs text-slate-600">
                              Records: <span className="font-semibold text-slate-900">{request.estimated_record_count}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 ml-6">
                      <Button
                        variant="primary"
                        size="md"
                        icon={<Eye className="w-5 h-5" />}
                        onClick={() => handleViewDetails(request)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="primary"
                        size="md"
                        icon={<CheckCircle className="w-5 h-5" />}
                        onClick={() => handleApprove(request.request_id)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="md"
                        icon={<XCircle className="w-5 h-5" />}
                        onClick={() => handleReject(request.request_id)}
                        disabled={approveMutation.isPending}
                        className="border-2 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Detailed Request Review Modal */}
      <AnimatePresence>
        {showDetailModal && detailedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm p-4"
            onClick={handleCloseDetailModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl mx-auto my-8 bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Research Request Details</h2>
                      <p className="text-blue-100 text-sm mt-1">Request ID: {detailedRequest.request_id}</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={handleCloseDetailModal}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {detailsLoading ? (
                  <div className="text-center py-12 text-slate-600">Loading details...</div>
                ) : (
                  <div className="space-y-6">
                    {/* Researcher Information */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Researcher Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600 mb-1 font-medium">Name</p>
                          <p className="text-slate-900 font-semibold">{requestDetails?.researcher_name || detailedRequest.researcher_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 mb-1 font-medium flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            Email
                          </p>
                          <p className="text-slate-900">{requestDetails?.researcher_email || detailedRequest.researcher_email}</p>
                        </div>
                        {requestDetails?.researcher_affiliation || detailedRequest.researcher_affiliation ? (
                          <div className="md:col-span-2">
                            <p className="text-sm text-slate-600 mb-1 font-medium flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              Affiliation
                            </p>
                            <p className="text-slate-900">{requestDetails?.researcher_affiliation || detailedRequest.researcher_affiliation}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {/* Purpose of Study */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Purpose of Study
                      </h3>
                      <p className="text-slate-900 leading-relaxed whitespace-pre-wrap">
                        {requestDetails?.purpose_of_study || detailedRequest.purpose_of_study}
                      </p>
                    </div>

                    {/* Data Filters */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-blue-600" />
                        Data Filters
                      </h3>
                      {(() => {
                        const filters = requestDetails?.filters || detailedRequest.filters || {};
                        const formattedFilters = formatFilters(filters);
                        
                        if (formattedFilters.length === 0) {
                          return (
                            <p className="text-slate-600 italic">No specific filters applied - requesting all available data</p>
                          );
                        }
                        
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formattedFilters.map((filter, idx) => (
                              <div key={idx} className="bg-white rounded-lg p-4 border border-slate-200">
                                <p className="text-sm text-slate-600 mb-1 font-medium">{filter.label}</p>
                                <p className="text-slate-900 font-semibold">{String(filter.value)}</p>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Request Metadata */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Request Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600 mb-1 font-medium">Status</p>
                          <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-semibold ${
                            detailedRequest.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                            detailedRequest.status === 'APPROVED' ? 'bg-green-100 text-green-800 border border-green-200' :
                            'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {detailedRequest.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 mb-1 font-medium">Estimated Record Count</p>
                          <p className="text-slate-900 font-bold text-xl">
                            {requestDetails?.estimated_record_count ?? detailedRequest.estimated_record_count ?? 'N/A'}
                            {requestDetails?.estimated_record_count !== undefined && requestDetails.estimated_record_count < 5 && (
                              <span className="ml-2 text-xs text-amber-600 font-normal">⚠ Low count</span>
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 mb-1 font-medium">Created At</p>
                          <p className="text-slate-900">
                            {new Date(requestDetails?.created_at || detailedRequest.created_at).toLocaleString()}
                          </p>
                        </div>
                        {requestDetails?.approved_at && (
                          <div>
                            <p className="text-sm text-slate-600 mb-1 font-medium">Approved At</p>
                            <p className="text-slate-900">
                              {new Date(requestDetails.approved_at).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {requestDetails?.rejection_reason && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-slate-600 mb-1 font-medium">Rejection Reason</p>
                            <p className="text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                              {requestDetails.rejection_reason}
                            </p>
                          </div>
                        )}
                        {requestDetails?.download_token && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-slate-600 mb-1 font-medium">Download Token</p>
                            <p className="text-slate-900 font-mono text-sm bg-slate-100 p-3 rounded-lg break-all">
                              {requestDetails.download_token}
                            </p>
                            {requestDetails.token_expires_at && (
                              <p className="text-xs text-slate-600 mt-1">
                                Expires: {new Date(requestDetails.token_expires_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              {detailedRequest.status === 'PENDING' && (
                <div className={cn('bg-slate-50 px-6 py-4 border-t', designTokens.colors.border.light, 'flex items-center justify-end gap-3')}>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleCloseDetailModal}
                  >
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    icon={<XCircle className="w-5 h-5" />}
                    onClick={handleRejectFromModal}
                    disabled={approveMutation.isPending}
                    className="border-2 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    icon={<CheckCircle className="w-5 h-5" />}
                    onClick={handleApproveFromModal}
                    disabled={approveMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Approve Request
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={userData}
      />
    </div>
  );
}

