import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import LocalDrinkOutlinedIcon from '@mui/icons-material/LocalDrinkOutlined';
import { PRODUCTS_TO_DELIVER } from '../data';

export default function ProductsToDeliver() {
  return (
    <Box sx={{ px: 2, mt: 1 }}>
      <Typography
        sx={{ fontWeight: 700, fontSize: 14, color: '#1f2937', mb: 1.2 }}
      >
        Products to Deliver Today
      </Typography>
      <Stack sx={{ gap: 1 }}>
        {PRODUCTS_TO_DELIVER.map((p) => (
          <Stack
            key={p.id}
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fff',
              borderRadius: 2.5,
              px: 2,
              py: 1.2,
              border: '1px solid #f3f4f6',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fee2e2, #f3e8ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LocalDrinkOutlinedIcon sx={{ fontSize: 16, color: '#7c3aed' }} />
              </Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                {p.name}
              </Typography>
            </Stack>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 700,
                color: '#7c3aed',
              }}
            >
              {p.units} u
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
