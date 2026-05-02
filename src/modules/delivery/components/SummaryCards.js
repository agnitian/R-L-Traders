import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import { TODAY_SUMMARY } from '../data';

const CARDS = [
  {
    key: 'trips',
    label: 'Trips',
    Icon: LocalShippingOutlinedIcon,
    color: '#2563eb',
    bg: '#eff6ff',
    suffix: '',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    Icon: Inventory2OutlinedIcon,
    color: '#16a34a',
    bg: '#f0fdf4',
    suffix: ' u',
  },
  {
    key: 'returns',
    label: 'Returns',
    Icon: KeyboardReturnOutlinedIcon,
    color: '#ea580c',
    bg: '#fff7ed',
    suffix: ' u',
  },
];

export default function SummaryCards() {
  return (
    <Stack direction="row" sx={{ gap: 1.2, px: 2, mt: 2 }}>
      {CARDS.map(({ key, label, Icon, color, bg, suffix }) => (
        <Box
          key={key}
          sx={{
            flex: 1,
            background: bg,
            borderRadius: 3,
            p: 1.5,
            border: `1px solid ${color}1f`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 0.8,
            }}
          >
            <Icon sx={{ color, fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#1f2937' }}>
            {TODAY_SUMMARY[key]}
            <Box
              component="span"
              sx={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}
            >
              {suffix}
            </Box>
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
