import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Button, Chip, Alert, CircularProgress, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, IconButton, Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { PageHeader, StatsRow, FilterBar } from '../../../components/page/PagePrimitives';
import { listProducts } from '../../../api/products';
import { listStockAdjustments, createStockAdjustment } from '../../../api/stockAdjustments';

const ACCENT = '#7c3aed';

export default function StockInventory() {
  const [products, setProducts] = useState([]);
  const [pendingAdds, setPendingAdds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [requestOpen, setRequestOpen] = useState(false);
  const [toast, setToast] = useState('');

  const reload = async () => {
    setLoading(true); setError('');
    try {
      const [p, adj] = await Promise.all([listProducts(), listStockAdjustments('pending')]);
      setProducts(p);
      setPendingAdds(adj.filter((a) => (a.items || []).some((i) => i.type === 'add')));
    } catch (e) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  // Pending units per product (lowercased)
  const pendingByProduct = useMemo(() => {
    const map = new Map();
    pendingAdds.forEach((a) => {
      (a.items || []).forEach((it) => {
        if (it.type !== 'add') return;
        const key = String(it.name || '').toLowerCase();
        map.set(key, (map.get(key) || 0) + Number(it.qty || 0));
      });
    });
    return map;
  }, [pendingAdds]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const stock = Number(p.stock || 0);
      const min = Number(p.minStock || 0);
      const isLow = min > 0 && stock < min;
      if (filter === 'low' && !isLow) return false;
      if (filter === 'normal' && isLow) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, search, filter]);

  const stats = useMemo(() => {
    const total = products.length;
    const totalUnits = products.reduce((a, p) => a + Number(p.stock || 0), 0);
    const low = products.filter((p) => Number(p.minStock || 0) > 0 && Number(p.stock || 0) < Number(p.minStock)).length;
    return { total, totalUnits, low, healthy: total - low };
  }, [products]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Stock Inventory"
        subtitle="Live stock levels. Add stock with admin approval."
        action={
          <Button
            startIcon={<AddIcon />}
            onClick={() => setRequestOpen(true)}
            sx={{ bgcolor: ACCENT, color: '#fff', textTransform: 'none', fontWeight: 600, px: 2, py: 1, borderRadius: 2, '&:hover': { bgcolor: '#6d28d9' } }}
          >
            Request Stock Add
          </Button>
        }
      />

      <StatsRow
        cols={4}
        items={[
          { label: 'Total SKUs', value: stats.total },
          { label: 'Total Units', value: stats.totalUnits.toLocaleString(), valueColor: '#16a34a' },
          { label: 'Low Stock', value: stats.low, valueColor: '#dc2626' },
          { label: 'Healthy', value: stats.healthy, valueColor: '#2563eb' },
        ]}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search product..."
        accent={ACCENT}
        activeFilter={filter}
        onFilterChange={setFilter}
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Low', value: 'low' },
          { label: 'Healthy', value: 'normal' },
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2 }}>
          <Typography sx={{ color: '#6b7280' }}>No products found.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.2}>
          {filtered.map((p) => {
            const stock = Number(p.stock || 0);
            const min = Number(p.minStock || 0);
            const isLow = min > 0 && stock < min;
            const pending = pendingByProduct.get(p.name.toLowerCase()) || 0;
            return (
              <Box key={p.id} sx={{ p: 2, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5 }}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>{p.name}</Typography>
                      {isLow && (
                        <Chip size="small" label="Low" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700, height: 22 }} />
                      )}
                      {pending > 0 && (
                        <Chip
                          size="small"
                          icon={<HourglassEmptyIcon sx={{ fontSize: 14 }} />}
                          label={`+${pending} pending`}
                          sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700, height: 22 }}
                        />
                      )}
                    </Stack>
                    {min > 0 && (
                      <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.4 }}>
                        Min: {min}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography sx={{ fontSize: 22, fontWeight: 800, color: isLow ? '#b91c1c' : '#111827' }}>
                      {stock}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#6b7280' }}>units</Typography>
                  </Box>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}

      {requestOpen && (
        <RequestAddDialog
          products={products}
          onClose={() => setRequestOpen(false)}
          onSaved={() => { setToast('Sent for admin approval'); setRequestOpen(false); reload(); }}
        />
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={2400} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

function RequestAddDialog({ products, onClose, onSaved }) {
  const [items, setItems] = useState([{ name: '', qty: 1 }]);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const setItem = (i, key, val) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [key]: val } : it));
  const addRow = () => setItems((prev) => [...prev, { name: '', qty: 1 }]);
  const removeRow = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    setError('');
    const clean = items
      .filter((it) => it.name && Number(it.qty) > 0)
      .map((it) => ({ name: it.name, qty: Number(it.qty), type: 'add' }));
    if (clean.length === 0) { setError('Add at least one item'); return; }
    if (!reason.trim()) { setError('Reason is required'); return; }
    setSubmitting(true);
    try {
      await createStockAdjustment({ items: clean, reason: reason.trim() });
      onSaved();
    } catch (e) { setError(e.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Request stock addition</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Alert severity="info" sx={{ mb: 2 }}>
          Stock will be added only after admin approves your request.
        </Alert>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700 }}>Items to add</Typography>
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
                  label="Qty to add" type="number" value={it.qty}
                  onChange={(e) => setItem(i, 'qty', e.target.value)}
                  slotProps={{ htmlInput: { min: 1 } }} sx={{ flex: 1 }}
                />
                <IconButton onClick={() => removeRow(i)} disabled={items.length === 1} size="small">
                  <DeleteOutlinedIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}
          </Stack>
          <Divider />
          <TextField
            label="Reason"
            placeholder="e.g. Received from supplier; not yet logged"
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
