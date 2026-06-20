import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getSidebarLinks } from '../utils/roleGuard';
import './MainLayout.css';

const MainLayout = ({ children }) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const links = getSidebarLinks(role);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (r) => {
    const colors = {
      SuperAdmin: '#6b7280',
      Admin: '#dc2626',
      Manager: '#7c3aed',
      Waiter: '#ea580c',
      Cashier: '#2563eb',
      KitchenStaff: '#16a34a',
    };
    return colors[r] || '#6b7280';
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <div className={`layout-wrapper ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">F</div>
          <div className="sidebar-brand">
            <span className="brand-name">FlavorRush</span>
            <span className="brand-sub">ERP System</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`sidebar-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{link.icon}</span>
              <span className="sidebar-label">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogout}>
            <span className="sidebar-icon">🚪</span>
            <span className="sidebar-label">Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="layout-main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <span className="topbar-branch-label">{user?.branch}</span>
          </div>
          <div className="topbar-center">
            <div className="topbar-search">
              <span>🔍</span>
              <input type="text" placeholder="Search..." />
            </div>
          </div>
          <div className="topbar-right">
            <button className="notif-btn">🔔</button>
            <div className="topbar-user">
              <div className="topbar-avatar" style={{ background: getRoleBadgeColor(role) }}>
                {getInitials(user?.fullName)}
              </div>
              <div className="topbar-user-info">
                <span className="topbar-name">{user?.fullName}</span>
                <span className="topbar-branch">{user?.branch}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;