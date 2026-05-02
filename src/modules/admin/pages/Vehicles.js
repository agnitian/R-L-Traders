import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Stack, Typography, Chip, Avatar, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, CircularProgress, Snackbar, Menu, Tooltip,
} from '@mui/material';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import { PageHeader, StatsRow, FilterBar, useFullScreenDialog } from '../../../components/page/PagePrimitives';
import { listVehicles, createVehicle, updateVehicle, deleteVehicle } from '../../../api/vehicles';

const ACCENT = '#e11d48';

const STATUS_META = {
  active: { label: 'Active', bg: '#dcfce7', color: '#15803d' },
  inactive: { label: 'Inactive', bg: '#f3f4f6', color: '#6b7280' },
};

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuTarget, setMenuTarget] = useState(null);
  const [toast, setToast] = useState('');

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const vs = await listVehicles();
      setVehicles(vs);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const stats = useMemo(() => ({
    total: vehicles.length,
    active: vehicles.filter((v) => v.status === 'active').length,
    inactive: vehicles.filter((v) => v.status === 'inactive').length,
  }), [vehicles]);

  const filtered = vehicles.filter((v) => {
    const matchFilter = filter === 'all' || v.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || `${v.plate} ${v.model} ${v.route}`.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Vehicles"
        subtitle="Fleet status, routes and driver assignments"
        action={
          <Button
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ bgcolor: ACCENT, color: '#fff', textTransform: 'none', fontWeight: 600, px: 2, py: 1, borderRadius: 2, '&:hover': { bgcolor: '#be123c' } }}
          >
            Add Vehicle
          </Button>
        }
      />

      <StatsRow
        cols={3}
        items={[
          { label: 'Fleet Size', value: stats.total },
          { label: 'Active', value: stats.active, valueColor: '#16a34a' },
          { label: 'Inactive', value: stats.inactive, valueColor: '#6b7280' },
        ]}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search plate, model or route..."
        accent={ACCENT}
        activeFilter={filter}
        onFilterChange={setFilter}
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2 }}>
          <Typography sx={{ color: '#6b7280' }}>No vehicles match. Click "Add Vehicle" to get started.</Typography>
        </Box>
      ) : (
        <Stack sx={{ gap: 1.4 }}>
          {filtered.map((v) => {
            const s = STATUS_META[v.status] || STATUS_META.active;
            return (
              <Stack key={v.id} direction="row" sx={{ alignItems: 'center', gap: 1.5, p: 2, bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5, flexWrap: 'wrap' }}>
                <Avatar variant="rounded" sx={{ bgcolor: '#dbeafe', color: '#2563eb', width: 44, height: 44 }}>
                  <DirectionsCarFilledOutlinedIcon />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 200 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{v.plate} • {v.model}</Typography>
                  <Stack direction="row" sx={{ gap: 1.5, mt: 0.4, flexWrap: 'wrap' }}>
                    {v.route && (
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 0.5 }}>
                        <RouteOutlinedIcon sx={{ fontSize: 14, color: '#6b7280' }} />
                        <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{v.route}</Typography>
                      </Stack>
                    )}
                  </Stack>
                </Box>
                <Chip size="small" label={s.label} sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 11, height: 22, borderRadius: 99 }} />
                <Tooltip title="Actions">
                  <IconButton size="small" onClick={(e) => { setMenuAnchor(e.currentTarget); setMenuTarget(v); }}>
                    <MoreVertIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            );
          })}
        </Stack>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { setEditTarget(menuTarget); setMenuAnchor(null); }}>
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />Edit
        </MenuItem>
        <MenuItem onClick={() => { setDeleteTarget(menuTarget); setMenuAnchor(null); }} sx={{ color: '#b91c1c' }}>
          <DeleteOutlinedIcon fontSize="small" sx={{ mr: 1 }} />Delete
        </MenuItem>
      </Menu>

      {createOpen && (
        <VehicleDialog
          onClose={() => setCreateOpen(false)}
          onSaved={(v) => { setVehicles((prev) => [v, ...prev]); setToast(`Added ${v.plate}`); setCreateOpen(false); }}
        />
      )}
      {editTarget && (
        <VehicleDialog
          target={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(v) => { setVehicles((prev) => prev.map((x) => x.id === v.id ? v : x)); setToast(`Updated ${v.plate}`); setEditTarget(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteVehicleDialog
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id, plate) => { setVehicles((prev) => prev.filter((x) => x.id !== id)); setToast(`Deleted ${plate}`); }}
        />
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={2500} onClose={() => setToast('')} message={toast} />
    </Box>
  );
}

function VehicleDialog({ target, onClose, onSaved }) {
  const editing = Boolean(target);
  const [plate, setPlate] = useState(target?.plate || '');
  const [model, setModel] = useState(target?.model || '');
  const [route, setRoute] = useState(target?.route || '');
  const [status, setStatus] = useState(target?.status || 'active');
  const [notes, setNotes] = useState(target?.notes || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!plate.trim() || !model.trim()) { setError('Plate and model are required'); return; }
    setSubmitting(true);
    try {
      const payload = {
        plate: plate.trim().toUpperCase(),
        model: model.trim(),
        route: route.trim(),
        status,
        notes: notes.trim(),
      };
      const v = editing ? await updateVehicle(target.id, payload) : await createVehicle(payload);
      onSaved(v);
    } catch (e) {
      setError(e.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const fullScreen = useFullScreenDialog();
  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="sm" fullWidth fullScreen={fullScreen}>
      <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Edit vehicle' : 'Add vehicle'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Plate number" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} fullWidth autoFocus />
            <TextField label="Model" value={model} onChange={(e) => setModel(e.target.value)} fullWidth />
          </Stack>
          <TextField label="Route / area covered" value={route} onChange={(e) => setRoute(e.target.value)} placeholder="e.g. MG Road – Sector 7" fullWidth />
          <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} fullWidth>
            {Object.entries(STATUS_META).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
          </TextField>
          <TextField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline minRows={2} fullWidth />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button onClick={submit} disabled={submitting} variant="contained" sx={{ bgcolor: ACCENT, textTransform: 'none', '&:hover': { bgcolor: '#be123c' } }}>
          {submitting ? 'Saving…' : editing ? 'Save changes' : 'Add vehicle'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteVehicleDialog({ target, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    setSubmitting(true);
    try { await deleteVehicle(target.id); onDeleted(target.id, target.plate); onClose(); }
    catch (e) { setError(e.message || 'Failed to delete'); }
    finally { setSubmitting(false); }
  };
  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Delete vehicle?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2">Permanently delete <strong>{target.plate}</strong>? This action cannot be undone.</Typography>
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
