import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
      {/* Page Header */}
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="page-title">New Order</h1>
          <p className="page-subtitle">Create a new customer order</p>
        </div>
      </motion.div>

      {/* Steps Indicator */}
      <motion.div
        className="steps-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {['Select Table', 'Select Items', 'Confirm'].map((label, i) => (
          <motion.div
            key={i}
            className={`step-item ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}
            whileHover={{ scale: 1.05 }}
          >
            <div className="step-circle">
              {step > i + 1 ? (
                <FiCheck size={20} />
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
            <span className="step-label">{label}</span>
            {i < 2 && <div className="step-line"></div>}
          </motion.div>
        ))}
      </motion.div>

      {/* Step 1: Select Table */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="step-content">
              <h2 className="section-title">Available Tables</h2>
              <div className="tables-grid">
                {tables.map((table, idx) => (
                  <motion.div
                    key={table.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <motion.div
                      className={`table-selection-card ${selectedTable?.id === table.id ? 'selected' : ''}`}
                      onClick={() => setSelectedTable(table)}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="table-card-content">
                        <div className="table-badge">{table.tableNumber}</div>
                        <div className="table-capacity-info">
                          <span className="capacity-icon">👥</span>
                          <span className="capacity-text">{table.capacity} seats</span>
                        </div>
                      </div>
                      {selectedTable?.id === table.id && (
                        <motion.div
                          className="selection-checkmark"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <FiCheck size={24} />
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              <div className="step-actions">
                <Button
                  variant="primary"
                  icon={FiChevronRight}
                  disabled={!selectedTable}
                  onClick={() => setStep(2)}
                  size="lg"
                >
                  Next: Select Items
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Items */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="order-form-container">
              {/* Menu Section */}
              <div className="menu-section">
                <h2 className="section-title">Select Items</h2>

                {/* Category Tabs */}
                <div className="category-tabs">
                  {['All', ...categories.map(c => c.name)].map((cat, idx) => (
                    <motion.button
                      key={cat}
                      className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                      onClick={() => setActiveCategory(cat)}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      {cat}
                    </motion.button>
                  ))}
                </div>

                {/* Menu Grid */}
                <div className="menu-grid">
                  <AnimatePresence>
                    {filteredMenu.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: idx * 0.03 }}
                      >
                        <motion.div
                          className="menu-item-card"
                          onClick={() => addToCart(item)}
                          whileHover={{ scale: 1.05, y: -4 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <div className="menu-item-image">🍽️</div>
                          <div className="menu-item-info">
                            <div className="menu-item-name">{item.name}</div>
                            <div className="menu-item-price">₱{Number(item.price).toFixed(2)}</div>
                          </div>
                          <div className="menu-item-action">
                            <FiPlus size={18} />
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              {/* Cart Sidebar */}
              <motion.div
                className="cart-sidebar"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
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
                      <AnimatePresence>
                        {cart.map((item) => (
                          <motion.div
                            key={item.menuItemId}
                            className="cart-item"
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                          >
                            <div className="cart-item-details">
                              <div className="cart-item-name">{item.name}</div>
                              <div className="cart-item-price">₱{(item.price * item.quantity).toFixed(2)}</div>
                            </div>
                            <div className="cart-item-quantity">
                              <motion.button
                                className="qty-btn"
                                onClick={() => updateQty(item.menuItemId, -1)}
                                whileTap={{ scale: 0.9 }}
                              >
                                <FiMinus size={14} />
                              </motion.button>
                              <span className="qty-value">{item.quantity}</span>
                              <motion.button
                                className="qty-btn"
                                onClick={() => updateQty(item.menuItemId, 1)}
                                whileTap={{ scale: 0.9 }}
                              >
                                <FiPlus size={14} />
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    <div className="cart-divider"></div>

                    <div className="cart-total">
                      <span className="total-label">Total</span>
                      <span className="total-amount">₱{total.toFixed(2)}</span>
                    </div>
                  </>
                )}

                <div className="cart-actions">
                  <Button
                    variant="secondary"
                    icon={FiArrowLeft}
                    onClick={() => setStep(1)}
                    size="lg"
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    icon={FiChevronRight}
                    disabled={cart.length === 0}
                    onClick={() => setStep(3)}
                    size="lg"
                  >
                    Next
                  </Button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Confirm Order */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="confirm-section">
              <h2 className="section-title">Confirm Order</h2>

              {/* Order Summary Card */}
              <motion.div
                className="order-summary-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="order-summary-header">
                  <div>
                    <span className="summary-label">Table</span>
                    <span className="summary-value">{selectedTable?.tableNumber}</span>
                  </div>
                  <div>
                    <span className="summary-label">Items</span>
                    <span className="summary-value">{cart.reduce((sum, c) => sum + c.quantity, 0)}</span>
                  </div>
                  <div>
                    <span className="summary-label">Total</span>
                    <span className="summary-value price">₱{total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="order-summary-items">
                  <h4 className="items-title">Order Items</h4>
                  {cart.map((item) => (
                    <motion.div
                      key={item.menuItemId}
                      className="order-item"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="order-item-qty">{item.quantity}×</div>
                      <span className="order-item-name">{item.name}</span>
                      <span className="order-item-price">₱{(item.price * item.quantity).toFixed(2)}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Special Instructions */}
              <div className="form-group">
                <label className="form-label">Special Instructions (Optional)</label>
                <textarea
                  className="form-input"
                  rows="4"
                  placeholder="Any special requests or dietary notes..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="confirm-actions">
                <Button
                  variant="secondary"
                  icon={FiArrowLeft}
                  onClick={() => setStep(2)}
                  size="lg"
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  icon={FiCheck}
                  disabled={loading}
                  onClick={handleSubmit}
                  size="lg"
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
};

export default OrderForm;