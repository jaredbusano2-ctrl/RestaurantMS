import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import axiosInstance from '../../utils/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/roleGuard';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    availableTables: 0,
    occupiedTables: 0,
    lowStockItems: 0,
    totalRevenue: 0,
    todayOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const promises = [];

      // Recent orders visible to Super Admin, Admin, Manager, Waiter only
if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.WAITER].includes(role)) {
  promises.push(axiosInstance.get('/api/orders').catch(() => ({ data: { data: [] } })));
} else {
  promises.push(Promise.resolve({ data: { data: [] } }));
}

      // Table data for relevant roles
      if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.WAITER].includes(role)) {
        promises.push(axiosInstance.get('/api/tables').catch(() => ({ data: { data: [] } })));
      } else {
        promises.push(Promise.resolve({ data: { data: [] } }));
      }

      // Inventory for relevant roles
      if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER, ROLES.KITCHEN_STAFF].includes(role)) {
        promises.push(axiosInstance.get('/api/inventory/low-stock').catch(() => ({ data: { data: [] } })));
      } else {
        promises.push(Promise.resolve({ data: { data: [] } }));
      }

      // Reports for managers and above
      if ([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER].includes(role)) {
        const today = new Date();
        const from = new Date();
        from.setHours(0, 0, 0, 0);
        promises.push(axiosInstance.get(`/api/reports/daily?from=${from.toISOString()}&to=${today.toISOString()}`).catch(() => ({ data: { data: [] } })));
        promises.push(axiosInstance.get(`/api/reports/items?from=${from.toISOString()}&to=${today.toISOString()}`).catch(() => ({ data: { data: [] } })));
      } else {
        promises.push(Promise.resolve({ data: { data: [] } }));
        promises.push(Promise.resolve({ data: { data: [] } }));
      }

      const [ordersRes, tablesRes, lowStockRes, reportsRes, itemsRes] = await Promise.all(promises);

      const orders = ordersRes.data.data || [];
      const tables = tablesRes.data.data || [];
      const lowStock = lowStockRes.data.data || [];
      const reports = reportsRes.data.data || [];
      const items = itemsRes.data.data || [];

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter(o => o.status === 'Pending').length,
        cookingOrders: orders.filter(o => o.status === 'Cooking').length,
        readyOrders: orders.filter(o => o.status === 'Ready').length,
        availableTables: tables.filter(t => t.status === 'Available').length,
        totalTables: tables.length,
        lowStockItems: lowStock.length,
        totalRevenue: reports.reduce((sum, r) => sum + (r.totalRevenue || 0), 0),
        todayOrders: reports.reduce((sum, r) => sum + (r.totalOrders || 0), 0),
      });

      setRecentOrders(orders.slice(0, 5));
      setTopItems(items.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = {
    Pending: { bg: '#fef3c7', color: '#92400e' },
    Cooking: { bg: '#dbeafe', color: '#1e40af' },
    Ready: { bg: '#d1fae5', color: '#065f46' },
    Served: { bg: '#f3f4f6', color: '#374151' },
    Cancelled: { bg: '#fee2e2', color: '#991b1b' },
  };

  const isManagerOrAbove = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.MANAGER].includes(role);
  const isWaiter = role === ROLES.WAITER;
  const isCashier = role === ROLES.CASHIER;
  const isKitchen = role === ROLES.KITCHEN_STAFF;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isManagerOrAbove ? 'Operations Dashboard' : 'My Dashboard'}
          </h1>
          <p className="page-subtitle">
            {getGreeting()}, {user?.fullName?.split(' ')[0]}! &nbsp;·&nbsp;
            {new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            &nbsp;·&nbsp; {user?.branch}
          </p>
        </div>
        <button className="btn-secondary" onClick={fetchDashboardData}>↻ Refresh</button>
      </div>

      {loading ? <div className="loading">Loading dashboard...</div> : (
        <>
          {/* MANAGER / ADMIN / SUPER ADMIN VIEW */}
          {isManagerOrAbove && (
            <>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>💰</div>
                  <div className="stat-info">
                    <span className="stat-value">₱{stats.totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                    <span className="stat-label">Today's Revenue</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>🛒</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.todayOrders}</span>
                    <span className="stat-label">Orders Today</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>🪑</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.availableTables}/{stats.totalTables}</span>
                    <span className="stat-label">Tables Available</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: stats.lowStockItems > 0 ? '#fef2f2' : '#fff7ed', color: stats.lowStockItems > 0 ? '#dc2626' : '#ea580c' }}>📦</div>
                  <div className="stat-info">
                    <span className="stat-value" style={{ color: stats.lowStockItems > 0 ? '#dc2626' : '#111827' }}>{stats.lowStockItems}</span>
                    <span className="stat-label">Low Stock Alerts</span>
                  </div>
                </div>
              </div>

              {/* Order Status Summary */}
              <div className="dashboard-row">
                <div className="dashboard-card flex-2">
                  <h3 className="dashboard-card-title">Order Status Overview</h3>
                  <div className="order-status-grid">
                    <div className="order-status-item" onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
                      <span className="order-status-num" style={{ color: '#92400e' }}>{stats.pendingOrders}</span>
                      <span className="status-badge" style={{ background: '#fef3c7', color: '#92400e' }}>Pending</span>
                    </div>
                    <div className="order-status-item" onClick={() => navigate('/kitchen')} style={{ cursor: 'pointer' }}>
                      <span className="order-status-num" style={{ color: '#1e40af' }}>{stats.cookingOrders}</span>
                      <span className="status-badge" style={{ background: '#dbeafe', color: '#1e40af' }}>Cooking</span>
                    </div>
                    <div className="order-status-item" onClick={() => navigate('/kitchen')} style={{ cursor: 'pointer' }}>
                      <span className="order-status-num" style={{ color: '#065f46' }}>{stats.readyOrders}</span>
                      <span className="status-badge" style={{ background: '#d1fae5', color: '#065f46' }}>Ready</span>
                    </div>
                    <div className="order-status-item" onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
                      <span className="order-status-num" style={{ color: '#374151' }}>{stats.totalOrders}</span>
                      <span className="status-badge" style={{ background: '#f3f4f6', color: '#374151' }}>Total</span>
                    </div>
                  </div>

                  <h3 className="dashboard-card-title" style={{ marginTop: 20 }}>Recent Orders</h3>
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
                      {recentOrders.length > 0 ? recentOrders.map(order => (
                        <tr key={order.id}>
                          <td><strong>#ORD-{String(order.id).padStart(4, '0')}</strong></td>
                          <td>{order.tableNumber}</td>
                          <td>{order.items?.length || 0} items</td>
                          <td>₱{Number(order.total || 0).toFixed(2)}</td>
                          <td>
                            <span className="status-badge" style={statusColor[order.status]}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="5" className="empty-state">No orders yet today</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="dashboard-card flex-1">
                  <h3 className="dashboard-card-title">Top Menu Items Today</h3>
                  {topItems.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={topItems} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="itemName" type="category" tick={{ fontSize: 11 }} width={90} />
                        <Tooltip />
                        <Bar dataKey="totalQuantitySold" fill="#dc2626" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="chart-empty" style={{ height: 200 }}>No sales data yet</div>
                  )}

                  <h3 className="dashboard-card-title" style={{ marginTop: 20 }}>Quick Actions</h3>
                  <div className="quick-action-list">
                    <button className="quick-action-btn" onClick={() => navigate('/orders/new')}>📋 New Order</button>
                    <button className="quick-action-btn" onClick={() => navigate('/tables')}>🪑 View Tables</button>
                    <button className="quick-action-btn" onClick={() => navigate('/billing')}>💳 Billing</button>
                    <button className="quick-action-btn" onClick={() => navigate('/reports')}>📈 Reports</button>
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
                  <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>📋</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.totalOrders}</span>
                    <span className="stat-label">My Orders Today</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#fef3c7', color: '#92400e' }}>⏳</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.pendingOrders}</span>
                    <span className="stat-label">Pending Orders</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#d1fae5', color: '#065f46' }}>✅</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.readyOrders}</span>
                    <span className="stat-label">Ready to Serve</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>🪑</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.availableTables}</span>
                    <span className="stat-label">Available Tables</span>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h2 className="section-title">Quick Actions</h2>
                <div className="action-grid">
                  <div className="action-card" onClick={() => navigate('/orders/new')}>
                    <span className="action-icon">📋</span>
                    <span className="action-label">Take New Order</span>
                  </div>
                  <div className="action-card" onClick={() => navigate('/tables')}>
                    <span className="action-icon">🪑</span>
                    <span className="action-label">View My Tables</span>
                  </div>
                  <div className="action-card" onClick={() => navigate('/orders')}>
                    <span className="action-icon">📑</span>
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
                    {recentOrders.length > 0 ? recentOrders.map(order => (
                      <tr key={order.id}>
                        <td><strong>#ORD-{String(order.id).padStart(4, '0')}</strong></td>
                        <td>{order.tableNumber}</td>
                        <td>{order.items?.length || 0} items</td>
                        <td>₱{Number(order.total || 0).toFixed(2)}</td>
                        <td>
                          <span className="status-badge" style={statusColor[order.status]}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" className="empty-state">No orders yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* CASHIER VIEW */}
          {isCashier && (
            <>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>💰</div>
                  <div className="stat-info">
                    <span className="stat-value">₱{stats.totalRevenue.toFixed(2)}</span>
                    <span className="stat-label">Collected Today</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>🧾</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.todayOrders}</span>
                    <span className="stat-label">Bills Processed</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#d1fae5', color: '#065f46' }}>✅</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.readyOrders}</span>
                    <span className="stat-label">Ready for Billing</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#fef3c7', color: '#92400e' }}>⏳</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.pendingOrders}</span>
                    <span className="stat-label">Pending Orders</span>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h2 className="section-title">Quick Actions</h2>
                <div className="action-grid">
                  <div className="action-card" onClick={() => navigate('/billing')}>
                    <span className="action-icon">💳</span>
                    <span className="action-label">Billing & POS</span>
                  </div>
                  <div className="action-card" onClick={() => navigate('/orders')}>
                    <span className="action-icon">📑</span>
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
                  <div className="stat-icon" style={{ background: '#fef3c7', color: '#92400e' }}>⏳</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.pendingOrders}</span>
                    <span className="stat-label">Orders Pending</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>🍳</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.cookingOrders}</span>
                    <span className="stat-label">Currently Cooking</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#d1fae5', color: '#065f46' }}>✅</div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.readyOrders}</span>
                    <span className="stat-label">Ready for Pickup</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: stats.lowStockItems > 0 ? '#fef2f2' : '#f0fdf4', color: stats.lowStockItems > 0 ? '#dc2626' : '#16a34a' }}>📦</div>
                  <div className="stat-info">
                    <span className="stat-value" style={{ color: stats.lowStockItems > 0 ? '#dc2626' : '#111827' }}>
                      {stats.lowStockItems}
                    </span>
                    <span className="stat-label">Low Stock Alerts</span>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h2 className="section-title">Quick Actions</h2>
                <div className="action-grid">
                  <div className="action-card" onClick={() => navigate('/kitchen')}>
                    <span className="action-icon">👨‍🍳</span>
                    <span className="action-label">Kitchen Queue</span>
                  </div>
                  <div className="action-card" onClick={() => navigate('/inventory')}>
                    <span className="action-icon">📦</span>
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