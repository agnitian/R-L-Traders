import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, TextField, IconButton, CircularProgress, Alert, Avatar,
  Chip, Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Menu, Snackbar, Tooltip,
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AssignmentReturnOutlinedIcon from '@mui/icons-material/AssignmentReturnOutlined';
import { PageHeader, useFullScreenDialog } from '../../../components/page/PagePrimitives';
import { listTrips, addTripSale, updateTripSale, deleteTripSale, submitTripReturn } from '../../../api/trips';
import { toLocalDateTimeInput } from '../../../utils/datetime';

const ACCENT = '#16a34a';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

const STATUS_META = {
  pending: { label: 'Pending', bg: '#ffedd5', color: '#c2410c' },
  'in-progress': { label: 'In Progress', bg: '#dbeafe', color: '#1d4ed8' },
  completed: { label: 'Completed', bg: '#dcfce7', color: '#15803d' },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#dc2626' },
};

const isActiveStatus = (s) => s === 'pending' || s === 'in-progress';

export default function SupplyEntry({ navigate }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editSale, setEditSale] = useState(null);
  const [deleteSaleTarget, setDeleteSaleTarget] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);
  const [returnOpen, setReturnOpen] = useState(false);
  const [toast, setToast] = useState('');

  const reload = async () => {
    setLoading(true); setError('');
    try {
      const ts = await listTrips();
      setTrips(ts);
    } catch (e) { setError(e.message || 'Failed to load trips'); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  // Current trip = most recent trip that is still active (pending or in-progress).
  const currentTrip = useMemo(() => {
    const active = trips
      .filter((t) => isActiveStatus(t.status))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return active[0] || null;
  }, [trips]);

  const upsertTrip = (updated) => setTrips((prev) => prev.map((t) => t.id === updated.id ? updated : t));

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Supply Entry"
        subtitle="Record customer sales for your active trip. Past trips are read-only in My Trips."
        action={
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            <Button
              startIcon={<AssignmentReturnOutlinedIcon />}
              onClick={() => setReturnOpen(true)}
              disabled={!currentTrip || currentTrip.returnRequest?.status === 'pending' || currentTrip.returnRequest?.status === 'approved'}
              variant="outlined"
              sx={{ borderColor: '#f59e0b', color: '#b45309', textTransform: 'none', fontWeight: 600, px: 2, py: 1, borderRadius: 2, '&:hover': { borderColor: '#d97706', bgcolor: '#fffbeb' } }}
            >
              Send Return Request
            </Button>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
              disabled={!currentTrip}
              sx={{ bgcolor: ACCENT, color: '#fff', textTransform: 'none', fontWeight: 600, px: 2, py: 1, borderRadius: 2, '&:hover': { bgcolor: '#15803d' }, '&.Mui-disabled': { bgcolor: '#d1d5db', color: '#fff' } }}
            >
              Add Sell
            </Button>
          </Stack>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>
      ) : !currentTrip ? (
        <Box sx={{ p: 4, bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2.5, textAlign: 'center' }}>
          <Inventory2OutlinedIcon sx={{ fontSize: 40, color: '#9ca3af', mb: 1 }} />
          <Typography sx={{ fontWeight: 700, color: '#111827', mb: 0.5 }}>No active trip</Typography>
          <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 2 }}>
            Start a trip from <strong>My Trips</strong> by tapping <strong>Add Trip</strong> and loading your stock.
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
      ) : (
        <Box sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5, p: { xs: 2, md: 3 } }}>
          <TripPanel
            trip={currentTrip}
            onAddSale={() => setAddOpen(true)}
            onEditSale={(sale) => setEditSale(sale)}
            onDeleteSale={(sale) => setDeleteSaleTarget(sale)}
            menuAnchor={menuAnchor}
            setMenuAnchor={setMenuAnchor}
            menuTarget={menuTarget}
            setMenuTarget={setMenuTarget}
          />
        </Box>
      )}

      {addOpen && currentTrip && (
        <SaleDialog
          trip={currentTrip}
          onClose={() => setAddOpen(false)}
          onSaved={(updated) => { upsertTrip(updated); setToast('Sale recorded'); setAddOpen(false); }}
        />
      )}
      {editSale && currentTrip && (
        <SaleDialog
          trip={currentTrip}
          target={editSale}
          onClose={() => setEditSale(null)}
          onSaved={(updated) => { upsertTrip(updated); setToast('Sale updated'); setEditSale(null); }}
        />
      )}
      {deleteSaleTarget && currentTrip && (
        <DeleteSaleDialog
          trip={currentTrip}
          sale={deleteSaleTarget}
          onClose={() => setDeleteSaleTarget(null)}
          onDeleted={(updated) => { upsertTrip(updated); setToast('Sale removed'); setDeleteSaleTarget(null); }}
        />
      )}
      {returnOpen && currentTrip && (
        <ReturnRequestDialog
          trip={currentTrip}
          onClose={() => setReturnOpen(false)}
          onSubmitted={(updated) => { upsertTrip(updated); setToast('Return request sent to admin'); setReturnOpen(false); }}
        />
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={2200} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

function TripPanel({ trip, onAddSale, onEditSale, onDeleteSale, menuAnchor, setMenuAnchor, menuTarget, setMenuTarget }) {
  const s = STATUS_META[trip.status] || STATUS_META.pending;
  const sales = trip.sales || [];

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2, mb: 2, flexWrap: 'wrap' }}>
        <Avatar variant="rounded" sx={{ bgcolor: '#dcfce7', color: '#15803d' }}>
          <LocalShippingOutlinedIcon />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: 18, fontWeight: 800 }}>{trip.tripNumber}</Typography>
            <Chip size="small" label="Current trip" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 10, height: 20 }} />
          </Stack>
          <Stack direction="row" sx={{ gap: 1.5, mt: 0.3, flexWrap: 'wrap' }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 0.4 }}>
              <EventOutlinedIcon sx={{ fontSize: 14, color: '#6b7280' }} />
              <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(trip.date)}</Typography>
            </Stack>
            {trip.vehicle?.plate && (
              <Stack direction="row" sx={{ alignItems: 'center', gap: 0.4 }}>
                <RouteOutlinedIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                  {trip.vehicle.plate}{trip.vehicle.route ? ` • ${trip.vehicle.route}` : ''}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>
        <Chip size="small" label={s.label} sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700 }} />
      </Stack>

      <Stack direction="row" sx={{ gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
        <Chip size="small" label={`Loaded: ${trip.loadedUnits || 0}u`} sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700 }} />
        <Chip size="small" label={`Sold: ${trip.totalUnits || 0}u (${sales.length} sales)`} sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
        {trip.returnRequest?.status && trip.returnRequest.status !== 'none' && (
          <Chip
            size="small"
            label={`Return ${trip.returnRequest.status}`}
            sx={{
              bgcolor: trip.returnRequest.status === 'pending' ? '#fef3c7' : trip.returnRequest.status === 'approved' ? '#dcfce7' : '#fee2e2',
              color: trip.returnRequest.status === 'pending' ? '#a16207' : trip.returnRequest.status === 'approved' ? '#15803d' : '#b91c1c',
              fontWeight: 700,
            }}
          />
        )}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography sx={{ fontWeight: 700 }}>Customer sales ({sales.length})</Typography>
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={onAddSale}
          sx={{ textTransform: 'none', color: ACCENT, fontWeight: 700 }}
        >
          Add sell
        </Button>
      </Stack>

      {sales.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f9fafb', border: '1px dashed #e5e7eb', borderRadius: 2 }}>
          <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
            No sales yet. Tap <strong>Add Sell</strong> to record a customer purchase.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1.2}>
          {sales.map((sale, idx) => (
            <Box key={sale.id || idx} sx={{ p: 1.5, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2, '&:hover': { borderColor: '#d1d5db' } }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.8, flexWrap: 'wrap' }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#dbeafe', color: '#1d4ed8' }}>
                  <StorefrontOutlinedIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 160 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>{sale.customer?.name || '—'}</Typography>
                  <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                    {sale.customer?.phone && (
                      <Typography sx={{ fontSize: 11, color: '#6b7280' }}>📞 {sale.customer.phone}</Typography>
                    )}
                    {sale.customer?.address && (
                      <Typography sx={{ fontSize: 11, color: '#6b7280' }}>{sale.customer.address}</Typography>
                    )}
                  </Stack>
                </Box>
                <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>{fmtDateTime(sale.date)}</Typography>
                <Chip size="small" label={`${sale.totalUnits}u`} sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 11 }} />
                <Tooltip title="Actions">
                  <IconButton size="small" onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuTarget(sale); }}>
                    <MoreVertIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Box sx={{ pl: 5 }}>
                {(sale.items || []).map((it, i) => (
                  <Typography key={i} sx={{ fontSize: 12.5, color: '#374151' }}>
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

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { onEditSale(menuTarget); setMenuAnchor(null); }}>
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />Edit sale
        </MenuItem>
        <MenuItem onClick={() => { onDeleteSale(menuTarget); setMenuAnchor(null); }} sx={{ color: '#b91c1c' }}>
          <DeleteOutlinedIcon fontSize="small" sx={{ mr: 1 }} />Delete sale
        </MenuItem>
      </Menu>
    </Box>
  );
}

function SaleDialog({ trip, target, onClose, onSaved }) {
  const editing = Boolean(target);
  const loadedProducts = useMemo(() => trip.items || [], [trip.items]);
  const priceByName = useMemo(() => {
    const m = new Map();
    loadedProducts.forEach((it) => m.set(it.name, it.price || 0));
    return m;
  }, [loadedProducts]);

  // For each loaded product, compute how many units are still available to sell:
  // loaded - sold (excluding the sale being edited so its current qty is freed back).
  const remainingByName = useMemo(() => {
    const sold = new Map();
    (trip.sales || []).forEach((s) => {
      if (target && s.id === target.id) return; // exclude the sale being edited
      (s.items || []).forEach((it) => {
        sold.set(it.name, (sold.get(it.name) || 0) + Number(it.qty || 0));
      });
    });
    const m = new Map();
    loadedProducts.forEach((it) => {
      const remaining = Math.max(0, Number(it.qty || 0) - (sold.get(it.name) || 0));
      m.set(it.name, remaining);
    });
    return m;
  }, [loadedProducts, trip.sales, target]);

  const [name, setName] = useState(target?.customer?.name || '');
  const [phone, setPhone] = useState(target?.customer?.phone || '');
  const [address, setAddress] = useState(target?.customer?.address || '');
  const [date, setDate] = useState(toLocalDateTimeInput(target?.date));
  const [note, setNote] = useState(target?.note || '');
  const [items, setItems] = useState(
    target?.items?.length
      ? target.items.map((i) => ({ ...i }))
      : loadedProducts.length > 0
        ? [{ name: loadedProducts[0].name, qty: 1, price: loadedProducts[0].price || 0 }]
        : [{ name: '', qty: 1, price: 0 }],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateItem = (i, key, val) => setItems((prev) => prev.map((it, idx) => {
    if (idx !== i) return it;
    const next = { ...it, [key]: val };
    if (key === 'name' && priceByName.has(val) && (!it.price || Number(it.price) === 0)) {
      next.price = priceByName.get(val);
    }
    return next;
  }));
  const addItem = () => {
    const first = loadedProducts[0];
    setItems((prev) => [...prev, first ? { name: first.name, qty: 1, price: first.price || 0 } : { name: '', qty: 1, price: 0 }]);
  };
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const totalUnits = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);

  // Per-line validation messages, taking into account other lines that share the same product
  const lineErrors = items.map((it, idx) => {
    if (!it.name) return '';
    if (!remainingByName.has(it.name)) return 'Not loaded on this trip';
    const remaining = remainingByName.get(it.name) || 0;
    // Sum qty of OTHER lines for the same product
    const otherQty = items.reduce((s, x, i) => i !== idx && x.name === it.name ? s + (Number(x.qty) || 0) : s, 0);
    if ((Number(it.qty) || 0) + otherQty > remaining) return `Only ${Math.max(0, remaining - otherQty)} left on vehicle`;
    return '';
  });

  const submit = async () => {
    setError('');
    if (!name.trim()) { setError('Customer name is required'); return; }
    const cleanItems = items.filter((it) => it.name && Number(it.qty) > 0);
    if (cleanItems.length === 0) { setError('Add at least one product with quantity'); return; }

    // Aggregate qty per product and validate against remaining stock
    const totals = new Map();
    for (const it of cleanItems) {
      totals.set(it.name, (totals.get(it.name) || 0) + Number(it.qty));
    }
    for (const [pname, qty] of totals) {
      if (!remainingByName.has(pname)) { setError(`"${pname}" was not loaded on this trip.`); return; }
      const remaining = remainingByName.get(pname) || 0;
      if (qty > remaining) { setError(`Cannot sell ${qty} of "${pname}" — only ${remaining} left on the vehicle.`); return; }
    }

    setSubmitting(true);
    try {
      const payload = {
        customer: { name: name.trim(), phone: phone.trim(), address: address.trim() },
        date: date ? new Date(date).toISOString() : undefined,
        note: note.trim(),
        items: cleanItems,
      };
      const updated = editing
        ? await updateTripSale(trip.id, target.id, payload)
        : await addTripSale(trip.id, payload);
      onSaved(updated);
    } catch (e) { setError(e.message || 'Failed to save sale'); }
    finally { setSubmitting(false); }
  };

  const fullScreen = useFullScreenDialog();
  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {editing ? 'Edit sale' : 'Add sell'} — {trip.tripNumber}
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>Customer details</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Customer / Shop name" value={name} onChange={(e) => setName(e.target.value)} fullWidth autoFocus />
            <TextField label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
          </Stack>
          <TextField label="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth />
          <TextField label="Sold at" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />

          <Divider />

          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700 }}>Products bought</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addItem} sx={{ textTransform: 'none' }}>Add product</Button>
          </Stack>
          <Stack spacing={1.2}>
            {items.map((it, i) => {
              const remaining = it.name ? remainingByName.get(it.name) : null;
              const lineErr = lineErrors[i];
              return (
                <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ alignItems: { sm: 'flex-start' } }}>
                  <TextField
                    select
                    label="Product"
                    value={it.name}
                    onChange={(e) => updateItem(i, 'name', e.target.value)}
                    sx={{ flex: 2 }}
                    error={!!lineErr && lineErr.includes('Not loaded')}
                    helperText={loadedProducts.length === 0 ? 'No products loaded on this trip' : ' '}
                  >
                    {loadedProducts.map((p) => {
                      const left = remainingByName.get(p.name) || 0;
                      return (
                        <MenuItem key={p.name} value={p.name} disabled={left <= 0 && p.name !== it.name}>
                          {p.name} — {left} left
                        </MenuItem>
                      );
                    })}
                  </TextField>
                  <TextField
                    label="Qty"
                    type="number"
                    value={it.qty}
                    onChange={(e) => updateItem(i, 'qty', e.target.value)}
                    slotProps={{ htmlInput: { min: 0, max: remaining != null ? remaining : undefined } }}
                    error={!!lineErr && lineErr.includes('left')}
                    helperText={lineErr || (remaining != null ? `Available: ${remaining}` : ' ')}
                    sx={{ flex: 1 }}
                  />
                  <IconButton onClick={() => removeItem(i)} disabled={items.length === 1} size="small" sx={{ mt: { sm: 1 } }}>
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>
          <Stack direction="row" sx={{ justifyContent: 'flex-end', gap: 3 }}>
            <Typography sx={{ fontSize: 13, color: '#6b7280' }}>Units: <strong style={{ color: '#111827' }}>{totalUnits}</strong></Typography>
          </Stack>

          <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} multiline minRows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={submit} disabled={submitting} variant="contained" sx={{ bgcolor: ACCENT, textTransform: 'none', '&:hover': { bgcolor: '#15803d' } }}>
          {submitting ? 'Saving…' : editing ? 'Save changes' : 'Save sell'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteSaleDialog({ trip, sale, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setSubmitting(true); setError('');
    try {
      const updated = await deleteTripSale(trip.id, sale.id);
      onDeleted(updated);
    } catch (e) { setError(e.message || 'Failed to delete'); }
    finally { setSubmitting(false); }
  };
  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Delete sale?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2">
          Remove this sale to <strong>{sale.customer?.name}</strong>? This cannot be undone.
        </Typography>
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

function ReturnRequestDialog({ trip, onClose, onSubmitted }) {
  const sales = useMemo(() => trip.sales || [], [trip.sales]);
  const initialItems = useMemo(() => {
    const sold = new Map();
    sales.forEach((s) => (s.items || []).forEach((it) => {
      sold.set(it.name, (sold.get(it.name) || 0) + (Number(it.qty) || 0));
    }));
    const auto = (trip.items || []).map((it) => ({
      name: it.name,
      qty: Math.max(0, (it.qty || 0) - (sold.get(it.name) || 0)),
    }));
    return auto.length > 0 ? auto : [{ name: '', qty: 0 }];
  }, [trip.items, sales]);

  const [items, setItems] = useState(initialItems);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateItem = (i, key, val) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [key]: val } : it));
  const addRow = () => setItems((prev) => [...prev, { name: '', qty: 0 }]);
  const removeRow = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const totalUnits = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);

  const submit = async () => {
    setError('');
    const clean = items.filter((it) => it.name && Number(it.qty) > 0).map((it) => ({ name: it.name, qty: Number(it.qty) }));
    if (clean.length === 0) { setError('Add at least one product to return'); return; }
    setSubmitting(true);
    try {
      const updated = await submitTripReturn(trip.id, clean, note.trim());
      onSubmitted(updated);
    } catch (e) { setError(e.message || 'Failed to submit return request'); }
    finally { setSubmitting(false); }
  };

  const fullScreen = useFullScreenDialog();
  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ fontWeight: 700 }}>Send return request — {trip.tripNumber}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2" sx={{ mb: 2, color: '#6b7280' }}>
          List the items you want to return to the warehouse. Admin will review and approve.
        </Typography>
        <Stack spacing={1.2}>
          {items.map((it, i) => (
            <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ alignItems: { sm: 'center' } }}>
              <TextField
                select={(trip.items || []).length > 0}
                label="Product"
                value={it.name}
                onChange={(e) => updateItem(i, 'name', e.target.value)}
                sx={{ flex: 2 }}
              >
                {(trip.items || []).map((p) => (
                  <MenuItem key={p.name} value={p.name}>{p.name}</MenuItem>
                ))}
              </TextField>
              <TextField label="Qty" type="number" value={it.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} slotProps={{ htmlInput: { min: 0 } }} sx={{ flex: 1 }} />
              <IconButton onClick={() => removeRow(i)} disabled={items.length === 1} size="small">
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Stack>
          ))}
        </Stack>
        <Button size="small" startIcon={<AddIcon />} onClick={addRow} sx={{ textTransform: 'none', mt: 1 }}>Add product</Button>

        <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 1 }}>
          <Typography sx={{ fontSize: 13, color: '#6b7280' }}>Total to return: <strong style={{ color: '#111827' }}>{totalUnits}u</strong></Typography>
        </Stack>

        <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} multiline minRows={2} fullWidth sx={{ mt: 2 }} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={submit} disabled={submitting} variant="contained" sx={{ bgcolor: '#b45309', textTransform: 'none', '&:hover': { bgcolor: '#92400e' } }}>
          {submitting ? 'Sending…' : 'Send to admin'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
