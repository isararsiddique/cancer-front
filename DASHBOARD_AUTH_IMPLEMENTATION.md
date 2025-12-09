# Dashboard-Specific Authentication Implementation

## Overview
The frontend has been updated to support dashboard-specific authentication that matches the backend changes. Users must now log in separately for each dashboard (hospital or researcher) and cannot switch between dashboards without re-authenticating.

## Backend Changes (Already Implemented)
- Login endpoint now requires `dashboard_type` parameter ("hospital" or "researcher")
- JWT tokens include `dashboard_type` claim
- Protected endpoints validate token's dashboard type matches required dashboard
- Returns 401 error if user tries to access wrong dashboard

## Frontend Changes Implemented

### 1. Authentication API (`lib/api/auth.ts`)
- Added `dashboard_type` parameter to `LoginCredentials` interface
- Login function now sends `dashboard_type` to backend
- Stores `dashboard_type` in localStorage alongside tokens
- Logout clears `dashboard_type` from localStorage

### 2. Dashboard Auth Utilities (`lib/utils/dashboardAuth.ts`)
- Updated dashboard types from 'research' to 'researcher' to match backend
- Added `getStoredDashboardType()` to retrieve stored dashboard type
- Enhanced `checkDashboardSwitch()` to validate stored dashboard type matches current page
- Added `validateDashboardAccess()` to check if user's token is valid for required dashboard
- All token clearing functions now also remove `dashboard_type`

### 3. API Client Interceptor (`lib/api/client.ts`)
- Added dashboard mismatch detection in 401 error handler
- Checks error message for dashboard-related errors
- Clears all tokens and redirects to login with error parameter
- Prevents token refresh attempts on dashboard mismatch errors

### 4. Login Page (`app/auth/login/page.tsx`)
- Detects dashboard mismatch errors from URL parameters
- Performs two-step login process:
  1. Initial login to get user info and determine role
  2. Re-login with appropriate `dashboard_type` to get dashboard-locked token
- Automatically determines dashboard type based on user role:
  - `super_admin`, `ummc_admin`, `registry_editor`, `registry_viewer` → hospital
  - `researcher` → researcher
- Stores dashboard type in sessionStorage for tracking
- Shows appropriate error message for dashboard mismatch

### 5. Dashboard Auth Hook (`lib/hooks/useDashboardAuth.ts`)
- New custom hook for dashboard pages to validate access
- Checks for dashboard switching on mount
- Validates token matches required dashboard
- Redirects to login if validation fails

## How It Works

### Login Flow
1. User enters credentials on login page
2. Frontend performs initial login (without dashboard_type)
3. Frontend fetches user info to determine role
4. Frontend determines appropriate dashboard type based on role
5. Frontend performs second login with dashboard_type parameter
6. Backend returns JWT token locked to that dashboard
7. Frontend stores token and dashboard_type in localStorage
8. User is redirected to appropriate dashboard

### Dashboard Access Validation
1. User navigates to dashboard page (e.g., /hospital or /research)
2. Page checks if user is switching from another dashboard
3. Page validates stored dashboard_type matches current dashboard
4. If mismatch detected, tokens are cleared and user redirected to login
5. If valid, user can access the dashboard

### API Request Flow
1. User makes API request from dashboard
2. Request includes JWT token with dashboard_type claim
3. Backend validates token's dashboard_type matches endpoint requirement
4. If mismatch, backend returns 401 with dashboard error
5. Frontend interceptor detects dashboard error
6. Frontend clears tokens and redirects to login

### Dashboard Switching
1. User tries to navigate from /hospital to /research (or vice versa)
2. `checkDashboardSwitch()` detects the switch
3. All tokens and dashboard_type are cleared
4. User is redirected to login page with error message
5. User must log in again to access the new dashboard

## Usage in Dashboard Pages

Dashboard pages should use the `useDashboardAuth` hook:

```typescript
import { useDashboardAuth } from '@/lib/hooks/useDashboardAuth';

export default function HospitalDashboard() {
  // Validate access to hospital dashboard
  useDashboardAuth('hospital', '/hospital');
  
  // Rest of component...
}
```

Or manually check:

```typescript
import { checkDashboardSwitch, validateDashboardAccess } from '@/lib/utils/dashboardAuth';

useEffect(() => {
  const isSwitching = checkDashboardSwitch('/hospital');
  if (isSwitching) {
    router.push('/auth/login?error=dashboard_mismatch');
    return;
  }
  
  const isValid = validateDashboardAccess('hospital');
  if (!isValid) {
    router.push('/auth/login');
  }
}, []);
```

## Security Features

1. **Token Locking**: JWT tokens are locked to specific dashboard type
2. **Automatic Validation**: Every API request validates dashboard type
3. **Switch Detection**: Frontend detects and prevents dashboard switching
4. **Token Clearing**: All tokens cleared on dashboard mismatch
5. **Forced Re-authentication**: Users must log in again to switch dashboards
6. **Error Handling**: Clear error messages for dashboard mismatches

## Testing Checklist

- [ ] Login as hospital user → redirected to /hospital
- [ ] Login as researcher → redirected to /research
- [ ] Hospital user can access hospital endpoints
- [ ] Researcher can access research endpoints
- [ ] Hospital user gets 401 when accessing research endpoints
- [ ] Researcher gets 401 when accessing hospital endpoints
- [ ] Navigating from /hospital to /research clears tokens and redirects to login
- [ ] Navigating from /research to /hospital clears tokens and redirects to login
- [ ] Dashboard mismatch shows appropriate error message
- [ ] Logout clears all tokens including dashboard_type
- [ ] Token refresh maintains dashboard_type

## Files Modified

1. `lib/api/auth.ts` - Added dashboard_type parameter to login
2. `lib/utils/dashboardAuth.ts` - Enhanced dashboard validation
3. `lib/api/client.ts` - Added dashboard mismatch error handling
4. `app/auth/login/page.tsx` - Implemented two-step login with dashboard_type
5. `lib/hooks/useDashboardAuth.ts` - New hook for dashboard validation

## Environment Variables

### Frontend Environment Files

Ensure your environment files have the correct backend URL:

- `.env.local` - Local development (http://localhost:8000)
- `.env.aws` - AWS EC2 (http://98.92.253.206:8000)
- `.env.production` - Production (http://98.92.253.206:8000)

### Backend Environment Variables

**IMPORTANT**: WHO ICD-11 API credentials should be stored in your backend `.env` file, NOT hardcoded in source code.

See `BACKEND_ENV_TEMPLATE.md` for complete backend configuration guide.

## Notes

- The implementation uses a two-step login to maintain backward compatibility
- Dashboard type is stored in localStorage for validation
- Session storage tracks last visited dashboard
- All token clearing operations now include dashboard_type
- Error messages clearly indicate when re-authentication is required
