'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Users, FileText, Shield, Activity } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Set mounted state to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check authentication on mount - redirect to login if not authenticated
  useEffect(() => {
    if (!mounted) return;
    
    const checkAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      // Verify token is valid
      try {
        const user = await authApi.getMe();
        // If authenticated, redirect based on role
        if (user.roles.includes('super_admin')) {
          router.push('/admin/super');
        } else if (user.roles.includes('ummc_admin')) {
          router.push('/admin/ummc');
        } else if (user.roles.includes('registry_editor') || user.roles.includes('registry_viewer')) {
          router.push('/hospital');
        } else if (user.roles.includes('researcher')) {
          router.push('/research');
        }
      } catch (error) {
        // Token invalid, redirect to login
        router.push('/auth/login');
      }
    };
    
    checkAuth();
  }, [router, mounted]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50">
        <div className="absolute inset-0">
          {mounted && [...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/30 rounded-full"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              }}
              animate={{
                y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)],
                x: [null, Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920)],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="glass-strong border-b border-white/20">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-gradient"
              >
                University Malaya Medical Centre Cancer Registry
              </motion.div>
              <div className="flex gap-4">
                <Link href="/auth/login">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 glass-button text-white rounded-lg font-medium"
                  >
                    Sign In
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="container mx-auto px-6 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-6xl font-bold mb-6 text-gradient">
              University Malaya Medical Centre
              <br />
              Cancer Registry
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Advanced platform for cancer data management, research, and analytics
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/dashboards">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 glass-button text-white rounded-xl font-semibold text-lg flex items-center gap-2"
                >
                  View All Dashboards
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href="/create-patient">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 glass-button text-white rounded-xl font-semibold text-lg flex items-center gap-2"
                >
                  Create Patient
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href="/research/request">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 glass-button text-white rounded-xl font-semibold text-lg flex items-center gap-2"
                >
                  Request Research Data
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link href="/auth/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 glass-card text-gray-700 rounded-xl font-semibold text-lg border border-white/30"
                >
                  Login
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto"
          >
            {[
              { icon: Users, label: 'Active Users', value: '500+' },
              { icon: Activity, label: 'Research Requests', value: '200+' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-6 rounded-2xl text-center"
              >
                <stat.icon className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                title: 'Hospital Registrar',
                description: 'Manage patient records with ICD-11 auto-fill',
                icon: FileText,
                color: 'from-blue-500 to-cyan-500',
              },
              {
                title: 'Researcher',
                description: 'Access anonymized data for research',
                icon: Users,
                color: 'from-cyan-500 to-blue-500',
              },
              {
                title: 'Administrator',
                description: 'System oversight and approvals',
                icon: Shield,
                color: 'from-blue-600 to-indigo-600',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="glass-card p-8 rounded-2xl"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>
      </div>
    </div>
  );
}

