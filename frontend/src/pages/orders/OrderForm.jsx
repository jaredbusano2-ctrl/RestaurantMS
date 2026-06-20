import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import axiosInstance from '../../utils/axiosInstance';
import './Orders.css';

const OrderForm = () => {
  const [step, setStep] = useState(1);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tablesRes, menuRes, catsRes] = await Promise.all([
          axiosInstance.get('/api/tables'),
          axiosInstance.get('/api/menu'),
          axiosInstance.get('/api/menu/categories')
        ]);
        setTables((tablesRes.data.data || []).filter(t => t.status === 'Available'));
        setMenuItems((menuRes.data.data || []).filter(m => m.isAvailable));
        setCategories(catsRes.data.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.menuItemId === item.id);
      if (existing) return prev.map(c => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQty = (menuItemId, delta) => {
    setCart(prev => {
      const updated = prev.map(c => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c);
      return updated.filter(c => c.quantity > 0);
    });
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const handleSubmit = async () => {
    if (!selectedTable || cart.length === 0) return;
    setLoading(true);
    try {
      await axiosInstance.post('/api/orders', {
        tableId: selectedTable.id,
        specialInstructions,
        items: cart.map(c => ({ menuItemId: c.menuItemId, quantity: c.quantity }))
      });
      navigate('/orders');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMenu = activeCategory === 'All' ? menuItems : menuItems.filter(m => m.category === activeCategory);

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Order</h1>
          <p className="page-subtitle">Create a new customer order</p>
        </div>
      </div>

      <div className="steps-indicator">
        {['Select Table', 'Select Items', 'Confirm'].map((label, i) => (
          <div key={i} className={`step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
            <div className="step-circle">{step > i + 1 ? '✓' : i + 1}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h2 className="section-title">Available Tables</h2>
          <div className="tables-grid">
            {tables.map(table => (
              <div
                key={table.id}
                className={`table-card ${selectedTable?.id === table.id ? 'selected' : ''}`}
                style={{ borderLeftColor: '#16a34a', cursor: 'pointer' }}
                onClick={() => setSelectedTable(table)}
              >
                <div className="table-card-header">
                  <span className="table-number">{table.tableNumber}</span>
                  {selectedTable?.id === table.id && <span style={{ color: '#dc2626' }}>✓</span>}
                </div>
                <div className="table-capacity">👥 {table.capacity} seats</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" disabled={!selectedTable} onClick={() => setStep(2)}>
              Next: Select Items →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="order-form-layout">
          <div className="menu-selector">
            <div className="category-tabs" style={{ marginBottom: 16 }}>
              {['All', ...categories.map(c => c.name)].map(cat => (
                <button key={cat} className={`category-tab ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="menu-grid">
              {filteredMenu.map(item => (
                <div key={item.id} className="menu-card" style={{ cursor: 'pointer' }} onClick={() => addToCart(item)}>
                  <div className="menu-card-img" style={{ background: '#fef2f2', color: '#dc2626', height: 80 }}>🍽️</div>
                  <div className="menu-card-body">
                    <div className="menu-name">{item.name}</div>
                    <div className="menu-price" style={{ marginTop: 4 }}>₱{Number(item.price).toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-panel">
            <h3 style={{ marginBottom: 16 }}>Cart — {selectedTable?.tableNumber}</h3>
            {cart.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>No items added yet</p>
            ) : (
              cart.map(item => (
                <div key={item.menuItemId} className="cart-item">
                  <span className="cart-item-name">{item.name}</span>
                  <div className="cart-item-controls">
                    <button onClick={() => updateQty(item.menuItemId, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.menuItemId, 1)}>+</button>
                  </div>
                  <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))
            )}
            {cart.length > 0 && (
              <div className="cart-total">
                <span>Total</span>
                <strong>₱{total.toFixed(2)}</strong>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-primary" style={{ flex: 1 }} disabled={cart.length === 0} onClick={() => setStep(3)}>
                Next: Confirm →
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="confirm-panel">
          <h2 className="section-title">Confirm Order</h2>
          <div className="card" style={{ padding: 24, marginBottom: 16 }}>
            <p><strong>Table:</strong> {selectedTable?.tableNumber}</p>
            <p style={{ marginTop: 8 }}><strong>Items:</strong></p>
            {cart.map(item => (
              <div key={item.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span>{item.quantity}× {item.name}</span>
                <span>₱{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontWeight: 700, fontSize: 18 }}>
              <span>Total</span>
              <span style={{ color: '#dc2626' }}>₱{total.toFixed(2)}</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Special Instructions</label>
            <textarea className="form-input" rows="3" placeholder="Any special requests..." value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
            <button className="btn-primary" disabled={loading} onClick={handleSubmit}>
              {loading ? 'Placing Order...' : '✓ Place Order'}
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default OrderForm;