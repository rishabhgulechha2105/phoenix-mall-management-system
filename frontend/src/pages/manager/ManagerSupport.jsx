import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerSupport.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

const requestTypes = [
  "ALL",
  "MAINTENANCE",
  "ELECTRICAL",
  "PLUMBING",
  "CLEANING",
  "SECURITY",
  "HVAC",
  "IT",
  "OTHER",
];

const statuses = [
  "ALL",
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];

const priorities = [
  "ALL",
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

const formatLabel = (value) => {
  if (!value) return "—";

  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

const statusClass = (status) => {
  switch (status) {
    case "OPEN":
      return "manager-support-open";

    case "IN_PROGRESS":
      return "manager-support-progress";

    case "RESOLVED":
      return "manager-support-resolved";

    case "CLOSED":
      return "manager-support-closed";

    default:
      return "";
  }
};

const priorityClass = (priority) => {
  switch (priority) {
    case "LOW":
      return "manager-support-low";

    case "MEDIUM":
      return "manager-support-medium";

    case "HIGH":
      return "manager-support-high";

    case "URGENT":
      return "manager-support-urgent";

    default:
      return "";
  }
};

function ManagerSupport() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);

  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    urgent: 0,
    high_priority: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [requestType, setRequestType] = useState("ALL");

  const [updatingId, setUpdatingId] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editResponse, setEditResponse] = useState("");

  const token = localStorage.getItem("phoenix_token");
  const storedUser = localStorage.getItem("phoenix_user");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  useEffect(() => {
    if (
      !token ||
      !user ||
      !["MANAGER", "ADMIN"].includes(user.role)
    ) {
      navigate("/login");
      return;
    }

    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (status !== "ALL") {
        params.append("status", status);
      }

      if (priority !== "ALL") {
        params.append("priority", priority);
      }

      if (requestType !== "ALL") {
        params.append("request_type", requestType);
      }

      const queryString = params.toString();

      const response = await fetch(
        `${API_URL}/manager/support/${
          queryString ? `?${queryString}` : ""
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
        const data = await response.json();

        throw new Error(
          data.detail || "Unable to load support requests."
        );
      }

      const data = await response.json();

      setRequests(data.requests || []);

      setSummary(
        data.summary || {
          total: 0,
          open: 0,
          in_progress: 0,
          resolved: 0,
          closed: 0,
          urgent: 0,
          high_priority: 0,
        }
      );
    } catch (err) {
      setError(
        err.message || "Unable to load support requests."
      );
    } finally {
      setLoading(false);
    }
  }

  function startEditing(request) {
    setEditingId(request.id);
    setEditStatus(request.status);
    setEditResponse(request.manager_response || "");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditStatus("");
    setEditResponse("");
  }

  async function saveUpdate(requestId) {
    try {
      setUpdatingId(requestId);
      setError("");

      const response = await fetch(
        `${API_URL}/manager/support/${requestId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            status: editStatus,
            manager_response: editResponse,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to update request."
        );
      }

      setEditingId(null);
      setEditStatus("");
      setEditResponse("");

      await fetchRequests();
    } catch (err) {
      setError(
        err.message || "Unable to update support request."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatus("ALL");
    setPriority("ALL");
    setRequestType("ALL");

    setTimeout(() => {
      fetchRequests();
    }, 0);
  }

  function handleLogout() {
    localStorage.removeItem("phoenix_token");
    localStorage.removeItem("phoenix_user");
    navigate("/login");
  }

  return (
    <div className="manager-support-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="manager-support-sidebar">

        <div className="manager-support-brand">

          <div className="manager-support-brand-mark">
            P
          </div>

          <div>
            <div className="manager-support-brand-name">
              PHOENIX
            </div>

            <div className="manager-support-brand-subtitle">
              MANAGER PORTAL
            </div>
          </div>

        </div>

        <nav className="manager-support-nav">

          <button
            className="manager-support-nav-item"
            onClick={() => navigate("/manager")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className="manager-support-nav-item"
            onClick={() => navigate("/manager/shops")}
          >
            <span>▦</span>
            Shops
          </button>

          <button
            className="manager-support-nav-item"
            onClick={() => navigate("/manager/tenants")}
          >
            <span>♙</span>
            Tenants
          </button>

          <button
            className="manager-support-nav-item"
            onClick={() => navigate("/manager/leases")}
          >
            <span>▣</span>
            Leases
          </button>

          <button
            className="manager-support-nav-item"
            onClick={() => navigate("/manager/invoices")}
          >
            <span>▤</span>
            Invoices
          </button>

          <button
            className="manager-support-nav-item"
            onClick={() => navigate("/manager/payments")}
          >
            <span>₹</span>
            Payments
          </button>

          <button
            className="manager-support-nav-item"
            onClick={() => navigate("/manager/restaurants")}
          >
            <span>◉</span>
            Restaurants
          </button>

          <button
            className="manager-support-nav-item"
            onClick={() => navigate("/manager/offers")}
          >
            <span>%</span>
            Offers
          </button>

          <button
            className="manager-support-nav-item"
            onClick={() => navigate("/manager/reviews")}
          >
            <span>★</span>
            Reviews
          </button>

          <button
            className="manager-support-nav-item"
            onClick={() => navigate("/manager/sales")}
          >
            <span>₹</span>
            Mall Collections
          </button>

          <button
            className="manager-support-nav-item"
            onClick={() =>
              navigate("/manager/retail-sales")
            }
          >
            <span>🛍️</span>
            Retail Sales
          </button>

          <button
            className="manager-support-nav-item"
            onClick={() => navigate("/manager/reports")}
          >
            <span>▥</span>
            Reports
          </button>

          <button
            className="manager-support-nav-item active"
          >
            <span>⚒</span>
            Support
          </button>

        </nav>

        <button
          className="manager-support-logout"
          onClick={handleLogout}
        >
          <span>↪</span>
          Logout
        </button>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="manager-support-main">

        {/* HEADER */}

        <header className="manager-support-header">

          <div>

            <span className="manager-support-eyebrow">
              OPERATIONS
            </span>

            <h1>
              Support Center
            </h1>

            <p>
              Manage tenant maintenance and support
              requests across PHOENIX.
            </p>

          </div>

          <button
            className="manager-support-refresh"
            onClick={fetchRequests}
          >
            ↻ Refresh
          </button>

        </header>

        {/* ERROR */}

        {error && (
          <div className="manager-support-error">
            {error}
          </div>
        )}

        {/* =====================================================
            SUMMARY
        ===================================================== */}

        <section className="manager-support-summary">

          <div className="manager-support-summary-card">
            <span>Total Requests</span>
            <strong>{summary.total}</strong>
          </div>

          <div className="manager-support-summary-card">
            <span>Open</span>
            <strong>{summary.open}</strong>
          </div>

          <div className="manager-support-summary-card">
            <span>In Progress</span>
            <strong>{summary.in_progress}</strong>
          </div>

          <div className="manager-support-summary-card">
            <span>Resolved</span>
            <strong>{summary.resolved}</strong>
          </div>

          <div className="manager-support-summary-card">
            <span>Urgent</span>
            <strong>{summary.urgent}</strong>
          </div>

        </section>

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <section className="manager-support-filter-panel">

          <div className="manager-support-filter-title">
            <span>REQUEST FILTERS</span>
          </div>

          <div className="manager-support-filters">

            <div className="manager-support-search">

              <span>⌕</span>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    fetchRequests();
                  }
                }}
                placeholder="Search request, tenant, shop..."
              />

            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);

                setTimeout(() => {
                  fetchRequests();
                }, 0);
              }}
            >
              {statuses.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  Status: {formatLabel(item)}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value);

                setTimeout(() => {
                  fetchRequests();
                }, 0);
              }}
            >
              {priorities.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  Priority: {formatLabel(item)}
                </option>
              ))}
            </select>

            <select
              value={requestType}
              onChange={(event) => {
                setRequestType(event.target.value);

                setTimeout(() => {
                  fetchRequests();
                }, 0);
              }}
            >
              {requestTypes.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  Type: {formatLabel(item)}
                </option>
              ))}
            </select>

            <button
              className="manager-support-clear"
              onClick={clearFilters}
            >
              Clear
            </button>

          </div>

        </section>

        {/* =====================================================
            REQUESTS
        ===================================================== */}

        <section className="manager-support-panel">

          <div className="manager-support-panel-header">

            <div>
              <span className="manager-support-section-label">
                TENANT REQUESTS
              </span>

              <h2>
                Support & Maintenance
              </h2>
            </div>

            <span className="manager-support-count">
              {requests.length} requests
            </span>

          </div>

          {loading ? (

            <div className="manager-support-empty">
              Loading support requests...
            </div>

          ) : requests.length === 0 ? (

            <div className="manager-support-empty">

              <div className="manager-support-empty-icon">
                ✓
              </div>

              <h3>
                No requests found
              </h3>

              <p>
                There are no support requests matching
                the current filters.
              </p>

            </div>

          ) : (

            <div className="manager-support-table-wrapper">

              <table className="manager-support-table">

                <thead>

                  <tr>
                    <th>Request</th>
                    <th>Tenant</th>
                    <th>Shop</th>
                    <th>Issue</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>

                </thead>

                <tbody>

                  {requests.map((request) => (

                    <tr key={request.id}>

                      {/* REQUEST */}

                      <td>

                        <div className="manager-support-request-cell">

                          <strong>
                            {request.request_number}
                          </strong>

                          <span>
                            {formatLabel(
                              request.request_type
                            )}
                          </span>

                        </div>

                      </td>

                      {/* TENANT */}

                      <td>

                        <div className="manager-support-tenant-cell">

                          <strong>
                            {request.tenant?.name || "—"}
                          </strong>

                          <span>
                            {request.tenant?.company_name ||
                              request.tenant?.email ||
                              "—"}
                          </span>

                        </div>

                      </td>

                      {/* SHOP */}

                      <td>

                        <div className="manager-support-shop-cell">

                          <strong>
                            {request.shop?.name || "—"}
                          </strong>

                          <span>
                            {request.shop?.shop_code || "—"}
                          </span>

                        </div>

                      </td>

                      {/* ISSUE */}

                      <td>

                        <div className="manager-support-issue-cell">

                          <strong>
                            {request.subject}
                          </strong>

                          <p>
                            {request.description}
                          </p>

                        </div>

                      </td>

                      {/* PRIORITY */}

                      <td>

                        <span
                          className={`manager-support-priority ${priorityClass(
                            request.priority
                          )}`}
                        >
                          {formatLabel(
                            request.priority
                          )}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`manager-support-status ${statusClass(
                            request.status
                          )}`}
                        >
                          {formatLabel(
                            request.status
                          )}
                        </span>

                      </td>

                      {/* DATE */}

                      <td>

                        <span className="manager-support-date">
                          {formatDate(
                            request.created_at
                          )}
                        </span>

                      </td>

                      {/* ACTION */}

                      <td>

                        <button
                          className="manager-support-action"
                          onClick={() =>
                            startEditing(request)
                          }
                        >
                          Manage
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* =====================================================
            EDIT MODAL
        ===================================================== */}

        {editingId !== null && (

          <div className="manager-support-modal-backdrop">

            <div className="manager-support-modal">

              <div className="manager-support-modal-header">

                <div>

                  <span>
                    UPDATE REQUEST
                  </span>

                  <h2>
                    {requests.find(
                      (item) => item.id === editingId
                    )?.request_number}
                  </h2>

                </div>

                <button
                  className="manager-support-modal-close"
                  onClick={cancelEditing}
                >
                  ×
                </button>

              </div>

              <div className="manager-support-modal-body">

                <div className="manager-support-modal-field">

                  <label>
                    Status
                  </label>

                  <select
                    value={editStatus}
                    onChange={(event) =>
                      setEditStatus(event.target.value)
                    }
                  >

                    {statuses
                      .filter((item) => item !== "ALL")
                      .map((item) => (

                        <option
                          key={item}
                          value={item}
                        >
                          {formatLabel(item)}
                        </option>

                      ))}

                  </select>

                </div>

                <div className="manager-support-modal-field">

                  <label>
                    Manager Response
                  </label>

                  <textarea
                    value={editResponse}
                    onChange={(event) =>
                      setEditResponse(event.target.value)
                    }
                    placeholder="Enter a response for the tenant..."
                    rows={6}
                  />

                </div>

              </div>

              <div className="manager-support-modal-footer">

                <button
                  className="manager-support-cancel"
                  onClick={cancelEditing}
                >
                  Cancel
                </button>

                <button
                  className="manager-support-save"
                  onClick={() =>
                    saveUpdate(editingId)
                  }
                  disabled={updatingId === editingId}
                >
                  {updatingId === editingId
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>

            </div>

          </div>

        )}

      </main>

    </div>
  );
}

export default ManagerSupport;