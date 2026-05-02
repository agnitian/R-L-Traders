import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import BrandPanel from '../components/BrandPanel';
import LoginForm from '../components/LoginForm';
import MobileLoginPage from './MobileLoginPage';

/**
 * Responsive login page:
 *  - Desktop/tablet: split screen — LEFT = BrandPanel, RIGHT = LoginForm
 *  - Mobile:        dedicated MobileLoginPage component
 */
export default function LoginPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    return <MobileLoginPage />;
  }

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* LEFT */}
      <Box sx={{ width: '55%', display: { xs: 'none', md: 'block' } }}>
        <BrandPanel />
      </Box>

      {/* RIGHT */}
      <Box
        sx={{
          width: { xs: '100%', md: '45%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to right, #f9fafb, #f3f4f6)',
        }}
      >
        <LoginForm />
      </Box>
    </Box>
  );
}
