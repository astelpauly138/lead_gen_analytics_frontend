import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import ProtectedRoute from "components/ProtectedRoute";
import { AuthProvider } from "context/AuthContext";
import { ThemeProvider } from "context/ThemeContext";
import AuthenticationLogin from './pages/authentication-login';
import AuthenticationSignup from './pages/authentication-signup';
import MainDashboard from './pages/main-dashboard';
import LeadAnalyticsSheet from './pages/lead-analytics-sheet';
import SettingsDashboard from './pages/settings-dashboard';
import CampaignPerformance from './pages/campaign-performance';

const Routes = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
        <ErrorBoundary>
          <ScrollToTop />
          <RouterRoutes>
            {/* Public Routes */}
            <Route path="/authentication-login" element={<AuthenticationLogin />} />
            <Route path="/authentication-signup" element={<AuthenticationSignup />} />
            
            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <MainDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/main-dashboard" 
              element={
                <ProtectedRoute>
                  <MainDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lead-analytics-sheet" 
              element={
                <ProtectedRoute>
                  <LeadAnalyticsSheet />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings-dashboard" 
              element={
                <ProtectedRoute>
                  <SettingsDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/campaign-performance" 
              element={
                <ProtectedRoute>
                  <CampaignPerformance />
                </ProtectedRoute>
              } 
            />
            
            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </ErrorBoundary>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default Routes;
