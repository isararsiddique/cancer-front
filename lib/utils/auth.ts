/**
 * Utility functions for authentication and cache management
 */

/**
 * Clears all cached data from localStorage and sessionStorage
 * This should be called when switching dashboards or logging out
 */
export function clearCache(): void {
  if (typeof window === 'undefined') return;

  // Clear all localStorage items except tokens (we'll clear those separately if needed)
  const keysToKeep: string[] = []; // Keep nothing when switching dashboards
  
  // Get all keys
  const allKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) allKeys.push(key);
  }

  // Remove keys not in keep list
  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  });

  // Clear sessionStorage
  sessionStorage.clear();

  // Clear React Query cache if available
  if (typeof window !== 'undefined' && (window as any).queryClient) {
    (window as any).queryClient.clear();
  }
}

/**
 * Clears cache and redirects to login
 */
export function clearCacheAndRedirect(router: any): void {
  clearCache();
  router.push('/auth/login');
}

/**
 * Clears only non-essential cache (keeps auth tokens)
 */
export function clearNonEssentialCache(): void {
  if (typeof window === 'undefined') return;

  // Keep only auth tokens
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');

  // Clear everything
  localStorage.clear();
  sessionStorage.clear();

  // Restore tokens
  if (accessToken) localStorage.setItem('access_token', accessToken);
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
}

