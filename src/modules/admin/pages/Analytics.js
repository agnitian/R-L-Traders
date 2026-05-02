import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography, Chip, CircularProgress, Avatar, Divider, Alert } from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { PageHeader, StatsRow, PagePanel } from '../../../components/page/PagePrimitives';
import { listRecentActivity, getAnalytics } from '../../../api/admin';

function fmtTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const fmtINR = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [a, recent] = await Promise.all([getAnalytics(), listRecentActivity(10)]);
        if (alive) {
          setAnalytics(a);
          setActivity(recent);
          setError('');
        }
      } catch (e) {
        if (alive) setError(e.message || 'Failed to load analytics');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const stats = analytics?.stats || {};
  const salesByDay = analytics?.salesByDay || [];
  const salesByWeek = analytics?.salesByWeek || [];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader title="Analytics" subtitle="Live operational metrics from the database" />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <StatsRow
        cols={4}
        items={[
          {
            label: "Today's Units",
            value: loading ? '—' : String(stats.todaysUnits || 0),
            valueColor: '#16a34a',
          },
          {
            label: "Today's Sales",
            value: loading ? '—' : fmtINR(stats.todaysAmount),
            valueColor: '#2563eb',
          },
          {
            label: 'Active Trips',
            value: loading ? '—' : String(stats.activeTrips || 0),
            valueColor: '#ea580c',
          },
          {
            label: 'Returns Pending',
            value: loading ? '—' : String(stats.returnsPending || 0),
            valueColor: '#7c3aed',
          },
        ]}
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <PagePanel title="Sales by Day — Last 7 Days (units)">
          {loading ? (
            <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={26} /></Stack>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salesByDay}>
                <CartesianGrid stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v, n) => (n === 'units' ? [`${v} units`, 'Units'] : v)}
                />
                <Bar dataKey="units" fill="#e11d48" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </PagePanel>
        <PagePanel title="Weekly Sales Trend — Last 6 Weeks (units)">
          {loading ? (
            <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={26} /></Stack>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={salesByWeek}>
                <CartesianGrid stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v) => [`${v} units`, 'Units']}
                />
                <Line type="monotone" dataKey="units" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </PagePanel>
      </Box>

      <Box sx={{ mt: 3 }}>
        <PagePanel title="Latest 10 Sales (Counter & Trips)">
          {loading ? (
            <Stack sx={{ alignItems: 'center', py: 4 }}><CircularProgress size={26} /></Stack>
          ) : activity.length === 0 ? (
            <Typography sx={{ fontSize: 13, color: '#6b7280' }}>No sales recorded yet.</Typography>
          ) : (
            <Stack divider={<Divider flexItem />} sx={{ gap: 0 }}>
              {activity.map((a) => {
                const isTrip = a.source === 'trip';
                const Icon = isTrip ? LocalShippingOutlinedIcon : StorefrontOutlinedIcon;
                const bg = isTrip ? '#dbeafe' : '#dcfce7';
                const fg = isTrip ? '#1d4ed8' : '#15803d';
                const itemsStr = (a.items || []).map((it) => `${it.name} × ${it.qty}`).join(', ');
                return (
                  <Stack key={a.id} direction="row" sx={{ alignItems: 'flex-start', gap: 1.5, py: 1.4 }}>
                    <Avatar variant="rounded" sx={{ bgcolor: bg, color: fg, width: 38, height: 38 }}>
                      <Icon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
                          {a.customer?.name || (isTrip ? 'Trip customer' : 'Walk-in')}
                        </Typography>
                        <Chip
                          size="small"
                          label={isTrip ? `Trip ${a.ref || ''}`.trim() : 'Counter'}
                          sx={{ bgcolor: bg, color: fg, fontWeight: 700, fontSize: 10.5, height: 20 }}
                        />
                        {a.customer?.phone && (
                          <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>{a.customer.phone}</Typography>
                        )}
                      </Stack>
                      <Typography sx={{ fontSize: 12.5, color: '#374151', mt: 0.3 }}>
                        {itemsStr || '—'}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: '#9ca3af', mt: 0.3 }}>
                        {fmtTime(a.when)} • {a.totalUnits} units
                        {a.totalAmount > 0 ? ` • ${fmtINR(a.totalAmount)}` : ''}
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </PagePanel>
      </Box>
    </Box>
  );
}
