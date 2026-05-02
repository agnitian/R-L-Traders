import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Avatar, Chip, Alert, CircularProgress, Snackbar, Autocomplete, Divider,
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { PageHeader, StatsRow, FilterBar, useFullScreenDialog } from '../../../components/page/PagePrimitives';
import { listCounterSales, createCounterSale, updateCounterSale, deleteCounterSale } from '../../../api/counterSales';
import { listCustomers } from '../../../api/customers';
import { listProducts } from '../../../api/products';
import { toLocalDateTimeInput } from '../../../utils/datetime';

const ACCENT = '#7c3aed';
const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

export default function SupplyRecords() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toast, setToast] = useState('');

  const reload = async () => {
    setLoading(true); setError('');
    try {
      const [s, p] = await Promise.all([listCounterSales(), listProducts()]);
      setSales(s);
      setProducts(p);
    } catch (e) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayUnits = sales
      .filter((s) => new Date(s.soldAt).toDateString() === today)
      .reduce((sum, s) => sum + (s.totalUnits || 0), 0);
    return {
      total: sales.length,
      todayCount: sales.filter((s) => new Date(s.soldAt).toDateString() === today).length,
      todayUnits,
      customers: new Set(sales.map((s) => s.customer?.name).filter(Boolean)).size,
    };
  }, [sales]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const today = new Date().toDateString();
    return sales.filter((s) => {
      if (filter === 'today' && new Date(s.soldAt).toDateString() !== today) return false;
      if (!q) return true;
      return `${s.customer?.name || ''} ${s.customer?.phone || ''} ${(s.items || []).map((i) => i.name).join(' ')}`
        .toLowerCase().includes(q);
    });
  }, [sales, search, filter]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Supply Records"
        subtitle="Record customer purchases at the counter. Stock auto-decreases on save."
        action={
          <Button
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ bgcolor: ACCENT, color: '#fff', textTransform: 'none', fontWeight: 600, px: 2, py: 1, borderRadius: 2, '&:hover': { bgcolor: '#6d28d9' } }}
          >
            New Sale
          </Button>
        }
      />

      <StatsRow
        cols={4}
        items={[
          { label: 'Total Sales', value: stats.total },
          { label: 'Today', value: stats.todayCount, valueColor: '#7c3aed' },
          { label: 'Today Units', value: stats.todayUnits, valueColor: '#16a34a' },
          { label: 'Unique Customers', value: stats.customers, valueColor: '#2563eb' },
        ]}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer, phone or product..."
        accent={ACCENT}
        activeFilter={filter}
        onFilterChange={setFilter}
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Today', value: 'today' },
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2 }}>
          <Typography sx={{ color: '#6b7280' }}>No sales recorded yet. Click "New Sale" to start.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.2}>
          {filtered.map((s) => (
            <Box key={s.id} sx={{ p: 2, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5 }}>
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 1, flexWrap: 'wrap' }}>
                <Avatar sx={{ width: 38, height: 38, bgcolor: '#f3e8ff', color: '#7c3aed' }}>
                  <StorefrontOutlinedIcon />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 180 }}>
                  <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>{s.customer?.name || '—'}</Typography>
                  <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                    {s.customer?.phone || ''}{s.customer?.phone && s.customer?.address ? ' · ' : ''}{s.customer?.address || ''}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{fmtDateTime(s.soldAt)}</Typography>
                <Chip size="small" label={`${s.totalUnits}u`} sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700 }} />
                <IconButton size="small" onClick={() => setEditTarget(s)}><EditOutlinedIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => setDeleteTarget(s)} sx={{ color: '#b91c1c' }}><DeleteOutlinedIcon fontSize="small" /></IconButton>
              </Stack>
              <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap', pl: 6.5 }}>
                {(s.items || []).map((it, i) => (
                  <Chip key={i} size="small" label={`${it.name} × ${it.qty}`} sx={{ bgcolor: '#f3f4f6', fontSize: 11.5 }} />
                ))}
              </Stack>
              {s.note && <Typography sx={{ fontSize: 11.5, color: '#6b7280', pl: 6.5, mt: 0.6, fontStyle: 'italic' }}>{s.note}</Typography>}
            </Box>
          ))}
        </Stack>
      )}

      {createOpen && (
        <SaleDialog
          products={products}
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setToast('Sale recorded'); setCreateOpen(false); reload(); }}
        />
      )}
      {editTarget && (
        <SaleDialog
          target={editTarget}
          products={products}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setToast('Sale updated'); setEditTarget(null); reload(); }}
        />
      )}
      {deleteTarget && (
        <DeleteSaleDialog
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setToast('Sale removed'); setDeleteTarget(null); reload(); }}
        />
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={2400} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

function SaleDialog({ target, products, onClose, onSaved }) {
  const editing = Boolean(target);
  const [customerOptions, setCustomerOptions] = useState([]);
  const [name, setName] = useState(target?.customer?.name || '');
  const [phone, setPhone] = useState(target?.customer?.phone || '');
  const [address, setAddress] = useState(target?.customer?.address || '');
  const [soldAt, setSoldAt] = useState(toLocalDateTimeInput(target?.soldAt));
  const [note, setNote] = useState(target?.note || '');
  const [items, setItems] = useState(
    target?.items?.length
      ? target.items.map((i) => ({ name: i.name, qty: i.qty }))
      : [{ name: '', qty: 1 }],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    listCustomers().then((cs) => { if (alive) setCustomerOptions(cs); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const onCustomerSearch = async (q) => {
    if (!q || q.length < 2) return;
    try {
      const cs = await listCustomers(q);
      setCustomerOptions(cs);
    } catch (e) { /* ignore */ }
  };

  const stockOf = (productName) => {
    const p = products.find((x) => x.name.toLowerCase() === String(productName || '').toLowerCase());
    return p ? Number(p.stock || 0) : null;
  };

  const usedQty = (productName, ignoreIdx) => items.reduce((s, it, i) => {
    if (i === ignoreIdx) return s;
    if ((it.name || '').toLowerCase() === String(productName || '').toLowerCase()) return s + (Number(it.qty) || 0);
    return s;
  }, 0);

  const setItem = (i, key, val) => setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [key]: val } : it));
  const addRow = () => setItems((prev) => [...prev, { name: '', qty: 1 }]);
  const removeRow = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const totalUnits = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);

  const submit = async () => {
    setError('');
    if (!name.trim()) { setError('Customer name is required'); return; }
    const cleanItems = items.filter((it) => it.name && Number(it.qty) > 0);
    if (cleanItems.length === 0) { setError('Add at least one product'); return; }
    setSubmitting(true);
    try {
      const payload = {
        customer: { name: name.trim(), phone: phone.trim(), address: address.trim() },
        items: cleanItems,
        note: note.trim(),
        soldAt: soldAt ? new Date(soldAt).toISOString() : new Date().toISOString(),
      };
      const saved = editing
        ? await updateCounterSale(target.id, payload)
        : await createCounterSale(payload);
      onSaved(saved);
    } catch (e) { setError(e.message || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const fullScreen = useFullScreenDialog();
  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="md" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Edit sale' : 'New customer sale'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 13.5, color: '#374151' }}>Customer</Typography>
          <Autocomplete
            freeSolo
            options={customerOptions}
            getOptionLabel={(opt) => typeof opt === 'string' ? opt : (opt?.name || '')}
            inputValue={name}
            onInputChange={(_, val) => { setName(val || ''); onCustomerSearch(val || ''); }}
            onChange={(_, val) => {
              if (val && typeof val === 'object') {
                setName(val.name || '');
                setPhone(val.phone || '');
                setAddress(val.address || '');
              }
            }}
            renderOption={(props, opt) => (
              <li {...props} key={opt.id}>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 13.5 }}>{opt.name}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
                    {opt.phone}{opt.phone && opt.address ? ' · ' : ''}{opt.address}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => <TextField {...params} label="Customer name" fullWidth />}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} fullWidth />
            <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} fullWidth />
          </Stack>
          <TextField label="Date / Time" type="datetime-local" value={soldAt} onChange={(e) => setSoldAt(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} fullWidth />

          <Divider />
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700 }}>Products sold</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addRow} sx={{ textTransform: 'none' }}>Add product</Button>
          </Stack>
          <Stack spacing={1.2}>
            {items.map((it, i) => {
              const stock = stockOf(it.name);
              const used = usedQty(it.name, i);
              const remaining = stock != null ? Math.max(0, stock - used) : null;
              const exceeds = stock != null && Number(it.qty) > remaining;
              return (
                <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ alignItems: { sm: 'center' } }}>
                  <TextField
                    select
                    label="Product"
                    value={it.name}
                    onChange={(e) => setItem(i, 'name', e.target.value)}
                    sx={{ flex: 2 }}
                  >
                    <MenuItem value="">— Select —</MenuItem>
                    {products.map((p) => (
                      <MenuItem key={p.id} value={p.name}>
                        {p.name} ({p.stock}u)
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Qty"
                    type="number"
                    value={it.qty}
                    onChange={(e) => setItem(i, 'qty', e.target.value)}
                    slotProps={{ htmlInput: { min: 0 } }}
                    sx={{ flex: 1 }}
                    error={exceeds}
                    helperText={
                      exceeds
                        ? `Only ${remaining} left in stock`
                        : (stock != null ? `${remaining} available` : '')
                    }
                  />
                  <IconButton onClick={() => removeRow(i)} disabled={items.length === 1} size="small">
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              );
            })}
          </Stack>
          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
              Total units: <strong style={{ color: '#111827' }}>{totalUnits}</strong>
            </Typography>
          </Stack>

          <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} multiline minRows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={submit} disabled={submitting} variant="contained" sx={{ bgcolor: ACCENT, textTransform: 'none', '&:hover': { bgcolor: '#6d28d9' } }}>
          {submitting ? 'Saving…' : editing ? 'Save changes' : 'Record sale'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteSaleDialog({ target, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setSubmitting(true); setError('');
    try { await deleteCounterSale(target.id); onDeleted(target.id); }
    catch (e) { setError(e.message || 'Failed to delete'); }
    finally { setSubmitting(false); }
  };
  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Remove this sale?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2">
          Sold to <strong>{target.customer?.name || '—'}</strong>. Stock will be restored.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={submit} disabled={submitting} variant="contained" color="error" sx={{ textTransform: 'none' }}>
          {submitting ? 'Removing…' : 'Remove'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
