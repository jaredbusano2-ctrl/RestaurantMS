import { useState, useEffect } from 'react';
import MainLayout from '../../layouts/MainLayout';
import axiosInstance from '../../utils/axiosInstance';
import './Billing.css';

const BillView = () => {
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bill, setBill] = useState(null);
  const [discount, setDiscount] = useState({ type: 'None', value: '' });
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [cashTendered, setCashTendered] = useState('');
  const [loading, setLoading] = useState(true);
  const [billLoading, setBillLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [step, setStep] = useState('select');

  useEffect(() => { fetchOrders(); }, []);

 const fetchOrders = async () => {
  setLoading(true);
  try {
    const res = await axiosInstance.get('/api/orders/status/Served');
    setOrders(res.data.data || []);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const handleSelectOrder = async (order) => {
    setSelected(order);
    setBill(null);
    setDiscount({ type: 'None', value: '' });
    setPaymentMethod('Cash');
    setCashTendered('');
    setStep('bill');
    setBillLoading(true);
    try {
      const res = await axiosInstance.post('/api/billing/generate', { orderId: order.id });
      setBill(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setBillLoading(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!bill) return;
    try {
      const res = await axiosInstance.post('/api/billing/discount', {
        billId: bill.id,
        discountType: discount.type,
        discountValue: parseFloat(discount.value) || 0
      });
      setBill(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePayment = async () => {
    if (!bill) return;
    setPayLoading(true);
    try {
      await axiosInstance.post('/api/billing/pay', {
        billId: bill.id,
        method: paymentMethod,
        amount: bill.total
      });
      setStep('success');
      fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setPayLoading(false);
    }
  };

  const change = cashTendered ? parseFloat(cashTendered) - (bill?.total || 0) : 0;

  const paymentMethods = [
    { key: 'Cash', icon: '💵', label: 'Cash' },
    { key: 'GCash', icon: '📱', label: 'GCash' },
    { key: 'Maya', icon: '💜', label: 'Maya' },
    { key: 'CreditCard', icon: '💳', label: 'Card' },
  ];

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & POS</h1>
          <p className="page-subtitle">Process customer payments</p>
        </div>
        <button className="btn-secondary" onClick={fetchOrders}>↻ Refresh</button>
      </div>

      <div className="billing-layout">
        {/* Left — Orders List */}
        <div className="billing-left">
          <div className="billing-section-label">
            READY FOR BILLING
            <span className="billing-count">{orders.length}</span>
          </div>

          {loading ? (
            <div className="loading">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="billing-empty">
              <span>🧾</span>
              <p>No orders ready for billing</p>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>Orders will appear here when marked as Ready</span>
            </div>
          ) : (
            orders.map(order => (
              <div
                key={order.id}
                className={`billing-order-card ${selected?.id === order.id ? 'selected' : ''}`}
                onClick={() => handleSelectOrder(order)}
              >
                <div className="billing-order-header">
                  <span className="billing-order-id">#ORD-{String(order.id).padStart(4, '0')}</span>
                  <span className="billing-table-badge">{order.tableNumber}</span>
                  <span className="billing-waiter">👤 {order.waiterName}</span>
                </div>
                <div className="billing-items-list">
                  {order.items?.map(item => (
                    <div key={item.id} className="billing-item-row">
                      <span>{item.quantity}× {item.menuItemName}</span>
                      <span>₱{Number(item.subtotal || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="billing-order-total">
                  <span>Total</span>
                  <strong>₱{Number(order.total || 0).toFixed(2)}</strong>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right — Bill Panel */}
        <div className="billing-right">
          {step === 'select' && (
            <div className="billing-placeholder">
              <span style={{ fontSize: 56 }}>🧾</span>
              <p>Select an order to generate bill</p>
              <span style={{ fontSize: 13, color: '#9ca3af' }}>Click any order on the left</span>
            </div>
          )}

          {step === 'bill' && (
            <div className="bill-panel">
              {billLoading ? (
                <div className="loading" style={{ padding: 40 }}>Generating bill...</div>
              ) : bill ? (
                <>
                  <div className="bill-header">
                    <h3>Bill Summary</h3>
                    <span className="bill-order-id">#ORD-{String(selected?.id).padStart(4, '0')}</span>
                  </div>

                  <div className="bill-table-info">
                    <span>🪑 {selected?.tableNumber}</span>
                    <span>👤 {selected?.waiterName}</span>
                  </div>

                  {/* Items */}
                  <div className="bill-items">
                    {selected?.items?.map(item => (
                      <div key={item.id} className="bill-item-row">
                        <span className="bill-item-name">{item.menuItemName}</span>
                        <span className="bill-item-qty">×{item.quantity}</span>
                        <span className="bill-item-price">₱{Number(item.subtotal || 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bill-divider" />

                  <div className="bill-subtotal-row">
                    <span>Subtotal</span>
                    <span>₱{Number(bill.subtotal).toFixed(2)}</span>
                  </div>

                  {/* Discount */}
                  <div className="discount-section">
                    <p className="form-label" style={{ marginBottom: 8 }}>Discount</p>
                    <div className="discount-row">
                      <select
                        className="form-input"
                        style={{ flex: 1 }}
                        value={discount.type}
                        onChange={e => setDiscount({ ...discount, type: e.target.value, value: '' })}
                      >
                        <option value="None">No Discount</option>
                        <option value="Percentage">Percentage (%)</option>
                        <option value="Fixed">Fixed Amount (₱)</option>
                      </select>
                      {discount.type !== 'None' && (
                        <input
                          className="form-input"
                          style={{ width: 90 }}
                          type="number"
                          min="0"
                          placeholder={discount.type === 'Percentage' ? '%' : '₱'}
                          value={discount.value}
                          onChange={e => setDiscount({ ...discount, value: e.target.value })}
                        />
                      )}
                      {discount.type !== 'None' && (
                        <button className="btn-secondary" onClick={handleApplyDiscount}>Apply</button>
                      )}
                    </div>
                    {bill.discountType !== 'None' && (
                      <div className="discount-applied">
                        ✓ {bill.discountType === 'Percentage' ? `${bill.discountValue}% off` : `₱${bill.discountValue} off`} applied
                      </div>
                    )}
                  </div>

                  <div className="bill-total-row">
                    <span>Total</span>
                    <strong>₱{Number(bill.total).toFixed(2)}</strong>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <p className="form-label" style={{ marginBottom: 8 }}>Payment Method</p>
                    <div className="payment-grid">
                      {paymentMethods.map(m => (
                        <button
                          key={m.key}
                          className={`payment-method-btn ${paymentMethod === m.key ? 'selected' : ''}`}
                          onClick={() => setPaymentMethod(m.key)}
                        >
                          <span style={{ fontSize: 24 }}>{m.icon}</span>
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cash Calculator */}
                  {paymentMethod === 'Cash' && (
                    <div className="cash-section">
                      <div className="form-group">
                        <label className="form-label">Cash Tendered (₱)</label>
                        <input
                          className="form-input"
                          type="number"
                          min={bill.total}
                          placeholder={`Min ₱${Number(bill.total).toFixed(2)}`}
                          value={cashTendered}
                          onChange={e => setCashTendered(e.target.value)}
                        />
                      </div>
                      {cashTendered && change >= 0 && (
                        <div className="change-display">
                          <span>Change</span>
                          <strong>₱{change.toFixed(2)}</strong>
                        </div>
                      )}
                      {cashTendered && change < 0 && (
                        <div className="change-display insufficient">
                          <span>⚠ Insufficient amount</span>
                        </div>
                      )}
                    </div>
                  )}

                  {(paymentMethod === 'GCash' || paymentMethod === 'Maya') && (
                    <div className="digital-payment-info">
                      <span style={{ fontSize: 32 }}>📲</span>
                      <p>Show QR code or send payment link to customer</p>
                      <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>
                        Amount: ₱{Number(bill.total).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <button
                    className="btn-primary"
                    style={{ width: '100%', padding: 14, fontSize: 15, marginTop: 8 }}
                    onClick={handlePayment}
                    disabled={payLoading || (paymentMethod === 'Cash' && (!cashTendered || change < 0))}
                  >
                    {payLoading ? 'Processing...' : `✓ Process ${paymentMethod} Payment`}
                  </button>
                </>
              ) : null}
            </div>
          )}

          {step === 'success' && (
            <div className="billing-placeholder">
              <div style={{ width: 80, height: 80, background: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>✅</div>
              <p style={{ color: '#16a34a', fontWeight: 700, fontSize: 18 }}>Payment Successful!</p>
              <p style={{ color: '#6b7280', fontSize: 14 }}>
                ₱{Number(bill?.total || 0).toFixed(2)} received via {paymentMethod}
              </p>
              {paymentMethod === 'Cash' && change > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#6b7280' }}>Change</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#16a34a' }}>₱{change.toFixed(2)}</p>
                </div>
              )}
              <button
                className="btn-primary"
                style={{ marginTop: 8 }}
                onClick={() => {
                  setStep('select');
                  setSelected(null);
                  setBill(null);
                  setCashTendered('');
                }}
              >
                + New Transaction
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default BillView;