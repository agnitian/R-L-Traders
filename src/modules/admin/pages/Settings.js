import React, { useState } from 'react';
import { Box, Stack, Typography, TextField, Button, Switch, Avatar, Divider } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { PageHeader, PagePanel } from '../../../components/page/PagePrimitives';
import { useAuth } from '../../../context/AuthContext';
import { avatarSrcFor } from '../../../utils/avatar';

const ACCENT = '#e11d48';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [twofa, setTwofa] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);
  const [autoBackup, setAutoBackup] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader title="Settings" subtitle="System configuration" />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
        <PagePanel title="Profile">
          <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mb: 2.5 }}>
            <Avatar src={avatarSrcFor(user) || 'https://avatar.iran.liara.run/public/boy?username=admin'} sx={{ width: 64, height: 64 }} />
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{user?.name || 'R.L. Admin'}</Typography>
              <Typography sx={{ fontSize: 12, color: '#6b7280' }}>Super Admin</Typography>
            </Box>
          </Stack>
          <Stack sx={{ gap: 2 }}>
            <TextField label="Organization" size="small" defaultValue="R.L. Traders" fullWidth />
            <TextField label="Admin Email" size="small" defaultValue={user?.email || 'admin@rltraders.in'} fullWidth />
            <TextField label="Phone" size="small" defaultValue={user?.phone || '+91 99123 45678'} fullWidth />
            <Button sx={{ bgcolor: ACCENT, color: '#fff', textTransform: 'none', py: 1, fontWeight: 600, borderRadius: 2, '&:hover': { bgcolor: '#be123c' } }}>
              Save Profile
            </Button>
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

        <PagePanel title="Security & System">
          <Stack sx={{ gap: 2 }}>
            {[
              { label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin logins', val: twofa, set: setTwofa },
              { label: 'Email Daily Digest', desc: 'Receive a daily operations summary', val: emailDigest, set: setEmailDigest },
              { label: 'Automated Backups', desc: 'Nightly DB backup to cloud', val: autoBackup, set: setAutoBackup },
              { label: 'Maintenance Mode', desc: 'Temporarily lock app for non-admin roles', val: maintenance, set: setMaintenance },
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
