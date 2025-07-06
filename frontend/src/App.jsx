import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui';
import LoadingSpinner from './components/LoadingSpinner';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SessionsPage from './pages/SessionsPage';
import SessionDetailPage from './pages/SessionDetailPage';
import MessagesPage from './pages/MessagesPage';
import WebhooksPage from './pages/WebhooksPage';
import ProfilePage from './pages/ProfilePage';
import ApiPage from './pages/ApiPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Authenticating..." />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <ToastProvider>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          } />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="sessions/:sessionId" element={<SessionDetailPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="webhooks" element={<WebhooksPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="api" element={<ApiPage />} />
          </Route>
          
          {/* 404 page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </ToastProvider>
  );
}

export default App; 