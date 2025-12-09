'use client';

import { motion } from 'framer-motion';
import { FileText, TrendingUp, Plus, LogOut, BarChart3, Calendar, Users as UsersIcon, CheckCircle, X, AlertTriangle, Clock, CheckCircle2, XCircle, RefreshCw, User, Brain } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { researchApi } from '@/lib/api/research';
import ProfileModal from '@/components/ProfileModal';
import { clearNonEssentialCache } from '@/lib/utils/auth';
import { checkDashboardSwitch } from '@/lib/utils/dashboardAuth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import MLTrainingSection from '@/components/ml/MLTrainingSection';

export default function ResearcherDashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<{
    request_id: string;
    message: string;
    estimated_record_count?: number;
    privacy_warning?: string;
  } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showMLTraining, setShowMLTraining] = useState(false);
  const [selectedRequestForML, setSelectedRequestForML] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const successData = sessionStorage.getItem('research_request_success');
      if (successData) {
        try {
          const parsed = JSON.parse(successData);
          setSuccessMessage(parsed);
          sessionStorage.removeItem('research_request_success');
        } catch (e) {
          console.error('Failed to parse success message:', e);
        }
      }
    }
  }, [mounted]);
  
  const { data: stats, isLoading, error: statsError } = useQuery({
    queryKey: ['research-statistics'],
    queryFn: async () => {
      try {
        const result = await researchApi.getStatistics();
        console.log('Statistics loaded:', result);
        return result;
      } catch (error) {
        console.error('Failed to load statistics:', error);
        return { statistics: { total_requests: 0, approved_requests: 0, pending_requests: 0, total_records_accessed: 0 } };
      }
    },
    retry: false,
  });

  const { data: userData } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      return await authApi.getMe();
    },
  });

  const { data: myRequests, isLoading: requestsLoading, refetch: refetchRequests, error: requestsError } = useQuery({
    queryKey: ['my-research-requests'],
    queryFn: async () => {
      try {
        const result = await researchApi.listMyRequests();
        console.log('My requests loaded:', result);
        return result;
      } catch (error) {
        console.error('Failed to load requests:', error);
        return { requests: [], total: 0, pending: 0, approved: 0, rejected: 0 };
      }
    },
    retry: false,
  });

  const handleLogout = async () => {
    await authApi.logout();
    router.push('/auth/login');
  };

  const COLORS = ['#3b82f6', '#06b6d4', '#2563eb', '#0ea5e9', '#0284c7', '#0c4a6e'];

  // AGGRESSIVE AUTH CHECK - Force login on every page visit
  // Clear tokens and redirect to login when switching dashboards
  useEffect(() => {
    if (!mounted) return;
    
    const checkAuth = async () => {
      // Check if user is switching from another dashboard
      // If yes, clear tokens to force re-login
      const isSwitching = checkDashboardSwitch('/research');
      
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

  // Don't render until authenticated
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Block rendering if no token
  const hasToken = typeof window !== 'undefined' && localStorage.getItem('access_token');
  if (!hasToken) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BarChart3 className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Researcher Dashboard</h1>
                <p className="text-blue-100 text-sm">{userData?.email || 'Researcher'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // If there's an approved request, pass it to ML training
                  const approvedReqs = myRequests?.requests?.filter((r: any) => r.status === 'approved' && r.download_token);
                  if (approvedReqs && approvedReqs.length > 0) {
                    router.push(`/research/ml-training?request_id=${approvedReqs[0].request_id}`);
                  } else {
                    router.push('/research/ml-training');
                  }
                }}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                ML Training Lab
              </button>
              <button
                onClick={() => setShowProfile(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={handleLogout}
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
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Request Submitted Successfully!</h3>
                <p className="text-green-800 mb-3">{successMessage.message}</p>
                {successMessage.estimated_record_count !== undefined && (
                  <p className="text-sm text-green-700 mb-2">
                    <strong>Estimated Records:</strong> {successMessage.estimated_record_count}
                  </p>
                )}
                {successMessage.privacy_warning && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{successMessage.privacy_warning}</span>
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-600 hover:text-green-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                <p className="text-3xl font-bold text-gray-900">
                  {requestsLoading ? '...' : myRequests?.total || 0}
                </p>
              </div>
              <FileText className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Approved</p>
                <p className="text-3xl font-bold text-gray-900">
                  {requestsLoading ? '...' : myRequests?.approved || 0}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-gray-900">
                  {requestsLoading ? '...' : myRequests?.pending || 0}
                </p>
              </div>
              <Clock className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Available Records</p>
                <p className="text-3xl font-bold text-gray-900">
                  {requestsLoading ? '...' : myRequests?.requests?.filter((r: any) => r.status === 'approved').reduce((sum: number, r: any) => sum + (r.estimated_record_count || 0), 0) || 0}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </motion.div>
        </div>

        {/* ML Training Lab Card */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Brain className="w-10 h-10" />
                <h2 className="text-2xl font-bold">ML Training Lab</h2>
              </div>
              <p className="text-purple-100 mb-4 max-w-2xl">
                Access our Colab-like environment to train custom machine learning models on your approved research data. 
                Write Python code, train models, and visualize results in real-time.
              </p>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Python Code Editor</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Real-time Execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Model Training</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Result Visualization</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                // If there's an approved request, pass it to ML training
                const approvedReqs = myRequests?.requests?.filter((r: any) => r.status === 'approved' && r.download_token);
                if (approvedReqs && approvedReqs.length > 0) {
                  router.push(`/research/ml-training?request_id=${approvedReqs[0].request_id}`);
                } else {
                  router.push('/research/ml-training');
                }
              }}
              className="px-8 py-4 bg-white text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform"
            >
              Launch Training Lab →
            </button>
          </div>
        </div>

        {/* My Research Requests */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              My Research Requests
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => refetchRequests()}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button
                onClick={() => router.push('/research/request')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Request
              </button>
            </div>
          </div>

          {requestsLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading requests...</p>
            </div>
          ) : myRequests?.requests && myRequests.requests.length > 0 ? (
            <div className="space-y-4">
              {myRequests.requests.map((request: any) => {
                const statusColors = {
                  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  approved: 'bg-green-100 text-green-800 border-green-200',
                  rejected: 'bg-red-100 text-red-800 border-red-200',
                  completed: 'bg-blue-100 text-blue-800 border-blue-200',
                };
                const statusIcons = {
                  pending: Clock,
                  approved: CheckCircle2,
                  rejected: XCircle,
                  completed: CheckCircle,
                };
                const StatusIcon = statusIcons[request.status as keyof typeof statusIcons] || Clock;

                return (
                  <div
                    key={request.request_id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{request.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[request.status as keyof typeof statusColors]}`}>
                            <StatusIcon className="w-3 h-3 inline mr-1" />
                            {request.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{request.purpose}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(request.created_at).toLocaleDateString()}
                          </span>
                          {request.estimated_record_count && (
                            <span>Est. Records: {request.estimated_record_count}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {request.status === 'approved' && request.download_token && (
                          <button
                            onClick={() => {
                              // Pass request data to ML training page via URL params
                              router.push(`/research/ml-training?request_id=${request.request_id}`);
                            }}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
                          >
                            <Brain className="w-4 h-4" />
                            ML Training
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No research requests yet</p>
              <button
                onClick={() => router.push('/research/request')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create Your First Request
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ML Training Modal */}
      {showMLTraining && selectedRequestForML && (
        <MLTrainingSection
          approvedRequestId={selectedRequestForML}
          downloadToken={myRequests?.requests?.find((r: any) => r.request_id === selectedRequestForML)?.download_token}
        />
      )}

      {/* Profile Modal */}
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
