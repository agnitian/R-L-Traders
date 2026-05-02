import React, { useEffect } from 'react';
import {
  Box,
  Fade,
  LinearProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

/**
 * Splash screen — shown ONLY on mobile devices for 3 seconds.
 * Desktop visitors are redirected straight to /login.
 *
 * Layout: full-bleed mobile splash image with a LinearProgress at the bottom.
 */
export default function SplashScreen() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (!isMobile) {
      navigate('/login', { replace: true });
      return;
    }
    const timer = setTimeout(() => {
      navigate('/login', { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate, isMobile]);

  if (!isMobile) return null;

  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          width: '100%',
          background: '#ffffff',
          overflow: 'hidden',
        }}
      >
        <Box
          component="img"
          src={`${process.env.PUBLIC_URL}/mobile_splace.png`}
          alt="R.L. Traders"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />

        {/* Bottom-center progress bar */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            bottom: '12%',
            transform: 'translateX(-50%)',
            width: '50%',
            maxWidth: 220,
          }}
        >
          <LinearProgress
            aria-label="Loading…"
            sx={{
              height: 5,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.35)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#3a2c2f',
                borderRadius: 999,
              },
            }}
          />
        </Box>
      </Box>
    </Fade>
  );
}
