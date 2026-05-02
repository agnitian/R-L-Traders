// Mock delivery data — replace with API later.
export const TODAY_SUMMARY = {
  trips: 4,
  delivered: 1850,
  returns: 150,
};

export const TRIPS = [
  {
    id: 't1',
    shop: 'Sharma Kirana Store',
    address: 'MG Road, Sector 7',
    time: '10:30 AM',
    status: 'completed', // completed | pending | in_progress
    products: [
      { id: 'p1', name: 'Campa Cola 600ml', given: 120, delivered: 110, returned: 10 },
      { id: 'p2', name: 'Campa Orange 600ml', given: 100, delivered: 95, returned: 5 },
      { id: 'p3', name: 'Campa Lemon 600ml', given: 80, delivered: 75, returned: 5 },
    ],
  },
  {
    id: 't2',
    shop: 'Verma General Store',
    address: 'Civil Lines, Block C',
    time: '11:45 AM',
    status: 'in_progress',
    products: [
      { id: 'p1', name: 'Campa Cola 600ml', given: 150, delivered: 0, returned: 0 },
      { id: 'p2', name: 'Campa Orange 600ml', given: 80, delivered: 0, returned: 0 },
    ],
  },
  {
    id: 't3',
    shop: 'Gupta Provision',
    address: 'Market Road, Lane 4',
    time: '1:15 PM',
    status: 'pending',
    products: [
      { id: 'p1', name: 'Campa Cola 600ml', given: 100, delivered: 0, returned: 0 },
    ],
  },
  {
    id: 't4',
    shop: 'Mehra Super Mart',
    address: 'Ring Road, Phase 2',
    time: '3:00 PM',
    status: 'pending',
    products: [
      { id: 'p1', name: 'Campa Cola 600ml', given: 200, delivered: 0, returned: 0 },
      { id: 'p2', name: 'Campa Orange 600ml', given: 120, delivered: 0, returned: 0 },
    ],
  },
];

export const PRODUCTS_TO_DELIVER = [
  { id: 'p1', name: 'Campa Cola 600ml', units: 350 },
  { id: 'p2', name: 'Campa Orange 600ml', units: 250 },
  { id: 'p3', name: 'Campa Lemon 600ml', units: 80 },
];

export const STATUS_META = {
  completed: { label: 'Completed', color: '#16a34a', bg: '#dcfce7', dot: '🟢' },
  in_progress: { label: 'In Progress', color: '#2563eb', bg: '#dbeafe', dot: '🔵' },
  pending: { label: 'Pending', color: '#ca8a04', bg: '#fef3c7', dot: '🟡' },
};

export const DELIVERY_GRADIENT = 'linear-gradient(135deg, #7c3aed, #ef4444)';
