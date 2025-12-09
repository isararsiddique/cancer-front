# Quick Reference: Dashboard Authentication

## What Changed?

The backend now requires users to specify which dashboard they're logging into, and tokens are locked to that dashboard. Users cannot switch between hospital and research dashboards without logging in again.

## Key Points

1. **Login requires dashboard_type**: "hospital" or "researcher"
2. **Tokens are dashboard-locked**: Hospital tokens only work with hospital endpoints, researcher tokens only work with research endpoints
3. **Switching dashboards requires re-login**: Navigating from /hospital to /research (or vice versa) clears tokens and redirects to login
4. **401 errors force re-authentication**: If backend detects dashboard mismatch, frontend clears tokens and redirects to login

## For Developers

### Adding Dashboard Validation to a Page

```typescript
import { useDashboardAuth } from '@/lib/hooks/useDashboardAuth';

export default function MyDashboardPage() {
  // Add this line at the top of your component
  useDashboardAuth('hospital', '/hospital'); // or 'researcher' for research pages
  
  // Rest of your component...
}
```

### Manual Token Validation

```typescript
import { validateDashboardAccess, clearAuthTokens } from '@/lib/utils/dashboardAuth';

// Check if user has valid token for hospital dashboard
const isValid = validateDashboardAccess('hospital');
if (!isValid) {
  router.push('/auth/login');
}

// Clear all tokens when logging out or switching
clearAuthTokens();
```

### API Requests

No changes needed! The API client automatically:
- Adds Authorization header with token
- Detects dashboard mismatch errors (401)
- Clears tokens and redirects to login on mismatch

## Backend URL

All API requests go to: **http://98.92.253.206:8000**

Configured in:
- `.env.production` - Production environment
- `.env.aws` - AWS environment  
- `.env.local` - Local development (uses localhost:8000)

## Testing

1. **Login as hospital user**:
   - Should redirect to /hospital
   - Can access patient endpoints
   - Cannot access research endpoints (gets 401)

2. **Login as researcher**:
   - Should redirect to /research
   - Can access research endpoints
   - Cannot access patient endpoints (gets 401)

3. **Try to switch dashboards**:
   - Navigate from /hospital to /research
   - Should clear tokens and redirect to login
   - Must log in again to access research dashboard

## Troubleshooting

**Problem**: Getting 401 errors on API requests
- **Solution**: Check that you're logged in with the correct dashboard type

**Problem**: Redirected to login when navigating between pages
- **Solution**: This is expected when switching between /hospital and /research

**Problem**: Login not working
- **Solution**: Check that backend is running at http://98.92.253.206:8000

**Problem**: Token not being sent with requests
- **Solution**: Check localStorage for 'access_token' and 'dashboard_type'

## Files to Know

- `lib/api/auth.ts` - Login/logout functions
- `lib/api/client.ts` - API client with interceptors
- `lib/utils/dashboardAuth.ts` - Dashboard validation utilities
- `lib/hooks/useDashboardAuth.ts` - Dashboard validation hook
- `app/auth/login/page.tsx` - Login page with dashboard detection
