import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { RootState } from './store';
import getTheme from './theme';

// Layout & Pages
import Layout from './components/Layout';
import Login from './pages/Login';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import RegionalDashboard from './pages/RegionalDashboard';
import StoreDashboard from './pages/StoreDashboard';
import AlertsCenter from './pages/AlertsCenter';
import IntelligenceCenter from './pages/IntelligenceCenter';
import ReportsModule from './pages/ReportsModule';

// Protected Route wrapper component
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, role } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // If not authorized for executive dashboard, redirect store managers to their store detail view
    if (role === 'StoreManager') {
      const assignedStoreId = localStorage.getItem('assignedStoreId');
      return <Navigate to={`/store/${assignedStoreId}`} replace />;
    }
    return <Navigate to="/store" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const [mode, setMode] = useState<'light' | 'dark'>(
    (localStorage.getItem('themeMode') as 'light' | 'dark') || 'dark'
  );

  const theme = getTheme(mode);

  const toggleDarkMode = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    localStorage.setItem('themeMode', nextMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Main Layout routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'RegionalManager']}>
                <Layout toggleDarkMode={toggleDarkMode} isDarkMode={mode === 'dark'}>
                  <ExecutiveDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/regional"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'RegionalManager']}>
                <Layout toggleDarkMode={toggleDarkMode} isDarkMode={mode === 'dark'}>
                  <RegionalDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/store"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'RegionalManager', 'StoreManager']}>
                <Layout toggleDarkMode={toggleDarkMode} isDarkMode={mode === 'dark'}>
                  <StoreDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/store/:id"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'RegionalManager', 'StoreManager']}>
                <Layout toggleDarkMode={toggleDarkMode} isDarkMode={mode === 'dark'}>
                  <StoreDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/intelligence"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'RegionalManager', 'StoreManager']}>
                <Layout toggleDarkMode={toggleDarkMode} isDarkMode={mode === 'dark'}>
                  <IntelligenceCenter />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/alerts"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'RegionalManager', 'StoreManager']}>
                <Layout toggleDarkMode={toggleDarkMode} isDarkMode={mode === 'dark'}>
                  <AlertsCenter />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['Administrator', 'RegionalManager', 'StoreManager']}>
                <Layout toggleDarkMode={toggleDarkMode} isDarkMode={mode === 'dark'}>
                  <ReportsModule />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
