import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerDashboard.css";

const API_URL = "http://127.0.0.1:8001";
const REFRESH_INTERVAL = 30000;

function ManagerDashboard() {
  const navigate = useNavigate();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboard = useCallback(
    async (token, isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await fetch(
          `${API_URL}/manager/dashboard`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem("phoenix_token");
          localStorage.removeItem("phoenix_user");
          navigate("/login");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail ||
              "Unable to load dashboard."
          );
        }

        setDashboard(data);
        setLastUpdated(new Date());
      } catch (err) {
        setError(
          err.message ||
            "Unable to connect to the PHOENIX server."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    const token = localStorage.getItem("phoenix_token");
    const storedUser = localStorage.getItem("phoenix_user");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    let user;

    try {
      user = JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("phoenix_token");
      localStorage.removeItem("phoenix_user");
      navigate("/login");
      return;
    }

    if (
      user.role !== "ADMIN" &&
      user.role !== "MANAGER"
    ) {
      navigate("/login");
      return;
    }

    // Initial load
    fetchDashboard(token);

    // Automatic refresh every 30 seconds
    const refreshTimer = setInterval(() => {
      const currentToken =
        localStorage.getItem("phoenix_token");

      if (currentToken) {
        fetchDashboard(currentToken);
      }
    }, REFRESH_INTERVAL);

    // Stop polling when leaving the page
    return () => {
      clearInterval(refreshTimer);
    };
  }, [navigate, fetchDashboard]);

  const handleManualRefresh = () => {
    const token =
      localStorage.getItem("phoenix_token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetchDashboard(token, true);
  };

  const handleLogout = () => {
    localStorage.removeItem("phoenix_token");
    localStorage.removeItem("phoenix_user");
    navigate("/login");
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) {
      return "Updating...";
    }

    return lastUpdated.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );
  };

  if (loading) {
    return (
      <div className="manager-loading">
        <div className="manager-loader"></div>

        <p>
          Loading PHOENIX dashboard...
        </p>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="manager-error-page">

        <div className="manager-error-card">

          <div className="error-icon">
            !
          </div>

          <h2>
            Unable to load dashboard
          </h2>

          <p>
            {error}
          </p>

          <button
            onClick={() =>
              window.location.reload()
            }
          >
            TRY AGAIN
          </button>

        </div>

      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const {
    shops,
    tenants,
    leases,
    invoices,
    billing,
    restaurants,
    payments,
  } = dashboard;

  const retailSales =
    dashboard.retail_sales || {
      total_transactions: 0,
      total_revenue: 0,
      total_items: 0,
      average_sale: 0,
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

          {/* DASHBOARD */}

          <button
            className="manager-nav-item active"
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
            className="manager-nav-item"
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

          {/* LEASES */}

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/leases")
            }
          >
            <span className="nav-icon">
              ◫
            </span>

            <span>
              Leases
            </span>
          </button>

          {/* INVOICES */}

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/invoices")
            }
          >
            <span className="nav-icon">
              ▤
            </span>

            <span>
              Invoices
            </span>
          </button>

          {/* PAYMENTS */}

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/payments")
            }
          >
            <span className="nav-icon">
              ₹
            </span>

            <span>
              Payments
            </span>
          </button>

          {/* RESTAURANTS */}

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/restaurants")
            }
          >
            <span className="nav-icon">
              ◉
            </span>

            <span>
              Restaurants
            </span>
          </button>

          {/* OFFERS */}

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/offers")
            }
          >
            <span className="nav-icon">
              %
            </span>

            <span>
              Offers
            </span>
          </button>

          {/* REVIEWS */}

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/reviews")
            }
          >
            <span className="nav-icon">
              ★
            </span>

            <span>
              Reviews
            </span>
          </button>

          {/* MALL COLLECTIONS */}

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/sales")
            }
          >
            <span className="nav-icon">
              ⌁
            </span>

            <span>
              Sales
            </span>
          </button>

          {/* RETAIL SALES */}

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/retail-sales")
            }
          >
            <span className="nav-icon">
              🛍️
            </span>

            <span>
              Retail Sales
            </span>
          </button>

          {/* SUPPORT */}

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/support")
            }
          >
            <span className="nav-icon">
              ⚒
            </span>

            <span>
              Support
            </span>
          </button>

          {/* REPORTS */}

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/reports")
            }
          >
            <span className="nav-icon">
              ▥
            </span>

            <span>
              Reports
            </span>
          </button>

        </nav>

        {/* =========================
            SIDEBAR USER
        ========================= */}

        <div className="manager-sidebar-bottom">

          <div className="manager-user">

            <div className="manager-avatar">

              {dashboard.user?.name
                ? dashboard.user.name
                    .charAt(0)
                    .toUpperCase()
                : "U"}

            </div>

            <div className="manager-user-info">

              <strong>
                {dashboard.user?.name ||
                  "Manager"}
              </strong>

              <span>
                {dashboard.user?.role ||
                  "MANAGER"}
              </span>

            </div>

          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            <span>
              ↪
            </span>

            LOG OUT
          </button>

        </div>

      </aside>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <main className="manager-main">

        {/* =========================
            TOP BAR
        ========================= */}

        <header className="manager-topbar">

          <div>

            <p className="manager-breadcrumb">
              PHOENIX / MANAGEMENT
            </p>

            <h1>
              Dashboard
            </h1>

          </div>

          <div className="manager-topbar-right">

            {/* LIVE STATUS */}

            <div className="manager-date">

              <span className="date-dot"></span>

              SYSTEM ONLINE

            </div>

            {/* LAST UPDATED */}

            <div className="dashboard-last-updated">
              Updated {formatLastUpdated()}
            </div>

            {/* REFRESH BUTTON */}

            <button
              className={`dashboard-refresh-button ${
                refreshing ? "refreshing" : ""
              }`}
              onClick={handleManualRefresh}
              disabled={refreshing}
              title="Refresh dashboard"
            >
              <span>
                ↻
              </span>

              {refreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>

            {/* AVATAR */}

            <div className="topbar-avatar">

              {dashboard.user?.name
                ? dashboard.user.name
                    .charAt(0)
                    .toUpperCase()
                : "U"}

            </div>

          </div>

        </header>

        {/* BACKGROUND REFRESH ERROR */}

        {error && dashboard && (
          <div className="dashboard-refresh-warning">
            Unable to refresh the latest data.
            Showing the last successfully loaded
            dashboard.
          </div>
        )}

        {/* =========================
            WELCOME
        ========================= */}

        <section className="manager-welcome">

          <div>

            <p className="eyebrow">

              GOOD DAY,{" "}

              {dashboard.user?.name
                ? dashboard.user.name
                    .split(" ")[0]
                    .toUpperCase()
                : "MANAGER"}

            </p>

            <h2>

              Here's what's happening

              <br />

              <em>
                across PHOENIX.
              </em>

            </h2>

            <p className="welcome-description">

              Monitor mall operations,
              occupancy, billing, retail
              sales and tenant activity
              from one place.

            </p>

          </div>

          <div className="welcome-mark">

            P<span>.</span>

          </div>

        </section>

        {/* =========================
            PRIMARY STATS
        ========================= */}

        <section className="stats-grid">

          {/* TOTAL SHOPS */}

          <div className="stat-card">

            <div className="stat-top">

              <span className="stat-label">
                TOTAL SHOPS
              </span>

              <span className="stat-symbol">
                ▦
              </span>

            </div>

            <div className="stat-value">
              {shops.total}
            </div>

            <div className="stat-footer">

              <span className="stat-positive">
                {shops.occupied} occupied
              </span>

              <span>
                {shops.vacant} vacant
              </span>

            </div>

          </div>

          {/* OCCUPANCY */}

          <div className="stat-card">

            <div className="stat-top">

              <span className="stat-label">
                OCCUPANCY
              </span>

              <span className="stat-symbol">
                ◉
              </span>

            </div>

            <div className="stat-value">
              {shops.occupancy_percentage}%
            </div>

            <div className="occupancy-bar">

              <div
                style={{
                  width: `${shops.occupancy_percentage}%`,
                }}
              ></div>

            </div>

            <div className="stat-footer">

              <span>
                {shops.occupied} /{" "}
                {shops.total} spaces
              </span>

            </div>

          </div>

          {/* TENANTS */}

          <div className="stat-card">

            <div className="stat-top">

              <span className="stat-label">
                TENANTS
              </span>

              <span className="stat-symbol">
                ♙
              </span>

            </div>

            <div className="stat-value">
              {tenants.total}
            </div>

            <div className="stat-footer">

              <span>
                Registered tenants
              </span>

            </div>

          </div>

          {/* ACTIVE LEASES */}

          <div className="stat-card">

            <div className="stat-top">

              <span className="stat-label">
                ACTIVE LEASES
              </span>

              <span className="stat-symbol">
                ◫
              </span>

            </div>

            <div className="stat-value">
              {leases.active}
            </div>

            <div className="stat-footer">

              <span>
                Active / expiring soon
              </span>

            </div>

          </div>

        </section>

        {/* =========================
            BILLING + INVOICES
        ========================= */}

        <section className="dashboard-grid">

          {/* BILLING */}

          <div className="dashboard-card billing-card">

            <div className="card-header">

              <div>

                <p className="card-eyebrow">
                  FINANCIAL OVERVIEW
                </p>

                <h3>
                  Billing & Collection
                </h3>

              </div>

              <span className="card-menu">
                •••
              </span>

            </div>

            <div className="billing-main">

              <div>

                <span className="billing-label">
                  TOTAL BILLED
                </span>

                <strong>
                  {formatCurrency(
                    billing.total_billed
                  )}
                </strong>

              </div>

              <div>

                <span className="billing-label">
                  COLLECTED
                </span>

                <strong className="collected">
                  {formatCurrency(
                    billing.total_collected
                  )}
                </strong>

              </div>

            </div>

            <div className="collection-bar">

              <div
                style={{
                  width: `${
                    billing.total_billed
                      ? Math.min(
                          100,
                          (billing.total_collected /
                            billing.total_billed) *
                            100
                        )
                      : 0
                  }%`,
                }}
              ></div>

            </div>

            <div className="collection-footer">

              <span>

                {billing.total_billed
                  ? Math.round(
                      (billing.total_collected /
                        billing.total_billed) *
                        100
                    )
                  : 0}

                % collected

              </span>

              <span>

                {formatCurrency(
                  Math.max(
                    0,
                    billing.total_billed -
                      billing.total_collected
                  )
                )}{" "}

                outstanding

              </span>

            </div>

          </div>

          {/* INVOICES */}

          <div className="dashboard-card invoice-card">

            <div className="card-header">

              <div>

                <p className="card-eyebrow">
                  BILLING
                </p>

                <h3>
                  Invoice Status
                </h3>

              </div>

              <span className="invoice-total">
                {invoices.total} TOTAL
              </span>

            </div>

            <div className="invoice-list">

              <div className="invoice-row">

                <div className="invoice-name">

                  <span className="invoice-dot pending"></span>

                  Pending

                </div>

                <strong>
                  {invoices.pending}
                </strong>

              </div>

              <div className="invoice-row">

                <div className="invoice-name">

                  <span className="invoice-dot partial"></span>

                  Partially Paid

                </div>

                <strong>
                  {invoices.partially_paid}
                </strong>

              </div>

              <div className="invoice-row">

                <div className="invoice-name">

                  <span className="invoice-dot paid"></span>

                  Paid

                </div>

                <strong>
                  {invoices.paid}
                </strong>

              </div>

              <div className="invoice-row">

                <div className="invoice-name">

                  <span className="invoice-dot overdue"></span>

                  Overdue

                </div>

                <strong>
                  {invoices.overdue}
                </strong>

              </div>

            </div>

          </div>

        </section>

        {/* =========================
            RETAIL SALES OVERVIEW
        ========================= */}

        <section className="dashboard-card retail-dashboard-card">

          <div className="card-header">

            <div>

              <p className="card-eyebrow">
                TENANT RETAIL OPERATIONS
              </p>

              <h3>
                Retail Sales Overview
              </h3>

            </div>

            <button
              className="dashboard-view-button"
              onClick={() =>
                navigate("/manager/retail-sales")
              }
            >
              VIEW RETAIL SALES →
            </button>

          </div>

          <div className="retail-dashboard-content">

            {/* TOTAL REVENUE */}

            <div className="retail-stat">

              <div className="retail-stat-icon">
                ₹
              </div>

              <div>

                <span className="retail-stat-label">
                  TOTAL RETAIL REVENUE
                </span>

                <strong>
                  {formatCurrency(
                    retailSales.total_revenue
                  )}
                </strong>

                <p>
                  Revenue generated through
                  tenant customer purchases.
                </p>

              </div>

            </div>

            {/* TRANSACTIONS */}

            <div className="retail-stat">

              <div className="retail-stat-icon">
                #
              </div>

              <div>

                <span className="retail-stat-label">
                  TRANSACTIONS
                </span>

                <strong>
                  {retailSales.total_transactions}
                </strong>

                <p>
                  Customer purchases recorded
                  across tenant shops.
                </p>

              </div>

            </div>

            {/* ITEMS SOLD */}

            <div className="retail-stat">

              <div className="retail-stat-icon">
                ◫
              </div>

              <div>

                <span className="retail-stat-label">
                  ITEMS SOLD
                </span>

                <strong>
                  {retailSales.total_items}
                </strong>

                <p>
                  Total quantity of products
                  sold by tenants.
                </p>

              </div>

            </div>

            {/* AVERAGE SALE */}

            <div className="retail-stat">

              <div className="retail-stat-icon">
                ↗
              </div>

              <div>

                <span className="retail-stat-label">
                  AVERAGE SALE
                </span>

                <strong>
                  {formatCurrency(
                    retailSales.average_sale
                  )}
                </strong>

                <p>
                  Average customer purchase
                  value.
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =========================
            OPERATIONS
        ========================= */}

        <section className="dashboard-grid three-column">

          {/* SHOP STATUS */}

          <div className="dashboard-card operational-card">

            <div className="card-header">

              <div>

                <p className="card-eyebrow">
                  SHOP OPERATIONS
                </p>

                <h3>
                  Space Status
                </h3>

              </div>

            </div>

            <div className="space-status">

              <div className="space-number">

                <strong>
                  {shops.occupied}
                </strong>

                <span>
                  Occupied
                </span>

              </div>

              <div className="space-number">

                <strong>
                  {shops.vacant}
                </strong>

                <span>
                  Vacant
                </span>

              </div>

              <div className="space-number">

                <strong>
                  {shops.maintenance}
                </strong>

                <span>
                  Maintenance
                </span>

              </div>

            </div>

          </div>

          {/* RESTAURANTS */}

          <div className="dashboard-card operational-card">

            <div className="card-header">

              <div>

                <p className="card-eyebrow">
                  DINING
                </p>

                <h3>
                  Restaurants
                </h3>

              </div>

              <span className="big-card-icon">
                ◉
              </span>

            </div>

            <div className="big-stat">
              {restaurants.total}
            </div>

            <p className="big-stat-description">

              Restaurants currently registered
              across PHOENIX.

            </p>

          </div>

          {/* PAYMENTS */}

          <div className="dashboard-card operational-card">

            <div className="card-header">

              <div>

                <p className="card-eyebrow">
                  TRANSACTIONS
                </p>

                <h3>
                  Payments
                </h3>

              </div>

              <span className="big-card-icon">
                ₹
              </span>

            </div>

            <div className="big-stat">
              {payments.total}
            </div>

            <p className="big-stat-description">

              Mall payment transactions
              recorded in the system.

            </p>

          </div>

        </section>

        {/* =========================
            QUICK ACTIONS
        ========================= */}

        <section className="quick-section">

          <div className="quick-header">

            <div>

              <p className="card-eyebrow">
                WORKSPACE
              </p>

              <h3>
                Quick access
              </h3>

            </div>

          </div>

          <div className="quick-actions">

            {/* ADD SHOP */}

            <button
              onClick={() =>
                navigate("/manager/shops")
              }
            >
              <span>
                +
              </span>

              Add Shop
            </button>

            {/* ADD TENANT */}

            <button
              onClick={() =>
                navigate("/manager/tenants")
              }
            >
              <span>
                +
              </span>

              Add Tenant
            </button>

            {/* CREATE INVOICE */}

            <button
              onClick={() =>
                navigate("/manager/invoices")
              }
            >
              <span>
                +
              </span>

              Create Invoice
            </button>

            {/* RECORD PAYMENT */}

            <button
              onClick={() =>
                navigate("/manager/payments")
              }
            >
              <span>
                ₹
              </span>

              Record Payment
            </button>

            {/* RETAIL SALES */}

            <button
              onClick={() =>
                navigate("/manager/retail-sales")
              }
            >
              <span>
                🛍️
              </span>

              Retail Sales
            </button>

            {/* VIEW REPORTS */}

            <button
              onClick={() =>
                navigate("/manager/reports")
              }
            >
              <span>
                ↗
              </span>

              View Reports
            </button>

          </div>

        </section>

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

    </div>
  );
}

export default ManagerDashboard;