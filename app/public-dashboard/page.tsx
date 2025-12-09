'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Activity,
  Heart,
  Calendar,
  Shield,
  Lock,
  Database,
  Brain,
  Globe,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BarChart3,
  PieChart as PieChartIcon,
  FileText,
  LogOut,
} from 'lucide-react';
import { analyticsApi } from '@/lib/api/analytics';
import { researchApi } from '@/lib/api/research';

const COLORS = ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#a855f7'];

// 3D Cancer Cell Animation Component
const CancerCell3D = ({ delay = 0 }: { delay?: number }) => {
  return (
    <motion.div
      className="absolute"
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [0.3, 0.6, 0.3],
        scale: [0.8, 1.2, 0.8],
        rotate: [0, 360],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{
        width: '120px',
        height: '120px',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.3) 0%, rgba(220, 38, 38, 0.1) 50%, transparent 100%)',
        borderRadius: '50%',
        filter: 'blur(20px)',
      }}
    >
      {/* Inner nucleus */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div
          className="w-16 h-16 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.5) 0%, rgba(220, 38, 38, 0.2) 100%)',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)',
          }}
        />
      </motion.div>
      {/* Outer membrane */}
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        style={{
          borderColor: 'rgba(239, 68, 68, 0.3)',
        }}
        animate={{
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
};

// DNA Helix Animation Component
const DNAHelix = ({ delay = 0, x = 0 }: { delay?: number; x?: number }) => {
  return (
    <motion.div
      className="absolute"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.2 }}
      transition={{ delay }}
      style={{ left: `${x}%`, top: '20%' }}
    >
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${Math.sin(i * 0.5) * 15}px`,
            top: `${i * 30}px`,
            width: '4px',
            height: '30px',
            background: `linear-gradient(to bottom, 
              ${i % 2 === 0 ? 'rgba(59, 130, 246, 0.4)' : 'rgba(6, 182, 212, 0.4)'} 0%,
              ${i % 2 === 0 ? 'rgba(6, 182, 212, 0.4)' : 'rgba(59, 130, 246, 0.4)'} 100%)`,
            borderRadius: '2px',
          }}
          animate={{
            x: [0, Math.sin(i * 0.5) * 20, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 3,
            delay: i * 0.1 + delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
};

export default function PublicDashboard() {
  const router = useRouter();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['public-analytics'],
    queryFn: async () => {
      try {
        // For public dashboard, we can try to fetch without auth or use a public endpoint
        // If it fails, we'll use fallback data
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        
        // Only add auth if token exists (optional for public view)
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_BASE}/api/v1/analytics/anonymized`, {
          headers,
        });
        
        if (!response.ok) {
          // If auth fails, return null to use fallback data
          if (response.status === 401 || response.status === 403) {
            console.log('Analytics requires authentication, using fallback data');
            return null;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        
        return await response.json();
      } catch (err) {
        console.log('Analytics error (using fallback):', err);
        // Return null to use fallback data - this is OK for public dashboard
        return null;
      }
    },
    retry: 1,
    refetchInterval: 60000,
  });

  // Fetch research statistics for public display (now public endpoint)
  const { data: researchStats, isLoading: statsLoading } = useQuery({
    queryKey: ['public-research-statistics'],
    queryFn: async () => {
      try {
        // Use fetch directly since this endpoint is now public
        const API_BASE = typeof window !== 'undefined' 
          ? (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000')
          : 'http://127.0.0.1:8000';
        const response = await fetch(`${API_BASE}/api/v1/research/data/statistics`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
      } catch (err) {
        console.error('Failed to fetch research statistics:', err);
        return null;
      }
    },
    retry: 1,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

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

  const accessTiers = [
    {
      id: 'researcher',
      title: 'Researcher / Scientist',
      description: 'Full access to anonymized datasets for research purposes',
      icon: Brain,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'hospital',
      title: 'Hospital Partner',
      description: 'Collaborative data sharing and benchmarking capabilities',
      icon: Activity,
      color: 'from-teal-500 to-cyan-500',
    },
    {
      id: 'government',
      title: 'Government Agency',
      description: 'Comprehensive national health policy and planning data',
      icon: Shield,
      color: 'from-indigo-500 to-blue-500',
    },
    {
      id: 'student',
      title: 'Student (Restricted)',
      description: 'Limited access for academic research and learning',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50/30 to-blue-50/50 relative overflow-hidden">
      {/* Animated Grid Background Pattern */}
      <div 
        className="fixed inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(15, 23, 42, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 23, 42, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }} 
      />

      {/* 3D Cancer Cell Animations */}
      {mounted && (
        <>
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <CancerCell3D delay={0} />
            <motion.div
              className="absolute"
              style={{ left: '10%', top: '20%' }}
              initial={{ x: 0, y: 0 }}
              animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            >
              <CancerCell3D delay={2} />
            </motion.div>
            <motion.div
              className="absolute"
              style={{ right: '15%', top: '60%' }}
              initial={{ x: 0, y: 0 }}
              animate={{ x: [0, -40, 0], y: [0, 50, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            >
              <CancerCell3D delay={4} />
            </motion.div>
            <DNAHelix delay={0} x={5} />
            <DNAHelix delay={1} x={85} />
          </div>
        </>
      )}

      {/* Professional Header */}
      <motion.nav 
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-sm"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <motion.div 
                className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl flex items-center justify-center shadow-md"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <FileText className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-2xl font-bold text-slate-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  University Malaya Medical Centre Cancer Registry
                </motion.h1>
              </div>
            </motion.div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign In
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowRequestModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              >
                Request Full Data Access
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gradient mb-2">Public Research Data Portal</h1>
          <p className="text-gray-600 text-lg">Explore anonymized cancer registry data and analytics</p>
        </motion.div>

        {/* Stats Grid - Same as Research Dashboard */}
        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="glass-card p-6 rounded-2xl"
              >
                <div className="h-32 flex items-center justify-center text-gray-500">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : researchStats && researchStats.statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { 
                icon: FileText, 
                label: 'Total Records', 
                value: researchStats.summary?.total_anonymized_patients || 0, 
                subtitle: 'Anonymized patients',
                color: 'from-blue-500 to-cyan-500' 
              },
              { 
                icon: BarChart3, 
                label: 'Cancer Types', 
                value: researchStats.statistics.by_cancer_type?.length || 0,
                subtitle: 'Unique diagnoses',
                color: 'from-cyan-500 to-indigo-500' 
              },
              { 
                icon: Database, 
                label: 'Data Available', 
                value: researchStats.summary?.data_available ? 'Yes' : 'No',
                subtitle: 'Ready for download',
                color: 'from-indigo-500 to-blue-600' 
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`glass-card p-6 rounded-2xl bg-gradient-to-br ${stat.color} shadow-xl`}
              >
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className="w-12 h-12 text-black opacity-90" />
                  <TrendingUp className="w-6 h-6 text-black opacity-70" />
                </div>
                <div>
                  <p className="text-black text-sm mb-1 font-medium">{stat.label}</p>
                  <p className="text-4xl font-bold mb-1 text-black">{stat.value}</p>
                  <p className="text-black text-xs opacity-80">{stat.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Charts Grid - Same as Research Dashboard */}
        {statsLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {[1, 2].map((i) => (
              <motion.div
                key={i}
                className="glass-card p-6 rounded-2xl"
              >
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : researchStats && researchStats.statistics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Year-wise Distribution */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Cases by Year
                </h3>
              </div>
              {!researchStats.statistics.by_year || researchStats.statistics.by_year.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No year data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={researchStats.statistics.by_year || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis dataKey="year" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="patient_count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Age Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 rounded-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Age Distribution
                </h3>
              </div>
              {!researchStats.statistics.by_age_group || researchStats.statistics.by_age_group.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <p>No age data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={researchStats.statistics.by_age_group || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ age_group, patient_count }: any) => `${age_group}: ${patient_count}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="patient_count"
                    >
                      {(researchStats.statistics.by_age_group || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid rgba(0,0,0,0.1)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </motion.div>
          </div>
        )}

        {/* Cancer Type Breakdown - Same as Research Dashboard */}
        {researchStats?.statistics?.by_cancer_type && researchStats.statistics.by_cancer_type.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6 rounded-2xl mb-8"
          >
            <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Cancer Type Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {researchStats.statistics.by_cancer_type.slice(0, 6).map((item: any, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-xl border border-blue-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-blue-600">{item.icd11_main_code}</span>
                    <span className="text-2xl font-bold text-gray-900">{item.patient_count}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Technology Promotion Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="p-8 rounded-2xl bg-white shadow-md border border-slate-200/60 mb-12 backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-cyan-600" />
            Advanced Technology & Security
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 bg-white rounded-xl border border-cyan-100 shadow-sm"
            >
              <Brain className="w-8 h-8 text-cyan-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">AI-Assisted ICD-11 Coding</h3>
              <p className="text-sm text-slate-600">Automated entity recognition and smart coding using advanced machine learning algorithms.</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 bg-white rounded-xl border border-teal-100 shadow-sm"
            >
              <Lock className="w-8 h-8 text-teal-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">De-identification Algorithms</h3>
              <p className="text-sm text-slate-600">Advanced privacy-preserving techniques ensuring complete patient anonymity.</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 bg-white rounded-xl border border-blue-100 shadow-sm"
            >
              <Shield className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">Blockchain Audit Logs</h3>
              <p className="text-sm text-slate-600">Tamper-proof cryptographic logging of all registry modifications and access.</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              className="p-6 bg-white rounded-xl border border-purple-100 shadow-sm"
            >
              <Database className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-bold text-slate-900 mb-2">End-to-End Encryption</h3>
              <p className="text-sm text-slate-600">Secure API access with encrypted data transmission for approved researchers.</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Data Request CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="p-8 rounded-2xl bg-white shadow-md border border-cyan-100/50 text-center backdrop-blur-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Need Full Dataset Access?</h2>
          <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
            Create an account and submit a data request to access comprehensive anonymized datasets for research, policy planning, or collaborative analysis.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowRequestModal(true)}
            className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 mx-auto"
          >
            Request Full Data Access
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </div>

      {/* Data Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            className="p-8 rounded-2xl bg-white shadow-xl border border-slate-200 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ perspective: '1000px' }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Request Full Data Access</h2>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedTier(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-600 mb-6">
              To access full datasets, please create an account and submit a data request. Select your access tier:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {accessTiers.map((tier) => {
                const Icon = tier.icon;
                return (
                  <motion.button
                    key={tier.id}
                    whileHover={{ scale: 1.02, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${
                      selectedTier === tier.id
                        ? 'border-cyan-500 bg-cyan-50 shadow-md'
                        : 'border-slate-200 hover:border-cyan-300 bg-white'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${tier.color} flex items-center justify-center mb-3 shadow-sm`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">{tier.title}</h3>
                    <p className="text-sm text-slate-600">{tier.description}</p>
                    {selectedTier === tier.id && (
                      <CheckCircle2 className="w-5 h-5 text-cyan-600 mt-2" />
                    )}
                  </motion.button>
                );
              })}
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  router.push('/research/signup');
                }}
                disabled={!selectedTier}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  selectedTier
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Create Account & Continue
              </motion.button>
              <button
                onClick={() => {
                  setShowRequestModal(false);
                  setSelectedTier(null);
                }}
                className="px-6 py-3 text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
