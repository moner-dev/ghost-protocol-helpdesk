/**
 * GHOST PROTOCOL — Main Application Component
 *
 * Root component with routing configuration.
 * Uses HashRouter for Electron file:// protocol compatibility.
 * App always starts at /splash.
 */

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

import SplashScreen from '@/pages/SplashScreen';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import IncidentEditPage from '@/pages/IncidentEditPage';
import AuthGuard from '@/components/shared/AuthGuard';
import { ToastProvider } from '@/components/ui/Toast';

function App() {
  return (
    <ToastProvider>
    <HashRouter>
      <Routes>
        {/* Splash Screen — Entry Point */}
        <Route path="/splash" element={<SplashScreen />} />

        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Signup Page */}
        <Route path="/signup" element={<Signup />} />

        {/* Dashboard — Protected Route */}
        <Route
          path="/"
          element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          }
        />

        {/* Incident Edit Page — Protected Route */}
        <Route
          path="/incidents/:id/edit"
          element={
            <AuthGuard>
              <IncidentEditPage />
            </AuthGuard>
          }
        />

        {/* Redirect any unknown routes to splash */}
        <Route path="*" element={<Navigate to="/splash" replace />} />
      </Routes>
    </HashRouter>
    </ToastProvider>
  );
}

export default App;
