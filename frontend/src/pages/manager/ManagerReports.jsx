import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerReports.css";

const API_URL = "http://127.0.0.1:8001";

function ManagerReports() {
  const navigate = useNavigate();

  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [shopSearch, setShopSearch] = useState("");
  const [retailShopSearch, setRetailShopSearch] = useState("");

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

    fetchReports(token);
  }, [navigate]);

  const fetchReports = async (token) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/manager/reports/`,
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
          data.detail || "Unable to load reports."
        );
      }

      setReportData(data);
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

  const formatNumber = (value) => {
    return new Intl.NumberFormat("en-IN").format(
      value || 0
    );
  };

  const formatMethod = (method) => {
    if (!method) return "—";

    const methodNames = {
      UPI: "UPI",
      CARD: "Card",
      CASH: "Cash",
      BANK_TRANSFER: "Bank Transfer",
    };

    return (
      methodNames[method] ||
      method
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
    );
  };

  const formatStatus = (status) => {
    if (!status) return "—";

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  const formatMonth = (month) => {
    if (!month) return "—";

    const parts = month.split("-");

    if (parts.length !== 2) {
      return month;
    }

    const date = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      1
    );

    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  };

  // =========================================================
  // EXISTING SHOP SEARCH
  // =========================================================

  const filteredShops = useMemo(() => {
    if (!reportData?.shop_performance) {
      return [];
    }

    const searchValue = shopSearch
      .trim()
      .toLowerCase();

    return reportData.shop_performance.filter(
      (shop) => {
        return (
          !searchValue ||
          shop.shop_name
            ?.toLowerCase()
            .includes(searchValue) ||
          shop.shop_code
            ?.toLowerCase()
            .includes(searchValue) ||
          shop.floor
            ?.toLowerCase()
            .includes(searchValue)
        );
      }
    );
  }, [reportData, shopSearch]);

  // =========================================================
  // RETAIL SHOP SEARCH
  // =========================================================

  const filteredRetailShops = useMemo(() => {
    if (!reportData?.retail_sales?.shop_performance) {
      return [];
    }

    const searchValue = retailShopSearch
      .trim()
      .toLowerCase();

    return reportData.retail_sales.shop_performance.filter(
      (shop) => {
        return (
          !searchValue ||
          shop.shop_name
            ?.toLowerCase()
            .includes(searchValue) ||
          shop.shop_code
            ?.toLowerCase()
            .includes(searchValue) ||
          shop.floor
            ?.toLowerCase()
            .includes(searchValue) ||
          shop.tenant_name
            ?.toLowerCase()
            .includes(searchValue)
        );
      }
    );
  }, [reportData, retailShopSearch]);

  if (loading) {
    return (
      <div className="manager-loading">
        <div className="manager-loader"></div>

        <p>
          Loading PHOENIX reports...
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
            Unable to load reports
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

  if (!reportData) {
    return null;
  }

  const {
    overview,
    financial,
    transactions,
    invoices,
    invoice_status,
    payment_methods,
    monthly_collections,
    shop_performance,
    lease_status,
    user,
  } = reportData;

  // =========================================================
  // RETAIL DATA
  // =========================================================

  const retailSales = reportData.retail_sales || {
    total_transactions: 0,
    total_revenue: 0,
    total_items: 0,
    average_sale: 0,
    payment_methods: [],
    categories: [],
    monthly_sales: [],
    shop_performance: [],
    tenant_performance: [],
  };

  const maxMonthlyCollection = Math.max(
    ...monthly_collections.map(
      (item) => Number(item.amount) || 0
    ),
    1
  );

  const maxShopCollection = Math.max(
    ...shop_performance.map(
      (item) => Number(item.collected) || 0
    ),
    1
  );

  const maxInvoiceCount = Math.max(
    ...invoice_status.map(
      (item) => Number(item.count) || 0
    ),
    1
  );

  const maxLeaseCount = Math.max(
    ...lease_status.map(
      (item) => Number(item.count) || 0
    ),
    1
  );

  const maxRetailMonthlyRevenue = Math.max(
    ...retailSales.monthly_sales.map(
      (item) => Number(item.revenue) || 0
    ),
    1
  );

  const maxRetailCategoryRevenue = Math.max(
    ...retailSales.categories.map(
      (item) => Number(item.revenue) || 0
    ),
    1
  );

  const maxRetailShopRevenue = Math.max(
    ...retailSales.shop_performance.map(
      (item) => Number(item.revenue) || 0
    ),
    1
  );

  const maxRetailTenantRevenue = Math.max(
    ...retailSales.tenant_performance.map(
      (item) => Number(item.revenue) || 0
    ),
    1
  );

  return (
    <div className="manager-app">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

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

          <button className="manager-nav-item active">
            <span className="nav-icon">
              ▥
            </span>

            <span>
              Reports
            </span>
          </button>

        </nav>

        {/* SIDEBAR USER */}

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
            <span>
              ↪
            </span>

            LOG OUT
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="manager-main">

        {/* TOP BAR */}

        <header className="manager-topbar">

          <div>

            <p className="manager-breadcrumb">
              PHOENIX / MANAGEMENT
            </p>

            <h1>
              Reports
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

        {/* =====================================================
            INTRO
        ===================================================== */}

        <section className="reports-intro">

          <div>

            <p className="eyebrow">
              BUSINESS INTELLIGENCE
            </p>

            <h2>
              Reports
            </h2>

            <p className="reports-description">
              Analyze PHOENIX operations,
              collections, occupancy,
              invoices, retail sales and
              tenant activity from one
              reporting center.
            </p>

          </div>

          <div className="reports-mark">
            R<span>.</span>
          </div>

        </section>

        {/* =====================================================
            FINANCIAL STATS
        ===================================================== */}

        <section className="reports-stats-grid">

          <div className="reports-stat-card">

            <div className="reports-stat-top">

              <span>
                TOTAL INVOICED
              </span>

              <span className="reports-stat-symbol">
                ₹
              </span>

            </div>

            <strong>
              {formatCurrency(
                financial.total_invoiced
              )}
            </strong>

            <p>
              Total invoice value
            </p>

          </div>

          <div className="reports-stat-card">

            <div className="reports-stat-top">

              <span>
                TOTAL COLLECTED
              </span>

              <span className="reports-stat-symbol">
                ₹
              </span>

            </div>

            <strong>
              {formatCurrency(
                financial.total_collected
              )}
            </strong>

            <p>
              Successful collections
            </p>

          </div>

          <div className="reports-stat-card">

            <div className="reports-stat-top">

              <span>
                OUTSTANDING
              </span>

              <span className="reports-stat-symbol">
                !
              </span>

            </div>

            <strong>
              {formatCurrency(
                financial.outstanding
              )}
            </strong>

            <p>
              Remaining invoice value
            </p>

          </div>

          <div className="reports-stat-card">

            <div className="reports-stat-top">

              <span>
                COLLECTION RATE
              </span>

              <span className="reports-stat-symbol">
                ↗
              </span>

            </div>

            <strong>
              {financial.collection_percentage}%
            </strong>

            <p>
              Invoice value collected
            </p>

          </div>

        </section>

        {/* =====================================================
            OPERATION OVERVIEW
        ===================================================== */}

        <section className="reports-overview-grid">

          {/* OCCUPANCY */}

          <div className="reports-card">

            <div className="reports-card-header">

              <div>

                <p className="reports-card-eyebrow">
                  PROPERTY
                </p>

                <h3>
                  Occupancy Overview
                </h3>

              </div>

              <span className="reports-card-icon">
                ◉
              </span>

            </div>

            <div className="occupancy-report">

              <div className="occupancy-report-number">
                {overview.occupancy_percentage}%
              </div>

              <div className="occupancy-report-bar">

                <div
                  style={{
                    width: `${overview.occupancy_percentage}%`,
                  }}
                ></div>

              </div>

              <div className="occupancy-report-grid">

                <div>
                  <strong>
                    {overview.total_shops}
                  </strong>

                  <span>
                    Total Shops
                  </span>
                </div>

                <div>
                  <strong>
                    {overview.occupied_shops}
                  </strong>

                  <span>
                    Occupied
                  </span>
                </div>

                <div>
                  <strong>
                    {overview.vacant_shops}
                  </strong>

                  <span>
                    Vacant
                  </span>
                </div>

                <div>
                  <strong>
                    {overview.maintenance_shops}
                  </strong>

                  <span>
                    Maintenance
                  </span>
                </div>

              </div>

            </div>

          </div>

          {/* TRANSACTIONS */}

          <div className="reports-card">

            <div className="reports-card-header">

              <div>

                <p className="reports-card-eyebrow">
                  TRANSACTIONS
                </p>

                <h3>
                  Payment Health
                </h3>

              </div>

              <span className="reports-card-icon">
                ₹
              </span>

            </div>

            <div className="transaction-report-grid">

              <div className="transaction-report-item">

                <strong>
                  {formatNumber(
                    transactions.successful
                  )}
                </strong>

                <span>
                  Successful
                </span>

              </div>

              <div className="transaction-report-item">

                <strong>
                  {formatNumber(
                    transactions.failed
                  )}
                </strong>

                <span>
                  Failed
                </span>

              </div>

              <div className="transaction-report-item">

                <strong>
                  {formatNumber(
                    transactions.refunded
                  )}
                </strong>

                <span>
                  Refunded
                </span>

              </div>

              <div className="transaction-report-item">

                <strong>
                  {formatCurrency(
                    transactions.average_transaction
                  )}
                </strong>

                <span>
                  Avg. Transaction
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            RETAIL SALES EXECUTIVE SUMMARY
        ===================================================== */}

        <section className="reports-card retail-reports-card">

          <div className="reports-card-header">

            <div>

              <p className="reports-card-eyebrow">
                TENANT RETAIL OPERATIONS
              </p>

              <h3>
                Retail Sales Analytics
              </h3>

            </div>

            <button
              className="reports-retail-button"
              onClick={() =>
                navigate("/manager/retail-sales")
              }
            >
              VIEW RETAIL SALES →
            </button>

          </div>

          <div className="retail-report-stats">

            <div className="retail-report-stat">

              <span className="retail-report-stat-icon">
                ₹
              </span>

              <div>

                <span>
                  TOTAL RETAIL REVENUE
                </span>

                <strong>
                  {formatCurrency(
                    retailSales.total_revenue
                  )}
                </strong>

              </div>

            </div>

            <div className="retail-report-stat">

              <span className="retail-report-stat-icon">
                #
              </span>

              <div>

                <span>
                  TRANSACTIONS
                </span>

                <strong>
                  {formatNumber(
                    retailSales.total_transactions
                  )}
                </strong>

              </div>

            </div>

            <div className="retail-report-stat">

              <span className="retail-report-stat-icon">
                ◫
              </span>

              <div>

                <span>
                  ITEMS SOLD
                </span>

                <strong>
                  {formatNumber(
                    retailSales.total_items
                  )}
                </strong>

              </div>

            </div>

            <div className="retail-report-stat">

              <span className="retail-report-stat-icon">
                ↗
              </span>

              <div>

                <span>
                  AVERAGE SALE
                </span>

                <strong>
                  {formatCurrency(
                    retailSales.average_sale
                  )}
                </strong>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            RETAIL MONTHLY SALES
        ===================================================== */}

        <section className="reports-card">

          <div className="reports-card-header">

            <div>

              <p className="reports-card-eyebrow">
                RETAIL PERFORMANCE
              </p>

              <h3>
                Monthly Retail Revenue
              </h3>

            </div>

            <span className="reports-card-icon">
              🛍️
            </span>

          </div>

          {retailSales.monthly_sales.length === 0 ? (

            <div className="reports-empty">
              No retail sales data available.
            </div>

          ) : (

            <div className="monthly-chart">

              {retailSales.monthly_sales.map(
                (item) => {

                  const height =
                    Math.max(
                      5,
                      (Number(item.revenue) /
                        maxRetailMonthlyRevenue) *
                        100
                    );

                  return (
                    <div
                      className="monthly-column"
                      key={item.month}
                    >

                      <div className="monthly-value">
                        {formatCurrency(
                          item.revenue
                        )}
                      </div>

                      <div className="monthly-bar-container">

                        <div
                          className="monthly-bar"
                          style={{
                            height: `${height}%`,
                          }}
                        ></div>

                      </div>

                      <div className="monthly-label">
                        {formatMonth(
                          item.month
                        )}
                      </div>

                      <div className="monthly-transactions">
                        {item.transactions} txn ·{" "}
                        {item.items} items
                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* =====================================================
            RETAIL PAYMENT + CATEGORY
        ===================================================== */}

        <section className="reports-two-column">

          {/* RETAIL PAYMENT METHODS */}

          <div className="reports-card">

            <div className="reports-card-header">

              <div>

                <p className="reports-card-eyebrow">
                  RETAIL COLLECTION CHANNELS
                </p>

                <h3>
                  Retail Payment Methods
                </h3>

              </div>

              <span className="reports-card-icon">
                ₹
              </span>

            </div>

            {retailSales.payment_methods.length === 0 ? (

              <div className="reports-empty">
                No retail payment data available.
              </div>

            ) : (

              <div className="payment-analysis">

                {retailSales.payment_methods.map(
                  (item) => {

                    return (
                      <div
                        className="payment-analysis-item"
                        key={item.method}
                      >

                        <div className="payment-analysis-top">

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
                              item.revenue
                            )}
                          </strong>

                        </div>

                        <div className="payment-analysis-bar">

                          <div
                            style={{
                              width: `${item.percentage}%`,
                            }}
                          ></div>

                        </div>

                        <span className="payment-analysis-percentage">
                          {item.percentage}%
                        </span>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

          {/* RETAIL CATEGORIES */}

          <div className="reports-card">

            <div className="reports-card-header">

              <div>

                <p className="reports-card-eyebrow">
                  PRODUCT PERFORMANCE
                </p>

                <h3>
                  Sales by Category
                </h3>

              </div>

              <span className="reports-card-icon">
                ◫
              </span>

            </div>

            {retailSales.categories.length === 0 ? (

              <div className="reports-empty">
                No retail category data available.
              </div>

            ) : (

              <div className="report-status-list">

                {retailSales.categories.map(
                  (item) => {

                    const width =
                      (Number(item.revenue) /
                        maxRetailCategoryRevenue) *
                      100;

                    return (
                      <div
                        className="report-status-row"
                        key={item.category}
                      >

                        <div className="report-status-info">

                          <span>
                            {item.category}
                          </span>

                          <strong>
                            {formatCurrency(
                              item.revenue
                            )}
                          </strong>

                        </div>

                        <div className="report-status-bar">

                          <div
                            style={{
                              width: `${width}%`,
                            }}
                          ></div>

                        </div>

                        <span className="payment-analysis-percentage">
                          {item.percentage}%
                        </span>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

        </section>

        {/* =====================================================
            MONTHLY MALL COLLECTIONS
        ===================================================== */}

        <section className="reports-card monthly-report-card">

          <div className="reports-card-header">

            <div>

              <p className="reports-card-eyebrow">
                COLLECTION TREND
              </p>

              <h3>
                Monthly Mall Collections
              </h3>

            </div>

            <span className="reports-card-icon">
              ↗
            </span>

          </div>

          {monthly_collections.length === 0 ? (

            <div className="reports-empty">
              No monthly collection data available.
            </div>

          ) : (

            <div className="monthly-chart">

              {monthly_collections.map(
                (item) => {

                  const height =
                    Math.max(
                      5,
                      (item.amount /
                        maxMonthlyCollection) *
                        100
                    );

                  return (
                    <div
                      className="monthly-column"
                      key={item.month}
                    >

                      <div className="monthly-value">
                        {formatCurrency(
                          item.amount
                        )}
                      </div>

                      <div className="monthly-bar-container">

                        <div
                          className="monthly-bar"
                          style={{
                            height: `${height}%`,
                          }}
                        ></div>

                      </div>

                      <div className="monthly-label">
                        {formatMonth(
                          item.month
                        )}
                      </div>

                      <div className="monthly-transactions">
                        {item.transactions} txn
                      </div>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* =====================================================
            INVOICE + LEASE STATUS
        ===================================================== */}

        <section className="reports-two-column">

          {/* INVOICE STATUS */}

          <div className="reports-card">

            <div className="reports-card-header">

              <div>

                <p className="reports-card-eyebrow">
                  BILLING
                </p>

                <h3>
                  Invoice Status
                </h3>

              </div>

              <span className="reports-card-count">
                {invoices.total} TOTAL
              </span>

            </div>

            <div className="report-status-list">

              {invoice_status.map(
                (item) => {

                  const width =
                    (item.count /
                      maxInvoiceCount) *
                    100;

                  return (
                    <div
                      className="report-status-row"
                      key={item.status}
                    >

                      <div className="report-status-info">

                        <span>
                          {formatStatus(
                            item.status
                          )}
                        </span>

                        <strong>
                          {item.count}
                        </strong>

                      </div>

                      <div className="report-status-bar">

                        <div
                          style={{
                            width: `${width}%`,
                          }}
                        ></div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>

          {/* LEASE STATUS */}

          <div className="reports-card">

            <div className="reports-card-header">

              <div>

                <p className="reports-card-eyebrow">
                  LEASING
                </p>

                <h3>
                  Lease Status
                </h3>

              </div>

              <span className="reports-card-count">
                {overview.total_leases} TOTAL
              </span>

            </div>

            <div className="report-status-list">

              {lease_status.map(
                (item) => {

                  const width =
                    (item.count /
                      maxLeaseCount) *
                    100;

                  return (
                    <div
                      className="report-status-row"
                      key={item.status}
                    >

                      <div className="report-status-info">

                        <span>
                          {formatStatus(
                            item.status
                          )}
                        </span>

                        <strong>
                          {item.count}
                        </strong>

                      </div>

                      <div className="report-status-bar">

                        <div
                          style={{
                            width: `${width}%`,
                          }}
                        ></div>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </section>

        {/* =====================================================
            MALL PAYMENT METHODS
        ===================================================== */}

        <section className="reports-card">

          <div className="reports-card-header">

            <div>

              <p className="reports-card-eyebrow">
                MALL COLLECTION CHANNELS
              </p>

              <h3>
                Mall Payment Method Analysis
              </h3>

            </div>

            <span className="reports-card-icon">
              ₹
            </span>

          </div>

          {payment_methods.length === 0 ? (

            <div className="reports-empty">
              No payment method data available.
            </div>

          ) : (

            <div className="payment-analysis">

              {payment_methods.map(
                (item) => {

                  return (
                    <div
                      className="payment-analysis-item"
                      key={item.method}
                    >

                      <div className="payment-analysis-top">

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

                      <div className="payment-analysis-bar">

                        <div
                          style={{
                            width: `${item.percentage}%`,
                          }}
                        ></div>

                      </div>

                      <span className="payment-analysis-percentage">
                        {item.percentage}%
                      </span>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* =====================================================
            MALL SHOP PERFORMANCE
        ===================================================== */}

        <section className="reports-card">

          <div className="reports-card-header">

            <div>

              <p className="reports-card-eyebrow">
                MALL PERFORMANCE
              </p>

              <h3>
                Top Shops by Mall Collection
              </h3>

            </div>

            <span className="reports-card-count">
              TOP 10
            </span>

          </div>

          <div className="reports-shop-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search shops..."
              value={shopSearch}
              onChange={(event) =>
                setShopSearch(
                  event.target.value
                )
              }
            />

          </div>

          {filteredShops.length === 0 ? (

            <div className="reports-empty">
              No shop performance data found.
            </div>

          ) : (

            <div className="shop-performance-list">

              {filteredShops.map(
                (shop, index) => {

                  const width =
                    (shop.collected /
                      maxShopCollection) *
                    100;

                  return (
                    <div
                      className="shop-performance-row"
                      key={shop.shop_id}
                    >

                      <div className="shop-rank">
                        {index + 1}
                      </div>

                      <div className="shop-performance-info">

                        <div>

                          <strong>
                            {shop.shop_name}
                          </strong>

                          <span>
                            {shop.shop_code} · Floor{" "}
                            {shop.floor}
                          </span>

                        </div>

                        <strong>
                          {formatCurrency(
                            shop.collected
                          )}
                        </strong>

                      </div>

                      <div className="shop-performance-bar">

                        <div
                          style={{
                            width: `${width}%`,
                          }}
                        ></div>

                      </div>

                      <span className="shop-transaction-count">

                        {shop.transactions}{" "}
                        transaction
                        {shop.transactions !== 1
                          ? "s"
                          : ""}

                      </span>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* =====================================================
            RETAIL SHOP PERFORMANCE
        ===================================================== */}

        <section className="reports-card">

          <div className="reports-card-header">

            <div>

              <p className="reports-card-eyebrow">
                RETAIL PERFORMANCE
              </p>

              <h3>
                Top Shops by Retail Revenue
              </h3>

            </div>

            <span className="reports-card-count">
              TOP 10
            </span>

          </div>

          <div className="reports-shop-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search shop or tenant..."
              value={retailShopSearch}
              onChange={(event) =>
                setRetailShopSearch(
                  event.target.value
                )
              }
            />

          </div>

          {filteredRetailShops.length === 0 ? (

            <div className="reports-empty">
              No retail shop performance data found.
            </div>

          ) : (

            <div className="shop-performance-list">

              {filteredRetailShops.map(
                (shop, index) => {

                  const width =
                    (Number(shop.revenue) /
                      maxRetailShopRevenue) *
                    100;

                  return (
                    <div
                      className="shop-performance-row"
                      key={`${shop.shop_id}-${shop.tenant_id}`}
                    >

                      <div className="shop-rank">
                        {index + 1}
                      </div>

                      <div className="shop-performance-info">

                        <div>

                          <strong>
                            {shop.shop_name}
                          </strong>

                          <span>
                            {shop.shop_code} ·{" "}
                            {shop.tenant_name}
                          </span>

                        </div>

                        <strong>
                          {formatCurrency(
                            shop.revenue
                          )}
                        </strong>

                      </div>

                      <div className="shop-performance-bar">

                        <div
                          style={{
                            width: `${width}%`,
                          }}
                        ></div>

                      </div>

                      <span className="shop-transaction-count">

                        {shop.transactions}{" "}
                        transaction
                        {shop.transactions !== 1
                          ? "s"
                          : ""}

                        {" · "}

                        {shop.items} items

                      </span>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* =====================================================
            TOP RETAIL TENANTS
        ===================================================== */}

        <section className="reports-card">

          <div className="reports-card-header">

            <div>

              <p className="reports-card-eyebrow">
                TENANT PERFORMANCE
              </p>

              <h3>
                Top Tenants by Retail Revenue
              </h3>

            </div>

            <span className="reports-card-count">
              TOP 10
            </span>

          </div>

          {retailSales.tenant_performance.length === 0 ? (

            <div className="reports-empty">
              No tenant retail performance data found.
            </div>

          ) : (

            <div className="shop-performance-list">

              {retailSales.tenant_performance.map(
                (tenant, index) => {

                  const width =
                    (Number(tenant.revenue) /
                      maxRetailTenantRevenue) *
                    100;

                  return (
                    <div
                      className="shop-performance-row"
                      key={tenant.tenant_id}
                    >

                      <div className="shop-rank">
                        {index + 1}
                      </div>

                      <div className="shop-performance-info">

                        <div>

                          <strong>
                            {tenant.tenant_name}
                          </strong>

                          <span>
                            {tenant.company_name ||
                              "Individual Tenant"}
                          </span>

                        </div>

                        <strong>
                          {formatCurrency(
                            tenant.revenue
                          )}
                        </strong>

                      </div>

                      <div className="shop-performance-bar">

                        <div
                          style={{
                            width: `${width}%`,
                          }}
                        ></div>

                      </div>

                      <span className="shop-transaction-count">

                        {tenant.transactions}{" "}
                        transaction
                        {tenant.transactions !== 1
                          ? "s"
                          : ""}

                        {" · "}

                        {tenant.items} items

                      </span>

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* =====================================================
            SYSTEM SUMMARY
        ===================================================== */}

        <section className="reports-summary-strip">

          <div>

            <span>
              TENANTS
            </span>

            <strong>
              {overview.total_tenants}
            </strong>

          </div>

          <div>

            <span>
              LEASES
            </span>

            <strong>
              {overview.total_leases}
            </strong>

          </div>

          <div>

            <span>
              RESTAURANTS
            </span>

            <strong>
              {overview.total_restaurants}
            </strong>

          </div>

          <div>

            <span>
              INVOICES
            </span>

            <strong>
              {invoices.total}
            </strong>

          </div>

          <div>

            <span>
              RETAIL TRANSACTIONS
            </span>

            <strong>
              {formatNumber(
                retailSales.total_transactions
              )}
            </strong>

          </div>

        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

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

export default ManagerReports;