import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerRetailSales.css";

const API_URL = "http://127.0.0.1:8001";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
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

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function ManagerRetailSales() {
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState(null);

  const [shops, setShops] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [shopId, setShopId] = useState("");
  const [tenantId, setTenantId] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("phoenix_token");
  const userString = localStorage.getItem("phoenix_user");

  useEffect(() => {
    if (!token || !userString) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(userString);

      if (
        user.role !== "MANAGER" &&
        user.role !== "ADMIN"
      ) {
        navigate("/tenant");
        return;
      }
    } catch {
      localStorage.removeItem("phoenix_token");
      localStorage.removeItem("phoenix_user");
      navigate("/login");
    }
  }, [navigate, token, userString]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (paymentMethod) {
        params.append(
          "payment_method",
          paymentMethod
        );
      }

      if (shopId) {
        params.append("shop_id", shopId);
      }

      if (tenantId) {
        params.append("tenant_id", tenantId);
      }

      const query = params.toString();

      const response = await fetch(
        `${API_URL}/manager/retail-sales/${
          query ? `?${query}` : ""
        }`,
        {
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

      if (!response.ok) {
        throw new Error(
          "Unable to load retail sales"
        );
      }

      const result = await response.json();

      setSales(result.sales || []);
      setSummary(result.summary || null);
    } catch (err) {
      setError(
        err.message || "Unable to load retail sales"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [shopsResponse, tenantsResponse] =
        await Promise.all([
          fetch(
            `${API_URL}/manager/retail-sales/shops`,
            { headers }
          ),
          fetch(
            `${API_URL}/manager/retail-sales/tenants`,
            { headers }
          ),
        ]);

      if (shopsResponse.ok) {
        setShops(await shopsResponse.json());
      }

      if (tenantsResponse.ok) {
        setTenants(await tenantsResponse.json());
      }
    } catch {
      // Main sales data remains usable even if filters fail.
    }
  };

  useEffect(() => {
    if (token) {
      fetchSales();
      fetchFilters();
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSales();
  };

  const clearFilters = () => {
    setSearch("");
    setPaymentMethod("");
    setShopId("");
    setTenantId("");

    setTimeout(() => {
      fetchSales();
    }, 0);
  };

  const logout = () => {
    localStorage.removeItem("phoenix_token");
    localStorage.removeItem("phoenix_user");
    navigate("/login");
  };

  return (
    <div className="manager-retail-page">

      {/* HEADER */}

      <header className="manager-retail-header">

        <div>
          <p className="manager-retail-eyebrow">
            PHOENIX • MANAGER PORTAL
          </p>

          <h1>Retail Sales</h1>

          <p>
            Monitor customer purchases across all
            tenant shops.
          </p>
        </div>

        <button
          className="manager-retail-logout"
          onClick={logout}
        >
          Logout
        </button>

      </header>

      {/* BACK */}

      <button
        className="manager-retail-back"
        onClick={() => navigate("/manager")}
      >
        ← Back to Dashboard
      </button>

      {/* ERROR */}

      {error && (
        <div className="manager-retail-error">
          {error}
        </div>
      )}

      {/* SUMMARY */}

      <section className="manager-retail-summary">

        <div className="manager-retail-stat">

          <span>Retail Revenue</span>

          <strong>
            {formatCurrency(
              summary?.total_revenue
            )}
          </strong>

          <small>
            Customer purchases
          </small>

        </div>

        <div className="manager-retail-stat">

          <span>Transactions</span>

          <strong>
            {summary?.total_transactions || 0}
          </strong>

          <small>
            Total purchases
          </small>

        </div>

        <div className="manager-retail-stat">

          <span>Items Sold</span>

          <strong>
            {summary?.total_items || 0}
          </strong>

          <small>
            Total quantity
          </small>

        </div>

        <div className="manager-retail-stat">

          <span>Average Sale</span>

          <strong>
            {formatCurrency(
              summary?.average_sale
            )}
          </strong>

          <small>
            Per transaction
          </small>

        </div>

      </section>

      {/* FILTERS */}

      <section className="manager-retail-filters">

        <div className="filter-title">
          <span>TRANSACTION SEARCH</span>
          <h2>Filter Retail Sales</h2>
        </div>

        <form
          className="filter-form"
          onSubmit={handleSearch}
        >

          <div className="filter-group search-filter">

            <label>Search</label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Customer, product, shop..."
            />

          </div>

          <div className="filter-group">

            <label>Shop</label>

            <select
              value={shopId}
              onChange={(e) =>
                setShopId(e.target.value)
              }
            >
              <option value="">
                All Shops
              </option>

              {shops.map((shop) => (
                <option
                  key={shop.id}
                  value={shop.id}
                >
                  {shop.shop_code} — {shop.name}
                </option>
              ))}
            </select>

          </div>

          <div className="filter-group">

            <label>Tenant</label>

            <select
              value={tenantId}
              onChange={(e) =>
                setTenantId(e.target.value)
              }
            >
              <option value="">
                All Tenants
              </option>

              {tenants.map((tenant) => (
                <option
                  key={tenant.id}
                  value={tenant.id}
                >
                  {tenant.name}
                </option>
              ))}
            </select>

          </div>

          <div className="filter-group">

            <label>Payment</label>

            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value)
              }
            >
              <option value="">
                All Methods
              </option>

              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">
                Bank Transfer
              </option>
            </select>

          </div>

          <div className="filter-actions">

            <button
              type="submit"
              className="filter-apply"
            >
              Apply Filters
            </button>

            <button
              type="button"
              className="filter-clear"
              onClick={clearFilters}
            >
              Clear
            </button>

          </div>

        </form>

      </section>

      {/* PAYMENT BREAKDOWN */}

      <section className="manager-retail-breakdown">

        <div>
          <span className="breakdown-label">
            PAYMENT BREAKDOWN
          </span>

          <h2>Collection by Method</h2>
        </div>

        <div className="breakdown-grid">

          {summary?.payment_methods?.length > 0 ? (

            summary.payment_methods.map((item) => (

              <div
                className="breakdown-item"
                key={item.method}
              >

                <div>
                  <strong>
                    {formatMethod(item.method)}
                  </strong>

                  <span>
                    {item.transactions} transaction
                    {item.transactions !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>

                <strong>
                  {formatCurrency(item.amount)}
                </strong>

              </div>

            ))

          ) : (

            <div className="manager-retail-empty">
              No payment data available.
            </div>

          )}

        </div>

      </section>

      {/* SALES TABLE */}

      <section className="manager-retail-table-card">

        <div className="retail-table-heading">

          <div>
            <span className="breakdown-label">
              CENTRAL SALES REGISTER
            </span>

            <h2>All Retail Sales</h2>

            <p>
              Every customer purchase recorded by
              tenant shops.
            </p>
          </div>

          <span className="retail-record-count">
            {sales.length} records
          </span>

        </div>

        {loading ? (

          <div className="manager-retail-loading">
            Loading retail sales...
          </div>

        ) : sales.length === 0 ? (

          <div className="manager-retail-empty large">
            <div>🛍️</div>

            <h3>
              No retail sales found
            </h3>

            <p>
              Sales recorded by tenants will
              appear here automatically.
            </p>
          </div>

        ) : (

          <div className="manager-retail-table-wrapper">

            <table className="manager-retail-table">

              <thead>

                <tr>
                  <th>Sale</th>
                  <th>Date</th>
                  <th>Shop</th>
                  <th>Tenant</th>
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
                    </td>

                    <td>
                      {formatDate(
                        sale.sale_date
                      )}
                    </td>

                    <td>

                      <strong>
                        {sale.shop.shop_code}
                      </strong>

                      <small>
                        {sale.shop.name}
                      </small>

                    </td>

                    <td>

                      <strong>
                        {sale.tenant.name}
                      </strong>

                      {sale.tenant.company_name && (
                        <small>
                          {sale.tenant.company_name}
                        </small>
                      )}

                    </td>

                    <td>

                      <strong>
                        {sale.customer.name}
                      </strong>

                      {sale.customer.phone && (
                        <small>
                          {sale.customer.phone}
                        </small>
                      )}

                    </td>

                    <td>

                      <strong>
                        {sale.product.name}
                      </strong>

                      {sale.product.category && (
                        <small>
                          {sale.product.category}
                        </small>
                      )}

                    </td>

                    <td>
                      {sale.quantity}
                    </td>

                    <td className="retail-amount">
                      {formatCurrency(
                        sale.total_amount
                      )}
                    </td>

                    <td>

                      <span className="retail-payment-badge">
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

export default ManagerRetailSales;