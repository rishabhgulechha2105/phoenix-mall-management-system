import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerRestaurants.css";

const API = "http://127.0.0.1:8001";

function ManagerRestaurants() {
  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);

  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // Add / Edit Modal
  // =====================================================

  const [showModal, setShowModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);

  // =====================================================
  // Delete Confirmation Modal
  // =====================================================

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // =====================================================
  // Form
  // =====================================================

  const [form, setForm] = useState({
    name: "",
    shop_code: "",
    floor: "",
    area_sqft: "",
    monthly_rent: "",
    shop_status: "OCCUPIED",

    cuisine: "",
    price_range: "MODERATE",
    opening_time: "",
    closing_time: "",
    description: "",
  });

  // =====================================================
  // Authentication
  // =====================================================

  const token = localStorage.getItem("phoenix_token");
  const storedUser = localStorage.getItem("phoenix_user");

  let user = null;

  try {
    user = storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch (err) {
    console.error("Invalid stored user:", err);
    user = null;
  }

  // =====================================================
  // Authentication Check
  // IMPORTANT:
  // Do NOT put "user" in dependency array because JSON.parse
  // creates a new object on every render.
  // =====================================================

  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
      return;
    }

    if (
      user.role !== "ADMIN" &&
      user.role !== "MANAGER"
    ) {
      navigate("/");
    }
  }, [token, navigate]);

  // =====================================================
  // Fetch Restaurants
  // =====================================================

  const fetchData = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/manager/restaurants/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      // Read response as text first.
      // This lets us safely handle both JSON and non-JSON
      // backend responses.
      const responseText = await response.text();

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        data = {};
      }

      if (!response.ok) {
        const backendMessage =
          data?.detail ||
          data?.message ||
          responseText ||
          `Failed to fetch restaurants (${response.status})`;

        // If token is invalid/expired, send user to login.
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem(
            "phoenix_token"
          );

          localStorage.removeItem(
            "phoenix_user"
          );

          navigate("/login");
          return;
        }

        throw new Error(
          backendMessage
        );
      }

      if (!Array.isArray(data)) {
        console.error(
          "Unexpected restaurant response:",
          data
        );

        throw new Error(
          "Invalid restaurant data received from server."
        );
      }

      setRestaurants(data);

    } catch (err) {
      console.error(
        "FETCH RESTAURANTS ERROR:",
        err
      );

      setError(
        err.message ||
          "Something went wrong while loading restaurants."
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // Initial Load
  // =====================================================

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // =====================================================
  // Form Handling
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // Open Add Modal
  // =====================================================

  const openAddModal = () => {
    setEditingRestaurant(null);

    setForm({
      name: "",
      shop_code: "",
      floor: "",
      area_sqft: "",
      monthly_rent: "",
      shop_status: "OCCUPIED",

      cuisine: "",
      price_range: "MODERATE",
      opening_time: "",
      closing_time: "",
      description: "",
    });

    setError("");
    setShowModal(true);
  };

  // =====================================================
  // Open Edit Modal
  // =====================================================

  const openEditModal = (restaurant) => {
    setEditingRestaurant(restaurant);

    setForm({
      name:
        restaurant.shop_name || "",

      shop_code:
        restaurant.shop_code || "",

      floor:
        restaurant.floor || "",

      area_sqft:
        restaurant.area_sqft || "",

      monthly_rent:
        restaurant.monthly_rent || "",

      shop_status:
        restaurant.shop_status ||
        "OCCUPIED",

      cuisine:
        restaurant.cuisine || "",

      price_range:
        restaurant.price_range ||
        "MODERATE",

      opening_time:
        restaurant.opening_time || "",

      closing_time:
        restaurant.closing_time || "",

      description:
        restaurant.description || "",
    });

    setError("");
    setShowModal(true);
  };

  // =====================================================
  // Close Add / Edit Modal
  // =====================================================

  const closeModal = () => {
    setShowModal(false);
    setEditingRestaurant(null);
  };

  // =====================================================
  // Create / Update Restaurant
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ---------------------------------------------------
    // Validation
    // ---------------------------------------------------

    if (!form.name.trim()) {
      alert(
        "Please enter the restaurant name."
      );
      return;
    }

    if (!form.shop_code.trim()) {
      alert(
        "Please enter a shop code."
      );
      return;
    }

    if (!form.floor.trim()) {
      alert(
        "Please enter the floor."
      );
      return;
    }

    if (!form.area_sqft) {
      alert(
        "Please enter the area."
      );
      return;
    }

    if (!form.monthly_rent) {
      alert(
        "Please enter the monthly rent."
      );
      return;
    }

    if (!form.cuisine.trim()) {
      alert(
        "Please enter the cuisine."
      );
      return;
    }

    if (
      !form.opening_time ||
      !form.closing_time
    ) {
      alert(
        "Please enter opening and closing times."
      );
      return;
    }

    // ---------------------------------------------------
    // Payload
    // ---------------------------------------------------

    const payload = {
      name: form.name.trim(),

      shop_code:
        form.shop_code.trim(),

      floor:
        form.floor.trim(),

      area_sqft:
        Number(form.area_sqft),

      monthly_rent:
        Number(form.monthly_rent),

      shop_status:
        form.shop_status,

      cuisine:
        form.cuisine.trim(),

      price_range:
        form.price_range,

      opening_time:
        form.opening_time,

      closing_time:
        form.closing_time,

      description:
        form.description.trim() || null,
    };

    try {
      setError("");

      const url = editingRestaurant
        ? `${API}/manager/restaurants/${editingRestaurant.id}`
        : `${API}/manager/restaurants/`;

      const method = editingRestaurant
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,

            Accept:
              "application/json",
          },

          body:
            JSON.stringify(payload),
        }
      );

      const responseText =
        await response.text();

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        data = {};
      }

      if (!response.ok) {

        if (
          response.status === 401 ||
          response.status === 403
        ) {
          localStorage.removeItem(
            "phoenix_token"
          );

          localStorage.removeItem(
            "phoenix_user"
          );

          navigate("/login");
          return;
        }

        throw new Error(
          data?.detail ||
            data?.message ||
            responseText ||
            `Failed to save restaurant (${response.status})`
        );
      }

      // -------------------------------------------------
      // SUCCESS
      // -------------------------------------------------

      closeModal();

      // Instead of blindly replacing the entire page state
      // with another request, use the returned restaurant.
      //
      // This also avoids a second GET immediately after POST
      // or PUT.
      if (data && data.id) {

        if (editingRestaurant) {

          setRestaurants(
            (previous) =>
              previous.map(
                (restaurant) =>
                  restaurant.id ===
                  data.id
                    ? data
                    : restaurant
              )
          );

        } else {

          setRestaurants(
            (previous) => [
              ...previous,
              data,
            ]
          );
        }

      } else {
        // Fallback only if backend didn't return
        // the created/updated restaurant.
        await fetchData();
      }

    } catch (err) {
      console.error(
        "SAVE RESTAURANT ERROR:",
        err
      );

      alert(
        err.message ||
          "Failed to save restaurant"
      );
    }
  };

  // =====================================================
  // Open Delete Confirmation
  // =====================================================

  const openDeleteModal = (restaurant) => {
    setRestaurantToDelete(
      restaurant
    );

    setError("");
    setShowDeleteModal(true);
  };

  // =====================================================
  // Close Delete Confirmation
  // =====================================================

  const closeDeleteModal = () => {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);
    setRestaurantToDelete(null);
  };

  // =====================================================
  // Delete Restaurant
  // =====================================================

  const handleDelete = async () => {
    if (!restaurantToDelete) {
      return;
    }

    const deletedId =
      restaurantToDelete.id;

    try {
      setDeleting(true);
      setError("");

      const response = await fetch(
        `${API}/manager/restaurants/${deletedId}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`,

            Accept:
              "application/json",
          },
        }
      );

      const responseText =
        await response.text();

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        data = {};
      }

      // ---------------------------------------------------
      // Authentication failure
      // ---------------------------------------------------

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        localStorage.removeItem(
          "phoenix_token"
        );

        localStorage.removeItem(
          "phoenix_user"
        );

        navigate("/login");
        return;
      }

      // ---------------------------------------------------
      // Backend rejected deletion
      // ---------------------------------------------------

      if (!response.ok) {

        throw new Error(
          data?.detail ||
            data?.message ||
            responseText ||
            `Failed to delete restaurant (${response.status})`
        );
      }

      // ---------------------------------------------------
      // DELETE SUCCESS
      // ---------------------------------------------------
      //
      // IMPORTANT:
      // Do NOT call fetchData().
      //
      // The backend already confirmed deletion.
      // Remove it directly from React state.
      // ---------------------------------------------------

      setRestaurants(
        (previous) =>
          previous.filter(
            (restaurant) =>
              restaurant.id !==
              deletedId
          )
      );

      // ---------------------------------------------------
      // Close modal
      // ---------------------------------------------------

      setShowDeleteModal(false);
      setRestaurantToDelete(null);

    } catch (err) {

      console.error(
        "DELETE RESTAURANT ERROR:",
        err
      );

      setError(
        err.message ||
          "Failed to delete restaurant"
      );

      setShowDeleteModal(false);
      setRestaurantToDelete(null);

    } finally {

      setDeleting(false);
    }
  };

  // =====================================================
  // Filtering
  // =====================================================

  const filteredRestaurants =
    restaurants.filter(
      (restaurant) => {

        const searchText =
          search
            .toLowerCase()
            .trim();

        const matchesSearch =
          !searchText ||
          restaurant.shop_name
            ?.toLowerCase()
            .includes(searchText) ||
          restaurant.shop_code
            ?.toLowerCase()
            .includes(searchText) ||
          restaurant.cuisine
            ?.toLowerCase()
            .includes(searchText) ||
          restaurant.description
            ?.toLowerCase()
            .includes(searchText);

        const matchesPrice =
          priceFilter === "ALL" ||
          restaurant.price_range ===
            priceFilter;

        return (
          matchesSearch &&
          matchesPrice
        );
      }
    );

  // =====================================================
  // Logout
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem(
      "phoenix_token"
    );

    localStorage.removeItem(
      "phoenix_user"
    );

    navigate("/login");
  };

  // =====================================================
  // Render
  // =====================================================

  return (
    <div className="manager-page">

      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <aside className="manager-sidebar">

        <div className="manager-brand">

          <div className="manager-brand-name">
            PHOENIX
          </div>

          <div className="manager-brand-subtitle">
            Management Portal
          </div>

        </div>

        <nav className="manager-nav">

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager")
            }
          >
            <span className="nav-icon">
              ▣
            </span>

            <span>
              Dashboard
            </span>
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

            <span>
              Shops
            </span>

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

            <span>
              Tenants
            </span>

          </button>

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/leases")
            }
          >
            <span className="nav-icon">
              ▤
            </span>

            <span>
              Leases
            </span>

          </button>

          <button
            className="manager-nav-item"
            onClick={() =>
              navigate("/manager/invoices")
            }
          >
            <span className="nav-icon">
              ▥
            </span>

            <span>
              Invoices
            </span>

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

            <span>
              Payments
            </span>

          </button>

          <button
            className="manager-nav-item active"
          >
            <span className="nav-icon">
              🍽
            </span>

            <span>
              Restaurants
            </span>

          </button>

        </nav>

        <div className="manager-sidebar-bottom">

          <div className="manager-user">

            <div className="manager-avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() ||
                "M"}
            </div>

            <div className="manager-user-info">

              <strong>
                {user?.name ||
                  "Manager"}
              </strong>

              <span>
                {user?.role ||
                  "MANAGER"}
              </span>

            </div>

          </div>

          <button
            className="manager-logout"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </aside>

      {/* ================================================= */}
      {/* MAIN CONTENT */}
      {/* ================================================= */}

      <main className="manager-main">

        <div className="manager-topbar">

          <div>

            <h1>
              Restaurants
            </h1>

            <p>
              Manage restaurants and
              dining outlets in PHOENIX Mall.
            </p>

          </div>

          <button
            className="restaurant-add-button"
            onClick={openAddModal}
          >
            + Add Restaurant
          </button>

        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="restaurant-error">
            {error}
          </div>
        )}

        {/* ================================================= */}
        {/* CONTROLS */}
        {/* ================================================= */}

        <div className="restaurant-controls">

          <div className="restaurant-search">

            <span>
              ⌕
            </span>

            <input
              type="text"
              placeholder="Search restaurant, shop or cuisine..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
            />

          </div>

          <select
            value={priceFilter}
            onChange={(e) =>
              setPriceFilter(
                e.target.value
              )
            }
            className="restaurant-filter"
          >

            <option value="ALL">
              All Price Ranges
            </option>

            <option value="BUDGET">
              Budget
            </option>

            <option value="MODERATE">
              Moderate
            </option>

            <option value="PREMIUM">
              Premium
            </option>

          </select>

        </div>

        {/* ================================================= */}
        {/* SUMMARY */}
        {/* ================================================= */}

        <div className="restaurant-summary">

          <div>

            <span>
              Total Restaurants
            </span>

            <strong>
              {restaurants.length}
            </strong>

          </div>

          <div>

            <span>
              Budget
            </span>

            <strong>
              {
                restaurants.filter(
                  (r) =>
                    r.price_range ===
                    "BUDGET"
                ).length
              }
            </strong>

          </div>

          <div>

            <span>
              Moderate
            </span>

            <strong>
              {
                restaurants.filter(
                  (r) =>
                    r.price_range ===
                    "MODERATE"
                ).length
              }
            </strong>

          </div>

          <div>

            <span>
              Premium
            </span>

            <strong>
              {
                restaurants.filter(
                  (r) =>
                    r.price_range ===
                    "PREMIUM"
                ).length
              }
            </strong>

          </div>

        </div>

        {/* ================================================= */}
        {/* TABLE */}
        {/* ================================================= */}

        <div className="restaurant-table-container">

          {loading ? (

            <div className="restaurant-empty">
              Loading restaurants...
            </div>

          ) : filteredRestaurants.length === 0 ? (

            <div className="restaurant-empty">
              No restaurants found.
            </div>

          ) : (

            <table className="restaurant-table">

              <thead>

                <tr>

                  <th>
                    Restaurant
                  </th>

                  <th>
                    Shop
                  </th>

                  <th>
                    Floor
                  </th>

                  <th>
                    Cuisine
                  </th>

                  <th>
                    Price Range
                  </th>

                  <th>
                    Opening Hours
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredRestaurants.map(
                  (restaurant) => (

                    <tr
                      key={
                        restaurant.id
                      }
                    >

                      <td>

                        <div className="restaurant-name">
                          {
                            restaurant.shop_name
                          }
                        </div>

                        <div className="restaurant-description">
                          {
                            restaurant.description ||
                            "No description"
                          }
                        </div>

                      </td>

                      <td>

                        <span className="shop-code">
                          {
                            restaurant.shop_code
                          }
                        </span>

                      </td>

                      <td>

                        Floor{" "}
                        {
                          restaurant.floor
                        }

                      </td>

                      <td>

                        {
                          restaurant.cuisine
                        }

                      </td>

                      <td>

                        <span
                          className={`price-badge ${
                            (
                              restaurant.price_range ||
                              ""
                            ).toLowerCase()
                          }`}
                        >
                          {
                            restaurant.price_range
                          }
                        </span>

                      </td>

                      <td>

                        {
                          restaurant.opening_time
                        }

                        {" – "}

                        {
                          restaurant.closing_time
                        }

                      </td>

                      <td>

                        <div className="restaurant-actions">

                          <button
                            className="edit-button"
                            onClick={() =>
                              openEditModal(
                                restaurant
                              )
                            }
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              openDeleteModal(
                                restaurant
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

        </div>

      </main>

      {/* ================================================= */}
      {/* ADD / EDIT MODAL */}
      {/* ================================================= */}

      {showModal && (

        <div
          className="restaurant-modal-overlay"
          onClick={closeModal}
        >

          <div
            className="restaurant-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* Modal Header */}

            <div className="restaurant-modal-header">

              <div>

                <h2>
                  {editingRestaurant
                    ? "Edit Restaurant"
                    : "Add Restaurant"}
                </h2>

                <p>
                  {editingRestaurant
                    ? "Update restaurant and mall space information."
                    : "Add a new dining outlet to PHOENIX Mall."}
                </p>

              </div>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleSubmit}
            >

              {/* ================================================= */}
              {/* RESTAURANT INFORMATION */}
              {/* ================================================= */}

              <div className="restaurant-form-section">

                <div className="restaurant-form-section-title">
                  RESTAURANT INFORMATION
                </div>

                <div className="restaurant-form-grid">

                  <div className="form-group form-group-full">

                    <label>
                      Restaurant Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={
                        form.name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. The Pasta House"
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Cuisine *
                    </label>

                    <input
                      type="text"
                      name="cuisine"
                      value={
                        form.cuisine
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. Italian"
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Price Range *
                    </label>

                    <select
                      name="price_range"
                      value={
                        form.price_range
                      }
                      onChange={
                        handleChange
                      }
                      required
                    >

                      <option value="BUDGET">
                        Budget
                      </option>

                      <option value="MODERATE">
                        Moderate
                      </option>

                      <option value="PREMIUM">
                        Premium
                      </option>

                    </select>

                  </div>

                  <div className="form-group">

                    <label>
                      Opening Time *
                    </label>

                    <input
                      type="time"
                      name="opening_time"
                      value={
                        form.opening_time
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Closing Time *
                    </label>

                    <input
                      type="time"
                      name="closing_time"
                      value={
                        form.closing_time
                      }
                      onChange={
                        handleChange
                      }
                      required
                    />

                  </div>

                  <div className="form-group form-group-full">

                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      value={
                        form.description
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Describe the restaurant..."
                      rows="3"
                    />

                  </div>

                </div>

              </div>

              {/* ================================================= */}
              {/* MALL SPACE */}
              {/* ================================================= */}

              <div className="restaurant-form-section">

                <div className="restaurant-form-section-title">
                  MALL SPACE
                </div>

                <div className="restaurant-form-grid">

                  <div className="form-group">

                    <label>
                      Shop Code *
                    </label>

                    <input
                      type="text"
                      name="shop_code"
                      value={
                        form.shop_code
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. FB-306"
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Floor *
                    </label>

                    <input
                      type="text"
                      name="floor"
                      value={
                        form.floor
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. 2"
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Area (sq.ft) *
                    </label>

                    <input
                      type="number"
                      name="area_sqft"
                      value={
                        form.area_sqft
                      }
                      onChange={
                        handleChange
                      }
                      min="1"
                      placeholder="1800"
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Monthly Rent *
                    </label>

                    <input
                      type="number"
                      name="monthly_rent"
                      value={
                        form.monthly_rent
                      }
                      onChange={
                        handleChange
                      }
                      min="0"
                      step="0.01"
                      placeholder="150000"
                      required
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Shop Status *
                    </label>

                    <select
                      name="shop_status"
                      value={
                        form.shop_status
                      }
                      onChange={
                        handleChange
                      }
                      required
                    >

                      <option value="OCCUPIED">
                        Occupied
                      </option>

                      <option value="VACANT">
                        Vacant
                      </option>

                      <option value="MAINTENANCE">
                        Maintenance
                      </option>

                    </select>

                  </div>

                </div>

              </div>

              {/* ================================================= */}
              {/* FORM ACTIONS */}
              {/* ================================================= */}

              <div className="restaurant-modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-button"
                >
                  {editingRestaurant
                    ? "Update Restaurant"
                    : "Add Restaurant"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ================================================= */}

      {showDeleteModal &&
        restaurantToDelete && (

          <div
            className="delete-modal-overlay"
            onClick={closeDeleteModal}
          >

            <div
              className="delete-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* Icon */}

              <div className="delete-modal-icon">
                !
              </div>

              {/* Content */}

              <div className="delete-modal-content">

                <h2>
                  Delete Restaurant?
                </h2>

                <p>
                  Are you sure you want to
                  delete{" "}
                  <strong>
                    {
                      restaurantToDelete.shop_name
                    }
                  </strong>
                  ?
                </p>

                <div className="delete-modal-warning">
                  The restaurant listing will
                  be removed from the dining
                  section. The associated shop
                  will remain available in the
                  Shops module.
                </div>

              </div>

              {/* Actions */}

              <div className="delete-modal-actions">

                <button
                  type="button"
                  className="delete-cancel-button"
                  onClick={closeDeleteModal}
                  disabled={deleting}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="delete-confirm-button"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting
                    ? "Deleting..."
                    : "Delete Restaurant"}
                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}

export default ManagerRestaurants;