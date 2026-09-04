import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerSales.css";

const API_URL = "http://127.0.0.1:8001";

function ManagerSales() {
  const navigate = useNavigate();

  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");

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

    if (user.role !== "ADMIN" && user.role !== "MANAGER") {
      navigate("/login");
      return;
    }

    fetchSales(token);
  }, [navigate]);

  const fetchSales = async (token) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/manager/sales/`,
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
          data.detail || "Unable to load sales data."
        );
      }

      setSalesData(data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the PHOENIX server."
      );
    } finally {
      setLoading(false);
    }
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

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatMethod = (method) => {
    if (!method) {
      return "—";
    }

    return method
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const filteredSales = useMemo(() => {
    if (!salesData?.recent_sales) {
      return [];
    }

    const searchValue = search.trim().toLowerCase();

    return salesData.recent_sales.filter((sale) => {
      const matchesSearch =
        !searchValue ||
        sale.invoice_number
          ?.toLowerCase()
          .includes(searchValue) ||
        sale.shop_code
          ?.toLowerCase()
          .includes(searchValue) ||
        sale.shop_name
          ?.toLowerCase()
          .includes(searchValue) ||
        sale.tenant_name
          ?.toLowerCase()
          .includes(searchValue) ||
        sale.transaction_reference
          ?.toLowerCase()
          .includes(searchValue);

      const matchesMethod =
        methodFilter === "ALL" ||
        sale.payment_method === methodFilter;

      return matchesSearch && matchesMethod;
    });
  }, [salesData, search, methodFilter]);

  const paymentMethods = salesData?.payment_methods || [];

  const maxPaymentAmount = Math.max(
    ...paymentMethods.map(
      (item) => Number(item.amount) || 0
    ),
    1
  );

  if (loading) {
    return (
      <div className="manager-loading">
        <div className="manager-loader"></div>

        <p>
          Loading PHOENIX sales...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manager-error-page">

        <div className="manager-error-card">

          <div className="error-icon">
            !
          </div>

          <h2>
            Unable to load sales
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

  if (!salesData) {
    return null;
  }

  const {
    sales,
    billing,
  } = salesData;

  const user =
    salesData.user ||
    JSON.parse(
      localStorage.getItem("phoenix_user") || "{}"
    );

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

          {/* SALES */}

          <button
            className="manager-nav-item active"
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

        {/* SIDEBAR BOTTOM */}

        <div className="manager-sidebar-bottom">

          <div className="manager-user">

            <div className="manager-avatar">

              {user.name
                ? user.name
                    .charAt(0)
                    .toUpperCase()
                : "U"}

            </div>

            <div className="manager-user-info">

              <strong>
                {user.name || "Manager"}
              </strong>

              <span>
                {user.role || "MANAGER"}
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

        {/* TOP BAR */}

        <header className="manager-topbar">

          <div>

            <p className="manager-breadcrumb">
              PHOENIX / MANAGEMENT
            </p>

            <h1>
              Sales
            </h1>

          </div>

          <div className="manager-topbar-right">

            <div className="manager-date">

              <span className="date-dot"></span>

              SYSTEM ONLINE

            </div>

            <div className="topbar-avatar">

              {user.name
                ? user.name
                    .charAt(0)
                    .toUpperCase()
                : "U"}

            </div>

          </div>

        </header>

        {/* =========================
            INTRO
        ========================= */}

        <section className="sales-intro">

          <div>

            <p className="eyebrow">
              REVENUE & TRANSACTIONS
            </p>

            <h2>
              Sales
            </h2>

            <p className="sales-description">
              Track successful payment
              collections, transaction
              activity and outstanding
              billing across PHOENIX.
            </p>

          </div>

          <div className="sales-mark">
            ₹<span>.</span>
          </div>

        </section>

        {/* =========================
            PRIMARY STATS
        ========================= */}

        <section className="sales-stats-grid">

          {/* TOTAL SALES */}

          <div className="sales-stat-card">

            <div className="sales-stat-top">

              <span>
                TOTAL SALES
              </span>

              <span className="sales-stat-symbol">
                ₹
              </span>

            </div>

            <strong>
              {formatCurrency(
                sales.total_sales
              )}
            </strong>

            <p>
              Successful payments collected
            </p>

          </div>

          {/* TRANSACTIONS */}

          <div className="sales-stat-card">

            <div className="sales-stat-top">

              <span>
                TRANSACTIONS
              </span>

              <span className="sales-stat-symbol">
                ⌁
              </span>

            </div>

            <strong>
              {sales.successful_transactions}
            </strong>

            <p>
              Successful transactions
            </p>

          </div>

          {/* AVERAGE */}

          <div className="sales-stat-card">

            <div className="sales-stat-top">

              <span>
                AVG. TRANSACTION
              </span>

              <span className="sales-stat-symbol">
                ↗
              </span>

            </div>

            <strong>
              {formatCurrency(
                sales.average_transaction
              )}
            </strong>

            <p>
              Average successful payment
            </p>

          </div>

          {/* OUTSTANDING */}

          <div className="sales-stat-card">

            <div className="sales-stat-top">

              <span>
                OUTSTANDING
              </span>

              <span className="sales-stat-symbol">
                !
              </span>

            </div>

            <strong>
              {formatCurrency(
                billing.outstanding
              )}
            </strong>

            <p>
              Remaining invoice value
            </p>

          </div>

        </section>

        {/* =========================
            PAYMENT + BILLING
        ========================= */}

        <section className="sales-dashboard-grid">

          {/* PAYMENT METHODS */}

          <div className="sales-card">

            <div className="sales-card-header">

              <div>

                <p className="sales-card-eyebrow">
                  COLLECTION CHANNELS
                </p>

                <h3>
                  Payment Methods
                </h3>

              </div>

              <span className="sales-card-icon">
                ₹
              </span>

            </div>

            <div className="payment-method-list">

              {paymentMethods.length === 0 ? (

                <div className="sales-empty">
                  No payment data available.
                </div>

              ) : (

                paymentMethods.map((item) => {

                  const percentage =
                    sales.total_sales
                      ? (item.amount /
                          sales.total_sales) *
                        100
                      : 0;

                  const barWidth =
                    (item.amount /
                      maxPaymentAmount) *
                    100;

                  return (
                    <div
                      className="payment-method-row"
                      key={item.method}
                    >

                      <div className="payment-method-info">

                        <div>

                          <strong>
                            {formatMethod(
                              item.method
                            )}
                          </strong>

                          <span>
                            {item.transactions}{" "}
                            transaction
                            {item.transactions !== 1
                              ? "s"
                              : ""}
                          </span>

                        </div>

                        <strong>
                          {formatCurrency(
                            item.amount
                          )}
                        </strong>

                      </div>

                      <div className="payment-progress">

                        <div
                          style={{
                            width: `${barWidth}%`,
                          }}
                        ></div>

                      </div>

                      <div className="payment-percentage">

                        {percentage.toFixed(1)}
                        %

                      </div>

                    </div>
                  );
                })
              )}

            </div>

          </div>

          {/* COLLECTION SUMMARY */}

          <div className="sales-card billing-summary-card">

            <div className="sales-card-header">

              <div>

                <p className="sales-card-eyebrow">
                  BILLING POSITION
                </p>

                <h3>
                  Collection Summary
                </h3>

              </div>

            </div>

            <div className="sales-summary-list">

              <div className="sales-summary-row">

                <span>
                  Total invoiced
                </span>

                <strong>
                  {formatCurrency(
                    billing.total_invoiced
                  )}
                </strong>

              </div>

              <div className="sales-summary-row">

                <span>
                  Total collected
                </span>

                <strong className="sales-collected">
                  {formatCurrency(
                    billing.total_paid
                  )}
                </strong>

              </div>

              <div className="sales-summary-divider"></div>

              <div className="sales-summary-row outstanding-row">

                <span>
                  Outstanding
                </span>

                <strong>
                  {formatCurrency(
                    billing.outstanding
                  )}
                </strong>

              </div>

            </div>

            <div className="sales-collection-bar">

              <div
                style={{
                  width: `${
                    billing.total_invoiced
                      ? Math.min(
                          100,
                          (billing.total_paid /
                            billing.total_invoiced) *
                            100
                        )
                      : 0
                  }%`,
                }}
              ></div>

            </div>

            <div className="sales-collection-footer">

              <span>
                {billing.total_invoiced
                  ? Math.round(
                      (billing.total_paid /
                        billing.total_invoiced) *
                        100
                    )
                  : 0}
                % collected
              </span>

              <span>
                {formatCurrency(
                  billing.outstanding
                )}{" "}
                remaining
              </span>

            </div>

          </div>

        </section>

        {/* =========================
            RECENT SALES
        ========================= */}

        <section className="sales-transactions-section">

          <div className="sales-section-header">

            <div>

              <p className="sales-card-eyebrow">
                TRANSACTION ACTIVITY
              </p>

              <h3>
                Recent Sales
              </h3>

            </div>

            <span className="sales-count">

              {filteredSales.length} RECORD
              {filteredSales.length !== 1
                ? "S"
                : ""}

            </span>

          </div>

          {/* FILTERS */}

          <div className="sales-filters">

            <div className="sales-search">

              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search invoices, shops, tenants or transactions..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />

            </div>

            <select
              value={methodFilter}
              onChange={(event) =>
                setMethodFilter(event.target.value)
              }
            >

              <option value="ALL">
                All Payment Methods
              </option>

              <option value="UPI">
                UPI
              </option>

              <option value="CARD">
                Card
              </option>

              <option value="BANK_TRANSFER">
                Bank Transfer
              </option>

              <option value="CASH">
                Cash
              </option>

            </select>

          </div>

          {/* TABLE */}

          <div className="sales-table-card">

            <div className="sales-table-header">

              <span>
                TRANSACTION
              </span>

              <span>
                SHOP / TENANT
              </span>

              <span>
                AMOUNT
              </span>

              <span>
                METHOD
              </span>

              <span>
                DATE
              </span>

            </div>

            {filteredSales.length === 0 ? (

              <div className="sales-empty-table">

                <strong>
                  No sales found
                </strong>

                <span>
                  Try changing your search
                  or payment-method filter.
                </span>

              </div>

            ) : (

              filteredSales.map((sale) => (

                <div
                  className="sales-table-row"
                  key={sale.payment_id}
                >

                  <div className="transaction-cell">

                    <strong>
                      {sale.invoice_number}
                    </strong>

                    <span>
                      {sale.transaction_reference ||
                        `Payment #${sale.payment_id}`}
                    </span>

                  </div>

                  <div className="shop-tenant-cell">

                    <strong>
                      {sale.shop_name}
                    </strong>

                    <span>
                      {sale.shop_code} ·{" "}
                      {sale.tenant_name}
                    </span>

                  </div>

                  <div className="amount-cell">

                    {formatCurrency(
                      sale.amount
                    )}

                  </div>

                  <div>

                    <span className="method-badge">

                      {formatMethod(
                        sale.payment_method
                      )}

                    </span>

                  </div>

                  <div className="date-cell">

                    {formatDate(
                      sale.payment_date
                    )}

                  </div>

                </div>

              ))
            )}

          </div>

        </section>

        {/* =========================
            TRANSACTION HEALTH
        ========================= */}

        <section className="sales-health">

          <div>

            <p className="sales-card-eyebrow">
              TRANSACTION HEALTH
            </p>

            <h3>
              Payment Activity
            </h3>

          </div>

          <div className="sales-health-stats">

            <div>

              <strong>
                {sales.successful_transactions}
              </strong>

              <span>
                Successful
              </span>

            </div>

            <div>

              <strong>
                {sales.failed_transactions}
              </strong>

              <span>
                Failed
              </span>

            </div>

            <div>

              <strong>
                {sales.refunded_transactions}
              </strong>

              <span>
                Refunded
              </span>

            </div>

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

export default ManagerSales;