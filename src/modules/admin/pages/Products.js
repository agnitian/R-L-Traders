import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert, CircularProgress,
  Snackbar, Switch, FormControlLabel, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { PageHeader, StatsRow, FilterBar } from '../../../components/page/PagePrimitives';
import {
  listProducts, createProduct, updateProduct, deleteProduct, adjustProductStock,
} from '../../../api/products';

const ACCENT = '#e11d48';

export default function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [stockTarget, setStockTarget] = useState(null);

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      setProducts(await listProducts());
    } catch (e) {
      setError(e.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const f = filter === 'all'
        || (filter === 'active' && p.active)
        || (filter === 'inactive' && !p.active)
        || (filter === 'low' && (p.stock || 0) < 100);
      const s = !q || `${p.sku} ${p.name}`.toLowerCase().includes(q);
      return f && s;
    });
  }, [products, filter, search]);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.active).length,
    low: products.filter((p) => (p.stock || 0) < 100).length,
    totalStock: products.reduce((s, p) => s + (p.stock || 0), 0),
  }), [products]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Products"
        subtitle="Catalog and live stock count"
        action={
          <Button
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ bgcolor: ACCENT, color: '#fff', textTransform: 'none', fontWeight: 600, px: 2, py: 1, borderRadius: 2, '&:hover': { bgcolor: '#be123c' } }}
          >
            Add Product
          </Button>
        }
      />

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <StatsRow
        cols={4}
        items={[
          { label: 'Products', value: stats.total },
          { label: 'Active', value: stats.active, valueColor: '#16a34a' },
          { label: 'Low Stock', value: stats.low, valueColor: '#dc2626' },
          { label: 'Total Stock', value: stats.totalStock.toLocaleString(), valueColor: '#2563eb' },
        ]}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by ID or name..."
        accent={ACCENT}
        activeFilter={filter}
        onFilterChange={setFilter}
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Low Stock', value: 'low' },
        ]}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: ACCENT }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', color: '#6b7280', bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5 }}>
          {products.length === 0 ? 'No products yet — click "Add Product" to get started.' : 'No products match your filters.'}
        </Box>
      ) : (
        <Stack spacing={1.4}>
          {filtered.map((p) => (
            <Stack
              key={p.id}
              direction="row"
              sx={{
                alignItems: 'center', gap: 1.5, p: 2, bgcolor: '#fff',
                border: '1px solid #e5e7eb', borderRadius: 2.5, flexWrap: 'wrap',
              }}
            >
              <Box sx={{ minWidth: 110 }}>
                <Typography sx={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>ID</Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>{p.sku}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 200 }}>
                <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: '#111827' }}>{p.name}</Typography>
              </Box>
              <Box sx={{ minWidth: 110, textAlign: 'right' }}>
                <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Units in stock</Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: (p.stock || 0) < 100 ? '#dc2626' : '#111827' }}>
                  {p.stock || 0}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={p.active ? 'Active' : 'Inactive'}
                sx={{ bgcolor: p.active ? '#dcfce7' : '#f3f4f6', color: p.active ? '#15803d' : '#6b7280', fontWeight: 700, fontSize: 10.5, height: 22 }}
              />
              <Tooltip title="Adjust units">
                <IconButton size="small" onClick={() => setStockTarget(p)} sx={{ bgcolor: '#f0fdf4', '&:hover': { bgcolor: '#dcfce7' } }}>
                  <TrendingUpIcon sx={{ fontSize: 18, color: '#15803d' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit"><IconButton size="small" onClick={() => setEditTarget(p)}><EditOutlinedIcon sx={{ fontSize: 18, color: '#2563eb' }} /></IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" onClick={() => setDeleteTarget(p)}><DeleteOutlinedIcon sx={{ fontSize: 18, color: '#dc2626' }} /></IconButton></Tooltip>
            </Stack>
          ))}
        </Stack>
      )}

      <ProductDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (payload) => {
          await createProduct(payload);
          setCreateOpen(false);
          setToast('Product added');
          reload();
        }}
      />

      <ProductDialog
        open={!!editTarget}
        initial={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={async (payload) => {
          await updateProduct(editTarget.id, payload);
          setEditTarget(null);
          setToast('Product updated');
          reload();
        }}
      />

      <StockDialog
        open={!!stockTarget}
        product={stockTarget}
        onClose={() => setStockTarget(null)}
        onSubmit={async (delta) => {
          await adjustProductStock(stockTarget.id, delta);
          setStockTarget(null);
          setToast('Stock updated');
          reload();
        }}
      />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete product?</DialogTitle>
        <DialogContent>
          <Typography>Permanently delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              try {
                await deleteProduct(deleteTarget.id);
                setDeleteTarget(null);
                setToast('Product deleted');
                reload();
              } catch (e) { setError(e.message || 'Failed to delete'); }
            }}
          >Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={2500} onClose={() => setToast('')} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setToast('')}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}

function ProductDialog({ open, initial, onClose, onSubmit }) {
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (open) {
      setForm(initial ? { ...initial } : { sku: '', name: '', stock: '', active: true });
      setErr('');
    }
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setSubmitting(true);
    setErr('');
    try {
      await onSubmit({
        sku: form.sku,
        name: form.name,
        stock: Number(form.stock) || 0,
        active: !!form.active,
      });
    } catch (e) {
      setErr(e.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{initial ? 'Edit Product' : 'Add Product'}</DialogTitle>
      <DialogContent>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Product ID" size="small" fullWidth
            value={form.sku || ''} onChange={set('sku')}
            placeholder="e.g. CC-600"
          />
          <TextField
            label="Product Name" size="small" fullWidth
            value={form.name || ''} onChange={set('name')}
            placeholder="e.g. Campa Cola 600ml"
          />
          <TextField
            label="Units" size="small" type="number" fullWidth
            value={form.stock ?? ''} onChange={set('stock')}
            disabled={!!initial}
            helperText={initial ? 'Use the +/- button on the list to adjust' : 'Starting quantity'}
          />
          <FormControlLabel
            control={<Switch checked={form.active !== false} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />}
            label="Active"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={submitting} sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#be123c' } }}>
          {submitting ? <CircularProgress size={20} /> : initial ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function StockDialog({ open, product, onClose, onSubmit }) {
  const [direction, setDirection] = useState('add');
  const [qty, setQty] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) { setDirection('add'); setQty(''); setErr(''); }
  }, [open]);

  const submit = async () => {
    const n = Number(qty);
    if (!Number.isFinite(n) || n <= 0) { setErr('Enter a positive quantity'); return; }
    const delta = direction === 'add' ? n : -n;
    setSubmitting(true);
    try {
      await onSubmit(delta);
    } catch (e) {
      setErr(e.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Adjust Units — {product.name}</DialogTitle>
      <DialogContent>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
            <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Current units</Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 800 }}>{product.stock || 0}</Typography>
          </Box>
          <TextField
            select label="Action" size="small" value={direction} onChange={(e) => setDirection(e.target.value)}
          >
            <MenuItem value="add">Add (+)</MenuItem>
            <MenuItem value="remove">Remove (-)</MenuItem>
          </TextField>
          <TextField
            label="Quantity" size="small" type="number" value={qty} onChange={(e) => setQty(e.target.value)} autoFocus
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={submitting}
          startIcon={direction === 'add' ? <TrendingUpIcon /> : <TrendingDownIcon />}
          sx={{ bgcolor: direction === 'add' ? '#16a34a' : '#dc2626', '&:hover': { bgcolor: direction === 'add' ? '#15803d' : '#b91c1c' } }}
        >
          {submitting ? <CircularProgress size={20} /> : 'Apply'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
