import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../config/roles';

/**
 * Wraps a route to require auth + (optionally) a specific role.
 * If the user is signed in but with the wrong role, redirect them
 * to their own dashboard rather than the login page.
 */
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    const target = ROLES[user.role]?.redirect || '/login';
    return <Navigate to={target} replace />;
  }

  return children;
}
