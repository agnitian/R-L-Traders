import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Collapse,
  IconButton,
  Chip,
  TextField,
  Button,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StoreOutlinedIcon from '@mui/icons-material/StoreOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';
import { STATUS_META, DELIVERY_GRADIENT } from '../data';

function ProductRow({ product, onChange }) {
  const handle = (field) => (e) => {
    const val = Math.max(0, Math.min(product.given, Number(e.target.value) || 0));
    onChange({ ...product, [field]: val });
  };

  return (
    <Box
      sx={{
        background: '#f9fafb',
        borderRadius: 2,
        p: 1.5,
        border: '1px solid #f3f4f6',
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 13.5, mb: 1 }}>
        {product.name}
      </Typography>
      <Stack direction="row" sx={{ gap: 1 }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 10.5, color: '#9ca3af', mb: 0.4 }}>
            Given
          </Typography>
          <Box
            sx={{
              background: '#fff',
              borderRadius: 1.5,
              px: 1,
              py: 1,
              textAlign: 'center',
              fontWeight: 700,
              color: '#374151',
              border: '1px solid #e5e7eb',
              fontSize: 14,
            }}
          >
            {product.given}
          </Box>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 10.5, color: '#9ca3af', mb: 0.4 }}>
            Delivered
          </Typography>
          <TextField
            value={product.delivered}
            onChange={handle('delivered')}
            type="number"
            size="small"
            fullWidth
            slotProps={{
              htmlInput: {
                min: 0,
                max: product.given,
                style: { textAlign: 'center', fontWeight: 700, padding: '8px 4px' },
              },
            }}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 10.5, color: '#9ca3af', mb: 0.4 }}>
            Return
          </Typography>
          <TextField
            value={product.returned}
            onChange={handle('returned')}
            type="number"
            size="small"
            fullWidth
            slotProps={{
              htmlInput: {
                min: 0,
                max: product.given,
                style: { textAlign: 'center', fontWeight: 700, padding: '8px 4px' },
              },
            }}
          />
        </Box>
      </Stack>
    </Box>
  );
}

export default function TripCard({ trip, onUpdate }) {
  const [open, setOpen] = useState(trip.status === 'in_progress');
  const meta = STATUS_META[trip.status];

  const updateProduct = (updated) => {
    const products = trip.products.map((p) =>
      p.id === updated.id ? updated : p
    );
    onUpdate({ ...trip, products });
  };

  const setStatus = (status) => onUpdate({ ...trip, status });

  return (
    <Box
      sx={{
        background: '#ffffff',
        borderRadius: 3,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        border: '1px solid #f3f4f6',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{ p: 2, cursor: 'pointer' }}
        role="button"
        aria-expanded={open}
      >
        <Stack
          direction="row"
          sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
        >
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2, flex: 1 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StoreOutlinedIcon sx={{ color: '#7c3aed', fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 14.5, color: '#1f2937' }}>
                {trip.shop}
              </Typography>
              <Stack
                direction="row"
                sx={{ alignItems: 'center', gap: 1, mt: 0.3, flexWrap: 'wrap' }}
              >
                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.3 }}>
                  <AccessTimeIcon sx={{ fontSize: 12, color: '#9ca3af' }} />
                  <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
                    {trip.time}
                  </Typography>
                </Stack>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 0.3 }}>
                  <PlaceOutlinedIcon sx={{ fontSize: 12, color: '#9ca3af' }} />
                  <Typography
                    sx={{
                      fontSize: 11,
                      color: '#6b7280',
                      maxWidth: 140,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {trip.address}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          <Stack sx={{ alignItems: 'flex-end', gap: 0.6 }}>
            <Chip
              size="small"
              label={meta.label}
              sx={{
                bgcolor: meta.bg,
                color: meta.color,
                fontWeight: 700,
                fontSize: 10.5,
                height: 22,
              }}
            />
            <IconButton size="small" sx={{ p: 0.3 }}>
              <ExpandMoreIcon
                sx={{
                  fontSize: 20,
                  color: '#9ca3af',
                  transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </IconButton>
          </Stack>
        </Stack>

        <Typography sx={{ fontSize: 11, color: '#9ca3af', mt: 1 }}>
          {trip.products.length} product{trip.products.length > 1 ? 's' : ''} • Tap to{' '}
          {open ? 'collapse' : 'expand'}
        </Typography>
      </Box>

      {/* Expanded body */}
      <Collapse in={open}>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Stack sx={{ gap: 1.2 }}>
            {trip.products.map((p) => (
              <ProductRow key={p.id} product={p} onChange={updateProduct} />
            ))}
          </Stack>

          {/* Action buttons */}
          <Stack direction="row" sx={{ gap: 1, mt: 2 }}>
            {trip.status === 'pending' && (
              <Button
                fullWidth
                startIcon={<PlayArrowIcon />}
                onClick={() => setStatus('in_progress')}
                sx={{
                  background: DELIVERY_GRADIENT,
                  color: '#fff',
                  fontWeight: 600,
                  borderRadius: 2.5,
                  py: 1.1,
                  boxShadow: '0 6px 14px rgba(236,72,153,0.3)',
                  '&:hover': { filter: 'brightness(1.05)' },
                }}
              >
                Start Trip
              </Button>
            )}
            {trip.status === 'in_progress' && (
              <>
                <Button
                  fullWidth
                  startIcon={<KeyboardReturnIcon />}
                  variant="outlined"
                  sx={{
                    borderColor: '#f59e0b',
                    color: '#b45309',
                    fontWeight: 600,
                    borderRadius: 2.5,
                    py: 1.1,
                    '&:hover': { borderColor: '#f59e0b', background: '#fffbeb' },
                  }}
                >
                  Submit Return
                </Button>
                <Button
                  fullWidth
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={() => setStatus('completed')}
                  sx={{
                    background: DELIVERY_GRADIENT,
                    color: '#fff',
                    fontWeight: 600,
                    borderRadius: 2.5,
                    py: 1.1,
                    boxShadow: '0 6px 14px rgba(236,72,153,0.3)',
                    '&:hover': { filter: 'brightness(1.05)' },
                  }}
                >
                  Mark Complete
                </Button>
              </>
            )}
            {trip.status === 'completed' && (
              <Button
                fullWidth
                disabled
                startIcon={<CheckCircleOutlineIcon />}
                sx={{
                  background: '#f0fdf4',
                  color: '#16a34a !important',
                  fontWeight: 600,
                  borderRadius: 2.5,
                  py: 1.1,
                }}
              >
                Delivery Completed
              </Button>
            )}
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}
