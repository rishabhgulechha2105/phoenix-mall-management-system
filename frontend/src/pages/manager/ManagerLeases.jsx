import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerDashboard.css";
import "./ManagerLeases.css";

const API_URL = "http://127.0.0.1:8001";

function ManagerLeases() {
  const navigate = useNavigate();

  const [leases, setLeases] = useState([]);
  const [shops, setShops] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingLease, setEditingLease] = useState(null);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    lease_number: "",
    shop_id: "",
    tenant_id: "",
    start_date: "",
    end_date: "",
    monthly_rent: "",
    maintenance_charge: "",
    security_deposit: "",
    status: "ACTIVE",
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

      loadPageData();
    } catch {
      localStorage.removeItem("phoenix_token");
      localStorage.removeItem("phoenix_user");
      navigate("/login");
    }
  }, [navigate]);

  // =========================
  // LOAD PAGE DATA
  // =========================

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [leasesResponse, shopsResponse, tenantsResponse] =
        await Promise.all([
          fetch(`${API_URL}/manager/leases/`, {
            headers,
          }),

          fetch(`${API_URL}/manager/shops/`, {
            headers,
          }),

          fetch(`${API_URL}/manager/tenants/`, {
            headers,
          }),
        ]);

      if (
        leasesResponse.status === 401 ||
        leasesResponse.status === 403 ||
        shopsResponse.status === 401 ||
        shopsResponse.status === 403 ||
        tenantsResponse.status === 401 ||
        tenantsResponse.status === 403
      ) {
        localStorage.removeItem("phoenix_token");
        localStorage.removeItem("phoenix_user");
        navigate("/login");
        return;
      }

      const leasesData = await leasesResponse.json();
      const shopsData = await shopsResponse.json();
      const tenantsData = await tenantsResponse.json();

      if (!leasesResponse.ok) {
        throw new Error(
          leasesData.detail || "Failed to load leases."
        );
      }

      if (!shopsResponse.ok) {
        throw new Error(
          shopsData.detail || "Failed to load shops."
        );
      }

      if (!tenantsResponse.ok) {
        throw new Error(
          tenantsData.detail || "Failed to load tenants."
        );
      }

      setLeases(leasesData);
      setShops(shopsData);
      setTenants(tenantsData);
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
  // FORM RESET
  // =========================

  const resetForm = () => {
    setForm({
      lease_number: "",
      shop_id: "",
      tenant_id: "",
      start_date: "",
      end_date: "",
      monthly_rent: "",
      maintenance_charge: "",
      security_deposit: "",
      status: "ACTIVE",
    });
  };

  // =========================
  // ADD LEASE
  // =========================

  const openAddModal = () => {
    setEditingLease(null);
    resetForm();
    setError("");
    setShowModal(true);
  };

  // =========================
  // EDIT LEASE
  // =========================

  const openEditModal = (lease) => {
    setEditingLease(lease);

    setForm({
      lease_number: lease.lease_number || "",
      shop_id: String(lease.shop_id || ""),
      tenant_id: String(lease.tenant_id || ""),
      start_date: lease.start_date || "",
      end_date: lease.end_date || "",
      monthly_rent: String(lease.monthly_rent || ""),
      maintenance_charge: String(
        lease.maintenance_charge || ""
      ),
      security_deposit: String(
        lease.security_deposit || ""
      ),
      status: lease.lease_status || "ACTIVE",
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
    setEditingLease(null);
    setError("");
    resetForm();
  };

  // =========================
  // HANDLE FORM
  // =========================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================
  // SAVE LEASE
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.lease_number.trim() ||
      !form.shop_id ||
      !form.tenant_id ||
      !form.start_date ||
      !form.end_date ||
      !form.monthly_rent
    ) {
      setError(
        "Lease number, shop, tenant, dates and monthly rent are required."
      );
      return;
    }

    if (form.start_date >= form.end_date) {
      setError(
        "End date must be after the start date."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        lease_number: form.lease_number.trim(),
        shop_id: Number(form.shop_id),
        tenant_id: Number(form.tenant_id),
        start_date: form.start_date,
        end_date: form.end_date,
        monthly_rent: Number(form.monthly_rent),
        maintenance_charge:
          Number(form.maintenance_charge) || 0,
        security_deposit:
          Number(form.security_deposit) || 0,
        status: form.status,
      };

      const url = editingLease
        ? `${API_URL}/manager/leases/${editingLease.id}`
        : `${API_URL}/manager/leases/`;

      const method = editingLease ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to save lease."
        );
      }

      setShowModal(false);
      setEditingLease(null);
      resetForm();

      await loadPageData();
    } catch (err) {
      setError(
        err.message || "Failed to save lease."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE LEASE
  // =========================

  const handleDelete = async (lease) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete lease ${lease.lease_number}?`
    );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(
        `${API_URL}/manager/leases/${lease.id}`,
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
          data.detail || "Failed to delete lease."
        );
      }

      await loadPageData();
    } catch (err) {
      setError(
        err.message || "Failed to delete lease."
      );
    }
  };

  // =========================
  // FORMAT CURRENCY
  // =========================

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  // =========================
  // FORMAT DATE
  // =========================

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(`${value}T00:00:00`);

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================
  // SEARCH + FILTER
  // =========================

  const filteredLeases = leases.filter((lease) => {
    const query = search.toLowerCase().trim();

    const matchesSearch =
      !query ||
      lease.lease_number
        ?.toLowerCase()
        .includes(query) ||
      lease.shop_code
        ?.toLowerCase()
        .includes(query) ||
      lease.shop_name
        ?.toLowerCase()
        .includes(query) ||
      lease.tenant_name
        ?.toLowerCase()
        .includes(query) ||
      lease.tenant_company
        ?.toLowerCase()
        .includes(query);

    const matchesStatus =
      statusFilter === "ALL" ||
      lease.lease_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="manager-loading">
        <div className="manager-loader"></div>
        <p>Loading PHOENIX leases...</p>
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

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager")
            }
          >
            <span className="nav-icon">
              ⌂
            </span>
            <span>Dashboard</span>
          </button>

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/shops")
            }
          >
            <span className="nav-icon">
              ▦
            </span>
            <span>Shops</span>
          </button>

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/tenants")
            }
          >
            <span className="nav-icon">
              ♙
            </span>
            <span>Tenants</span>
          </button>

          <button
            className="manager-nav-item active"
          >
            <span className="nav-icon">
              ◫
            </span>
            <span>Leases</span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">
              ▤
            </span>
            <span>Invoices</span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">
              ₹
            </span>
            <span>Payments</span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">
              ◉
            </span>
            <span>Restaurants</span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">
              %
            </span>
            <span>Offers</span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">
              ★
            </span>
            <span>Reviews</span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">
              ⌁
            </span>
            <span>Sales</span>
          </button>

          <button className="manager-nav-item">
            <span className="nav-icon">
              ▥
            </span>
            <span>Reports</span>
          </button>

        </nav>

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
          MAIN CONTENT
      ========================= */}

      <main className="manager-main">

        <header className="manager-topbar">

          <div>

            <p className="manager-breadcrumb">
              PHOENIX / MANAGEMENT / LEASES
            </p>

            <h1>
              Leases
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

        <section className="lease-page-header">

          <div>

            <p className="eyebrow">
              LEASE MANAGEMENT
            </p>

            <h2>
              Manage your
              <br />
              <em>lease portfolio.</em>
            </h2>

            <p className="lease-description">
              Manage shop tenancy agreements,
              rental terms and lease periods
              across PHOENIX.
            </p>

          </div>

          <div className="lease-header-mark">
            L<span>.</span>
          </div>

        </section>

        {/* =========================
            TOOLBAR
        ========================= */}

        <section className="lease-toolbar">

          <div className="lease-search">

            <span className="lease-search-icon">
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search lease, shop or tenant..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                className="lease-clear-search"
                onClick={() =>
                  setSearch("")
                }
              >
                ×
              </button>
            )}

          </div>

          <div className="lease-filter">

            <label>
              STATUS
            </label>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              <option value="ALL">
                All Status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="EXPIRING_SOON">
                Expiring Soon
              </option>

              <option value="EXPIRED">
                Expired
              </option>

              <option value="TERMINATED">
                Terminated
              </option>

            </select>

          </div>

          <div className="lease-toolbar-right">

            <span className="lease-count">
              {filteredLeases.length}{" "}
              {filteredLeases.length === 1
                ? "LEASE"
                : "LEASES"}
            </span>

            <button
              className="lease-add-button"
              onClick={openAddModal}
            >
              <span>+</span>
              ADD LEASE
            </button>

          </div>

        </section>

        {/* =========================
            ERROR
        ========================= */}

        {error && !showModal && (
          <div className="lease-error">
            <span>!</span>
            {error}
          </div>
        )}

        {/* =========================
            TABLE
        ========================= */}

        <section className="lease-table-card">

          <div className="lease-table-header">

            <div>

              <p className="card-eyebrow">
                REGISTERED AGREEMENTS
              </p>

              <h3>
                Lease Directory
              </h3>

            </div>

            <span className="lease-total-label">
              {leases.length} RECORDS
            </span>

          </div>

          {filteredLeases.length === 0 ? (

            <div className="lease-empty">

              <div className="lease-empty-icon">
                ◫
              </div>

              <h3>
                No leases found
              </h3>

              <p>
                Try changing your search or
                create a new lease.
              </p>

              <button
                className="lease-add-button"
                onClick={openAddModal}
              >
                + ADD LEASE
              </button>

            </div>

          ) : (

            <div className="lease-table-wrapper">

              <table className="lease-table">

                <thead>

                  <tr>
                    <th>Lease</th>
                    <th>Shop</th>
                    <th>Tenant</th>
                    <th>Lease Period</th>
                    <th>Monthly Rent</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>

                </thead>

                <tbody>

                  {filteredLeases.map(
                    (lease) => (

                      <tr key={lease.id}>

                        {/* LEASE */}

                        <td>

                          <div className="lease-number">

                            <strong>
                              {lease.lease_number}
                            </strong>

                            <span>
                              Lease ID #{lease.id}
                            </span>

                          </div>

                        </td>

                        {/* SHOP */}

                        <td>

                          <div className="lease-shop">

                            <strong>
                              {lease.shop_name}
                            </strong>

                            <span>
                              {lease.shop_code}
                            </span>

                          </div>

                        </td>

                        {/* TENANT */}

                        <td>

                          <div className="lease-tenant">

                            <strong>
                              {lease.tenant_name}
                            </strong>

                            <span>
                              {lease.tenant_company ||
                                "Individual tenant"}
                            </span>

                          </div>

                        </td>

                        {/* PERIOD */}

                        <td>

                          <div className="lease-period">

                            <span>
                              {formatDate(
                                lease.start_date
                              )}
                            </span>

                            <span className="period-arrow">
                              →
                            </span>

                            <span>
                              {formatDate(
                                lease.end_date
                              )}
                            </span>

                          </div>

                        </td>

                        {/* RENT */}

                        <td>

                          <strong className="lease-rent">
                            {formatCurrency(
                              lease.monthly_rent
                            )}
                          </strong>

                          <span className="rent-label">
                            / month
                          </span>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`lease-status ${lease.lease_status
                              ?.toLowerCase()
                              .replace("_", "-")}`}
                          >
                            {lease.lease_status
                              ?.replace(
                                "_",
                                " "
                              )}
                          </span>

                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="lease-actions">

                            <button
                              className="lease-edit-button"
                              onClick={() =>
                                openEditModal(
                                  lease
                                )
                              }
                            >
                              EDIT
                            </button>

                            <button
                              className="lease-delete-button"
                              onClick={() =>
                                handleDelete(
                                  lease
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
          className="lease-back-button"
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
          MODAL
      ========================= */}

      {showModal && (

        <div
          className="lease-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="lease-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="lease-modal-header">

              <div>

                <p className="card-eyebrow">
                  {editingLease
                    ? "UPDATE AGREEMENT"
                    : "NEW AGREEMENT"}
                </p>

                <h2>
                  {editingLease
                    ? "Edit Lease"
                    : "Create Lease"}
                </h2>

                <p>
                  {editingLease
                    ? "Update lease terms and agreement details."
                    : "Create a new tenancy agreement."}
                </p>

              </div>

              <button
                className="lease-modal-close"
                onClick={closeModal}
                disabled={saving}
              >
                ×
              </button>

            </div>

            {error && (
              <div className="lease-modal-error">
                <span>!</span>
                {error}
              </div>
            )}

            <form
              className="lease-form"
              onSubmit={handleSubmit}
            >

              <div className="lease-form-grid">

                {/* LEASE NUMBER */}

                <div className="lease-form-group">

                  <label>
                    LEASE NUMBER *
                  </label>

                  <input
                    name="lease_number"
                    value={form.lease_number}
                    onChange={handleChange}
                    placeholder="e.g. LSE-2026-001"
                  />

                </div>

                {/* STATUS */}

                <div className="lease-form-group">

                  <label>
                    STATUS
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="EXPIRING_SOON">
                      Expiring Soon
                    </option>

                    <option value="EXPIRED">
                      Expired
                    </option>

                    <option value="TERMINATED">
                      Terminated
                    </option>

                  </select>

                </div>

                {/* SHOP */}

                <div className="lease-form-group">

                  <label>
                    SHOP *
                  </label>

                  <select
                    name="shop_id"
                    value={form.shop_id}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select shop
                    </option>

                    {shops.map((shop) => (
                      <option
                        key={shop.id}
                        value={shop.id}
                      >
                        {shop.shop_code} —{" "}
                        {shop.name}
                      </option>
                    ))}

                  </select>

                </div>

                {/* TENANT */}

                <div className="lease-form-group">

                  <label>
                    TENANT *
                  </label>

                  <select
                    name="tenant_id"
                    value={form.tenant_id}
                    onChange={handleChange}
                  >
                    <option value="">
                      Select tenant
                    </option>

                    {tenants.map((tenant) => (
                      <option
                        key={tenant.id}
                        value={tenant.id}
                      >
                        {tenant.name}
                        {tenant.company_name
                          ? ` — ${tenant.company_name}`
                          : ""}
                      </option>
                    ))}

                  </select>

                </div>

                {/* START DATE */}

                <div className="lease-form-group">

                  <label>
                    START DATE *
                  </label>

                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                  />

                </div>

                {/* END DATE */}

                <div className="lease-form-group">

                  <label>
                    END DATE *
                  </label>

                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                  />

                </div>

                {/* RENT */}

                <div className="lease-form-group">

                  <label>
                    MONTHLY RENT *
                  </label>

                  <div className="money-input">

                    <span>
                      ₹
                    </span>

                    <input
                      type="number"
                      name="monthly_rent"
                      min="0"
                      value={form.monthly_rent}
                      onChange={handleChange}
                      placeholder="0"
                    />

                  </div>

                </div>

                {/* MAINTENANCE */}

                <div className="lease-form-group">

                  <label>
                    MAINTENANCE CHARGE
                  </label>

                  <div className="money-input">

                    <span>
                      ₹
                    </span>

                    <input
                      type="number"
                      name="maintenance_charge"
                      min="0"
                      value={
                        form.maintenance_charge
                      }
                      onChange={handleChange}
                      placeholder="0"
                    />

                  </div>

                </div>

                {/* SECURITY DEPOSIT */}

                <div className="lease-form-group full">

                  <label>
                    SECURITY DEPOSIT
                  </label>

                  <div className="money-input">

                    <span>
                      ₹
                    </span>

                    <input
                      type="number"
                      name="security_deposit"
                      min="0"
                      value={
                        form.security_deposit
                      }
                      onChange={handleChange}
                      placeholder="0"
                    />

                  </div>

                </div>

              </div>

              <div className="lease-modal-actions">

                <button
                  type="button"
                  className="lease-cancel-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  className="lease-save-button"
                  disabled={saving}
                >
                  {saving
                    ? "SAVING..."
                    : editingLease
                    ? "UPDATE LEASE"
                    : "CREATE LEASE"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default ManagerLeases;