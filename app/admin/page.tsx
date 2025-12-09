'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { Shield } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();

  const { data: userData } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => await authApi.getMe(),
  });

  useEffect(() => {
    if (userData) {
      if (userData.roles.includes('super_admin')) {
        router.push('/admin/super');
      } else if (userData.roles.includes('ummc_admin')) {
        router.push('/admin/ummc');
      } else {
        router.push('/auth/login');
      }
    }
  }, [userData, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center animate-spin">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <p className="text-slate-600">Redirecting to admin dashboard...</p>
      </div>
    </div>
  );
}
