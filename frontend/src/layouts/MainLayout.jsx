import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiLogOut, FiSearch, FiBell, FiMenu } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { getSidebarLinks } from "../utils/roleGuard";
import ConfirmDialog from "../components/Modal/ConfirmDialog";
import "./MainLayout.css";

const MainLayout = ({ children }) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      message: "New order from Table 5",
      time: "5 min ago",
      type: "order",
    },
    {
      id: 2,
      message: "Inventory low: Chicken",
      time: "15 min ago",
      type: "inventory",
    },
    {
      id: 3,
      message: "Payment pending at Table 8",
      time: "30 min ago",
      type: "payment",
    },
  ]);

  const links = getSidebarLinks(role);

  const handleLogoutClick = () => setLogoutConfirm(true);
  const handleConfirmLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleBadgeStyle = (r) => {
    const styles = {
      SuperAdmin: "#6b7280",
      Admin: "#dc2626",
      Manager: "#7c3aed",
      Waiter: "#f97316",
      Cashier: "#2563eb",
      KitchenStaff: "#16a34a",
    };
    return styles[r] || "#6b7280";
  };

  const getInitials = (name) =>
    name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  return (
    <div
      className={`layout-wrapper ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
    >
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">🍽️</div>
          <div className="sidebar-brand">
            <span className="brand-name">FlavorRush</span>
            <span className="brand-sub">Management System</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => {
            const IconComponent = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={() =>
                  window.innerWidth < 1024 && setSidebarOpen(false)
                }
              >
                <div className="sidebar-link-content">
                  <div className="sidebar-icon-wrapper">
                    <IconComponent className="sidebar-icon" size={20} />
                    {isActive && <div className="sidebar-active-indicator" />}
                  </div>
                  <span className="sidebar-label">{link.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout" onClick={handleLogoutClick}>
            <FiLogOut size={20} className="logout-icon" />
            <span className="sidebar-label">Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="layout-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <FiMenu size={24} />
            </button>
            {user?.branch && (
              <span className="topbar-branch-label">{user.branch}</span>
            )}
          </div>

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
            <div className="topbar-notifications">
              <button
                className="topbar-icon-btn notif-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <FiBell size={20} />
                <span className="notification-badge">
                  {notifications.length}
                </span>
              </button>

              {notificationsOpen && (
                <div className="notifications-dropdown">
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
                          <div
                            className={`notification-dot notification-${notif.type}`}
                          ></div>
                          <div className="notification-content">
                            <p className="notification-message">
                              {notif.message}
                            </p>
                            <span className="notification-time">
                              {notif.time}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="notifications-empty">
                        <p>No notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

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
        </header>

        <main className="layout-content">{children}</main>
      </div>

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
