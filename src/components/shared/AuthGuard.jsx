/**
 * GHOST PROTOCOL — AuthGuard Component
 *
 * Protects routes that require authentication.
 * Redirects to /login if user is not authenticated.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';

function AuthGuard({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login while preserving the attempted URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default AuthGuard;
