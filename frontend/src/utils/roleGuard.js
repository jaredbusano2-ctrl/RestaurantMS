export const ROLES = {
  SUPER_ADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  WAITER: 'Waiter',
  CASHIER: 'Cashier',
  KITCHEN_STAFF: 'KitchenStaff',
};

export const hasRole = (userRole, allowedRoles) => {
  return allowedRoles.includes(userRole);
};

export const getDefaultRoute = (role) => {
  switch (role) {
    case ROLES.KITCHEN_STAFF: return '/kitchen';
    case ROLES.CASHIER: return '/billing';
    case ROLES.WAITER: return '/orders';
    default: return '/dashboard';
  }
};

export const getSidebarLinks = (role) => {
  const all = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/users', label: 'User Management', icon: '👥', roles: [ROLES.SUPER_ADMIN] },
    { path: '/menu', label: 'Menu Management', icon: '🍽️', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER] },
    { path: '/tables', label: 'Tables', icon: '🪑', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAITER] },
    { path: '/orders', label: 'Orders', icon: '📋', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.WAITER, ROLES.CASHIER] },
    { path: '/kitchen', label: 'Kitchen Display', icon: '👨‍🍳', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.KITCHEN_STAFF] },
    { path: '/billing', label: 'Billing & POS', icon: '💳', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CASHIER] },
    { path: '/inventory', label: 'Inventory', icon: '📦', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.KITCHEN_STAFF] },
    { path: '/reports', label: 'Reports', icon: '📈', roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER] },
  ];

  return all.filter(link => !link.roles || link.roles.includes(role));
};