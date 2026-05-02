import React, { useState } from 'react';
import { Box, Stack, Typography, TextField, Button, Switch, Avatar, Divider } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { PageHeader, PagePanel } from '../../../components/page/PagePrimitives';
import { useAuth } from '../../../context/AuthContext';
import { avatarSrcFor } from '../../../utils/avatar';

const ACCENT = '#7c3aed';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [autoVerify, setAutoVerify] = useState(false);
  const [lowAlert, setLowAlert] = useState(true);
  const [emailRpt, setEmailRpt] = useState(true);
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader title="Settings" subtitle="Counter operator preferences" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        <PagePanel title="Profile">
          <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mb: 2.5 }}>
            <Avatar src={avatarSrcFor(user)} sx={{ width: 64, height: 64 }} />
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{user?.name || 'Counter Operator'}</Typography>
              <Typography sx={{ fontSize: 12, color: '#6b7280' }}>Counter Staff • Supply Desk</Typography>
            </Box>
          </Stack>
          <Stack sx={{ gap: 2 }}>
            <TextField label="Full Name" size="small" value={user?.name || ''} slotProps={{ input: { readOnly: true } }} fullWidth />
            <TextField label="Phone" size="small" value={user?.phone || '—'} slotProps={{ input: { readOnly: true } }} fullWidth />
            <Typography variant="caption" sx={{ color: '#9ca3af' }}>
              Profile details are managed by Admin. Contact admin to make changes.
            </Typography>
            <Button
              startIcon={<LogoutIcon />}
              onClick={signOut}
              sx={{
                bgcolor: '#fff',
                color: '#dc2626',
                border: '1px solid #fecaca',
                textTransform: 'none',
                py: 1,
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': { bgcolor: '#fef2f2' },
              }}
            >
              Sign out
            </Button>
          </Stack>
        </PagePanel>
        <PagePanel title="Preferences">
          <Stack sx={{ gap: 2 }}>
            {[
              { label: 'Auto-Verify Trusted Suppliers', desc: 'Skip manual verification for top-rated suppliers', val: autoVerify, set: setAutoVerify },
              { label: 'Low Stock Alerts', desc: 'Notify when SKU drops below min', val: lowAlert, set: setLowAlert },
              { label: 'Email Daily Report', desc: 'Receive end-of-day summary via email', val: emailRpt, set: setEmailRpt },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{s.label}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>{s.desc}</Typography>
                  </Box>
                  <Switch
                    checked={s.val}
                    onChange={(e) => s.set(e.target.checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: ACCENT },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: ACCENT },
                    }}
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
