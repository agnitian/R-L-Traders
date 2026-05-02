import React, { useState } from 'react';
import {
  Box,
  Stack,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  ButtonBase,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { useNavigate } from 'react-router-dom';
import { ROLES, ROLE_LIST } from '../config/roles';
import { GRADIENTS } from '../theme';
import PinInput from './PinInput';
import { useAuth } from '../context/AuthContext';

/**
 * Shared login form. Used by every module — the user picks their role via
 * the gradient pill buttons and is redirected to that role's dashboard.
 */
export default function LoginForm({ defaultRole = 'admin' }) {
  const navigate = useNavigate();
  const { signInAdmin, signInWithPin } = useAuth();

  const [roleKey, setRoleKey] = useState(defaultRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const role = ROLES[roleKey];

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

    if (role.authType === 'password') {
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
      const user =
        role.authType === 'password'
          ? await signInAdmin({ email, password })
          : await signInWithPin({ pin, role: roleKey });
      const target = ROLES[user.role]?.redirect || role.redirect;
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isPin = role.authType === 'pin';
  const submitDisabled = submitting || (isPin && pin.length !== 6);

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '100%',
        maxWidth: 420,
        p: { xs: 3, sm: 4 },
        borderRadius: 4,
        background: '#ffffff',
        boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
        border: '1px solid rgba(255, 0, 100, 0.08)',
        transform: { xs: 'none', md: 'translateX(-40px)' },
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#1f2937', mb: 0.5 }}>
        Welcome Back!
      </Typography>
      <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>
        Sign in to continue to your dashboard
      </Typography>

      {/* Role pill buttons */}
      <Stack sx={{ flexDirection: 'row', gap: 1.2, mb: 3 }}>
        {ROLE_LIST.map((r) => {
          const Icon = r.Icon;
          const active = roleKey === r.key;
          return (
            <ButtonBase
              key={r.key}
              onClick={() => handleRoleChange(r.key)}
              sx={{
                flex: 1,
                py: 1.3,
                borderRadius: 2.5,
                fontSize: '0.85rem',
                fontWeight: 600,
                color: active ? '#fff' : '#6b7280',
                background: active ? GRADIENTS.rolePill : '#f3f4f6',
                boxShadow: active ? '0 6px 16px rgba(236, 72, 153, 0.35)' : 'none',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.8,
                '&:hover': {
                  background: active ? GRADIENTS.rolePill : '#e5e7eb',
                  transform: 'translateY(-1px)',
                },
              }}
              aria-pressed={active}
            >
              <Icon fontSize="small" />
              {r.shortLabel}
            </ButtonBase>
          );
        })}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {!isPin ? (
        <Stack sx={{ gap: 2 }}>
          <TextField
            fullWidth
            label="Email Address"
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
            label="Password"
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
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>
      ) : (
        <Box>
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
            Enter 6-digit login code
          </Typography>
          <PinInput value={pin} onChange={setPin} color={role.color} />
        </Box>
      )}

      <Button
        type="submit"
        fullWidth
        size="large"
        disabled={submitDisabled}
        sx={{
          mt: 3,
          py: 1.4,
          fontSize: '1rem',
          fontWeight: 600,
          letterSpacing: '0.3px',
          borderRadius: '12px',
          color: '#fff',
          background: submitDisabled
            ? '#e5e7eb'
            : isPin
            ? GRADIENTS.rolePill
            : GRADIENTS.primary,
          boxShadow: submitDisabled
            ? 'none'
            : '0 10px 24px rgba(225, 29, 72, 0.35)',
          '&:hover': {
            background: submitDisabled
              ? '#e5e7eb'
              : isPin
              ? GRADIENTS.rolePill
              : GRADIENTS.primary,
            filter: submitDisabled ? 'none' : 'brightness(0.95)',
          },
          '&.Mui-disabled': {
            color: '#9ca3af',
          },
        }}
      >
        {submitting ? 'Signing in…' : isPin ? 'Verify & Sign In' : `Sign In as ${role.label}`}
      </Button>

      <Typography
        variant="caption"
        sx={{
          textAlign: 'center',
          color: '#9ca3af',
          display: 'block',
          mt: 3,
        }}
      >
        Authorized personnel only • Managed by Admin
      </Typography>
    </Box>
  );
}
