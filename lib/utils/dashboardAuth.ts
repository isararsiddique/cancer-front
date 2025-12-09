/**
 * Dashboard Authentication Utilities
 * 
 * Implements aggressive authentication where users must login separately
 * for each dashboard and cannot switch between them with one login.
 */

/**
 * Clear authentication tokens and force re-login
 * Call this when switching between dashboards
 */
export function clearAuthTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.clear();
  }
}

/**
 * Check if user is authenticated
 * Returns true if valid token exists
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const token = localStorage.getItem('access_token');
  return !!token;
}

/**
 * Get the current dashboard from pathname
 */
export function getCurrentDashboard(pathname: string): 'hospital' | 'research' | 'other' {
  if (pathname.includes('/hospital')) return 'hospital';
  if (pathname.includes('/research')) return 'research';
  return 'other';
}

/**
 * Store the last visited dashboard
 */
export function setLastDashboard(dashboard: 'hospital' | 'research'): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('last_dashboard', dashboard);
  }
}

/**
 * Get the last visited dashboard
 */
export function getLastDashboard(): 'hospital' | 'research' | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('last_dashboard') as 'hospital' | 'research' | null;
}

/**
 * Check if user is switching dashboards
 * If yes, clear tokens to force re-login
 */
export function checkDashboardSwitch(currentPath: string): boolean {
  const currentDashboard = getCurrentDashboard(currentPath);
  const lastDashboard = getLastDashboard();
  
  if (lastDashboard && currentDashboard !== 'other' && lastDashboard !== currentDashboard) {
    // User is switching dashboards - clear tokens
    clearAuthTokens();
    return true;
  }
  
  // Update last dashboard
  if (currentDashboard !== 'other') {
    setLastDashboard(currentDashboard);
  }
  
  return false;
}
