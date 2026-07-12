import { useState, useEffect, useRef } from "react";
import MainLayout from "../../layouts/MainLayout";
import axiosInstance from "../../utils/axiosInstance";
import { useSignalR } from "../../hooks/useSignalR";
import "./Kitchen.css";
import { useNavigate } from "react-router-dom";

const KitchenQueue = () => {
  const [orders, setOrders] = useState([]);
  const [lowStock, setLowStock] = useState([]); // ✅ ADD THIS - Fixes the error!
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState({});
  const [updating, setUpdating] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const timerInterval = useRef(null);
  const [errorModal, setErrorModal] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    return () => {
      clearInterval(timerInterval.current);
    };
  }, []);

  const { isConnected } = useSignalR("/hubs/kitchen", {
    OrderStatusUpdated: (data) => {
      // Handle both full order object and {OrderId, Status} format
      if (data && data.Id) {
        setLastUpdate(`Order #${data.Id} → ${data.Status}`);
      } else if (data && data.OrderId) {
        setLastUpdate(`Order #${data.OrderId} → ${data.Status}`);
      }
      fetchData();
      playNotificationSound();
    },
    NewOrder: (order) => {
      setLastUpdate(`📦 New Order #${order.Id}`);
      fetchData();
      playNotificationSound();
    },
    LowStockAlert: (items) => {
      setLowStock(items);
      // Optionally show a notification
      if (items && items.length > 0) {
        setLastUpdate(`⚠️ ${items.length} items low in stock!`);
      }
    },
    // ✅ Keep OrderReady for table notifications
    OrderReady: (orderId) => {
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
      const [pendingRes, cookingRes, readyRes, lowStockRes] = await Promise.all(
        [
          axiosInstance.get("/api/orders/status/Pending"),
          axiosInstance.get("/api/orders/status/Cooking"),
          axiosInstance.get("/api/orders/status/Ready"),
          axiosInstance.get("/api/inventory/low-stock"),
        ],
      );
      setOrders([
        ...(pendingRes.data.data || []),
        ...(cookingRes.data.data || []),
        ...(readyRes.data.data || []),
      ]);
      // ✅ Store low stock data
      if (lowStockRes.data && lowStockRes.data.data) {
        setLowStock(lowStockRes.data.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      const response = await axiosInstance.put(`/api/orders/${id}/status`, {
        status,
      });
      console.log(`✅ Order ${id} updated:`, response.data);
      await fetchData();
      setLastUpdate(`✅ Order #${id} → ${status}`);
    } catch (err) {
      console.error("❌ Error updating status:", err);
      const message =
        err.response?.data?.message || err.response?.data?.error || err.message;
      setErrorModal(message);
    } finally {
      setUpdating(null);
    }
  };
  const formatTime = (seconds = 0) => {
    const MAX_SECONDS = 1800; // 30 minutes
    if (seconds > MAX_SECONDS) {
      seconds = MAX_SECONDS;
    }

    const m = Math.floor(seconds / 60);
    const s = seconds % 60;

    return `${m}m ${String(s).padStart(2, "0")}s`;
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

      {/* ✅ Optional: Show low stock warning */}
      {lowStock.length > 0 && (
        <div
          className="low-stock-warning"
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "12px 16px",
            marginBottom: "16px",
            color: "#dc2626",
          }}
        >
          <strong>⚠️ Low Stock Alert:</strong>{" "}
          {lowStock
            .map((item) => `${item.name} (${item.currentStock} ${item.unit})`)
            .join(", ")}
        </div>
      )}

      <div className="table-stats kitchen-stats">
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
            {pending.length > 0 &&
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
              ))}
          </div>
          <div className="kitchen-column">
            {cooking.length > 0 &&
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
              ))}
          </div>

          <div className="kitchen-column">
            {ready.length > 0 &&
              ready.map((order) => (
                <OrderCard key={order.id} order={order}>
                  <div className="ready-badge-container">
                    <div className="ready-badge">
                      <i className="ti ti-circle-check" />
                      Ready for Billing
                    </div>
                  </div>
                </OrderCard>
              ))}
          </div>
        </div>
      )}

      {errorModal && (
        <div className="modal-overlay" onClick={() => setErrorModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cannot start cooking</h3>
              <button
                className="modal-close-btn"
                onClick={() => setErrorModal(null)}
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>
            <div
              className="modal-body"
              style={{ alignItems: "center", textAlign: "center" }}
            >
              <div className="modal-icon-circle danger">
                <i className="ti ti-alert-triangle" aria-hidden="true" />
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {errorModal}
              </p>
            </div>
            <div className="modal-footer" style={{ padding: "16px 20px" }}>
              <button
                className="btn-secondary"
                onClick={() => setErrorModal(null)}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => navigate("/inventory")}
              >
                <i className="ti ti-package" aria-hidden="true" /> Go to
                inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default KitchenQueue;
