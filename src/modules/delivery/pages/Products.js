import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Chip, LinearProgress, MenuItem, TextField, CircularProgress,
  Alert, InputAdornment, Avatar, Button, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import { PageHeader, StatsRow } from '../../../components/page/PagePrimitives';
import { listFleet } from '../../../api/trips';

const ACCENT = '#16a34a';
const PRODUCT_COLORS = ['#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed', '#db2777', '#0891b2'];

const STATUS_META = {
  pending: { label: 'Pending', bg: '#ffedd5', color: '#c2410c' },
  'in-progress': { label: 'In Progress', bg: '#dbeafe', color: '#1d4ed8' },
};

export default function Products({ navigate }) {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const f = await listFleet();
        if (!alive) return;
        setFleet(f);
        // Default selection: my own active trip first, else first vehicle, else empty
        const mine = f.find((s) => s.isMine);
        if (mine) setVehicleId(mine.vehicle?.id || '__none__');
        else if (f.length > 0) setVehicleId(f[0].vehicle?.id || '__none__');
        else setVehicleId('');
      } catch (e) { if (alive) setError(e.message || 'Failed to load fleet'); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  const myTrip = useMemo(() => fleet.find((s) => s.isMine) || null, [fleet]);
  const selected = useMemo(
    () => fleet.find((s) => (s.vehicle?.id || '__none__') === vehicleId) || null,
    [fleet, vehicleId],
  );

  const products = useMemo(() => {
    if (!selected) return [];
    const sold = new Map();
    (selected.sales || []).forEach((sale) => {
      (sale.items || []).forEach((it) => {
        sold.set(it.name, (sold.get(it.name) || 0) + (Number(it.qty) || 0));
      });
    });
    return (selected.items || []).map((it, idx) => {
      const loaded = Number(it.qty) || 0;
      const delivered = sold.get(it.name) || 0;
      return {
        name: it.name,
        price: it.price || 0,
        loaded,
        delivered,
        remaining: Math.max(0, loaded - delivered),
        color: PRODUCT_COLORS[idx % PRODUCT_COLORS.length],
      };
    });
  }, [selected]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  const totals = useMemo(() => products.reduce(
    (a, p) => ({
      loaded: a.loaded + p.loaded,
      delivered: a.delivered + p.delivered,
      remaining: a.remaining + p.remaining,
    }),
    { loaded: 0, delivered: 0, remaining: 0 },
  ), [products]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Products"
        subtitle="Live vehicle stock across the fleet — useful for emergency lookups."
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filter bar */}
      <Box
        sx={{
          bgcolor: '#fff', borderRadius: 2.5, border: '1px solid #e5e7eb',
          p: 2, mb: 3,
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 1.5, alignItems: { md: 'center' } }}>
          <TextField
            size="small"
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1 }}
            slotProps={{ input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
                </InputAdornment>
              ),
            } }}
          />
          <TextField
            select
            size="small"
            label="Vehicle"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            sx={{ minWidth: { xs: 0, sm: 280 }, width: { xs: '100%', md: 'auto' } }}
            disabled={fleet.length === 0}
          >
            {fleet.length === 0 && <MenuItem value="">No active trips in fleet</MenuItem>}
            {fleet.map((s) => {
              const id = s.vehicle?.id || '__none__';
              const label = `${s.vehicle?.plate || 'No vehicle'}${s.vehicle?.route ? ` • ${s.vehicle.route}` : ''}${s.isMine ? ' (You)' : ''}`;
              return <MenuItem key={id} value={id}>{label}</MenuItem>;
            })}
          </TextField>
        </Stack>
      </Box>

      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>
      ) : !myTrip && !selected ? (
        <NotStartedState fleetCount={fleet.length} navigate={navigate} />
      ) : !selected ? (
        <Alert severity="info">Select a vehicle to view its current load.</Alert>
      ) : (
        <>
          {/* Selected trip header */}
          <Box
            sx={{
              mb: 2, p: 2, bgcolor: selected.isMine ? '#f0fdf4' : '#eff6ff',
              border: '1px solid', borderColor: selected.isMine ? '#bbf7d0' : '#bfdbfe',
              borderRadius: 2.5,
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Avatar variant="rounded" sx={{ bgcolor: selected.isMine ? ACCENT : '#2563eb', color: '#fff' }}>
                <LocalShippingOutlinedIcon />
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 180 }}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: 16, fontWeight: 800 }}>
                    {selected.vehicle?.plate || 'No vehicle'}
                  </Typography>
                  <Chip
                    size="small"
                    label={selected.isMine ? 'Your trip' : 'Other vehicle'}
                    sx={{
                      bgcolor: selected.isMine ? ACCENT : '#2563eb', color: '#fff',
                      fontWeight: 700, fontSize: 10, height: 20,
                    }}
                  />
                  {STATUS_META[selected.status] && (
                    <Chip
                      size="small"
                      label={STATUS_META[selected.status].label}
                      sx={{
                        bgcolor: STATUS_META[selected.status].bg,
                        color: STATUS_META[selected.status].color,
                        fontWeight: 700, fontSize: 10, height: 20,
                      }}
                    />
                  )}
                </Stack>
                <Stack direction="row" sx={{ gap: 1.5, mt: 0.4, flexWrap: 'wrap' }}>
                  <Typography sx={{ fontSize: 12, color: '#374151' }}>{selected.tripNumber}</Typography>
                  {selected.vehicle?.route && (
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.4 }}>
                      <RouteOutlinedIcon sx={{ fontSize: 13, color: '#6b7280' }} />
                      <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{selected.vehicle.route}</Typography>
                    </Stack>
                  )}
                  {selected.driver?.name && (
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.4 }}>
                      <PersonOutlineOutlinedIcon sx={{ fontSize: 13, color: '#6b7280' }} />
                      <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{selected.driver.name}</Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>
            </Stack>
          </Box>

          <StatsRow
            cols={3}
            items={[
              { label: 'Loaded', value: totals.loaded.toLocaleString() },
              { label: 'Delivered', value: totals.delivered.toLocaleString(), valueColor: '#16a34a' },
              { label: 'On Vehicle', value: totals.remaining.toLocaleString(), valueColor: '#2563eb' },
            ]}
          />

          {filteredProducts.length === 0 ? (
            <Box sx={{ p: 4, bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2.5, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
                {products.length === 0 ? 'No products were loaded for this trip.' : 'No products match your search.'}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                gap: 2,
              }}
            >
              {filteredProducts.map((p) => {
                const pct = p.loaded ? Math.min(100, Math.round((p.delivered / p.loaded) * 100)) : 0;
                return (
                  <Box key={p.name} sx={{ bgcolor: '#fff', borderRadius: 2.5, border: '1px solid #e5e7eb', p: 2.5 }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ width: 44, height: 60, bgcolor: p.color + '20', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Box sx={{ width: 18, height: 40, borderRadius: 99, bgcolor: p.color }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{p.name}</Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={`${p.remaining}u left`}
                        sx={{
                          bgcolor: p.remaining > 0 ? '#dbeafe' : '#f3f4f6',
                          color: p.remaining > 0 ? '#1d4ed8' : '#6b7280',
                          fontWeight: 700, fontSize: 11, height: 22, borderRadius: 99,
                        }}
                      />
                    </Stack>

                    <Stack sx={{ gap: 0.6, mb: 1.2 }}>
                      <RowKV label="Loaded" value={p.loaded} color="#111827" />
                      <RowKV label="Delivered" value={p.delivered} color="#16a34a" />
                      <RowKV label="Remaining" value={p.remaining} color="#2563eb" />
                    </Stack>

                    <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Sell-through</Typography>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: '#111827' }}>{pct}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 6, borderRadius: 99, bgcolor: '#f3f4f6',
                        '& .MuiLinearProgress-bar': { bgcolor: p.color, borderRadius: 99 },
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          )}

          {!selected.isMine && myTrip == null && (
            <>
              <Divider sx={{ my: 3 }} />
              <Alert severity="warning">
                You haven't started your own trip yet — viewing fleet for reference only.
              </Alert>
            </>
          )}
        </>
      )}
    </Box>
  );
}

function RowKV({ label, value, color }) {
  return (
    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>{label}</Typography>
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color }}>
        {value}{' '}
        <Box component="span" sx={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>units</Box>
      </Typography>
    </Stack>
  );
}

function NotStartedState({ fleetCount, navigate }) {
  return (
    <Box sx={{ p: 5, bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2.5, textAlign: 'center' }}>
      <LocalShippingOutlinedIcon sx={{ fontSize: 48, color: '#9ca3af', mb: 1 }} />
      <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#111827', mb: 0.5 }}>
        Trip not started
      </Typography>
      <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 2, maxWidth: 420, mx: 'auto' }}>
        Your trip hasn't started yet. Start one from <strong>My Trips</strong> by tapping
        <strong> Add Trip</strong> and loading your stock.
        {fleetCount > 0 && ' You can still pick another vehicle above to see what they have on board.'}
      </Typography>
      {navigate && (
        <Button
          onClick={() => navigate('My Trips')}
          variant="contained"
          sx={{ bgcolor: ACCENT, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#15803d' } }}
        >
          Go to My Trips
        </Button>
      )}
    </Box>
  );
}
