import React, { useState, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
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
  LinearProgress,
  Popover,
  Divider,
} from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import { useAuth } from '../../context/AuthContext';
import { avatarSrcFor } from '../../utils/avatar';

const SupplyRecords = lazy(() => import('./pages/SupplyRecords'));
const StockInventory = lazy(() => import('./pages/StockInventory'));
const StockAdjustment = lazy(() => import('./pages/StockAdjustment'));
const SettingsPage = lazy(() => import('./pages/Settings'));

const PAGE_MAP = {
  'Supply Records': SupplyRecords,
  'Stock Inventory': StockInventory,
  'Stock Adjustment': StockAdjustment,
  Settings: SettingsPage,
};

// URL slug per nav entry. Empty string = index route (/counter).
const NAV_TO_SLUG = {
  Dashboard: '',
  'Supply Records': 'supply',
  'Stock Inventory': 'stock',
  'Stock Adjustment': 'adjust',
  Settings: 'settings',
};
const SLUG_TO_NAV = Object.fromEntries(
  Object.entries(NAV_TO_SLUG).map(([k, v]) => [v, k])
);

// Mobile bottom-nav names map to full nav item names
const MOBILE_TO_NAV = {
  Dashboard: 'Dashboard',
  Stock: 'Stock Inventory',
  Issue: 'Stock Adjustment',
};

const ACCENT = '#7c3aed'; // purple
const ACCENT_BG = '#f3e8ff';

const NAV_ITEMS = [
  { name: 'Dashboard', Icon: HomeOutlinedIcon },
  { name: 'Supply Records', Icon: Inventory2OutlinedIcon },
  { name: 'Stock Inventory', Icon: Inventory2RoundedIcon },
  { name: 'Stock Adjustment', Icon: LocalShippingOutlinedIcon },
  { name: 'Settings', Icon: SettingsOutlinedIcon },
];

const MOBILE_NAV_ITEMS = [
  { name: 'Dashboard', Icon: HomeOutlinedIcon },
  { name: 'Stock', Icon: Inventory2RoundedIcon },
  { name: 'Issue', Icon: LocalShippingOutlinedIcon },
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
        alt="R.L. Traders Counter"
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
              bgcolor: isActive ? ACCENT_BG : 'transparent',
              color: isActive ? ACCENT : '#374151',
              '&:hover': { bgcolor: isActive ? ACCENT_BG : '#f9fafb' },
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

function SectionHeader({ title, action, mobile, onActionClick }) {
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
        sx={{ fontSize: mobile ? 14 : 16, fontWeight: 600, color: '#111827' }}
      >
        {title}
      </Typography>
      {action && (
        React.isValidElement(action) ? (
          action
        ) : (
          <Button
            size="small"
            onClick={onActionClick}
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

const NOTIF_SEEN_KEY = 'counter.notifSeenAt';

function NotificationsBell() {
  const [items, setItems] = React.useState([]);
  const [seenAt, setSeenAt] = React.useState(() => {
    try { return localStorage.getItem(NOTIF_SEEN_KEY) || ''; } catch { return ''; }
  });
  const [anchor, setAnchor] = React.useState(null);

  const reload = React.useCallback(async () => {
    try {
      const mod = await import('../../api/stockAdjustments');
      const all = await mod.listStockAdjustments();
      const reviewed = all
        .filter((a) => a.status === 'approved' || a.status === 'rejected')
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
        sx={{ bgcolor: '#fff', border: '1px solid #ddd6fe', '&:hover': { bgcolor: ACCENT_BG } }}
      >
        <Badge badgeContent={unread} color="error" overlap="circular">
          <NotificationsNoneIcon sx={{ color: ACCENT }} />
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
            Admin reviews of your stock requests
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
                      Request {approved ? 'approved' : 'rejected'}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: '#6b7280' }} noWrap>
                      {(a.items || []).map((it) => `${it.type === 'add' ? '+' : '−'}${it.qty} ${it.name}`).join(', ')}
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

function OverviewBody({ onNavigate }) {
  const [products, setProducts] = React.useState([]);
  const [sales, setSales] = React.useState([]);
  const [adjustments, setAdjustments] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, s, a] = await Promise.all([
          import('../../api/products').then((m) => m.listProducts()),
          import('../../api/counterSales').then((m) => m.listCounterSales()),
          import('../../api/stockAdjustments').then((m) => m.listStockAdjustments()),
        ]);
        if (!alive) return;
        setProducts(p); setSales(s); setAdjustments(a);
      } catch (e) {
        if (alive) setError(e.message || 'Failed to load');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const today = new Date().toDateString();
  const todaySales = sales.filter((s) => new Date(s.soldAt).toDateString() === today);
  const todayUnits = todaySales.reduce((sum, s) => sum + (s.totalUnits || 0), 0);
  const totalUnitsInStock = products.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const lowStockItems = products
    .filter((p) => Number(p.minStock || 0) > 0 && Number(p.stock || 0) < Number(p.minStock || 0))
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
  const pendingAdj = adjustments.filter((a) => a.status === 'pending');
  const recentSales = sales.slice(0, 5);

  const stats = [
    { label: "Today's Sales", value: todaySales.length, sub: 'Customer orders', Icon: StorefrontOutlinedIcon, iconBg: '#f3e8ff', iconColor: '#7c3aed' },
    { label: 'Units Sold Today', value: todayUnits, sub: 'Stock dispatched', Icon: LocalShippingOutlinedIcon, iconBg: '#dbeafe', iconColor: '#2563eb' },
    { label: 'Stock On Hand', value: totalUnitsInStock.toLocaleString(), sub: `${products.length} SKUs`, Icon: Inventory2OutlinedIcon, iconBg: '#dcfce7', iconColor: '#15803d' },
    { label: 'Low Stock', value: lowStockItems.length, sub: 'Items below min', Icon: WarningAmberOutlinedIcon, iconBg: '#fee2e2', iconColor: '#dc2626' },
  ];

  const quickActions = [
    { label: 'New Sale', target: 'Supply Records', Icon: AddIcon, bg: '#f3e8ff', hover: '#ede9fe', dotBg: '#7c3aed', text: '#6d28d9' },
    { label: 'Stock Inventory', target: 'Stock Inventory', Icon: Inventory2RoundedIcon, bg: '#eff6ff', hover: '#dbeafe', dotBg: '#3b82f6', text: '#1d4ed8' },
    { label: 'Stock Adjustment', target: 'Stock Adjustment', Icon: LocalShippingOutlinedIcon, bg: '#fff7ed', hover: '#ffedd5', dotBg: '#f97316', text: '#c2410c' },
  ];

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, lg: 4 } }}>
        <Stack sx={{ alignItems: 'center', py: 6 }}><CircularProgress size={28} /></Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, lg: 4 } }}>
      {error && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#fee2e2', color: '#b91c1c', borderRadius: 2, fontSize: 13 }}>
          {error}
        </Box>
      )}

      {/* Stats Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: { xs: 1.5, lg: 3 },
          mb: { xs: 3, lg: 4 },
        }}
      >
        {stats.map(({ label, value, sub, Icon, iconBg, iconColor }) => (
          <Box key={label} sx={{ ...cardSx, p: { xs: 2, lg: 3 } }}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: { xs: 1.5, lg: 2 } }}>
              <Typography sx={{ fontSize: { xs: 11, lg: 13 }, color: '#4b5563' }}>{label}</Typography>
              <Box sx={{ width: { xs: 32, lg: 40 }, height: { xs: 32, lg: 40 }, bgcolor: iconBg, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon sx={{ fontSize: { xs: 16, lg: 20 }, color: iconColor }} />
              </Box>
            </Stack>
            <Typography sx={{ fontSize: { xs: 22, lg: 28 }, fontWeight: 700, color: '#111827', mb: 0.4 }}>{value}</Typography>
            <Typography sx={{ fontSize: { xs: 10, lg: 11.5 }, color: '#6b7280' }}>{sub}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: { xs: 2, lg: 3 } }}>
        <Stack sx={{ gap: { xs: 2, lg: 3 } }}>
          {/* Recent Sales */}
          <Box sx={cardSx}>
            <SectionHeader
              title="Recent Sales"
              action={recentSales.length > 0 ? 'View All' : undefined}
              onActionClick={() => onNavigate('Supply Records')}
            />
            {recentSales.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
                  No sales yet today. Start by recording a customer sale.
                </Typography>
                <Button
                  size="small" startIcon={<AddIcon />}
                  onClick={() => onNavigate('Supply Records')}
                  sx={{ mt: 1.5, bgcolor: ACCENT, color: '#fff', textTransform: 'none', '&:hover': { bgcolor: '#6d28d9' } }}
                >
                  New Sale
                </Button>
              </Box>
            ) : (
              <Stack sx={{ p: { xs: 2, lg: 3 }, gap: 1.5 }}>
                {recentSales.map((s) => (
                  <Stack key={s.id} direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, bgcolor: '#f3e8ff', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <StorefrontOutlinedIcon sx={{ fontSize: 18, color: ACCENT }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }} noWrap>
                        {s.customer?.name || '—'}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: '#6b7280' }} noWrap>
                        {(s.items || []).map((it) => `${it.name} × ${it.qty}`).join(', ')}
                      </Typography>
                    </Box>
                    <Stack sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
                      <Chip size="small" label={`${s.totalUnits}u`} sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, height: 22 }} />
                      <Typography sx={{ fontSize: 10.5, color: '#9ca3af', mt: 0.4 }}>
                        {new Date(s.soldAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Box>

          {/* Pending Approvals */}
          {pendingAdj.length > 0 && (
            <Box sx={cardSx}>
              <SectionHeader
                title={`Pending Approvals (${pendingAdj.length})`}
                action="View"
                onActionClick={() => onNavigate('Stock Adjustment')}
              />
              <Stack sx={{ p: { xs: 2, lg: 3 }, gap: 1.2 }}>
                {pendingAdj.slice(0, 5).map((a) => (
                  <Stack key={a.id} direction="row" sx={{ alignItems: 'center', gap: 1.5, px: 1.5, py: 1.2, bgcolor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 2 }}>
                    <Box sx={{ width: 32, height: 32, bgcolor: '#fef3c7', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <WarningAmberOutlinedIcon sx={{ fontSize: 18, color: '#b45309' }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }} noWrap>
                        {a.reason || 'Stock adjustment'}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: '#6b7280' }} noWrap>
                        {(a.items || []).map((it) => `${it.type === 'add' ? '+' : '−'}${it.qty} ${it.name}`).join(', ')}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>

        <Stack sx={{ gap: { xs: 2, lg: 3 } }}>
          {/* Low Stock */}
          <Box sx={cardSx}>
            <SectionHeader
              title="Low Stock"
              action={lowStockItems.length > 0 ? 'Manage' : undefined}
              onActionClick={() => onNavigate('Stock Inventory')}
            />
            {lowStockItems.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography sx={{ fontSize: 13, color: '#6b7280' }}>
                  All stock levels healthy.
                </Typography>
              </Box>
            ) : (
              <Stack sx={{ p: { xs: 2, lg: 3 }, gap: 2 }}>
                {lowStockItems.slice(0, 5).map((p) => {
                  const stock = Number(p.stock || 0);
                  const min = Number(p.minStock || 0);
                  const pct = Math.min(100, Math.round((stock / Math.max(min * 2, 1)) * 100));
                  return (
                    <Box key={p.id}>
                      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.6 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }} noWrap>
                          {p.name}
                        </Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#dc2626', flexShrink: 0, ml: 1 }}>
                          {stock} / min {min}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        sx={{
                          height: 6, borderRadius: 99, bgcolor: '#f3f4f6',
                          '& .MuiLinearProgress-bar': { bgcolor: '#dc2626', borderRadius: 99 },
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Box>

          {/* Quick Actions */}
          <Box sx={cardSx}>
            <SectionHeader title="Quick Actions" />
            <Stack sx={{ p: { xs: 2, lg: 3 }, gap: 1.2 }}>
              {quickActions.map(({ label, target, Icon, bg, hover, dotBg, text }) => (
                <Stack
                  key={label}
                  direction="row"
                  onClick={() => onNavigate(target)}
                  sx={{
                    alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
                    bgcolor: bg, borderRadius: 2, cursor: 'pointer',
                    '&:hover': { bgcolor: hover },
                  }}
                >
                  <Box sx={{ width: 32, height: 32, bgcolor: dotBg, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon sx={{ fontSize: 18, color: '#fff' }} />
                  </Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: text }}>{label}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export default function CounterDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const routerNavigate = useNavigate();
  const slug = (location.pathname.replace(/^\/counter\/?/, '').split('/')[0] || '').toLowerCase();
  const activeNav = SLUG_TO_NAV[slug] || 'Dashboard';
  const setActiveNav = (name) => {
    const s = NAV_TO_SLUG[name] ?? '';
    routerNavigate(`/counter${s ? `/${s}` : ''}`);
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#fbf7ff' }}>
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
              src={avatarSrcFor(user)}
              sx={{ width: 40, height: 40, bgcolor: '#d1d5db' }}
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#111827' }} noWrap>
                {user?.name || 'Counter Operator'}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#6b7280' }} noWrap>
                {user?.phone || 'Supply Desk'}
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
              sx={{ bgcolor: 'transparent', '&:hover': { bgcolor: ACCENT_BG } }}
            >
              <MenuIcon sx={{ color: ACCENT }} />
            </IconButton>
            <BrandLogo size="md" />
            <NotificationsBell />
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {activeNav !== 'Dashboard' && PAGE_MAP[activeNav] ? (
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
                  'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #f3e8ff 100%)',
                border: '1px solid #ddd6fe',
                boxShadow: '0 4px 14px rgba(124,58,237,0.06)',
              }}
            >
              <Stack
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}
              >
                <Box>
                  <Typography sx={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>
                    Hey {user?.name?.split(' ')[0] || 'Counter'} 👋
                  </Typography>
                  <Typography
                    sx={{ fontSize: 24, fontWeight: 800, color: '#111827', mt: 0.5 }}
                  >
                    Counter Dashboard
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: '#6b7280', mt: 0.5 }}>
                    Manage supply, stock & issues
                  </Typography>
                </Box>
                <Stack direction="row" sx={{ alignItems: 'center', gap: 1.2 }}>
                  <NotificationsBell />
                </Stack>
              </Stack>
            </Box>
          </Box>

          {/* Mobile inline greeting */}
          <Box sx={{ display: { xs: 'block', lg: 'none' }, px: 2, pt: 1.5, pb: 1.5 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ fontSize: 18, fontWeight: 800, color: ACCENT, lineHeight: 1.1 }}
              >
                Hey {user?.name?.split(' ')[0] || 'Counter'} 👋
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: '#6b7280', mt: 0.5 }}>
                Manage supply, stock & issues
              </Typography>
            </Box>
          </Box>

          <OverviewBody onNavigate={setActiveNav} />
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
                    <Icon
                      sx={{ fontSize: 20, color: isActive ? ACCENT : '#9ca3af' }}
                    />
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
