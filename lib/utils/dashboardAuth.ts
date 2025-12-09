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
    localStorage.removeItem('dashboard_type');
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
export function getCurrentDashboard(pathname: string): 'hospital' | 'researcher' | 'other' {
  if (pathname.includes('/hospital')) return 'hospital';
  if (pathname.includes('/research')) return 'researcher';
  return 'other';
}

/**
 * Get the stored dashboard type from token
 */
export function getStoredDashboardType(): 'hospital' | 'researcher' | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dashboard_type') as 'hospital' | 'researcher' | null;
}

/**
 * Store the last visited dashboard
 */
export function setLastDashboard(dashboard: 'hospital' | 'researcher'): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('last_dashboard', dashboard);
  }
}

/**
 * Get the last visited dashboard
 */
export function getLastDashboard(): 'hospital' | 'researcher' | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('last_dashboard') as 'hospital' | 'researcher' | null;
}

/**
 * Check if user is switching dashboards
 * If yes, clear tokens to force re-login
 */
export function checkDashboardSwitch(currentPath: string): boolean {
  const currentDashboard = getCurrentDashboard(currentPath);
  const lastDashboard = getLastDashboard();
  const storedDashboardType = getStoredDashboardType();
  
  // Check if stored dashboard type matches current dashboard
  if (storedDashboardType && currentDashboard !== 'other' && storedDashboardType !== currentDashboard) {
    // Dashboard mismatch - clear tokens and force re-login
    clearAuthTokens();
    return true;
  }
  
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

/**
 * Validate that the user's token matches the required dashboard
 * Returns true if valid, false if mismatch (should redirect to login)
 */
export function validateDashboardAccess(requiredDashboard: 'hospital' | 'researcher'): boolean {
  if (typeof window === 'undefined') return false;
  
  const storedDashboardType = getStoredDashboardType();
  const hasToken = isAuthenticated();
  
  if (!hasToken) return false;
  
  // If no stored dashboard type, assume valid (backward compatibility)
  if (!storedDashboardType) return true;
  
  // Check if stored dashboard matches required
  if (storedDashboardType !== requiredDashboard) {
    clearAuthTokens();
    return false;
  }
  
  return true;
}
