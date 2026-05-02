import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getOverview } from '../../api/admin';
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
  Popover,
  Divider,
} from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import DirectionsCarFilledOutlinedIcon from '@mui/icons-material/DirectionsCarFilledOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const UsersRoles = lazy(() => import('./pages/UsersRoles'));
const ProductsAdmin = lazy(() => import('./pages/Products'));
const CounterOps = lazy(() => import('./pages/CounterOps'));
const DeliveryTrips = lazy(() => import('./pages/DeliveryTrips'));
const Stock = lazy(() => import('./pages/Stock'));
const VehiclesAdmin = lazy(() => import('./pages/Vehicles'));
const Analytics = lazy(() => import('./pages/Analytics'));
const ReportsAdmin = lazy(() => import('./pages/Reports'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const Permissions = lazy(() => import('./pages/Permissions'));
const SettingsAdmin = lazy(() => import('./pages/Settings'));

const PAGE_MAP = {
  'Users & Roles': UsersRoles,
  Products: ProductsAdmin,
  'Counter Ops': CounterOps,
  'Delivery Trips': DeliveryTrips,
  Stock,
  Vehicles: VehiclesAdmin,
  Analytics,
  Reports: ReportsAdmin,
  'Audit Log': AuditLog,
  Permissions,
  Settings: SettingsAdmin,
};

// URL slug per nav entry. Empty string = index route (/admin).
const NAV_TO_SLUG = {
  Overview: '',
  'Users & Roles': 'users',
  Products: 'products',
  'Counter Ops': 'counter',
  'Delivery Trips': 'delivery',
  Stock: 'stock',
  Vehicles: 'vehicles',
  Analytics: 'analytics',
  Reports: 'reports',
  'Audit Log': 'audit',
  Permissions: 'permissions',
  Settings: 'settings',
};
const SLUG_TO_NAV = Object.fromEntries(
  Object.entries(NAV_TO_SLUG).map(([k, v]) => [v, k])
);

const MOBILE_TO_NAV = {
  Overview: 'Overview',
  Users: 'Users & Roles',
  Ops: 'Counter Ops',
};

const ACCENT = '#e11d48'; // rose
const ACCENT_BG = '#ffe4e6';

const NAV_ITEMS = [
  { name: 'Overview', Icon: HomeOutlinedIcon },
  { name: 'Users & Roles', Icon: GroupOutlinedIcon },
  { name: 'Products', Icon: Inventory2OutlinedIcon },
  { name: 'Counter Ops', Icon: StorefrontOutlinedIcon },
  { name: 'Delivery Trips', Icon: LocalShippingOutlinedIcon },
  { name: 'Stock', Icon: StorefrontOutlinedIcon },
  { name: 'Vehicles', Icon: DirectionsCarFilledOutlinedIcon },
  { name: 'Analytics', Icon: BarChartOutlinedIcon },
  { name: 'Reports', Icon: DescriptionOutlinedIcon },
  { name: 'Audit Log', Icon: HistoryOutlinedIcon },
  { name: 'Permissions', Icon: ShieldOutlinedIcon },
  { name: 'Settings', Icon: SettingsOutlinedIcon },
];

const MOBILE_NAV_ITEMS = [
  { name: 'Overview', Icon: HomeOutlinedIcon },
  { name: 'Users', Icon: GroupOutlinedIcon },
  { name: 'Ops', Icon: BarChartOutlinedIcon },
  { name: 'More', Icon: MoreHorizIcon },
];

const cardSx = {
  bgcolor: '#fff',
  borderRadius: 3,
  border: '1px solid #e5e7eb',
};

function BrandLogo({ size = 'lg' }) {
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
        alt="R.L. Traders Admin"
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
              py: 1.2,
              borderRadius: 2,
              mb: 0.4,
              cursor: 'pointer',
              bgcolor: isActive ? ACCENT_BG : 'transparent',
              color: isActive ? ACCENT : '#374151',
              '&:hover': { bgcolor: isActive ? ACCENT_BG : '#f9fafb' },
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{name}</Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function SectionHeader({ title, action, mobile, onClick }) {
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
      <Typography sx={{ fontSize: mobile ? 14 : 16, fontWeight: 600, color: '#111827' }}>
        {title}
      </Typography>
      {action && (
        React.isValidElement(action) ? (
          action
        ) : (
          <Button
            size="small"
            onClick={onClick}
            sx={{
              color: ACCENT,
              fontSize: mobile ? 11.5 : 13,
              fontWeight: 600,
              textTransform: 'none',
              minWidth: 0,
              '&:hover': { bgcolor: ACCENT_BG },
            }}
          >
            {action}
          </Button>
        )
      )}
    </Stack>
  );
}

function RevenueChart({ mobile, data, totalUnits }) {
  const points = (data && data.length ? data : []).map((d) => ({ day: d.day, units: d.units }));
  const total = totalUnits ?? points.reduce((s, x) => s + (x.units || 0), 0);
  return (
    <Box sx={cardSx}>
      <SectionHeader title="Units Sold — Last 7 Days" mobile={mobile} />
      <Box sx={{ p: mobile ? 1.5 : 3 }}>
        <Stack
          direction="row"
          sx={{ alignItems: 'flex-end', gap: 1.5, mb: mobile ? 1 : 2 }}
        >
          <Typography sx={{ fontSize: mobile ? 22 : 28, fontWeight: 800, color: '#111827' }}>
            {total.toLocaleString('en-IN')} units
          </Typography>
        </Stack>
        <ResponsiveContainer width="100%" height={mobile ? 160 : 200}>
          <AreaChart data={points}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e11d48" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#e11d48" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ stroke: '#e11d48', strokeWidth: 1, strokeDasharray: 4 }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
              }}
              formatter={(v) => [`${v} units`, 'Units']}
            />
            <Area
              type="monotone"
              dataKey="units"
              stroke="#e11d48"
              strokeWidth={2.5}
              fill="url(#revGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

function TeamSplit({ mobile, data }) {
  const split = (data && data.length ? data : []);
  const total = split.reduce((s, t) => s + t.value, 0);
  return (
    <Box sx={cardSx}>
      <SectionHeader title="Team Distribution" mobile={mobile} />
      <Box sx={{ p: mobile ? 2 : 3 }}>
        <Box sx={{ position: 'relative' }}>
          <ResponsiveContainer width="100%" height={mobile ? 160 : 180}>
            <PieChart>
              <Pie
                data={split}
                cx="50%"
                cy="50%"
                innerRadius={mobile ? 48 : 56}
                outerRadius={mobile ? 68 : 76}
                paddingAngle={2}
                dataKey="value"
              >
                {split.map((e, i) => (
                  <Cell key={i} fill={e.color} />
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
              <Typography sx={{ fontSize: mobile ? 22 : 26, fontWeight: 800, color: '#111827' }}>
                {total}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#6b7280' }}>Active Users</Typography>
            </Box>
          </Box>
        </Box>
        <Stack sx={{ mt: 2, gap: 1 }}>
          {split.map((t) => (
            <Stack
              key={t.name}
              direction="row"
              sx={{ alignItems: 'center', justifyContent: 'space-between' }}
            >
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: t.color }}
                />
                <Typography sx={{ fontSize: 12.5, color: '#374151' }}>{t.name}</Typography>
              </Stack>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#111827' }}>
                {t.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

function AdminControls({ mobile }) {
  const actions = [
    { label: 'Add User', Icon: AddIcon, bg: '#ffe4e6', hover: '#fecdd3', dotBg: '#e11d48', text: '#9f1239' },
    { label: 'Add Product', Icon: Inventory2OutlinedIcon, bg: '#dbeafe', hover: '#bfdbfe', dotBg: '#2563eb', text: '#1d4ed8' },
    { label: 'Approve Pending', Icon: VerifiedUserOutlinedIcon, bg: '#dcfce7', hover: '#bbf7d0', dotBg: '#16a34a', text: '#15803d' },
    { label: 'Generate Report', Icon: DescriptionOutlinedIcon, bg: '#f3e8ff', hover: '#e9d5ff', dotBg: '#7c3aed', text: '#6d28d9' },
  ];
  return (
    <Box sx={cardSx}>
      <SectionHeader title="Admin Controls" mobile={mobile} />
      <Stack sx={{ p: mobile ? 2 : 3, gap: mobile ? 1 : 1.2 }}>
        {actions.map(({ label, Icon, bg, hover, dotBg, text }) => (
          <Stack
            key={label}
            direction="row"
            sx={{
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.4,
              bgcolor: bg,
              borderRadius: 2,
              cursor: 'pointer',
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

function PendingApprovals({ mobile, data }) {
  const list = (data && data.length ? data : []);
  return (
    <Box sx={cardSx}>
      <SectionHeader title="Pending Approvals" mobile={mobile} />
      <Stack sx={{ p: mobile ? 2 : 3, gap: 1.2 }}>
        {list.length === 0 ? (
          <Typography sx={{ fontSize: 12.5, color: '#6b7280', textAlign: 'center', py: 1 }}>
            No pending approvals.
          </Typography>
        ) : list.map((p) => (
          <Stack
            key={p.id}
            direction="row"
            sx={{
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 1.5,
              py: 1.2,
              bgcolor: '#f9fafb',
              borderRadius: 2,
              gap: 1,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>
                {p.label}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
                {p.id} • {p.who}
              </Typography>
            </Box>
            <Stack direction="row" sx={{ gap: 0.6, alignItems: 'center' }}>
              <Chip
                size="small"
                label={p.priority}
                sx={{
                  bgcolor:
                    p.priority === 'High'
                      ? '#fee2e2'
                      : p.priority === 'Med'
                      ? '#fef3c7'
                      : '#e0f2fe',
                  color:
                    p.priority === 'High'
                      ? '#dc2626'
                      : p.priority === 'Med'
                      ? '#a16207'
                      : '#0369a1',
                  fontWeight: 700,
                  fontSize: 10.5,
                  height: 20,
                  borderRadius: 99,
                }}
              />
              <Button
                size="small"
                sx={{
                  bgcolor: ACCENT,
                  color: '#fff',
                  textTransform: 'none',
                  fontSize: 11,
                  fontWeight: 600,
                  px: 1.4,
                  py: 0.4,
                  minWidth: 0,
                  borderRadius: 1.5,
                  '&:hover': { bgcolor: '#be123c' },
                }}
              >
                Review
              </Button>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function ApprovalsBell({ items = [], onJump, compact = false }) {
  const [anchor, setAnchor] = useState(null);
  const count = items.length;
  const open = (e) => setAnchor(e.currentTarget);
  const close = () => setAnchor(null);
  const targetFor = (kind) => {
    if (kind === 'returnRequest') return 'Delivery Trips';
    return 'Counter Ops';
  };
  const labelFor = (kind) => {
    if (kind === 'returnRequest') return 'Return Request';
    if (kind === 'supplier') return 'Supplier';
    if (kind === 'stockAdjustment') return 'Stock Adjustment';
    return 'Approval';
  };
  const colorFor = (kind) => {
    if (kind === 'returnRequest') return { bg: '#fee2e2', fg: '#dc2626' };
    if (kind === 'supplier') return { bg: '#fef3c7', fg: '#a16207' };
    return { bg: '#dbeafe', fg: '#2563eb' };
  };

  return (
    <>
      <IconButton
        onClick={open}
        sx={
          compact
            ? { bgcolor: 'transparent', '&:hover': { bgcolor: '#fff1f2' } }
            : { bgcolor: '#fff', border: '1px solid #fecdd3', '&:hover': { bgcolor: '#fff1f2' } }
        }
      >
        <Badge badgeContent={count} color="error" overlap="circular">
          <NotificationsNoneIcon sx={{ color: '#9f1239' }} />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 360, maxHeight: 460, mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e5e7eb' }}>
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Pending Approvals</Typography>
          <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
            New requests that need your review
          </Typography>
        </Box>
        {count === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 12.5, color: '#6b7280' }}>
              You're all caught up.
            </Typography>
          </Box>
        ) : (
          <Stack divider={<Divider />}>
            {items.map((p) => {
              const c = colorFor(p.kind);
              return (
                <Stack
                  key={p.id}
                  direction="row"
                  spacing={1.2}
                  sx={{
                    p: 1.5,
                    alignItems: 'flex-start',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#fafafa' },
                  }}
                  onClick={() => {
                    close();
                    if (onJump) onJump(targetFor(p.kind));
                  }}
                >
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: 1.5,
                      bgcolor: c.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <NotificationsNoneIcon sx={{ fontSize: 17, color: c.fg }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        label={labelFor(p.kind)}
                        sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 700, fontSize: 10, height: 18 }}
                      />
                      <Typography sx={{ fontSize: 11, color: '#9ca3af' }}>{p.id}</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#111827', mt: 0.4 }}>
                      {p.label}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: '#6b7280', mt: 0.2 }}>
                      Requested by {p.who}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    sx={{
                      bgcolor: ACCENT,
                      color: '#fff',
                      textTransform: 'none',
                      fontSize: 10.5,
                      fontWeight: 700,
                      px: 1.2,
                      py: 0.3,
                      minWidth: 0,
                      borderRadius: 1.5,
                      '&:hover': { bgcolor: '#be123c' },
                    }}
                  >
                    Review
                  </Button>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Popover>
    </>
  );
}

export default function AdminDashboard() {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const slug = (location.pathname.replace(/^\/admin\/?/, '').split('/')[0] || '').toLowerCase();
  const activeNav = SLUG_TO_NAV[slug] || 'Overview';
  const setActiveNav = (name) => {
    const s = NAV_TO_SLUG[name] ?? '';
    routerNavigate(`/admin${s ? `/${s}` : ''}`);
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await getOverview();
        if (alive) setOverview(data);
      } catch {
        /* keep previous state on transient errors */
      }
    };
    load();
    const t = setInterval(load, 30000);
    return () => { alive = false; clearInterval(t); };
  }, []);

  const ovStats = overview?.stats || {};
  const unitsByDay = overview?.unitsByDay || [];
  const teamSplitData = overview?.teamSplit || [];
  const pendingApprovalsData = overview?.pendingApprovals || [];
  const topProductsData = overview?.topProducts || [];
  const recentActivityData = overview?.recentActivity || [];

  const fmtTimeAgo = (when) => {
    if (!when) return '';
    const diffMs = Date.now() - new Date(when).getTime();
    const m = Math.floor(diffMs / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hr ago`;
    const d = Math.floor(h / 24);
    return `${d} d ago`;
  };

  const STATS_LIVE = [
    {
      label: 'Sales Today',
      value: overview ? `${ovStats.salesTodayUnits || 0} units` : '—',
      sub: overview
        ? `${ovStats.salesTodayDelta >= 0 ? '+' : ''}${ovStats.salesTodayDelta || 0}% vs yesterday`
        : 'Loading…',
      trend: (ovStats.salesTodayDelta || 0) >= 0 ? 'up' : 'down',
      Icon: PaymentsOutlinedIcon,
      iconBg: '#ffe4e6',
      iconColor: '#e11d48',
    },
    {
      label: 'Active Users',
      value: overview ? String(ovStats.activeUsers || 0) : '—',
      sub: overview ? `${ovStats.onlineUsers || 0} non-admin` : 'Loading…',
      trend: 'up',
      Icon: GroupOutlinedIcon,
      iconBg: '#dbeafe',
      iconColor: '#2563eb',
    },
    {
      label: 'Trips Today',
      value: overview ? String(ovStats.tripsToday || 0) : '—',
      sub: overview ? `${ovStats.tripsTodayCompleted || 0} completed` : 'Loading…',
      trend: 'up',
      Icon: LocalShippingOutlinedIcon,
      iconBg: '#dcfce7',
      iconColor: '#16a34a',
    },
    {
      label: 'Stock On Hand',
      value: overview ? `${(ovStats.stockUnits || 0).toLocaleString('en-IN')} units` : '—',
      sub: overview ? `${ovStats.stockSkus || 0} active SKUs` : 'Loading…',
      trend: 'up',
      Icon: Inventory2OutlinedIcon,
      iconBg: '#fef3c7',
      iconColor: '#a16207',
    },
  ];

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
          <BrandLogo size="lg" />
        </Box>
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          <NavList activeNav={activeNav} setActiveNav={setActiveNav} />
        </Box>
        <Box sx={{ p: 2, borderTop: '1px solid #e5e7eb' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src="https://avatar.iran.liara.run/public/boy?username=admin"
              sx={{ width: 40, height: 40, bgcolor: '#fecaca' }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                R.L. Admin
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
                Super Admin
              </Typography>
            </Box>
            <ExpandMoreIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
          </Stack>
        </Box>
      </Box>

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
          <BrandLogo size="sm" />
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
            <BrandLogo size="md" />
            <ApprovalsBell items={pendingApprovalsData} onJump={setActiveNav} compact />
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {activeNav !== 'Overview' && PAGE_MAP[activeNav] ? (
            <Suspense fallback={<Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>}>
              {React.createElement(PAGE_MAP[activeNav])}
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
                    Hey Admin 👑
                  </Typography>
                  <Typography
                    sx={{ fontSize: 24, fontWeight: 800, color: '#111827', mt: 0.5 }}
                  >
                    Admin Overview
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: '#6b7280', mt: 0.5 }}>
                    Real-time control across operations
                  </Typography>
                </Box>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2 }}>
                  <ApprovalsBell items={pendingApprovalsData} onJump={setActiveNav} />
                </Stack>
              </Stack>
            </Box>
          </Box>

          {/* Mobile inline greeting */}
          <Box sx={{ display: { xs: 'block', lg: 'none' }, px: 2, pt: 1.5, pb: 1.5 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ fontSize: 18, fontWeight: 800, color: '#9f1239', lineHeight: 1.1 }}
              >
                Hey Admin 👑
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.5 }}>
                Real-time control across operations
              </Typography>
            </Box>
          </Box>

          <Box sx={{ p: { xs: 2, lg: 4 } }}>
            {/* Stats */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                gap: { xs: 1.5, lg: 3 },
                mb: { xs: 3, lg: 4 },
              }}
            >
              {STATS_LIVE.map(({ label, value, sub, trend, Icon, iconBg, iconColor }) => (
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
                      fontSize: { xs: 20, lg: 26 },
                      fontWeight: 800,
                      color: '#111827',
                      mb: 0.4,
                    }}
                  >
                    {value}
                  </Typography>
                  <Stack direction="row" sx={{ alignItems: 'center', gap: 0.4 }}>
                    {trend === 'up' ? (
                      <TrendingUpIcon sx={{ fontSize: 13, color: '#16a34a' }} />
                    ) : (
                      <TrendingDownIcon sx={{ fontSize: 13, color: '#dc2626' }} />
                    )}
                    <Typography
                      sx={{
                        fontSize: { xs: 10, lg: 11.5 },
                        fontWeight: 600,
                        color: trend === 'up' ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {sub}
                    </Typography>
                  </Stack>
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
                <RevenueChart data={unitsByDay} />

                <Box sx={cardSx}>
                  <SectionHeader title="Top Products (Last 30 Days)" />
                  <Stack sx={{ p: 3, gap: 1.5 }}>
                    {topProductsData.length === 0 ? (
                      <Typography sx={{ fontSize: 12.5, color: '#6b7280', textAlign: 'center', py: 1 }}>
                        No sales recorded in the last 30 days.
                      </Typography>
                    ) : topProductsData.map((p) => (
                      <Stack
                        key={p.name}
                        direction="row"
                        sx={{
                          alignItems: 'center',
                          gap: 2,
                          px: 2,
                          py: 1.4,
                          bgcolor: '#f9fafb',
                          borderRadius: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: 36,
                            height: 50,
                            bgcolor: p.color + '20',
                            borderRadius: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Box
                            sx={{
                              width: 14,
                              height: 34,
                              borderRadius: 99,
                              bgcolor: p.color,
                            }}
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}
                          >
                            {p.name}
                          </Typography>
                          <Typography sx={{ fontSize: 11.5, color: '#6b7280' }}>
                            {Number(p.sold).toLocaleString('en-IN')} units sold
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={p.growth}
                          icon={
                            p.growth.startsWith('+') ? (
                              <TrendingUpIcon sx={{ fontSize: '14px !important' }} />
                            ) : (
                              <TrendingDownIcon sx={{ fontSize: '14px !important' }} />
                            )
                          }
                          sx={{
                            bgcolor: p.growth.startsWith('+') ? '#dcfce7' : '#fee2e2',
                            color: p.growth.startsWith('+') ? '#15803d' : '#dc2626',
                            fontWeight: 700,
                            fontSize: 11,
                            height: 22,
                            borderRadius: 99,
                            '& .MuiChip-icon': {
                              color: 'inherit',
                              ml: 0.6,
                            },
                          }}
                        />
                      </Stack>
                    ))}
                  </Stack>
                </Box>

                <Box sx={cardSx}>
                  <SectionHeader title="Recent Activity" action="View Audit Log" onClick={() => setActiveNav('Audit Log')} />
                  <Stack sx={{ p: 3, gap: 1.5 }}>
                    {recentActivityData.length === 0 ? (
                      <Typography sx={{ fontSize: 12.5, color: '#6b7280', textAlign: 'center', py: 1 }}>
                        No recent activity yet.
                      </Typography>
                    ) : recentActivityData.map((a) => (
                      <Stack
                        key={a.id}
                        direction="row"
                        sx={{ alignItems: 'center', gap: 2 }}
                      >
                        <Avatar
                          src={`https://avatar.iran.liara.run/public/boy?username=${a.who}`}
                          sx={{ width: 34, height: 34, bgcolor: '#e5e7eb' }}
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }}
                          >
                            {a.who}{' '}
                            <Box
                              component="span"
                              sx={{ fontWeight: 400, color: '#6b7280' }}
                            >
                              — {a.action}
                            </Box>
                          </Typography>
                          <Typography sx={{ fontSize: 11, color: '#9ca3af' }}>
                            {fmtTimeAgo(a.when)}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={a.role}
                          sx={{
                            bgcolor: a.tagBg,
                            color: a.tagColor,
                            fontWeight: 700,
                            fontSize: 10.5,
                            height: 22,
                            borderRadius: 99,
                          }}
                        />
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </Stack>

              <Stack sx={{ gap: 3 }}>
                <TeamSplit data={teamSplitData} />
                <PendingApprovals data={pendingApprovalsData} />
                <AdminControls />
              </Stack>
            </Box>

            {/* Mobile Layout */}
            <Stack sx={{ display: { xs: 'flex', lg: 'none' }, gap: 2, pb: 10 }}>
              <RevenueChart mobile data={unitsByDay} />
              <TeamSplit mobile data={teamSplitData} />

              <Box sx={cardSx}>
                <SectionHeader title="Recent Activity" mobile />
                <Stack sx={{ p: 2, gap: 1.4 }}>
                  {recentActivityData.length === 0 ? (
                    <Typography sx={{ fontSize: 12, color: '#6b7280', textAlign: 'center', py: 1 }}>
                      No recent activity yet.
                    </Typography>
                  ) : recentActivityData.slice(0, 4).map((a) => (
                    <Stack
                      key={a.id}
                      direction="row"
                      sx={{ alignItems: 'center', gap: 1.5 }}
                    >
                      <Avatar
                        src={`https://avatar.iran.liara.run/public/boy?username=${a.who}`}
                        sx={{ width: 32, height: 32 }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}
                        >
                          {a.who}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: '#6b7280',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {a.action}
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={a.role}
                        sx={{
                          bgcolor: a.tagBg,
                          color: a.tagColor,
                          fontWeight: 700,
                          fontSize: 10,
                          height: 20,
                          borderRadius: 99,
                        }}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <Box sx={cardSx}>
                <SectionHeader title="Top Products" mobile />
                <Stack sx={{ p: 2, gap: 1.4 }}>
                  {topProductsData.length === 0 ? (
                    <Typography sx={{ fontSize: 12, color: '#6b7280', textAlign: 'center', py: 1 }}>
                      No sales recorded.
                    </Typography>
                  ) : topProductsData.slice(0, 3).map((p) => (
                    <Stack key={p.name} direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 44,
                          bgcolor: p.color + '20',
                          borderRadius: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 30,
                            borderRadius: 99,
                            bgcolor: p.color,
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: '#111827' }}>
                          {p.name}
                        </Typography>
                        <Typography sx={{ fontSize: 11, color: '#6b7280' }}>
                          {Number(p.sold).toLocaleString('en-IN')} units
                        </Typography>
                      </Box>
                      <Chip
                        size="small"
                        label={p.growth}
                        sx={{
                          bgcolor: p.growth.startsWith('+') ? '#dcfce7' : '#fee2e2',
                          color: p.growth.startsWith('+') ? '#15803d' : '#dc2626',
                          fontWeight: 700,
                          fontSize: 10.5,
                          height: 20,
                          borderRadius: 99,
                        }}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Box>

              <PendingApprovals mobile data={pendingApprovalsData} />
              <AdminControls mobile />
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
              const mappedName = MOBILE_TO_NAV[name];
              const isActive = mappedName && mappedName === activeNav;
              return (
                <Box
                  key={name}
                  onClick={() => {
                    if (name === 'More') setMobileMenuOpen(true);
                    else if (mappedName) setActiveNav(mappedName);
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
                      bgcolor: isActive ? ACCENT_BG : 'transparent',
                      display: 'flex',
                    }}
                  >
                    <Icon sx={{ fontSize: 20, color: isActive ? ACCENT : '#9ca3af' }} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: isActive ? ACCENT : '#6b7280',
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
