import React, { useEffect, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { PageHeader, PagePanel } from '../../../components/page/PagePrimitives';
import { listPinUsers, adminResetPin } from '../../../api/auth';

const ACCENT = '#e11d48';

const ROLES = ['Admin', 'Counter', 'Delivery', 'Support'];
const PERMISSIONS = [
  { module: 'Users & Roles', actions: { Admin: true, Counter: false, Delivery: false, Support: false } },
  { module: 'Products', actions: { Admin: true, Counter: 'view', Delivery: 'view', Support: 'view' } },
  { module: 'Stock Inventory', actions: { Admin: true, Counter: true, Delivery: 'view', Support: false } },
  { module: 'Issue Stock', actions: { Admin: true, Counter: true, Delivery: false, Support: false } },
  { module: 'Delivery Trips', actions: { Admin: true, Counter: 'view', Delivery: true, Support: 'view' } },
  { module: 'Returns', actions: { Admin: true, Counter: true, Delivery: true, Support: 'view' } },
  { module: 'Suppliers', actions: { Admin: true, Counter: 'view', Delivery: false, Support: 'view' } },
  { module: 'Vehicles', actions: { Admin: true, Counter: false, Delivery: 'view', Support: false } },
  { module: 'Finance', actions: { Admin: true, Counter: false, Delivery: false, Support: false } },
  { module: 'Reports', actions: { Admin: true, Counter: 'view', Delivery: 'view', Support: 'view' } },
  { module: 'Audit Log', actions: { Admin: true, Counter: false, Delivery: false, Support: false } },
];

const ROLE_BG = {
  Admin: { bg: '#ffe4e6', color: '#9f1239' },
  Counter: { bg: '#dbeafe', color: '#1d4ed8' },
  Delivery: { bg: '#f3e8ff', color: '#6d28d9' },
  Support: { bg: '#fef3c7', color: '#a16207' },
};

function PermissionCell({ value }) {
  if (value === true) {
    return <Chip size="small" label="Full" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 10.5, height: 20, borderRadius: 99 }} />;
  }
  if (value === 'view') {
    return <Chip size="small" label="View" sx={{ bgcolor: '#dbeafe', color: '#1d4ed8', fontWeight: 700, fontSize: 10.5, height: 20, borderRadius: 99 }} />;
  }
  return <Chip size="small" label="—" sx={{ bgcolor: '#f3f4f6', color: '#9ca3af', fontWeight: 700, fontSize: 10.5, height: 20, borderRadius: 99 }} />;
}

export default function Permissions() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader title="Permissions" subtitle="Role-based access control matrix" />

      <PinManager />

      <PagePanel title="Access Matrix" padded={false}>
        <Box sx={{ overflowX: 'auto' }}>
          <Box
            sx={{
              minWidth: 640,
              display: 'grid',
              gridTemplateColumns: `220px repeat(${ROLES.length}, 1fr)`,
              gap: 0,
            }}
          >
            <Box sx={{ p: 1.5, fontSize: 12, fontWeight: 700, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
              Module
            </Box>
            {ROLES.map((r) => (
              <Box
                key={r}
                sx={{
                  p: 1.5,
                  textAlign: 'center',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <Chip
                  size="small"
                  label={r}
                  sx={{
                    bgcolor: ROLE_BG[r].bg,
                    color: ROLE_BG[r].color,
                    fontWeight: 700,
                    fontSize: 11,
                    height: 22,
                    borderRadius: 99,
                  }}
                />
              </Box>
            ))}

            {PERMISSIONS.map((row, idx) => (
              <React.Fragment key={row.module}>
                <Box
                  sx={{
                    p: 1.5,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#111827',
                    bgcolor: idx % 2 ? '#f9fafb' : '#fff',
                  }}
                >
                  {row.module}
                </Box>
                {ROLES.map((r) => (
                  <Box
                    key={r}
                    sx={{
                      p: 1.5,
                      display: 'flex',
                      justifyContent: 'center',
                      bgcolor: idx % 2 ? '#f9fafb' : '#fff',
                    }}
                  >
                    <PermissionCell value={row.actions[r]} />
                  </Box>
                ))}
              </React.Fragment>
            ))}
          </Box>
        </Box>
      </PagePanel>
    </Box>
  );
}

function PinManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(null); // user object
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [toast, setToast] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const data = await listPinUsers();
      setUsers(data);
    } catch (err) {
      setLoadError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openEdit = (user) => {
    setEditing(user);
    setPin('');
    setConfirmPin('');
    setShowPin(false);
    setDialogError('');
  };

  const closeEdit = () => {
    if (submitting) return;
    setEditing(null);
  };

  const handleSubmit = async () => {
    setDialogError('');
    if (!/^\d{6}$/.test(pin)) {
      setDialogError('PIN must be exactly 6 digits');
      return;
    }
    if (pin !== confirmPin) {
      setDialogError('PINs do not match');
      return;
    }
    setSubmitting(true);
    try {
      await adminResetPin({ userId: editing.id, newPin: pin });
      setToast(`PIN updated for ${editing.name}`);
      setEditing(null);
    } catch (err) {
      setDialogError(err.message || 'Failed to update PIN');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PagePanel title="6-digit PIN management" subtitle="Reset login PINs for Counter & Delivery staff">
      {toast && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setToast('')}>
          {toast}
        </Alert>
      )}
      {loadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {loadError}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} sx={{ color: ACCENT }} />
        </Box>
      ) : users.length === 0 ? (
        <Typography variant="body2" sx={{ color: '#6b7280', py: 2 }}>
          No counter or delivery users found.
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {users.map((u) => (
            <Box
              key={u.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                border: '1px solid #e5e7eb',
                borderRadius: 2,
                bgcolor: '#fff',
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  bgcolor: u.role === 'counter' ? '#dbeafe' : '#f3e8ff',
                  color: u.role === 'counter' ? '#1d4ed8' : '#6d28d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {u.name.charAt(0).toUpperCase()}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#111827' }} noWrap>
                  {u.name}
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.25 }}>
                  <Chip
                    size="small"
                    label={u.role}
                    sx={{
                      bgcolor: u.role === 'counter' ? '#dbeafe' : '#f3e8ff',
                      color: u.role === 'counter' ? '#1d4ed8' : '#6d28d9',
                      fontWeight: 700,
                      fontSize: 10,
                      height: 18,
                      textTransform: 'capitalize',
                    }}
                  />
                  {u.vehicleId && (
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      • {u.vehicleId}
                    </Typography>
                  )}
                  {!u.active && (
                    <Chip size="small" label="Inactive" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: 10, height: 18 }} />
                  )}
                </Stack>
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<VpnKeyIcon sx={{ fontSize: 16 }} />}
                onClick={() => openEdit(u)}
                sx={{
                  borderColor: ACCENT,
                  color: ACCENT,
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { borderColor: ACCENT, bgcolor: '#fff1f2' },
                }}
              >
                Change PIN
              </Button>
            </Box>
          ))}
        </Stack>
      )}

      <Dialog open={!!editing} onClose={closeEdit} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Change PIN
          {editing && (
            <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
              {editing.name} • {editing.role}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {dialogError}
            </Alert>
          )}
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
          <Button onClick={closeEdit} disabled={submitting} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || pin.length !== 6 || confirmPin.length !== 6}
            variant="contained"
            sx={{
              textTransform: 'none',
              bgcolor: ACCENT,
              '&:hover': { bgcolor: '#be123c' },
            }}
          >
            {submitting ? 'Saving…' : 'Update PIN'}
          </Button>
        </DialogActions>
      </Dialog>
    </PagePanel>
  );
}
