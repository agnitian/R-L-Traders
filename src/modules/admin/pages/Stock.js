import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Chip, Avatar, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert, CircularProgress,
  Snackbar, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { PageHeader, StatsRow, FilterBar, useFullScreenDialog } from '../../../components/page/PagePrimitives';
import {
  listIntakes, createIntake, verifyIntake, rejectIntake,
} from '../../../api/intakes';
import { listProducts } from '../../../api/products';
import { localDateTimeNow } from '../../../utils/datetime';

const ACCENT = '#e11d48';

const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

const STATUS_META = {
  pending: { label: 'Pending', bg: '#ffedd5', color: '#c2410c' },
  verified: { label: 'Verified', bg: '#dcfce7', color: '#15803d' },
  rejected: { label: 'Rejected', bg: '#fee2e2', color: '#dc2626' },
};

export default function StockPage() {
  const [intakes, setIntakes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const [i, p] = await Promise.all([listIntakes(), listProducts()]);
      setIntakes(i);
      setProducts(p);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const stats = useMemo(() => ({
    total: intakes.length,
    pending: intakes.filter((i) => i.status === 'pending').length,
    verified: intakes.filter((i) => i.status === 'verified').length,
    rejected: intakes.filter((i) => i.status === 'rejected').length,
  }), [intakes]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return intakes.filter((i) => {
      const f = filter === 'all' || i.status === filter;
      const s = !q || `${i.intakeNumber} ${i.receivedByName} ${i.notes}`.toLowerCase().includes(q);
      return f && s;
    });
  }, [intakes, filter, search]);

  // Pending first
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.receivedAt) - new Date(a.receivedAt);
    });
  }, [filtered]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Stock"
        subtitle="Incoming product entries and verification"
        action={
          <Button
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ bgcolor: '#16a34a', color: '#fff', textTransform: 'none', fontWeight: 600, px: 2, py: 1, borderRadius: 2, '&:hover': { bgcolor: '#15803d' } }}
          >
            Add Stock
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <StatsRow
        cols={4}
        items={[
          { label: 'Total Entries', value: stats.total },
          { label: 'Pending', value: stats.pending, valueColor: '#a16207' },
          { label: 'Verified', value: stats.verified, valueColor: '#16a34a' },
          { label: 'Rejected', value: stats.rejected, valueColor: '#dc2626' },
        ]}
      />

      {stats.pending > 0 && (
        <Box sx={{ p: 2, mb: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 2.5 }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <VerifiedOutlinedIcon sx={{ color: '#a16207' }} />
            <Typography sx={{ fontWeight: 700, color: '#92400e' }}>
              {stats.pending} entry/entries awaiting your verification
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: 12.5, color: '#92400e', mt: 0.5 }}>
            Counter staff added these — review the items and verify, or reject (which reverses stock).
          </Typography>
        </Box>
      )}

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by entry #, staff or notes…"
        accent={ACCENT}
        activeFilter={filter}
        onFilterChange={setFilter}
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'Verified', value: 'verified' },
          { label: 'Rejected', value: 'rejected' },
        ]}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: ACCENT }} /></Box>
      ) : sorted.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', color: '#6b7280', bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5 }}>
          {intakes.length === 0
            ? 'No stock entries yet — click "Add Stock" to record a factory delivery.'
            : 'No entries match your filters.'}
        </Box>
      ) : (
        <Stack spacing={1.4}>
          {sorted.map((i) => {
            const s = STATUS_META[i.status] || STATUS_META.pending;
            const isPending = i.status === 'pending';
            return (
              <Box
                key={i.id}
                sx={{
                  p: 2, bgcolor: '#fff',
                  border: isPending ? '1.5px solid #fde68a' : '1px solid #e5e7eb',
                  borderRadius: 2.5,
                  boxShadow: isPending ? '0 0 0 3px #fef3c7' : 'none',
                }}
              >
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Avatar variant="rounded" sx={{ bgcolor: '#f0fdf4', color: '#15803d' }}><LocalShippingOutlinedIcon /></Avatar>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}>{i.intakeNumber}</Typography>
                      <Chip size="small" label={s.label} sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 11, height: 22 }} />
                    </Stack>
                    <Typography sx={{ fontSize: 12.5, color: '#6b7280' }}>
                      {fmtDateTime(i.receivedAt)} • added by {i.receivedByName || '—'} ({i.receivedByRole || '—'})
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 90, textAlign: 'right' }}>
                    <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Items</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{(i.items || []).length}</Typography>
                  </Box>
                  <Box sx={{ minWidth: 90, textAlign: 'right' }}>
                    <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Total Units</Typography>
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{i.totalUnits}</Typography>
                  </Box>
                </Stack>

                {i.verifiedByName && (
                  <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #e5e7eb' }}>
                    <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
                      {i.status === 'verified' ? '✓ Verified' : i.status === 'rejected' ? '✗ Rejected' : ''} by{' '}
                      <strong>{i.verifiedByName}</strong> ({i.verifiedByRole}) • {fmtDateTime(i.verifiedAt)}
                    </Typography>
                  </Box>
                )}

                <Stack direction="row" sx={{ gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                  <Button size="small" onClick={() => setViewTarget(i)} sx={{ textTransform: 'none' }}>View Items</Button>
                  {isPending && (
                    <>
                      <Button
                        size="small" startIcon={<VerifiedOutlinedIcon />}
                        onClick={async () => {
                          try { await verifyIntake(i.id); setToast('Verified'); reload(); }
                          catch (e) { setError(e.message || 'Failed'); }
                        }}
                        sx={{ textTransform: 'none', bgcolor: '#dcfce7', color: '#15803d', fontWeight: 600, '&:hover': { bgcolor: '#bbf7d0' } }}
                      >Verify</Button>
                      <Button
                        size="small" startIcon={<CancelOutlinedIcon />}
                        onClick={() => setRejectTarget(i)}
                        sx={{ textTransform: 'none', bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 600, '&:hover': { bgcolor: '#fecaca' } }}
                      >Reject</Button>
                    </>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}

      <IntakeDialog
        open={createOpen}
        products={products}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (payload) => {
          await createIntake(payload);
          setCreateOpen(false);
          setToast('Stock recorded');
          reload();
        }}
      />

      <ItemsDialog open={!!viewTarget} intake={viewTarget} onClose={() => setViewTarget(null)} />

      <RejectDialog
        intake={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onSubmit={async (reason) => {
          try {
            await rejectIntake(rejectTarget.id, reason);
            setRejectTarget(null);
            setToast('Rejected — stock reversed');
            reload();
          } catch (e) { setError(e.message || 'Failed'); }
        }}
      />

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}

function IntakeDialog({ open, products, onClose, onSubmit }) {
  const [form, setForm] = useState({ items: [], notes: '', receivedAt: '' });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setForm({
        receivedAt: localDateTimeNow(),
        items: [{ product: '', quantity: '' }],
        notes: '',
      });
      setErr('');
    }
  }, [open]);

  const setItem = (idx, k, v) => setForm((f) => {
    const items = [...f.items];
    items[idx] = { ...items[idx], [k]: v };
    return { ...f, items };
  });
  const addItem = () => setForm((f) => ({ ...f, items: [...f.items, { product: '', quantity: '' }] }));
  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const submit = async () => {
    const items = form.items
      .map((it) => ({ product: it.product, quantity: Number(it.quantity) }))
      .filter((it) => it.product && it.quantity > 0);
    if (items.length === 0) { setErr('Add at least one item with quantity'); return; }
    setSubmitting(true);
    try {
      await onSubmit({
        receivedAt: form.receivedAt,
        items,
        notes: form.notes,
      });
    } catch (e) {
      setErr(e.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const totalUnits = form.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);

  const fullScreen = useFullScreenDialog();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle>Add Stock</DialogTitle>
      <DialogContent>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Received at" type="datetime-local" size="small" fullWidth
            value={form.receivedAt || ''} onChange={(e) => setForm((f) => ({ ...f, receivedAt: e.target.value }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <Divider />
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700 }}>Items</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addItem} sx={{ textTransform: 'none' }}>Add Item</Button>
          </Stack>

          {form.items.map((it, idx) => (
            <Stack key={idx} direction="row" spacing={1.2} sx={{ alignItems: 'center' }}>
              <TextField select label="Product" size="small" value={it.product} onChange={(e) => setItem(idx, 'product', e.target.value)} sx={{ flex: 2 }}>
                <MenuItem value="">— Select —</MenuItem>
                {products.filter((p) => p.active).map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name} ({p.sku})</MenuItem>
                ))}
              </TextField>
              <TextField label="Units" type="number" size="small" value={it.quantity} onChange={(e) => setItem(idx, 'quantity', e.target.value)} sx={{ flex: 1 }} />
              <IconButton size="small" onClick={() => removeItem(idx)} disabled={form.items.length === 1}>
                <DeleteOutlinedIcon sx={{ fontSize: 18, color: '#dc2626' }} />
              </IconButton>
            </Stack>
          ))}

          <Box sx={{ p: 1.5, bgcolor: '#f9fafb', borderRadius: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Total: {totalUnits} units</Typography>
          </Box>

          <TextField
            label="Notes (optional)" size="small" fullWidth
            value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            multiline rows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={submitting} sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}>
          {submitting ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ItemsDialog({ open, intake, onClose }) {
  if (!intake) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{intake.intakeNumber} — Items</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: 12.5, color: '#6b7280', mb: 1 }}>{fmtDateTime(intake.receivedAt)}</Typography>
        <Stack divider={<Divider />} spacing={1}>
          {(intake.items || []).map((it) => (
            <Stack key={it.id} direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{it.productName}</Typography>
                <Typography sx={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{it.sku}</Typography>
              </Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{it.quantity} units</Typography>
            </Stack>
          ))}
        </Stack>
        {intake.notes && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f9fafb', borderRadius: 2 }}>
            <Typography sx={{ fontSize: 12.5, whiteSpace: 'pre-wrap' }}>{intake.notes}</Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function RejectDialog({ intake, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { setReason(''); }, [intake]);
  if (!intake) return null;
  return (
    <Dialog open={!!intake} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Reject entry?</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>This will reverse stock for all {intake.totalUnits} unit(s) in <strong>{intake.intakeNumber}</strong>.</Typography>
        <TextField label="Reason" size="small" fullWidth multiline rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained" color="error" disabled={submitting}
          onClick={async () => { setSubmitting(true); try { await onSubmit(reason); } finally { setSubmitting(false); } }}
        >
          {submitting ? <CircularProgress size={20} /> : 'Reject & Reverse'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
