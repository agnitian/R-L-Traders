import React from 'react';
import { Box, Stack, Typography, InputBase, Button, Chip, useMediaQuery, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

// Returns true on xs/sm screens — use to make form Dialogs full-screen on mobile.
export function useFullScreenDialog() {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('sm'));
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      sx={{
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        gap: 1.5,
        mb: 3,
      }}
    >
      <Box>
        <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 800, color: '#111827' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography sx={{ fontSize: 13, color: '#6b7280', mt: 0.4 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action}
    </Stack>
  );
}

export function StatTile({ label, value, valueColor = '#111827' }) {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 2.5,
        border: '1px solid #e5e7eb',
        p: { xs: 2, md: 2.5 },
      }}
    >
      <Typography sx={{ fontSize: { xs: 22, md: 26 }, fontWeight: 800, color: valueColor }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.4 }}>
        {label}
      </Typography>
    </Box>
  );
}

export function StatsRow({ items, cols = 5 }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: `repeat(${cols}, 1fr)` },
        gap: { xs: 1.5, md: 2 },
        mb: 3,
      }}
    >
      {items.map((s) => (
        <StatTile key={s.label} {...s} />
      ))}
    </Box>
  );
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters,
  activeFilter,
  onFilterChange,
  accent = '#16a34a',
  showExport = true,
  extraAction,
}) {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 2.5,
        border: '1px solid #e5e7eb',
        p: 2,
        mb: 3,
      }}
    >
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        sx={{ gap: 1.5, alignItems: { lg: 'center' } }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 1,
            border: '1px solid #e5e7eb',
            borderRadius: 2,
            '&:focus-within': { borderColor: accent },
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
          <InputBase
            fullWidth
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            sx={{ fontSize: 13.5 }}
          />
        </Box>

        {filters && (
          <Stack
            direction="row"
            sx={{ gap: 1, overflowX: 'auto', flexShrink: 0 }}
          >
            {filters.map((f) => {
              const isActive = f.value === activeFilter;
              return (
                <Chip
                  key={f.value}
                  label={f.label}
                  onClick={() => onFilterChange?.(f.value)}
                  sx={{
                    bgcolor: isActive ? accent : '#f3f4f6',
                    color: isActive ? '#fff' : '#374151',
                    fontWeight: 600,
                    fontSize: 12,
                    height: 32,
                    borderRadius: 2,
                    px: 0.5,
                    '&:hover': { bgcolor: isActive ? accent : '#e5e7eb' },
                  }}
                />
              );
            })}
          </Stack>
        )}

        {extraAction}

        {showExport && (
          <Button
            startIcon={<FileDownloadOutlinedIcon />}
            sx={{
              bgcolor: accent,
              color: '#fff',
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              py: 1,
              fontWeight: 600,
              fontSize: 13,
              flexShrink: 0,
              '&:hover': { bgcolor: accent, filter: 'brightness(0.92)' },
            }}
          >
            Export
          </Button>
        )}
      </Stack>
    </Box>
  );
}

export function EmptyState({ icon: Icon, title, message }) {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 2.5,
        border: '1px solid #e5e7eb',
        p: 6,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          mx: 'auto',
          mb: 2,
          bgcolor: '#f3f4f6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {Icon && <Icon sx={{ fontSize: 32, color: '#9ca3af' }} />}
      </Box>
      <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111827', mb: 0.6 }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 13, color: '#6b7280' }}>{message}</Typography>
    </Box>
  );
}

export function PagePanel({ title, action, children, padded = true }) {
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 2.5,
        border: '1px solid #e5e7eb',
        mb: 3,
        overflow: 'hidden',
      }}
    >
      {(title || action) && (
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, md: 3 },
            py: 2,
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
            {title}
          </Typography>
          {action}
        </Stack>
      )}
      <Box sx={{ p: padded ? { xs: 2, md: 3 } : 0 }}>{children}</Box>
    </Box>
  );
}

export function ListItem({ leading, primary, secondary, trailing, onClick }) {
  return (
    <Stack
      direction="row"
      onClick={onClick}
      sx={{
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1.4,
        bgcolor: '#f9fafb',
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { bgcolor: '#f3f4f6' } : undefined,
      }}
    >
      {leading}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>
          {primary}
        </Typography>
        {secondary && (
          <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.2 }}>
            {secondary}
          </Typography>
        )}
      </Box>
      {trailing}
    </Stack>
  );
}
