import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import axiosInstance from '../../utils/axiosInstance';
import './Orders.css';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get('/api/orders');
      setOrders(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axiosInstance.put(`/api/orders/${id}/status`, { status });
      fetchOrders();
      setSelected(null);
    } catch (err) {
      console.error(err);
    }
  };

  const statuses = ['All', 'Pending', 'Cooking', 'Ready', 'Served', 'Cancelled'];
  const filtered = filter === 'All' ? orders : orders.filter(o => o.status === filter);

  const statusColor = {
    Pending: { bg: '#fef3c7', color: '#92400e' },
    Cooking: { bg: '#dbeafe', color: '#1e40af' },
    Ready: { bg: '#d1fae5', color: '#065f46' },
    Served: { bg: '#f3f4f6', color: '#374151' },
    Cancelled: { bg: '#fee2e2', color: '#991b1b' },
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Manage all restaurant orders</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/orders/new')}>+ New Order</button>
      </div>

      <div className="status-tabs">
        {statuses.map(s => (
          <button key={s} className={`status-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s}
            {s !== 'All' && <span className="tab-count">{orders.filter(o => o.status === s).length}</span>}
          </button>
        ))}
      </div>

      {loading ? <div className="loading">Loading orders...</div> : (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Table</th>
                <th>Waiter</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Time</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id} onClick={() => setSelected(order)} className="order-row">
                  <td><strong>#ORD-{String(order.id).padStart(4, '0')}</strong></td>
                  <td>{order.tableNumber}</td>
                  <td>{order.waiterName}</td>
                  <td>{order.items?.length || 0} items</td>
                  <td><strong>₱{Number(order.total || 0).toFixed(2)}</strong></td>
                  <td>
                    <span className="status-badge" style={statusColor[order.status]}>
                      {order.status}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleTimeString()}</td>
                  <td>
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); setSelected(order); }}>👁️</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="8" className="empty-state">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>#ORD-{String(selected.id).padStart(4, '0')} — {selected.tableNumber}</h3>
              <button onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="order-detail-meta">
                <span>Waiter: <strong>{selected.waiterName}</strong></span>
                <span>Status: <strong>{selected.status}</strong></span>
              </div>
              <table className="orders-table" style={{ marginTop: 16 }}>
                <thead>
                  <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
                </thead>
                <tbody>
                  {selected.items?.map(item => (
                    <tr key={item.id}>
                      <td>{item.menuItemName}</td>
                      <td>{item.quantity}</td>
                      <td>₱{Number(item.unitPrice).toFixed(2)}</td>
                      <td>₱{Number(item.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="order-total">
                Total: <strong>₱{Number(selected.total || 0).toFixed(2)}</strong>
              </div>
              <div className="order-actions-row">
  {selected.status === 'Ready' && (
    <button className="btn-primary" onClick={() => handleStatusUpdate(selected.id, 'Served')}>
      ✓ Mark as Served
    </button>
  )}
  {selected.status === 'Pending' && (
    <button className="btn-secondary" onClick={() => handleStatusUpdate(selected.id, 'Cancelled')}>
      Cancel Order
    </button>
  )}
  {(selected.status === 'Cooking') && (
    <span style={{ color: '#6b7280', fontSize: 13 }}>⏳ Waiting for kitchen to mark this order ready</span>
  )}
  {(selected.status === 'Served' || selected.status === 'Cancelled') && (
    <span style={{ color: '#9ca3af', fontSize: 13 }}>This order is {selected.status.toLowerCase()}.</span>
  )}
</div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default OrderList;