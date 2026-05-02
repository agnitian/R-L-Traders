import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Chip, Avatar, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, Alert, CircularProgress, Divider, MenuItem, TextField, Snackbar, Menu, Tooltip,
} from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { PageHeader, StatsRow, FilterBar, useFullScreenDialog } from '../../../components/page/PagePrimitives';
import { listTrips, createTrip, updateTrip, deleteTrip } from '../../../api/trips';
import { listVehicles } from '../../../api/vehicles';
import { listProducts } from '../../../api/products';
import { toLocalDateInput } from '../../../utils/datetime';

const ACCENT = '#16a34a';

const STATUS_META = {
  pending: { label: 'Pending', bg: '#ffedd5', color: '#c2410c' },
  'in-progress': { label: 'In Progress', bg: '#dbeafe', color: '#1d4ed8' },
  completed: { label: 'Completed', bg: '#dcfce7', color: '#15803d' },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#dc2626' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

export default function MyTrips({ navigate }) {
  const [trips, setTrips] = useState([]);
  const [myVehicle, setMyVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('this-month');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);
  const [toast, setToast] = useState('');

  const reload = async () => {
    setLoading(true); setError('');
    try {
      const [ts, vs] = await Promise.all([listTrips(), listVehicles()]);
      setTrips(ts);
      setMyVehicle(vs[0] || null);
    } catch (e) { setError(e.message || 'Failed to load trips'); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    const today = now.toDateString();
    let monthCount = 0, todayCount = 0, monthUnits = 0, pendingReturns = 0;
    trips.forEach((t) => {
      const d = new Date(t.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        monthCount += 1;
        monthUnits += t.totalUnits || 0;
      }
      if (d.toDateString() === today) todayCount += 1;
      if (t.returnRequest?.status === 'pending') pendingReturns += 1;
    });
    return { monthCount, todayCount, monthUnits, pendingReturns };
  }, [trips]);

  const activeTrip = useMemo(
    () => trips.find((t) => t.status === 'in-progress' || t.status === 'pending'),
    [trips],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const now = new Date();
    return trips.filter((t) => {
      const d = new Date(t.date);
      let matchTime = true;
      if (filter === 'today') matchTime = d.toDateString() === now.toDateString();
      else if (filter === 'this-month') matchTime = d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      const matchSearch = !q || `${t.tripNumber} ${t.vehicle?.plate || ''} ${t.vehicle?.route || ''}`.toLowerCase().includes(q);
      return matchTime && matchSearch;
    });
  }, [trips, filter, search]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="My Trips"
        subtitle="Trips on your assigned vehicle. Tap a trip to see all sales (who bought what)."
        action={
          <Button
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            disabled={!myVehicle || Boolean(activeTrip)}
            title={activeTrip ? `Active trip ${activeTrip.tripNumber} in progress` : ''}
            sx={{ bgcolor: ACCENT, color: '#fff', textTransform: 'none', fontWeight: 600, px: 2, py: 1, borderRadius: 2, '&:hover': { bgcolor: '#15803d' }, '&.Mui-disabled': { bgcolor: '#d1d5db', color: '#fff' } }}
          >
            Add Trip
          </Button>
        }
      />

      <Box sx={{ p: 2, mb: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2.5 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Avatar variant="rounded" sx={{ bgcolor: '#dcfce7', color: '#15803d', width: 44, height: 44 }}>
            <DirectionsCarFilledOutlinedIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontSize: 11.5, color: '#15803d', fontWeight: 700, letterSpacing: 0.5 }}>YOUR VEHICLE</Typography>
            {myVehicle ? (
              <Stack direction="row" sx={{ gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mt: 0.3 }}>
                <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>{myVehicle.plate}</Typography>
                <Typography sx={{ fontSize: 13, color: '#374151' }}>{myVehicle.model}</Typography>
                {myVehicle.route && (
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 0.4 }}>
                    <RouteOutlinedIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                    <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{myVehicle.route}</Typography>
                  </Stack>
                )}
              </Stack>
            ) : (
              <Typography sx={{ fontSize: 13, color: '#dc2626' }}>
                No vehicle assigned yet. Contact admin to assign one.
              </Typography>
            )}
          </Box>
          <Chip label="Assigned by Admin" size="small" sx={{ bgcolor: '#fff', color: '#15803d', fontWeight: 700, fontSize: 11, border: '1px solid #bbf7d0' }} />
        </Stack>
      </Box>

      <StatsRow
        cols={4}
        items={[
          { label: 'This Month', value: stats.monthCount, valueColor: '#16a34a' },
          { label: 'Today', value: stats.todayCount, valueColor: '#2563eb' },
          { label: 'Sold (Month)', value: stats.monthUnits },
          { label: 'Pending Returns', value: stats.pendingReturns, valueColor: '#ea580c' },
        ]}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search trip # / vehicle / route..."
        accent={ACCENT}
        activeFilter={filter}
        onFilterChange={setFilter}
        filters={[
          { label: 'Today', value: 'today' },
          { label: 'This Month', value: 'this-month' },
          { label: 'All', value: 'all' },
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {activeTrip && (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have an active trip <strong>{activeTrip.tripNumber}</strong>. Complete or cancel it before starting a new one.
        </Alert>
      )}

      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2 }}>
          <Typography sx={{ color: '#6b7280' }}>No trips for this period. Tap "Add Trip" to start one.</Typography>
        </Box>
      ) : (
        <Stack sx={{ gap: 1.4 }}>
          {filtered.map((t) => {
            const s = STATUS_META[t.status] || STATUS_META.pending;
            const ret = t.returnRequest?.status;
            const salesCount = t.sales?.length || 0;
            return (
              <Stack
                key={t.id}
                onClick={() => setViewTarget(t)}
                direction="row"
                sx={{ alignItems: 'center', gap: 1.5, p: 2, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5, cursor: 'pointer', '&:hover': { borderColor: '#16a34a', bgcolor: '#f0fdf4' }, flexWrap: 'wrap' }}
              >
                <Avatar variant="rounded" sx={{ bgcolor: '#dcfce7', color: '#16a34a', width: 44, height: 44 }}>
                  <LocalShippingOutlinedIcon />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{t.tripNumber}</Typography>
                    {t.vehicle?.plate && (
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8' }}>• {t.vehicle.plate}</Typography>
                    )}
                  </Stack>
                  <Stack direction="row" sx={{ gap: 1.5, mt: 0.4, flexWrap: 'wrap' }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.4 }}>
                      <EventOutlinedIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                      <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(t.date)}</Typography>
                    </Stack>
                    {t.vehicle?.route && (
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.4 }}>
                        <RouteOutlinedIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                        <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{t.vehicle.route}</Typography>
                      </Stack>
                    )}
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.4 }}>
                      <Inventory2OutlinedIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                      <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                        Loaded: {t.loadedUnits || 0}u
                      </Typography>
                    </Stack>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.4 }}>
                      <StorefrontOutlinedIcon sx={{ fontSize: 14, color: '#16a34a' }} />
                      <Typography sx={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                        Sales: {salesCount} • {t.totalUnits || 0}u
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
                <Stack sx={{ alignItems: 'flex-end', gap: 0.5 }}>
                  <Chip size="small" label={s.label} sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 11, height: 22, borderRadius: 99 }} />
                  {ret === 'pending' && <Chip size="small" label="Return: Pending" sx={{ bgcolor: '#fef3c7', color: '#a16207', fontWeight: 700, fontSize: 10, height: 20 }} />}
                  {ret === 'approved' && <Chip size="small" label="Return: Approved" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 10, height: 20 }} />}
                  {ret === 'rejected' && <Chip size="small" label="Return: Rejected" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: 10, height: 20 }} />}
                </Stack>
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
        {(menuTarget?.status === 'pending' || menuTarget?.status === 'in-progress') && (
          <MenuItem onClick={() => { navigate?.('Supply Entry', menuTarget?.id); setMenuAnchor(null); }}>
            <AddIcon fontSize="small" sx={{ mr: 1 }} />Add sale
          </MenuItem>
        )}
        <MenuItem onClick={() => { setEditTarget(menuTarget); setMenuAnchor(null); }}>
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />Edit trip
        </MenuItem>
        <MenuItem onClick={() => { setDeleteTarget(menuTarget); setMenuAnchor(null); }} sx={{ color: '#b91c1c' }}>
          <DeleteOutlinedIcon fontSize="small" sx={{ mr: 1 }} />Delete trip
        </MenuItem>
      </Menu>

      {createOpen && (
        <TripDialog
          vehicle={myVehicle}
          onClose={() => setCreateOpen(false)}
          onSaved={(t) => { setTrips((prev) => [t, ...prev]); setToast(`Started ${t.tripNumber}`); setCreateOpen(false); }}
        />
      )}
      {editTarget && (
        <TripDialog
          target={editTarget}
          vehicle={myVehicle}
          onClose={() => setEditTarget(null)}
          onSaved={(t) => { setTrips((prev) => prev.map((x) => x.id === t.id ? t : x)); setToast(`Updated ${t.tripNumber}`); setEditTarget(null); }}
        />
      )}
      {viewTarget && (
        <TripDetailsDialog
          trip={viewTarget}
          onClose={() => setViewTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id, no) => { setTrips((prev) => prev.filter((x) => x.id !== id)); setToast(`Deleted ${no}`); }}
        />
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={2200} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

/** Dialog to create or edit a trip — captures only loaded products, no customer */
function TripDialog({ target, vehicle, onClose, onSaved }) {
  const editing = Boolean(target);
  const [date, setDate] = useState(toLocalDateInput(target?.date));
  const [status, setStatus] = useState(target?.status || 'in-progress');
  const [notes, setNotes] = useState(target?.notes || '');
  const [items, setItems] = useState(target?.items?.length ? target.items.map((i) => ({ name: i.name, qty: i.qty })) : [{ name: '', qty: 1 }]);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);
    listProducts()
      .then((list) => { if (!cancelled) setProducts((list || []).filter((p) => p.active !== false)); })
      .catch(() => { if (!cancelled) setProducts([]); })
      .finally(() => { if (!cancelled) setLoadingProducts(false); });
    return () => { cancelled = true; };
  }, []);

  // Effective available stock for a given product name.
  // When editing, the qty already on this trip is added back to the available stock
  // so the user can keep / reduce that line without bogus "exceeds stock" errors.
  const availableFor = (name) => {
    const p = products.find((x) => x.name === name);
    if (!p) return null;
    const original = (target?.items || []).find((it) => it.name === name);
    return Number(p.stock || 0) + Number(original?.qty || 0);
  };

  const updateItem = (i, key, val) => setItems((prev) => prev.map((it, idx) => {
    if (idx !== i) return it;
    return { ...it, [key]: val };
  }));
  const addItem = () => setItems((prev) => [...prev, { name: '', qty: 1 }]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const totalUnits = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);

  // Per-line validation result (for inline error helper text)
  const lineErrors = items.map((it) => {
    if (!it.name) return '';
    const avail = availableFor(it.name);
    if (avail == null) return 'Product not found in catalog';
    if (Number(it.qty) > avail) return `Only ${avail} in stock`;
    return '';
  });

  const submit = async () => {
    setError('');
    if (!date) { setError('Date is required'); return; }
    const cleanItems = items.filter((it) => it.name && Number(it.qty) > 0);
    if (cleanItems.length === 0) { setError('Add at least one product'); return; }

    // Aggregate qty per product (a product may appear on multiple lines)
    const totals = new Map();
    for (const it of cleanItems) {
      totals.set(it.name, (totals.get(it.name) || 0) + Number(it.qty));
    }
    for (const [name, qty] of totals) {
      const avail = availableFor(name);
      if (avail == null) { setError(`"${name}" is not a known product. Pick one from the list.`); return; }
      if (qty > avail) { setError(`Cannot load ${qty} of "${name}" — only ${avail} available in stock.`); return; }
    }

    setSubmitting(true);
    try {
      const payload = { date, status, items: cleanItems, notes: notes.trim() };
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
      <DialogTitle sx={{ fontWeight: 700 }}>{editing ? `Edit ${target.tripNumber}` : 'Start new trip'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {vehicle ? (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
            <Typography sx={{ fontSize: 11.5, color: '#15803d', fontWeight: 700 }}>VEHICLE (assigned by admin)</Typography>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
              {vehicle.plate} • {vehicle.model}{vehicle.route ? ` • ${vehicle.route}` : ''}
            </Typography>
          </Box>
        ) : (
          <Alert severity="warning" sx={{ mb: 2 }}>No vehicle assigned. Ask admin to assign one.</Alert>
        )}

        <Typography sx={{ fontSize: 12, color: '#6b7280', mb: 1.5 }}>
          List the products and quantities loaded onto your vehicle for this trip. You'll record individual customer sales from <strong>Supply Entry</strong>.
        </Typography>

        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
            <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} fullWidth>
              {Object.entries(STATUS_META).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </TextField>
          </Stack>

          <Divider />
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700 }}>Products loaded</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addItem} sx={{ textTransform: 'none' }}>Add product</Button>
          </Stack>
          <Stack spacing={1.2}>
            {items.map((it, i) => {
              const avail = it.name ? availableFor(it.name) : null;
              const lineErr = lineErrors[i];
              return (
                <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ alignItems: { sm: 'flex-start' } }}>
                  <TextField
                    select
                    label="Product"
                    value={it.name}
                    onChange={(e) => updateItem(i, 'name', e.target.value)}
                    sx={{ flex: 2 }}
                    error={!!lineErr && lineErr.includes('not found')}
                    helperText={loadingProducts ? 'Loading…' : (products.length === 0 ? 'No products. Ask admin to add some.' : ' ')}
                  >
                    {/* Preserve existing value if it no longer exists in the catalog */}
                    {it.name && !products.some((p) => p.name === it.name) && (
                      <MenuItem value={it.name}>{it.name} (unknown)</MenuItem>
                    )}
                    {products.map((p) => (
                      <MenuItem key={p.id} value={p.name} disabled={Number(p.stock || 0) <= 0 && !(target?.items || []).some((x) => x.name === p.name)}>
                        {p.name} {p.sku ? `(${p.sku})` : ''} — stock: {p.stock || 0}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Qty loaded"
                    type="number"
                    value={it.qty}
                    onChange={(e) => updateItem(i, 'qty', e.target.value)}
                    slotProps={{ htmlInput: { min: 0, max: avail != null ? avail : undefined } }}
                    error={!!lineErr && lineErr.includes('stock')}
                    helperText={lineErr || (avail != null ? `Available: ${avail}` : ' ')}
                    sx={{ flex: 1 }}
                  />
                  <IconButton onClick={() => removeItem(i)} disabled={items.length === 1} size="small" sx={{ mt: { sm: 1 } }}>
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>
          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Typography sx={{ fontSize: 13, color: '#6b7280' }}>Total loaded: <strong style={{ color: '#111827' }}>{totalUnits} units</strong></Typography>
          </Stack>

          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={submit} disabled={submitting} variant="contained" sx={{ bgcolor: ACCENT, textTransform: 'none', '&:hover': { bgcolor: '#15803d' } }}>
          {submitting ? 'Saving…' : editing ? 'Save changes' : 'Start trip'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/** Read-only details: trip info, loaded products, and full list of sales (customer + items) */
function TripDetailsDialog({ trip, onClose }) {
  const s = STATUS_META[trip.status] || STATUS_META.pending;
  const ret = trip.returnRequest?.status;
  const sales = useMemo(() => trip.sales || [], [trip.sales]);

  // Aggregate sold per product
  const soldByProduct = useMemo(() => {
    const m = new Map();
    sales.forEach((sale) => {
      (sale.items || []).forEach((it) => {
        m.set(it.name, (m.get(it.name) || 0) + (Number(it.qty) || 0));
      });
    });
    return m;
  }, [sales]);

  const fullScreen = useFullScreenDialog();
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ fontWeight: 700, pr: 6 }}>
        {trip.tripNumber}
        <Chip size="small" label={s.label} sx={{ ml: 1.5, bgcolor: s.bg, color: s.color, fontWeight: 700 }} />
        {ret && ret !== 'none' && (
          <Chip
            size="small"
            label={`Return ${ret}`}
            sx={{
              ml: 1,
              bgcolor: ret === 'pending' ? '#fef3c7' : ret === 'approved' ? '#dcfce7' : '#fee2e2',
              color: ret === 'pending' ? '#a16207' : ret === 'approved' ? '#15803d' : '#b91c1c',
              fontWeight: 700,
            }}
          />
        )}
      </DialogTitle>
      <DialogContent>
        {/* Trip info */}
        <Stack direction="row" sx={{ gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
            <EventOutlinedIcon sx={{ fontSize: 16, color: '#6b7280' }} />
            <Typography sx={{ fontSize: 13 }}>{fmtDate(trip.date)}</Typography>
          </Stack>
          {trip.vehicle?.plate && (
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
              <RouteOutlinedIcon sx={{ fontSize: 16, color: '#6b7280' }} />
              <Typography sx={{ fontSize: 13 }}>
                {trip.vehicle.plate}{trip.vehicle.route ? ` • ${trip.vehicle.route}` : ''}
              </Typography>
            </Stack>
          )}
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" sx={{ gap: 1.5, flexWrap: 'wrap' }}>
            <Chip size="small" label={`Loaded: ${trip.loadedUnits || 0}u`} sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }} />
            <Chip size="small" label={`Sold: ${trip.totalUnits || 0}u`} sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
          </Stack>
        </Stack>

        {/* Loaded products */}
        <Typography sx={{ fontWeight: 700, mb: 1 }}>Products loaded for this trip</Typography>
        {trip.items?.length ? (
          <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
            <Stack direction="row" sx={{ px: 1.5, py: 1, bgcolor: '#f9fafb', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
              <Box sx={{ flex: 2 }}>Product</Box>
              <Box sx={{ flex: 1, textAlign: 'right' }}>Loaded</Box>
              <Box sx={{ flex: 1, textAlign: 'right' }}>Sold</Box>
              <Box sx={{ flex: 1, textAlign: 'right' }}>Remaining</Box>
            </Stack>
            {trip.items.map((it, i) => {
              const sold = soldByProduct.get(it.name) || 0;
              const remaining = Math.max(0, (it.qty || 0) - sold);
              return (
                <Stack key={i} direction="row" sx={{ px: 1.5, py: 1, fontSize: 13, borderTop: '1px solid #f3f4f6' }}>
                  <Box sx={{ flex: 2 }}>{it.name}</Box>
                  <Box sx={{ flex: 1, textAlign: 'right' }}>{it.qty}</Box>
                  <Box sx={{ flex: 1, textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>{sold}</Box>
                  <Box sx={{ flex: 1, textAlign: 'right', color: remaining === 0 ? '#dc2626' : '#374151', fontWeight: 700 }}>{remaining}</Box>
                </Stack>
              );
            })}
          </Box>
        ) : (
          <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 2 }}>No products loaded.</Typography>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Sales */}
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontWeight: 700 }}>Customer sales ({sales.length})</Typography>
        </Stack>

        {sales.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f9fafb', border: '1px dashed #e5e7eb', borderRadius: 2 }}>
            <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
              {trip.status === 'completed' || trip.status === 'cancelled'
                ? 'No sales were recorded for this trip.'
                : 'No sales recorded yet. Use Supply Entry to record customer purchases against this trip.'}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.2}>
            {sales.map((sale, idx) => (
              <Box key={sale.id || idx} sx={{ p: 1.5, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2 }}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.8, flexWrap: 'wrap' }}>
                  <Avatar sx={{ width: 30, height: 30, bgcolor: '#dbeafe', color: '#1d4ed8' }}>
                    <StorefrontOutlinedIcon sx={{ fontSize: 16 }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 160 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{sale.customer?.name || '—'}</Typography>
                    {sale.customer?.address && (
                      <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>{sale.customer.address}</Typography>
                    )}
                  </Box>
                  <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>{fmtDateTime(sale.date)}</Typography>
                  <Chip size="small" label={`${sale.totalUnits}u`} sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 11 }} />
                </Stack>
                <Box sx={{ pl: 4.5 }}>
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

        {trip.notes && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: 0.5, mb: 0.4 }}>TRIP NOTES</Typography>
            <Typography sx={{ fontSize: 13 }}>{trip.notes}</Typography>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteDialog({ target, onClose, onDeleted }) {
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
        <Typography variant="body2">Permanently delete <strong>{target.tripNumber}</strong>? All sales recorded against it will also be lost. This cannot be undone.</Typography>
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
