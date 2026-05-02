// Centralized role configuration. Each module imports from here.
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

export const ROLES = {
  admin: {
    key: 'admin',
    label: 'Admin',
    shortLabel: 'Admin',
    color: '#e11d48',
    authType: 'password',
    redirect: '/admin',
    Icon: AdminPanelSettingsIcon,
  },
  counter: {
    key: 'counter',
    label: 'Counter Supply',
    shortLabel: 'Counter',
    color: '#a855f7',
    authType: 'pin',
    redirect: '/counter',
    Icon: PointOfSaleIcon,
  },
  delivery: {
    key: 'delivery',
    label: 'Delivery',
    shortLabel: 'Delivery',
    color: '#ec4899',
    authType: 'pin',
    redirect: '/delivery',
    Icon: LocalShippingIcon,
  },
};

export const ROLE_LIST = Object.values(ROLES);
