import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLogOut, FiSearch, FiBell, FiMenu, FiX, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../hooks/useAuth';
import { getSidebarLinks } from '../utils/roleGuard';
import ConfirmDialog from '../components/Modal/ConfirmDialog';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New order from Table 5', time: '5 min ago', type: 'order' },
    { id: 2, message: 'Inventory low: Chicken', time: '15 min ago', type: 'inventory' },
    { id: 3, message: 'Payment pending at Table 8', time: '30 min ago', type: 'payment' },
  ]);

  const links = getSidebarLinks(role);

  const handleLogoutClick = () => {
    setLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (r) => {
    const colors = {
      SuperAdmin: 'badge-info',
      Admin: 'badge-error',
      Manager: 'badge-accent',
      Waiter: 'badge-warning',
      Cashier: 'badge-secondary',
      KitchenStaff: 'badge-success',
    };
    return colors[r] || 'badge-info';
  };

  const getRoleBadgeStyle = (r) => {
    const styles = {
      SuperAdmin: '#6b7280',
      Admin: '#dc2626',
      Manager: '#7c3aed',
      Waiter: '#f97316',
      Cashier: '#2563eb',
      KitchenStaff: '#16a34a',
    };
    return styles[r] || '#6b7280';
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  // Animation variants
  const sidebarVariants = {
    open: { x: 0, transition: { type: 'spring', damping: 20, stiffness: 300 } },
    closed: { x: '-100%', transition: { type: 'spring', damping: 20, stiffness: 300 } },
  };

  const linkVariants = {
    hover: { x: 8, transition: { type: 'spring', damping: 20, stiffness: 300 } },
  };

  return (
    <div className={`layout-wrapper ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <motion.aside
        className="sidebar"
        initial={false}
        variants={sidebarVariants}
        animate={sidebarOpen ? 'open' : 'closed'}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <motion.div
            className="sidebar-logo"
            whileHover={{ rotate: 10 }}
            whileTap={{ scale: 0.95 }}
          >
            🍽️
          </motion.div>
          <div className="sidebar-brand">
            <span className="brand-name">FlavorRush</span>
            <span className="brand-sub">Management System</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav">
          {links.map((link, idx) => {
            const IconComponent = link.icon;
            const isActive = location.pathname === link.path;

            return (
              <motion.div key={link.path} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                <Link
                  to={link.path}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => window.innerWidth < 1024 && setSidebarOpen(false)}
                >
                  <motion.div
                    className="sidebar-link-content"
                    variants={linkVariants}
                    whileHover="hover"
                  >
                    <div className="sidebar-icon-wrapper">
                      <IconComponent className="sidebar-icon" size={20} />
                      {isActive && (
                        <motion.div
                          className="sidebar-active-indicator"
                          layoutId="activeIndicator"
                          initial={false}
                        />
                      )}
                    </div>
                    <span className="sidebar-label">{link.label}</span>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <motion.button
            className="sidebar-logout"
            onClick={handleLogoutClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="sidebar-icon-wrapper">
              <FiLogOut size={20} />
            </div>
            <span className="sidebar-label">Sign Out</span>
          </motion.button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="layout-main">
        {/* Topbar */}
        <motion.header
          className="topbar"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="topbar-left">
            <motion.button
              className="hamburger"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </motion.button>
            {user?.branch && (
              <span className="topbar-branch-label">{user.branch}</span>
            )}
          </div>

          {/* Search Bar */}
          <div className="topbar-center">
            <div className="topbar-search">
              <FiSearch size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search orders, items, tables..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="topbar-right">
            {/* Notifications */}
            <div className="topbar-notifications">
              <motion.button
                className="topbar-icon-btn notif-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <FiBell size={20} />
                <span className="notification-badge">{notifications.length}</span>
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    className="notifications-dropdown"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="notifications-header">
                      <h3>Notifications</h3>
                      <button 
                        className="notifications-clear"
                        onClick={() => setNotifications([])}
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="notifications-list">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div key={notif.id} className="notification-item">
                            <div className={`notification-dot notification-${notif.type}`}></div>
                            <div className="notification-content">
                              <p className="notification-message">{notif.message}</p>
                              <span className="notification-time">{notif.time}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="notifications-empty">
                          <p>No notifications</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Info - Display Only */}
            <div className="topbar-user-info-display">
              <div
                className="topbar-avatar"
                style={{ background: getRoleBadgeStyle(role) }}
              >
                {getInitials(user?.fullName)}
              </div>
              <span className="topbar-username">{user?.fullName}</span>
            </div>
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="layout-content">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={logoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of your account?"
        type="logout"
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutConfirm(false)}
        confirmText="Sign Out"
        cancelText="Cancel"
      />
    </div>
  );
};

export default MainLayout;