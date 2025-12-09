'use client';

import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  FileText, 
  Shield, 
  Brain, 
  Activity, 
  Globe,
  ArrowRight,
  Database,
  TrendingUp,
  Lock,
  CheckCircle2,
  Sparkles,
  Menu,
  X,
  Home,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';

export default function DashboardsHub() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        return;
      }
      
      try {
        const userData = await authApi.getMe();
        setUser(userData);
        setUserRoles(userData.roles || []);
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    
    checkAuth();
  }, [mounted]);

  const dashboards = [
    {
      id: 'public',
      title: 'Public Dashboard',
      description: 'Explore anonymized cancer registry data and analytics',
      icon: Globe,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      path: '/public-dashboard',
      public: true,
      roles: [],
      features: ['Anonymized statistics', 'Cancer type breakdown', 'Year-wise trends', 'Age distribution'],
      category: 'Public'
    },
    {
      id: 'hospital',
      title: 'Hospital Registrar',
      description: 'Manage patient records with ICD-11 auto-fill and AI processing',
      icon: FileText,
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-50',
      path: '/hospital',
      public: false,
      roles: ['registry_editor', 'registry_viewer', 'ummc_admin', 'super_admin'],
      features: ['Patient management', 'ICD-11 coding', 'AI document processing', 'Follow-up tracking'],
      category: 'Clinical'
    },
    {
      id: 'research',
      title: 'Researcher Dashboard',
      description: 'Access anonymized datasets for research purposes',
      icon: Brain,
      color: 'from-indigo-500 to-blue-600',
      bgColor: 'bg-indigo-50',
      path: '/research',
      public: false,
      roles: ['researcher', 'ummc_admin', 'super_admin'],
      features: ['Data requests', 'Statistics', 'ML Training', 'Request tracking'],
      category: 'Research'
    },
    {
      id: 'ai-dashboards',
      title: 'AI Research Dashboards',
      description: 'Predictive modeling & epidemiological trend analysis',
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-600',
      bgColor: 'bg-purple-50',
      path: '/research/ai-dashboards',
      public: false,
      roles: ['researcher', 'ummc_admin', 'super_admin'],
      features: ['Predictive modeling', 'Epidemiological trends', 'Survival analysis', 'Computational resources'],
      category: 'Research'
    },
    {
      id: 'admin-ummc',
      title: 'UMMC Admin',
      description: 'System oversight, approvals, and user management',
      icon: Shield,
      color: 'from-blue-600 to-indigo-600',
      bgColor: 'bg-blue-50',
      path: '/admin/ummc',
      public: false,
      roles: ['ummc_admin', 'super_admin'],
      features: ['Research approvals', 'User management', 'System monitoring', 'Audit logs'],
      category: 'Administration'
    },
    {
      id: 'admin-super',
      title: 'Super Admin',
      description: 'Full system administration and configuration',
      icon: Database,
      color: 'from-slate-600 to-gray-700',
      bgColor: 'bg-slate-50',
      path: '/admin/super',
      public: false,
      roles: ['super_admin'],
      features: ['Full system control', 'Role management', 'Organization management', 'Advanced analytics'],
      category: 'Administration'
    },
  ];

  const canAccess = (dashboard: typeof dashboards[0]) => {
    if (dashboard.public) return true;
    if (!user || userRoles.length === 0) return false;
    return dashboard.roles.some(role => userRoles.includes(role));
  };

  const accessibleDashboards = dashboards.filter(canAccess);
  const restrictedDashboards = dashboards.filter(d => !canAccess(d));
  
  const categories = Array.from(new Set(dashboards.map(d => d.category)));
  const dashboardsByCategory = categories.map(cat => ({
    category: cat,
    dashboards: dashboards.filter(d => d.category === cat)
  }));

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="glass-nav sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
              </button>
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">UM-HDSH</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">{user.email?.[0]?.toUpperCase()}</span>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-gray-500">{userRoles.join(', ')}</p>
                    </div>
                  </div>
                  <Link href="/auth/login">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 glass-button text-white rounded-lg font-medium text-sm"
                    >
                      Switch Account
                    </motion.button>
                  </Link>
                </>
              ) : (
                <Link href="/auth/login">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 glass-button text-white rounded-lg font-medium text-sm"
                  >
                    Sign In
                  </motion.button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Menu */}
        <aside className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          <div className="p-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Menu</h3>
            <nav className="space-y-2">
              <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
                <Home className="w-5 h-5" />
                <span className="font-medium">Home</span>
              </Link>
              <Link href="/dashboards" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium">
                <LayoutDashboard className="w-5 h-5" />
                <span>All Dashboards</span>
              </Link>
              {categories.map((cat) => (
                <div key={cat} className="pt-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">{cat}</h4>
                  {dashboards
                    .filter(d => d.category === cat && canAccess(d))
                    .map((dashboard) => {
                      const Icon = dashboard.icon;
                      return (
                        <Link
                          key={dashboard.id}
                          href={dashboard.path}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors group"
                        >
                          <Icon className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                          <span className="text-sm">{dashboard.title}</span>
                        </Link>
                      );
                    })}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="container mx-auto px-6 py-12">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-gradient-dark">
                Dashboard Hub
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl">
                Access all available dashboards for the UM-HDSH Cancer Registry Platform. 
                Organized by category for easy navigation.
              </p>
              {user && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-900 font-medium">Logged in as {user.email}</span>
                  <span className="text-blue-600">•</span>
                  <span className="text-blue-700">{userRoles.join(', ')}</span>
                </div>
              )}
            </motion.div>

            {/* Dashboards by Category */}
            {dashboardsByCategory.map((categoryGroup, catIdx) => {
              const categoryDashboards = categoryGroup.dashboards.filter(canAccess);
              if (categoryDashboards.length === 0) return null;

              return (
                <motion.div
                  key={categoryGroup.category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: catIdx * 0.1 }}
                  className="mb-12"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                    <h2 className="text-2xl font-bold text-gray-900">{categoryGroup.category}</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryDashboards.map((dashboard, i) => {
                      const Icon = dashboard.icon;
                      return (
                        <motion.div
                          key={dashboard.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: catIdx * 0.1 + i * 0.05 }}
                          whileHover={{ y: -4 }}
                          className="glass-card p-6 rounded-2xl cursor-pointer group border border-gray-200/50"
                          onClick={() => router.push(dashboard.path)}
                        >
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${dashboard.color} flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-all`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <h3 className="text-xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">
                            {dashboard.title}
                          </h3>
                          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                            {dashboard.description}
                          </p>
                          <div className="space-y-2 mb-4">
                            {dashboard.features.slice(0, 3).map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                <span>{feature}</span>
                              </div>
                            ))}
                          </div>
                          <motion.div
                            whileHover={{ x: 4 }}
                            className="flex items-center gap-2 text-blue-600 font-medium text-sm group-hover:gap-3 transition-all"
                          >
                            <span>Open Dashboard</span>
                            <ArrowRight className="w-4 h-4" />
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}

            {/* Restricted Dashboards */}
            {restrictedDashboards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-12"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Lock className="w-6 h-6 text-amber-600" />
                    Restricted Access
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restrictedDashboards.map((dashboard, i) => {
                    const Icon = dashboard.icon;
                    return (
                      <motion.div
                        key={dashboard.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="glass-card p-6 rounded-2xl opacity-60 relative border border-gray-200/50"
                      >
                        <div className="absolute top-4 right-4">
                          <Lock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${dashboard.color} flex items-center justify-center mb-4 shadow-lg opacity-50`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-gray-900">{dashboard.title}</h3>
                        <p className="text-gray-600 mb-4 text-sm">{dashboard.description}</p>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                          <p className="font-semibold text-amber-900 mb-1">Access Required:</p>
                          <p className="text-amber-700 text-xs">
                            {dashboard.roles.length > 0 
                              ? `Requires: ${dashboard.roles.join(', ')}`
                              : 'Requires authentication'}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              {[
                { icon: Database, label: 'Total', value: dashboards.length, color: 'from-blue-500 to-cyan-500' },
                { icon: CheckCircle2, label: 'Available', value: accessibleDashboards.length, color: 'from-green-500 to-emerald-500' },
                { icon: Lock, label: 'Restricted', value: restrictedDashboards.length, color: 'from-amber-500 to-orange-500' },
                { icon: Users, label: 'Categories', value: categories.length, color: 'from-purple-500 to-indigo-500' },
              ].map((stat, i) => {
                const StatIcon = stat.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    className="glass-card p-6 rounded-xl border border-gray-200/50"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                        <StatIcon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm mb-1 font-medium">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
