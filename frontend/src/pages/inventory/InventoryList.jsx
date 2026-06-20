import { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import axiosInstance from '../../utils/axiosInstance';
import './Inventory.css';

const InventoryList = () => {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ currentStock: '', minimumStock: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/api/inventory');
      setItems(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      reason: ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axiosInstance.put(`/api/inventory/${editItem.id}`, {
        currentStock: parseFloat(form.currentStock),
        minimumStock: parseFloat(form.minimumStock),
        reason: form.reason || 'Manual adjustment'
      });
      setEditItem(null);
      fetchItems();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const lowStock = items.filter(i => i.isLowStock && i.currentStock > 0);
  const outOfStock = items.filter(i => i.currentStock === 0);
  const goodStock = items.filter(i => !i.isLowStock && i.currentStock > 0);

  const getFiltered = () => {
    let result = items;
    if (filter === 'Low Stock') result = lowStock;
    else if (filter === 'Out of Stock') result = outOfStock;
    else if (filter === 'Good') result = goodStock;
    if (search) result = result.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    return result;
  };

  const getStatusStyle = (item) => {
    if (item.currentStock === 0) return { bg: '#fee2e2', color: '#991b1b', label: 'Out of Stock' };
    if (item.isLowStock) return { bg: '#fef3c7', color: '#92400e', label: 'Low Stock' };
    return { bg: '#d1fae5', color: '#065f46', label: 'Good' };
  };

  const getStockBarWidth = (item) => {
    if (item.minimumStock === 0) return 100;
    const pct = (item.currentStock / (item.minimumStock * 3)) * 100;
    return Math.min(pct, 100);
  };

  const getStockBarColor = (item) => {
    if (item.currentStock === 0) return '#dc2626';
    if (item.isLowStock) return '#d97706';
    return '#16a34a';
  };

  const filtered = getFiltered();

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Track and manage stock levels</p>
        </div>
        <button className="btn-secondary" onClick={fetchItems}>↻ Refresh</button>
      </div>

      {/* Summary Cards */}
      <div className="inv-summary">
        <div className="inv-sum-card total">
          <div className="inv-sum-icon">📦</div>
          <div>
            <div className="inv-sum-value">{items.length}</div>
            <div className="inv-sum-label">Total Items</div>
          </div>
        </div>
        <div className="inv-sum-card good">
          <div className="inv-sum-icon">✅</div>
          <div>
            <div className="inv-sum-value">{goodStock.length}</div>
            <div className="inv-sum-label">Good Stock</div>
          </div>
        </div>
        <div className="inv-sum-card warning">
          <div className="inv-sum-icon">⚠️</div>
          <div>
            <div className="inv-sum-value">{lowStock.length}</div>
            <div className="inv-sum-label">Low Stock</div>
          </div>
        </div>
        <div className="inv-sum-card danger">
          <div className="inv-sum-icon">🚨</div>
          <div>
            <div className="inv-sum-value">{outOfStock.length}</div>
            <div className="inv-sum-label">Out of Stock</div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(lowStock.length > 0 || outOfStock.length > 0) && (
        <div className="inv-alerts">
          {outOfStock.map(item => (
            <div key={item.id} className="inv-alert danger">
              🚨 <strong>{item.name}</strong> is out of stock!
            </div>
          ))}
          {lowStock.map(item => (
            <div key={item.id} className="inv-alert warning">
              ⚠ <strong>{item.name}</strong> is running low — {item.currentStock} {item.unit} remaining
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="inv-filters">
        <div className="topbar-search" style={{ maxWidth: 280 }}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {['All', 'Good', 'Low Stock', 'Out of Stock'].map(f => (
            <button
              key={f}
              className={`filter-pill ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
              <span className="filter-pill-count">
                {f === 'All' ? items.length
                  : f === 'Good' ? goodStock.length
                  : f === 'Low Stock' ? lowStock.length
                  : outOfStock.length}
              </span>
            </button>
          ))}
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
                <th>Item Name</th>
                <th>Unit</th>
                <th>Stock Level</th>
                <th>Current</th>
                <th>Minimum</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const status = getStatusStyle(item);
                return (
                  <tr key={item.id} className={item.currentStock === 0 ? 'row-danger' : item.isLowStock ? 'row-warning' : ''}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.currentStock === 0
                          ? <span title="Out of stock">🚨</span>
                          : item.isLowStock
                            ? <span title="Low stock">⚠️</span>
                            : <span title="Good">✅</span>
                        }
                        <strong>{item.name}</strong>
                      </div>
                    </td>
                    <td style={{ color: '#6b7280' }}>{item.unit}</td>
                    <td style={{ minWidth: 120 }}>
                      <div className="stock-bar-bg">
                        <div
                          className="stock-bar-fill"
                          style={{
                            width: `${getStockBarWidth(item)}%`,
                            background: getStockBarColor(item)
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        color: item.currentStock === 0 ? '#dc2626' : item.isLowStock ? '#d97706' : '#16a34a'
                      }}>
                        {item.currentStock}
                      </span>
                    </td>
                    <td style={{ color: '#6b7280' }}>{item.minimumStock}</td>
                    <td>
                      <span className="status-badge" style={{ background: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ color: '#9ca3af', fontSize: 12 }}>
                      {new Date(item.lastUpdated).toLocaleDateString('en-PH', {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </td>
                    <td>
                      <button className="btn-icon" onClick={() => handleEdit(item)} title="Update stock">
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="8" className="empty-state">No inventory items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Stock — {editItem.name}</h3>
              <button onClick={() => setEditItem(null)}>✕</button>
            </div>
            <form onSubmit={handleUpdate} className="modal-body">
              <div className="inv-current-info">
                <div className="inv-info-row">
                  <span>Current Stock</span>
                  <strong style={{ color: editItem.currentStock === 0 ? '#dc2626' : editItem.isLowStock ? '#d97706' : '#16a34a' }}>
                    {editItem.currentStock} {editItem.unit}
                  </strong>
                </div>
                <div className="inv-info-row">
                  <span>Minimum Stock</span>
                  <strong>{editItem.minimumStock} {editItem.unit}</strong>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">New Current Stock ({editItem.unit})</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.currentStock}
                    onChange={e => setForm({ ...form, currentStock: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Minimum Stock ({editItem.unit})</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.minimumStock}
                    onChange={e => setForm({ ...form, minimumStock: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason for Adjustment</label>
                <select
                  className="form-input"
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                >
                  <option value="">Select reason...</option>
                  <option value="Restocked">Restocked</option>
                  <option value="Manual count correction">Manual count correction</option>
                  <option value="Spoilage/Waste">Spoilage / Waste</option>
                  <option value="Returned to supplier">Returned to supplier</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default InventoryList;