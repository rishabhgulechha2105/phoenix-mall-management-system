import { useEffect, useState } from "react";
import "./TenantSales.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatMethod = (method) => {
  const names = {
    UPI: "UPI",
    CARD: "Card",
    CASH: "Cash",
    BANK_TRANSFER: "Bank Transfer",
  };

  return names[method] || method || "—";
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function TenantSales() {
  const token = localStorage.getItem("phoenix_token");

  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    product_name: "",
    product_category: "",
    quantity: 1,
    unit_price: "",
    payment_method: "UPI",
    transaction_reference: "",
  });

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [salesResponse, summaryResponse] = await Promise.all([
        fetch(`${API_BASE}/tenant/sales/`, {
          headers,
        }),
        fetch(`${API_BASE}/tenant/sales/summary`, {
          headers,
        }),
      ]);

      if (!salesResponse.ok || !summaryResponse.ok) {
        throw new Error("Unable to load sales data");
      }

      const salesData = await salesResponse.json();
      const summaryData = await summaryResponse.json();

      setSales(salesData.sales || []);
      setSummary(summaryData);
    } catch (err) {
      setError(err.message || "Unable to load sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetchSales();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      customer_name: "",
      customer_phone: "",
      product_name: "",
      product_category: "",
      quantity: 1,
      unit_price: "",
      payment_method: "UPI",
      transaction_reference: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API_BASE}/tenant/sales/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_name: form.customer_name,
          customer_phone: form.customer_phone || null,

          product_name: form.product_name,
          product_category: form.product_category || null,

          quantity: Number(form.quantity),
          unit_price: Number(form.unit_price),

          payment_method: form.payment_method,

          transaction_reference:
            form.transaction_reference || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to record sale"
        );
      }

      setMessage(
        `Sale ${data.sale.sale_number} recorded successfully.`
      );

      resetForm();

      await fetchSales();
    } catch (err) {
      setError(err.message || "Unable to record sale");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPreview =
    Number(form.quantity || 0) *
    Number(form.unit_price || 0);

  const logout = () => {
    localStorage.removeItem("phoenix_token");
    localStorage.removeItem("phoenix_user");
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="tenant-sales-loading">
        Loading retail sales...
      </div>
    );
  }

  return (
    <div className="tenant-sales-page">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="tenant-sales-header">
        <div>
          <div className="tenant-sales-eyebrow">
            PHOENIX • TENANT PORTAL
          </div>

          <h1>Retail Sales</h1>

          <p>
            Record customer purchases and track your shop's
            sales performance.
          </p>
        </div>

        <button
          className="tenant-sales-logout"
          onClick={logout}
        >
          Logout
        </button>
      </div>

      {/* ================================================= */}
      {/* ERROR / SUCCESS */}
      {/* ================================================= */}

      {message && (
        <div className="sales-alert sales-success">
          ✓ {message}
        </div>
      )}

      {error && (
        <div className="sales-alert sales-error">
          {error}
        </div>
      )}

      {/* ================================================= */}
      {/* SUMMARY */}
      {/* ================================================= */}

      <div className="sales-summary-grid">

        <div className="sales-summary-card">
          <span>Total Sales</span>
          <strong>
            {formatCurrency(
              summary?.summary?.total_sales
            )}
          </strong>
          <small>Customer purchases</small>
        </div>

        <div className="sales-summary-card">
          <span>Transactions</span>
          <strong>
            {summary?.summary?.total_transactions || 0}
          </strong>
          <small>Successful purchases</small>
        </div>

        <div className="sales-summary-card">
          <span>Items Sold</span>
          <strong>
            {summary?.summary?.total_items || 0}
          </strong>
          <small>Total quantity</small>
        </div>

        <div className="sales-summary-card">
          <span>Average Sale</span>
          <strong>
            {formatCurrency(
              summary?.summary?.average_sale
            )}
          </strong>
          <small>Per transaction</small>
        </div>

      </div>

      {/* ================================================= */}
      {/* MAIN CONTENT */}
      {/* ================================================= */}

      <div className="tenant-sales-content">

        {/* =============================================== */}
        {/* RECORD SALE */}
        {/* =============================================== */}

        <section className="sales-form-card">

          <div className="section-heading">
            <div>
              <span className="section-kicker">
                CUSTOMER PURCHASE
              </span>

              <h2>Record a Sale</h2>

              <p>
                Enter the details of the customer's purchase.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="sales-form-grid">

              <div className="form-group">
                <label>Customer Name *</label>

                <input
                  type="text"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Customer Phone</label>

                <input
                  type="tel"
                  name="customer_phone"
                  value={form.customer_phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="form-group">
                <label>Product Name *</label>

                <input
                  type="text"
                  name="product_name"
                  value={form.product_name}
                  onChange={handleChange}
                  placeholder="e.g. Men's Jacket"
                  required
                />
              </div>

              <div className="form-group">
                <label>Product Category</label>

                <input
                  type="text"
                  name="product_category"
                  value={form.product_category}
                  onChange={handleChange}
                  placeholder="e.g. Apparel"
                />
              </div>

              <div className="form-group">
                <label>Quantity *</label>

                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group">
                <label>Unit Price *</label>

                <input
                  type="number"
                  name="unit_price"
                  value={form.unit_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="₹0.00"
                  required
                />
              </div>

              <div className="form-group">
                <label>Payment Method *</label>

                <select
                  name="payment_method"
                  value={form.payment_method}
                  onChange={handleChange}
                  required
                >
                  <option value="UPI">UPI</option>
                  <option value="CARD">Card</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">
                    Bank Transfer
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>Transaction Reference</label>

                <input
                  type="text"
                  name="transaction_reference"
                  value={form.transaction_reference}
                  onChange={handleChange}
                  placeholder="Optional reference"
                />
              </div>

            </div>

            {/* TOTAL */}

            <div className="sale-total-preview">
              <div>
                <span>Purchase Total</span>
                <small>
                  {form.quantity || 0} ×{" "}
                  {formatCurrency(form.unit_price || 0)}
                </small>
              </div>

              <strong>
                {formatCurrency(totalPreview)}
              </strong>
            </div>

            <button
              type="submit"
              className="record-sale-button"
              disabled={submitting}
            >
              {submitting
                ? "Recording Sale..."
                : "Record Customer Purchase"}
            </button>

          </form>
        </section>

        {/* =============================================== */}
        {/* PAYMENT METHODS */}
        {/* =============================================== */}

        <section className="sales-breakdown-card">

          <div className="section-heading">
            <div>
              <span className="section-kicker">
                PAYMENT ANALYSIS
              </span>

              <h2>Payment Methods</h2>
            </div>
          </div>

          {summary?.payment_methods?.length > 0 ? (
            <div className="payment-method-list">

              {summary.payment_methods.map((item) => (
                <div
                  className="payment-method-row"
                  key={item.method}
                >
                  <div>
                    <strong>
                      {formatMethod(item.method)}
                    </strong>

                    <span>
                      {item.transactions} transaction
                      {item.transactions !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <strong>
                    {formatCurrency(item.amount)}
                  </strong>
                </div>
              ))}

            </div>
          ) : (
            <div className="empty-sales">
              No payment data yet.
            </div>
          )}

        </section>

      </div>

      {/* ================================================= */}
      {/* SALES HISTORY */}
      {/* ================================================= */}

      <section className="sales-history-card">

        <div className="sales-history-header">

          <div>
            <span className="section-kicker">
              TRANSACTION HISTORY
            </span>

            <h2>My Sales</h2>

            <p>
              All customer purchases recorded by your shop.
            </p>
          </div>

          <span className="sales-count">
            {sales.length} Records
          </span>

        </div>

        {sales.length === 0 ? (
          <div className="empty-sales large">
            <div className="empty-icon">🛍️</div>

            <h3>No sales recorded yet</h3>

            <p>
              Customer purchases that you record will
              appear here.
            </p>
          </div>
        ) : (
          <div className="sales-table-wrapper">

            <table className="sales-table">

              <thead>
                <tr>
                  <th>Sale</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Qty.</th>
                  <th>Amount</th>
                  <th>Payment</th>
                </tr>
              </thead>

              <tbody>

                {sales.map((sale) => (
                  <tr key={sale.id}>

                    <td>
                      <strong>
                        {sale.sale_number}
                      </strong>

                      <small>
                        {sale.shop?.shop_code}
                      </small>
                    </td>

                    <td>
                      {formatDate(sale.sale_date)}
                    </td>

                    <td>
                      <strong>
                        {sale.customer_name}
                      </strong>

                      {sale.customer_phone && (
                        <small>
                          {sale.customer_phone}
                        </small>
                      )}
                    </td>

                    <td>
                      <strong>
                        {sale.product_name}
                      </strong>

                      {sale.product_category && (
                        <small>
                          {sale.product_category}
                        </small>
                      )}
                    </td>

                    <td>
                      {sale.quantity}
                    </td>

                    <td className="sale-amount">
                      {formatCurrency(
                        sale.total_amount
                      )}
                    </td>

                    <td>
                      <span className="payment-badge">
                        {formatMethod(
                          sale.payment_method
                        )}
                      </span>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
}

export default TenantSales;