import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  InputAdornment,
  IconButton,
  Paper,
  Alert,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';
import { ROLES, ROLE_LIST } from '../config/roles';
import PinInput from '../components/PinInput';
import { useAuth } from '../context/AuthContext';

const GRADIENT = 'linear-gradient(135deg, #7c3aed, #ef4444)';

/**
 * Mobile-only login screen — follows the reference design.
 * Uses the same role config + auth logic as the desktop LoginForm.
 */
export default function MobileLoginPage() {
  const [roleKey, setRoleKey] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { signInAdmin, signInWithPin } = useAuth();

  const role = ROLES[roleKey];
  const isPin = role.authType === 'pin';

  const handleRoleChange = (key) => {
    setRoleKey(key);
    setError('');
    setEmail('');
    setPassword('');
    setPin('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPin) {
      if (!email || !password) {
        setError('Please enter email and password.');
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        setError('Please enter a valid email address.');
        return;
      }
    } else if (pin.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setSubmitting(true);
    try {
      const user = isPin
        ? await signInWithPin({ pin, role: roleKey })
        : await signInAdmin({ email, password });
      const target = ROLES[user.role]?.redirect || role.redirect;
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          'linear-gradient(160deg, #ffffff 0%, #fff1f2 40%, #fce7f3 75%, #f3e8ff 100%)',
        px: 2,
        pt: 4,
        pb: 4,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* decorative blobs */}
      <Box
        sx={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: 'rgba(225, 29, 72, 0.10)',
          filter: 'blur(20px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -100,
          left: -60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'rgba(168, 85, 247, 0.10)',
          filter: 'blur(24px)',
        }}
      />
      <Box sx={{ position: 'relative' }}>
      {/* LOGO */}
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box
          component="img"
          src={`${process.env.PUBLIC_URL}/mobile_logo.png`}
          alt="R.L. Traders"
          sx={{
            width: 280,
            maxWidth: '85%',
            height: 'auto',
            display: 'block',
            mx: 'auto',
            filter: 'drop-shadow(0 14px 28px rgba(225, 29, 72, 0.22))',
          }}
        />
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            mt: 1.5,
            background: GRADIENT,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welcome Back!
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to continue
        </Typography>
      </Box>

      {/* ROLE SELECT */}
      <Stack direction="row" spacing={1} mt={1} mb={3}>
        {ROLE_LIST.map((r) => {
          const active = roleKey === r.key;
          return (
            <Box
              key={r.key}
              onClick={() => handleRoleChange(r.key)}
              role="button"
              tabIndex={0}
              sx={{
                flex: 1,
                py: 1.5,
                borderRadius: 3,
                textAlign: 'center',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
                color: active ? '#fff' : '#6b7280',
                background: active ? GRADIENT : '#f3f4f6',
                boxShadow: active ? '0 6px 16px rgba(236,72,153,0.35)' : 'none',
                transition: '0.2s',
                userSelect: 'none',
              }}
            >
              {r.shortLabel}
            </Box>
          );
        })}
      </Stack>

      {/* LOGIN CARD */}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{
          mt: 1.5,
          p: 3.5,
          borderRadius: 4,
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255, 0, 100, 0.06)',
        }}
      >
        <Typography fontWeight={700} fontSize={17} mb={3.5}>
          {role.label} Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {!isPin ? (
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              placeholder="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              fullWidth
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#9ca3af' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((s) => !s)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Stack>
        ) : (
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Enter your 6-digit code
            </Typography>
            <PinInput value={pin} onChange={setPin} color={role.color} />
          </Stack>
        )}

        <Button
          type="submit"
          fullWidth
          disabled={submitting}
          sx={{
            mt: 3.5,
            py: 1.5,
            borderRadius: 3,
            color: '#fff',
            fontWeight: 600,
            letterSpacing: '0.3px',
            background: GRADIENT,
            boxShadow: '0 10px 25px rgba(236,72,153,0.4)',
            transition: 'all 0.25s ease',
            '&:hover': {
              filter: 'brightness(1.05)',
              transform: 'translateY(-1px)',
            },
            '&.Mui-disabled': { background: '#e5e7eb', color: '#9ca3af' },
          }}
        >
          {submitting ? 'Signing in…' : isPin ? 'Verify & Sign In' : `Sign In as ${role.label}`}
        </Button>
      </Paper>

      {/* FOOTER */}
      <Typography
        variant="caption"
        display="block"
        textAlign="center"
        mt={4}
        color="#9ca3af"
      >
        Authorized personnel only • Managed by Admin
      </Typography>
      </Box>
    </Box>
  );
}
