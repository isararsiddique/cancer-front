'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, LogOut, Settings, Users, Key, Database, Link2, BarChart3, 
  Brain, FileText, Plus, Edit, Trash2, CheckCircle, XCircle, 
  TrendingUp, Activity, Server, Globe, Lock, Unlock, Eye, EyeOff,
  Save, X, AlertCircle, CheckCircle2, RefreshCw, Building2,
  FileSearch, Download, Filter, Calendar, Search, Link as LinkIcon,
  LogIn, UserPlus, FileCheck, User
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { rolesApi, Role, RoleCreate, Permission } from '@/lib/api/roles';
// Admin API endpoints removed - Database, API, and Analysis features removed
import { organizationsApi, Organization, OrganizationCreate, Tenant } from '@/lib/api/organizations';
import { auditApi, AuditLogFilter } from '@/lib/api/audit';
import ProfileModal from '@/components/ProfileModal';
import { clearNonEssentialCache } from '@/lib/utils/auth';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Header } from '@/components/shared/Header';
import { Card } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { designTokens, cn } from '@/lib/styles/tokens';

export default function SuperAdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'roles' | 'hospitals' | 'logs'>('roles');
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showHospitalModal, setShowHospitalModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingHospital, setEditingHospital] = useState<Organization | null>(null);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [selectedLogType, setSelectedLogType] = useState<string>('all');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logFilters, setLogFilters] = useState<AuditLogFilter>({
    action_type: undefined, // Explicitly set to undefined to show all logs
  });
  const [logPage, setLogPage] = useState(0);
  const [logLimit] = useState(100); // Max limit per API
  const [showProfile, setShowProfile] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => await authApi.getMe(),
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.getAll(),
    retry: false,
  });

  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => rolesApi.getPermissions(),
    retry: false,
  });


  const { data: organizations, isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationsApi.getAll(),
    retry: false,
  });

  const { data: tenants } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => organizationsApi.getTenants(),
    retry: false,
  });


  const { data: auditLogs, isLoading: logsLoading, error: logsError, refetch: refetchLogs } = useQuery({
    queryKey: ['audit-logs', logFilters, logPage, selectedLogType],
    queryFn: async () => {
      // Ensure action_type is undefined when 'all' is selected
      const filters = {
        ...logFilters,
        action_type: selectedLogType === 'all' ? undefined : logFilters.action_type,
        limit: logLimit,
        skip: logPage * logLimit 
      };
      console.log('🔍 [AUDIT LOGS] Calling auditApi.getAll with filters:', filters);
      try {
        const result = await auditApi.getAll(filters);
        console.log('✅ [AUDIT LOGS] auditApi.getAll result:', {
          total: result.total,
          itemsCount: result.items?.length || result.logs?.length,
          actionTypes: [...new Set((result.items || result.logs || []).map((log: any) => log.action_type))]
        });
        return result;
      } catch (error) {
        console.error('❌ [AUDIT LOGS] Error calling auditApi.getAll:', error);
        throw error;
      }
    },
    enabled: activeTab === 'logs', // Only fetch when logs tab is active
    retry: false,
    refetchOnWindowFocus: true,
  });
  
  // Trigger fetch when logs tab becomes active
  useEffect(() => {
    if (activeTab === 'logs') {
      console.log('📋 [AUDIT LOGS] Logs tab activated, fetching logs...');
      refetchLogs();
    }
  }, [activeTab, refetchLogs]);
  
  // Debug: Log the audit logs data
  console.log('Audit Logs State:', {
    hasData: !!auditLogs,
    items: auditLogs?.items?.length,
    logs: auditLogs?.logs?.length,
    total: auditLogs?.total,
    isLoading: logsLoading,
    error: logsError,
    activeTab,
    enabled: activeTab === 'logs'
  });

  const { data: logStatistics } = useQuery({
    queryKey: ['audit-statistics', logFilters],
    queryFn: async () => {
      console.log('🔍 Calling auditApi.getStatistics');
      const result = await auditApi.getStatistics();
      console.log('✅ auditApi.getStatistics result:', result);
      return result;
    },
    enabled: activeTab === 'logs', // Only fetch when logs tab is active
    retry: false,
    refetchOnWindowFocus: true,
  });

  const roleCreateMutation = useMutation({
    mutationFn: (data: RoleCreate) => rolesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowRoleModal(false);
      setEditingRole(null);
    },
  });

  const roleUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<RoleCreate> }) => 
      rolesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowRoleModal(false);
      setEditingRole(null);
    },
  });

  const roleDeleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });

  const hospitalCreateMutation = useMutation({
    mutationFn: (data: OrganizationCreate) => organizationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setShowHospitalModal(false);
      setEditingHospital(null);
    },
  });

  const hospitalUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OrganizationCreate> }) => 
      organizationsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setShowHospitalModal(false);
      setEditingHospital(null);
    },
  });

  const hospitalDeleteMutation = useMutation({
    mutationFn: (id: string) => organizationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
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
        // Check if user has super_admin role
        if (!user.roles || !user.roles.includes('super_admin')) {
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

  // Analysis removed

  // Don't render dashboard until mounted and authenticated
  if (!mounted) {
    return null;
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  if (!token) {
    return null; // Will redirect to login
  }

  return (
    <div className={cn('min-h-screen relative overflow-hidden', designTokens.colors.background.gradient)}>
      {/* Subtle background pattern - matching hospital dashboard */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(rgba(15, 23, 42, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(15, 23, 42, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
      }} />

      {/* Header */}
      <Header
        title="Super Admin Dashboard"
        subtitle={userData?.email || 'Administrator'}
        icon={<Shield className="w-6 h-6 text-white" />}
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
            <Button variant="secondary" size="sm" icon={<Settings className="w-4 h-4" />}>
              Settings
            </Button>
            <Button variant="secondary" size="sm" icon={<LogOut className="w-4 h-4" />} onClick={handleLogout}>
              Logout
            </Button>
          </>
        }
      />

      <div className={cn('container mx-auto', designTokens.spacing.container, designTokens.spacing.section, 'relative z-10')}>
        {/* Tab Navigation */}
        <div className={cn('flex gap-2 mb-6', designTokens.colors.background.primary, 'p-1', designTokens.radius.md, designTokens.shadows.md, designTokens.colors.border.light, 'border inline-flex flex-wrap')}>
          {[
            { id: 'roles', label: 'Role Management', icon: Key },
            { id: 'hospitals', label: 'Hospital Management', icon: Building2 },
            { id: 'logs', label: 'Immutable Logs', icon: FileSearch },
          ].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Role Management Tab */}
        {activeTab === 'roles' && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className={cn(designTokens.typography.heading.h1, designTokens.colors.text.primary, 'flex items-center gap-3')}>
                <Key className="w-6 h-6 text-blue-600" />
                Role Management
              </h2>
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => {
                  setEditingRole(null);
                  setShowRoleModal(true);
                }}
              >
                Create Role
              </Button>
            </div>

            {rolesLoading ? (
              <div className="text-center py-12 text-slate-600">Loading roles...</div>
            ) : (
              <div className="space-y-4">
                {roles && roles.length > 0 ? (
                  roles.map((role) => (
                    <motion.div
                      key={role.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                              <Key className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-lg">{role.name}</p>
                              <p className="text-slate-600 text-sm font-mono">{role.slug}</p>
                            </div>
                            {role.tenant_scoped && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                                Tenant Scoped
                              </span>
                            )}
                            {role.user_count !== undefined && (
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {role.user_count} {role.user_count === 1 ? 'user' : 'users'}
                              </span>
                            )}
                          </div>
                          {role.description && (
                            <p className="ml-15 mt-2 text-slate-600 text-sm">{role.description}</p>
                          )}
                          {role.permissions && role.permissions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {role.permissions.map((perm) => (
                                <span key={perm.id} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                                  {perm.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => {
                              setEditingRole(role);
                              setShowRoleModal(true);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              if (confirm(`Delete role "${role.name}"?`)) {
                                roleDeleteMutation.mutate(role.id);
                              }
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <Key className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-700 text-lg">No roles found</p>
                    <p className="text-slate-600 text-sm mt-2">Create your first role to get started</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Hospital Management Tab */}
        {activeTab === 'hospitals' && (
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className={cn(designTokens.typography.heading.h1, designTokens.colors.text.primary, 'flex items-center gap-3')}>
                <Building2 className="w-6 h-6 text-blue-600" />
                Hospital Management
              </h2>
              <Button
                variant="primary"
                size="md"
                icon={<Plus className="w-5 h-5" />}
                onClick={() => {
                  setEditingHospital(null);
                  setShowHospitalModal(true);
                }}
              >
                Create Hospital
              </Button>
            </div>

            {orgsLoading ? (
              <div className="text-center py-12 text-slate-600">Loading hospitals...</div>
            ) : (
              <div className="space-y-4">
                {organizations && organizations.length > 0 ? (
                  organizations.map((org) => (
                    <motion.div
                      key={org.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-slate-50 rounded-xl p-5 hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md">
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-lg">{org.name}</p>
                              {org.code && (
                                <p className="text-slate-600 text-sm font-mono">{org.code}</p>
                              )}
                            </div>
                            {org.tenant_id && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                                Tenant: {org.tenant_id.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                          {org.meta && Object.keys(org.meta).length > 0 && (
                            <div className="ml-15 mt-2 text-sm text-slate-600">
                              <p>Additional Info: {JSON.stringify(org.meta)}</p>
                            </div>
                          )}
                          {org.created_at && (
                            <p className="ml-15 mt-2 text-xs text-slate-500">
                              Created: {new Date(org.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => {
                              setEditingHospital(org);
                              setShowHospitalModal(true);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                            title="Edit Hospital"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => {
                              if (confirm(`Delete hospital "${org.name}"? This action cannot be undone.`)) {
                                hospitalDeleteMutation.mutate(org.id);
                              }
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                            title="Delete Hospital"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-700 text-lg">No hospitals found</p>
                    <p className="text-slate-600 text-sm mt-2">Create your first hospital to get started</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Database Integration Tab - REMOVED */}
        {/* API Integration Tab - REMOVED */}

        {/* Immutable Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Log Statistics Cards */}
            {logStatistics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Logs', value: logStatistics.total_logs, icon: FileSearch, color: 'blue' },
                  { label: 'Login Events', value: logStatistics.logs_by_action['login'] || 0, icon: LogIn, color: 'green' },
                  { label: 'Create Actions', value: logStatistics.logs_by_action['create'] || 0, icon: UserPlus, color: 'purple' },
                  { label: 'Update Actions', value: logStatistics.logs_by_action['update'] || 0, icon: Edit, color: 'emerald' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                        <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                      </div>
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-slate-600 text-sm mb-2 font-medium">{stat.label}</p>
                    <p className="text-4xl font-bold text-slate-900">{stat.value}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Filters and Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60"
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={logSearchQuery}
                      onChange={(e) => {
                        setLogSearchQuery(e.target.value);
                        setLogPage(0); // Reset to first page when search changes
                        setLogFilters({ ...logFilters, search: e.target.value || undefined });
                      }}
                      placeholder="Search logs by action, user, resource..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <motion.button
                  onClick={() => {
                    console.log('🔄 [AUDIT LOGS] Refresh button clicked');
                    setLogPage(0);
                    // Explicitly refetch the logs
                    refetchLogs();
                    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
                    queryClient.invalidateQueries({ queryKey: ['audit-statistics'] });
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </motion.button>
                <select
                  value={selectedLogType}
                  onChange={(e) => {
                    setSelectedLogType(e.target.value);
                    setLogPage(0); // Reset to first page when filter changes
                    setLogFilters({ ...logFilters, action_type: e.target.value === 'all' ? undefined : e.target.value });
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Actions</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="approve">Approve</option>
                  <option value="reject">Reject</option>
                  <option value="data_release">Data Release</option>
                </select>
                <motion.button
                  onClick={() => {
                    const startDate = prompt('Start date (YYYY-MM-DD):');
                    const endDate = prompt('End date (YYYY-MM-DD):');
                    if (startDate && endDate) {
                      setLogPage(0); // Reset to first page when date range changes
                      setLogFilters({ ...logFilters, start_date: startDate, end_date: endDate });
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Date Range
                </motion.button>
                <motion.button
                  onClick={async () => {
                    try {
                      const blob = await auditApi.export(logFilters);
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                    } catch (error) {
                      alert('Failed to export logs');
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </motion.button>
              </div>
            </motion.div>

            {/* Logs List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-6 rounded-2xl shadow-md border border-slate-200/60"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FileSearch className="w-6 h-6 text-blue-600" />
                Audit Logs
              </h2>

              {logsLoading ? (
                <div className="text-center py-12 text-slate-600">Loading logs...</div>
              ) : logsError ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-red-700 text-lg">Error loading audit logs</p>
                  <p className="text-red-600 text-sm mt-2">{String(logsError)}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const logs = auditLogs?.items || auditLogs?.logs || [];
                    const filteredLogs = logs.filter((log) => {
                      if (logSearchQuery) {
                        const query = logSearchQuery.toLowerCase();
                        return (
                          log.action_type?.toLowerCase().includes(query) ||
                          log.user_email?.toLowerCase().includes(query) ||
                          log.user_name?.toLowerCase().includes(query) ||
                          log.resource_type?.toLowerCase().includes(query) ||
                          log.change_summary?.toLowerCase().includes(query) ||
                          JSON.stringify(log.change_details || {}).toLowerCase().includes(query)
                        );
                      }
                      return true;
                    });
                    
                    if (filteredLogs.length === 0 && auditLogs) {
                      return (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                            <FileSearch className="w-8 h-8 text-slate-400" />
                          </div>
                          <p className="text-slate-700 text-lg">
                            {logSearchQuery ? 'No audit logs match your search' : 'No audit logs found'}
                          </p>
                        </div>
                      );
                    }
                    
                    return filteredLogs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="bg-slate-50 rounded-xl p-4 hover:bg-slate-100 transition-colors border border-slate-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`p-2 rounded-lg ${
                                log.action_type === 'login' ? 'bg-green-100 text-green-600' :
                                log.action_type === 'create' ? 'bg-blue-100 text-blue-600' :
                                log.action_type === 'approve' ? 'bg-emerald-100 text-emerald-600' :
                                log.action_type === 'update' ? 'bg-yellow-100 text-yellow-600' :
                                log.action_type === 'delete' ? 'bg-red-100 text-red-600' :
                                log.action_type === 'data_release' ? 'bg-purple-100 text-purple-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {log.action_type === 'login' && <LogIn className="w-4 h-4" />}
                                {log.action_type === 'create' && <UserPlus className="w-4 h-4" />}
                                {log.action_type === 'approve' && <CheckCircle className="w-4 h-4" />}
                                {log.action_type === 'update' && <Edit className="w-4 h-4" />}
                                {log.action_type === 'delete' && <Trash2 className="w-4 h-4" />}
                                {log.action_type === 'data_release' && <Database className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 capitalize">{log.action_type?.replace('_', ' ')}</p>
                                <p className="text-sm text-slate-600">{log.user_email || log.user_name || 'System'}</p>
                              </div>
                              {log.resource_type && (
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                                  {log.resource_type}
                                </span>
                              )}
                              {log.checksum && (
                                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-semibold flex items-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  Verified
                                </span>
                              )}
                            </div>
                            {log.change_summary && (
                              <div className="ml-11 mt-2 text-sm text-slate-600">
                                <p className="font-medium mb-1">Summary:</p>
                                <p className="text-slate-700">{log.change_summary}</p>
                              </div>
                            )}
                            {(log.change_details || log.old_values || log.new_values) && (
                              <div className="ml-11 mt-2 text-sm text-slate-600">
                                <p className="font-medium mb-1">Change Details:</p>
                                <pre className="bg-slate-100 p-2 rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                                  {JSON.stringify({
                                    change_details: log.change_details,
                                    old_values: log.old_values,
                                    new_values: log.new_values,
                                  }, null, 2)}
                                </pre>
                              </div>
                            )}
                            <div className="ml-11 mt-2 flex items-center gap-4 text-xs text-slate-500">
                              <span>{new Date(log.timestamp || log.created_at).toLocaleString()}</span>
                              {log.ip_address && <span>IP: {log.ip_address}</span>}
                              {log.severity && (
                                <span className={`px-2 py-1 rounded text-xs ${
                                  log.severity === 'high' ? 'bg-red-100 text-red-700' :
                                  log.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {log.severity}
                                </span>
                              )}
                              {log.checksum && (
                                <span className="flex items-center gap-1 text-purple-600">
                                  <Lock className="w-3 h-3" />
                                  Hash: {log.checksum.substring(0, 16)}...
                                </span>
                              )}
                            </div>
                          </div>
                          {log.checksum && (
                            <motion.button
                              onClick={() => {
                                navigator.clipboard.writeText(log.checksum!);
                                alert('Checksum copied to clipboard');
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 hover:bg-purple-50 rounded-lg transition-colors text-purple-600"
                              title="Copy checksum"
                            >
                              <Lock className="w-4 h-4" />
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    ));
                  })()}
                </div>
              )}

              {/* Pagination Controls */}
              {auditLogs && auditLogs.total > 0 && (
                <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
                  <div className="text-sm text-slate-600">
                    Showing {logPage * logLimit + 1} to {Math.min((logPage + 1) * logLimit, auditLogs.total)} of {auditLogs.total} logs
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => {
                        setLogPage(prev => Math.max(0, prev - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={logPage === 0}
                      whileHover={{ scale: logPage === 0 ? 1 : 1.02 }}
                      whileTap={{ scale: logPage === 0 ? 1 : 0.98 }}
                      className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Previous
                    </motion.button>
                    <div className="flex items-center gap-1">
                      {(() => {
                        const totalPages = Math.ceil(auditLogs.total / logLimit);
                        const maxPagesToShow = 5;
                        let startPage = 0;
                        let endPage = Math.min(maxPagesToShow, totalPages);
                        
                        if (totalPages > maxPagesToShow) {
                          if (logPage < 3) {
                            startPage = 0;
                            endPage = maxPagesToShow;
                          } else if (logPage > totalPages - 4) {
                            startPage = totalPages - maxPagesToShow;
                            endPage = totalPages;
                          } else {
                            startPage = logPage - 2;
                            endPage = logPage + 3;
                          }
                        }
                        
                        return Array.from({ length: endPage - startPage }, (_, i) => {
                          const pageNum = startPage + i;
                          return (
                            <motion.button
                              key={pageNum}
                              onClick={() => {
                                setLogPage(pageNum);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                                logPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {pageNum + 1}
                            </motion.button>
                          );
                        });
                      })()}
                    </div>
                    <motion.button
                      onClick={() => {
                        const totalPages = Math.ceil(auditLogs.total / logLimit);
                        if (logPage < totalPages - 1) {
                          setLogPage(prev => prev + 1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      disabled={!auditLogs || logPage >= Math.ceil(auditLogs.total / logLimit) - 1}
                      whileHover={{ scale: (!auditLogs || logPage >= Math.ceil(auditLogs.total / logLimit) - 1) ? 1 : 1.02 }}
                      whileTap={{ scale: (!auditLogs || logPage >= Math.ceil(auditLogs.total / logLimit) - 1) ? 1 : 0.98 }}
                      className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Next
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Blockchain Integration Tab - REMOVED */}

        {/* AI/Manual Data Analysis Tab - REMOVED */}
      </div>

      {/* Role Modal */}
      {showRoleModal && (
        <RoleModal
          role={editingRole}
          permissions={permissions || []}
          onClose={() => {
            setShowRoleModal(false);
            setEditingRole(null);
          }}
          onSave={(data) => {
            if (editingRole) {
              roleUpdateMutation.mutate({ id: editingRole.id, data });
            } else {
              roleCreateMutation.mutate(data);
            }
          }}
        />
      )}

      {/* Hospital Modal */}
      {showHospitalModal && (
        <HospitalModal
          hospital={editingHospital}
          tenants={tenants || []}
          onClose={() => {
            setShowHospitalModal(false);
            setEditingHospital(null);
          }}
          onSave={(data) => {
            if (editingHospital) {
              hospitalUpdateMutation.mutate({ id: editingHospital.id, data });
            } else {
              hospitalCreateMutation.mutate(data);
            }
          }}
        />
      )}

      {/* Database Modal - REMOVED */}
      {/* API Modal - REMOVED */}
      {/* Blockchain Modal - REMOVED */}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        user={userData}
      />
    </div>
  );
}

// Role Modal Component
function RoleModal({ role, permissions, onClose, onSave }: {
  role: Role | null;
  permissions: Permission[];
  onClose: () => void;
  onSave: (data: RoleCreate) => void;
}) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    slug: role?.slug || '',
    description: role?.description || '',
    tenant_scoped: role?.tenant_scoped || false,
    permission_ids: role?.permissions?.map(p => p.id) || [],
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {role ? 'Edit Role' : 'Create Role'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="tenant_scoped"
                checked={formData.tenant_scoped}
                onChange={(e) => setFormData({ ...formData, tenant_scoped: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="tenant_scoped" className="text-sm text-slate-700">Tenant Scoped</label>
            </div>
            
            {/* Permission Selection */}
            {permissions.length > 0 && (
              <div>
                <label className="block text-sm font-semibold mb-3 text-slate-700">Permissions</label>
                <div className="max-h-60 overflow-y-auto border border-slate-300 rounded-lg p-4 space-y-2">
                  {permissions.map((permission) => (
                    <div key={permission.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`perm-${permission.id}`}
                        checked={formData.permission_ids.includes(permission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              permission_ids: [...formData.permission_ids, permission.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              permission_ids: formData.permission_ids.filter(id => id !== permission.id)
                            });
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`perm-${permission.id}`} className="text-sm text-slate-700 flex-1">
                        <span className="font-medium">{permission.name}</span>
                        {permission.description && (
                          <span className="text-slate-500 ml-2">- {permission.description}</span>
                        )}
                        <span className="text-slate-400 ml-2 font-mono text-xs">({permission.code})</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={() => onSave(formData)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              <Save className="w-5 h-5 inline mr-2" />
              Save
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Hospital Modal Component
function HospitalModal({ hospital, tenants, onClose, onSave }: {
  hospital: Organization | null;
  tenants: Tenant[];
  onClose: () => void;
  onSave: (data: OrganizationCreate) => void;
}) {
  const [formData, setFormData] = useState({
    name: hospital?.name || '',
    code: hospital?.code || '',
    tenant_id: hospital?.tenant_id || '',
    meta: hospital?.meta || {},
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm p-4"
    >
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              {hospital ? 'Edit Hospital' : 'Create Hospital'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Hospital Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., General Hospital"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">Hospital Code</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., GH001"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">
                Tenant {tenants.length > 0 && <span className="text-red-500">*</span>}
              </label>
              {tenants.length > 0 ? (
                <select
                  value={formData.tenant_id}
                  onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.slug})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-500 text-sm">
                  No tenants available. Please create a tenant first or contact system administrator.
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">Additional Metadata (JSON)</label>
              <textarea
                value={JSON.stringify(formData.meta, null, 2)}
                onChange={(e) => {
                  try {
                    setFormData({ ...formData, meta: JSON.parse(e.target.value) });
                  } catch {
                    // Invalid JSON, keep as is
                  }
                }}
                rows={4}
                placeholder='{"address": "...", "phone": "...", "email": "..."}'
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-colors"
            >
              Cancel
            </motion.button>
            <motion.button
              onClick={() => {
                if (!formData.name.trim()) {
                  alert('Hospital name is required');
                  return;
                }
                if (tenants.length > 0 && !formData.tenant_id) {
                  alert('Please select a tenant');
                  return;
                }
                onSave({
                  name: formData.name.trim(),
                  code: formData.code || null,
                  tenant_id: formData.tenant_id || (tenants.length > 0 ? '' : undefined),
                  meta: formData.meta,
                });
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              <Save className="w-5 h-5 inline mr-2" />
              {hospital ? 'Update' : 'Create'} Hospital
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Database Modal Component - REMOVED

// API Modal Component - REMOVED

// Blockchain Modal Component - REMOVED
