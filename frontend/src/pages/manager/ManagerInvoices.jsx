import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerDashboard.css";
import "./ManagerInvoices.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

function ManagerInvoices() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [leases, setLeases] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  const [form, setForm] = useState({
    invoice_number: "",
    lease_id: "",
    billing_month: "",
    rent_amount: "",
    maintenance_amount: "0",
    utility_amount: "0",
    tax_amount: "0",
    due_date: "",
    status: "PENDING",
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

      const [invoiceResponse, leaseResponse] = await Promise.all([
        fetch(`${API}/manager/invoices/`, {
          headers: authHeaders,
        }),
        fetch(`${API}/manager/leases/`, {
          headers: authHeaders,
        }),
      ]);

      if (!invoiceResponse.ok) {
        throw new Error("Failed to load invoices");
      }

      if (!leaseResponse.ok) {
        throw new Error("Failed to load leases");
      }

      const invoiceData = await invoiceResponse.json();
      const leaseData = await leaseResponse.json();

      setInvoices(invoiceData);
      setLeases(leaseData);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      invoice_number: "",
      lease_id: "",
      billing_month: "",
      rent_amount: "",
      maintenance_amount: "0",
      utility_amount: "0",
      tax_amount: "0",
      due_date: "",
      status: "PENDING",
    });
  };

  const openAddModal = () => {
    setEditingInvoice(null);
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (invoice) => {
    setEditingInvoice(invoice);

    setForm({
      invoice_number: invoice.invoice_number,
      lease_id: String(invoice.lease_id),
      billing_month: invoice.billing_month,
      rent_amount: invoice.rent_amount,
      maintenance_amount: invoice.maintenance_amount,
      utility_amount: invoice.utility_amount,
      tax_amount: invoice.tax_amount,
      due_date: invoice.due_date,
      status: invoice.status,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingInvoice(null);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const subtotal =
    Number(form.rent_amount || 0) +
    Number(form.maintenance_amount || 0) +
    Number(form.utility_amount || 0);

  const total = subtotal + Number(form.tax_amount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        invoice_number: form.invoice_number.trim(),
        lease_id: Number(form.lease_id),
        billing_month: form.billing_month,
        rent_amount: Number(form.rent_amount),
        maintenance_amount: Number(form.maintenance_amount || 0),
        utility_amount: Number(form.utility_amount || 0),
        tax_amount: Number(form.tax_amount || 0),
        due_date: form.due_date,
        status: form.status,
      };

      const url = editingInvoice
        ? `${API}/manager/invoices/${editingInvoice.id}`
        : `${API}/manager/invoices/`;

      const method = editingInvoice ? "PUT" : "POST";

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
        throw new Error(data.detail || "Failed to save invoice");
      }

      closeModal();
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (invoice) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete invoice ${invoice.invoice_number}?`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API}/manager/invoices/${invoice.id}`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete invoice");
      }

      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredInvoices = useMemo(() => {
    const query = search.toLowerCase().trim();

    return invoices.filter((invoice) => {
      const matchesSearch =
        !query ||
        invoice.invoice_number.toLowerCase().includes(query) ||
        invoice.shop_code.toLowerCase().includes(query) ||
        invoice.shop_name.toLowerCase().includes(query) ||
        invoice.tenant_name.toLowerCase().includes(query) ||
        (invoice.tenant_company || "").toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const formatMoney = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  const formatDate = (value) => {
    if (!value) return "-";

    return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    return status.toLowerCase().replace("_", "-");
  };

  const logout = () => {
    localStorage.removeItem("phoenix_token");
    localStorage.removeItem("phoenix_user");
    navigate("/login");
  };

  return (
    <div className="manager-layout">
      {/* SIDEBAR */}

      <aside className="manager-sidebar">
        <div className="manager-brand">
          <div className="manager-brand-name">PHOENIX</div>
          <div className="manager-brand-subtitle">
            MALL MANAGEMENT
          </div>
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
            onClick={() => navigate("/manager/shops")}
          >
            <span className="nav-icon">▦</span>
            <span>Shops</span>
          </button>

          <button
            className="manager-nav-item"
            onClick={() => navigate("/manager/tenants")}
          >
            <span className="nav-icon">♙</span>
            <span>Tenants</span>
          </button>

          <button
            className="manager-nav-item"
            onClick={() => navigate("/manager/leases")}
          >
            <span className="nav-icon">◫</span>
            <span>Leases</span>
          </button>

          <button className="manager-nav-item active">
            <span className="nav-icon">▤</span>
            <span>Invoices</span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">₹</span>
            <span>Payments</span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">♨</span>
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
        </nav>

        <div className="manager-sidebar-bottom">
          <button
            className="manager-nav-item"
            onClick={() => navigate("/")}
          >
            <span className="nav-icon">↗</span>
            <span>Public Website</span>
          </button>

          <button
            className="manager-nav-item logout-item"
            onClick={logout}
          >
            <span className="nav-icon">⇥</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}

      <main className="manager-main">
        <header className="manager-header">
          <div>
            <h1>Invoices</h1>
            <p>Manage tenant invoices and billing records.</p>
          </div>

          <button
            className="primary-action"
            onClick={openAddModal}
          >
            + Add Invoice
          </button>
        </header>

        {/* CONTROLS */}

        <section className="invoice-controls">
          <div className="search-box">
            <span>⌕</span>

            <input
              type="text"
              placeholder="Search invoice, shop or tenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIALLY_PAID">
              Partially Paid
            </option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </section>

        {error && (
          <div className="invoice-error">
            {error}
          </div>
        )}

        {/* TABLE */}

        <section className="invoice-table-card">
          <div className="table-heading">
            <div>
              <h2>Invoice Records</h2>
              <span>
                {filteredInvoices.length} invoice
                {filteredInvoices.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="invoice-empty">
              Loading invoices...
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="invoice-empty">
              No invoices found.
            </div>
          ) : (
            <div className="invoice-table-wrapper">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Shop</th>
                    <th>Tenant</th>
                    <th>Billing Month</th>
                    <th>Due Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td>
                        <strong>
                          {invoice.invoice_number}
                        </strong>
                      </td>

                      <td>
                        <div className="invoice-shop">
                          <strong>{invoice.shop_name}</strong>
                          <span>{invoice.shop_code}</span>
                        </div>
                      </td>

                      <td>
                        <div className="invoice-tenant">
                          <strong>{invoice.tenant_name}</strong>

                          {invoice.tenant_company && (
                            <span>
                              {invoice.tenant_company}
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        {formatDate(invoice.billing_month)}
                      </td>

                      <td>
                        {formatDate(invoice.due_date)}
                      </td>

                      <td>
                        <strong>
                          {formatMoney(invoice.total_amount)}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`invoice-status ${getStatusClass(
                            invoice.status
                          )}`}
                        >
                          {invoice.status.replace("_", " ")}
                        </span>
                      </td>

                      <td>
                        <div className="invoice-actions">
                          <button
                            className="edit-button"
                            onClick={() =>
                              openEditModal(invoice)
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              handleDelete(invoice)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* MODAL */}

      {showModal && (
        <div className="modal-overlay">
          <div className="manager-modal invoice-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingInvoice
                    ? "Edit Invoice"
                    : "Add Invoice"}
                </h2>

                <p>
                  Enter invoice and billing information.
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
                  <label>Invoice Number *</label>

                  <input
                    type="text"
                    name="invoice_number"
                    value={form.invoice_number}
                    onChange={handleChange}
                    placeholder="INV-2026-001"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Lease *</label>

                  <select
                    name="lease_id"
                    value={form.lease_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select Lease
                    </option>

                    {leases.map((lease) => (
                      <option
                        key={lease.id}
                        value={lease.id}
                      >
                        {lease.lease_number} —{" "}
                        {lease.shop_code} —{" "}
                        {lease.tenant_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Billing Month *</label>

                  <input
                    type="date"
                    name="billing_month"
                    value={form.billing_month}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Due Date *</label>

                  <input
                    type="date"
                    name="due_date"
                    value={form.due_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Rent Amount *</label>

                  <input
                    type="number"
                    name="rent_amount"
                    value={form.rent_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Maintenance Amount</label>

                  <input
                    type="number"
                    name="maintenance_amount"
                    value={form.maintenance_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Utility Amount</label>

                  <input
                    type="number"
                    name="utility_amount"
                    value={form.utility_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Tax Amount</label>

                  <input
                    type="number"
                    name="tax_amount"
                    value={form.tax_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Status *</label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="PENDING">
                      Pending
                    </option>

                    <option value="PARTIALLY_PAID">
                      Partially Paid
                    </option>

                    <option value="PAID">
                      Paid
                    </option>

                    <option value="OVERDUE">
                      Overdue
                    </option>
                  </select>
                </div>
              </div>

              <div className="invoice-total-preview">
                <div>
                  <span>Subtotal</span>
                  <strong>
                    {formatMoney(subtotal)}
                  </strong>
                </div>

                <div>
                  <span>Tax</span>
                  <strong>
                    {formatMoney(form.tax_amount)}
                  </strong>
                </div>

                <div className="invoice-grand-total">
                  <span>Total</span>
                  <strong>
                    {formatMoney(total)}
                  </strong>
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
                  {editingInvoice
                    ? "Update Invoice"
                    : "Create Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerInvoices;