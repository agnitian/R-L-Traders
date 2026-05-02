import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Button,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import { PageHeader, StatsRow, FilterBar } from '../../../components/page/PagePrimitives';
import {
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  adminResetPin,
} from '../../../api/auth';
import { listVehicles } from '../../../api/vehicles';
import { avatarSrcFor } from '../../../utils/avatar';

const ACCENT = '#e11d48';

const ROLES_BG = {
  admin: { bg: '#ffe4e6', color: '#9f1239' },
  counter: { bg: '#dbeafe', color: '#1d4ed8' },
  delivery: { bg: '#f3e8ff', color: '#6d28d9' },
};

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// Indian mobile: exactly 10 digits, must start with 6, 7, 8 or 9
const PHONE_REGEX = /^[6-9]\d{9}$/;
function validatePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return 'Phone number is required';
  if (digits.length !== 10) return 'Phone number must be exactly 10 digits';
  if (!PHONE_REGEX.test(digits)) return 'Must start with 6, 7, 8 or 9';
  return '';
}

export default function UsersRoles() {
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [pinTarget, setPinTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuUser, setMenuUser] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [staff, vs] = await Promise.all([listStaff(), listVehicles().catch(() => [])]);
      setUsers(staff);
      setVehicles(vs);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const f = filter === 'all' || u.role === filter;
      const s = (u.name + ' ' + (u.email || '') + ' ' + (u.phone || '') + ' ' + (u.vehicleId || ''))
        .toLowerCase()
        .includes(search.toLowerCase());
      return f && s;
    });
  }, [users, filter, search]);

  const counts = useMemo(() => {
    const c = { total: users.length, admin: 0, counter: 0, delivery: 0, inactive: 0 };
    users.forEach((u) => {
      c[u.role] = (c[u.role] || 0) + 1;
      if (!u.active) c.inactive += 1;
    });
    return c;
  }, [users]);

  const openMenu = (e, user) => {
    setMenuAnchor(e.currentTarget);
    setMenuUser(user);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuUser(null);
  };

  const handleToggleActive = async (user) => {
    try {
      const updated = await updateStaff(user.id, { active: !user.active });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...updated } : u)));
    } catch (err) {
      setError(err.message || 'Failed to update');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Users & Roles"
        subtitle="Manage staff accounts, roles, and access"
        action={
          <Button
            startIcon={<PersonAddAlt1OutlinedIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{
              bgcolor: ACCENT,
              color: '#fff',
              textTransform: 'none',
              fontWeight: 600,
              px: 2,
              py: 1,
              borderRadius: 2,
              '&:hover': { bgcolor: '#be123c' },
            }}
          >
            Add Staff
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {toast && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setToast('')}>
          {toast}
        </Alert>
      )}

      <StatsRow
        cols={5}
        items={[
          { label: 'Total Users', value: counts.total },
          { label: 'Admins', value: counts.admin || 0, valueColor: '#e11d48' },
          { label: 'Counter', value: counts.counter || 0, valueColor: '#2563eb' },
          { label: 'Delivery', value: counts.delivery || 0, valueColor: '#7c3aed' },
          { label: 'Inactive', value: counts.inactive, valueColor: '#dc2626' },
        ]}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users by name, email or vehicle..."
        accent={ACCENT}
        activeFilter={filter}
        onFilterChange={setFilter}
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Admin', value: 'admin' },
          { label: 'Counter', value: 'counter' },
          { label: 'Delivery', value: 'delivery' },
        ]}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: ACCENT }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', color: '#6b7280', bgcolor: '#fff', border: '1px solid #e5e7eb', borderRadius: 2.5 }}>
          No users match your filters.
        </Box>
      ) : (
        <Stack sx={{ gap: 1.4 }}>
          {filtered.map((u) => (
            <Stack
              key={u.id}
              direction="row"
              sx={{
                alignItems: 'center',
                gap: 1.5,
                p: 2,
                bgcolor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 2.5,
              }}
            >
              <Avatar src={avatarSrcFor(u)} sx={{ width: 44, height: 44 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111827' }} noWrap>
                  {u.name}
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#6b7280' }} noWrap>
                  {u.phone
                    ? `${u.phone}${u.vehicleId ? ' • ' + u.vehicleId : ''}`
                    : u.email || (u.vehicleId ? `Vehicle: ${u.vehicleId}` : '—')}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={cap(u.role)}
                sx={{
                  bgcolor: ROLES_BG[u.role]?.bg || '#f3f4f6',
                  color: ROLES_BG[u.role]?.color || '#6b7280',
                  fontWeight: 700,
                  fontSize: 11,
                  height: 22,
                  borderRadius: 99,
                }}
              />
              {u.role !== 'admin' ? (
                <Switch
                  checked={!!u.active}
                  onChange={() => handleToggleActive(u)}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: ACCENT },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: ACCENT },
                  }}
                />
              ) : (
                <Box sx={{ width: 38 }} />
              )}
              <IconButton
                size="small"
                onClick={(e) => openMenu(e, u)}
                disabled={u.role === 'admin'}
              >
                <MoreVertIcon sx={{ color: '#9ca3af' }} />
              </IconButton>
            </Stack>
          ))}
        </Stack>
      )}

      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            setEditTarget(menuUser);
            closeMenu();
          }}
        >
          <ListItemIcon><EditOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Edit details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setPinTarget(menuUser);
            closeMenu();
          }}
        >
          <ListItemIcon><VpnKeyIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Reset PIN</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteTarget(menuUser);
            closeMenu();
          }}
          sx={{ color: '#b91c1c' }}
        >
          <ListItemIcon><DeleteOutlinedIcon fontSize="small" sx={{ color: '#b91c1c' }} /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <CreateStaffDialog
        open={createOpen}
        vehicles={vehicles}
        onClose={() => setCreateOpen(false)}
        onCreated={(user) => {
          setUsers((prev) => [...prev, user]);
          setToast(`Added ${user.name}`);
        }}
      />

      <EditStaffDialog
        target={editTarget}
        vehicles={vehicles}
        onClose={() => setEditTarget(null)}
        onSaved={(user) => {
          setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, ...user } : u)));
          setToast(`Updated ${user.name}`);
        }}
      />

      <ResetPinDialog
        target={pinTarget}
        onClose={() => setPinTarget(null)}
        onSaved={(name) => setToast(`PIN updated for ${name}`)}
      />

      <DeleteDialog
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={(id, name) => {
          setUsers((prev) => prev.filter((u) => u.id !== id));
          setToast(`Deleted ${name}`);
        }}
      />
    </Box>
  );
}

function CreateStaffDialog({ open, vehicles = [], onClose, onCreated }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('delivery');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
      setRole('delivery');
      setPhone('');
      setPin('');
      setVehicleId('');
      setAvatarUrl('');
      setShowPin(false);
      setError('');
    }
  }, [open]);

  const submit = async () => {
    setError('');
    if (!name.trim()) return setError('Name is required');
    const phoneError = validatePhone(phone);
    if (phoneError) return setError(phoneError);
    if (!/^\d{6}$/.test(pin)) return setError('PIN must be exactly 6 digits');
    setSubmitting(true);
    try {
      const user = await createStaff({
        name: name.trim(),
        role,
        phone: phone.replace(/\D/g, ''),
        pin,
        vehicleId: role === 'delivery' ? vehicleId.trim() : '',
        avatarUrl: avatarUrl || null,
      });
      onCreated(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const phoneFieldError = phone ? validatePhone(phone) : '';
  const canSubmit =
    !!name.trim() && !validatePhone(phone) && /^\d{6}$/.test(pin);

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Add Staff</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <AvatarPicker
            value={avatarUrl}
            fallbackSeed={name || 'new-staff'}
            onChange={setAvatarUrl}
            onError={setError}
          />
          <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} autoFocus fullWidth />
          <TextField
            label="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="10-digit mobile, e.g. 9876543210"
            slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 } }}
            error={!!phoneFieldError}
            helperText={phoneFieldError || 'Enter 10-digit Indian mobile (starts with 6–9)'}
            fullWidth
          />
          <TextField select label="Role" value={role} onChange={(e) => setRole(e.target.value)} fullWidth>
            <MenuItem value="delivery">Delivery</MenuItem>
            <MenuItem value="counter">Counter</MenuItem>
          </TextField>
          {role === 'delivery' && (
            <TextField
              select
              label="Assign Vehicle (optional)"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              helperText={vehicles.length === 0 ? 'No vehicles available. Add vehicles first.' : 'Choose a vehicle to assign to this staff'}
              fullWidth
            >
              <MenuItem value="">— None —</MenuItem>
              {vehicles.map((v) => (
                <MenuItem key={v.id} value={v.plate}>
                  {v.plate} • {v.model}{v.route ? ` • ${v.route}` : ''}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label="6-digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            type={showPin ? 'text' : 'password'}
            slotProps={{
              htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPin((v) => !v)} edge="end" size="small">
                      {showPin ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }
            }}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          onClick={submit}
          disabled={submitting || !canSubmit}
          variant="contained"
          sx={{ textTransform: 'none', bgcolor: ACCENT, '&:hover': { bgcolor: '#be123c' } }}
        >
          {submitting ? 'Saving…' : 'Add Staff'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditStaffDialog({ target, vehicles = [], onClose, onSaved }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (target) {
      setName(target.name);
      setPhone(target.phone || '');
      setVehicleId(target.vehicleId || '');
      setAvatarUrl(target.avatarUrl || '');
      setError('');
    }
  }, [target]);

  if (!target) return null;


  const submit = async () => {
    setError('');
    const phoneError = validatePhone(phone);
    if (phoneError) return setError(phoneError);
    setSubmitting(true);
    try {
      const user = await updateStaff(target.id, {
        name: name.trim(),
        phone: phone.replace(/\D/g, ''),
        vehicleId,
        avatarUrl: avatarUrl || null,
      });
      onSaved(user);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const phoneFieldError = phone ? validatePhone(phone) : '';
  const canSubmit = !!name.trim() && !validatePhone(phone);

  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Edit details
        <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
          {target.name} • {cap(target.role)}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <AvatarPicker
            value={avatarUrl}
            fallbackSeed={target.id}
            onChange={setAvatarUrl}
            onError={setError}
          />
          <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} fullWidth />
          <TextField
            label="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 } }}
            error={!!phoneFieldError}
            helperText={phoneFieldError || ' '}
            fullWidth
          />
          {target.role === 'delivery' && (
            <TextField
              select
              label="Assign Vehicle"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              helperText={vehicles.length === 0 ? 'No vehicles available. Add vehicles first.' : ' '}
              fullWidth
            >
              <MenuItem value="">— None —</MenuItem>
              {vehicles.map((v) => (
                <MenuItem key={v.id} value={v.plate}>
                  {v.plate} • {v.model}{v.route ? ` • ${v.route}` : ''}
                </MenuItem>
              ))}
              {vehicleId && !vehicles.some((v) => v.plate === vehicleId) && (
                <MenuItem value={vehicleId}>{vehicleId} (current)</MenuItem>
              )}
            </TextField>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          onClick={submit}
          disabled={submitting || !canSubmit}
          variant="contained"
          sx={{ textTransform: 'none', bgcolor: ACCENT, '&:hover': { bgcolor: '#be123c' } }}
        >
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ResetPinDialog({ target, onClose, onSaved }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (target) {
      setPin('');
      setConfirmPin('');
      setShowPin(false);
      setError('');
    }
  }, [target]);

  if (!target) return null;

  const submit = async () => {
    setError('');
    if (!/^\d{6}$/.test(pin)) return setError('PIN must be exactly 6 digits');
    if (pin !== confirmPin) return setError('PINs do not match');
    setSubmitting(true);
    try {
      await adminResetPin({ userId: target.id, newPin: pin });
      onSaved(target.name);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update PIN');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Reset PIN
        <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
          {target.name} • {cap(target.role)}
        </Typography>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="New 6-digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            type={showPin ? 'text' : 'password'}
            slotProps={{
              htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 },
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPin((v) => !v)} edge="end" size="small">
                      {showPin ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }
            }}
            autoFocus
            fullWidth
          />
          <TextField
            label="Confirm PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            type={showPin ? 'text' : 'password'}
            slotProps={{ htmlInput: { inputMode: 'numeric', pattern: '[0-9]*', maxLength: 6 } }}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          onClick={submit}
          disabled={submitting || pin.length !== 6 || confirmPin.length !== 6}
          variant="contained"
          sx={{ textTransform: 'none', bgcolor: ACCENT, '&:hover': { bgcolor: '#be123c' } }}
        >
          {submitting ? 'Saving…' : 'Update PIN'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteDialog({ target, onClose, onDeleted }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!target) return null;

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      await deleteStaff(target.id);
      onDeleted(target.id, target.name);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onClose={submitting ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Delete user?</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2">
          This will permanently delete <strong>{target.name}</strong> ({cap(target.role)}). This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          onClick={submit}
          disabled={submitting}
          variant="contained"
          color="error"
          sx={{ textTransform: 'none' }}
        >
          {submitting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ~250KB cap (raw bytes) for uploaded avatar images
const AVATAR_MAX_BYTES = 250 * 1024;

function AvatarPicker({ value, fallbackSeed, onChange, onError }) {
  const inputRef = React.useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError?.('Please choose an image file');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      onError?.('Image is too large (max 250KB). Please choose a smaller one.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ''));
    reader.onerror = () => onError?.('Failed to read image file');
    reader.readAsDataURL(file);
  };

  return (
    <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
      <Avatar
        src={value || avatarSrcFor(fallbackSeed)}
        sx={{ width: 64, height: 64, border: '1px solid #e5e7eb' }}
      />
      <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<PhotoCameraOutlinedIcon fontSize="small" />}
            onClick={() => inputRef.current?.click()}
            sx={{
              textTransform: 'none',
              borderColor: '#e5e7eb',
              color: '#374151',
              '&:hover': { borderColor: '#d1d5db', bgcolor: '#f9fafb' },
            }}
            variant="outlined"
          >
            {value ? 'Change' : 'Upload photo'}
          </Button>
          {value && (
            <Button
              size="small"
              onClick={() => onChange('')}
              sx={{ textTransform: 'none', color: '#b91c1c' }}
            >
              Remove
            </Button>
          )}
        </Stack>
        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
          Optional • PNG/JPG up to 250KB. A default avatar is used if none.
        </Typography>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFile}
        />
      </Stack>
    </Stack>
  );
}
