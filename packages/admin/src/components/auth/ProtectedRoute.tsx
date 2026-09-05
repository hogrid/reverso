/**
 * Protected route component that requires authentication.
 */

import { UNAUTHORIZED_EVENT } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { Loader2 } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, checkAuth, sessionExpired } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // When any API call answers 401 (session expired or revoked), drop the
  // local session so the user is sent to the login page instead of seeing
  // every screen fail.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, sessionExpired);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, sessionExpired);
  }, [sessionExpired]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
