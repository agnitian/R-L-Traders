import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { PageHeader, StatsRow, FilterBar } from '../../../components/page/PagePrimitives';
import { listCustomerAudit } from '../../../api/admin';

const ACCENT = '#e11d48';

function fmtTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isToday(d) {
  if (!d) return false;
  const x = new Date(d);
  const now = new Date();
  return x.toDateString() === now.toDateString();
}

function isThisWeek(d) {
  if (!d) return false;
  const x = new Date(d).getTime();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);
  return x >= start.getTime();
}

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await listCustomerAudit({ limit: 200 });
        if (alive) setEntries(data);
      } catch (e) {
        if (alive) setError(e.message || 'Failed to load audit log');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const stats = useMemo(() => {
    const today = entries.filter((e) => isToday(e.when)).length;
    const week = entries.filter((e) => isThisWeek(e.when)).length;
    const counter = entries.filter((e) => e.source === 'counter').length;
    const trip = entries.filter((e) => e.source === 'trip').length;
    return { today, week, counter, trip };
  }, [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (filter === 'today' && !isToday(e.when)) return false;
      if (filter === 'week' && !isThisWeek(e.when)) return false;
      if (filter === 'counter' && e.source !== 'counter') return false;
      if (filter === 'trip' && e.source !== 'trip') return false;
      if (!q) return true;
      const hay = [
        e.customer?.name,
        e.customer?.phone,
        e.customer?.address,
        e.ref,
        ...(e.items || []).map((it) => it.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [entries, search, filter]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <PageHeader
        title="Audit Log"
        subtitle="Customer purchases across counter and delivery trips, in time order"
      />
      <StatsRow
        cols={4}
        items={[
          { label: 'Today', value: stats.today, valueColor: '#16a34a' },
          { label: 'This Week', value: stats.week, valueColor: '#2563eb' },
          { label: 'Counter Sales', value: stats.counter, valueColor: '#7c3aed' },
          { label: 'Trip Sales', value: stats.trip, valueColor: '#ea580c' },
        ]}
      />
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer / phone / item / trip #..."
        accent={ACCENT}
        activeFilter={filter}
        onFilterChange={setFilter}
        filters={[
          { label: 'All', value: 'all' },
          { label: 'Today', value: 'today' },
          { label: 'This Week', value: 'week' },
          { label: 'Counter', value: 'counter' },
          { label: 'Trips', value: 'trip' },
        ]}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#fff', border: '1px dashed #e5e7eb', borderRadius: 2 }}>
          <Typography sx={{ color: '#6b7280' }}>No customer purchases found.</Typography>
        </Box>
      ) : (
        <Stack sx={{ gap: 1 }}>
          {filtered.map((e) => {
            const isTrip = e.source === 'trip';
            const Icon = isTrip ? LocalShippingOutlinedIcon : StorefrontOutlinedIcon;
            const bg = isTrip ? '#dbeafe' : '#dcfce7';
            const fg = isTrip ? '#1d4ed8' : '#15803d';
            return (
              <Stack
                key={e.id}
                direction="row"
                sx={{
                  alignItems: 'flex-start',
                  gap: 1.5,
                  p: 1.6,
                  bgcolor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 2,
                }}
              >
                <Avatar variant="rounded" sx={{ bgcolor: bg, color: fg, width: 40, height: 40 }}>
                  <Icon sx={{ fontSize: 20 }} />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                      {e.customer?.name || (isTrip ? 'Trip customer' : 'Walk-in')}
                    </Typography>
                    <Chip
                      size="small"
                      label={isTrip ? `Trip ${e.ref || ''}`.trim() : 'Counter'}
                      sx={{ bgcolor: bg, color: fg, fontWeight: 700, fontSize: 10.5, height: 20 }}
                    />
                    {e.customer?.phone && (
                      <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
                        📞 {e.customer.phone}
                      </Typography>
                    )}
                    {e.customer?.address && (
                      <Typography sx={{ fontSize: 11.5, color: '#6b7280' }} noWrap>
                        • {e.customer.address}
                      </Typography>
                    )}
                  </Stack>
                  <Box sx={{ mt: 0.6 }}>
                    <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.6 }}>
                      {(e.items || []).map((it, idx) => (
                        <Chip
                          key={idx}
                          size="small"
                          label={`${it.name} × ${it.qty}${it.price ? ` @ ₹${it.price}` : ''}`}
                          sx={{ bgcolor: '#f3f4f6', color: '#374151', fontSize: 11, height: 22 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                  <Stack direction="row" sx={{ mt: 0.6, gap: 1.2, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontSize: 11, color: '#9ca3af' }}>
                      {fmtTime(e.when)}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#9ca3af' }}>
                      • {e.totalUnits} units
                    </Typography>
                    {e.totalAmount > 0 && (
                      <Typography sx={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
                        ₹{e.totalAmount.toFixed(2)}
                      </Typography>
                    )}
                    {e.note && (
                      <Typography sx={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }} noWrap>
                        — {e.note}
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
