import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Chip, Avatar, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, CircularProgress, Snackbar, Menu, Divider, Tooltip,
} from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import { PageHeader, StatsRow, FilterBar, useFullScreenDialog } from '../../../components/page/PagePrimitives';
import { listTrips, createTrip, updateTrip, deleteTrip, reviewTripReturn } from '../../../api/trips';
import { listVehicles } from '../../../api/vehicles';
import { listStaff } from '../../../api/auth';
import { avatarSrcFor } from '../../../utils/avatar';

const ACCENT = '#e11d48';

const STATUS_META = {
  pending: { label: 'Pending', bg: '#ffedd5', color: '#c2410c' },
  'in-progress': { label: 'In Progress', bg: '#dbeafe', color: '#1d4ed8' },
  completed: { label: 'Completed', bg: '#dcfce7', color: '#15803d' },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#dc2626' },
};

const fmtDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};
const returnedUnitsOf = (t) => {
  const ret = t?.returnRequest;
  if (!ret || ret.status !== 'approved') return 0;
  return (ret.items || []).reduce((s, it) => s + (Number(it.qty) || Number(it.quantity) || 0), 0);
};
const pendingReturnUnitsOf = (t) => {
  const ret = t?.returnRequest;
  if (!ret || ret.status !== 'pending') return 0;
  return (ret.items || []).reduce((s, it) => s + (Number(it.qty) || Number(it.quantity) || 0), 0);
};

export default function DeliveryTrips() {
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [pickDate, setPickDate] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [view, setView] = useState('list'); // 'list' | 'byDay'
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);
  const [toast, setToast] = useState('');

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const [ts, vs, staff] = await Promise.all([listTrips(), listVehicles(), listStaff()]);
      setTrips(ts);
      setVehicles(vs);
      setDrivers((staff || []).filter((u) => u.role === 'delivery' && u.active));
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const stats = useMemo(() => ({
    total: trips.length,
    completed: trips.filter((t) => t.status === 'completed').length,
    inProgress: trips.filter((t) => t.status === 'in-progress').length,
    pending: trips.filter((t) => t.status === 'pending').length,
    cancelled: trips.filter((t) => t.status === 'cancelled').length,
    pendingReturns: trips.filter((t) => t.returnRequest?.status === 'pending').length,
  }), [trips]);

  const filtered = trips.filter((t) => {
    let matchFilter = true;
    if (filter === 'pending-returns') matchFilter = t.returnRequest?.status === 'pending';
    else if (filter !== 'all') matchFilter = t.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${t.tripNumber} ${t.driver?.name || ''} ${t.store?.name || ''} ${t.store?.address || ''} ${t.vehicle?.plate || ''}`.toLowerCase().includes(q);
    const td = new Date(t.date);
    const matchDate = !pickDate || td.toISOString().slice(0, 10) === pickDate;
    const matchDriver = !driverFilter || t.driver?.id === driverFilter;
    const matchVehicle = !vehicleFilter || t.vehicle?.id === vehicleFilter;
    return matchFilter && matchSearch && matchDate && matchDriver && matchVehicle;
  });

  // Group trips by day -> by driver/vehicle for summary view
  const byDay = useMemo(() => {
    const days = new Map();
    filtered.forEach((t) => {
      const key = new Date(t.date).toISOString().slice(0, 10);
      if (!days.has(key)) days.set(key, []);
      days.get(key).push(t);
    });
    return Array.from(days.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([day, items]) => {
        const totals = items.reduce((acc, t) => {
          acc.units += t.totalUnits || 0;
          return acc;
        }, { units: 0 });
        // group within day by driver
        const byDriver = new Map();
        items.forEach((t) => {
          const k = t.driver?.id || 'unknown';
          if (!byDriver.has(k)) byDriver.set(k, { driver: t.driver, vehicles: new Set(), trips: 0, units: 0, items: [] });
          const row = byDriver.get(k);
          row.trips += 1;
          row.units += t.totalUnits || 0;
          if (t.vehicle?.plate) row.vehicles.add(t.vehicle.plate);
          row.items.push(t);
        });
        return { day, totals, drivers: Array.from(byDriver.values()), trips: items };
      });
  }, [filtered]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Delivery Trips"
        subtitle="All delivery trips across the fleet — open a trip to see what was delivered"
        action={
          <Button
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ bgcolor: ACCENT, color: '#fff', textTransform: 'none', fontWeight: 600, px: 2, py: 1, borderRadius: 2, '&:hover': { bgcolor: '#be123c' } }}
          >
            New Trip
          </Button>
        }
      />

      <StatsRow
        cols={6}
        items={[
          { label: 'Total Trips', value: stats.total },
          { label: 'Completed', value: stats.completed, valueColor: '#16a34a' },
          { label: 'In Progress', value: stats.inProgress, valueColor: '#2563eb' },
          { label: 'Pending', value: stats.pending, valueColor: '#ea580c' },
          { label: 'Cancelled', value: stats.cancelled, valueColor: '#dc2626' },
          { label: 'Pending Returns', value: stats.pendingReturns, valueColor: '#a16207' },
        ]}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search trip, driver, store or vehicle..."
        accent={ACCENT}
        activeFilter={filter}
        onFilterChange={setFilter}
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Completed', value: 'completed' },
          { label: 'In Progress', value: 'in-progress' },
          { label: 'Pending', value: 'pending' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Pending Returns', value: 'pending-returns' },
        ]}
      />

      <Box sx={{ p: 1.5, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ alignItems: { md: 'center' }, flexWrap: 'wrap' }}>
          <TextField type="date" size="small" value={pickDate} onChange={(e) => setPickDate(e.target.value)} sx={{ minWidth: 170 }} />
          <TextField select label="Driver" size="small" value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">All drivers</MenuItem>
            {drivers.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
          </TextField>
          <TextField select label="Vehicle" size="small" value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">All vehicles</MenuItem>
            {vehicles.map((v) => <MenuItem key={v.id} value={v.id}>{v.plate}</MenuItem>)}
          </TextField>
          <Box sx={{ flex: 1 }} />
          <Button
            size="small"
            onClick={() => { setPickDate(''); setDriverFilter(''); setVehicleFilter(''); }}
            sx={{ textTransform: 'none', color: '#6b7280' }}
          >
            Clear
          </Button>
          <Stack direction="row" sx={{ border: '1px solid #e5e7eb', borderRadius: 99, p: 0.3 }}>
            {[
              { v: 'list', label: 'List' },
              { v: 'byDay', label: 'By day' },
            ].map((opt) => (
              <Button
                key={opt.v}
                size="small"
                onClick={() => setView(opt.v)}
                sx={{
                  textTransform: 'none', borderRadius: 99, px: 2, fontSize: 12, fontWeight: 600,
                  bgcolor: view === opt.v ? ACCENT : 'transparent',
                  color: view === opt.v ? '#fff' : '#374151',
                  '&:hover': { bgcolor: view === opt.v ? '#be123c' : '#f3f4f6' },
                }}
              >
                {opt.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Pending Returns — priority panel for admin review */}
      {!loading && trips.some((t) => t.returnRequest?.status === 'pending') && (
        <Box sx={{ mb: 2.5, p: 2, bgcolor: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 2.5 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
            <KeyboardReturnOutlinedIcon sx={{ color: '#a16207' }} />
            <Typography sx={{ fontWeight: 800, color: '#92400e', fontSize: 15 }}>
              Pending Return Approvals ({trips.filter((t) => t.returnRequest?.status === 'pending').length})
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small" onClick={() => setFilter('pending-returns')}
              sx={{ textTransform: 'none', color: '#92400e', fontWeight: 600 }}
            >
              Show only these
            </Button>
          </Stack>
          <Stack spacing={1}>
            {trips
              .filter((t) => t.returnRequest?.status === 'pending')
              .slice(0, 5)
              .map((t) => (
                <Stack
                  key={t.id} direction="row" onClick={() => setViewTarget(t)}
                  sx={{
                    alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#fff',
                    borderRadius: 2, cursor: 'pointer', flexWrap: 'wrap',
                    border: '1px solid #fef3c7',
                    '&:hover': { borderColor: '#fde68a', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
                  }}
                >
                  <Avatar variant="rounded" sx={{ bgcolor: '#fef3c7', color: '#a16207', width: 36, height: 36 }}>
                    <KeyboardReturnOutlinedIcon sx={{ fontSize: 20 }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
                      {t.tripNumber} — {t.driver?.name || '—'}
                    </Typography>
                    <Stack direction="row" sx={{ gap: 1.2, mt: 0.4, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: 12.5, color: '#1d4ed8', fontWeight: 800 }}>
                        Loaded: {t.loadedUnits || 0}u
                      </Typography>
                      <Typography sx={{ fontSize: 12.5, color: '#a16207', fontWeight: 800 }}>
                        Return: {pendingReturnUnitsOf(t)}u
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
                        · requested {fmtDate(t.returnRequest?.requestedAt)}
                      </Typography>
                    </Stack>
                  </Box>
                  <Button
                    size="small" variant="contained"
                    sx={{ bgcolor: ACCENT, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#be123c' } }}
                  >
                    Review
                  </Button>
                </Stack>
              ))}
          </Stack>
        </Box>
      )}

      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2 }}>
          <Typography sx={{ color: '#6b7280' }}>No trips match. Click "New Trip" to schedule one.</Typography>
        </Box>
      ) : view === 'byDay' ? (
        <Stack sx={{ gap: 2.5 }}>
          {byDay.map(({ day, totals, drivers: rows }) => (
            <Box key={day} sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5, overflow: 'hidden' }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, p: 2, bgcolor: '#f9fafb', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
                <EventOutlinedIcon sx={{ color: '#6b7280' }} />
                <Typography sx={{ fontWeight: 700 }}>{fmtDate(day)}</Typography>
                <Box sx={{ flex: 1 }} />
                <Chip size="small" label={`${rows.length} driver${rows.length === 1 ? '' : 's'}`} sx={{ fontWeight: 600 }} />
                <Chip size="small" label={`${totals.units} units`} sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }} />
              </Stack>
              <Stack>
                {rows.map((row) => (
                  <Box key={row.driver?.id || Math.random()} sx={{ p: 2, borderBottom: '1px solid #f3f4f6' }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                      <Avatar src={avatarSrcFor(row.driver)} sx={{ width: 32, height: 32 }} />
                      <Box sx={{ minWidth: 160 }}>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{row.driver?.name || '—'}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
                          {row.vehicles.size ? Array.from(row.vehicles).join(', ') : 'No vehicle'}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }} />
                      <Chip size="small" label={`${row.trips} trips`} />
                      <Chip size="small" label={`${row.units} units`} sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }} />
                    </Stack>
                    <Stack sx={{ mt: 1.2, gap: 0.6 }}>
                      {row.items.map((t) => (
                        <Stack key={t.id} direction="row" onClick={() => setViewTarget(t)}
                          sx={{ alignItems: 'center', gap: 1, px: 1.2, py: 0.8, bgcolor: '#f9fafb', borderRadius: 1.5, cursor: 'pointer', '&:hover': { bgcolor: '#f3f4f6' }, flexWrap: 'wrap' }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{t.tripNumber}</Typography>
                          <Typography sx={{ fontSize: 12, color: '#6b7280' }}>· {t.store?.name}</Typography>
                          <Box sx={{ flex: 1 }} />
                          <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{t.totalUnits} units</Typography>
                          <Chip size="small" label={(STATUS_META[t.status] || STATUS_META.pending).label} sx={{ bgcolor: (STATUS_META[t.status] || STATUS_META.pending).bg, color: (STATUS_META[t.status] || STATUS_META.pending).color, fontSize: 10, height: 18, fontWeight: 700 }} />
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
        <Stack sx={{ gap: 1.4 }}>
          {filtered.map((t) => {
            const s = STATUS_META[t.status] || STATUS_META.pending;
            return (
              <Stack
                key={t.id}
                onClick={() => setViewTarget(t)}
                direction="row"
                sx={{
                  alignItems: 'center', gap: 1.5, p: 2, bgcolor: '#fff',
                  border: '1px solid #e5e7eb', borderRadius: 2.5, cursor: 'pointer',
                  '&:hover': { borderColor: '#d1d5db', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' },
                  flexWrap: 'wrap',
                }}
              >
                <Avatar variant="rounded" sx={{ bgcolor: '#f3e8ff', color: '#7c3aed', width: 44, height: 44 }}>
                  <LocalShippingOutlinedIcon />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                    {t.tripNumber} — {t.store?.name}
                  </Typography>
                  <Stack direction="row" sx={{ gap: 1.5, mt: 0.4, flexWrap: 'wrap' }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                      <Avatar src={avatarSrcFor(t.driver)} sx={{ width: 18, height: 18 }} />
                      <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{t.driver?.name || '—'}</Typography>
                    </Stack>
                    {t.vehicle?.plate && (
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                        <RouteOutlinedIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                        <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{t.vehicle.plate}{t.vehicle.route ? ` • ${t.vehicle.route}` : ''}</Typography>
                      </Stack>
                    )}
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                      <EventOutlinedIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                      <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(t.date)}</Typography>
                    </Stack>
                  </Stack>
                </Box>
                <Box sx={{ minWidth: 110, textAlign: 'right' }}>
                  <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Loaded</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#1d4ed8' }}>{t.loadedUnits || 0}u</Typography>
                </Box>
                <Box sx={{ minWidth: 110, textAlign: 'right' }}>
                  <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Returned</Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#a16207' }}>{returnedUnitsOf(t)}u</Typography>
                </Box>
                <Chip size="small" label={s.label} sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 11, height: 22, borderRadius: 99 }} />
                {t.returnRequest?.status === 'pending' && (
                  <Chip size="small" label="Return: Pending" sx={{ bgcolor: '#fef3c7', color: '#a16207', fontWeight: 700, fontSize: 10, height: 22 }} />
                )}
                {t.returnRequest?.status === 'approved' && (
                  <Chip size="small" label="Return ✓" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 10, height: 22 }} />
                )}
                <Tooltip title="Actions">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuTarget(t); }}>
                    <MoreVertIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            );
          })}
        </Stack>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { setViewTarget(menuTarget); setMenuAnchor(null); }}>
          <VisibilityOutlinedIcon fontSize="small" sx={{ mr: 1 }} />View items
        </MenuItem>
        <MenuItem onClick={() => { setEditTarget(menuTarget); setMenuAnchor(null); }}>
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />Edit
        </MenuItem>
        <MenuItem onClick={() => { setDeleteTarget(menuTarget); setMenuAnchor(null); }} sx={{ color: '#b91c1c' }}>
          <DeleteOutlinedIcon fontSize="small" sx={{ mr: 1 }} />Delete
        </MenuItem>
      </Menu>

      {createOpen && (
        <TripDialog
          drivers={drivers}
          vehicles={vehicles}
          onClose={() => setCreateOpen(false)}
          onSaved={(t) => { setTrips((prev) => [t, ...prev]); setToast(`Created ${t.tripNumber}`); setCreateOpen(false); }}
        />
      )}
      {editTarget && (
        <TripDialog
          target={editTarget}
          drivers={drivers}
          vehicles={vehicles}
          onClose={() => setEditTarget(null)}
          onSaved={(t) => { setTrips((prev) => prev.map((x) => x.id === t.id ? t : x)); setToast(`Updated ${t.tripNumber}`); setEditTarget(null); }}
        />
      )}
      {viewTarget && (
        <TripDetailsDialog
          trip={viewTarget}
          onClose={() => setViewTarget(null)}
          onEdit={() => { setEditTarget(viewTarget); setViewTarget(null); }}
          onTripUpdated={(t) => { setTrips((prev) => prev.map((x) => x.id === t.id ? t : x)); setViewTarget(t); }}
          setToast={setToast}
        />
      )}
      {deleteTarget && (
        <DeleteTripDialog
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id, no) => { setTrips((prev) => prev.filter((x) => x.id !== id)); setToast(`Deleted ${no}`); }}
        />
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={2500} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

function TripDialog({ target, drivers, vehicles, onClose, onSaved }) {
  const editing = Boolean(target);
  const [driver, setDriver] = useState(target?.driver?.id || '');
  const [vehicle, setVehicle] = useState(target?.vehicle?.id || '');
  const [storeName, setStoreName] = useState(target?.store?.name || '');
  const [storeAddress, setStoreAddress] = useState(target?.store?.address || '');
  const [date, setDate] = useState(target?.date ? new Date(target.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState(target?.status || 'pending');
  const [notes, setNotes] = useState(target?.notes || '');
  const [items, setItems] = useState(
    target?.items?.length ? target.items.map((i) => ({ ...i })) : [{ name: '', qty: 1 }],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateItem = (i, key, val) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [key]: val } : it));
  const addItem = () => setItems((prev) => [...prev, { name: '', qty: 1 }]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const totalUnits = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);

  const submit = async () => {
    setError('');
    if (!driver) { setError('Select a delivery partner'); return; }
    if (!storeName.trim()) { setError('Store name is required'); return; }
    if (!date) { setError('Date is required'); return; }
    const cleanItems = items.filter((it) => it.name && Number(it.qty) > 0);
    setSubmitting(true);
    try {
      const payload = {
        driver,
        vehicle: vehicle || null,
        store: { name: storeName.trim(), address: storeAddress.trim() },
        date,
        status,
        items: cleanItems,
        notes: notes.trim(),
      };
      const t = editing ? await updateTrip(target.id, payload) : await createTrip(payload);
      onSaved(t);
    } catch (e) {
      setError(e.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const fullScreen = useFullScreenDialog();
  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ fontWeight: 700 }}>{editing ? `Edit ${target.tripNumber}` : 'New trip'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField select label="Delivery partner" value={driver} onChange={(e) => setDriver(e.target.value)} fullWidth>
              <MenuItem value="">— Select —</MenuItem>
              {drivers.map((d) => <MenuItem key={d.id} value={d.id}>{d.name} ({d.phone})</MenuItem>)}
            </TextField>
            <TextField select label="Vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} fullWidth>
              <MenuItem value="">— None —</MenuItem>
              {vehicles.map((v) => <MenuItem key={v.id} value={v.id}>{v.plate} • {v.model}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Store name" value={storeName} onChange={(e) => setStoreName(e.target.value)} fullWidth />
            <TextField label="Store address" value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} fullWidth />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
            <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} fullWidth>
              {Object.entries(STATUS_META).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </TextField>
          </Stack>

          <Divider />
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700 }}>Products delivered</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addItem} sx={{ textTransform: 'none' }}>Add product</Button>
          </Stack>
          <Stack spacing={1.2}>
            {items.map((it, i) => (
              <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ alignItems: { sm: 'center' } }}>
                <TextField label="Product" value={it.name} onChange={(e) => updateItem(i, 'name', e.target.value)} sx={{ flex: 2 }} />
                <TextField label="Qty" type="number" value={it.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} slotProps={{ htmlInput: { min: 0 } }} sx={{ flex: 1 }} />
                <IconButton onClick={() => removeItem(i)} disabled={items.length === 1} size="small">
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
          <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 3 }}>
            <Typography sx={{ fontSize: 13, color: '#6b7280' }}>Units: <strong style={{ color: '#111827' }}>{totalUnits}</strong></Typography>
          </Stack>

          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={submit} disabled={submitting} variant="contained" sx={{ bgcolor: ACCENT, textTransform: 'none', '&:hover': { bgcolor: '#be123c' } }}>
          {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create trip'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TripDetailsDialog({ trip, onClose, onEdit, onTripUpdated, setToast }) {
  const s = STATUS_META[trip.status] || STATUS_META.pending;
  const ret = trip.returnRequest;
  const retStatus = ret?.status || 'none';
  const sales = useMemo(() => trip.sales || [], [trip.sales]);
  const soldByName = useMemo(() => {
    const m = new Map();
    sales.forEach((sale) => (sale.items || []).forEach((it) => {
      m.set(it.name, (m.get(it.name) || 0) + (Number(it.qty) || 0));
    }));
    return m;
  }, [sales]);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const review = async (action) => {
    setReviewing(true); setReviewError('');
    try {
      const updated = await reviewTripReturn(trip.id, action, reviewNote.trim());
      onTripUpdated && onTripUpdated(updated);
      setToast && setToast(action === 'approve' ? `Return approved for ${updated.tripNumber}` : `Return rejected for ${updated.tripNumber}`);
    } catch (e) {
      setReviewError(e.message || 'Failed to review return');
    } finally {
      setReviewing(false);
    }
  };
  const fullScreen = useFullScreenDialog();
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ fontWeight: 700, pr: 6 }}>
        {trip.tripNumber}
        <Chip size="small" label={s.label} sx={{ ml: 1.5, bgcolor: s.bg, color: s.color, fontWeight: 700 }} />
      </DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
            <Avatar src={avatarSrcFor(trip.driver)} sx={{ width: 40, height: 40 }} />
            <Box>
              <Typography sx={{ fontWeight: 700 }}>{trip.driver?.name || '—'}</Typography>
              <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{trip.driver?.phone || ''}</Typography>
            </Box>
          </Stack>
          <Divider />
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <StorefrontOutlinedIcon sx={{ fontSize: 18, color: '#6b7280' }} />
            <Box>
              <Typography sx={{ fontWeight: 600 }}>{trip.store?.name}</Typography>
              {trip.store?.address && <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{trip.store.address}</Typography>}
            </Box>
          </Stack>
          <Stack direction="row" sx={{ gap: 3, flexWrap: 'wrap' }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
              <EventOutlinedIcon sx={{ fontSize: 16, color: '#6b7280' }} />
              <Typography sx={{ fontSize: 13 }}>{fmtDate(trip.date)}</Typography>
            </Stack>
            {trip.vehicle?.plate && (
              <Stack direction="row" sx={{ alignItems: 'center', gap: 0.75 }}>
                <RouteOutlinedIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                <Typography sx={{ fontSize: 13 }}>{trip.vehicle.plate}{trip.vehicle.route ? ` • ${trip.vehicle.route}` : ''}</Typography>
              </Stack>
            )}
          </Stack>

          <Divider />
          <Typography sx={{ fontWeight: 700 }}>Products loaded for this trip</Typography>
          {trip.items?.length ? (
            <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
              <Stack direction="row" sx={{ px: 1.5, py: 1, bgcolor: '#f9fafb', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
                <Box sx={{ flex: 2 }}>Product</Box>
                <Box sx={{ flex: 1, textAlign: 'right' }}>Loaded</Box>
                <Box sx={{ flex: 1, textAlign: 'right' }}>Sold</Box>
                <Box sx={{ flex: 1, textAlign: 'right' }}>Remaining</Box>
              </Stack>
              {trip.items.map((it, i) => {
                const sold = soldByName.get(it.name) || 0;
                const remaining = Math.max(0, (Number(it.qty) || 0) - sold);
                return (
                  <Stack key={i} direction="row" sx={{ px: 1.5, py: 1, fontSize: 13, borderTop: '1px solid #f3f4f6' }}>
                    <Box sx={{ flex: 2 }}>{it.name}</Box>
                    <Box sx={{ flex: 1, textAlign: 'right' }}>{it.qty}</Box>
                    <Box sx={{ flex: 1, textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>{sold}</Box>
                    <Box sx={{ flex: 1, textAlign: 'right', color: remaining === 0 ? '#dc2626' : '#374151', fontWeight: 700 }}>{remaining}</Box>
                  </Stack>
                );
              })}
              <Stack direction="row" sx={{ px: 1.5, py: 1, bgcolor: '#f9fafb', fontSize: 13, fontWeight: 700, borderTop: '1px solid #e5e7eb' }}>
                <Box sx={{ flex: 2 }}>Total</Box>
                <Box sx={{ flex: 1, textAlign: 'right' }}>{trip.loadedUnits || trip.totalUnits || 0}</Box>
                <Box sx={{ flex: 1, textAlign: 'right', color: '#16a34a' }}>{trip.totalUnits || 0}</Box>
                <Box sx={{ flex: 1, textAlign: 'right' }}>
                  {Math.max(0, (trip.loadedUnits || 0) - (trip.totalUnits || 0))}
                </Box>
              </Stack>
            </Box>
          ) : (
            <Typography sx={{ fontSize: 13, color: '#6b7280' }}>No items recorded for this trip.</Typography>
          )}

          <Divider />
          <Typography sx={{ fontWeight: 700 }}>Customer sales ({sales.length})</Typography>
          {sales.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: '#6b7280' }}>No sales recorded for this trip yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {sales.map((sale, idx) => (
                <Box key={sale.id || idx} sx={{ p: 1.4, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.6, flexWrap: 'wrap' }}>
                    <Avatar sx={{ width: 28, height: 28, bgcolor: '#dbeafe', color: '#1d4ed8' }}>
                      <StorefrontOutlinedIcon sx={{ fontSize: 15 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 140 }}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{sale.customer?.name || '—'}</Typography>
                      {sale.customer?.address && (
                        <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>{sale.customer.address}</Typography>
                      )}
                    </Box>
                    {sale.date && (
                      <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
                        {new Date(sale.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    )}
                    <Chip size="small" label={`${sale.totalUnits || 0}u`} sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 11 }} />
                  </Stack>
                  <Box sx={{ pl: 4.2 }}>
                    {(sale.items || []).map((it, i) => (
                      <Typography key={i} sx={{ fontSize: 12, color: '#374151' }}>
                        • {it.name} — <strong>{it.qty}</strong>
                      </Typography>
                    ))}
                    {sale.note && (
                      <Typography sx={{ fontSize: 11.5, color: '#6b7280', fontStyle: 'italic', mt: 0.4 }}>Note: {sale.note}</Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Stack>
          )}

          {ret && retStatus !== 'none' && (
            <>
              <Divider />
              <Box sx={{ p: 1.8, bgcolor: retStatus === 'pending' ? '#fef3c7' : retStatus === 'approved' ? '#f0fdf4' : '#fee2e2', border: '1px solid', borderColor: retStatus === 'pending' ? '#fde68a' : retStatus === 'approved' ? '#bbf7d0' : '#fecaca', borderRadius: 2 }}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 13.5 }}>Return request</Typography>
                  <Chip
                    size="small"
                    label={retStatus.toUpperCase()}
                    sx={{
                      bgcolor: retStatus === 'pending' ? '#fde68a' : retStatus === 'approved' ? '#bbf7d0' : '#fecaca',
                      color: retStatus === 'pending' ? '#92400e' : retStatus === 'approved' ? '#15803d' : '#b91c1c',
                      fontWeight: 700, fontSize: 10,
                    }}
                  />
                </Stack>
                {ret.note && <Typography sx={{ fontSize: 12, color: '#6b7280', mb: 1 }}>Driver note: {ret.note}</Typography>}
                <Box sx={{ border: '1px solid #fff', bgcolor: '#fff', borderRadius: 1.5, overflow: 'hidden' }}>
                  <Stack direction="row" sx={{ px: 1.2, py: 0.8, bgcolor: '#f9fafb', fontSize: 11, fontWeight: 700, color: '#6b7280' }}>
                    <Box sx={{ flex: 2 }}>Product</Box>
                    <Box sx={{ flex: 1, textAlign: 'right' }}>Returned Qty</Box>
                  </Stack>
                  {(ret.items || []).map((it, i) => (
                    <Stack key={i} direction="row" sx={{ px: 1.2, py: 0.8, fontSize: 12.5, borderTop: '1px solid #f3f4f6' }}>
                      <Box sx={{ flex: 2 }}>{it.name}</Box>
                      <Box sx={{ flex: 1, textAlign: 'right', fontWeight: 700 }}>{it.qty}</Box>
                    </Stack>
                  ))}
                </Box>
                {retStatus !== 'pending' && (
                  <Typography sx={{ mt: 1, fontSize: 11.5, color: '#6b7280' }}>
                    Reviewed by {ret.reviewedBy?.name || '—'} on {ret.reviewedAt ? new Date(ret.reviewedAt).toLocaleString('en-IN') : ''}
                    {ret.reviewNote ? ` — Note: ${ret.reviewNote}` : ''}
                  </Typography>
                )}
                {retStatus === 'pending' && (
                  <>
                    {reviewError && <Alert severity="error" sx={{ mt: 1 }}>{reviewError}</Alert>}
                    <TextField
                      label="Note (optional)"
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      size="small"
                      fullWidth
                      sx={{ mt: 1.2, bgcolor: '#fff' }}
                    />
                    <Stack direction="row" sx={{ gap: 1, mt: 1.2 }}>
                      <Button
                        onClick={() => review('reject')}
                        disabled={reviewing}
                        variant="outlined"
                        color="error"
                        sx={{ textTransform: 'none', flex: 1 }}
                      >
                        Reject
                      </Button>
                      <Button
                        onClick={() => review('approve')}
                        disabled={reviewing}
                        variant="contained"
                        sx={{ bgcolor: '#16a34a', textTransform: 'none', flex: 1, '&:hover': { bgcolor: '#15803d' } }}
                      >
                        {reviewing ? 'Working…' : 'Approve & confirm receipt'}
                      </Button>
                    </Stack>
                  </>
                )}
              </Box>
            </>
          )}

          {trip.notes && (
            <>
              <Divider />
              <Box>
                <Typography sx={{ fontSize: 12, color: '#6b7280', mb: 0.5 }}>Notes</Typography>
                <Typography sx={{ fontSize: 13 }}>{trip.notes}</Typography>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteTripDialog({ target, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setSubmitting(true);
    try { await deleteTrip(target.id); onDeleted(target.id, target.tripNumber); onClose(); }
    catch (e) { setError(e.message || 'Failed to delete'); }
    finally { setSubmitting(false); }
  };
  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Delete trip?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2">Permanently delete <strong>{target.tripNumber}</strong>? This cannot be undone.</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={submit} disabled={submitting} variant="contained" color="error" sx={{ textTransform: 'none' }}>
          {submitting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
