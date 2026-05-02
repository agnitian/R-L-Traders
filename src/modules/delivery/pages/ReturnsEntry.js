import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, TextField, Button, Chip, Alert, CircularProgress, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Avatar, Divider, InputAdornment,
} from '@mui/material';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { PageHeader, StatsRow, useFullScreenDialog } from '../../../components/page/PagePrimitives';
import { listTrips, submitTripReturn } from '../../../api/trips';

const ACCENT = '#ea580c';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

const RETURN_STATUS = {
  none: { label: 'No return', bg: '#f3f4f6', color: '#6b7280', Icon: KeyboardReturnOutlinedIcon },
  pending: { label: 'Pending approval', bg: '#fef3c7', color: '#a16207', Icon: HourglassEmptyIcon },
  approved: { label: 'Approved', bg: '#dcfce7', color: '#15803d', Icon: CheckCircleOutlineIcon },
  rejected: { label: 'Rejected', bg: '#fee2e2', color: '#b91c1c', Icon: CancelOutlinedIcon },
};

export default function ReturnsEntry() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [openTrip, setOpenTrip] = useState(null);
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

  const stats = useMemo(() => {
    let none = 0, pending = 0, approved = 0, rejected = 0;
    trips.forEach((t) => {
      const s = t.returnRequest?.status || 'none';
      if (s === 'pending') pending += 1;
      else if (s === 'approved') approved += 1;
      else if (s === 'rejected') rejected += 1;
      else none += 1;
    });
    return { none, pending, approved, rejected };
  }, [trips]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return trips;
    return trips.filter((t) =>
      `${t.tripNumber} ${t.store?.name || ''} ${t.vehicle?.plate || ''}`.toLowerCase().includes(q),
    );
  }, [trips, query]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Returns Entry"
        subtitle="After each trip, submit unsold/damaged stock counts for admin to confirm receipt."
      />

      <StatsRow
        cols={4}
        items={[
          { label: 'No Return', value: stats.none },
          { label: 'Pending Approval', value: stats.pending, valueColor: '#a16207' },
          { label: 'Approved', value: stats.approved, valueColor: '#15803d' },
          { label: 'Rejected', value: stats.rejected, valueColor: '#b91c1c' },
        ]}
      />

      <TextField
        placeholder="Search trip ID / customer / vehicle..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 2, bgcolor: '#fff', borderRadius: 2 }}
        slotProps={{ input: {
          startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20, color: '#9ca3af' }} /></InputAdornment>,
          endAdornment: query ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setQuery('')}><ClearIcon fontSize="small" /></IconButton>
            </InputAdornment>
          ) : null,
        } }}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2 }}>
          <Typography sx={{ color: '#6b7280' }}>No trips to show.</Typography>
        </Box>
      ) : (
        <Stack sx={{ gap: 1.4 }}>
          {filtered.map((t) => {
            const status = t.returnRequest?.status || 'none';
            const meta = RETURN_STATUS[status];
            const Icon = meta.Icon;
            const totalReturned = (t.returnRequest?.items || []).reduce((s, it) => s + (it.qty || 0), 0);
            return (
              <Stack
                key={t.id}
                direction="row"
                onClick={() => setOpenTrip(t)}
                sx={{ alignItems: 'center', gap: 1.5, p: 2, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5, cursor: 'pointer', '&:hover': { borderColor: ACCENT, bgcolor: '#fff7ed' }, flexWrap: 'wrap' }}
              >
                <Avatar variant="rounded" sx={{ bgcolor: '#ffedd5', color: '#c2410c' }}>
                  <LocalShippingOutlinedIcon />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Stack direction="row" sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{t.tripNumber}</Typography>
                    {t.vehicle?.plate && (
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>• {t.vehicle.plate}</Typography>
                    )}
                  </Stack>
                  <Typography sx={{ fontSize: 12, color: '#374151', fontWeight: 600, mt: 0.2 }}>{t.store?.name}</Typography>
                  <Stack direction="row" sx={{ gap: 1.5, mt: 0.4, flexWrap: 'wrap' }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.4 }}>
                      <EventOutlinedIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                      <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{fmtDate(t.date)}</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                      Sold: {t.totalUnits || 0}u
                    </Typography>
                    {totalReturned > 0 && (
                      <Typography sx={{ fontSize: 12, color: '#c2410c', fontWeight: 700 }}>
                        Return: {totalReturned}u
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <Chip
                  size="small"
                  icon={<Icon sx={{ fontSize: 14 }} />}
                  label={meta.label}
                  sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: 11, height: 24 }}
                />
              </Stack>
            );
          })}
        </Stack>
      )}

      {openTrip && (
        <ReturnDialog
          trip={openTrip}
          onClose={() => setOpenTrip(null)}
          onSubmitted={(t) => {
            setTrips((prev) => prev.map((x) => x.id === t.id ? t : x));
            setToast(`Return submitted for ${t.tripNumber} — pending admin approval`);
            setOpenTrip(null);
          }}
        />
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

function ReturnDialog({ trip, onClose, onSubmitted }) {
  const status = trip.returnRequest?.status || 'none';
  const isLocked = status === 'pending' || status === 'approved';
  const existingByName = useMemo(() => {
    const m = new Map();
    (trip.returnRequest?.items || []).forEach((it) => m.set(it.name, it.qty));
    return m;
  }, [trip]);

  const [items, setItems] = useState(() =>
    (trip.items || []).map((it) => ({
      name: it.name,
      sold: it.qty,
      qty: existingByName.get(it.name) ?? 0,
    })),
  );
  const [note, setNote] = useState(trip.returnRequest?.note || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateQty = (i, val) => setItems((prev) => prev.map((it, idx) => {
    if (idx !== i) return it;
    const n = Math.max(0, Math.min(it.sold, Number(val) || 0));
    return { ...it, qty: n };
  }));

  const totalReturn = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);

  const submit = async () => {
    setError('');
    const cleanItems = items
      .filter((it) => Number(it.qty) > 0)
      .map((it) => ({ name: it.name, qty: Number(it.qty) }));
    if (cleanItems.length === 0) { setError('Enter at least one return quantity'); return; }
    setSubmitting(true);
    try {
      const updated = await submitTripReturn(trip.id, cleanItems, note.trim());
      onSubmitted(updated);
    } catch (e) { setError(e.message || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const meta = RETURN_STATUS[status];

  const fullScreen = useFullScreenDialog();
  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Return for {trip.tripNumber}
        <Chip size="small" label={meta.label} sx={{ ml: 1.5, bgcolor: meta.bg, color: meta.color, fontWeight: 700 }} />
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 2 }}>
          <Typography sx={{ fontSize: 12, color: '#9a3412' }}>
            <strong>Customer:</strong> {trip.store?.name} • <strong>Date:</strong> {fmtDate(trip.date)}
            {trip.vehicle?.plate ? ` • Vehicle: ${trip.vehicle.plate}` : ''}
          </Typography>
        </Box>

        {isLocked && (
          <Alert severity={status === 'approved' ? 'success' : 'info'} sx={{ mb: 2 }}>
            {status === 'pending'
              ? 'Return submitted — waiting for admin to confirm receipt.'
              : 'Admin confirmed receipt of these returned units.'}
            {trip.returnRequest?.reviewNote ? ` Note: ${trip.returnRequest.reviewNote}` : ''}
          </Alert>
        )}
        {status === 'rejected' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Admin rejected this return. {trip.returnRequest?.reviewNote ? `Note: ${trip.returnRequest.reviewNote}` : 'You can resubmit corrected counts.'}
          </Alert>
        )}

        <Typography sx={{ fontWeight: 700, mb: 1 }}>Returned units (per product)</Typography>
        <Stack spacing={1.2}>
          {items.length === 0 && <Typography sx={{ fontSize: 13, color: '#6b7280' }}>No products on this trip.</Typography>}
          {items.map((it, i) => (
            <Stack key={i} direction="row" sx={{ gap: 1.2, alignItems: 'center' }}>
              <Box sx={{ flex: 2 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{it.name}</Typography>
                <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Sold: {it.sold}</Typography>
              </Box>
              <TextField
                label="Return qty"
                type="number"
                size="small"
                value={it.qty}
                onChange={(e) => updateQty(i, e.target.value)}
                disabled={isLocked}
                slotProps={{ htmlInput: { min: 0, max: it.sold } }}
                sx={{ flex: 1, maxWidth: 140 }}
              />
            </Stack>
          ))}
        </Stack>

        <Divider sx={{ my: 2 }} />
        <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: 13, color: '#6b7280' }}>Total return</Typography>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: ACCENT }}>{totalReturn} units</Typography>
        </Stack>

        <TextField
          label="Reason / note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isLocked}
          multiline
          minRows={2}
          fullWidth
          placeholder="e.g. unsold at route end, damaged crate..."
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Close</Button>
        {!isLocked && (
          <Button
            onClick={submit}
            disabled={submitting || totalReturn <= 0}
            variant="contained"
            sx={{ bgcolor: ACCENT, textTransform: 'none', '&:hover': { bgcolor: '#c2410c' } }}
          >
            {submitting ? 'Submitting…' : status === 'rejected' ? 'Resubmit' : 'Submit for approval'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
