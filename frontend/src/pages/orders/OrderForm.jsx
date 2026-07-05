import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronRight, FiShoppingCart, FiMinus, FiPlus, FiArrowLeft, FiCheck } from 'react-icons/fi';
import MainLayout from '../../layouts/MainLayout';
import Button from '../../components/Button/Button';
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
      } catch (err) { console.error(err); }
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
    setCart(prev =>
      prev.map(c => c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c)
          .filter(c => c.quantity > 0)
    );
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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filteredMenu = activeCategory === 'All'
    ? menuItems
    : menuItems.filter(m => m.category === activeCategory);

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Order</h1>
          <p className="page-subtitle">Create a new customer order</p>
        </div>
      </div>

      <div className="steps-container">
        {['Select Table', 'Select Items', 'Confirm'].map((label, i) => (
          <div key={i} className={`step-item ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
            <div className="step-circle">
              {step > i + 1 ? <FiCheck size={20} /> : <span>{i + 1}</span>}
            </div>
            <span className="step-label">{label}</span>
            {i < 2 && <div className="step-line"></div>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="step-content">
          <h2 className="section-title">Available Tables</h2>
          <div className="tables-grid">
            {tables.map((table) => (
              <div
                key={table.id}
                className={`table-selection-card ${selectedTable?.id === table.id ? 'selected' : ''}`}
                onClick={() => setSelectedTable(table)}
              >
                <div className="table-card-content">
                  <div className="table-badge">{table.tableNumber}</div>
                  <div className="table-capacity-info">
                    <span className="capacity-icon">👥</span>
                    <span className="capacity-text">{table.capacity} seats</span>
                  </div>
                </div>
                {selectedTable?.id === table.id && (
                  <div className="selection-checkmark"><FiCheck size={24} /></div>
                )}
              </div>
            ))}
          </div>
          <div className="step-actions">
            <Button variant="primary" icon={FiChevronRight} disabled={!selectedTable} onClick={() => setStep(2)} size="lg">
              Next: Select Items
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="order-form-container">
          <div className="menu-section">
            <h2 className="section-title">Select Items</h2>
            <div className="category-tabs">
              {['All', ...categories.map(c => c.name)].map((cat) => (
                <button key={cat} className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="menu-grid">
              {filteredMenu.map((item) => (
                <div key={item.id} className="menu-item-card" onClick={() => addToCart(item)}>
                  <div className="menu-item-image">🍽️</div>
                  <div className="menu-item-info">
                    <div className="menu-item-name">{item.name}</div>
                    <div className="menu-item-price">₱{Number(item.price).toFixed(2)}</div>
                  </div>
                  <div className="menu-item-action"><FiPlus size={18} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="cart-sidebar">
            <div className="cart-header">
              <FiShoppingCart size={20} />
              <h3>Order Summary</h3>
              {cart.length > 0 && (
                <span className="cart-badge">{cart.reduce((sum, c) => sum + c.quantity, 0)}</span>
              )}
            </div>
            <div className="cart-table-info">
              <span className="cart-table-label">Table</span>
              <span className="cart-table-number">{selectedTable?.tableNumber}</span>
            </div>
            {cart.length === 0 ? (
              <div className="cart-empty">
                <FiShoppingCart size={32} />
                <p>No items added yet</p>
                <span>Add items from the menu to get started</span>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="cart-item">
                      <div className="cart-item-details">
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-item-price">₱{(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                      <div className="cart-item-quantity">
                        <button className="qty-btn" onClick={() => updateQty(item.menuItemId, -1)}><FiMinus size={14} /></button>
                        <span className="qty-value">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateQty(item.menuItemId, 1)}><FiPlus size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="cart-divider"></div>
                <div className="cart-total">
                  <span className="total-label">Total</span>
                  <span className="total-amount">₱{total.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="cart-actions">
              <Button variant="secondary" icon={FiArrowLeft} onClick={() => setStep(1)} size="lg">Back</Button>
              <Button variant="primary" icon={FiChevronRight} disabled={cart.length === 0} onClick={() => setStep(3)} size="lg">Next</Button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="confirm-section">
          <h2 className="section-title">Confirm Order</h2>
          <div className="order-summary-card">
            <div className="order-summary-header">
              <div><span className="summary-label">Table</span><span className="summary-value">{selectedTable?.tableNumber}</span></div>
              <div><span className="summary-label">Items</span><span className="summary-value">{cart.reduce((sum, c) => sum + c.quantity, 0)}</span></div>
              <div><span className="summary-label">Total</span><span className="summary-value price">₱{total.toFixed(2)}</span></div>
            </div>
            <div className="order-summary-items">
              <h4 className="items-title">Order Items</h4>
              {cart.map((item) => (
                <div key={item.menuItemId} className="order-item">
                  <div className="order-item-qty">{item.quantity}×</div>
                  <span className="order-item-name">{item.name}</span>
                  <span className="order-item-price">₱{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Special Instructions (Optional)</label>
            <textarea className="form-input" rows="4"
              placeholder="Any special requests or dietary notes..."
              value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} />
          </div>
          <div className="confirm-actions">
            <Button variant="secondary" icon={FiArrowLeft} onClick={() => setStep(2)} size="lg">Back</Button>
            <Button variant="primary" icon={FiCheck} disabled={loading} onClick={handleSubmit} size="lg">
              {loading ? 'Placing Order...' : 'Place Order'}
            </Button>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default OrderForm;
