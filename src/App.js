import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SplashScreen from './pages/SplashScreen';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './modules/admin/AdminDashboard';
import CounterDashboard from './modules/counter/CounterDashboard';
import DeliveryDashboard from './modules/delivery/DeliveryDashboard';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Splash is shown only on mobile; desktop redirects to /login internally */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Module-specific dashboards — protected by role */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/counter/*"
            element={
              <ProtectedRoute role="counter">
                <CounterDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/delivery/*"
            element={
              <ProtectedRoute role="delivery">
                <DeliveryDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
