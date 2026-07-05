import { useState, useEffect, useRef } from "react";
import MainLayout from "../../layouts/MainLayout";
import axiosInstance from "../../utils/axiosInstance";
import { useSignalR } from "../../hooks/useSignalR";
import "./Kitchen.css";

const KitchenQueue = () => {
  const [orders, setOrders] = useState([]);
  const [setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState({});
  const [updating, setUpdating] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const timerInterval = useRef(null);

  useEffect(() => {
    fetchData();
    return () => {
      clearInterval(timerInterval.current);
    };
  }, []);

  // SignalR connection with proper event handlers
  const { isConnected } = useSignalR("/hubs/kitchen", {
    OrderUpdated: (orderId, status) => {
      console.log(`🔄 Order #${orderId} updated to: ${status}`);
      setLastUpdate(`Order #${orderId} → ${status}`);
      fetchData();
      playNotificationSound();
    },
    OrderReady: (orderId) => {
      console.log(`📢 Order #${orderId} is ready for pickup!`);
      setLastUpdate(`📢 Order #${orderId} is ready!`);
      playNotificationSound();
    },
  });

  const playNotificationSound = () => {
    try {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmIcBjmU3O7CciYE",
      );
      audio.play();
    } catch (e) {
      console.log("Sound play failed:", e);
    }
  };

  useEffect(() => {
    clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      const now = Date.now();
      const updated = {};
      orders.forEach((o) => {
        updated[o.id] = Math.floor(
          (now - new Date(o.createdAt).getTime()) / 1000,
        );
      });
      setTimers(updated);
    }, 1000);
    return () => clearInterval(timerInterval.current);
  }, [orders]);

  const fetchData = async () => {
    try {
      const [pendingRes, cookingRes, readyRes, stockRes] = await Promise.all([
        axiosInstance.get("/api/orders/status/Pending"),
        axiosInstance.get("/api/orders/status/Cooking"),
        axiosInstance.get("/api/orders/status/Ready"),
        axiosInstance.get("/api/inventory/low-stock"),
      ]);
      setOrders([
        ...(pendingRes.data.data || []),
        ...(cookingRes.data.data || []),
        ...(readyRes.data.data || []),
      ]);
      setLowStock(stockRes.data.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await axiosInstance.put(`/api/orders/${id}/status`, { status });
      // Send SignalR notification to kitchen group
      // The backend will handle broadcasting via SendOrderUpdate
      await fetchData();
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdating(null);
    }
  };

  const formatTime = (seconds = 0) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const pending = orders.filter((o) => o.status === "Pending");
  const cooking = orders.filter((o) => o.status === "Cooking");
  const ready = orders.filter((o) => o.status === "Ready");

  const OrderCard = ({ order, children }) => {
    const elapsed = timers[order.id] || 0;
    const isPriority = elapsed > 300;
    return (
      <div className={`kitchen-card ${isPriority ? "priority" : ""}`}>
        {isPriority && <div className="priority-badge">⚠ PRIORITY</div>}
        <div className="kitchen-card-header">
          <strong>#ORD-{String(order.id).padStart(4, "0")}</strong>
          <span className="kitchen-table">{order.tableNumber}</span>
        </div>
        <div className="kitchen-waiter">👤 {order.waiterName}</div>
        <div className="kitchen-items">
          {order.items?.map((item) => (
            <div key={item.id} className="kitchen-item">
              <span>
                <strong>×{item.quantity}</strong> {item.menuItemName}
              </span>
              {item.specialNote && (
                <span className="special-note">⚠ {item.specialNote}</span>
              )}
            </div>
          ))}
        </div>
        {order.specialInstructions && (
          <div className="kitchen-instructions">
            📝 {order.specialInstructions}
          </div>
        )}
        <div className="kitchen-card-footer">
          <span
            className={`kitchen-timer ${elapsed > 300 ? "timer-danger" : elapsed > 180 ? "timer-warning" : ""}`}
          >
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
          <p className="page-subtitle">
            Real-time order queue — auto refreshes every 15 seconds
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {lastUpdate && (
            <span className="live-badge" style={{ background: "#4CAF50" }}>
              {lastUpdate}
            </span>
          )}
          <span className={`live-badge ${isConnected ? "" : "disconnected"}`}>
            {isConnected ? "● Live" : "○ Offline"}
          </span>
          <button className="btn-secondary" onClick={fetchData}>
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="table-stats" style={{ maxWidth: 560 }}>
        <div className="table-stat">
          <div
            className="table-stat-icon"
            style={{ background: "#fef3c7", color: "#b45309" }}
          >
            <i className="ti ti-clock" aria-hidden="true" />
          </div>
          <div className="table-stat-info">
            <div className="table-stat-num" style={{ color: "#b45309" }}>
              {pending.length}
            </div>
            <div className="table-stat-label">Pending</div>
          </div>
        </div>
        <div className="table-stat">
          <div
            className="table-stat-icon"
            style={{ background: "#ffedd5", color: "#c2410c" }}
          >
            <i className="ti ti-flame" aria-hidden="true" />
          </div>
          <div className="table-stat-info">
            <div className="table-stat-num" style={{ color: "#c2410c" }}>
              {cooking.length}
            </div>
            <div className="table-stat-label">Preparing</div>
          </div>
        </div>
        <div className="table-stat">
          <div
            className="table-stat-icon"
            style={{ background: "#dcfce7", color: "#15803d" }}
          >
            <i className="ti ti-circle-check" aria-hidden="true" />
          </div>
          <div className="table-stat-info">
            <div className="table-stat-num" style={{ color: "#15803d" }}>
              {ready.length}
            </div>
            <div className="table-stat-label">Ready</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading kitchen queue...</div>
      ) : (
        <div className="kitchen-columns">
          <div className="kitchen-column">
            <div className="kitchen-column-header pending">
              <span>
                <i className="ti ti-clock-hour-4" aria-hidden="true" /> Pending
              </span>
              <span className="column-count">{pending.length}</span>
            </div>
            {pending.length === 0 ? (
              <div className="kitchen-empty">
                <i className="ti ti-confetti" aria-hidden="true" /> No pending
                orders
              </div>
            ) : (
              pending.map((order) => (
                <OrderCard key={order.id} order={order}>
                  <button
                    className="btn-primary kitchen-btn"
                    disabled={updating === order.id}
                    onClick={() => updateStatus(order.id, "Cooking")}
                  >
                    {updating === order.id ? "..." : "Start Cooking"}
                  </button>
                </OrderCard>
              ))
            )}
          </div>

          <div className="kitchen-column">
            <div className="kitchen-column-header cooking">
              <span>
                <i className="ti ti-chef-hat" aria-hidden="true" /> Preparing
              </span>
              <span className="column-count">{cooking.length}</span>
            </div>
            {cooking.length === 0 ? (
              <div className="kitchen-empty">Nothing preparing</div>
            ) : (
              cooking.map((order) => (
                <OrderCard key={order.id} order={order}>
                  <button
                    className="btn-cooking kitchen-btn"
                    disabled={updating === order.id}
                    onClick={() => updateStatus(order.id, "Ready")}
                  >
                    {updating === order.id ? "..." : "Mark Ready"}
                  </button>
                </OrderCard>
              ))
            )}
          </div>

          <div className="kitchen-column">
            <div className="kitchen-column-header ready">
              <span>
                <i className="ti ti-circle-check" aria-hidden="true" /> Ready
              </span>
              <span className="column-count">{ready.length}</span>
            </div>
            {ready.length === 0 ? (
              <div className="kitchen-empty">No ready orders</div>
            ) : (
              ready.map((order) => (
                <OrderCard key={order.id} order={order}>
                  {/* CHANGE THIS: Replace the static label with a button */}
                  <button
                    className="btn-success kitchen-btn"
                    disabled={updating === order.id}
                    onClick={() => updateStatus(order.id, "Served")}
                  >
                    {updating === order.id ? "..." : "✓ Mark as Served"}
                  </button>
                </OrderCard>
              ))
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default KitchenQueue;
