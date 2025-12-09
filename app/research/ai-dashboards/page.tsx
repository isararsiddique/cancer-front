'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Brain,
  TrendingUp,
  Activity,
  Database,
  Cpu,
  Server,
  BarChart3,
  Sparkles,
  ArrowRight,
  Play,
  Pause,
  RefreshCw,
  Download,
  Settings,
  Zap,
  Target,
  LineChart as LineChartIcon,
  Calendar,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { researchApi } from '@/lib/api/research';
import { authApi } from '@/lib/api/auth';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

export default function AIDashboards() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('survival');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'predictive' | 'epidemiological' | 'resources'>('predictive');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user's approved research requests
  const { data: myRequests } = useQuery({
    queryKey: ['my-research-requests'],
    queryFn: async () => {
      try {
        return await researchApi.listMyRequests();
      } catch (error) {
        console.error('Failed to fetch requests:', error);
        return null;
      }
    },
    enabled: mounted,
  });

  // Mock data for demonstration - replace with actual API calls
  const survivalData = [
    { month: 0, survival_rate: 100 },
    { month: 6, survival_rate: 85 },
    { month: 12, survival_rate: 72 },
    { month: 18, survival_rate: 65 },
    { month: 24, survival_rate: 58 },
    { month: 30, survival_rate: 52 },
    { month: 36, survival_rate: 48 },
  ];

  const epidemiologicalTrends = [
    { year: 2018, cases: 1250, deaths: 320, incidence_rate: 12.5 },
    { year: 2019, cases: 1320, deaths: 335, incidence_rate: 13.2 },
    { year: 2020, cases: 1280, deaths: 340, incidence_rate: 12.8 },
    { year: 2021, cases: 1400, deaths: 350, incidence_rate: 14.0 },
    { year: 2022, cases: 1450, deaths: 360, incidence_rate: 14.5 },
    { year: 2023, cases: 1500, deaths: 365, incidence_rate: 15.0 },
    { year: 2024, cases: 1550, deaths: 370, incidence_rate: 15.5 },
  ];

  const cancerTypeDistribution = [
    { name: 'Breast', cases: 450, percentage: 29 },
    { name: 'Lung', cases: 320, percentage: 21 },
    { name: 'Colorectal', cases: 280, percentage: 18 },
    { name: 'Prostate', cases: 250, percentage: 16 },
    { name: 'Other', cases: 250, percentage: 16 },
  ];

  const predictiveModels = [
    {
      id: 'survival',
      name: 'Survival Prediction',
      description: 'Predict patient survival rates based on clinical features',
      accuracy: '87.3%',
      status: 'active',
    },
    {
      id: 'recurrence',
      name: 'Recurrence Risk',
      description: 'Assess risk of cancer recurrence post-treatment',
      accuracy: '82.1%',
      status: 'active',
    },
    {
      id: 'treatment',
      name: 'Treatment Response',
      description: 'Predict treatment response and outcomes',
      accuracy: '79.5%',
      status: 'training',
    },
    {
      id: 'progression',
      name: 'Disease Progression',
      description: 'Forecast disease progression patterns',
      accuracy: '75.8%',
      status: 'active',
    },
  ];

  const handleTrainModel = async (modelId: string) => {
    setIsTraining(true);
    setTrainingProgress(0);
    
    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    // In production, this would call the actual API
    setTimeout(() => {
      clearInterval(interval);
      setIsTraining(false);
      setTrainingProgress(100);
    }, 5000);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg"
              >
                <Brain className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Research Dashboards</h1>
                <p className="text-sm text-gray-600">
                  Advanced analytics, predictive modeling & epidemiological trends
                </p>
              </div>
            </div>
            <motion.button
              onClick={() => router.push('/research')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Back to Research
            </motion.button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6 bg-white/60 backdrop-blur-sm rounded-lg p-1">
          {[
            { id: 'predictive', label: 'Predictive Modeling', icon: Brain },
            { id: 'epidemiological', label: 'Epidemiological Trends', icon: TrendingUp },
            { id: 'resources', label: 'Computational Resources', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-white/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Predictive Modeling Tab */}
        {activeTab === 'predictive' && (
          <div className="space-y-6">
            {/* Model Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {predictiveModels.map((model) => (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    selectedModel === model.id
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-xl'
                      : 'bg-white/80 backdrop-blur-sm border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">{model.name}</h3>
                    {model.status === 'active' && (
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                    {model.status === 'training' && (
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    )}
                  </div>
                  <p className="text-sm opacity-90 mb-3">{model.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-75">Accuracy: {model.accuracy}</span>
                    {model.status === 'training' && (
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTrainModel(model.id);
                        }}
                        className="px-3 py-1 bg-white/20 rounded-lg text-xs font-semibold"
                      >
                        {isTraining ? 'Training...' : 'Train'}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Training Progress */}
            {isTraining && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
                    Training Model...
                  </h3>
                  <span className="text-sm text-gray-600">{trainingProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${trainingProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Survival Analysis */}
            {selectedModel === 'survival' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200"
                  >
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      Survival Curve Analysis
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={survivalData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" label={{ value: 'Months', position: 'insideBottom', offset: -5 }} />
                        <YAxis label={{ value: 'Survival Rate (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="survival_rate"
                          stroke="#8b5cf6"
                          strokeWidth={3}
                          dot={{ fill: '#8b5cf6', r: 5 }}
                          name="Survival Rate"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200"
                  >
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      Risk Factors Analysis
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={[
                        { factor: 'Age > 65', impact: 0.35 },
                        { factor: 'Stage III/IV', impact: 0.42 },
                        { factor: 'Comorbidities', impact: 0.28 },
                        { factor: 'Treatment Delay', impact: 0.31 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="factor" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="impact" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                </div>

                {/* Future Trend Prediction for Prognosis */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200"
                >
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Future Trend Prediction - Prognosis Forecast
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Predicted survival rates and prognosis trends for the next 5 years based on historical data and current treatment patterns.
                  </p>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={[
                      { month: 0, historical: 100, predicted: 100, confidence_upper: 100, confidence_lower: 100 },
                      { month: 6, historical: 85, predicted: 85, confidence_upper: 88, confidence_lower: 82 },
                      { month: 12, historical: 72, predicted: 72, confidence_upper: 75, confidence_lower: 69 },
                      { month: 18, historical: 65, predicted: 65, confidence_upper: 68, confidence_lower: 62 },
                      { month: 24, historical: 58, predicted: 58, confidence_upper: 61, confidence_lower: 55 },
                      { month: 30, historical: 52, predicted: 52, confidence_upper: 55, confidence_lower: 49 },
                      { month: 36, historical: 48, predicted: 48, confidence_upper: 51, confidence_lower: 45 },
                      { month: 42, historical: null, predicted: 45, confidence_upper: 48, confidence_lower: 42 },
                      { month: 48, historical: null, predicted: 42, confidence_upper: 45, confidence_lower: 39 },
                      { month: 54, historical: null, predicted: 40, confidence_upper: 43, confidence_lower: 37 },
                      { month: 60, historical: null, predicted: 38, confidence_upper: 41, confidence_lower: 35 },
                    ]}>
                      <defs>
                        <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        label={{ value: 'Months from Diagnosis', position: 'insideBottom', offset: -5 }} 
                      />
                      <YAxis label={{ value: 'Survival Rate (%)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (value === null) return ['N/A', name];
                          return [`${value.toFixed(1)}%`, name];
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="confidence_upper"
                        stroke="none"
                        fill="url(#colorConfidence)"
                        fillOpacity={0.3}
                        name="95% Confidence Upper"
                      />
                      <Area
                        type="monotone"
                        dataKey="confidence_lower"
                        stroke="none"
                        fill="url(#colorConfidence)"
                        fillOpacity={0.3}
                        name="95% Confidence Lower"
                      />
                      <Line
                        type="monotone"
                        dataKey="historical"
                        stroke="#6366f1"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#6366f1', r: 4 }}
                        name="Historical Data"
                      />
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#8b5cf6"
                        strokeWidth={3}
                        dot={{ fill: '#8b5cf6', r: 5 }}
                        name="Predicted Prognosis"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">1-Year Survival</p>
                      <p className="text-lg font-bold text-blue-600">72% ± 3%</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">3-Year Survival</p>
                      <p className="text-lg font-bold text-purple-600">48% ± 3%</p>
                    </div>
                    <div className="p-3 bg-pink-50 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">5-Year Survival (Predicted)</p>
                      <p className="text-lg font-bold text-pink-600">38% ± 3%</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Model Performance Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                Model Performance Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Accuracy', value: '87.3%', color: 'from-green-500 to-emerald-500' },
                  { label: 'Precision', value: '84.2%', color: 'from-blue-500 to-cyan-500' },
                  { label: 'Recall', value: '81.7%', color: 'from-purple-500 to-pink-500' },
                  { label: 'F1 Score', value: '82.9%', color: 'from-orange-500 to-red-500' },
                ].map((metric, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-4 rounded-lg bg-gradient-to-br ${metric.color} text-white`}
                  >
                    <p className="text-sm opacity-90 mb-1">{metric.label}</p>
                    <p className="text-2xl font-bold">{metric.value}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Epidemiological Trends Tab */}
        {activeTab === 'epidemiological' && (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Cases (2024)', value: '1,550', icon: Users, color: 'from-blue-500 to-cyan-500' },
                { label: 'Incidence Rate', value: '15.5/100k', icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
                { label: 'Mortality Rate', value: '23.9%', icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
                { label: '5-Year Trend', value: '+24%', icon: LineChartIcon, color: 'from-green-500 to-emerald-500' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-6 rounded-xl bg-gradient-to-br ${stat.color} text-white`}
                  >
                    <Icon className="w-6 h-6 mb-2 opacity-90" />
                    <p className="text-sm opacity-90 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </motion.div>
                );
              })}
            </div>

            {/* Trend Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200"
              >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Incidence Trends (2018-2024)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={epidemiologicalTrends}>
                    <defs>
                      <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="cases"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorCases)"
                      name="New Cases"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200"
              >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Cancer Type Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={cancerTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="cases"
                    >
                      {cancerTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Mortality Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-purple-600" />
                Mortality Trends & Predictions
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={epidemiologicalTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="deaths"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Deaths"
                    dot={{ fill: '#ef4444', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="incidence_rate"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Incidence Rate (/100k)"
                    dot={{ fill: '#8b5cf6', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

        {/* Computational Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-600" />
                Provisioned Computational Resources
              </h3>
              <p className="text-gray-600 mb-6">
                Provisioning of the necessary software and computational resources to support advanced data analysis, 
                including predictive modelling and epidemiological trend analysis.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    name: 'Jupyter Notebooks',
                    status: 'active',
                    cpu: '4 cores',
                    memory: '16 GB',
                    storage: '100 GB',
                    icon: Brain,
                    color: 'from-blue-500 to-cyan-500',
                  },
                  {
                    name: 'Python Environment',
                    status: 'active',
                    cpu: '2 cores',
                    memory: '8 GB',
                    storage: '50 GB',
                    icon: Cpu,
                    color: 'from-purple-500 to-pink-500',
                  },
                  {
                    name: 'R Studio Server',
                    status: 'available',
                    cpu: '2 cores',
                    memory: '8 GB',
                    storage: '50 GB',
                    icon: Database,
                    color: 'from-green-500 to-emerald-500',
                  },
                ].map((resource, i) => {
                  const Icon = resource.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-6 rounded-xl bg-gradient-to-br ${resource.color} text-white`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Icon className="w-6 h-6" />
                          <h4 className="font-bold text-lg">{resource.name}</h4>
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            resource.status === 'active'
                              ? 'bg-white/30 backdrop-blur-sm'
                              : 'bg-white/20 backdrop-blur-sm'
                          }`}
                        >
                          {resource.status === 'active' ? 'Active' : 'Available'}
                        </div>
                      </div>
                      <div className="space-y-2 text-sm opacity-90">
                        <div className="flex justify-between">
                          <span>CPU:</span>
                          <span className="font-semibold">{resource.cpu}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Memory:</span>
                          <span className="font-semibold">{resource.memory}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Storage:</span>
                          <span className="font-semibold">{resource.storage}</span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="mt-4 w-full py-2 bg-white/20 backdrop-blur-sm rounded-lg font-semibold hover:bg-white/30 transition-colors"
                      >
                        {resource.status === 'active' ? 'Access Workspace' : 'Provision'}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Software Stack */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200"
            >
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                Available Software & Libraries
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  'Python 3.11',
                  'R 4.3',
                  'Jupyter Lab',
                  'Pandas',
                  'NumPy',
                  'Scikit-learn',
                  'XGBoost',
                  'TensorFlow',
                  'PyTorch',
                  'Matplotlib',
                  'Seaborn',
                  'Plotly',
                ].map((software, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg text-center font-semibold text-gray-700"
                  >
                    {software}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

