import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TenantDashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMonth = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
};

const formatMethod = (method) => {
  if (!method) return "—";

  const names = {
    UPI: "UPI",
    CARD: "Card",
    CASH: "Cash",
    BANK_TRANSFER: "Bank Transfer",
  };

  return names[method] || method;
};

const statusClass = (status) => {
  if (!status) return "";

  return status.toLowerCase().replaceAll("_", "-");
};

function TenantDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("phoenix_token");
    const userString = localStorage.getItem("phoenix_user");

    if (!token || !userString) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(userString);

      if (user.role !== "TENANT") {
        navigate("/manager");
        return;
      }
    } catch {
      localStorage.removeItem("phoenix_token");
      localStorage.removeItem("phoenix_user");
      navigate("/login");
      return;
    }

    const fetchDashboard = async () => {
      try {
        const response = await fetch(`${API_URL}/tenant/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("phoenix_token");
          localStorage.removeItem("phoenix_user");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load tenant dashboard");
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("phoenix_token");
    localStorage.removeItem("phoenix_user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="tenant-loading">
        <div className="tenant-spinner"></div>
        <p>Loading your Phoenix portal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tenant-error-page">
        <h2>Unable to load dashboard</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const profile = data.profile;
  const overview = data.overview;
  const financial = data.financial;
  const invoiceSummary = data.invoice_summary;

  const primaryLease = data.leases?.[0];
  const primaryShop = primaryLease?.shop;

  return (
    <div className="tenant-page">

      {/* ===================================================== */}
      {/* SIDEBAR */}
      {/* ===================================================== */}

      <aside className="tenant-sidebar">

        <div className="tenant-brand">
          <div className="tenant-brand-mark">P</div>

          <div>
            <h1>PHOENIX</h1>
            <span>Tenant Portal</span>
          </div>
        </div>

        <nav className="tenant-nav">

          {/* DASHBOARD */}

          <button
            className="tenant-nav-item active"
            onClick={() => navigate("/tenant")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          {/* RETAIL SALES */}

          <button
            className="tenant-nav-item"
            onClick={() => navigate("/tenant/sales")}
          >
            <span>▤</span>
            Retail Sales
          </button>

          {/* MY SHOP */}

          <button
            className="tenant-nav-item"
            onClick={() =>
              document
                .getElementById("tenant-shop")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>▣</span>
            My Shop
          </button>

          {/* MY LEASE */}

          <button
            className="tenant-nav-item"
            onClick={() =>
              document
                .getElementById("tenant-lease")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>◫</span>
            My Lease
          </button>

          {/* INVOICES */}

          <button
            className="tenant-nav-item"
            onClick={() =>
              document
                .getElementById("tenant-invoices")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>▤</span>
            Invoices
          </button>

          {/* PAYMENTS */}

          <button
            className="tenant-nav-item"
            onClick={() =>
              document
                .getElementById("tenant-payments")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>₹</span>
            Payments
          </button>

          {/* SUPPORT */}

          <button
            className="tenant-nav-item"
            onClick={() => navigate("/tenant/support")}
          >
            <span>⚒</span>
            Support
          </button>

          {/* PROFILE */}

          <button
            className="tenant-nav-item"
            onClick={() =>
              document
                .getElementById("tenant-profile")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            <span>◉</span>
            My Profile
          </button>

        </nav>

        <div className="tenant-sidebar-bottom">

          <div className="tenant-user-mini">

            <div className="tenant-avatar">
              {profile.name?.charAt(0)?.toUpperCase() || "T"}
            </div>

            <div>
              <strong>{profile.name}</strong>
              <span>Tenant</span>
            </div>

          </div>

          <button
            className="tenant-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* ===================================================== */}
      {/* MAIN */}
      {/* ===================================================== */}

      <main className="tenant-main">

        {/* HEADER */}

        <header className="tenant-header">

          <div>

            <p className="tenant-eyebrow">
              PHOENIX TENANT PORTAL
            </p>

            <h2>
              Welcome back, {profile.name?.split(" ")[0]}.
            </h2>

            <p>
              Manage your shop, lease, invoices and payment history
              from one place.
            </p>

          </div>

          <div className="tenant-header-profile">

            <div className="tenant-header-avatar">
              {profile.name?.charAt(0)?.toUpperCase() || "T"}
            </div>

            <div>
              <strong>{profile.name}</strong>
              <span>
                {profile.company_name || "Tenant"}
              </span>
            </div>

          </div>

        </header>

        {/* ===================================================== */}
        {/* FINANCIAL CARDS */}
        {/* ===================================================== */}

        <section className="tenant-stats">

          <div className="tenant-stat-card">

            <div className="tenant-stat-icon blue">
              ₹
            </div>

            <div>
              <span>Total Invoiced</span>

              <strong>
                {formatCurrency(financial.total_invoiced)}
              </strong>
            </div>

          </div>

          <div className="tenant-stat-card">

            <div className="tenant-stat-icon green">
              ✓
            </div>

            <div>
              <span>Total Paid</span>

              <strong>
                {formatCurrency(financial.total_paid)}
              </strong>
            </div>

          </div>

          <div className="tenant-stat-card">

            <div className="tenant-stat-icon orange">
              !
            </div>

            <div>
              <span>Outstanding</span>

              <strong>
                {formatCurrency(financial.outstanding)}
              </strong>
            </div>

          </div>

          <div className="tenant-stat-card">

            <div className="tenant-stat-icon purple">
              ▣
            </div>

            <div>
              <span>Active Leases</span>

              <strong>
                {overview.active_leases}
              </strong>
            </div>

          </div>

        </section>

        {/* ===================================================== */}
        {/* SHOP + LEASE */}
        {/* ===================================================== */}

        <section className="tenant-two-column">

          {/* MY SHOP */}

          <div
            className="tenant-panel"
            id="tenant-shop"
          >

            <div className="tenant-panel-heading">

              <div>
                <span className="tenant-section-label">
                  PROPERTY
                </span>

                <h3>My Shop</h3>
              </div>

              <span className="tenant-live-badge">
                ACTIVE
              </span>

            </div>

            {primaryShop ? (

              <div className="shop-card-content">

                <div className="shop-visual">
                  <span>PHOENIX</span>

                  <strong>
                    {primaryShop.shop_code}
                  </strong>
                </div>

                <div className="shop-details">

                  <h4>{primaryShop.name}</h4>

                  <div className="detail-row">
                    <span>Shop Code</span>

                    <strong>
                      {primaryShop.shop_code}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Floor</span>

                    <strong>
                      {primaryShop.floor}
                    </strong>
                  </div>

                  <div className="detail-row">
                    <span>Area</span>

                    <strong>
                      {primaryShop.area_sqft?.toLocaleString(
                        "en-IN"
                      )}{" "}
                      sq ft
                    </strong>
                  </div>

                </div>

              </div>

            ) : (

              <div className="empty-state">
                No active shop assignment found.
              </div>

            )}

          </div>

          {/* MY LEASE */}

          <div
            className="tenant-panel"
            id="tenant-lease"
          >

            <div className="tenant-panel-heading">

              <div>
                <span className="tenant-section-label">
                  AGREEMENT
                </span>

                <h3>My Lease</h3>
              </div>

            </div>

            {primaryLease ? (

              <div className="lease-details">

                <div className="lease-number">

                  <span>Lease Number</span>

                  <strong>
                    {primaryLease.lease_number}
                  </strong>

                </div>

                <div className="lease-grid">

                  <div>
                    <span>Status</span>

                    <strong
                      className={`status-badge ${statusClass(
                        primaryLease.status
                      )}`}
                    >
                      {primaryLease.status.replaceAll(
                        "_",
                        " "
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Monthly Rent</span>

                    <strong>
                      {formatCurrency(
                        primaryLease.monthly_rent
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Maintenance</span>

                    <strong>
                      {formatCurrency(
                        primaryLease.maintenance_charge
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Security Deposit</span>

                    <strong>
                      {formatCurrency(
                        primaryLease.security_deposit
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Start Date</span>

                    <strong>
                      {formatDate(
                        primaryLease.start_date
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>End Date</span>

                    <strong>
                      {formatDate(
                        primaryLease.end_date
                      )}
                    </strong>
                  </div>

                </div>

              </div>

            ) : (

              <div className="empty-state">
                No lease information available.
              </div>

            )}

          </div>

        </section>

        {/* ===================================================== */}
        {/* INVOICE SUMMARY */}
        {/* ===================================================== */}

        <section className="tenant-panel invoice-summary-panel">

          <div className="tenant-panel-heading">

            <div>
              <span className="tenant-section-label">
                BILLING
              </span>

              <h3>Invoice Overview</h3>
            </div>

          </div>

          <div className="invoice-summary-grid">

            <div>
              <span>Total</span>

              <strong>
                {invoiceSummary.total}
              </strong>
            </div>

            <div>
              <span>Paid</span>

              <strong className="text-green">
                {invoiceSummary.paid}
              </strong>
            </div>

            <div>
              <span>Pending</span>

              <strong className="text-orange">
                {invoiceSummary.pending}
              </strong>
            </div>

            <div>
              <span>Partially Paid</span>

              <strong>
                {invoiceSummary.partially_paid}
              </strong>
            </div>

            <div>
              <span>Overdue</span>

              <strong className="text-red">
                {invoiceSummary.overdue}
              </strong>
            </div>

          </div>

        </section>

        {/* ===================================================== */}
        {/* INVOICES */}
        {/* ===================================================== */}

        <section
          className="tenant-panel"
          id="tenant-invoices"
        >

          <div className="tenant-panel-heading">

            <div>
              <span className="tenant-section-label">
                FINANCIAL RECORDS
              </span>

              <h3>My Invoices</h3>
            </div>

            <span className="record-count">
              {data.invoices.length} records
            </span>

          </div>

          <div className="tenant-table-wrapper">

            <table className="tenant-table">

              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Billing Month</th>
                  <th>Shop</th>
                  <th>Due Date</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {data.invoices.length > 0 ? (

                  data.invoices.map((invoice) => (

                    <tr key={invoice.invoice_id}>

                      <td>
                        <strong>
                          {invoice.invoice_number}
                        </strong>
                      </td>

                      <td>
                        {formatMonth(
                          invoice.billing_month
                        )}
                      </td>

                      <td>

                        <div className="table-shop">

                          <strong>
                            {invoice.shop.name}
                          </strong>

                          <span>
                            {invoice.shop.shop_code}
                          </span>

                        </div>

                      </td>

                      <td>
                        {formatDate(invoice.due_date)}
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(
                            invoice.total_amount
                          )}
                        </strong>
                      </td>

                      <td>

                        <span
                          className={`status-badge ${statusClass(
                            invoice.status
                          )}`}
                        >
                          {invoice.status.replaceAll(
                            "_",
                            " "
                          )}
                        </span>

                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>

                    <td
                      colSpan="6"
                      className="table-empty"
                    >
                      No invoices found.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ===================================================== */}
        {/* PAYMENT HISTORY */}
        {/* ===================================================== */}

        <section
          className="tenant-panel"
          id="tenant-payments"
        >

          <div className="tenant-panel-heading">

            <div>
              <span className="tenant-section-label">
                TRANSACTIONS
              </span>

              <h3>Payment History</h3>
            </div>

            <span className="record-count">
              {data.payments.length} transactions
            </span>

          </div>

          <div className="tenant-table-wrapper">

            <table className="tenant-table">

              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {data.payments.length > 0 ? (

                  data.payments.map((payment) => (

                    <tr key={payment.payment_id}>

                      <td>
                        <strong>
                          {payment.invoice_number}
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
                        <code>
                          {payment.transaction_reference ||
                            "—"}
                        </code>
                      </td>

                      <td>
                        <strong>
                          {formatCurrency(payment.amount)}
                        </strong>
                      </td>

                      <td>

                        <span
                          className={`status-badge ${statusClass(
                            payment.status
                          )}`}
                        >
                          {payment.status}
                        </span>

                      </td>

                    </tr>

                  ))

                ) : (

                  <tr>

                    <td
                      colSpan="6"
                      className="table-empty"
                    >
                      No payment history found.
                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* ===================================================== */}
        {/* PROFILE */}
        {/* ===================================================== */}

        <section
          className="tenant-panel"
          id="tenant-profile"
        >

          <div className="tenant-panel-heading">

            <div>
              <span className="tenant-section-label">
                ACCOUNT
              </span>

              <h3>My Profile</h3>
            </div>

          </div>

          <div className="profile-grid">

            <div className="profile-field">
              <span>Name</span>

              <strong>
                {profile.name || "—"}
              </strong>
            </div>

            <div className="profile-field">
              <span>Email</span>

              <strong>
                {profile.email || "—"}
              </strong>
            </div>

            <div className="profile-field">
              <span>Phone</span>

              <strong>
                {profile.phone || "—"}
              </strong>
            </div>

            <div className="profile-field">
              <span>Company</span>

              <strong>
                {profile.company_name || "—"}
              </strong>
            </div>

            <div className="profile-field">
              <span>GST Number</span>

              <strong>
                {profile.gst_number || "—"}
              </strong>
            </div>

            <div className="profile-field">
              <span>Account Type</span>

              <strong>
                Tenant
              </strong>
            </div>

          </div>

        </section>

        {/* ===================================================== */}
        {/* FOOTER */}
        {/* ===================================================== */}

        <footer className="tenant-footer">

          <span>
            © 2026 PHOENIX Mall Management
          </span>

          <span>
            Tenant Portal
          </span>

        </footer>

      </main>

    </div>
  );
}

export default TenantDashboard;