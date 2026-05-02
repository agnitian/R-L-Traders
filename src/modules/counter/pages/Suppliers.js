import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip, Alert, CircularProgress, Snackbar, Avatar, Divider,
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { PageHeader, StatsRow, FilterBar, useFullScreenDialog } from '../../../components/page/PagePrimitives';
import { useAuth } from '../../../context/AuthContext';
import { listSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../../api/suppliers';

const ACCENT = '#7c3aed';

const STATUS_META = {
  pending: { color: '#b45309', bg: '#fef3c7', label: 'Pending', Icon: HourglassEmptyIcon },
  approved: { color: '#15803d', bg: '#dcfce7', label: 'Approved', Icon: CheckCircleOutlinedIcon },
  rejected: { color: '#b91c1c', bg: '#fee2e2', label: 'Rejected', Icon: CancelOutlinedIcon },
};

export default function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
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
    try { setSuppliers(await listSuppliers()); }
    catch (e) { setError(e.message || 'Failed to load'); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const stats = useMemo(() => ({
    total: suppliers.length,
    approved: suppliers.filter((s) => s.approvalStatus === 'approved').length,
    pending: suppliers.filter((s) => s.approvalStatus === 'pending').length,
    rejected: suppliers.filter((s) => s.approvalStatus === 'rejected').length,
  }), [suppliers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return suppliers.filter((s) => {
      if (filter !== 'all' && s.approvalStatus !== filter) return false;
      if (!q) return true;
      return `${s.name} ${s.contactPerson || ''} ${s.phone || ''} ${s.city || ''}`.toLowerCase().includes(q);
    });
  }, [suppliers, search, filter]);

  const canEditOwn = (s) =>
    s.approvalStatus === 'pending' && s.requestedBy && user && String(s.requestedBy) === String(user.id);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Suppliers"
        subtitle="Manage suppliers. New entries from counter need admin approval."
        action={
          <Button
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ bgcolor: ACCENT, color: '#fff', textTransform: 'none', fontWeight: 600, px: 2, py: 1, borderRadius: 2, '&:hover': { bgcolor: '#6d28d9' } }}
          >
            Add Supplier
          </Button>
        }
      />

      <StatsRow
        cols={4}
        items={[
          { label: 'Total', value: stats.total },
          { label: 'Approved', value: stats.approved, valueColor: '#15803d' },
          { label: 'Pending', value: stats.pending, valueColor: '#b45309' },
          { label: 'Rejected', value: stats.rejected, valueColor: '#b91c1c' },
        ]}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search supplier name, phone or city..."
        accent={ACCENT}
        activeFilter={filter}
        onFilterChange={setFilter}
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Approved', value: 'approved' },
          { label: 'Pending', value: 'pending' },
          { label: 'Rejected', value: 'rejected' },
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2 }}>
          <Typography sx={{ color: '#6b7280' }}>No suppliers found.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.2}>
          {filtered.map((s) => {
            const meta = STATUS_META[s.approvalStatus] || STATUS_META.pending;
            const Icon = meta.Icon;
            return (
              <Box key={s.id} sx={{ p: 2, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5 }}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Avatar sx={{ width: 38, height: 38, bgcolor: '#f3e8ff', color: '#7c3aed' }}>
                    <StorefrontOutlinedIcon />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>{s.name}</Typography>
                      <Chip
                        size="small"
                        icon={<Icon sx={{ fontSize: 14 }} />}
                        label={meta.label}
                        sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, height: 22 }}
                      />
                    </Stack>
                    <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                      {[s.contactPerson, s.phone, s.city].filter(Boolean).join(' · ')}
                    </Typography>
                  </Box>
                  {canEditOwn(s) && (
                    <>
                      <IconButton size="small" onClick={() => setEditTarget(s)}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => setDeleteTarget(s)} sx={{ color: '#b91c1c' }}>
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Stack>
                {s.reviewNote && (
                  <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.8, fontStyle: 'italic', pl: 6.5 }}>
                    Admin: {s.reviewNote}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Stack>
      )}

      {createOpen && (
        <SupplierDialog
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setToast('Submitted for approval'); setCreateOpen(false); reload(); }}
        />
      )}
      {editTarget && (
        <SupplierDialog
          target={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setToast('Updated'); setEditTarget(null); reload(); }}
        />
      )}
      {deleteTarget && (
        <DeleteSupplierDialog
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setToast('Removed'); setDeleteTarget(null); reload(); }}
        />
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={2400} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

function SupplierDialog({ target, onClose, onSaved }) {
  const editing = Boolean(target);
  const [form, setForm] = useState({
    name: target?.name || '',
    contactPerson: target?.contactPerson || '',
    phone: target?.phone || '',
    email: target?.email || '',
    city: target?.city || '',
    address: target?.address || '',
    notes: target?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setError('');
    if (!form.name.trim()) { setError('Supplier name is required'); return; }
    setSubmitting(true);
    try {
      if (editing) await updateSupplier(target.id, form);
      else await createSupplier(form);
      onSaved();
    } catch (e) { setError(e.message || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const fullScreen = useFullScreenDialog();
  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Edit supplier' : 'Add supplier'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!editing && (
          <Alert severity="info" sx={{ mb: 2 }}>
            New supplier will be sent to admin for approval before being available for use.
          </Alert>
        )}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Supplier name *" value={form.name} onChange={(e) => set('name', e.target.value)} fullWidth />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Contact person" value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} fullWidth />
            <TextField label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} fullWidth />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Email" value={form.email} onChange={(e) => set('email', e.target.value)} fullWidth />
            <TextField label="City" value={form.city} onChange={(e) => set('city', e.target.value)} fullWidth />
          </Stack>
          <TextField label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} fullWidth />
          <Divider />
          <TextField label="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)} multiline minRows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={submit} disabled={submitting} variant="contained" sx={{ bgcolor: ACCENT, textTransform: 'none', '&:hover': { bgcolor: '#6d28d9' } }}>
          {submitting ? 'Saving…' : editing ? 'Save changes' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteSupplierDialog({ target, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setSubmitting(true); setError('');
    try { await deleteSupplier(target.id); onDeleted(); }
    catch (e) { setError(e.message || 'Failed'); }
    finally { setSubmitting(false); }
  };
  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Remove this supplier?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2">Remove <strong>{target.name}</strong>?</Typography>
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
