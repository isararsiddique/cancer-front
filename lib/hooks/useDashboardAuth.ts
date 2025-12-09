import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { validateDashboardAccess, checkDashboardSwitch } from '@/lib/utils/dashboardAuth';

/**
 * Hook to validate dashboard access and handle authentication
 * Redirects to login if user doesn't have valid token for this dashboard
 */
export function useDashboardAuth(requiredDashboard: 'hospital' | 'researcher', currentPath: string) {
  const router = useRouter();

  useEffect(() => {
    // Check if user is switching dashboards
    const isSwitching = checkDashboardSwitch(currentPath);
    
    if (isSwitching) {
      // User switched dashboards - redirect to login
      router.push('/auth/login?error=dashboard_mismatch');
      return;
    }

    // Validate dashboard access
    const isValid = validateDashboardAccess(requiredDashboard);
    
    if (!isValid) {
      // Invalid or mismatched token - redirect to login
      router.push('/auth/login');
    }
  }, [requiredDashboard, currentPath, router]);
}
