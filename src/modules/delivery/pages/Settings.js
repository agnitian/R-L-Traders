import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography, TextField, Button, Switch, Avatar, Divider, CircularProgress } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { PageHeader, PagePanel } from '../../../components/page/PagePrimitives';
import { useAuth } from '../../../context/AuthContext';
import { avatarSrcFor } from '../../../utils/avatar';
import { listVehicles } from '../../../api/vehicles';

const ACCENT = '#16a34a';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [notif, setNotif] = useState(true);
  const [trips, setTrips] = useState(true);
  const [returns, setReturns] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [loadingVeh, setLoadingVeh] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await listVehicles();
        setVehicle((list || [])[0] || null);
      } catch {
        setVehicle(null);
      } finally {
        setLoadingVeh(false);
      }
    })();
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader title="Settings" subtitle="Manage your profile and preferences" />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        <PagePanel title="Profile">
          <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mb: 2.5 }}>
            <Avatar src={avatarSrcFor(user)} sx={{ width: 64, height: 64 }} />
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                {user?.name || 'Delivery User'}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                Delivery Partner{vehicle?.plate ? ` • ${vehicle.plate}` : ''}
              </Typography>
            </Box>
          </Stack>
          <Stack sx={{ gap: 2 }}>
            <TextField label="Full Name" size="small" value={user?.name || ''} slotProps={{ input: { readOnly: true } }} fullWidth />
            <TextField label="Phone" size="small" value={user?.phone || '—'} slotProps={{ input: { readOnly: true } }} fullWidth />

            <Divider sx={{ my: 0.5 }}><Typography sx={{ fontSize: 11, color: '#9ca3af' }}>ASSIGNED VEHICLE</Typography></Divider>

            {loadingVeh ? (
              <Stack sx={{ alignItems: 'center', py: 1 }}><CircularProgress size={20} /></Stack>
            ) : vehicle ? (
              <>
                <TextField label="Plate Number" size="small" value={vehicle.plate} slotProps={{ input: { readOnly: true } }} fullWidth />
                <TextField label="Model" size="small" value={vehicle.model} slotProps={{ input: { readOnly: true } }} fullWidth />
                <TextField label="Route / Area" size="small" value={vehicle.route || '—'} slotProps={{ input: { readOnly: true } }} fullWidth />
              </>
            ) : (
              <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>
                No vehicle assigned yet. Contact admin to get a vehicle.
              </Typography>
            )}

            <Typography variant="caption" sx={{ color: '#9ca3af' }}>
              Profile and vehicle assignments are managed by Admin.
            </Typography>
            <Button
              startIcon={<LogoutIcon />}
              onClick={signOut}
              sx={{ bgcolor: '#fff', color: '#dc2626', border: '1px solid #fecaca', textTransform: 'none', py: 1, fontWeight: 600, borderRadius: 2, '&:hover': { bgcolor: '#fef2f2' } }}
            >
              Sign out
            </Button>
          </Stack>
        </PagePanel>

        <PagePanel title="Preferences">
          <Stack sx={{ gap: 2 }}>
            {[
              { label: 'Push Notifications', desc: 'Get instant alerts for new trips', val: notif, set: setNotif },
              { label: 'Trip Updates', desc: 'Notify when trip status changes', val: trips, set: setTrips },
              { label: 'Return Reminders', desc: 'Daily reminder to submit returns', val: returns, set: setReturns },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{s.label}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>{s.desc}</Typography>
                  </Box>
                  <Switch
                    checked={s.val}
                    onChange={(e) => s.set(e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: ACCENT }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: ACCENT } }}
                  />
                </Stack>
                {i < arr.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Stack>
        </PagePanel>
      </Box>
    </Box>
  );
}
