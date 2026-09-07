import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TenantSupport.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

const requestTypes = [
  "MAINTENANCE",
  "ELECTRICAL",
  "PLUMBING",
  "CLEANING",
  "SECURITY",
  "HVAC",
  "IT",
  "OTHER",
];

const priorities = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
];

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLabel(value) {
  if (!value) return "—";

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusClass(status) {
  switch (status) {
    case "OPEN":
      return "status-open";

    case "IN_PROGRESS":
      return "status-progress";

    case "RESOLVED":
      return "status-resolved";

    case "CLOSED":
      return "status-closed";

    default:
      return "";
  }
}

function priorityClass(priority) {
  switch (priority) {
    case "LOW":
      return "priority-low";

    case "MEDIUM":
      return "priority-medium";

    case "HIGH":
      return "priority-high";

    case "URGENT":
      return "priority-urgent";

    default:
      return "";
  }
}

export default function TenantSupport() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    request_type: "MAINTENANCE",
    subject: "",
    description: "",
    priority: "MEDIUM",
  });

  const token = localStorage.getItem("phoenix_token");
  const storedUser = localStorage.getItem("phoenix_user");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  useEffect(() => {
    if (!token || !user || user.role !== "TENANT") {
      navigate("/login");
      return;
    }

    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/tenant/support/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem("phoenix_token");
          localStorage.removeItem("phoenix_user");
          navigate("/login");
          return;
        }

        const data = await response.json();
        throw new Error(
          data.detail || "Failed to load support requests."
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

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (!form.description.trim()) {
      setError("Please describe the issue.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${API_URL}/tenant/support/`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            request_type: form.request_type,
            subject: form.subject.trim(),
            description: form.description.trim(),
            priority: form.priority,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to create support request."
        );
      }

      setSuccess(
        `Request ${data.request.request_number} created successfully.`
      );

      setForm({
        request_type: "MAINTENANCE",
        subject: "",
        description: "",
        priority: "MEDIUM",
      });

      await fetchRequests();
    } catch (err) {
      setError(
        err.message || "Unable to create support request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("phoenix_token");
    localStorage.removeItem("phoenix_user");
    navigate("/login");
  }

  return (
    <div className="tenant-layout">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="tenant-sidebar">

        <div className="tenant-brand">
          <div className="tenant-brand-mark">P</div>

          <div>
            <div className="tenant-brand-name">
              PHOENIX
            </div>

            <div className="tenant-brand-subtitle">
              TENANT PORTAL
            </div>
          </div>
        </div>

        <nav className="tenant-nav">

          <button
            className="tenant-nav-item"
            onClick={() => navigate("/tenant")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className="tenant-nav-item"
            onClick={() => navigate("/tenant/sales")}
          >
            <span>▤</span>
            Retail Sales
          </button>

          <button
            className="tenant-nav-item"
            onClick={() => navigate("/tenant#tenant-shop")}
          >
            <span>⌂</span>
            My Shop
          </button>

          <button
            className="tenant-nav-item"
            onClick={() => navigate("/tenant#tenant-lease")}
          >
            <span>▣</span>
            My Lease
          </button>

          <button
            className="tenant-nav-item"
            onClick={() => navigate("/tenant#tenant-invoices")}
          >
            <span>▤</span>
            Invoices
          </button>

          <button
            className="tenant-nav-item"
            onClick={() => navigate("/tenant#tenant-payments")}
          >
            <span>₹</span>
            Payments
          </button>

          <button
            className="tenant-nav-item active"
          >
            <span>⚒</span>
            Support
          </button>

          <button
            className="tenant-nav-item"
            onClick={() => navigate("/tenant#tenant-profile")}
          >
            <span>◎</span>
            My Profile
          </button>

        </nav>

        <button
          className="tenant-logout"
          onClick={handleLogout}
        >
          <span>↪</span>
          Logout
        </button>

      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main className="tenant-main">

        {/* Header */}

        <header className="tenant-page-header">

          <div>
            <span className="tenant-section-label">
              SUPPORT CENTER
            </span>

            <h1>
              Support & Maintenance
            </h1>

            <p>
              Report issues and track maintenance requests
              for your shop.
            </p>
          </div>

          <button
            className="tenant-header-button"
            onClick={fetchRequests}
          >
            ↻ Refresh
          </button>

        </header>

        {/* =========================
            ALERTS
        ========================= */}

        {error && (
          <div className="support-alert support-error">
            {error}
          </div>
        )}

        {success && (
          <div className="support-alert support-success">
            {success}
          </div>
        )}

        {/* =========================
            SUMMARY
        ========================= */}

        <section className="support-summary">

          <div className="support-summary-card">
            <span>Total Requests</span>
            <strong>{summary.total}</strong>
          </div>

          <div className="support-summary-card">
            <span>Open</span>
            <strong>{summary.open}</strong>
          </div>

          <div className="support-summary-card">
            <span>In Progress</span>
            <strong>{summary.in_progress}</strong>
          </div>

          <div className="support-summary-card">
            <span>Resolved</span>
            <strong>{summary.resolved}</strong>
          </div>

          <div className="support-summary-card">
            <span>Closed</span>
            <strong>{summary.closed}</strong>
          </div>

        </section>

        {/* =========================
            CREATE REQUEST
        ========================= */}

        <section className="support-panel">

          <div className="support-panel-header">

            <div>
              <span className="tenant-section-label">
                NEW REQUEST
              </span>

              <h2>
                Report an Issue
              </h2>
            </div>

            <span className="support-panel-icon">
              ⚒
            </span>

          </div>

          <form
            className="support-form"
            onSubmit={handleSubmit}
          >

            <div className="support-form-grid">

              <div className="support-field">

                <label>
                  Request Type
                </label>

                <select
                  name="request_type"
                  value={form.request_type}
                  onChange={handleChange}
                >
                  {requestTypes.map((type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {formatLabel(type)}
                    </option>
                  ))}
                </select>

              </div>

              <div className="support-field">

                <label>
                  Priority
                </label>

                <select
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                >
                  {priorities.map((priority) => (
                    <option
                      key={priority}
                      value={priority}
                    >
                      {formatLabel(priority)}
                    </option>
                  ))}
                </select>

              </div>

            </div>

            <div className="support-field">

              <label>
                Subject
              </label>

              <input
                type="text"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="e.g. Air conditioning not working"
                maxLength={200}
              />

            </div>

            <div className="support-field">

              <label>
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the issue in detail..."
                rows={5}
              />

            </div>

            <div className="support-form-footer">

              <p>
                Your request will automatically be linked
                to your leased shop.
              </p>

              <button
                type="submit"
                className="support-submit"
                disabled={submitting}
              >
                {submitting
                  ? "Submitting..."
                  : "Submit Request"}
              </button>

            </div>

          </form>

        </section>

        {/* =========================
            REQUEST HISTORY
        ========================= */}

        <section className="support-panel">

          <div className="support-panel-header">

            <div>
              <span className="tenant-section-label">
                REQUEST HISTORY
              </span>

              <h2>
                My Support Requests
              </h2>
            </div>

          </div>

          {loading ? (
            <div className="support-empty">
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="support-empty">

              <div className="support-empty-icon">
                ✓
              </div>

              <h3>
                No support requests
              </h3>

              <p>
                You haven't submitted any support or
                maintenance requests yet.
              </p>

            </div>
          ) : (

            <div className="support-request-list">

              {requests.map((request) => (

                <article
                  className="support-request-card"
                  key={request.id}
                >

                  <div className="support-request-top">

                    <div>

                      <span className="support-request-number">
                        {request.request_number}
                      </span>

                      <h3>
                        {request.subject}
                      </h3>

                    </div>

                    <span
                      className={`support-status ${statusClass(
                        request.status
                      )}`}
                    >
                      {formatLabel(request.status)}
                    </span>

                  </div>

                  <div className="support-request-meta">

                    <span>
                      <b>Type:</b>{" "}
                      {formatLabel(request.request_type)}
                    </span>

                    <span
                      className={`support-priority ${priorityClass(
                        request.priority
                      )}`}
                    >
                      <b>Priority:</b>{" "}
                      {formatLabel(request.priority)}
                    </span>

                    <span>
                      <b>Shop:</b>{" "}
                      {request.shop?.name || "—"}
                    </span>

                    <span>
                      <b>Submitted:</b>{" "}
                      {formatDate(request.created_at)}
                    </span>

                  </div>

                  <div className="support-request-description">

                    <p>
                      {request.description}
                    </p>

                  </div>

                  {request.manager_response && (
                    <div className="manager-response">

                      <div className="manager-response-title">
                        Manager Response
                      </div>

                      <p>
                        {request.manager_response}
                      </p>

                    </div>
                  )}

                  <div className="support-request-footer">

                    <span>
                      Last updated{" "}
                      {formatDate(request.updated_at)}
                    </span>

                  </div>

                </article>

              ))}

            </div>

          )}

        </section>

      </main>

    </div>
  );
}