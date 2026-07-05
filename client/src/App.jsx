import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { PublicRoute, ProtectedRoute, AdminRoute } from './components/RouteGuards';
import { PublicLayout, AuthLayout, DashboardLayout } from './layouts/Layouts';

// Pages
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { ForgotPassword } from './pages/ForgotPassword';
import { VerifyResetOtp } from './pages/VerifyResetOtp';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Sessions } from './pages/Sessions';
import { Settings } from './pages/Settings';
import { Admin } from './pages/Admin';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      {/* Premium Toast Alerts Configuration */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#0F172A',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 16px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)'
          },
          success: {
            iconTheme: {
              primary: '#2563eb',
              secondary: '#FFFFFF'
            }
          }
        }} 
      />

      <Routes>
        {/* Public Landing Routing (General) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
        </Route>

        {/* Guest/Auth-only Routing (Blocked if user is already authenticated) */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
        </Route>

        {/* Private/Protected Routing (Redirects to /login if unauthenticated) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Super Admin Protected Routing */}
        <Route element={<AdminRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>

        {/* Error Routing */}
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
