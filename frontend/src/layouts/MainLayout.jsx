import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiLogOut, FiBell, FiMenu } from "react-icons/fi";
import { useAuth } from "../hooks/useAuth";
import { getSidebarLinks, ROLES } from "../utils/roleGuard";
import axiosInstance from "../utils/axiosInstance";
import ConfirmDialog from "../components/Modal/ConfirmDialog";
import "./MainLayout.css";

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const MainLayout = ({ children }) => {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(
    () => window.innerWidth >= 1024,
  );
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => new Set());

  const links = getSidebarLinks(role);

  const canSeeOrders = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.WAITER,
  ].includes(role);

  const canSeeInventory = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.MANAGER,
    ROLES.KITCHEN_STAFF,
  ].includes(role);

  const fetchNotifications = useCallback(async () => {
    try {
      const requests = [];

      requests.push(
        canSeeOrders
          ? axiosInstance
              .get("/api/orders/status/Pending")
              .catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
      );

      requests.push(
        canSeeInventory
          ? axiosInstance
              .get("/api/inventory/low-stock")
              .catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
      );

      requests.push(
        role === ROLES.CASHIER
          ? axiosInstance
              .get("/api/orders/status/Ready")
              .catch(() => ({ data: { data: [] } }))
          : Promise.resolve({ data: { data: [] } }),
      );

      const [pendingRes, lowStockRes, readyForBillingRes] =
        await Promise.all(requests);
      const pendingOrders = pendingRes.data.data || [];
      const lowStockItems = lowStockRes.data.data || [];
      const readyOrders = readyForBillingRes.data.data || [];

      const orderNotifs = pendingOrders.map((o) => ({
        id: `order-${o.id}`,
        message: `New order from Table ${o.tableNumber}`,
        time: timeAgo(o.createdAt),
        rawTime: o.createdAt,
        type: "order",
      }));

      const inventoryNotifs = lowStockItems.map((item) => ({
        id: `inventory-${item.id}`,
        message: `Inventory low: ${item.name} (${item.currentStock}${item.unit ? " " + item.unit : ""} left)`,
        time: timeAgo(item.lastUpdated || item.createdAt || new Date()),
        rawTime: item.lastUpdated || item.createdAt || new Date().toISOString(),
        type: "inventory",
      }));

      const billingNotifs = readyOrders.map((o) => ({
        id: `billing-${o.id}`,
        message: `Table ${o.tableNumber} is ready for billing`,
        time: timeAgo(o.createdAt),
        rawTime: o.createdAt,
        type: "payment",
      }));

      const combined = [...orderNotifs, ...inventoryNotifs, ...billingNotifs]
        .filter((n) => !dismissedIds.has(n.id))
        .sort((a, b) => new Date(b.rawTime) - new Date(a.rawTime));

      setNotifications(combined);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [canSeeOrders, canSeeInventory, role, dismissedIds]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleClearAll = () => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
    setNotifications([]);
  };

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

      {sidebarOpen && window.innerWidth < 1024 && window.innerWidth >= 768 && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}
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
          <div className="topbar-right">
            <div className="topbar-notifications">
              <button
                className="topbar-icon-btn notif-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <FiBell size={20} />
                {notifications.length > 0 && (
                  <span className="notification-badge">
                    {notifications.length}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3>Notifications</h3>
                    <button
                      className="notifications-clear"
                      onClick={handleClearAll}
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
