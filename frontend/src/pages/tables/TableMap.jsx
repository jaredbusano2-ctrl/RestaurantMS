import { useState, useEffect } from "react";
import MainLayout from "../../layouts/MainLayout";
import axiosInstance from "../../utils/axiosInstance";
import "./Tables.css";

const statusColor = {
  Available: "#15803d",
  Occupied: "#dc2626",
  Reserved: "#d97706",
};
const badgeClass = {
  Available: "badge-available",
  Occupied: "badge-occupied",
  Reserved: "badge-reserved",
};
const cardClass = {
  Available: "status-available",
  Occupied: "status-occupied",
  Reserved: "status-reserved",
};

// Top-view table icon removed per design update

const TableMap = () => {
  const [tables, setTables] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [reserveTarget, setReserveTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [form, setForm] = useState({ tableNumber: "", capacity: 4 });
  const [reserveName, setReserveName] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/tables");
      setTables(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status, reservedBy = null) => {
    setActionLoading(id);
    setError("");
    try {
      await axiosInstance.put(`/api/tables/${id}/status`, {
        status,
        reservedBy,
      });
      await fetchTables();
      setReserveTarget(null);
      setCancelTarget(null);
      setReserveName("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update table.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionLoading("create");
    setError("");
    try {
      await axiosInstance.post("/api/tables", form);
      setShowAddModal(false);
      setForm({ tableNumber: "", capacity: 4 });
      fetchTables();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create table.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReserveSubmit = (e) => {
    e.preventDefault();
    if (!reserveName.trim()) return;
    updateStatus(reserveTarget.id, "Reserved", reserveName.trim());
  };

  const closeReserve = () => {
    setReserveTarget(null);
    setReserveName("");
    setError("");
  };
  const closeCancel = () => {
    setCancelTarget(null);
    setError("");
  };
  const closeAdd = () => {
    setShowAddModal(false);
    setError("");
  };

  const filtered =
    filter === "All" ? tables : tables.filter((t) => t.status === filter);
  const counts = {
    Available: tables.filter((t) => t.status === "Available").length,
    Occupied: tables.filter((t) => t.status === "Occupied").length,
    Reserved: tables.filter((t) => t.status === "Reserved").length,
  };

  return (
    <MainLayout>
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Table Management</h1>
          <p className="page-subtitle">Monitor and manage restaurant tables</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchTables}>
            <i className="ti ti-refresh" aria-hidden="true" /> Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Table
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="table-stats">
        {[
          { key: "Available", icon: "ti-circle-check", cls: "stat-available" },
          { key: "Occupied", icon: "ti-users", cls: "stat-occupied" },
          { key: "Reserved", icon: "ti-calendar", cls: "stat-reserved" },
        ].map(({ key, icon, cls }) => (
          <div key={key} className={`table-stat ${cls}`}>
            <div className="table-stat-icon">
              <i className={`ti ${icon}`} aria-hidden="true" />
            </div>
            <div className="table-stat-info">
              <div className="table-stat-num">{counts[key]}</div>
              <div className="table-stat-label">{key}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="filter-pills">
        {["All", "Available", "Occupied", "Reserved"].map((f) => (
          <button
            key={f}
            className={`filter-pill ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {/* ── Count label ── */}
      {!loading && (
        <div className="section-meta">
          <span className="section-count">
            {filtered.length} table{filtered.length !== 1 ? "s" : ""}
            {filter !== "All" ? ` · ${filter.toLowerCase()}` : ""}
          </span>
        </div>
      )}

      {/* ── Table Grid ── */}
      {loading ? (
        <div className="loading">
          <div>Loading tables</div>
          <div className="loading-dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-box">
          <i className="ti ti-armchair empty-icon" aria-hidden="true" />
          <strong>
            No {filter !== "All" ? filter.toLowerCase() : ""} tables
          </strong>
          <span>Tables will appear here once added.</span>
        </div>
      ) : (
        <div className="tables-grid">
          {filtered.map((table) => (
            <div
              key={table.id}
              className={`table-card ${cardClass[table.status]}`}
            >
              {/* Top: status badge */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span
                  className={`table-status-badge ${badgeClass[table.status]}`}
                >
                  {table.status}
                </span>
              </div>

              <div>
                <div className="table-number">{table.tableNumber}</div>
                <div className="table-capacity" style={{ marginTop: 4 }}>
                  <i
                    className="ti ti-users"
                    style={{ fontSize: 13 }}
                    aria-hidden="true"
                  />
                  {table.capacity} seats
                </div>
              </div>

              {table.status === "Reserved" && table.reservedBy && (
                <div className="reserved-by">
                  <i className="ti ti-user" aria-hidden="true" />
                  {table.reservedBy}
                </div>
              )}

              {/* Actions */}
              {table.status === "Available" && (
                <div className="table-actions">
                  <button
                    className="btn-primary table-btn"
                    disabled={actionLoading === table.id}
                    onClick={() => updateStatus(table.id, "Occupied")}
                  >
                    {actionLoading === table.id ? "…" : "Seat Walk-in"}
                  </button>
                  <button
                    className="btn-secondary table-btn"
                    disabled={actionLoading === table.id}
                    onClick={() => {
                      setError("");
                      setReserveTarget(table);
                    }}
                  >
                    <i className="ti ti-calendar" aria-hidden="true" /> Reserve
                  </button>
                </div>
              )}

              {table.status === "Occupied" && (
                <button
                  className="btn-danger table-btn mark-available-btn"
                  disabled={actionLoading === table.id}
                  onClick={() => updateStatus(table.id, "Available")}
                >
                  {actionLoading === table.id ? "…" : "Mark Available"}
                </button>
              )}

              {table.status === "Reserved" && (
                <div className="table-actions">
                  <button
                    className="btn-primary table-btn"
                    disabled={actionLoading === table.id}
                    onClick={() => updateStatus(table.id, "Occupied")}
                  >
                    {actionLoading === table.id ? "…" : "Seat Customer"}
                  </button>
                  <button
                    className="btn-secondary table-btn"
                    disabled={actionLoading === table.id}
                    onClick={() => {
                      setError("");
                      setCancelTarget(table);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Add Table Modal ── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAdd}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Table</h3>
              <button className="modal-close-btn" onClick={closeAdd}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} className="modal-body">
              {error && <div className="login-error">⚠ {error}</div>}
              <div className="form-group">
                <label className="form-label">Table Number</label>
                <input
                  className="form-input"
                  placeholder="e.g. T-09"
                  value={form.tableNumber}
                  onChange={(e) =>
                    setForm({ ...form, tableNumber: e.target.value })
                  }
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) =>
                    setForm({ ...form, capacity: e.target.value })
                  }
                  required
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeAdd}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={actionLoading === "create"}
                >
                  {actionLoading === "create" ? "Creating…" : "Create Table"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Reserve Modal ── */}
      {reserveTarget && (
        <div className="modal-overlay" onClick={closeReserve}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header modal-amber">
              <h3>Reserve {reserveTarget.tableNumber}</h3>
              <button className="modal-close-btn" onClick={closeReserve}>
                ✕
              </button>
            </div>
            <form onSubmit={handleReserveSubmit} className="modal-body">
              {error && <div className="login-error">⚠ {error}</div>}
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Maria Santos"
                  value={reserveName}
                  onChange={(e) => setReserveName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeReserve}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ background: "#d97706" }}
                  disabled={actionLoading === reserveTarget.id}
                >
                  {actionLoading === reserveTarget.id
                    ? "Reserving…"
                    : "Confirm Reservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Cancel Reservation Modal ── */}
      {cancelTarget && (
        <div className="modal-overlay" onClick={closeCancel}>
          <div
            className="modal-box confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header modal-red">
              <h3>Cancel Reservation</h3>
              <button className="modal-close-btn" onClick={closeCancel}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              {error && <div className="login-error">⚠ {error}</div>}
              <p
                style={{
                  color: "#4b5563",
                  fontSize: 14,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                Cancel the reservation for{" "}
                <strong>{cancelTarget.reservedBy}</strong> at{" "}
                <strong>{cancelTarget.tableNumber}</strong>? The table will
                become available again.
              </p>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeCancel}>
                  Keep Reservation
                </button>
                <button
                  className="btn-danger"
                  disabled={actionLoading === cancelTarget.id}
                  onClick={() => updateStatus(cancelTarget.id, "Available")}
                >
                  {actionLoading === cancelTarget.id
                    ? "Cancelling…"
                    : "Yes, Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default TableMap;
