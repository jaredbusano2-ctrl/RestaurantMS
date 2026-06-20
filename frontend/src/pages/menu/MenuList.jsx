import { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import axiosInstance from '../../utils/axiosInstance';
import './Menu.css';

const MenuList = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', categoryId: '', isAvailable: true });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsRes, catsRes] = await Promise.all([
        axiosInstance.get('/api/menu'),
        axiosInstance.get('/api/menu/categories')
      ]);
      setItems(itemsRes.data.data || []);
      setCategories(catsRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeCategory === 'All'
    ? items
    : items.filter(i => i.category === activeCategory);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await axiosInstance.put(`/api/menu/${editItem.id}`, form);
      } else {
        await axiosInstance.post('/api/menu', form);
      }
      setShowModal(false);
      setEditItem(null);
      setForm({ name: '', description: '', price: '', categoryId: '', isAvailable: true });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await axiosInstance.delete(`/api/menu/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: item.categoryId,
      isAvailable: item.isAvailable
    });
    setShowModal(true);
  };

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Menu Management</h1>
          <p className="page-subtitle">Manage your restaurant menu items</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Item</button>
      </div>

      <div className="category-tabs">
        {['All', ...categories.map(c => c.name)].map(cat => (
          <button
            key={cat}
            className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
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
          {filtered.map(item => (
            <div key={item.id} className="menu-card">
              <div className="menu-card-img" style={{ background: '#fef2f2', color: '#dc2626' }}>
                🍽️
              </div>
              <div className="menu-card-body">
                <div className="menu-card-header">
                  <span className="menu-name">{item.name}</span>
                  <span className={`availability-badge ${item.isAvailable ? 'available' : 'unavailable'}`}>
                    {item.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                <span className="menu-category">{item.category}</span>
                <p className="menu-description">{item.description}</p>
                <div className="menu-card-footer">
                  <span className="menu-price">₱{Number(item.price).toFixed(2)}</span>
                  <div className="menu-actions">
                    <button className="btn-icon" onClick={() => handleEdit(item)}>✏️</button>
                    <button className="btn-icon danger" onClick={() => handleDelete(item.id)}>🗑️</button>
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

      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditItem(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
              <button onClick={() => { setShowModal(false); setEditItem(null); }}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price (₱)</label>
                <input className="form-input" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.isAvailable} onChange={e => setForm({ ...form, isAvailable: e.target.checked })} />
                  Available
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => { setShowModal(false); setEditItem(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default MenuList;