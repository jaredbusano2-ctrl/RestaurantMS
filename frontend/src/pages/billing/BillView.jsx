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
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // Pagination states
  const [unpaidCurrentPage, setUnpaidCurrentPage] = useState(1);
  const [paidCurrentPage, setPaidCurrentPage] = useState(1);
  const itemsPerPage = 5;

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

  useEffect(() => {
    if (deleteSuccessMsg) {
      const timer = setTimeout(() => setDeleteSuccessMsg(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccessMsg]);

  // useEffect with proper dependencies
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchOrders(), fetchPaidBills()]);
    };
    loadData();
  }, [fetchOrders, fetchPaidBills]);

  // Reset to first page when data changes
  useEffect(() => {
    setUnpaidCurrentPage(1);
  }, [orders.length]);

  useEffect(() => {
    setPaidCurrentPage(1);
  }, [paidBills.length]);

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
        `/api/billing/bill/${bill.id}/payment`,
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
        `Please enter sufficient cash amount (minimum: ₱${bill.total.toFixed(2)})`,
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
            `/api/billing/bill/${bill.id}`,
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
            "Invalid payment request. Please check the amount.",
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

  const confirmDeleteBill = (billId) => {
    setDeleteConfirm(billId);
  };

  const handleDeleteBill = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/api/billing/${deleteConfirm}`);
      await fetchPaidBills();
      setDeleteConfirm(null);
      setDeleteSuccessMsg("Bill deleted successfully.");
    } catch (err) {
      console.error("Error deleting bill:", err);
      setError(err.response?.data?.error || "Failed to delete bill");
      setDeleteConfirm(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAllPaidBills = async () => {
    setDeletingAll(true);
    try {
      const res = await axiosInstance.delete("/api/billing/paid");
      await fetchPaidBills();
      setDeleteAllConfirm(false);
      setDeleteSuccessMsg(
        `${res.data.count} paid bill(s) deleted successfully.`,
      );
    } catch (err) {
      console.error("Error deleting all paid bills:", err);
      setError(err.response?.data?.error || "Failed to delete paid bills");
      setDeleteAllConfirm(false);
    } finally {
      setDeletingAll(false);
    }
  };

  const change = cashTendered
    ? parseFloat(cashTendered) - (bill?.total || 0)
    : 0;

  const paymentMethods = [
    { key: "Cash", icon: "ti-cash", label: "Cash" },
    { key: "GCash", icon: "ti-device-mobile", label: "GCash" },
    { key: "Maya", icon: "ti-wallet", label: "Maya" },
    { key: "CreditCard", icon: "ti-credit-card", label: "Card" },
  ];

  // Pagination helper function
  const PaginationControls = ({
    currentPage,
    totalItems,
    onPageChange,
    itemsPerPage,
  }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return null;

    return (
      <div className="billing-pagination">
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="ti ti-chevron-left" aria-hidden="true" />
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <i className="ti ti-chevron-right" aria-hidden="true" />
        </button>
      </div>
    );
  };

  // Get current page items
  const getCurrentPageItems = (items, page) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  // Filter unpaid orders (only Served status)
  const unpaidOrders = orders.filter((o) => o.status === "Served");

  // Get current page items
  const currentUnpaidItems = getCurrentPageItems(
    unpaidOrders,
    unpaidCurrentPage,
  );
  const currentPaidItems = getCurrentPageItems(paidBills, paidCurrentPage);

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
            <i className="ti ti-refresh" aria-hidden="true" /> Refresh
          </button>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="view-tabs">
        <button
          className={`tab-btn ${viewMode === "unpaid" ? "active active-unpaid" : ""}`}
          onClick={() => setViewMode("unpaid")}
        >
          <i className="ti ti-credit-card" aria-hidden="true" /> Unpaid Bills (
          {unpaidOrders.length})
        </button>
        <button
          className={`tab-btn ${viewMode === "paid" ? "active active-paid" : ""}`}
          onClick={() => setViewMode("paid")}
        >
          <i className="ti ti-circle-check" aria-hidden="true" /> Paid Bills (
          {paidBills.length})
        </button>
      </div>
      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <i className="ti ti-alert-triangle" aria-hidden="true" />{" "}
          <strong>Error:</strong> {error}
          <button className="error-close-btn" onClick={() => setError(null)}>
            <i className="ti ti-x" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="billing-layout">
        {/* Left Panel */}
        <div className="billing-left">
          <div className="billing-left-content">
            {viewMode === "unpaid" ? (
              // UNPAID BILLS
              <>
                <div className="billing-section-label sticky-header">
                  READY FOR BILLING
                  <span className="billing-count">{unpaidOrders.length}</span>
                </div>

                {loading ? (
                  <div className="loading">Loading orders...</div>
                ) : unpaidOrders.length === 0 ? (
                  <div className="billing-empty">
                    <i
                      className="ti ti-inbox"
                      style={{ fontSize: 40 }}
                      aria-hidden="true"
                    />
                    <p>No orders ready for billing</p>
                    <span style={{ fontSize: 13, color: "#9ca3af" }}>
                      Served orders will appear here
                    </span>
                  </div>
                ) : (
                  <>
                    {currentUnpaidItems.map((order) => (
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
                            <i className="ti ti-user" aria-hidden="true" />{" "}
                            {order.waiterName}
                          </span>
                        </div>
                        <div className="billing-items-list">
                          {order.items?.map((item) => (
                            <div key={item.id} className="billing-item-row">
                              <span>
                                {item.quantity}× {item.menuItemName}
                              </span>
                              <span>
                                ₱{Number(item.subtotal || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="billing-order-total">
                          <span>Total</span>
                          <strong>
                            ₱{Number(order.total || 0).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    ))}
                    <PaginationControls
                      currentPage={unpaidCurrentPage}
                      totalItems={unpaidOrders.length}
                      onPageChange={setUnpaidCurrentPage}
                      itemsPerPage={itemsPerPage}
                    />
                  </>
                )}
              </>
            ) : (
              // PAID BILLS
              <>
                <div className="billing-section-label billing-section-label-paid sticky-header">
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <i className="ti ti-circle-check" aria-hidden="true" /> PAID
                    BILLS
                    <span className="billing-count billing-count-paid">
                      {paidBills.length}
                    </span>
                  </div>
                  {paidBills.length > 0 && (
                    <button
                      className="delete-all-btn"
                      onClick={() => setDeleteAllConfirm(true)}
                    >
                      <i className="ti ti-trash" aria-hidden="true" /> Delete
                      All
                    </button>
                  )}
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
                  <>
                    {currentPaidItems.map((bill) => (
                      <div
                        key={bill.id}
                        className="billing-order-card paid"
                        style={{
                          opacity: 0.8,
                          borderLeft: "4px solid #16a34a",
                        }}
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
                            <strong>
                              ₱{Number(bill.total || 0).toFixed(2)}
                            </strong>
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
                            <span>
                              <i className="ti ti-cash" aria-hidden="true" />{" "}
                              Cash
                            </span>
                          </div>
                        </div>
                        <div
                          className="billing-order-total"
                          style={{
                            borderTop: "none",
                            paddingTop: 0,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span style={{ fontSize: 12, color: "#6b7280" }}>
                            {new Date(bill.createdAt).toLocaleString()}
                          </span>
                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              alignItems: "center",
                            }}
                          >
                            <span className="paid-footer-status">
                              <i className="ti ti-check" aria-hidden="true" />{" "}
                              PAID
                            </span>
                            <button
                              className="delete-bill-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                confirmDeleteBill(bill.id);
                              }}
                            >
                              <i className="ti ti-trash" aria-hidden="true" />{" "}
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <PaginationControls
                      currentPage={paidCurrentPage}
                      totalItems={paidBills.length}
                      onPageChange={setPaidCurrentPage}
                      itemsPerPage={itemsPerPage}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Bill Panel */}
        <div className="billing-right">
          {viewMode === "paid" ? (
            <div className="billing-placeholder">
              <i
                className="ti ti-clipboard-list"
                style={{ fontSize: 56 }}
                aria-hidden="true"
              />
              <p>Viewing Paid Bills</p>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>
                Switch to "Unpaid Bills" to process new payments
              </span>
            </div>
          ) : step === "select" ? (
            <div className="billing-placeholder">
              <i
                className="ti ti-receipt"
                style={{ fontSize: 56 }}
                aria-hidden="true"
              />
              <p>Select an order to generate bill</p>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>
                Click any order on the left
              </span>
            </div>
          ) : step === "success" ? (
            <div className="billing-placeholder">
              <div className="success-icon-circle">
                <i className="ti ti-circle-check" aria-hidden="true" />
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
                  <div className="change-summary-box">
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
                <i className="ti ti-plus" aria-hidden="true" /> New Transaction
              </button>
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
                        <span className="paid-status-badge-lg">
                          <i className="ti ti-check" aria-hidden="true" /> PAID
                        </span>
                      )}
                    </div>

                    <div className="bill-table-info">
                      <span>
                        <i className="ti ti-armchair" aria-hidden="true" />{" "}
                        {selected?.tableNumber}
                      </span>
                      <span>
                        <i className="ti ti-user" aria-hidden="true" />{" "}
                        {selected?.waiterName}
                      </span>
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
                          <i className="ti ti-check" aria-hidden="true" />{" "}
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
                                className={`payment-method-btn ${paymentMethod === m.key ? "selected" : ""}`}
                                onClick={() => setPaymentMethod(m.key)}
                              >
                                <i
                                  className={`ti ${m.icon}`}
                                  style={{ fontSize: 22 }}
                                  aria-hidden="true"
                                />
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
                                <span>
                                  <i
                                    className="ti ti-alert-triangle"
                                    aria-hidden="true"
                                  />{" "}
                                  Insufficient amount
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {(paymentMethod === "GCash" ||
                          paymentMethod === "Maya") && (
                          <div className="digital-payment-info">
                            <i
                              className="ti ti-device-mobile"
                              style={{ fontSize: 32 }}
                              aria-hidden="true"
                            />
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
                          <i className="ti ti-check" aria-hidden="true" />{" "}
                          {payLoading
                            ? "Processing..."
                            : `Process ${paymentMethod} Payment`}
                        </button>
                      </>
                    )}

                    {bill.status === "Paid" && (
                      <div className="already-paid-banner">
                        <span>
                          <i
                            className="ti ti-circle-check"
                            aria-hidden="true"
                          />{" "}
                          This bill has been paid
                        </span>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            )
          )}
        </div>
      </div>
      {deleteConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => !deleting && setDeleteConfirm(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 28,
              width: 360,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon-circle danger">
              <i className="ti ti-trash" aria-hidden="true" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#111827" }}>
              Delete this bill?
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6b7280" }}>
              This will permanently remove the bill and its payment record. This
              action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBill}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteAllConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => !deletingAll && setDeleteAllConfirm(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 28,
              width: 380,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon-circle danger">
              <i className="ti ti-trash" aria-hidden="true" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#111827" }}>
              Delete all paid bills?
            </h3>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#6b7280" }}>
              This will permanently remove all {paidBills.length} paid bill
              record(s) and their payments. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setDeleteAllConfirm(false)}
                disabled={deletingAll}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllPaidBills}
                disabled={deletingAll}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: deletingAll ? 0.7 : 1,
                }}
              >
                {deletingAll ? "Deleting..." : "Delete All"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSuccessMsg && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setDeleteSuccessMsg(null)}
        >
          <div
            style={{
              background: "white",
              borderRadius: 12,
              padding: 28,
              width: 320,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon-circle success">
              <i className="ti ti-circle-check" aria-hidden="true" />
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, color: "#111827" }}>
              Success
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "#6b7280" }}>
              {deleteSuccessMsg}
            </p>
            <button
              onClick={() => setDeleteSuccessMsg(null)}
              style={{
                width: "100%",
                padding: "10px 0",
                background: "#16a34a",
                color: "white",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default BillView;
