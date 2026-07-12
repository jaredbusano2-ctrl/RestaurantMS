import { useState, useEffect } from "react";
import { FiCheckCircle, FiImage, FiUpload, FiX } from "react-icons/fi";
import MainLayout from "../../layouts/MainLayout";
import ConfirmDialog from "../../components/Modal/ConfirmDialog";
import Modal from "../../components/Modal/Modal";
import axiosInstance from "../../utils/axiosInstance";
import "./Menu.css";

const API_BASE = "http://localhost:5000";

const MenuList = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletedName, setDeletedName] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    inventoryItemId: "",
    isAvailable: true,
    imageUrl: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes, invRes] = await Promise.all([
        axiosInstance.get("/api/menu"),
        axiosInstance.get("/api/menu/categories"),
        axiosInstance.get("/api/inventory"),
      ]);
      setItems(itemsRes.data.data || []);
      setCategories(catsRes.data.data || []);
      setInventoryItems(invRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    activeCategory === "All"
      ? items
      : items.filter((i) => i.category === activeCategory);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axiosInstance.post("/api/menu/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({ ...prev, imageUrl: res.data.data }));
    } catch (err) {
      console.error(err);
      alert(
        "Failed to upload image. Please try a smaller file (under 5MB) in JPG, PNG, or WEBP format.",
      );
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  // New function to remove image
  const handleRemoveImage = () => {
    setImagePreview(null);
    setForm((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        inventoryItemId: form.inventoryItemId
          ? Number(form.inventoryItemId)
          : null,
      };
      if (editItem) {
        await axiosInstance.put(`/api/menu/${editItem.id}`, payload);
      } else {
        await axiosInstance.post("/api/menu", payload);
      }
      closeFormModal();
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await axiosInstance.delete(`/api/menu/${deleteTarget.id}`);
      setDeletedName(deleteTarget.name);
      setDeleteTarget(null);
      setShowSuccessModal(true);
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || "",
      price: item.price,
      categoryId: item.categoryId,
      inventoryItemId: item.inventoryItemId || "",
      isAvailable: item.isAvailable,
      imageUrl: item.imageUrl || "",
    });
    setImagePreview(item.imageUrl ? `${API_BASE}${item.imageUrl}` : null);
    setShowModal(true);
  };

  const closeFormModal = () => {
    setShowModal(false);
    setEditItem(null);
    setImagePreview(null);
    setForm({
      name: "",
      description: "",
      price: "",
      categoryId: "",
      inventoryItemId: "",
      isAvailable: true,
      imageUrl: "",
    });
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Menu Management</h1>
          <p className="page-subtitle">Manage your restaurant menu items</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Add Item
        </button>
      </div>

      <div className="category-tabs">
        {["All", ...categories.map((c) => c.name)].map((cat) => (
          <button
            key={cat}
            className={`category-tab ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading menu items...</div>
      ) : (
        <div className="menu-grid">
          {filtered.map((item) => (
            <div key={item.id} className="menu-card">
              <div
                className="menu-card-img"
                style={
                  !item.imageUrl
                    ? { background: "#fef2f2", color: "#dc2626" }
                    : { padding: 0, overflow: "hidden" }
                }
              >
                {item.imageUrl ? (
                  <img
                    src={`${API_BASE}${item.imageUrl}`}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  "🍽️"
                )}
              </div>
              <div className="menu-card-body">
                <div className="menu-card-header">
                  <span className="menu-name">{item.name}</span>
                  <span
                    className={`availability-badge ${item.isAvailable ? "available" : "unavailable"}`}
                  >
                    {item.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
                <span className="menu-category">{item.category}</span>
                {item.inventoryItemName && (
                  <span
                    className="menu-category"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 2,
                      color: "#16a34a",
                    }}
                  >
                    <i
                      className="ti ti-package"
                      aria-hidden="true"
                      style={{ fontSize: 13 }}
                    />{" "}
                    {item.inventoryItemName}
                  </span>
                )}
                <p className="menu-description">{item.description}</p>
                <div className="menu-card-footer">
                  <span className="menu-price">
                    ₱{Number(item.price).toFixed(2)}
                  </span>
                  <div className="menu-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleEdit(item)}
                    >
                      <i className="ti ti-pencil" aria-hidden="true" />
                    </button>
                    <button
                      className="btn-icon danger"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <i className="ti ti-trash" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">No menu items found.</div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeFormModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? "Edit Menu Item" : "Add Menu Item"}</h3>
              <button onClick={closeFormModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Item Image</label>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      overflow: "hidden",
                      background: "#f3f4f6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      border: "1px solid #e5e7eb",
                      position: "relative",
                    }}
                  >
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          style={{
                            position: "absolute",
                            top: 2,
                            right: 2,
                            background: "rgba(0,0,0,0.6)",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: 20,
                            height: 20,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: 12,
                            padding: 0,
                          }}
                          title="Remove image"
                        >
                          <FiX size={12} />
                        </button>
                      </>
                    ) : (
                      <FiImage size={28} color="#9ca3af" />
                    )}
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    <label
                      className="btn-secondary"
                      style={{
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        fontSize: "14px",
                      }}
                    >
                      <FiUpload size={16} />
                      {uploading ? "Uploading..." : "Choose Image"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        disabled={uploading}
                        style={{ display: "none" }}
                      />
                    </label>
                    {imagePreview && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleRemoveImage}
                        style={{
                          padding: "8px 16px",
                          fontSize: "14px",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          background: "white",
                          cursor: "pointer",
                          color: "#dc2626",
                        }}
                      >
                        <FiX size={16} style={{ marginRight: 4 }} />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
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
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price (₱)</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Inventory Item (Optional)</label>
                <select
                  className="form-input"
                  value={form.inventoryItemId}
                  onChange={(e) =>
                    setForm({ ...form, inventoryItemId: e.target.value })
                  }
                >
                  <option value="">No inventory link</option>
                  {inventoryItems.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.name} ({inv.currentStock} {inv.unit} in stock)
                    </option>
                  ))}
                </select>
                <span
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    marginTop: 4,
                    display: "block",
                  }}
                >
                  When this item is ordered, 1 unit will be deducted from the
                  linked inventory per quantity ordered.
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label className="toggle-label">
                  <span className="toggle-label-text">Status</span>
                  <div className="toggle-container">
                    <input
                      type="checkbox"
                      checked={form.isAvailable}
                      onChange={(e) =>
                        setForm({ ...form, isAvailable: e.target.checked })
                      }
                      className="toggle-input"
                    />
                    <div
                      className={`toggle-slider ${form.isAvailable ? "active" : ""}`}
                    >
                      <div className="toggle-knob"></div>
                    </div>
                    <span
                      className={`toggle-status ${form.isAvailable ? "active" : ""}`}
                    >
                      {form.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </label>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeFormModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={uploading}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Menu Item"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        type="delete"
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        title="Item Deleted"
        onClose={() => setShowSuccessModal(false)}
        size="sm"
        actions={
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={() => setShowSuccessModal(false)}
          >
            Done
          </button>
        }
      >
        <div className="confirm-dialog-content">
          <div className="confirm-icon-container">
            <FiCheckCircle className="confirm-icon confirm-icon-save" />
          </div>
          <p className="confirm-message">
            <strong>"{deletedName}"</strong> has been successfully deleted from
            the menu.
          </p>
        </div>
      </Modal>
    </MainLayout>
  );
};

export default MenuList;
