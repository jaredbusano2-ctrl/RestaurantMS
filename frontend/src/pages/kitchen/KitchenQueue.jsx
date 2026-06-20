import { useState, useEffect, useRef } from 'react';
import MainLayout from '../../layouts/MainLayout';
import axiosInstance from '../../utils/axiosInstance';
import { useSignalR } from '../../hooks/useSignalR';
import './Kitchen.css';

const KitchenQueue = () => {
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState({});
  const [updating, setUpdating] = useState(null);
  const fetchInterval = useRef(null);
  const timerInterval = useRef(null);

  useEffect(() => {
  fetchData();
  return () => {
    clearInterval(timerInterval.current);
  };
}, []);

const { isConnected } = useSignalR('/hubs/kitchen', {
  OrderUpdated: () => {
    fetchData();
    playNotificationSound();
  }
});

const playNotificationSound = () => {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjmU3O7CciYE');
    audio.play();
  } catch (e) {}
};

  useEffect(() => {
    clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      const now = Date.now();
      const updated = {};
      orders.forEach(o => {
        updated[o.id] = Math.floor((now - new Date(o.createdAt).getTime()) / 1000);
      });
      setTimers(updated);
    }, 1000);
    return () => clearInterval(timerInterval.current);
  }, [orders]);

  const fetchData = async () => {
    try {
      const [pendingRes, cookingRes, readyRes, stockRes] = await Promise.all([
        axiosInstance.get('/api/orders/status/Pending'),
        axiosInstance.get('/api/orders/status/Cooking'),
        axiosInstance.get('/api/orders/status/Ready'),
        axiosInstance.get('/api/inventory/low-stock'),
      ]);
      setOrders([
        ...(pendingRes.data.data || []),
        ...(cookingRes.data.data || []),
        ...(readyRes.data.data || []),
      ]);
      setLowStock(stockRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await axiosInstance.put(`/api/orders/${id}/status`, { status });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const formatTime = (seconds = 0) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const pending = orders.filter(o => o.status === 'Pending');
  const cooking = orders.filter(o => o.status === 'Cooking');
  const ready = orders.filter(o => o.status === 'Ready');

  const OrderCard = ({ order, children }) => {
    const elapsed = timers[order.id] || 0;
    const isPriority = elapsed > 300;
    return (
      <div className={`kitchen-card ${isPriority ? 'priority' : ''}`}>
        {isPriority && <div className="priority-badge">⚠ PRIORITY</div>}
        <div className="kitchen-card-header">
          <strong>#ORD-{String(order.id).padStart(4, '0')}</strong>
          <span className="kitchen-table">{order.tableNumber}</span>
        </div>
        <div className="kitchen-waiter">👤 {order.waiterName}</div>
        <div className="kitchen-items">
          {order.items?.map(item => (
            <div key={item.id} className="kitchen-item">
              <span><strong>×{item.quantity}</strong> {item.menuItemName}</span>
              {item.specialNote && (
                <span className="special-note">⚠ {item.specialNote}</span>
              )}
            </div>
          ))}
        </div>
        {order.specialInstructions && (
          <div className="kitchen-instructions">📝 {order.specialInstructions}</div>
        )}
        <div className="kitchen-card-footer">
          <span className={`kitchen-timer ${elapsed > 300 ? 'timer-danger' : elapsed > 180 ? 'timer-warning' : ''}`}>
            ⏱ {formatTime(elapsed)}
          </span>
          {children}
        </div>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Kitchen Display</h1>
          <p className="page-subtitle">Real-time order queue — auto refreshes every 15 seconds</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {lowStock.length > 0 && (
            <span className="low-stock-alert">⚠ {lowStock.length} Low Stock</span>
          )}
          <span className="live-badge">● Live</span>
          <button className="btn-secondary" onClick={fetchData}>↻ Refresh</button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="low-stock-banner">
          <strong>⚠ Low Stock:</strong>
          {lowStock.map(item => (
            <span key={item.id} className="low-stock-item">
              {item.name} — {item.currentStock} {item.unit} left
            </span>
          ))}
        </div>
      )}

      <div className="kitchen-summary">
        <div className="kitchen-sum-card pending-sum">
          <span className="kitchen-sum-num">{pending.length}</span>
          <span>Pending</span>
        </div>
        <div className="kitchen-sum-card cooking-sum">
          <span className="kitchen-sum-num">{cooking.length}</span>
          <span>Preparing</span>
        </div>
        <div className="kitchen-sum-card ready-sum">
          <span className="kitchen-sum-num">{ready.length}</span>
          <span>Ready</span>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading kitchen queue...</div>
      ) : (
        <div className="kitchen-columns">
          <div className="kitchen-column">
            <div className="kitchen-column-header pending">
              <span>⏳ Pending</span>
              <span className="column-count">{pending.length}</span>
            </div>
            {pending.length === 0
              ? <div className="kitchen-empty">No pending orders 🎉</div>
              : pending.map(order => (
                <OrderCard key={order.id} order={order}>
                  <button
                    className="btn-primary kitchen-btn"
                    disabled={updating === order.id}
                    onClick={() => updateStatus(order.id, 'Cooking')}
                  >
                    {updating === order.id ? '...' : 'Start Cooking'}
                  </button>
                </OrderCard>
              ))
            }
          </div>

          <div className="kitchen-column">
            <div className="kitchen-column-header cooking">
              <span>🍳 Preparing</span>
              <span className="column-count">{cooking.length}</span>
            </div>
            {cooking.length === 0
              ? <div className="kitchen-empty">Nothing preparing</div>
              : cooking.map(order => (
                <OrderCard key={order.id} order={order}>
                  <button
                    className="btn-cooking kitchen-btn"
                    disabled={updating === order.id}
                    onClick={() => updateStatus(order.id, 'Ready')}
                  >
                    {updating === order.id ? '...' : 'Mark Ready'}
                  </button>
                </OrderCard>
              ))
            }
          </div>

          <div className="kitchen-column">
            <div className="kitchen-column-header ready">
              <span>✅ Ready</span>
              <span className="column-count">{ready.length}</span>
            </div>
            {ready.length === 0
  ? <div className="kitchen-empty">No ready orders</div>
  : ready.map(order => (
    <OrderCard key={order.id} order={order}>
      <span className="ready-label">✓ Waiting for waiter to serve</span>
    </OrderCard>
  ))
}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default KitchenQueue;