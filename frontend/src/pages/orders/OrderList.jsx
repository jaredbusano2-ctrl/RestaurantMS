import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiEye,
  FiPlus,
  FiX,
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiPackage,
} from "react-icons/fi";
import MainLayout from "../../layouts/MainLayout";
import axiosInstance from "../../utils/axiosInstance";
import "./Orders.css";

// Status configuration
const STATUSES = ["All", "Pending", "Cooking", "Ready", "Served", "Cancelled"];

const STATUS_COLORS = {
  Pending: { backgroundColor: "#fef3c7", color: "#92400e" },
  Cooking: { backgroundColor: "#dbeafe", color: "#1e40af" },
  Ready: { backgroundColor: "#d1fae5", color: "#065f46" },
  Served: { backgroundColor: "#f3f4f6", color: "#374151" },
  Cancelled: { backgroundColor: "#fee2e2", color: "#991b1b" },
};

const STATUS_ICONS = {
  Pending: FiClock,
  Cooking: FiPackage,
  Ready: FiCheck,
  Served: FiCheck,
  Cancelled: FiX,
};

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/orders");
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axiosInstance.put(`/api/orders/${id}/status`, { status });
      await fetchOrders();
      setSelected(null);
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const getStatusCount = (status) => {
    if (status === "All") return orders.length;
    return orders.filter((o) => o.status === status).length;
  };

  const getStatusIcon = (status) => {
    const Icon = STATUS_ICONS[status];
    return Icon ? <Icon size={12} /> : null;
  };

  const filtered =
    filter === "All" ? orders : orders.filter((o) => o.status === filter);

  const totalPages = Math.ceil(filtered.length / ordersPerPage);
  const paginatedOrders = filtered.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage,
  );

  const formatOrderId = (id) => `#ORD-${String(id).padStart(4, "0")}`;
  const formatCurrency = (amount) => `₱${Number(amount || 0).toFixed(2)}`;
  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  const formatDate = (date) => new Date(date).toLocaleString();

  return (
    <MainLayout>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Manage all restaurant orders</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchOrders}>
            <i className="ti ti-refresh" aria-hidden="true" /> Refresh
          </button>
          <button
            className="btn-primary"
            onClick={() => navigate("/orders/new")}
          >
            <FiPlus size={16} /> New Order
          </button>
        </div>
      </div>

      {/* ── Filter Pills ── */}
      <div className="filter-pills">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`filter-pill ${filter === s ? "active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s}
            <span className="filter-count">{getStatusCount(s)}</span>
          </button>
        ))}
      </div>

      {/* ── Count label ── */}
      {!loading && (
        <div className="section-meta">
          <span className="section-count">
            {filtered.length} order{filtered.length !== 1 ? "s" : ""}
            {filter !== "All" ? ` · ${filter.toLowerCase()}` : ""}
          </span>
        </div>
      )}

      {/* ── Orders Table ── */}
      {loading ? (
        <div className="loading">
          <div>Loading orders</div>
          <div className="loading-dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-box">
          <i className="ti ti-package empty-icon" aria-hidden="true" />
          <strong>
            No {filter !== "All" ? filter.toLowerCase() : ""} orders
          </strong>
          <span>Orders will appear here once created.</span>
        </div>
      ) : (
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
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => {
                const status = order.status || "Pending";
                return (
                  <tr
                    key={order.id}
                    onClick={() => setSelected(order)}
                    className="order-row"
                  >
                    <td>
                      <strong>{formatOrderId(order.id)}</strong>
                    </td>
                    <td>Table {order.tableNumber}</td>
                    <td>{order.waiterName}</td>
                    <td>{order.items?.length || 0} items</td>
                    <td>
                      <strong>{formatCurrency(order.total)}</strong>
                    </td>
                    <td>
                      <span
                        className="status-badge"
                        style={STATUS_COLORS[status]}
                      >
                        {getStatusIcon(status)}
                        {status}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {formatTime(order.createdAt)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="action-icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(order);
                        }}
                        aria-label="View order details"
                      >
                        <FiEye size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <i className="ti ti-chevron-right" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Order Detail Modal ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {formatOrderId(selected.id)} — Table {selected.tableNumber}
              </h3>
              <button
                className="modal-close-btn"
                onClick={() => setSelected(null)}
              >
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>

            <div className="modal-body">
              <div className="order-detail-meta">
                <div>
                  <span>Waiter</span>
                  <strong>{selected.waiterName}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <span
                    className="status-badge"
                    style={STATUS_COLORS[selected.status]}
                  >
                    <span className="status-badge-icon">
                      {getStatusIcon(selected.status)}
                    </span>
                    {selected.status}
                  </span>
                </div>
                <div>
                  <span>Time</span>
                  <strong>{formatDate(selected.createdAt)}</strong>
                </div>
              </div>

              <div>
                <h4 className="order-items-title">Order Items</h4>
                <div className="order-items-table-wrapper">
                  <table className="orders-table order-items-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th style={{ textAlign: "center" }}>Qty</th>
                        <th style={{ textAlign: "right" }}>Price</th>
                        <th style={{ textAlign: "right" }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items?.map((item) => (
                        <tr key={item.id}>
                          <td>{item.menuItemName}</td>
                          <td style={{ textAlign: "center" }}>
                            {item.quantity}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {formatCurrency(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="order-total-label">
                          Total
                        </td>
                        <td className="order-total-amount">
                          {formatCurrency(selected.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="order-actions-row">
                {selected.status === "Ready" && (
                  <span className="order-status-message ready">
                    <FiCheck size={16} />
                    Order is ready for serving
                  </span>
                )}
                {selected.status === "Pending" && (
                  <button
                    className="btn-secondary"
                    onClick={() => handleStatusUpdate(selected.id, "Cancelled")}
                  >
                    <FiX size={16} /> Cancel Order
                  </button>
                )}
                {selected.status === "Cooking" && (
                  <span className="order-status-message">
                    <FiClock size={16} />
                    Waiting for kitchen to mark this order ready
                  </span>
                )}
                {(selected.status === "Served" ||
                  selected.status === "Cancelled") && (
                  <span className="order-status-message muted">
                    <FiAlertCircle size={16} />
                    This order is {selected.status.toLowerCase()}
                  </span>
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
