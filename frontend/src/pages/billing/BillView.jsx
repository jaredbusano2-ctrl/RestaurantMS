import { useState, useEffect, useCallback } from "react";
import MainLayout from "../../layouts/MainLayout";
import axiosInstance from "../../utils/axiosInstance";
import "./Billing.css";

const BillView = () => {
  const [orders, setOrders] = useState([]);
  const [paidBills, setPaidBills] = useState([]);
  const [selected, setSelected] = useState(null);
  const [bill, setBill] = useState(null);
  const [discount, setDiscount] = useState({ type: "None", value: "" });
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashTendered, setCashTendered] = useState("");
  const [loading, setLoading] = useState(true);
  const [paidLoading, setPaidLoading] = useState(true);
  const [billLoading, setBillLoading] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [step, setStep] = useState("select");
  const [error, setError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [viewMode, setViewMode] = useState("unpaid");

  // Wrap fetchOrders in useCallback to prevent unnecessary re-renders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/api/orders/status/Served");
      setOrders(res.data.data || []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  // Wrap fetchPaidBills in useCallback
  const fetchPaidBills = useCallback(async () => {
    setPaidLoading(true);
    try {
      const res = await axiosInstance.get("/api/billing/paid");
      setPaidBills(res.data.data || []);
    } catch (err) {
      console.error("Error fetching paid bills:", err);
      setError("Failed to load paid bills");
    } finally {
      setPaidLoading(false);
    }
  }, []);

  // useEffect with proper dependencies
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchOrders(), fetchPaidBills()]);
    };
    loadData();
  }, [fetchOrders, fetchPaidBills]);

  const handleSelectOrder = async (order) => {
    setSelected(order);
    setBill(null);
    setDiscount({ type: "None", value: "" });
    setPaymentMethod("Cash");
    setCashTendered("");
    setError(null);
    setPaymentSuccess(null);
    setStep("bill");
    setBillLoading(true);
    try {
      const res = await axiosInstance.post("/api/billing/generate", {
        orderId: order.id,
      });
      setBill(res.data.data);
    } catch (err) {
      console.error("Error generating bill:", err);
      setError("Failed to generate bill");
    } finally {
      setBillLoading(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!bill) return;
    setError(null);
    try {
      const res = await axiosInstance.post("/api/billing/discount", {
        billId: bill.id,
        discountType: discount.type,
        discountValue: parseFloat(discount.value) || 0,
      });
      setBill(res.data.data);
    } catch (err) {
      console.error("Error applying discount:", err);
      setError("Failed to apply discount");
    }
  };

  const handlePayment = async () => {
    if (!bill) {
      setError("No bill to process");
      return;
    }

    if (bill.status === "Paid") {
      setError("This bill has already been paid!");
      return;
    }

    setPayLoading(true);
    setError(null);

    // Check if payment already exists
    try {
      const checkRes = await axiosInstance.get(
        `/api/billing/bill/${bill.id}/payment`
      );
      if (checkRes.data) {
        setPaymentSuccess({
          amount: checkRes.data.amount,
          method: checkRes.data.method,
          change: 0,
        });
        setStep("success");
        setBill({ ...bill, status: "Paid" });
        await Promise.all([fetchOrders(), fetchPaidBills()]);
        setPayLoading(false);
        return;
      }
    } catch (checkErr) {
      if (checkErr.response?.status === 404) {
        console.log("✅ No existing payment found, proceeding...");
      } else {
        console.error("❌ Error checking payment:", checkErr);
        setError("Could not verify payment status. Please try again.");
        setPayLoading(false);
        return;
      }
    }

    // Validate cash tendered
    if (
      paymentMethod === "Cash" &&
      (!cashTendered || parseFloat(cashTendered) < bill.total)
    ) {
      setError(
        `Please enter sufficient cash amount (minimum: ₱${bill.total.toFixed(2)})`
      );
      setPayLoading(false);
      return;
    }

    // Process payment
    try {
      const response = await axiosInstance.post("/api/billing/pay", {
        billId: bill.id,
        method: paymentMethod,
        amount: bill.total,
      });

      if (response.status === 200 || response.status === 201) {
        let changeAmount = 0;
        if (paymentMethod === "Cash" && cashTendered) {
          changeAmount = parseFloat(cashTendered) - bill.total;
        }

        setPaymentSuccess({
          amount: bill.total,
          method: paymentMethod,
          change: changeAmount,
        });
        setStep("success");

        // Refresh both lists
        await Promise.all([fetchOrders(), fetchPaidBills()]);

        // Refresh bill data
        try {
          const updatedBill = await axiosInstance.get(
            `/api/billing/bill/${bill.id}`
          );
          setBill(updatedBill.data.data);
        } catch (refreshErr) {
          console.error("Error refreshing bill:", refreshErr);
        }
      }
    } catch (err) {
      console.error("❌ Payment error:", err);

      if (err.response?.status === 409) {
        setError("This bill has already been paid.");
        await Promise.all([fetchOrders(), fetchPaidBills()]);
      } else if (err.response?.status === 400) {
        setError(
          err.response?.data?.error ||
            "Invalid payment request. Please check the amount."
        );
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Payment failed. Please try again.");
      }
    } finally {
      setPayLoading(false);
    }
  };

  const change = cashTendered
    ? parseFloat(cashTendered) - (bill?.total || 0)
    : 0;

  const paymentMethods = [
    { key: "Cash", icon: "💵", label: "Cash" },
    { key: "GCash", icon: "📱", label: "GCash" },
    { key: "Maya", icon: "💜", label: "Maya" },
    { key: "CreditCard", icon: "💳", label: "Card" },
  ];

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & POS</h1>
          <p className="page-subtitle">Process customer payments</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            className="btn-secondary"
            onClick={() => {
              Promise.all([fetchOrders(), fetchPaidBills()]);
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div
        className="view-tabs"
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: 10,
        }}
      >
        <button
          className={`tab-btn ${viewMode === "unpaid" ? "active" : ""}`}
          onClick={() => setViewMode("unpaid")}
          style={{
            padding: "8px 20px",
            background: viewMode === "unpaid" ? "#2563eb" : "transparent",
            color: viewMode === "unpaid" ? "white" : "#6b7280",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          💳 Unpaid Bills ({orders.filter((o) => o.status === "Served").length})
        </button>
        <button
          className={`tab-btn ${viewMode === "paid" ? "active" : ""}`}
          onClick={() => setViewMode("paid")}
          style={{
            padding: "8px 20px",
            background: viewMode === "paid" ? "#16a34a" : "transparent",
            color: viewMode === "paid" ? "white" : "#6b7280",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          ✅ Paid Bills ({paidBills.length})
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div
          className="error-banner"
          style={{
            background: "#fee2e2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 16,
            color: "#dc2626",
          }}
        >
          <strong>⚠ Error:</strong> {error}
          <button
            style={{
              float: "right",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
            onClick={() => setError(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className="billing-layout">
        {/* Left Panel */}
        <div className="billing-left">
          {viewMode === "unpaid" ? (
            // UNPAID BILLS
            <>
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
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>
                    Orders will appear here when marked as Ready
                  </span>
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className={`billing-order-card ${
                      selected?.id === order.id ? "selected" : ""
                    }`}
                    onClick={() => handleSelectOrder(order)}
                  >
                    <div className="billing-order-header">
                      <span className="billing-order-id">
                        #ORD-{String(order.id).padStart(4, "0")}
                      </span>
                      <span className="billing-table-badge">
                        {order.tableNumber}
                      </span>
                      <span className="billing-waiter">
                        👤 {order.waiterName}
                      </span>
                    </div>
                    <div className="billing-items-list">
                      {order.items?.map((item) => (
                        <div key={item.id} className="billing-item-row">
                          <span>
                            {item.quantity}× {item.menuItemName}
                          </span>
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
            </>
          ) : (
            // PAID BILLS
            <>
              <div
                className="billing-section-label"
                style={{ background: "#d1fae5", color: "#16a34a" }}
              >
                ✅ PAID BILLS
                <span
                  className="billing-count"
                  style={{ background: "#16a34a" }}
                >
                  {paidBills.length}
                </span>
              </div>

              {paidLoading ? (
                <div className="loading">Loading paid bills...</div>
              ) : paidBills.length === 0 ? (
                <div className="billing-empty">
                  <span>📭</span>
                  <p>No paid bills yet</p>
                  <span style={{ fontSize: 13, color: "#9ca3af" }}>
                    Completed payments will appear here
                  </span>
                </div>
              ) : (
                paidBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="billing-order-card paid"
                    style={{ opacity: 0.8, borderLeft: "4px solid #16a34a" }}
                  >
                    <div className="billing-order-header">
                      <span className="billing-order-id">
                        #BILL-{String(bill.id).padStart(4, "0")}
                      </span>
                      <span className="billing-table-badge">
                        {bill.tableNumber}
                      </span>
                      <span
                        style={{
                          background: "#d1fae5",
                          color: "#16a34a",
                          padding: "2px 10px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        ✓ PAID
                      </span>
                    </div>
                    <div className="billing-items-list">
                      <div className="billing-item-row">
                        <span>Total Amount</span>
                        <strong>₱{Number(bill.total || 0).toFixed(2)}</strong>
                      </div>
                      {bill.discountType !== "None" &&
                        bill.discountValue > 0 && (
                          <div
                            className="billing-item-row"
                            style={{ color: "#6b7280", fontSize: 13 }}
                          >
                            <span>Discount ({bill.discountType})</span>
                            <span>
                              -₱{Number(bill.discountValue || 0).toFixed(2)}
                            </span>
                          </div>
                        )}
                      <div
                        className="billing-item-row"
                        style={{ color: "#6b7280", fontSize: 13 }}
                      >
                        <span>Payment Method</span>
                        <span>💵 Cash</span>
                      </div>
                    </div>
                    <div
                      className="billing-order-total"
                      style={{ borderTop: "none", paddingTop: 0 }}
                    >
                      <span style={{ fontSize: 12, color: "#6b7280" }}>
                        {new Date(bill.createdAt).toLocaleString()}
                      </span>
                      <span style={{ color: "#16a34a", fontWeight: 600 }}>
                        ✓ PAID
                      </span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        {/* Right Panel - Bill Panel */}
        <div className="billing-right">
          {viewMode === "paid" ? (
            <div className="billing-placeholder">
              <span style={{ fontSize: 56 }}>📋</span>
              <p>Viewing Paid Bills</p>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>
                Switch to "Unpaid Bills" to process new payments
              </span>
            </div>
          ) : step === "select" ? (
            <div className="billing-placeholder">
              <span style={{ fontSize: 56 }}>🧾</span>
              <p>Select an order to generate bill</p>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>
                Click any order on the left
              </span>
            </div>
          ) : (
            step === "bill" && (
              <div className="bill-panel">
                {billLoading ? (
                  <div className="loading" style={{ padding: 40 }}>
                    Generating bill...
                  </div>
                ) : bill ? (
                  <>
                    <div className="bill-header">
                      <h3>Bill Summary</h3>
                      <span className="bill-order-id">
                        #ORD-{String(selected?.id).padStart(4, "0")}
                      </span>
                      {bill.status === "Paid" && (
                        <span
                          style={{
                            background: "#d1fae5",
                            color: "#16a34a",
                            padding: "4px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          ✓ PAID
                        </span>
                      )}
                    </div>

                    <div className="bill-table-info">
                      <span>🪑 {selected?.tableNumber}</span>
                      <span>👤 {selected?.waiterName}</span>
                    </div>

                    <div className="bill-items">
                      {selected?.items?.map((item) => (
                        <div key={item.id} className="bill-item-row">
                          <span className="bill-item-name">
                            {item.menuItemName}
                          </span>
                          <span className="bill-item-qty">
                            ×{item.quantity}
                          </span>
                          <span className="bill-item-price">
                            ₱{Number(item.subtotal || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="bill-divider" />

                    <div className="bill-subtotal-row">
                      <span>Subtotal</span>
                      <span>₱{Number(bill.subtotal).toFixed(2)}</span>
                    </div>

                    <div className="discount-section">
                      <p className="form-label" style={{ marginBottom: 8 }}>
                        Discount
                      </p>
                      <div className="discount-row">
                        <select
                          className="form-input"
                          style={{ flex: 1 }}
                          value={discount.type}
                          onChange={(e) =>
                            setDiscount({
                              ...discount,
                              type: e.target.value,
                              value: "",
                            })
                          }
                          disabled={bill.status === "Paid"}
                        >
                          <option value="None">No Discount</option>
                          <option value="Percentage">Percentage (%)</option>
                          <option value="Fixed">Fixed Amount (₱)</option>
                        </select>
                        {discount.type !== "None" && (
                          <input
                            className="form-input"
                            style={{ width: 90 }}
                            type="number"
                            min="0"
                            placeholder={
                              discount.type === "Percentage" ? "%" : "₱"
                            }
                            value={discount.value}
                            onChange={(e) =>
                              setDiscount({
                                ...discount,
                                value: e.target.value,
                              })
                            }
                            disabled={bill.status === "Paid"}
                          />
                        )}
                        {discount.type !== "None" && (
                          <button
                            className="btn-secondary"
                            onClick={handleApplyDiscount}
                            disabled={bill.status === "Paid"}
                          >
                            Apply
                          </button>
                        )}
                      </div>
                      {bill.discountType !== "None" && (
                        <div className="discount-applied">
                          ✓{" "}
                          {bill.discountType === "Percentage"
                            ? `${bill.discountValue}% off`
                            : `₱${bill.discountValue} off`}{" "}
                          applied
                        </div>
                      )}
                    </div>

                    <div className="bill-total-row">
                      <span>Total</span>
                      <strong>₱{Number(bill.total).toFixed(2)}</strong>
                    </div>

                    {bill.status !== "Paid" && (
                      <>
                        <div>
                          <p className="form-label" style={{ marginBottom: 8 }}>
                            Payment Method
                          </p>
                          <div className="payment-grid">
                            {paymentMethods.map((m) => (
                              <button
                                key={m.key}
                                className={`payment-method-btn ${
                                  paymentMethod === m.key ? "selected" : ""
                                }`}
                                onClick={() => setPaymentMethod(m.key)}
                              >
                                <span style={{ fontSize: 24 }}>{m.icon}</span>
                                <span>{m.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {paymentMethod === "Cash" && (
                          <div className="cash-section">
                            <div className="form-group">
                              <label className="form-label">
                                Cash Tendered (₱)
                              </label>
                              <input
                                className="form-input"
                                type="number"
                                min={bill.total}
                                placeholder={`Min ₱${Number(bill.total).toFixed(2)}`}
                                value={cashTendered}
                                onChange={(e) =>
                                  setCashTendered(e.target.value)
                                }
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

                        {(paymentMethod === "GCash" ||
                          paymentMethod === "Maya") && (
                          <div className="digital-payment-info">
                            <span style={{ fontSize: 32 }}>📲</span>
                            <p>Show QR code or send payment link to customer</p>
                            <p
                              style={{
                                fontSize: 13,
                                color: "#dc2626",
                                fontWeight: 600,
                              }}
                            >
                              Amount: ₱{Number(bill.total).toFixed(2)}
                            </p>
                          </div>
                        )}

                        <button
                          className="btn-primary"
                          style={{
                            width: "100%",
                            padding: 14,
                            fontSize: 15,
                            marginTop: 8,
                          }}
                          onClick={handlePayment}
                          disabled={
                            payLoading ||
                            (paymentMethod === "Cash" &&
                              (!cashTendered || change < 0))
                          }
                        >
                          {payLoading
                            ? "Processing..."
                            : `✓ Process ${paymentMethod} Payment`}
                        </button>
                      </>
                    )}

                    {bill.status === "Paid" && (
                      <div
                        style={{
                          background: "#d1fae5",
                          padding: 12,
                          borderRadius: 8,
                          textAlign: "center",
                          marginTop: 8,
                        }}
                      >
                        <span style={{ color: "#16a34a", fontWeight: 600 }}>
                          ✅ This bill has been paid
                        </span>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )
          )}

          {step === "success" && (
            <div className="billing-placeholder">
              <div
                style={{
                  width: 80,
                  height: 80,
                  background: "#d1fae5",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 36,
                }}
              >
                ✅
              </div>
              <p style={{ color: "#16a34a", fontWeight: 700, fontSize: 18 }}>
                Payment Successful!
              </p>
              <p style={{ color: "#6b7280", fontSize: 14 }}>
                ₱{Number(paymentSuccess?.amount || bill?.total || 0).toFixed(2)}{" "}
                received via {paymentSuccess?.method || paymentMethod}
              </p>
              {paymentMethod === "Cash" &&
                (paymentSuccess?.change || change) > 0 && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: 8,
                      padding: "12px 24px",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ fontSize: 13, color: "#6b7280" }}>Change</p>
                    <p
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: "#16a34a",
                      }}
                    >
                      ₱{(paymentSuccess?.change || change).toFixed(2)}
                    </p>
                  </div>
                )}
              <button
                className="btn-primary"
                style={{ marginTop: 8 }}
                onClick={() => {
                  setStep("select");
                  setSelected(null);
                  setBill(null);
                  setCashTendered("");
                  setError(null);
                  setPaymentSuccess(null);
                  setViewMode("unpaid");
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