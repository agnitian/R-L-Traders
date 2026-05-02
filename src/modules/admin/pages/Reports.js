import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography, Button, CircularProgress, Alert } from '@mui/material';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import DateRangeOutlinedIcon from '@mui/icons-material/DateRangeOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { PageHeader, StatsRow, PagePanel } from '../../../components/page/PagePrimitives';
import { getReportsSummary, downloadReportPdf } from '../../../api/admin';

const RANGES = [
  { key: 'day', label: 'Today', desc: "Today's sales (counter + trips)", Icon: TodayOutlinedIcon, color: '#16a34a', bg: '#dcfce7' },
  { key: 'week', label: 'This Week', desc: 'Last 7 days of sales', Icon: DateRangeOutlinedIcon, color: '#2563eb', bg: '#dbeafe' },
  { key: 'month', label: 'This Month', desc: 'From the 1st to today', Icon: CalendarMonthOutlinedIcon, color: '#7c3aed', bg: '#f3e8ff' },
];

export default function Reports() {
  const [summary, setSummary] = useState({ day: null, week: null, month: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState('');
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getReportsSummary();
        if (alive) setSummary(data);
      } catch (e) {
        if (alive) setError(e.message || 'Failed to load report summary');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleDownload = async (range) => {
    setDownloading(range);
    setDownloadError('');
    try {
      await downloadReportPdf(range);
    } catch (e) {
      setDownloadError(e.message || 'Download failed');
    } finally {
      setDownloading('');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader title="Reports" subtitle="Live sales summary and downloadable PDF reports" />
      <StatsRow
        cols={3}
        items={[
          {
            label: "Today's Sales",
            value: summary.day ? `${summary.day.units}u` : '—',
            valueColor: '#16a34a',
          },
          {
            label: 'This Week',
            value: summary.week ? `${summary.week.units}u` : '—',
            valueColor: '#2563eb',
          },
          {
            label: 'This Month',
            value: summary.month ? `${summary.month.units}u` : '—',
            valueColor: '#7c3aed',
          },
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {downloadError && <Alert severity="error" sx={{ mb: 2 }}>{downloadError}</Alert>}

      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
          {RANGES.map((r) => {
            const s = summary[r.key];
            return (
              <PagePanel key={r.key}>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 2, mb: 1.5 }}>
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
                      {r.label}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: '#6b7280' }}>{r.desc}</Typography>
                  </Box>
                </Stack>
                <Stack sx={{ gap: 0.4, mb: 1.5 }}>
                  <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                    Transactions: <b style={{ color: '#111827' }}>{s ? s.count : 0}</b>
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                    Units sold: <b style={{ color: '#111827' }}>{s ? s.units : 0}</b>
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                    Amount: <b style={{ color: '#111827' }}>₹{s ? (s.amount || 0).toFixed(2) : '0.00'}</b>
                  </Typography>
                </Stack>
                <Button
                  fullWidth
                  startIcon={downloading === r.key ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <PictureAsPdfOutlinedIcon />}
                  onClick={() => handleDownload(r.key)}
                  disabled={Boolean(downloading)}
                  sx={{
                    bgcolor: '#e11d48',
                    color: '#fff',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: 12.5,
                    py: 0.9,
                    borderRadius: 2,
                    '&:hover': { bgcolor: '#be123c' },
                  }}
                >
                  Download PDF
                </Button>
              </PagePanel>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
