import React from 'react';
import { Box, Stack, Typography, IconButton, Avatar } from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { useAuth } from '../../../context/AuthContext';

export default function DeliveryHeader() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const firstName = user?.name ? user.name.split(' ')[0] : 'Delivery';

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#ffffff',
        px: 2.5,
        py: 1.8,
        borderBottom: '1px solid #f3f4f6',
        boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
      }}
    >
      <Stack
        direction="row"
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2 }}>
          <Avatar
            sx={{
              width: 38,
              height: 38,
              background: 'linear-gradient(135deg, #7c3aed, #ef4444)',
            }}
          >
            <LocalShippingOutlinedIcon sx={{ fontSize: 20, color: '#fff' }} />
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ color: '#9ca3af', lineHeight: 1 }}>
              {today}
            </Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 16, color: '#1f2937' }}>
              Hi, {firstName}
            </Typography>
          </Box>
        </Stack>

        <IconButton
          sx={{
            background: '#f9fafb',
            '&:hover': { background: '#f3f4f6' },
          }}
        >
          <NotificationsNoneIcon sx={{ color: '#374151' }} />
        </IconButton>
      </Stack>
    </Box>
  );
}
