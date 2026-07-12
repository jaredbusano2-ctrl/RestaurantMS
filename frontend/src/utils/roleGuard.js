import {
  FiBarChart2,
  FiUsers,
  FiShoppingCart,
  FiCreditCard,
  FiPackage,
  FiTrendingUp,
} from 'react-icons/fi';
import { MdRestaurant, MdChair, MdKitchen } from 'react-icons/md';

// Icon mappings for sidebar
const FiBarChart3 = FiBarChart2;
const FiUtensilsCrossed = MdRestaurant;
const FiChair = MdChair;
const FiChef = MdKitchen;

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
    { path: '/dashboard', label: 'Dashboard', icon: FiBarChart3 },
    { path: '/users', label: 'User Management', icon: FiUsers, roles: [ROLES.SUPER_ADMIN] },
    { path: '/menu', label: 'Menu Management', icon: FiUtensilsCrossed, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER] },
    { path: '/tables', label: 'Tables', icon: FiChair, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.WAITER, ROLES.MANAGER] },
    { path: '/orders', label: 'Orders', icon: FiShoppingCart, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.WAITER] },
    { path: '/kitchen', label: 'Kitchen Display', icon: FiChef, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.KITCHEN_STAFF] },
    { path: '/billing', label: 'Billing & POS', icon: FiCreditCard, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.CASHIER] },
    { path: '/inventory', label: 'Inventory', icon: FiPackage, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.KITCHEN_STAFF] },
    { path: '/reports', label: 'Reports', icon: FiTrendingUp, roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER] },
  ];

  return all.filter(link => !link.roles || link.roles.includes(role));
};