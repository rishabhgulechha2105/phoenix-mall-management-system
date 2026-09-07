import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerDashboard.css";
import "./ManagerTenants.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

function ManagerTenants() {
  const navigate = useNavigate();

  const [tenants, setTenants] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    gst_number: "",
  });

  const token = localStorage.getItem("phoenix_token");

  // =========================
  // AUTHENTICATION
  // =========================

  useEffect(() => {
    const storedUser = localStorage.getItem("phoenix_user");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);

      if (
        parsedUser.role !== "ADMIN" &&
        parsedUser.role !== "MANAGER"
      ) {
        navigate("/login");
        return;
      }

      setUser(parsedUser);
      fetchTenants();
    } catch {
      localStorage.removeItem("phoenix_token");
      localStorage.removeItem("phoenix_user");
      navigate("/login");
    }
  }, [navigate]);

  // =========================
  // FETCH TENANTS
  // =========================

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/manager/tenants/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("phoenix_token");
        localStorage.removeItem("phoenix_user");
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to load tenants."
        );
      }

      setTenants(data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the PHOENIX server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem("phoenix_token");
    localStorage.removeItem("phoenix_user");
    navigate("/login");
  };

  // =========================
  // ADD TENANT
  // =========================

  const openAddModal = () => {
    setEditingTenant(null);

    setForm({
      name: "",
      email: "",
      phone: "",
      company_name: "",
      gst_number: "",
    });

    setError("");
    setShowModal(true);
  };

  // =========================
  // EDIT TENANT
  // =========================

  const openEditModal = (tenant) => {
    setEditingTenant(tenant);

    setForm({
      name: tenant.name || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      company_name: tenant.company_name || "",
      gst_number: tenant.gst_number || "",
    });

    setError("");
    setShowModal(true);
  };

  // =========================
  // CLOSE MODAL
  // =========================

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingTenant(null);
    setError("");
  };

  // =========================
  // FORM CHANGE
  // =========================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // SAVE TENANT
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim()
    ) {
      setError(
        "Name, email and phone are required."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const url = editingTenant
        ? `${API_URL}/manager/tenants/${editingTenant.id}`
        : `${API_URL}/manager/tenants/`;

      const method = editingTenant
        ? "PUT"
        : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          company_name:
            form.company_name.trim() || null,
          gst_number:
            form.gst_number.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to save tenant."
        );
      }

      setShowModal(false);
      setEditingTenant(null);

      await fetchTenants();
    } catch (err) {
      setError(
        err.message || "Failed to save tenant."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE TENANT
  // =========================

  const handleDelete = async (tenant) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${tenant.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/manager/tenants/${tenant.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to delete tenant."
        );
      }

      await fetchTenants();
    } catch (err) {
      setError(
        err.message || "Failed to delete tenant."
      );
    }
  };

  // =========================
  // SEARCH
  // =========================

  const filteredTenants = tenants.filter(
    (tenant) => {
      const query = search.toLowerCase().trim();

      if (!query) return true;

      return (
        tenant.name
          ?.toLowerCase()
          .includes(query) ||
        tenant.email
          ?.toLowerCase()
          .includes(query) ||
        tenant.phone
          ?.toLowerCase()
          .includes(query) ||
        tenant.company_name
          ?.toLowerCase()
          .includes(query) ||
        tenant.gst_number
          ?.toLowerCase()
          .includes(query)
      );
    }
  );

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="manager-loading">
        <div className="manager-loader"></div>
        <p>Loading PHOENIX tenants...</p>
      </div>
    );
  }

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

          {/* DASHBOARD */}

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager")
            }
          >
            <span className="nav-icon">
              ⌂
            </span>

            <span>
              Dashboard
            </span>
          </button>

          {/* SHOPS */}

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/shops")
            }
          >
            <span className="nav-icon">
              ▦
            </span>

            <span>
              Shops
            </span>
          </button>

          {/* TENANTS */}

          <button
            className="manager-nav-item active"
            onClick={() =>
              navigate("/manager/tenants")
            }
          >
            <span className="nav-icon">
              ♙
            </span>

            <span>
              Tenants
            </span>
          </button>

          {/* PLACEHOLDER MODULES */}

          <button className="manager-nav-item">
            <span className="nav-icon">
              ◫
            </span>

            <span>
              Leases
            </span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">
              ▤
            </span>

            <span>
              Invoices
            </span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">
              ₹
            </span>

            <span>
              Payments
            </span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">
              ◉
            </span>

            <span>
              Restaurants
            </span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">
              %
            </span>

            <span>
              Offers
            </span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">
              ★
            </span>

            <span>
              Reviews
            </span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">
              ⌁
            </span>

            <span>
              Sales
            </span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">
              ▥
            </span>

            <span>
              Reports
            </span>
          </button>

        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="manager-sidebar-bottom">

          <div className="manager-user">

            <div className="manager-avatar">
              {user?.name
                ? user.name
                    .charAt(0)
                    .toUpperCase()
                : "U"}
            </div>

            <div className="manager-user-info">

              <strong>
                {user?.name || "Manager"}
              </strong>

              <span>
                {user?.role || "MANAGER"}
              </span>

            </div>

          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
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

        {/* TOP BAR */}

        <header className="manager-topbar">

          <div>

            <p className="manager-breadcrumb">
              PHOENIX / MANAGEMENT / TENANTS
            </p>

            <h1>
              Tenants
            </h1>

          </div>

          <div className="manager-topbar-right">

            <div className="manager-date">
              <span className="date-dot"></span>
              SYSTEM ONLINE
            </div>

            <div className="topbar-avatar">
              {user?.name
                ? user.name
                    .charAt(0)
                    .toUpperCase()
                : "U"}
            </div>

          </div>

        </header>

        {/* =========================
            PAGE HEADER
        ========================= */}

        <section className="tenant-page-header">

          <div>

            <p className="eyebrow">
              TENANT MANAGEMENT
            </p>

            <h2>
              Manage your
              <br />
              <em>tenant portfolio.</em>
            </h2>

            <p className="tenant-description">
              View and manage registered tenants
              and their business information.
            </p>

          </div>

          <div className="tenant-header-mark">
            T<span>.</span>
          </div>

        </section>

        {/* =========================
            TOOLBAR
        ========================= */}

        <section className="tenant-toolbar">

          <div className="tenant-search">

            <span className="search-icon">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search by tenant, company, email or GST..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                className="clear-search"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}

          </div>

          <div className="tenant-toolbar-right">

            <span className="tenant-count">
              {filteredTenants.length}{" "}
              {filteredTenants.length === 1
                ? "TENANT"
                : "TENANTS"}
            </span>

            <button
              className="tenant-add-button"
              onClick={openAddModal}
            >
              <span>+</span>
              ADD TENANT
            </button>

          </div>

        </section>

        {/* =========================
            ERROR
        ========================= */}

        {error && !showModal && (
          <div className="tenant-error">
            <span>!</span>
            {error}
          </div>
        )}

        {/* =========================
            TENANT TABLE
        ========================= */}

        <section className="tenant-table-card">

          <div className="tenant-table-header">

            <div>

              <p className="card-eyebrow">
                REGISTERED TENANTS
              </p>

              <h3>
                Tenant Directory
              </h3>

            </div>

            <span className="tenant-total-label">
              {tenants.length} RECORDS
            </span>

          </div>

          {filteredTenants.length === 0 ? (

            <div className="tenant-empty">

              <div className="empty-icon">
                ♙
              </div>

              <h3>
                No tenants found
              </h3>

              <p>
                Try changing your search or
                add a new tenant.
              </p>

              <button
                className="tenant-add-button"
                onClick={openAddModal}
              >
                + ADD TENANT
              </button>

            </div>

          ) : (

            <div className="tenant-table-wrapper">

              <table className="tenant-table">

                <thead>

                  <tr>
                    <th>Tenant</th>
                    <th>Company</th>
                    <th>Contact</th>
                    <th>GST Number</th>
                    <th>Actions</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredTenants.map(
                    (tenant) => (

                      <tr key={tenant.id}>

                        {/* TENANT */}

                        <td>

                          <div className="tenant-identity">

                            <div className="tenant-avatar-large">
                              {tenant.name
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {tenant.name}
                              </strong>

                              <span>
                                Tenant ID #{tenant.id}
                              </span>

                            </div>

                          </div>

                        </td>

                        {/* COMPANY */}

                        <td>

                          <span className="company-name">

                            {tenant.company_name ||
                              "—"}

                          </span>

                        </td>

                        {/* CONTACT */}

                        <td>

                          <div className="contact-info">

                            <span>
                              {tenant.email}
                            </span>

                            <small>
                              {tenant.phone}
                            </small>

                          </div>

                        </td>

                        {/* GST */}

                        <td>

                          <span className="gst-number">

                            {tenant.gst_number ||
                              "Not provided"}

                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="tenant-actions">

                            <button
                              className="tenant-edit-button"
                              onClick={() =>
                                openEditModal(
                                  tenant
                                )
                              }
                            >
                              EDIT
                            </button>

                            <button
                              className="tenant-delete-button"
                              onClick={() =>
                                handleDelete(
                                  tenant
                                )
                              }
                            >
                              DELETE
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

        {/* =========================
            BACK BUTTON
        ========================= */}

        <button
          className="tenant-back-button"
          onClick={() =>
            navigate("/manager")
          }
        >
          <span>←</span>
          BACK TO DASHBOARD
        </button>

        {/* =========================
            FOOTER
        ========================= */}

        <footer className="manager-footer">

          <span>
            PHOENIX MANAGEMENT SYSTEM
          </span>

          <span>
            v1.0
          </span>

        </footer>

      </main>

      {/* =========================
          ADD / EDIT MODAL
      ========================= */}

      {showModal && (

        <div
          className="tenant-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="tenant-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="tenant-modal-header">

              <div>

                <p className="card-eyebrow">
                  {editingTenant
                    ? "UPDATE RECORD"
                    : "NEW RECORD"}
                </p>

                <h2>
                  {editingTenant
                    ? "Edit Tenant"
                    : "Add Tenant"}
                </h2>

                <p>
                  {editingTenant
                    ? "Update the tenant's business information."
                    : "Register a new tenant in PHOENIX."}
                </p>

              </div>

              <button
                className="tenant-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            {error && (
              <div className="tenant-modal-error">
                <span>!</span>
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="tenant-form"
            >

              <div className="tenant-form-grid">

                <div className="tenant-form-group">

                  <label>
                    TENANT NAME *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter tenant name"
                  />

                </div>

                <div className="tenant-form-group">

                  <label>
                    PHONE *
                  </label>

                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                  />

                </div>

                <div className="tenant-form-group full">

                  <label>
                    EMAIL *
                  </label>

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                  />

                </div>

                <div className="tenant-form-group full">

                  <label>
                    COMPANY NAME
                  </label>

                  <input
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    placeholder="Enter company name"
                  />

                </div>

                <div className="tenant-form-group full">

                  <label>
                    GST NUMBER
                  </label>

                  <input
                    name="gst_number"
                    value={form.gst_number}
                    onChange={handleChange}
                    placeholder="Enter GST number"
                  />

                </div>

              </div>

              <div className="tenant-modal-actions">

                <button
                  type="button"
                  className="tenant-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  className="tenant-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "SAVING..."
                    : editingTenant
                    ? "UPDATE TENANT"
                    : "ADD TENANT"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default ManagerTenants;