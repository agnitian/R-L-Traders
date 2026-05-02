import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Chip, Alert, CircularProgress, Snackbar, Divider, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { PageHeader, StatsRow, FilterBar } from '../../../components/page/PagePrimitives';
import { listStockAdjustments, createStockAdjustment, deleteStockAdjustment } from '../../../api/stockAdjustments';
import { listProducts } from '../../../api/products';

const ACCENT = '#7c3aed';
const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

const STATUS_META = {
  pending: { color: '#b45309', bg: '#fef3c7', label: 'Pending', Icon: HourglassEmptyIcon },
  approved: { color: '#15803d', bg: '#dcfce7', label: 'Approved', Icon: CheckCircleOutlinedIcon },
  rejected: { color: '#b91c1c', bg: '#fee2e2', label: 'Rejected', Icon: CancelOutlinedIcon },
};

export default function StockAdjustment() {
  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState('');

  const reload = async () => {
    setLoading(true); setError('');
    try {
      const [a, p] = await Promise.all([listStockAdjustments(), listProducts()]);
      setAdjustments(a); setProducts(p);
    } catch (e) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const stats = useMemo(() => ({
    pending: adjustments.filter((a) => a.status === 'pending').length,
    approved: adjustments.filter((a) => a.status === 'approved').length,
    rejected: adjustments.filter((a) => a.status === 'rejected').length,
    total: adjustments.length,
  }), [adjustments]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return adjustments.filter((a) => {
      if (filter !== 'all' && a.status !== filter) return false;
      if (!q) return true;
      return `${a.reason || ''} ${(a.items || []).map((i) => i.name).join(' ')}`.toLowerCase().includes(q);
    });
  }, [adjustments, search, filter]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Stock Adjustment"
        subtitle="Submit a bulk stock correction (e.g. missed entries). Requires admin approval."
        action={
          <Button
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ bgcolor: ACCENT, color: '#fff', textTransform: 'none', fontWeight: 600, px: 2, py: 1, borderRadius: 2, '&:hover': { bgcolor: '#6d28d9' } }}
          >
            New Request
          </Button>
        }
      />

      <StatsRow
        cols={4}
        items={[
          { label: 'Total Requests', value: stats.total },
          { label: 'Pending', value: stats.pending, valueColor: '#b45309' },
          { label: 'Approved', value: stats.approved, valueColor: '#15803d' },
          { label: 'Rejected', value: stats.rejected, valueColor: '#b91c1c' },
        ]}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by product or reason..."
        accent={ACCENT}
        activeFilter={filter}
        onFilterChange={setFilter}
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2 }}>
          <Typography sx={{ color: '#6b7280' }}>No adjustment requests yet.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.2}>
          {filtered.map((a) => {
            const meta = STATUS_META[a.status] || STATUS_META.pending;
            const Icon = meta.Icon;
            return (
              <Box key={a.id} sx={{ p: 2, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5 }}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    icon={<Icon sx={{ fontSize: 16 }} />}
                    label={meta.label}
                    sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700 }}
                  />
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                    {a.reason || '—'}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{fmt(a.requestedAt || a.createdAt)}</Typography>
                  {a.status === 'pending' && (
                    <IconButton size="small" onClick={() => setDeleteTarget(a)} sx={{ color: '#b91c1c' }}>
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
                <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
                  {(a.items || []).map((it, i) => (
                    <Chip
                      key={i}
                      size="small"
                      label={`${it.type === 'add' ? '+' : '−'} ${it.name} × ${it.qty}`}
                      sx={{
                        bgcolor: it.type === 'add' ? '#dbeafe' : '#fee2e2',
                        color: it.type === 'add' ? '#1d4ed8' : '#b91c1c',
                        fontSize: 11.5,
                        fontWeight: 600,
                      }}
                    />
                  ))}
                </Stack>
                {a.reviewNote && (
                  <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.8, fontStyle: 'italic' }}>
                    Admin: {a.reviewNote}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      )}

      {createOpen && (
        <CreateDialog
          products={products}
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setToast('Submitted for approval'); setCreateOpen(false); reload(); }}
        />
      )}
      {deleteTarget && (
        <DeleteDialog
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setToast('Request withdrawn'); setDeleteTarget(null); reload(); }}
        />
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={2400} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

function CreateDialog({ products, onClose, onSaved }) {
  const [items, setItems] = useState([{ name: '', qty: 1, type: 'sell' }]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const setItem = (i, key, val) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [key]: val } : it));
  const addRow = () => setItems((prev) => [...prev, { name: '', qty: 1, type: 'sell' }]);
  const removeRow = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    setError('');
    const clean = items.filter((it) => it.name && Number(it.qty) > 0);
    if (clean.length === 0) { setError('Add at least one item'); return; }
    if (!reason.trim()) { setError('Reason is required'); return; }
    setSubmitting(true);
    try {
      await createStockAdjustment({ items: clean, reason: reason.trim() });
      onSaved();
    } catch (e) { setError(e.message || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>New stock adjustment request</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Alert severity="info" sx={{ mb: 2 }}>
          Use this when day-end stock counts don't match — admin must approve before stock changes.
        </Alert>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700 }}>Items</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addRow} sx={{ textTransform: 'none' }}>Add row</Button>
          </Stack>
          <Stack spacing={1.2}>
            {items.map((it, i) => (
              <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ alignItems: { sm: 'center' } }}>
                <TextField
                  select label="Product" value={it.name}
                  onChange={(e) => setItem(i, 'name', e.target.value)}
                  sx={{ flex: 2 }}
                >
                  <MenuItem value="">— Select —</MenuItem>
                  {products.map((p) => (
                    <MenuItem key={p.id} value={p.name}>{p.name} ({p.stock}u)</MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Qty" type="number" value={it.qty}
                  onChange={(e) => setItem(i, 'qty', e.target.value)}
                  slotProps={{ htmlInput: { min: 1 } }} sx={{ flex: 1 }}
                />
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={it.type}
                  onChange={(_, v) => v && setItem(i, 'type', v)}
                >
                  <ToggleButton value="sell" sx={{ textTransform: 'none' }}>Sell (−)</ToggleButton>
                  <ToggleButton value="add" sx={{ textTransform: 'none' }}>Add (+)</ToggleButton>
                </ToggleButtonGroup>
                <IconButton onClick={() => removeRow(i)} disabled={items.length === 1} size="small">
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
          <Divider />
          <TextField
            label="Reason / explanation"
            placeholder="e.g. End-of-day count missed entries"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            multiline minRows={2} fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={submit} disabled={submitting} variant="contained" sx={{ bgcolor: ACCENT, textTransform: 'none', '&:hover': { bgcolor: '#6d28d9' } }}>
          {submitting ? 'Submitting…' : 'Submit for approval'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteDialog({ target, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setSubmitting(true); setError('');
    try { await deleteStockAdjustment(target.id); onDeleted(); }
    catch (e) { setError(e.message || 'Failed'); }
    finally { setSubmitting(false); }
  };
  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Withdraw this request?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2">This will remove your pending adjustment request.</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={submit} disabled={submitting} variant="contained" color="error" sx={{ textTransform: 'none' }}>
          {submitting ? 'Removing…' : 'Withdraw'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
