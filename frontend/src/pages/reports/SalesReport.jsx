import { useState, useEffect } from "react";
import MainLayout from "../../layouts/MainLayout";
import axiosInstance from "../../utils/axiosInstance";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import "./Reports.css";

const COLORS = ["#dc2626", "#2563eb", "#7c3aed", "#16a34a", "#d97706"];

const SalesReport = () => {
  const [dailySales, setDailySales] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    if (range !== "custom") fetchReports();
  }, [range]);

  const getDateRange = () => {
    const now = new Date();

    if (range === "today") {
      const from = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
      );
      const to = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
      );
      return { from: from.toISOString(), to: to.toISOString() };
    }

    const to = new Date();
    const from = new Date();
    if (range === "week") from.setDate(from.getDate() - 7);
    else if (range === "month") from.setMonth(from.getMonth() - 1);
    else if (range === "custom") {
      return {
        from: new Date(customFrom).toISOString(),
        to: new Date(customTo + "T23:59:59").toISOString(),
      };
    }
    return { from: from.toISOString(), to: to.toISOString() };
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { from, to } = getDateRange();
      const [dailyRes, itemsRes, payRes] = await Promise.all([
        axiosInstance
          .get(`/api/reports/daily?from=${from}&to=${to}`)
          .catch(() => ({ data: { data: [] } })),
        axiosInstance
          .get(`/api/reports/items?from=${from}&to=${to}`)
          .catch(() => ({ data: { data: [] } })),
        axiosInstance
          .get(`/api/reports/payments?from=${from}&to=${to}`)
          .catch(() => ({ data: { data: [] } })),
      ]);
      setDailySales(dailyRes.data.data || []);
      setTopItems(itemsRes.data.data || []);
      setPaymentSummary(payRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = dailySales.reduce(
    (sum, d) => sum + (d.totalRevenue || 0),
    0,
  );
  const totalOrders = dailySales.reduce(
    (sum, d) => sum + (d.totalOrders || 0),
    0,
  );
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const exportCSV = (data, filename) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(","));
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
  };

  const chartData = dailySales.map((d) => ({
    ...d,
    date: formatDate(d.date),
  }));

  return (
    <MainLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Sales and financial analytics</p>
        </div>
        <div className="range-selector">
          {["today", "week", "month", "custom"].map((r) => (
            <button
              key={r}
              className={`range-btn ${range === r ? "active" : ""}`}
              onClick={() => {
                setRange(r);
                if (r === "custom") setShowCustom(true);
                else setShowCustom(false);
              }}
            >
              {r === "today"
                ? "Today"
                : r === "week"
                  ? "This Week"
                  : r === "month"
                    ? "This Month"
                    : "Custom"}
            </button>
          ))}
        </div>
      </div>

      {showCustom && (
        <div className="custom-range">
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">From</label>
            <input
              className="form-input"
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">To</label>
            <input
              className="form-input"
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
          <button
            className="btn-primary"
            onClick={fetchReports}
            disabled={!customFrom || !customTo}
          >
            Apply
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="table-stats" style={{ maxWidth: 560 }}>
        <div className="table-stat">
          <div
            className="table-stat-icon"
            style={{ background: "#fef2f2", color: "#dc2626" }}
          >
            <i className="ti ti-currency-peso" aria-hidden="true" />
          </div>
          <div className="table-stat-info">
            <div
              className="table-stat-num"
              style={{ color: "#dc2626", fontSize: 18 }}
            >
              ₱
              {totalRevenue.toLocaleString("en-PH", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="table-stat-label">Total Revenue</div>
          </div>
        </div>
        <div className="table-stat">
          <div
            className="table-stat-icon"
            style={{ background: "#eff6ff", color: "#2563eb" }}
          >
            <i className="ti ti-shopping-cart" aria-hidden="true" />
          </div>
          <div className="table-stat-info">
            <div className="table-stat-num" style={{ color: "#2563eb" }}>
              {totalOrders}
            </div>
            <div className="table-stat-label">Total Orders</div>
          </div>
        </div>
        <div className="table-stat">
          <div
            className="table-stat-icon"
            style={{ background: "#f0fdf4", color: "#15803d" }}
          >
            <i className="ti ti-chart-bar" aria-hidden="true" />
          </div>
          <div className="table-stat-info">
            <div
              className="table-stat-num"
              style={{ color: "#15803d", fontSize: 18 }}
            >
              ₱{avgOrderValue.toFixed(2)}
            </div>
            <div className="table-stat-label">Avg Order Value</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading reports...</div>
      ) : (
        <div className="reports-grid">
          {/* Revenue Over Time */}
          <div className="report-card full-width">
            <div className="report-card-header">
              <h3 className="report-title">Revenue Over Time</h3>
              <button
                className="btn-export"
                onClick={() => exportCSV(dailySales, "daily-sales")}
              >
                ⬇ Export CSV
              </button>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="revenueGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickFormatter={(v) => `₱${v}`}
                  />
                  <Tooltip
                    formatter={(val) => [
                      `₱${Number(val).toFixed(2)}`,
                      "Revenue",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalRevenue"
                    stroke="#dc2626"
                    strokeWidth={2.5}
                    dot={{ fill: "#dc2626", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">No revenue data for this period</div>
            )}
          </div>

          {/* Top Selling Items */}
          <div className="report-card">
            <div className="report-card-header">
              <h3 className="report-title">Top Selling Items</h3>
              <button
                className="btn-export"
                onClick={() => exportCSV(topItems, "top-items")}
              >
                ⬇ Export
              </button>
            </div>
            {topItems.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                  />
                  <YAxis
                    dataKey="itemName"
                    type="category"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    width={110}
                  />
                  <Tooltip formatter={(val) => [val, "Qty Sold"]} />
                  <Bar
                    dataKey="totalQuantitySold"
                    fill="#dc2626"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty">No sales data for this period</div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="report-card">
            <div className="report-card-header">
              <h3 className="report-title">Payment Methods</h3>
              <button
                className="btn-export"
                onClick={() => exportCSV(paymentSummary, "payments")}
              >
                ⬇ Export
              </button>
            </div>
            {paymentSummary.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={paymentSummary}
                      dataKey="totalAmount"
                      nameKey="method"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={40}
                    >
                      {paymentSummary.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip
                      formatter={(val) => `₱${Number(val).toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="payment-breakdown">
                  {paymentSummary.map((p, i) => (
                    <div key={p.method} className="payment-breakdown-row">
                      <span
                        className="payment-dot"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="payment-method-name">{p.method}</span>
                      <span className="payment-count">{p.count} orders</span>
                      <span className="payment-amount">
                        ₱{Number(p.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="chart-empty">No payment data for this period</div>
            )}
          </div>

          {/* Recent Transactions Table */}
          <div className="report-card full-width">
            <div className="report-card-header">
              <h3 className="report-title">Daily Summary</h3>
            </div>
            {dailySales.length > 0 ? (
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Orders</th>
                    <th>Total Revenue</th>
                    <th>Avg Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySales.map((d, i) => (
                    <tr key={i}>
                      <td>{formatDate(d.date)}</td>
                      <td>{d.totalOrders}</td>
                      <td>
                        <strong>₱{Number(d.totalRevenue).toFixed(2)}</strong>
                      </td>
                      <td>
                        ₱
                        {d.totalOrders > 0
                          ? (d.totalRevenue / d.totalOrders).toFixed(2)
                          : "0.00"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="chart-empty">No data available</div>
            )}
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default SalesReport;
