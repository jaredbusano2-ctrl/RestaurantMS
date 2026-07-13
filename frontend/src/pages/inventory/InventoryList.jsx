import { useState, useEffect } from "react";
import MainLayout from "../../layouts/MainLayout";
import ConfirmDialog from "../../components/Modal/ConfirmDialog";
import axiosInstance from "../../utils/axiosInstance";
import "./Inventory.css";

const InventoryList = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [archivedItems, setArchivedItems] = useState([]);
  const [viewMode, setViewMode] = useState("active");
  const [unarchiveTarget, setUnarchiveTarget] = useState(null);
  const [unarchiveLoading, setUnarchiveLoading] = useState(false);
  const [errorModal, setErrorModal] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  const emptyForm = {
    name: "",
    unit: "",
    currentStock: "",
    minimumStock: "",
    reason: "",
  };
  const [form, setForm] = useState(emptyForm);
  const [addForm, setAddForm] = useState({
    name: "",
    unit: "",
    currentStock: "",
    minimumStock: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchItems();
  }, []);

  const getUsedInMenuItems = (inventoryItemId) => {
    return menuItems
      .filter((m) =>
        m.ingredients?.some((ing) => ing.inventoryItemId === inventoryItemId),
      )
      .map((m) => m.name);
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [activeRes, archivedRes, menuRes] = await Promise.all([
        axiosInstance
          .get("/api/inventory")
          .catch(() => ({ data: { data: [] } })),
        axiosInstance
          .get("/api/inventory/archived")
          .catch(() => ({ data: { data: [] } })),
        axiosInstance.get("/api/menu").catch(() => ({ data: { data: [] } })),
      ]);
      setItems(activeRes.data.data || []);
      setArchivedItems(archivedRes.data.data || []);
      setMenuItems(menuRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchiveConfirm = async () => {
    if (!unarchiveTarget) return;
    setUnarchiveLoading(true);
    try {
      await axiosInstance.put(`/api/inventory/${unarchiveTarget.id}/unarchive`);
      setUnarchiveTarget(null);
      fetchItems();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to restore item.");
    } finally {
      setUnarchiveLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      unit: item.unit,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      reason: "",
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosInstance.put(`/api/inventory/${editItem.id}`, {
        name: form.name,
        unit: form.unit,
        currentStock: parseFloat(form.currentStock),
        minimumStock: parseFloat(form.minimumStock),
        reason: form.reason || "Manual adjustment",
      });
      setEditItem(null);
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosInstance.post("/api/inventory", {
        name: addForm.name,
        unit: addForm.unit,
        currentStock: parseFloat(addForm.currentStock),
        minimumStock: parseFloat(addForm.minimumStock),
      });
      setShowAddModal(false);
      setAddForm({ name: "", unit: "", currentStock: "", minimumStock: "" });
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    setArchiveLoading(true);
    try {
      await axiosInstance.put(`/api/inventory/${archiveTarget.id}/archive`);
      setArchiveTarget(null);
      fetchItems();
    } catch (err) {
      console.error(err);
      setArchiveTarget(null);
      setErrorModal(err.response?.data?.message || "Failed to archive item.");
    } finally {
      setArchiveLoading(false);
    }
  };

  const lowStock = items.filter((i) => i.isLowStock && i.currentStock > 0);
  const outOfStock = items.filter((i) => i.currentStock === 0);
  const goodStock = items.filter((i) => !i.isLowStock && i.currentStock > 0);

  const getFiltered = () => {
    let result = items;
    if (filter === "Low Stock") result = lowStock;
    else if (filter === "Out of Stock") result = outOfStock;
    else if (filter === "Good") result = goodStock;
    if (search)
      result = result.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase()),
      );
    return result;
  };

  const getStatusStyle = (item) => {
    if (item.currentStock === 0)
      return { bg: "#fee2e2", color: "#991b1b", label: "Out of Stock" };
    if (item.isLowStock)
      return { bg: "#fef3c7", color: "#92400e", label: "Low Stock" };
    return { bg: "#d1fae5", color: "#065f46", label: "Good" };
  };

  const getStockBarWidth = (item) => {
    if (item.minimumStock === 0) return 100;
    const pct = (item.currentStock / (item.minimumStock * 3)) * 100;
    return Math.min(pct, 100);
  };

  const getStockBarColor = (item) => {
    if (item.currentStock === 0) return "#dc2626";
    if (item.isLowStock) return "#d97706";
    return "#16a34a";
  };

  const filtered = getFiltered();
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );
  const displayedItems =
    viewMode === "archived" ? archivedItems : paginatedItems;

  const UNITS = [
    "pcs",
    "kg",
    "g",
    "liters",
    "ml",
    "heads",
    "slices",
    "boxes",
    "bags",
    "bottles",
  ];

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Track and manage stock levels</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-secondary" onClick={fetchItems}>
            <i className="ti ti-refresh" /> Refresh
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <i className="ti ti-plus" /> Add Item
          </button>
        </div>
      </div>

      {/* Summary Cards - matching table page exactly */}
      <div
        className="table-stats"
        style={{ maxWidth: "100%", gridTemplateColumns: "repeat(4, 1fr)" }}
      >
        <div className="table-stat">
          <div
            className="table-stat-icon"
            style={{ background: "#eff6ff", color: "#2563eb" }}
          >
            <i className="ti ti-package" />
          </div>
          <div className="table-stat-info">
            <div className="table-stat-num" style={{ color: "#1a1714" }}>
              {items.length}
            </div>
            <div className="table-stat-label">Total Items</div>
          </div>
        </div>
        <div className="table-stat">
          <div
            className="table-stat-icon"
            style={{ background: "#dcfce7", color: "#15803d" }}
          >
            <i className="ti ti-circle-check" />
          </div>
          <div className="table-stat-info">
            <div className="table-stat-num" style={{ color: "#15803d" }}>
              {goodStock.length}
            </div>
            <div className="table-stat-label">Good Stock</div>
          </div>
        </div>
        <div className="table-stat">
          <div
            className="table-stat-icon"
            style={{ background: "#fef3c7", color: "#b45309" }}
          >
            <i className="ti ti-alert-triangle" />
          </div>
          <div className="table-stat-info">
            <div className="table-stat-num" style={{ color: "#b45309" }}>
              {lowStock.length}
            </div>
            <div className="table-stat-label">Low Stock</div>
          </div>
        </div>
        <div className="table-stat">
          <div
            className="table-stat-icon"
            style={{ background: "#fee2e2", color: "#dc2626" }}
          >
            <i className="ti ti-alert-circle" />
          </div>
          <div className="table-stat-info">
            <div className="table-stat-num" style={{ color: "#dc2626" }}>
              {outOfStock.length}
            </div>
            <div className="table-stat-label">Out of Stock</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="inv-alerts">
          {outOfStock.map((item) => (
            <div key={item.id} className="inv-alert danger">
              <i className="ti ti-alert-circle" /> <strong>{item.name}</strong>{" "}
              is out of stock!
            </div>
          ))}
          {lowStock.map((item) => (
            <div key={item.id} className="inv-alert warning">
              <i className="ti ti-alert-triangle" />{" "}
              <strong>{item.name}</strong> is running low — {item.currentStock}{" "}
              {item.unit} remaining
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="inv-filters">
        <div className="topbar-search" style={{ maxWidth: 280 }}>
          <i className="ti ti-search" />
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {["All", "Good", "Low Stock", "Out of Stock"].map((f) => (
            <button
              key={f}
              className={`filter-pill ${filter === f && viewMode === "active" ? "active" : ""}`}
              onClick={() => {
                setViewMode("active");
                setFilter(f);
              }}
            >
              {f}
              <span className="filter-pill-count">
                {f === "All"
                  ? items.length
                  : f === "Good"
                    ? goodStock.length
                    : f === "Low Stock"
                      ? lowStock.length
                      : outOfStock.length}
              </span>
            </button>
          ))}
          <button
            className={`filter-pill ${viewMode === "archived" ? "active" : ""}`}
            onClick={() => setViewMode("archived")}
          >
            <i className="ti ti-archive" aria-hidden="true" /> Archived
            <span className="filter-pill-count">{archivedItems.length}</span>
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading">Loading inventory...</div>
      ) : (
        <div className="orders-table-wrapper">
          <table className="orders-table">
            <thead>
              <tr>
                <th style={{ width: "25%" }}>Item Name</th>
                <th style={{ width: "8%" }}>Unit</th>
                <th style={{ width: "20%" }}>Stock Level</th>
                <th style={{ width: "8%" }}>Current</th>
                <th style={{ width: "8%" }}>Minimum</th>
                <th style={{ width: "14%" }}>Used In</th>
                <th style={{ width: "12%" }}>Status</th>
                <th style={{ width: "12%" }}>Last Updated</th>
                <th style={{ width: "15%", paddingLeft: "60px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.map((item) => {
                const status = getStatusStyle(item);
                return (
                  <tr
                    key={item.id}
                    className={
                      item.currentStock === 0
                        ? "row-danger"
                        : item.isLowStock
                          ? "row-warning"
                          : ""
                    }
                  >
                    <td style={{ width: "25%" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        {item.currentStock === 0 ? (
                          <i
                            className="ti ti-alert-circle"
                            style={{ color: "#dc2626" }}
                          />
                        ) : item.isLowStock ? (
                          <i
                            className="ti ti-alert-triangle"
                            style={{ color: "#d97706" }}
                          />
                        ) : (
                          <i
                            className="ti ti-circle-check"
                            style={{ color: "#16a34a" }}
                          />
                        )}
                        <strong>{item.name}</strong>
                      </div>
                    </td>
                    <td style={{ width: "8%", color: "#6b7280" }}>
                      {item.unit}
                    </td>
                    <td style={{ width: "20%", minWidth: 100 }}>
                      <div className="stock-bar-bg">
                        <div
                          className="stock-bar-fill"
                          style={{
                            width: `${getStockBarWidth(item)}%`,
                            background: getStockBarColor(item),
                          }}
                        />
                      </div>
                    </td>
                    <td style={{ width: "8%" }}>
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            item.currentStock === 0
                              ? "#dc2626"
                              : item.isLowStock
                                ? "#d97706"
                                : "#16a34a",
                        }}
                      >
                        {item.currentStock}
                      </span>
                    </td>
                    <td style={{ width: "8%", color: "#6b7280" }}>
                      {item.minimumStock}
                    </td>
                    <td
                      style={{ width: "14%", fontSize: 12, color: "#6b7280" }}
                    >
                      {(() => {
                        const usedIn = getUsedInMenuItems(item.id);
                        if (usedIn.length === 0)
                          return <span style={{ color: "#d1d5db" }}>—</span>;
                        if (usedIn.length <= 2) return usedIn.join(", ");
                        return (
                          <span title={usedIn.join(", ")}>
                            {usedIn.slice(0, 2).join(", ")} +{usedIn.length - 2}{" "}
                            more
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ width: "12%" }}>
                      <span
                        className="status-badge"
                        style={{ background: status.bg, color: status.color }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td
                      style={{
                        width: "12%",
                        color: "#9ca3af",
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {new Date(item.lastUpdated).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ width: "15%" }}>
                      <div
                        style={{
                          display: "flex",
                          gap: "4px",
                          alignItems: "center",
                        }}
                      >
                        {viewMode === "archived" ? (
                          <button
                            className="inv-action-btn"
                            onClick={() => setUnarchiveTarget(item)}
                          >
                            <i
                              className="ti ti-arrow-back-up"
                              aria-hidden="true"
                            />
                            <span>Restore</span>
                          </button>
                        ) : (
                          <>
                            <button
                              className="inv-action-btn"
                              onClick={() => handleEdit(item)}
                            >
                              <i className="ti ti-pencil" aria-hidden="true" />
                              <span>Edit</span>
                            </button>
                            <button
                              className="inv-action-btn inv-action-warning"
                              onClick={() => setArchiveTarget(item)}
                            >
                              <i className="ti ti-archive" aria-hidden="true" />
                              <span>Archive</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {displayedItems.length === 0 && (
                <tr>
                  <td colSpan="9" className="empty-state">
                    {viewMode === "archived"
                      ? "No archived items."
                      : "No inventory items found."}
                  </td>
                </tr>
              )}
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

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Inventory Item</h3>
              <button onClick={() => setShowAddModal(false)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="modal-body">
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  className="form-input"
                  placeholder="e.g. Beef Patties"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  className="form-input"
                  value={addForm.unit}
                  onChange={(e) =>
                    setAddForm({ ...addForm, unit: e.target.value })
                  }
                  required
                >
                  <option value="">Select unit</option>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Current Stock</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={addForm.currentStock}
                    onChange={(e) =>
                      setAddForm({ ...addForm, currentStock: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Minimum Stock</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={addForm.minimumStock}
                    onChange={(e) =>
                      setAddForm({ ...addForm, minimumStock: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Adding..." : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Item — {editItem.name}</h3>
              <button onClick={() => setEditItem(null)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="modal-body">
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select
                  className="form-input"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  required
                >
                  <option value="">Select unit</option>
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
              <div className="inv-current-info">
                <div className="inv-info-row">
                  <span>Current Stock</span>
                  <strong
                    style={{
                      color:
                        editItem.currentStock === 0
                          ? "#dc2626"
                          : editItem.isLowStock
                            ? "#d97706"
                            : "#16a34a",
                    }}
                  >
                    {editItem.currentStock} {editItem.unit}
                  </strong>
                </div>
                <div className="inv-info-row">
                  <span>Minimum Stock</span>
                  <strong>
                    {editItem.minimumStock} {editItem.unit}
                  </strong>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    New Current Stock ({form.unit || editItem.unit})
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.currentStock}
                    onChange={(e) =>
                      setForm({ ...form, currentStock: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    New Minimum Stock ({form.unit || editItem.unit})
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.minimumStock}
                    onChange={(e) =>
                      setForm({ ...form, minimumStock: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Adjustment</label>
                <select
                  className="form-input"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                >
                  <option value="">Select reason...</option>
                  <option value="Restocked">Restocked</option>
                  <option value="Manual count correction">
                    Manual count correction
                  </option>
                  <option value="Spoilage/Waste">Spoilage / Waste</option>
                  <option value="Returned to supplier">
                    Returned to supplier
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Confirmation */}
      <ConfirmDialog
        isOpen={!!archiveTarget}
        title="Archive Inventory Item"
        message={`Archive "${archiveTarget?.name}"? It will be hidden from the active list but its stock history is preserved. You can restore it anytime from the Archived filter.`}
        type="warning"
        confirmText="Archive"
        cancelText="Cancel"
        isLoading={archiveLoading}
        onConfirm={handleArchiveConfirm}
        onCancel={() => setArchiveTarget(null)}
      />

      {/* Unarchive Confirmation */}
      <ConfirmDialog
        isOpen={!!unarchiveTarget}
        title="Restore Inventory Item"
        message={`Restore "${unarchiveTarget?.name}"? It will reappear in the active inventory list.`}
        type="success"
        confirmText="Restore"
        cancelText="Cancel"
        isLoading={unarchiveLoading}
        onConfirm={handleUnarchiveConfirm}
        onCancel={() => setUnarchiveTarget(null)}
      />
      {errorModal && (
        <div className="modal-overlay" onClick={() => setErrorModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cannot archive item</h3>
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
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default InventoryList;
