import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout";
import axiosInstance from "../../utils/axiosInstance";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../utils/roleGuard";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import "./Dashboard.css";

const Dashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    cookingOrders: 0,
    readyOrders: 0,
    availableTables: 0,
    totalTables: 0,
    lowStockItems: 0,
    totalRevenue: 0,
    todayOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const promises = [];

      if (
        [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.WAITER].includes(
          role,
        )
      ) {
        promises.push(
          axiosInstance
            .get("/api/orders")
            .catch(() => ({ data: { data: [] } })),
        );
      } else {
        promises.push(Promise.resolve({ data: { data: [] } }));
      }

      if (
        [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.WAITER].includes(
          role,
        )
      ) {
        promises.push(
          axiosInstance
            .get("/api/tables")
            .catch(() => ({ data: { data: [] } })),
        );
      } else {
        promises.push(Promise.resolve({ data: { data: [] } }));
      }

      if (
        [
          ROLES.SUPER_ADMIN,
          ROLES.ADMIN,
          ROLES.MANAGER,
          ROLES.KITCHEN_STAFF,
        ].includes(role)
      ) {
        promises.push(
          axiosInstance
            .get("/api/inventory/low-stock")
            .catch(() => ({ data: { data: [] } })),
        );
      } else {
        promises.push(Promise.resolve({ data: { data: [] } }));
      }

      if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER].includes(role)) {
        const today = new Date();
        const from = new Date();
        from.setHours(0, 0, 0, 0);
        promises.push(
          axiosInstance
            .get(
              `/api/reports/daily?from=${from.toISOString()}&to=${today.toISOString()}`,
            )
            .catch(() => ({ data: { data: [] } })),
        );
        // ✅ FIXED: was /api/reports/top-items, backend route is /api/reports/items
        promises.push(
          axiosInstance
            .get(
              `/api/reports/items?from=${from.toISOString()}&to=${today.toISOString()}`,
            )
            .catch(() => ({ data: { data: [] } })),
        );
      } else {
        promises.push(Promise.resolve({ data: { data: [] } }));
        promises.push(Promise.resolve({ data: { data: [] } }));
      }

      const [ordersRes, tablesRes, lowStockRes, reportsRes, itemsRes] =
        await Promise.all(promises);

      const orders = ordersRes.data.data || [];
      const tables = tablesRes.data.data || [];
      const lowStock = lowStockRes.data.data || [];
      const reports = reportsRes.data.data || [];
      const items = itemsRes.data.data || [];

      let formattedTopItems = [];
      if (items && items.length > 0) {
        formattedTopItems = items.map((item) => ({
          itemName:
            item.name || item.menuItemName || item.itemName || `Item ${item.id}`,
          totalQuantitySold:
            item.totalSold || item.quantity || item.totalQuantitySold || 0,
          totalRevenue: item.revenue || item.totalRevenue || 0,
        }));
      } else {
        formattedTopItems = getTopItemsFromOrders(orders);
      }

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => o.status === "Pending").length,
        cookingOrders: orders.filter((o) => o.status === "Cooking").length,
        readyOrders: orders.filter((o) => o.status === "Ready").length,
        availableTables: tables.filter((t) => t.status === "Available").length,
        totalTables: tables.length,
        lowStockItems: lowStock.length,
        totalRevenue: reports.reduce(
          (sum, r) => sum + (r.totalRevenue || 0),
          0,
        ),
        todayOrders: reports.reduce((sum, r) => sum + (r.totalOrders || 0), 0),
      });

      setRecentOrders(orders.slice(0, 20));
      setCurrentPage(1);
      setTopItems(formattedTopItems.slice(0, 5));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getTopItemsFromOrders = (orders) => {
    const itemMap = {};

    orders.forEach((order) => {
      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const name = item.menuItemName || item.name || `Item ${item.menuItemId}`;
          if (!itemMap[name]) {
            itemMap[name] = {
              itemName: name,
              totalQuantitySold: 0,
              totalRevenue: 0,
            };
          }
          itemMap[name].totalQuantitySold += item.quantity || 1;
          itemMap[name].totalRevenue += (item.quantity || 1) * (item.unitPrice || 0);
        });
      }
    });

    return Object.values(itemMap)
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
      .slice(0, 10);
  };

  const statusColor = {
    Pending: { bg: "#fef3c7", color: "#92400e" },
    Cooking: { bg: "#dbeafe", color: "#1e40af" },
    Ready: { bg: "#d1fae5", color: "#065f46" },
    Served: { bg: "#f3f4f6", color: "#374151" },
    Cancelled: { bg: "#fee2e2", color: "#991b1b" },
  };

  const isManagerOrAbove = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.MANAGER,
  ].includes(role);
  const isWaiter = role === ROLES.WAITER;
  const isCashier = role === ROLES.CASHIER;
  const isKitchen = role === ROLES.KITCHEN_STAFF;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const totalPages = Math.ceil(recentOrders.length / ordersPerPage);
  const paginatedOrders = recentOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage,
  );

  const PaginationControls = () =>
    totalPages > 1 && (
      <div className="table-pagination">
        <button
          className="pagination-btn"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <i className="ti ti-chevron-left" aria-hidden="true" />
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="pagination-btn"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          <i className="ti ti-chevron-right" aria-hidden="true" />
        </button>
      </div>
    );

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isManagerOrAbove ? "Operations Dashboard" : "My Dashboard"}
          </h1>
          <p className="page-subtitle">
            {getGreeting()}, {user?.fullName?.split(" ")[0]}! &nbsp;·&nbsp;
            {new Date().toLocaleDateString("en-PH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            &nbsp;·&nbsp; {user?.branch}
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchDashboardData}>
          <i className="ti ti-refresh" aria-hidden="true" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading dashboard...</div>
      ) : (
        <>
          {isManagerOrAbove && (
            <>
              <div className="stat-grid">
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: "#fef2f2", color: "#dc2626" }}
                  >
                    <i className="ti ti-cash" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">
                      ₱
                      {stats.totalRevenue.toLocaleString("en-PH", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <span className="stat-label">Today's Revenue</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: "#eff6ff", color: "#2563eb" }}
                  >
                    <i className="ti ti-shopping-cart" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.todayOrders}</span>
                    <span className="stat-label">Orders Today</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: "#f0fdf4", color: "#16a34a" }}
                  >
                    <i className="ti ti-armchair" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">
                      {stats.availableTables}/{stats.totalTables}
                    </span>
                    <span className="stat-label">Tables Available</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{
                      background:
                        stats.lowStockItems > 0 ? "#fef2f2" : "#fff7ed",
                      color: stats.lowStockItems > 0 ? "#dc2626" : "#ea580c",
                    }}
                  >
                    <i className="ti ti-package" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span
                      className="stat-value"
                      style={{
                        color: stats.lowStockItems > 0 ? "#dc2626" : "#111827",
                      }}
                    >
                      {stats.lowStockItems}
                    </span>
                    <span className="stat-label">Low Stock Alerts</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-row">
                <div className="dashboard-card flex-2">
                  <h3 className="dashboard-card-title">
                    Order Status Overview
                  </h3>
                  <div className="order-status-grid">
                    <div
                      className="order-status-item"
                      onClick={() => navigate("/orders")}
                      style={{ cursor: "pointer" }}
                    >
                      <span
                        className="order-status-num"
                        style={{ color: statusColor.Pending.color }}
                      >
                        {stats.pendingOrders}
                      </span>
                      <span
                        className="status-badge"
                        style={{
                          background: statusColor.Pending.bg,
                          color: statusColor.Pending.color,
                        }}
                      >
                        Pending
                      </span>
                    </div>
                    <div
                      className="order-status-item"
                      onClick={() => navigate("/kitchen")}
                      style={{ cursor: "pointer" }}
                    >
                      <span
                        className="order-status-num"
                        style={{ color: statusColor.Cooking.color }}
                      >
                        {stats.cookingOrders}
                      </span>
                      <span
                        className="status-badge"
                        style={{
                          background: statusColor.Cooking.bg,
                          color: statusColor.Cooking.color,
                        }}
                      >
                        Cooking
                      </span>
                    </div>
                    <div
                      className="order-status-item"
                      onClick={() => navigate("/kitchen")}
                      style={{ cursor: "pointer" }}
                    >
                      <span
                        className="order-status-num"
                        style={{ color: statusColor.Ready.color }}
                      >
                        {stats.readyOrders}
                      </span>
                      <span
                        className="status-badge"
                        style={{
                          background: statusColor.Ready.bg,
                          color: statusColor.Ready.color,
                        }}
                      >
                        Ready
                      </span>
                    </div>
                    <div
                      className="order-status-item"
                      onClick={() => navigate("/orders")}
                      style={{ cursor: "pointer" }}
                    >
                      <span
                        className="order-status-num"
                        style={{ color: statusColor.Served.color }}
                      >
                        {stats.totalOrders}
                      </span>
                      <span
                        className="status-badge"
                        style={{
                          background: statusColor.Served.bg,
                          color: statusColor.Served.color,
                        }}
                      >
                        Total
                      </span>
                    </div>
                  </div>

                  <h3
                    className="dashboard-card-title"
                    style={{ marginTop: 20 }}
                  >
                    Recent Orders
                  </h3>
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Table</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOrders.length > 0 ? (
                        paginatedOrders.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <strong>
                                #ORD-{String(order.id).padStart(4, "0")}
                              </strong>
                            </td>
                            <td>{order.tableNumber}</td>
                            <td>{order.items?.length || 0} items</td>
                            <td>₱{Number(order.total || 0).toFixed(2)}</td>
                            <td>
                              <span
                                className="status-badge"
                                style={statusColor[order.status]}
                              >
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="empty-state">
                            No orders yet today
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <PaginationControls />
                </div>

                <div className="dashboard-card flex-1">
                  <h3 className="dashboard-card-title">Top Menu Items Today</h3>
                  {topItems.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={topItems} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis
                          dataKey="itemName"
                          type="category"
                          tick={{ fontSize: 11 }}
                          width={90}
                        />
                        <Tooltip
                          formatter={(value, name) => {
                            if (name === "totalQuantitySold")
                              return [`${value} sold`, "Quantity"];
                            return [value, name];
                          }}
                        />
                        <Bar
                          dataKey="totalQuantitySold"
                          fill="#dc2626"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div
                      className="chart-empty"
                      style={{
                        height: 200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                      }}
                    >
                      <i
                        className="ti ti-chart-bar"
                        style={{ fontSize: 40, color: "#9ca3af" }}
                      />
                      <p style={{ color: "#9ca3af", marginTop: 10 }}>
                        No sales data yet
                      </p>
                    </div>
                  )}

                  <h3
                    className="dashboard-card-title"
                    style={{ marginTop: 20 }}
                  >
                    Quick Actions
                  </h3>
                  <div className="quick-action-list">
                    <button
                      className="quick-action-btn"
                      onClick={() => navigate("/orders/new")}
                    >
                      <i className="ti ti-clipboard-list" aria-hidden="true" />{" "}
                      New Order
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={() => navigate("/tables")}
                    >
                      <i className="ti ti-armchair" aria-hidden="true" /> View
                      Tables
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={() => navigate("/billing")}
                    >
                      <i className="ti ti-credit-card" aria-hidden="true" />{" "}
                      Billing
                    </button>
                    <button
                      className="quick-action-btn"
                      onClick={() => navigate("/reports")}
                    >
                      <i className="ti ti-chart-line" aria-hidden="true" />{" "}
                      Reports
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* WAITER VIEW */}
          {isWaiter && (
            <>
              <div className="stat-grid">
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: "#fef2f2", color: "#dc2626" }}
                  >
                    <i className="ti ti-clipboard-list" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.totalOrders}</span>
                    <span className="stat-label">My Orders Today</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: "#fef3c7", color: "#92400e" }}
                  >
                    <i className="ti ti-clock-hour-4" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.pendingOrders}</span>
                    <span className="stat-label">Pending Orders</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: "#d1fae5", color: "#065f46" }}
                  >
                    <i className="ti ti-circle-check" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.readyOrders}</span>
                    <span className="stat-label">Ready to Serve</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: "#eff6ff", color: "#2563eb" }}
                  >
                    <i className="ti ti-armchair" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.availableTables}</span>
                    <span className="stat-label">Available Tables</span>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h2 className="section-title">Quick Actions</h2>
                <div className="action-grid">
                  <div
                    className="action-card"
                    onClick={() => navigate("/orders/new")}
                  >
                    <i
                      className="ti ti-clipboard-list action-icon"
                      aria-hidden="true"
                    />
                    <span className="action-label">Take New Order</span>
                  </div>
                  <div
                    className="action-card"
                    onClick={() => navigate("/tables")}
                  >
                    <i
                      className="ti ti-armchair action-icon"
                      aria-hidden="true"
                    />
                    <span className="action-label">View My Tables</span>
                  </div>
                  <div
                    className="action-card"
                    onClick={() => navigate("/orders")}
                  >
                    <i className="ti ti-files action-icon" aria-hidden="true" />
                    <span className="action-label">View All Orders</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-card" style={{ marginTop: 20 }}>
                <h3 className="dashboard-card-title">Recent Orders</h3>
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Table</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.length > 0 ? (
                      paginatedOrders.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <strong>
                              #ORD-{String(order.id).padStart(4, "0")}
                            </strong>
                          </td>
                          <td>{order.tableNumber}</td>
                          <td>{order.items?.length || 0} items</td>
                          <td>₱{Number(order.total || 0).toFixed(2)}</td>
                          <td>
                            <span
                              className="status-badge"
                              style={statusColor[order.status]}
                            >
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="empty-state">
                          No orders yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <PaginationControls />
              </div>
            </>
          )}

          {/* CASHIER VIEW */}
          {isCashier && (
            <>
              <div className="stat-grid">
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: "#fef2f2", color: "#dc2626" }}
                  >
                    <i className="ti ti-cash" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">
                      ₱{stats.totalRevenue.toFixed(2)}
                    </span>
                    <span className="stat-label">Collected Today</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: "#eff6ff", color: "#2563eb" }}
                  >
                    <i className="ti ti-receipt" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.todayOrders}</span>
                    <span className="stat-label">Bills Processed</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: "#d1fae5", color: "#065f46" }}
                  >
                    <i className="ti ti-circle-check" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.readyOrders}</span>
                    <span className="stat-label">Ready for Billing</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: "#fef3c7", color: "#92400e" }}
                  >
                    <i className="ti ti-clock-hour-4" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.pendingOrders}</span>
                    <span className="stat-label">Pending Orders</span>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h2 className="section-title">Quick Actions</h2>
                <div className="action-grid">
                  <div
                    className="action-card"
                    onClick={() => navigate("/billing")}
                  >
                    <i
                      className="ti ti-credit-card action-icon"
                      aria-hidden="true"
                    />
                    <span className="action-label">Billing & POS</span>
                  </div>
                  <div
                    className="action-card"
                    onClick={() => navigate("/orders")}
                  >
                    <i className="ti ti-files action-icon" aria-hidden="true" />
                    <span className="action-label">View Orders</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* KITCHEN STAFF VIEW */}
          {isKitchen && (
            <>
              <div className="stat-grid">
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: "#fef3c7", color: "#92400e" }}
                  >
                    <i className="ti ti-clock-hour-4" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.pendingOrders}</span>
                    <span className="stat-label">Orders Pending</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: "#dbeafe", color: "#1e40af" }}
                  >
                    <i className="ti ti-chef-hat" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.cookingOrders}</span>
                    <span className="stat-label">Currently Cooking</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{ background: "#d1fae5", color: "#065f46" }}
                  >
                    <i className="ti ti-circle-check" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.readyOrders}</span>
                    <span className="stat-label">Ready for Pickup</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div
                    className="stat-icon"
                    style={{
                      background:
                        stats.lowStockItems > 0 ? "#fef2f2" : "#f0fdf4",
                      color: stats.lowStockItems > 0 ? "#dc2626" : "#16a34a",
                    }}
                  >
                    <i className="ti ti-package" aria-hidden="true" />
                  </div>
                  <div className="stat-info">
                    <span
                      className="stat-value"
                      style={{
                        color: stats.lowStockItems > 0 ? "#dc2626" : "#111827",
                      }}
                    >
                      {stats.lowStockItems}
                    </span>
                    <span className="stat-label">Low Stock Alerts</span>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h2 className="section-title">Quick Actions</h2>
                <div className="action-grid">
                  <div
                    className="action-card"
                    onClick={() => navigate("/kitchen")}
                  >
                    <i
                      className="ti ti-chef-hat action-icon"
                      aria-hidden="true"
                    />
                    <span className="action-label">Kitchen Queue</span>
                  </div>
                  <div
                    className="action-card"
                    onClick={() => navigate("/inventory")}
                  >
                    <i
                      className="ti ti-package action-icon"
                      aria-hidden="true"
                    />
                    <span className="action-label">Check Inventory</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </MainLayout>
  );
};

export default Dashboard;