import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerDashboard.css";
import "./ManagerPayments.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

function ManagerPayments() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  const [form, setForm] = useState({
    invoice_id: "",
    amount: "",
    payment_date: "",
    payment_method: "UPI",
    transaction_reference: "",
    status: "SUCCESS",
  });

  const token = localStorage.getItem("phoenix_token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    loadData();
  }, [navigate, token]);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [paymentsResponse, invoicesResponse] =
        await Promise.all([
          fetch(`${API}/manager/payments/`, {
            headers: authHeaders,
          }),
          fetch(`${API}/manager/invoices/`, {
            headers: authHeaders,
          }),
        ]);

      if (!paymentsResponse.ok) {
        throw new Error("Failed to load payments");
      }

      if (!invoicesResponse.ok) {
        throw new Error("Failed to load invoices");
      }

      const paymentData = await paymentsResponse.json();
      const invoiceData = await invoicesResponse.json();

      setPayments(paymentData);
      setInvoices(invoiceData);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      invoice_id: "",
      amount: "",
      payment_date: "",
      payment_method: "UPI",
      transaction_reference: "",
      status: "SUCCESS",
    });
  };

  const openAddModal = () => {
    setEditingPayment(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (payment) => {
    setEditingPayment(payment);

    setForm({
      invoice_id: String(payment.invoice_id),
      amount: payment.amount,
      payment_date: payment.payment_date,
      payment_method: payment.payment_method,
      transaction_reference:
        payment.transaction_reference || "",
      status: payment.status,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPayment(null);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        invoice_id: Number(form.invoice_id),
        amount: Number(form.amount),
        payment_date: form.payment_date,
        payment_method: form.payment_method,
        transaction_reference:
          form.transaction_reference.trim() || null,
        status: form.status,
      };

      const url = editingPayment
        ? `${API}/manager/payments/${editingPayment.id}`
        : `${API}/manager/payments/`;

      const method = editingPayment ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to save payment"
        );
      }

      closeModal();
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (payment) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this payment of ${formatMoney(
        payment.amount
      )}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API}/manager/payments/${payment.id}`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to delete payment"
        );
      }

      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredPayments = useMemo(() => {
    const query = search.toLowerCase().trim();

    return payments.filter((payment) => {
      const matchesSearch =
        !query ||
        payment.invoice_number
          .toLowerCase()
          .includes(query) ||
        payment.shop_code
          .toLowerCase()
          .includes(query) ||
        payment.shop_name
          .toLowerCase()
          .includes(query) ||
        payment.tenant_name
          .toLowerCase()
          .includes(query) ||
        (payment.transaction_reference || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        payment.status === statusFilter;

      const matchesMethod =
        methodFilter === "ALL" ||
        payment.payment_method === methodFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesMethod
      );
    });
  }, [
    payments,
    search,
    statusFilter,
    methodFilter,
  ]);

  const formatMoney = (value) => {
    return `₹${Number(value || 0).toLocaleString(
      "en-IN"
    )}`;
  };

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatMethod = (method) => {
    return method.replace("_", " ");
  };

  const getStatusClass = (status) => {
    return status.toLowerCase();
  };

  const logout = () => {
    localStorage.removeItem("phoenix_token");
    localStorage.removeItem("phoenix_user");
    navigate("/login");
  };

  return (
    <div className="manager-app">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="manager-sidebar">

        <div className="manager-logo">
          PHOENIX<span>.</span>
        </div>

        <div className="manager-sidebar-label">
          MANAGEMENT
        </div>

        <nav className="manager-nav">

          <button
            className="manager-nav-item"
            onClick={() => navigate("/manager")}
          >
            <span className="nav-icon">⌂</span>
            <span>Dashboard</span>
          </button>

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/shops")
            }
          >
            <span className="nav-icon">▦</span>
            <span>Shops</span>
          </button>

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/tenants")
            }
          >
            <span className="nav-icon">♙</span>
            <span>Tenants</span>
          </button>

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/leases")
            }
          >
            <span className="nav-icon">◫</span>
            <span>Leases</span>
          </button>

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/invoices")
            }
          >
            <span className="nav-icon">▤</span>
            <span>Invoices</span>
          </button>

          <button className="manager-nav-item active">
            <span className="nav-icon">₹</span>
            <span>Payments</span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">◉</span>
            <span>Restaurants</span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">%</span>
            <span>Offers</span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">★</span>
            <span>Reviews</span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">⌁</span>
            <span>Sales</span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">▥</span>
            <span>Reports</span>
          </button>

        </nav>

        <div className="manager-sidebar-bottom">

          <div className="manager-user">

            <div className="manager-avatar">
              P
            </div>

            <div className="manager-user-info">
              <strong>Manager</strong>
              <span>MANAGER</span>
            </div>

          </div>

          <button
            className="logout-button"
            onClick={logout}
          >
            <span>↪</span>
            LOG OUT
          </button>

        </div>

      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main className="manager-main">

        <header className="manager-topbar">

          <div>
            <p className="manager-breadcrumb">
              PHOENIX / MANAGEMENT
            </p>

            <h1>Payments</h1>
          </div>

          <div className="manager-topbar-right">

            <div className="manager-date">
              <span className="date-dot"></span>
              SYSTEM ONLINE
            </div>

            <div className="topbar-avatar">
              ₹
            </div>

          </div>

        </header>

        {/* =========================
            PAGE HEADER
        ========================= */}

        <section className="payment-page-header">

          <div>
            <p className="eyebrow">
              FINANCIAL OPERATIONS
            </p>

            <h2>
              Payment Records
            </h2>

            <p>
              Track and manage payments received
              against tenant invoices.
            </p>
          </div>

          <button
            className="primary-action"
            onClick={openAddModal}
          >
            + Record Payment
          </button>

        </section>

        {/* =========================
            CONTROLS
        ========================= */}

        <section className="payment-controls">

          <div className="payment-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search invoice, shop, tenant..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="ALL">
              All Statuses
            </option>

            <option value="SUCCESS">
              Success
            </option>

            <option value="FAILED">
              Failed
            </option>

            <option value="REFUNDED">
              Refunded
            </option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) =>
              setMethodFilter(e.target.value)
            }
          >
            <option value="ALL">
              All Methods
            </option>

            <option value="CASH">
              Cash
            </option>

            <option value="CARD">
              Card
            </option>

            <option value="UPI">
              UPI
            </option>

            <option value="BANK_TRANSFER">
              Bank Transfer
            </option>
          </select>

        </section>

        {error && (
          <div className="payment-error">
            {error}
          </div>
        )}

        {/* =========================
            TABLE
        ========================= */}

        <section className="payment-table-card">

          <div className="payment-table-heading">

            <div>
              <p className="card-eyebrow">
                TRANSACTIONS
              </p>

              <h3>
                Payment History
              </h3>
            </div>

            <span>
              {filteredPayments.length} payment
              {filteredPayments.length !== 1
                ? "s"
                : ""}
            </span>

          </div>

          {loading ? (
            <div className="payment-empty">
              Loading payments...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="payment-empty">
              No payments found.
            </div>
          ) : (
            <div className="payment-table-wrapper">

              <table className="payment-table">

                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Shop</th>
                    <th>Tenant</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredPayments.map(
                    (payment) => (
                      <tr key={payment.id}>

                        <td>
                          <strong>
                            {payment.invoice_number}
                          </strong>
                        </td>

                        <td>
                          <div className="payment-shop">
                            <strong>
                              {payment.shop_name}
                            </strong>

                            <span>
                              {payment.shop_code}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="payment-tenant">
                            <strong>
                              {payment.tenant_name}
                            </strong>

                            {payment.tenant_company && (
                              <span>
                                {
                                  payment.tenant_company
                                }
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <strong className="payment-amount">
                            {formatMoney(
                              payment.amount
                            )}
                          </strong>
                        </td>

                        <td>
                          {formatDate(
                            payment.payment_date
                          )}
                        </td>

                        <td>
                          <span className="payment-method">
                            {formatMethod(
                              payment.payment_method
                            )}
                          </span>
                        </td>

                        <td>
                          <span className="payment-reference">
                            {payment.transaction_reference ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`payment-status ${getStatusClass(
                              payment.status
                            )}`}
                          >
                            {payment.status}
                          </span>
                        </td>

                        <td>

                          <div className="payment-actions">

                            <button
                              className="edit-button"
                              onClick={() =>
                                openEditModal(
                                  payment
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                handleDelete(
                                  payment
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

      </main>

      {/* =========================
          MODAL
      ========================= */}

      {showModal && (

        <div className="modal-overlay">

          <div className="manager-modal payment-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingPayment
                    ? "Edit Payment"
                    : "Record Payment"}
                </h2>

                <p>
                  Enter payment transaction
                  information.
                </p>

              </div>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-grid">

                <div className="form-group">

                  <label>
                    Invoice *
                  </label>

                  <select
                    name="invoice_id"
                    value={form.invoice_id}
                    onChange={handleChange}
                    required
                  >

                    <option value="">
                      Select Invoice
                    </option>

                    {invoices.map((invoice) => (
                      <option
                        key={invoice.id}
                        value={invoice.id}
                      >
                        {invoice.invoice_number}
                        {" — "}
                        {invoice.shop_code}
                        {" — "}
                        {invoice.tenant_name}
                      </option>
                    ))}

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Amount *
                  </label>

                  <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    placeholder="50000"
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Payment Date *
                  </label>

                  <input
                    type="date"
                    name="payment_date"
                    value={form.payment_date}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="form-group">

                  <label>
                    Payment Method *
                  </label>

                  <select
                    name="payment_method"
                    value={form.payment_method}
                    onChange={handleChange}
                    required
                  >

                    <option value="CASH">
                      Cash
                    </option>

                    <option value="CARD">
                      Card
                    </option>

                    <option value="UPI">
                      UPI
                    </option>

                    <option value="BANK_TRANSFER">
                      Bank Transfer
                    </option>

                  </select>

                </div>

                <div className="form-group">

                  <label>
                    Transaction Reference
                  </label>

                  <input
                    type="text"
                    name="transaction_reference"
                    value={
                      form.transaction_reference
                    }
                    onChange={handleChange}
                    placeholder="TXN-123456"
                  />

                </div>

                <div className="form-group">

                  <label>
                    Status *
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    required
                  >

                    <option value="SUCCESS">
                      Success
                    </option>

                    <option value="FAILED">
                      Failed
                    </option>

                    <option value="REFUNDED">
                      Refunded
                    </option>

                  </select>

                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="secondary-action"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-action"
                >
                  {editingPayment
                    ? "Update Payment"
                    : "Record Payment"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default ManagerPayments;