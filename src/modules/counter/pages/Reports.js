import React from 'react';
import { Box, Stack, Typography, Button } from '@mui/material';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import { PageHeader, StatsRow, PagePanel } from '../../../components/page/PagePrimitives';

const REPORTS = [
  { name: 'Daily Supply Report', desc: 'All supplies received today', Icon: Inventory2OutlinedIcon, color: '#7c3aed', bg: '#f3e8ff' },
  { name: 'Stock Issue Report', desc: 'Issues to delivery staff', Icon: LocalShippingOutlinedIcon, color: '#2563eb', bg: '#dbeafe' },
  { name: 'Returns Report', desc: 'Approved/rejected returns', Icon: KeyboardReturnOutlinedIcon, color: '#ea580c', bg: '#ffedd5' },
  { name: 'Inventory Snapshot', desc: 'Current stock levels by SKU', Icon: DescriptionOutlinedIcon, color: '#16a34a', bg: '#dcfce7' },
];

export default function Reports() {
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader title="Reports" subtitle="Counter operations reports" />
      <StatsRow
        cols={3}
        items={[
          { label: 'Reports', value: REPORTS.length },
          { label: 'Last Generated', value: '1d ago', valueColor: '#6b7280' },
          { label: 'This Month', value: 42, valueColor: '#7c3aed' },
        ]}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}>
        {REPORTS.map((r) => (
          <PagePanel key={r.name}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: r.bg,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <r.Icon sx={{ color: r.color }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: '#111827' }}>
                  {r.name}
                </Typography>
                <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{r.desc}</Typography>
              </Box>
              <Button
                startIcon={<FileDownloadOutlinedIcon />}
                sx={{
                  bgcolor: '#7c3aed',
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: 12.5,
                  px: 2,
                  py: 0.8,
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#6d28d9' },
                }}
              >
                CSV
              </Button>
            </Stack>
          </PagePanel>
        ))}
      </Box>
    </Box>
  );
}
