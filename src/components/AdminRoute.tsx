/**
 * AdminRoute — Route guard for admin pages
 *
 * Defense in depth:
 * 1. Client-side: This component blocks rendering for non-admin users
 * 2. Server-side: RLS policies block data access regardless of UI
 *
 * If the user's session has been idle for 30+ minutes, they are
 * redirected to login with a session_expired reason.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Navigate } from 'react-router-dom';
import { ShieldAlert, Loader2, Clock } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
  /** Minimum required access level. Default: 'moderator' (lowest admin tier) */
  requiredRole?: 'moderator' | 'admin' | 'super_admin';
}

const AdminRoute = ({ children, requiredRole = 'moderator' }: AdminRouteProps) => {
  const { session, loading: authLoading } = useAuth();
  const { role, loading: roleLoading, isModerator, isAdmin, isSuperAdmin, sessionExpired } = useAdminRole();

  // Still loading auth or role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Verifying admin access…</p>
        </div>
      </div>
    );
  }

  // Not authenticated at all
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Session expired due to idle timeout
  if (sessionExpired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">Session Expired</h2>
          <p className="text-sm text-muted-foreground">
            Your admin session has been inactive for 30 minutes. Please sign in again for security.
          </p>
          <a
            href="/login?reason=session_expired"
            className="inline-flex items-center justify-center gap-2 rounded-2xl gradient-saffron px-6 py-3 text-sm font-bold text-white shadow-glow-primary"
          >
            Sign In Again
          </a>
        </div>
      </div>
    );
  }

  // Check role hierarchy
  let hasAccess = false;
  switch (requiredRole) {
    case 'moderator':
      hasAccess = isModerator;
      break;
    case 'admin':
      hasAccess = isAdmin;
      break;
    case 'super_admin':
      hasAccess = isSuperAdmin;
      break;
  }

  // Access denied — not an admin
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            You don't have permission to access the admin dashboard.
            {role && <> Your current role is <strong>{role}</strong>, but this page requires <strong>{requiredRole}</strong> or higher.</>}
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-muted px-6 py-3 text-sm font-bold text-foreground"
          >
            Return to App
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
