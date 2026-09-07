import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerOffers.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

function ManagerOffers() {
  const navigate = useNavigate();

  const [offers, setOffers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);

  const [form, setForm] = useState({
    restaurant_id: "",
    title: "",
    description: "",
    discount_percentage: "",
    valid_from: "",
    valid_until: "",
    status: "ACTIVE",
  });

  const token = localStorage.getItem("phoenix_token");
  const storedUser = localStorage.getItem("phoenix_user");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch {
    user = null;
  }

  // =====================================================
  // AUTHENTICATION
  // =====================================================

  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
      return;
    }

    if (user.role !== "ADMIN" && user.role !== "MANAGER") {
      navigate("/login");
    }
  }, [token, navigate]);

  // =====================================================
  // FETCH DATA
  // =====================================================

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [offersResponse, restaurantsResponse] =
        await Promise.all([
          fetch(`${API_URL}/manager/offers/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_URL}/manager/restaurants/`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

      if (
        offersResponse.status === 401 ||
        offersResponse.status === 403 ||
        restaurantsResponse.status === 401 ||
        restaurantsResponse.status === 403
      ) {
        localStorage.removeItem("phoenix_token");
        localStorage.removeItem("phoenix_user");
        navigate("/login");
        return;
      }

      const offersData = await offersResponse.json();
      const restaurantsData = await restaurantsResponse.json();

      if (!offersResponse.ok) {
        throw new Error(
          offersData.detail || "Failed to load offers."
        );
      }

      if (!restaurantsResponse.ok) {
        throw new Error(
          restaurantsData.detail ||
            "Failed to load restaurants."
        );
      }

      setOffers(offersData);
      setRestaurants(restaurantsData);

    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to connect to the PHOENIX server."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // =====================================================
  // FORM
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddModal = () => {
    setEditingOffer(null);

    setForm({
      restaurant_id: "",
      title: "",
      description: "",
      discount_percentage: "",
      valid_from: "",
      valid_until: "",
      status: "ACTIVE",
    });

    setShowModal(true);
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);

    setForm({
      restaurant_id: offer.restaurant_id,
      title: offer.title || "",
      description: offer.description || "",
      discount_percentage:
        offer.discount_percentage ?? "",
      valid_from: offer.valid_from || "",
      valid_until: offer.valid_until || "",
      status: offer.status || "ACTIVE",
    });

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingOffer(null);
  };

  // =====================================================
  // CREATE / UPDATE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.restaurant_id) {
      alert("Please select a restaurant.");
      return;
    }

    if (!form.title.trim()) {
      alert("Please enter an offer title.");
      return;
    }

    if (form.discount_percentage === "") {
      alert("Please enter a discount percentage.");
      return;
    }

    const discount = Number(
      form.discount_percentage
    );

    if (discount < 0 || discount > 100) {
      alert("Discount must be between 0 and 100.");
      return;
    }

    if (!form.valid_from || !form.valid_until) {
      alert("Please select both offer dates.");
      return;
    }

    if (
      new Date(form.valid_until) <
      new Date(form.valid_from)
    ) {
      alert(
        "Valid until date cannot be before valid from date."
      );
      return;
    }

    const payload = {
      restaurant_id: Number(form.restaurant_id),
      title: form.title.trim(),
      description:
        form.description.trim() || null,
      discount_percentage: discount,
      valid_from: form.valid_from,
      valid_until: form.valid_until,
      status: form.status,
    };

    try {
      const url = editingOffer
        ? `${API_URL}/manager/offers/${editingOffer.id}`
        : `${API_URL}/manager/offers/`;

      const method = editingOffer ? "PUT" : "POST";

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
          data.detail || "Failed to save offer."
        );
      }

      closeModal();
      await fetchData();

    } catch (err) {
      console.error(err);
      alert(
        err.message || "Failed to save offer."
      );
    }
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (offer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${offer.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/manager/offers/${offer.id}`,
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
          data.detail || "Failed to delete offer."
        );
      }

      await fetchData();

    } catch (err) {
      console.error(err);
      alert(
        err.message || "Failed to delete offer."
      );
    }
  };

  // =====================================================
  // FILTERING
  // =====================================================

  const filteredOffers = offers.filter((offer) => {
    const searchText = search
      .toLowerCase()
      .trim();

    const matchesSearch =
      !searchText ||
      offer.title
        ?.toLowerCase()
        .includes(searchText) ||
      offer.restaurant_name
        ?.toLowerCase()
        .includes(searchText) ||
      offer.shop_code
        ?.toLowerCase()
        .includes(searchText) ||
      offer.description
        ?.toLowerCase()
        .includes(searchText);

    const matchesStatus =
      statusFilter === "ALL" ||
      offer.status === statusFilter;

    return (
      matchesSearch &&
      matchesStatus
    );
  });

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("phoenix_token");
    localStorage.removeItem("phoenix_user");
    navigate("/login");
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="manager-page">

      {/* =================================================
          SIDEBAR
      ================================================= */}

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
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/leases")
            }
          >
            <span className="nav-icon">
              ◫
            </span>
            <span>Leases</span>
          </button>

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/invoices")
            }
          >
            <span className="nav-icon">
              ▤
            </span>
            <span>Invoices</span>
          </button>

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/payments")
            }
          >
            <span className="nav-icon">
              ₹
            </span>
            <span>Payments</span>
          </button>

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/restaurants")
            }
          >
            <span className="nav-icon">
              ◉
            </span>
            <span>Restaurants</span>
          </button>

          <button
            className="manager-nav-item active"
          >
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

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="manager-main">

        {/* TOP BAR */}

        <header className="manager-topbar">

          <div>

            <p className="manager-breadcrumb">
              PHOENIX / MANAGEMENT
            </p>

            <h1>Offers</h1>

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

        {/* PAGE INTRO */}

        <section className="offers-heading">

          <div>

            <p className="offers-eyebrow">
              PROMOTIONS
            </p>

            <h2>
              Restaurant Offers
            </h2>

            <p>
              Create and manage promotional
              offers across PHOENIX dining
              outlets.
            </p>

          </div>

          <button
            className="offer-add-button"
            onClick={openAddModal}
          >
            + Add Offer
          </button>

        </section>

        {/* ERROR */}

        {error && (
          <div className="offers-error">
            {error}
          </div>
        )}

        {/* CONTROLS */}

        <section className="offers-controls">

          <div className="offers-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search offers, restaurants or shops..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          <select
            className="offers-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="ALL">
              All Statuses
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="EXPIRED">
              Expired
            </option>

            <option value="INACTIVE">
              Inactive
            </option>

          </select>

        </section>

        {/* SUMMARY */}

        <section className="offers-summary">

          <div>
            <span>Total Offers</span>
            <strong>
              {offers.length}
            </strong>
          </div>

          <div>
            <span>Active</span>
            <strong>
              {
                offers.filter(
                  (offer) =>
                    offer.status === "ACTIVE"
                ).length
              }
            </strong>
          </div>

          <div>
            <span>Expired</span>
            <strong>
              {
                offers.filter(
                  (offer) =>
                    offer.status === "EXPIRED"
                ).length
              }
            </strong>
          </div>

          <div>
            <span>Inactive</span>
            <strong>
              {
                offers.filter(
                  (offer) =>
                    offer.status === "INACTIVE"
                ).length
              }
            </strong>
          </div>

        </section>

        {/* TABLE */}

        <section className="offers-table-container">

          {loading ? (
            <div className="offers-empty">
              Loading offers...
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="offers-empty">
              No offers found.
            </div>
          ) : (
            <table className="offers-table">

              <thead>

                <tr>
                  <th>Offer</th>
                  <th>Restaurant</th>
                  <th>Discount</th>
                  <th>Valid Period</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {filteredOffers.map(
                  (offer) => (
                    <tr key={offer.id}>

                      {/* OFFER */}

                      <td>

                        <div className="offer-title">
                          {offer.title}
                        </div>

                        <div className="offer-description">
                          {offer.description ||
                            "No description"}
                        </div>

                      </td>

                      {/* RESTAURANT */}

                      <td>

                        <div className="offer-restaurant">
                          {offer.restaurant_name}
                        </div>

                        <div className="offer-shop">
                          {offer.shop_code}
                          {" · "}
                          Floor {offer.floor}
                        </div>

                      </td>

                      {/* DISCOUNT */}

                      <td>

                        <span className="discount-badge">
                          {offer.discount_percentage}%
                        </span>

                      </td>

                      {/* DATES */}

                      <td>

                        <div className="offer-dates">
                          {offer.valid_from}
                          <span>→</span>
                          {offer.valid_until}
                        </div>

                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`offer-status ${offer.status.toLowerCase()}`}
                        >
                          {offer.status}
                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td>

                        <div className="offer-actions">

                          <button
                            className="offer-edit-button"
                            onClick={() =>
                              openEditModal(
                                offer
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="offer-delete-button"
                            onClick={() =>
                              handleDelete(
                                offer
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>
          )}

        </section>

        {/* FOOTER */}

        <footer className="manager-footer">

          <span>
            PHOENIX MANAGEMENT SYSTEM
          </span>

          <span>
            v1.0
          </span>

        </footer>

      </main>

      {/* =================================================
          ADD / EDIT MODAL
      ================================================= */}

      {showModal && (

        <div
          className="offer-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="offer-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="offer-modal-header">

              <div>

                <p className="offers-eyebrow">
                  {editingOffer
                    ? "EDIT PROMOTION"
                    : "NEW PROMOTION"}
                </p>

                <h2>
                  {editingOffer
                    ? "Edit Offer"
                    : "Add Offer"}
                </h2>

              </div>

              <button
                className="offer-modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
              className="offer-form"
            >

              {/* RESTAURANT */}

              <div className="offer-form-group">

                <label>
                  Restaurant *
                </label>

                <select
                  name="restaurant_id"
                  value={form.restaurant_id}
                  onChange={handleChange}
                  required
                >

                  <option value="">
                    Select restaurant
                  </option>

                  {restaurants.map(
                    (restaurant) => (
                      <option
                        key={restaurant.id}
                        value={restaurant.id}
                      >
                        {restaurant.shop_name}
                        {" — "}
                        {restaurant.shop_code}
                      </option>
                    )
                  )}

                </select>

              </div>

              {/* TITLE */}

              <div className="offer-form-group">

                <label>
                  Offer Title *
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. 20% Off Lunch"
                  required
                />

              </div>

              {/* DISCOUNT */}

              <div className="offer-form-row">

                <div className="offer-form-group">

                  <label>
                    Discount (%) *
                  </label>

                  <input
                    type="number"
                    name="discount_percentage"
                    value={
                      form.discount_percentage
                    }
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="20"
                    required
                  />

                </div>

                {/* STATUS */}

                <div className="offer-form-group">

                  <label>
                    Status *
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    required
                  >

                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="EXPIRED">
                      Expired
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>

                  </select>

                </div>

              </div>

              {/* DATES */}

              <div className="offer-form-row">

                <div className="offer-form-group">

                  <label>
                    Valid From *
                  </label>

                  <input
                    type="date"
                    name="valid_from"
                    value={form.valid_from}
                    onChange={handleChange}
                    required
                  />

                </div>

                <div className="offer-form-group">

                  <label>
                    Valid Until *
                  </label>

                  <input
                    type="date"
                    name="valid_until"
                    value={form.valid_until}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>

              {/* DESCRIPTION */}

              <div className="offer-form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the offer..."
                  rows="4"
                />

              </div>

              {/* ACTIONS */}

              <div className="offer-modal-actions">

                <button
                  type="button"
                  className="offer-cancel-button"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="offer-save-button"
                >
                  {editingOffer
                    ? "Update Offer"
                    : "Add Offer"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default ManagerOffers;