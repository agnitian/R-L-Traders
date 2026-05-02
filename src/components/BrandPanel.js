import React from 'react';
import { Box } from '@mui/material';

/**
 * Branding panel — left half of the desktop login page.
 * Image fills the panel, with a soft right-side overlay that blends into
 * the login section so the colors flow seamlessly.
 */
export default function BrandPanel() {
  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      <Box
        component="img"
        src={`${process.env.PUBLIC_URL}/full_logo.png`}
        alt="R.L. Traders"
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'left center',
          display: 'block',
          filter: 'saturate(0.9) brightness(0.98)',
        }}
      />

      {/* Soft fade overlay — blends into login background */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background:
            'linear-gradient(to right, rgba(255,255,255,0) 60%, #f9fafb 100%)',
        }}
      />
    </Box>
  );
}
