import React, { useState } from 'react';
import { Box, Stack, Typography, Chip, Avatar } from '@mui/material';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import { PageHeader, StatsRow, FilterBar } from '../../../components/page/PagePrimitives';

const ACCENT = '#7c3aed';

const RETURNS = [
  { id: 'RET-188', date: '20 May • 02:45 PM', from: 'Delivery — Ramesh K.', units: 18, reason: 'Damaged crate', status: 'Pending', bg: '#ffedd5', color: '#c2410c' },
  { id: 'RET-187', date: '20 May • 06:10 PM', from: 'Delivery — Suresh P.', units: 24, reason: 'Expired stock', status: 'Approved', bg: '#dcfce7', color: '#15803d' },
  { id: 'RET-186', date: '19 May • 11:30 AM', from: 'Delivery — Anil M.', units: 12, reason: 'Wrong product', status: 'Approved', bg: '#dcfce7', color: '#15803d' },
  { id: 'RET-185', date: '19 May • 03:15 PM', from: 'Delivery — Mahesh L.', units: 8, reason: 'Damaged crate', status: 'Rejected', bg: '#fee2e2', color: '#dc2626' },
];

export default function ReturnsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const filtered = RETURNS.filter((r) => {
    const f = filter === 'all' || r.status.toLowerCase() === filter;
    const s = (r.from + r.id).toLowerCase().includes(search.toLowerCase());
    return f && s;
  });
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader title="Returns" subtitle="Review and process returns from delivery staff" />
      <StatsRow
        cols={4}
        items={[
          { label: 'Total Returns', value: RETURNS.length },
          { label: 'Pending', value: 1, valueColor: '#ea580c' },
          { label: 'Approved', value: 2, valueColor: '#16a34a' },
          { label: 'Rejected', value: 1, valueColor: '#dc2626' },
        ]}
      />
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search returns..."
        accent={ACCENT}
        activeFilter={filter}
        onFilterChange={setFilter}
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ]}
      />
      <Stack sx={{ gap: 1.4 }}>
        {filtered.map((r) => (
          <Stack
            key={r.id}
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
            <Avatar variant="rounded" sx={{ bgcolor: '#ffedd5', color: '#ea580c', width: 44, height: 44 }}>
              <KeyboardReturnOutlinedIcon />
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                {r.id} — {r.from}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                {r.date} • {r.reason}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#111827', minWidth: 60, textAlign: 'right' }}>
              {r.units}u
            </Typography>
            <Chip
              size="small"
              label={r.status}
              sx={{ bgcolor: r.bg, color: r.color, fontWeight: 700, fontSize: 11, height: 22, borderRadius: 99 }}
            />
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
