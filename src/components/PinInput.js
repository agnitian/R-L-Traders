import React, { useRef } from 'react';
import { TextField, Stack } from '@mui/material';

export default function PinInput({ value, onChange, color = '#1565c0' }) {
  const inputs = useRef([]);

  const handleChange = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    while (arr.length < 6) arr.push('');
    arr[idx] = digit;
    onChange(arr.join('').slice(0, 6));
    if (digit && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      e.preventDefault();
      onChange(pasted);
      inputs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  return (
    <Stack sx={{ flexDirection: 'row', gap: { xs: 0.75, sm: 1 }, justifyContent: 'center', my: 1, width: '100%' }}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <TextField
          key={idx}
          inputRef={(el) => (inputs.current[idx] = el)}
          value={value[idx] || ''}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          slotProps={{
            htmlInput: {
              maxLength: 1,
              inputMode: 'numeric',
              'aria-label': `Digit ${idx + 1}`,
              style: {
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: 700,
                padding: '12px 0',
                width: '100%',
              },
            },
          }}
          sx={{
            flex: 1,
            minWidth: 0,
            maxWidth: 52,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '&.Mui-focused fieldset': { borderColor: color },
            },
          }}
        />
      ))}
    </Stack>
  );
}
