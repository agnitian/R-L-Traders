import React, { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Stack,
  Typography,
  IconButton,
  Button,
  Avatar,
  Chip,
  Badge,
  Drawer,
  CircularProgress,
  Popover,
  Divider,
} from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import KeyboardReturnOutlinedIcon from '@mui/icons-material/KeyboardReturnOutlined';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CloseIcon from '@mui/icons-material/Close';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { avatarSrcFor } from '../../utils/avatar';
import { listTrips } from '../../api/trips';

const MyTrips = lazy(() => import('./pages/MyTrips'));
const SupplyEntry = lazy(() => import('./pages/SupplyEntry'));
const ReturnsEntry = lazy(() => import('./pages/ReturnsEntry'));
const ProductsPage = lazy(() => import('./pages/Products'));
const SettingsPage = lazy(() => import('./pages/Settings'));

const PAGE_MAP = {
  'My Trips': MyTrips,
  'Supply Entry': SupplyEntry,
  'Returns Entry': ReturnsEntry,
  Products: ProductsPage,
  Settings: SettingsPage,
};

// URL slug for each nav entry. Empty string = index route (/delivery).
const NAV_TO_SLUG = {
  Dashboard: '',
  'My Trips': 'trips',
  'Supply Entry': 'supply',
  'Returns Entry': 'returns',
  Products: 'products',
  Settings: 'settings',
};
const SLUG_TO_NAV = Object.fromEntries(
  Object.entries(NAV_TO_SLUG).map(([k, v]) => [v, k])
);

const NAV_ITEMS = [
  { name: 'Dashboard', Icon: HomeOutlinedIcon },
  { name: 'My Trips', Icon: LocalShippingOutlinedIcon },
  { name: 'Supply Entry', Icon: Inventory2OutlinedIcon },
  { name: 'Returns Entry', Icon: KeyboardReturnOutlinedIcon },
  { name: 'Products', Icon: WidgetsOutlinedIcon },
  { name: 'Settings', Icon: SettingsOutlinedIcon },
];

const MOBILE_NAV_ITEMS = [
  { name: 'Dashboard', Icon: HomeOutlinedIcon },
  { name: 'My Trips', Icon: LocalShippingOutlinedIcon },
  { name: 'Products', Icon: Inventory2OutlinedIcon },
  { name: 'More', Icon: MoreHorizIcon },
];

const STATUS_META = {
  pending: { label: 'Pending', bg: '#ffedd5', color: '#c2410c' },
  'in-progress': { label: 'In Progress', bg: '#dbeafe', color: '#1d4ed8' },
  completed: { label: 'Completed', bg: '#dcfce7', color: '#15803d' },
  cancelled: { label: 'Cancelled', bg: '#fee2e2', color: '#dc2626' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

const cardSx = {
  bgcolor: '#fff',
  borderRadius: 3,
  border: '1px solid #e5e7eb',
};

function CampaLogo({ size = 'lg' }) {
  const sizes = {
    lg: { h: 80, max: 240 },
    md: { h: 84, max: 220 },
    sm: { h: 44, max: 160 },
  };
  const { h, max } = sizes[size] || sizes.lg;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: h,
      }}
    >
      <Box
        component="img"
        src={`${process.env.PUBLIC_URL}/dashboard.png`}
        alt="R.L. Traders"
        sx={{
          height: '100%',
          width: 'auto',
          maxWidth: max,
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </Box>
  );
}

function NavList({ activeNav, setActiveNav, onSelect }) {
  return (
    <Box sx={{ p: 1.5 }}>
      {NAV_ITEMS.map(({ name, Icon }) => {
        const isActive = name === activeNav;
        return (
          <Box
            key={name}
            onClick={() => {
              setActiveNav(name);
              onSelect && onSelect();
            }}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.3,
              borderRadius: 2,
              mb: 0.5,
              cursor: 'pointer',
              bgcolor: isActive ? '#fff1f2' : 'transparent',
              color: isActive ? '#9f1239' : '#374151',
              '&:hover': {
                bgcolor: isActive ? '#ffe4e6' : '#fafafa',
              },
              transition: 'background 0.15s',
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
            <Typography sx={{ fontSize: 13.5, fontWeight: 500 }}>{name}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function SectionHeader({ title, action, mobile }) {
  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        px: mobile ? 2 : 3,
        py: mobile ? 1.5 : 2,
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <Typography
        sx={{
          fontSize: mobile ? 14 : 16,
          fontWeight: 600,
          color: '#111827',
        }}
      >
        {title}
      </Typography>
      {action && (
        React.isValidElement(action) ? (
          action
        ) : (
          <Button
            size="small"
            sx={{
              color: '#2563eb',
              fontSize: mobile ? 11.5 : 13,
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 0,
              '&:hover': { bgcolor: '#eff6ff' },
            }}
          >
            {action}
          </Button>
        )
      )}
    </Stack>
  );
}

function ReturnSummary({ mobile, data = [] }) {
  const total = data.reduce((s, r) => s + r.value, 0);
  if (data.length === 0) {
    return (
      <Box sx={cardSx}>
        <SectionHeader title="Return Summary" mobile={mobile} />
        <Box sx={{ p: mobile ? 2 : 3, textAlign: 'center' }}>
          <Typography sx={{ fontSize: 12.5, color: '#6b7280' }}>
            No return request submitted for this trip.
          </Typography>
        </Box>
      </Box>
    );
  }
  return (
    <Box sx={cardSx}>
      <SectionHeader title="Return Summary" mobile={mobile} />
      <Box sx={{ p: mobile ? 2 : 3 }}>
        <Box sx={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={mobile ? 180 : 200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={mobile ? 50 : 60}
                outerRadius={mobile ? 70 : 80}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ textAlign: 'center' }}>
              <Typography
                sx={{ fontSize: mobile ? 22 : 28, fontWeight: 700, color: '#111827' }}
              >
                {total}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Total Units</Typography>
            </Box>
          </Box>
        </Box>
        <Stack sx={{ mt: mobile ? 2 : 3, gap: mobile ? 1 : 1.5 }}>
          {data.map((item, idx) => (
            <Stack
              key={idx}
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }}
                />
                <Typography sx={{ fontSize: mobile ? 11.5 : 13, color: '#374151' }}>
                  {item.name}
                </Typography>
              </Stack>
              <Typography
                sx={{ fontSize: mobile ? 11.5 : 13, fontWeight: 600, color: '#111827' }}
              >
                {item.value} ({Math.round((item.value / total) * 100)}%)
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

function QuickActions({ mobile }) { // eslint-disable-line no-unused-vars
  const actions = [
    { label: 'Supply Entry', Icon: AddIcon, bg: '#f0fdf4', hover: '#dcfce7', dotBg: '#22c55e', text: '#15803d' },
    { label: 'Return Entry', Icon: KeyboardReturnOutlinedIcon, bg: '#fff7ed', hover: '#ffedd5', dotBg: '#f97316', text: '#c2410c' },
    { label: 'View My Trips', Icon: VisibilityOutlinedIcon, bg: '#eff6ff', hover: '#dbeafe', dotBg: '#3b82f6', text: '#1d4ed8' },
  ];
  return (
    <Box sx={cardSx}>
      <SectionHeader title="Quick Actions" mobile={mobile} />
      <Stack sx={{ p: mobile ? 2 : 3, gap: mobile ? 1 : 1.5 }}>
        {actions.map(({ label, Icon, bg, hover, dotBg, text }) => (
          <Stack
            key={label}
            direction="row"
            sx={{
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.5,
              bgcolor: bg,
              borderRadius: 2,
              cursor: 'pointer',
              transition: 'background 0.15s',
              '&:hover': { bgcolor: hover },
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                bgcolor: dotBg,
                borderRadius: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ fontSize: 18, color: '#fff' }} />
            </Box>
            <Typography sx={{ fontSize: mobile ? 13 : 13.5, fontWeight: 600, color: text }}>
              {label}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function DashboardTripCard({ displayTrip, navigate, loading, mobile }) {
  if (loading) {
    return (
      <Box sx={cardSx}>
        <Stack sx={{ alignItems: 'center', p: mobile ? 3 : 5 }}>
          <CircularProgress size={24} />
        </Stack>
      </Box>
    );
  }
  if (!displayTrip) {
    return (
      <Box sx={{ ...cardSx, p: mobile ? 3 : 5, textAlign: 'center' }}>
        <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
          <LocalShippingOutlinedIcon sx={{ fontSize: 28, color: '#16a34a' }} />
        </Box>
        <Typography sx={{ fontSize: mobile ? 15 : 18, fontWeight: 800, mb: 0.5 }}>Yet to start</Typography>
        <Typography sx={{ fontSize: 12.5, color: '#6b7280', mb: 2, maxWidth: 380, mx: 'auto' }}>
          You haven't started a trip yet. Create one in <strong>My Trips</strong> to load stock and start delivering.
        </Typography>
        <Button
          onClick={() => navigate('My Trips')}
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ bgcolor: '#16a34a', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#15803d' } }}
        >
          Start a trip
        </Button>
      </Box>
    );
  }

  const { trip, isCurrent } = displayTrip;
  const s = STATUS_META[trip.status] || STATUS_META.pending;
  const sales = trip.sales || [];
  const recent = [...sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3);

  return (
    <Box sx={cardSx}>
      <SectionHeader
        title={isCurrent ? 'Current Trip' : 'Recent Trip'}
        mobile={mobile}
        action={
          <Button
            size="small"
            onClick={() => navigate(isCurrent ? 'Supply Entry' : 'My Trips')}
            sx={{ color: isCurrent ? '#16a34a' : '#2563eb', fontSize: mobile ? 11.5 : 13, fontWeight: 700, textTransform: 'none', minWidth: 0, '&:hover': { bgcolor: isCurrent ? '#f0fdf4' : '#eff6ff' } }}
          >
            {isCurrent ? 'Open Supply' : 'View'}
          </Button>
        }
      />
      <Box sx={{ p: mobile ? 2 : 3 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <Avatar variant="rounded" sx={{ bgcolor: isCurrent ? '#dcfce7' : '#dbeafe', color: isCurrent ? '#15803d' : '#1d4ed8' }}>
            <LocalShippingOutlinedIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 140 }}>
            <Typography sx={{ fontSize: mobile ? 15 : 17, fontWeight: 800 }}>{trip.tripNumber}</Typography>
            <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
              {trip.vehicle?.plate ? `${trip.vehicle.plate}${trip.vehicle.route ? ` • ${trip.vehicle.route}` : ''} • ` : ''}
              {fmtDate(trip.date)}
            </Typography>
          </Box>
          <Chip size="small" label={s.label} sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 11 }} />
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.2, mb: sales.length > 0 ? 2 : 0 }}>
          <MiniStat label="Loaded" value={`${trip.loadedUnits || 0}u`} bg="#dbeafe" color="#1d4ed8" />
          <MiniStat label="Sold" value={`${trip.totalUnits || 0}u`} bg="#dcfce7" color="#15803d" sub={`${sales.length} sales`} />
        </Box>

        {recent.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: 0.4, mb: 0.8 }}>
              RECENT SALES
            </Typography>
            <Stack spacing={0.8}>
              {recent.map((sale, i) => (
                <Stack key={sale.id || i} direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: '#111827' }} noWrap>
                    {sale.customer?.name || '—'}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>{sale.totalUnits}u</Typography>
                  <Typography sx={{ fontSize: 10.5, color: '#9ca3af', minWidth: 50, textAlign: 'right' }}>
                    {fmtTime(sale.date)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        )}

        {trip.returnRequest?.status && trip.returnRequest.status !== 'none' && (
          <Box
            sx={{
              mt: 2, p: 1.2, borderRadius: 2, border: '1px solid',
              bgcolor: trip.returnRequest.status === 'pending' ? '#fffbeb' : trip.returnRequest.status === 'approved' ? '#f0fdf4' : '#fef2f2',
              borderColor: trip.returnRequest.status === 'pending' ? '#fef3c7' : trip.returnRequest.status === 'approved' ? '#bbf7d0' : '#fecaca',
            }}
          >
            <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: trip.returnRequest.status === 'pending' ? '#a16207' : trip.returnRequest.status === 'approved' ? '#15803d' : '#b91c1c' }}>
              Return request: {trip.returnRequest.status}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

function MiniStat({ label, value, sub, bg, color }) {
  return (
    <Box sx={{ p: 1.2, bgcolor: bg, borderRadius: 2 }}>
      <Typography sx={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 0.4, textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 16, fontWeight: 800, color: '#111827', mt: 0.2 }}>{value}</Typography>
      {sub && <Typography sx={{ fontSize: 10, color: '#6b7280' }}>{sub}</Typography>}
    </Box>
  );
}

const NOTIF_SEEN_KEY = 'delivery.notifSeenAt';

function NotificationsBell() {
  const [items, setItems] = React.useState([]);
  const [seenAt, setSeenAt] = React.useState(() => {
    try { return localStorage.getItem(NOTIF_SEEN_KEY) || ''; } catch { return ''; }
  });
  const [anchor, setAnchor] = React.useState(null);

  const reload = React.useCallback(async () => {
    try {
      const trips = await listTrips();
      const reviewed = (trips || [])
        .filter((t) => t.returnRequest && (t.returnRequest.status === 'approved' || t.returnRequest.status === 'rejected'))
        .map((t) => ({
          id: t.id,
          tripNumber: t.tripNumber,
          status: t.returnRequest.status,
          reviewedAt: t.returnRequest.reviewedAt,
          reviewNote: t.returnRequest.reviewNote || '',
          items: t.returnRequest.items || [],
        }))
        .sort((a, b) => new Date(b.reviewedAt || 0) - new Date(a.reviewedAt || 0))
        .slice(0, 20);
      setItems(reviewed);
    } catch { /* ignore */ }
  }, []);

  React.useEffect(() => {
    reload();
    const t = setInterval(reload, 30000);
    return () => clearInterval(t);
  }, [reload]);

  const seenMs = seenAt ? new Date(seenAt).getTime() : 0;
  const unread = items.filter((a) => new Date(a.reviewedAt || 0).getTime() > seenMs).length;

  const open = (e) => {
    setAnchor(e.currentTarget);
    const now = new Date().toISOString();
    setSeenAt(now);
    try { localStorage.setItem(NOTIF_SEEN_KEY, now); } catch { /* ignore */ }
  };

  return (
    <>
      <IconButton
        onClick={open}
        sx={{ bgcolor: '#fff', border: '1px solid #fecdd3', '&:hover': { bgcolor: '#fff1f2' } }}
      >
        <Badge badgeContent={unread} color="error" overlap="circular">
          <NotificationsNoneIcon sx={{ color: '#9f1239' }} />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 340, maxHeight: 420, mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Notifications</Typography>
          <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
            Admin reviews of your return requests
          </Typography>
        </Box>
        {items.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 12.5, color: '#6b7280' }}>
              No notifications yet.
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Divider />}>
            {items.map((a) => {
              const approved = a.status === 'approved';
              const Icon = approved ? CheckCircleOutlinedIcon : CancelOutlinedIcon;
              const bg = approved ? '#dcfce7' : '#fee2e2';
              const fg = approved ? '#15803d' : '#b91c1c';
              return (
                <Stack key={a.id} direction="row" spacing={1.2} sx={{ p: 1.5, alignItems: 'flex-start' }}>
                  <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon sx={{ fontSize: 18, color: fg }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
                      Return {approved ? 'approved' : 'rejected'} · {a.tripNumber}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: '#6b7280' }} noWrap>
                      {(a.items || []).map((it) => `${it.name} × ${it.qty}`).join(', ')}
                    </Typography>
                    {a.reviewNote && (
                      <Typography sx={{ fontSize: 11, color: '#6b7280', mt: 0.4, fontStyle: 'italic' }}>
                        {a.reviewNote}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: 10.5, color: '#9ca3af', mt: 0.4 }}>
                      {a.reviewedAt ? new Date(a.reviewedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Popover>
    </>
  );
}

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const routerNavigate = useNavigate();
  // Derive active nav from URL (everything after /delivery/).
  const slug = (location.pathname.replace(/^\/delivery\/?/, '').split('/')[0] || '').toLowerCase();
  const activeNav = SLUG_TO_NAV[slug] || 'Dashboard';
  const setActiveNav = (name) => {
    const s = NAV_TO_SLUG[name] ?? '';
    routerNavigate(`/delivery${s ? `/${s}` : ''}`);
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [tripsError, setTripsError] = useState('');

  const navigate = (name, tripId = null) => {
    setSelectedTripId(tripId);
    setActiveNav(name);
    setMobileMenuOpen(false);
  };

  // Only the dashboard overview needs trips here. Fetch once on mount; child
  // pages fetch their own data when they render.
  useEffect(() => {
    if (activeNav !== 'Dashboard') return;
    let alive = true;
    (async () => {
      setTripsLoading(true); setTripsError('');
      try {
        const ts = await listTrips();
        if (alive) setTrips(ts);
      } catch (e) { if (alive) setTripsError(e.message || 'Failed to load trips'); }
      finally { if (alive) setTripsLoading(false); }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Display the current active trip if any; otherwise the most recent trip.
  const displayTrip = useMemo(() => {
    const sortFn = (a, b) => new Date(b.date) - new Date(a.date);
    const active = trips.filter((t) => t.status === 'pending' || t.status === 'in-progress').sort(sortFn);
    if (active[0]) return { trip: active[0], isCurrent: true };
    const sorted = [...trips].sort(sortFn);
    if (sorted[0]) return { trip: sorted[0], isCurrent: false };
    return null;
  }, [trips]);

  const dashStats = useMemo(() => {
    const t = displayTrip?.trip;
    const loaded = t?.loadedUnits || 0;
    const sold = t?.totalUnits || 0;
    const returned = (t?.returnRequest?.items || []).reduce((s, it) => s + (Number(it.qty) || 0), 0);
    const customers = (t?.sales || []).length;
    return [
      { label: 'Loaded', value: loaded.toLocaleString('en-IN'), sub: t ? 'Stock on vehicle' : 'No trip yet', Icon: LocalShippingOutlinedIcon, iconBg: '#dcfce7', iconColor: '#16a34a' },
      { label: 'Delivered', value: sold.toLocaleString('en-IN'), sub: 'Units sold', Icon: DescriptionOutlinedIcon, iconBg: '#dbeafe', iconColor: '#2563eb' },
      { label: 'Returns', value: returned.toLocaleString('en-IN'), sub: 'Units to return', Icon: KeyboardReturnOutlinedIcon, iconBg: '#ffedd5', iconColor: '#ea580c' },
      { label: 'Customers', value: customers.toLocaleString('en-IN'), sub: 'Sales recorded', Icon: Inventory2OutlinedIcon, iconBg: '#f3e8ff', iconColor: '#7c3aed' },
    ];
  }, [displayTrip]);

  const dashProducts = useMemo(() => {
    const t = displayTrip?.trip;
    if (!t) return [];
    const sold = new Map();
    (t.sales || []).forEach((s) => (s.items || []).forEach((it) => {
      sold.set(it.name, (sold.get(it.name) || 0) + (Number(it.qty) || 0));
    }));
    const palette = ['#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed', '#db2777'];
    return (t.items || []).map((it, i) => ({
      name: it.name,
      loaded: Number(it.qty) || 0,
      remaining: Math.max(0, (Number(it.qty) || 0) - (sold.get(it.name) || 0)),
      color: palette[i % palette.length],
    }));
  }, [displayTrip]);

  const dashReturnData = useMemo(() => {
    const t = displayTrip?.trip;
    const items = t?.returnRequest?.items || [];
    if (items.length === 0) return [];
    const palette = ['#ef4444', '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
    return items.map((it, i) => ({ name: it.name, value: Number(it.qty) || 0, color: palette[i % palette.length] }));
  }, [displayTrip]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#fff7f7' }}>
      {/* Desktop Sidebar */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          width: 256,
          bgcolor: '#fff',
          borderRight: '1px solid #e5e7eb',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
          <CampaLogo size="lg" />
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <NavList activeNav={activeNav} setActiveNav={setActiveNav} />
        </Box>
        <Box sx={{ p: 2, borderTop: '1px solid #e5e7eb' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={avatarSrcFor(user)}
              sx={{ width: 40, height: 40, bgcolor: '#d1d5db' }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }} noWrap>
                {user?.name || 'Delivery User'}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#6b7280' }} noWrap>
                {user?.phone || 'Delivery Staff'}
              </Typography>
            </Box>
            <ExpandMoreIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
          </Stack>
        </Box>
      </Box>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{ display: { xs: 'block', lg: 'none' } }}
        slotProps={{ paper: { sx: { width: 256 } } }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2.5,
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <CampaLogo size="sm" />
          <IconButton onClick={() => setMobileMenuOpen(false)}>
            <CloseIcon sx={{ color: '#6b7280' }} />
          </IconButton>
        </Stack>
        <NavList
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          onSelect={() => setMobileMenuOpen(false)}
        />
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Mobile Header (transparent, sits on page background) */}
        <Box
          sx={{
            display: { xs: 'block', lg: 'none' },
            px: 2,
            pt: 1.5,
            pb: 0.5,
          }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
          >
            <IconButton
              onClick={() => setMobileMenuOpen(true)}
              sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: '#fff1f2' } }}
            >
              <MenuIcon sx={{ color: '#9f1239' }} />
            </IconButton>
            <CampaLogo size="md" />
            <NotificationsBell />
          </Stack>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {activeNav !== 'Dashboard' && PAGE_MAP[activeNav] ? (
            <Suspense fallback={<Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>}>
              {React.createElement(PAGE_MAP[activeNav], { navigate, selectedTripId })}
            </Suspense>
          ) : (
            <>
          {/* Desktop Greeting Card */}
          <Box sx={{ display: { xs: 'none', lg: 'block' }, px: 4, pt: 4 }}>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                background:
                  'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 50%, #fce7f3 100%)',
                border: '1px solid #fecdd3',
                boxShadow: '0 4px 14px rgba(225,29,72,0.06)',
              }}
            >
              <Stack
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
              >
                <Box>
                  <Typography sx={{ fontSize: 13, color: '#9f1239', fontWeight: 600 }}>
                    Hello, {user?.name || 'Delivery Staff'} 👋
                  </Typography>
                  <Typography
                    sx={{ fontSize: 24, fontWeight: 800, color: '#111827', mt: 0.5 }}
                  >
                    Delivery Dashboard
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: '#6b7280', mt: 0.5 }}>
                    Manage deliveries and collections
                  </Typography>
                </Box>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2 }}>
                  <NotificationsBell />
                </Stack>
              </Stack>
            </Box>
          </Box>

          {/* Mobile Greeting */}
          <Box sx={{ display: { xs: 'block', lg: 'none' }, px: 2, pt: 1.5, pb: 1.5 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ fontSize: 18, fontWeight: 800, color: '#9f1239', lineHeight: 1.1 }}
              >
                Hey {user?.name?.split(' ')[0] || 'Delivery'} 👋
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.5 }}>
                Manage deliveries and collections
              </Typography>
            </Box>
          </Box>

          {/* Body */}
          <Box sx={{ p: { xs: 2, lg: 4 } }}>
            {/* Stats Cards */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                gap: { xs: 1.5, lg: 3 },
                mb: { xs: 3, lg: 4 },
              }}
            >
              {dashStats.map(({ label, value, sub, Icon, iconBg, iconColor }) => (
                <Box key={label} sx={{ ...cardSx, p: { xs: 2, lg: 3 } }}>
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      mb: { xs: 1.5, lg: 2 },
                    }}
                  >
                    <Typography sx={{ fontSize: { xs: 11, lg: 13 }, color: '#4b5563' }}>
                      {label}
                    </Typography>
                    <Box
                      sx={{
                        width: { xs: 32, lg: 40 },
                        height: { xs: 32, lg: 40 },
                        bgcolor: iconBg,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon sx={{ fontSize: { xs: 16, lg: 20 }, color: iconColor }} />
                    </Box>
                  </Stack>
                  <Typography
                    sx={{
                      fontSize: { xs: 22, lg: 28 },
                      fontWeight: 700,
                      color: '#111827',
                      mb: 0.4,
                    }}
                  >
                    {value}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: 10, lg: 11.5 }, color: '#6b7280' }}>
                    {sub}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Desktop Layout */}
            <Box
              sx={{
                display: { xs: 'none', lg: 'grid' },
                gridTemplateColumns: '2fr 1fr',
                gap: 3,
              }}
            >
              <Stack sx={{ gap: 3 }}>
                {/* Current / Recent trip details */}
                <DashboardTripCard displayTrip={displayTrip} navigate={navigate} loading={tripsLoading} />

                {/* Products */}
                <Box sx={cardSx}>
                  <SectionHeader
                    title={displayTrip?.isCurrent ? 'Stock on Vehicle (Current Trip)' : 'Stock Loaded (Recent Trip)'}
                    action={
                      <Button
                        size="small"
                        onClick={() => navigate('Products')}
                        sx={{ color: '#2563eb', fontSize: 13, fontWeight: 600, textTransform: 'none', minWidth: 0, '&:hover': { bgcolor: '#eff6ff' } }}
                      >
                        View All
                      </Button>
                    }
                  />
                  <Stack sx={{ p: 3, gap: 2 }}>
                    {dashProducts.length === 0 ? (
                      <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
                        No products to show — trip not started yet.
                      </Typography>
                    ) : dashProducts.map((product, idx) => (
                      <Stack
                        key={idx}
                        direction="row"
                        sx={{ alignItems: 'center', gap: 2 }}
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 64,
                            bgcolor: product.color + '20',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Box
                            sx={{
                              width: 20,
                              height: 44,
                              borderRadius: 99,
                              bgcolor: product.color,
                            }}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827', mb: 0.6 }}
                          >
                            {product.name}
                          </Typography>
                          <Stack direction="row" sx={{ gap: 3 }}>
                            <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
                              Loaded:{' '}
                              <Box component="span" sx={{ fontWeight: 700, color: '#111827' }}>
                                {product.loaded} units
                              </Box>
                            </Typography>
                            <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
                              Remaining:{' '}
                              <Box component="span" sx={{ fontWeight: 700, color: '#111827' }}>
                                {product.remaining} units
                              </Box>
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Stack>

              <Stack sx={{ gap: 3 }}>
                <ReturnSummary data={dashReturnData} />
              </Stack>
            </Box>

            {/* Mobile Layout */}
            <Stack sx={{ display: { xs: 'flex', lg: 'none' }, gap: 2, pb: 10 }}>
              {/* Current / Recent trip */}
              <DashboardTripCard displayTrip={displayTrip} navigate={navigate} loading={tripsLoading} mobile />

              <ReturnSummary mobile data={dashReturnData} />

              {/* Products */}
              <Box sx={cardSx}>
                <SectionHeader
                  title={displayTrip?.isCurrent ? 'Stock on Vehicle' : 'Stock Loaded (Recent)'}
                  mobile
                  action={
                    <Button
                      size="small"
                      onClick={() => navigate('Products')}
                      sx={{ color: '#2563eb', fontSize: 11.5, fontWeight: 600, textTransform: 'none', minWidth: 0, '&:hover': { bgcolor: '#eff6ff' } }}
                    >
                      View All
                    </Button>
                  }
                />
                <Stack sx={{ p: 2, gap: 1.5 }}>
                  {dashProducts.length === 0 ? (
                    <Typography sx={{ fontSize: 12.5, color: '#6b7280' }}>
                      No products to show — trip not started yet.
                    </Typography>
                  ) : dashProducts.map((product, idx) => (
                    <Stack
                      key={idx}
                      direction="row"
                      sx={{ alignItems: 'center', gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 56,
                          bgcolor: product.color + '20',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Box
                          sx={{
                            width: 18,
                            height: 38,
                            borderRadius: 99,
                            bgcolor: product.color,
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: '#111827',
                            mb: 0.4,
                          }}
                        >
                          {product.name}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
                          Loaded:{' '}
                          <Box component="span" sx={{ fontWeight: 700, color: '#111827' }}>
                            {product.loaded} units
                          </Box>
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>
                          Remaining:{' '}
                          <Box component="span" sx={{ fontWeight: 700, color: '#111827' }}>
                            {product.remaining} units
                          </Box>
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Box>
            </>
          )}
        </Box>

        {/* Mobile Bottom Navigation */}
        <Box
          sx={{
            display: { xs: 'block', lg: 'none' },
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: '#fff',
            borderTop: '1px solid #e5e7eb',
            px: 2,
            py: 1,
            zIndex: 30,
            pb: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-around' }}
          >
            {MOBILE_NAV_ITEMS.map(({ name, Icon }) => {
              const isActive = name === activeNav;
              return (
                <Box
                  key={name}
                  onClick={() => {
                    if (name === 'More') setMobileMenuOpen(true);
                    else setActiveNav(name);
                  }}
                  role="button"
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.4,
                    py: 0.8,
                    cursor: 'pointer',
                    flex: 1,
                  }}
                >
                  <Box
                    sx={{
                      p: 0.8,
                      borderRadius: 1.5,
                      bgcolor: isActive ? '#fff1f2' : 'transparent',
                      display: 'flex',
                    }}
                  >
                    <Icon
                      sx={{ fontSize: 20, color: isActive ? '#e11d48' : '#9ca3af' }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: isActive ? '#e11d48' : '#6b7280',
                    }}
                  >
                    {name}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
