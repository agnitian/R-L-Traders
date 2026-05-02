import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';

const ITEMS = [
  { key: 'home', label: 'Dashboard', Icon: HomeOutlinedIcon },
  { key: 'trips', label: 'My Trips', Icon: LocalShippingOutlinedIcon },
  { key: 'products', label: 'Products', Icon: Inventory2OutlinedIcon },
  { key: 'profile', label: 'Profile', Icon: PersonOutlineOutlinedIcon },
];

export default function BottomNav({ active = 'home', onChange = () => {} }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#ffffff',
        borderTop: '1px solid #f3f4f6',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
        zIndex: 20,
        pb: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <Stack direction="row" sx={{ justifyContent: 'space-around', py: 1 }}>
        {ITEMS.map(({ key, label, Icon }) => {
          const isActive = active === key;
          return (
            <Box
              key={key}
              onClick={() => onChange(key)}
              role="button"
              sx={{
                flex: 1,
                textAlign: 'center',
                cursor: 'pointer',
                py: 0.6,
                color: isActive ? '#7c3aed' : '#9ca3af',
                transition: '0.2s',
              }}
            >
              <Icon sx={{ fontSize: 22 }} />
              <Typography
                sx={{
                  fontSize: 10.5,
                  fontWeight: isActive ? 700 : 500,
                  mt: 0.2,
                }}
              >
                {label}
              </Typography>
              {isActive && (
                <Box
                  sx={{
                    width: 18,
                    height: 3,
                    borderRadius: 99,
                    background: 'linear-gradient(90deg, #7c3aed, #ef4444)',
                    mx: 'auto',
                    mt: 0.4,
                  }}
                />
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
