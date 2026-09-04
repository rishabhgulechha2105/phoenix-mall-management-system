import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerShops.css";

const API_URL = "http://127.0.0.1:8001";

const EMPTY_FORM = {
  shop_code: "",
  name: "",
  category_id: "",
  floor: "",
  area_sqft: "",
  monthly_rent: "",
  status: "VACANT",
};

function ManagerShops() {
  const navigate = useNavigate();

  const [shops, setShops] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingShop, setEditingShop] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteShop, setDeleteShop] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const token = localStorage.getItem("phoenix_token");

  // =========================
  // AUTH + INITIAL LOAD
  // =========================

  useEffect(() => {
    const storedUser = localStorage.getItem("phoenix_user");

    if (!token || !storedUser) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);

      if (
        user.role !== "ADMIN" &&
        user.role !== "MANAGER"
      ) {
        navigate("/login");
        return;
      }
    } catch {
      localStorage.removeItem("phoenix_token");
      localStorage.removeItem("phoenix_user");
      navigate("/login");
      return;
    }

    fetchShops();
    fetchCategories();
  }, [navigate]);

  // =========================
  // AUTH FAILURE
  // =========================

  const handleAuthFailure = () => {
    localStorage.removeItem("phoenix_token");
    localStorage.removeItem("phoenix_user");
    navigate("/login");
  };

  // =========================
  // FETCH SHOPS
  // =========================

  const fetchShops = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/manager/shops/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleAuthFailure();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load shops."
        );
      }

      setShops(data);
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
  // FETCH CATEGORIES
  // =========================

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);

      /*
       * Manager-protected category endpoint.
       *
       * IMPORTANT:
       * This is NOT /categories/
       *
       * The backend route is:
       * /manager/shops/categories/
       */

      const response = await fetch(
        `${API_URL}/manager/shops/categories/`,
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
        handleAuthFailure();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to load categories."
        );
      }

      if (Array.isArray(data)) {
        setCategories(data);
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.error(
        "Category loading error:",
        err
      );

      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  // =========================
  // FILTER SHOPS
  // =========================

  const filteredShops = useMemo(() => {
    const query = search.trim().toLowerCase();

    return shops.filter((shop) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        shop.status === statusFilter;

      const matchesSearch =
        !query ||
        shop.shop_code
          .toLowerCase()
          .includes(query) ||
        shop.name
          .toLowerCase()
          .includes(query) ||
        (shop.category_name || "")
          .toLowerCase()
          .includes(query) ||
        shop.floor
          .toLowerCase()
          .includes(query);

      return (
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    shops,
    search,
    statusFilter,
  ]);

  // =========================
  // SHOP COUNTS
  // =========================

  const counts = useMemo(() => {
    return {
      total: shops.length,

      occupied: shops.filter(
        (shop) =>
          shop.status === "OCCUPIED"
      ).length,

      vacant: shops.filter(
        (shop) =>
          shop.status === "VACANT"
      ).length,

      maintenance: shops.filter(
        (shop) =>
          shop.status === "MAINTENANCE"
      ).length,
    };
  }, [shops]);

  // =========================
  // CURRENCY
  // =========================

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(value || 0);
  };

  // =========================
  // FORM CHANGE
  // =========================

  const handleFormChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");
  };

  // =========================
  // OPEN ADD MODAL
  // =========================

  const openAddModal = () => {
    setEditingShop(null);

    setForm({
      ...EMPTY_FORM,

      category_id:
        categories.length > 0
          ? String(categories[0].id)
          : "",
    });

    setFormError("");
    setShowModal(true);
  };

  // =========================
  // OPEN EDIT MODAL
  // =========================

  const openEditModal = (shop) => {
    setEditingShop(shop);

    setForm({
      shop_code:
        shop.shop_code || "",

      name:
        shop.name || "",

      category_id:
        String(
          shop.category_id || ""
        ),

      floor:
        shop.floor || "",

      area_sqft:
        String(
          shop.area_sqft || ""
        ),

      monthly_rent:
        String(
          shop.monthly_rent || ""
        ),

      status:
        shop.status || "VACANT",
    });

    setFormError("");
    setShowModal(true);
  };

  // =========================
  // CLOSE MODAL
  // =========================

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingShop(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  // =========================
  // SAVE SHOP
  // =========================

  const handleSaveShop = async (event) => {
    event.preventDefault();

    setFormError("");

    // -------------------------
    // VALIDATION
    // -------------------------

    if (!form.shop_code.trim()) {
      setFormError(
        "Shop code is required."
      );
      return;
    }

    if (!form.name.trim()) {
      setFormError(
        "Shop name is required."
      );
      return;
    }

    if (!form.category_id) {
      setFormError(
        "Please select a category."
      );
      return;
    }

    if (!form.floor.trim()) {
      setFormError(
        "Floor is required."
      );
      return;
    }

    if (
      !form.area_sqft ||
      Number(form.area_sqft) <= 0
    ) {
      setFormError(
        "Area must be greater than zero."
      );
      return;
    }

    if (
      form.monthly_rent === "" ||
      Number(form.monthly_rent) < 0
    ) {
      setFormError(
        "Monthly rent cannot be negative."
      );
      return;
    }

    // -------------------------
    // REQUEST PAYLOAD
    // -------------------------

    const payload = {
      shop_code:
        form.shop_code.trim(),

      name:
        form.name.trim(),

      category_id:
        Number(form.category_id),

      floor:
        form.floor.trim(),

      area_sqft:
        Number(form.area_sqft),

      monthly_rent:
        Number(form.monthly_rent),

      status:
        form.status,
    };

    try {
      setSaving(true);

      const url = editingShop
        ? `${API_URL}/manager/shops/${editingShop.id}`
        : `${API_URL}/manager/shops/`;

      const method = editingShop
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            payload
          ),
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleAuthFailure();
        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            `Unable to ${
              editingShop
                ? "update"
                : "create"
            } shop.`
        );
      }

      // -------------------------
      // UPDATE EXISTING SHOP
      // -------------------------

      if (editingShop) {
        setShops(
          (previous) =>
            previous.map(
              (shop) =>
                shop.id === data.id
                  ? data
                  : shop
            )
        );
      }

      // -------------------------
      // ADD NEW SHOP
      // -------------------------

      else {
        setShops(
          (previous) => [
            ...previous,
            data,
          ]
        );
      }

      closeModal();

    } catch (err) {
      setFormError(
        err.message ||
          "Something went wrong while saving the shop."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // DELETE SHOP
  // =========================

  const handleDeleteShop = async () => {
    if (!deleteShop) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `${API_URL}/manager/shops/${deleteShop.id}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        handleAuthFailure();
        return;
      }

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Unable to delete this shop."
        );
      }

      setShops(
        (previous) =>
          previous.filter(
            (shop) =>
              shop.id !==
              deleteShop.id
          )
      );

      setDeleteShop(null);

    } catch (err) {
      alert(
        err.message ||
          "Unable to delete this shop."
      );
    } finally {
      setDeleting(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem(
      "phoenix_token"
    );

    localStorage.removeItem(
      "phoenix_user"
    );

    navigate("/login");
  };

  // =========================
  // DASHBOARD
  // =========================

  const goDashboard = () => {
    navigate("/manager");
  };

  // =========================
  // LOADING
  // =========================

  if (loading) {
    return (
      <div className="manager-loading">

        <div className="manager-loader"></div>

        <p>
          Loading PHOENIX shops...
        </p>

      </div>
    );
  }

  // =========================
  // PAGE
  // =========================

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
            onClick={goDashboard}
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
            className="manager-nav-item active"
          >
            <span className="nav-icon">
              ▦
            </span>

            <span>
              Shops
            </span>
          </button>

          {/* TENANTS */}

          <button className="manager-nav-item">
            <span className="nav-icon">
              ♙
            </span>

            <span>
              Tenants
            </span>
          </button>

          {/* LEASES */}

          <button className="manager-nav-item">
            <span className="nav-icon">
              ◫
            </span>

            <span>
              Leases
            </span>
          </button>

          {/* INVOICES */}

          <button className="manager-nav-item">
            <span className="nav-icon">
              ▤
            </span>

            <span>
              Invoices
            </span>
          </button>

          {/* PAYMENTS */}

          <button className="manager-nav-item">
            <span className="nav-icon">
              ₹
            </span>

            <span>
              Payments
            </span>
          </button>

          {/* RESTAURANTS */}

          <button className="manager-nav-item">
            <span className="nav-icon">
              ◉
            </span>

            <span>
              Restaurants
            </span>
          </button>

          {/* OFFERS */}

          <button className="manager-nav-item">
            <span className="nav-icon">
              %
            </span>

            <span>
              Offers
            </span>
          </button>

          {/* REVIEWS */}

          <button className="manager-nav-item">
            <span className="nav-icon">
              ★
            </span>

            <span>
              Reviews
            </span>
          </button>

          {/* SALES */}

          <button className="manager-nav-item">
            <span className="nav-icon">
              ⌁
            </span>

            <span>
              Sales
            </span>
          </button>

          {/* REPORTS */}

          <button className="manager-nav-item">
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
              P
            </div>

            <div className="manager-user-info">

              <strong>
                PHOENIX Manager
              </strong>

              <span>
                MANAGEMENT
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
          MAIN
      ========================= */}

      <main className="manager-main">

        {/* =========================
            TOP BAR
        ========================= */}

        <header className="manager-topbar">

          <div>

            <p className="manager-breadcrumb">
              PHOENIX / MANAGEMENT / SHOPS
            </p>

            <h1>
              Shops
            </h1>

          </div>

          <div className="manager-topbar-right">

            <div className="manager-date">

              <span className="date-dot"></span>

              SYSTEM ONLINE

            </div>

            <div className="topbar-avatar">
              P
            </div>

          </div>

        </header>

        {/* =========================
            PAGE INTRO
        ========================= */}

        <section className="shops-intro">

          <div>

            <p className="shops-eyebrow">
              MALL OPERATIONS
            </p>

            <h2>
              Manage your
              <br />
              <em>
                retail spaces.
              </em>
            </h2>

            <p>
              View occupancy, tenant
              spaces and commercial
              details across PHOENIX.
            </p>

          </div>

          <button
            className="add-shop-button"
            onClick={openAddModal}
          >
            <span>
              +
            </span>

            ADD SHOP
          </button>

        </section>

        {/* =========================
            ERROR
        ========================= */}

        {error && (
          <div className="shops-error">

            <span>
              !
            </span>

            {error}

            <button
              onClick={fetchShops}
            >
              RETRY
            </button>

          </div>
        )}

        {/* =========================
            SUMMARY
        ========================= */}

        <section className="shop-summary">

          <div className="shop-summary-card active">

            <span>
              TOTAL SHOPS
            </span>

            <strong>
              {counts.total}
            </strong>

          </div>

          <div className="shop-summary-card occupied">

            <span>
              OCCUPIED
            </span>

            <strong>
              {counts.occupied}
            </strong>

          </div>

          <div className="shop-summary-card vacant">

            <span>
              VACANT
            </span>

            <strong>
              {counts.vacant}
            </strong>

          </div>

          <div className="shop-summary-card maintenance">

            <span>
              MAINTENANCE
            </span>

            <strong>
              {counts.maintenance}
            </strong>

          </div>

        </section>

        {/* =========================
            TABLE CARD
        ========================= */}

        <section className="shops-table-card">

          {/* TOOLBAR */}

          <div className="shops-toolbar">

            <div className="shops-search">

              <span>
                ⌕
              </span>

              <input
                type="text"
                placeholder="Search shop, brand, category or floor..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              {search && (
                <button
                  className="clear-search"
                  onClick={() =>
                    setSearch("")
                  }
                >
                  ×
                </button>
              )}

            </div>

            {/* FILTERS */}

            <div className="shop-filters">

              <button
                className={
                  statusFilter === "ALL"
                    ? "filter-button active"
                    : "filter-button"
                }
                onClick={() =>
                  setStatusFilter("ALL")
                }
              >
                All
              </button>

              <button
                className={
                  statusFilter === "OCCUPIED"
                    ? "filter-button active"
                    : "filter-button"
                }
                onClick={() =>
                  setStatusFilter(
                    "OCCUPIED"
                  )
                }
              >
                Occupied
              </button>

              <button
                className={
                  statusFilter === "VACANT"
                    ? "filter-button active"
                    : "filter-button"
                }
                onClick={() =>
                  setStatusFilter(
                    "VACANT"
                  )
                }
              >
                Vacant
              </button>

              <button
                className={
                  statusFilter === "MAINTENANCE"
                    ? "filter-button active"
                    : "filter-button"
                }
                onClick={() =>
                  setStatusFilter(
                    "MAINTENANCE"
                  )
                }
              >
                Maintenance
              </button>

            </div>

          </div>

          {/* TABLE */}

          <div className="shops-table-wrapper">

            <table className="shops-table">

              <thead>

                <tr>

                  <th>
                    SHOP
                  </th>

                  <th>
                    CATEGORY
                  </th>

                  <th>
                    FLOOR
                  </th>

                  <th>
                    AREA
                  </th>

                  <th>
                    MONTHLY RENT
                  </th>

                  <th>
                    STATUS
                  </th>

                  <th></th>

                </tr>

              </thead>

              <tbody>

                {filteredShops.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="empty-shops"
                    >

                      <div>

                        <span>
                          ⌕
                        </span>

                        <strong>
                          No shops found
                        </strong>

                        <p>
                          Try changing
                          your search
                          or filter.
                        </p>

                      </div>

                    </td>

                  </tr>

                ) : (

                  filteredShops.map(
                    (shop) => (

                      <tr
                        key={shop.id}
                      >

                        <td>

                          <div className="shop-identity">

                            <div className="shop-code">
                              {shop.shop_code}
                            </div>

                            <div>

                              <strong>
                                {shop.name}
                              </strong>

                              <span>
                                ID #{shop.id}
                              </span>

                            </div>

                          </div>

                        </td>

                        <td>

                          <span className="category-text">
                            {shop.category_name ||
                              "—"}
                          </span>

                        </td>

                        <td>

                          <span className="floor-badge">
                            Floor {shop.floor}
                          </span>

                        </td>

                        <td>

                          <span className="area-text">

                            {Number(
                              shop.area_sqft
                            ).toLocaleString(
                              "en-IN"
                            )}{" "}
                            sq ft

                          </span>

                        </td>

                        <td>

                          <strong className="rent-text">

                            {formatCurrency(
                              shop.monthly_rent
                            )}

                          </strong>

                        </td>

                        <td>

                          <span
                            className={`shop-status ${shop.status.toLowerCase()}`}
                          >

                            <span></span>

                            {shop.status}

                          </span>

                        </td>

                        <td>

                          <div className="shop-actions">

                            <button
                              title="Edit shop"
                              onClick={() =>
                                openEditModal(
                                  shop
                                )
                              }
                            >
                              ✎
                            </button>

                            <button
                              title="Delete shop"
                              className="delete-action"
                              onClick={() =>
                                setDeleteShop(
                                  shop
                                )
                              }
                            >
                              ×
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

          {/* TABLE FOOTER */}

          <div className="shops-table-footer">

            <span>

              Showing{" "}

              <strong>
                {filteredShops.length}
              </strong>{" "}

              of{" "}

              <strong>
                {shops.length}
              </strong>{" "}

              shops

            </span>

            <span>
              PHOENIX MALL · SHOP DIRECTORY
            </span>

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

      {/* =========================
          ADD / EDIT MODAL
      ========================= */}

      {showModal && (

        <div
          className="modal-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }

          }}
        >

          <div className="shop-modal">

            {/* MODAL HEADER */}

            <div className="modal-header">

              <div>

                <p>
                  {editingShop
                    ? "UPDATE SPACE"
                    : "NEW SPACE"}
                </p>

                <h2>

                  {editingShop
                    ? "Edit Shop"
                    : "Add Shop"}

                </h2>

              </div>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>

            </div>

            {/* FORM ERROR */}

            {formError && (
              <div className="form-error">
                {formError}
              </div>
            )}

            {/* FORM */}

            <form
              className="shop-form"
              onSubmit={
                handleSaveShop
              }
            >

              <div className="form-grid">

                {/* SHOP CODE */}

                <div className="shop-form-field">

                  <label>
                    SHOP CODE
                  </label>

                  <input
                    name="shop_code"
                    value={
                      form.shop_code
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="e.g. F-101"
                    disabled={saving}
                  />

                </div>

                {/* NAME */}

                <div className="shop-form-field">

                  <label>
                    SHOP / BRAND NAME
                  </label>

                  <input
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="e.g. Zara"
                    disabled={saving}
                  />

                </div>

                {/* CATEGORY */}

                <div className="shop-form-field">

                  <label>
                    CATEGORY
                  </label>

                  <select
                    name="category_id"
                    value={
                      form.category_id
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      saving ||
                      categoriesLoading ||
                      categories.length ===
                        0
                    }
                  >

                    <option value="">

                      {categoriesLoading
                        ? "Loading categories..."
                        : categories.length ===
                            0
                        ? "No categories available"
                        : "Select category"}

                    </option>

                    {categories.map(
                      (category) => (

                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {category.name}
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* FLOOR */}

                <div className="shop-form-field">

                  <label>
                    FLOOR
                  </label>

                  <input
                    name="floor"
                    value={
                      form.floor
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="e.g. 1"
                    disabled={saving}
                  />

                </div>

                {/* AREA */}

                <div className="shop-form-field">

                  <label>
                    AREA (SQ FT)
                  </label>

                  <input
                    name="area_sqft"
                    type="number"
                    min="1"
                    step="0.01"
                    value={
                      form.area_sqft
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="e.g. 1200"
                    disabled={saving}
                  />

                </div>

                {/* RENT */}

                <div className="shop-form-field">

                  <label>
                    MONTHLY RENT (₹)
                  </label>

                  <input
                    name="monthly_rent"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.monthly_rent
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="e.g. 150000"
                    disabled={saving}
                  />

                </div>

                {/* STATUS */}

                <div className="shop-form-field full-width">

                  <label>
                    STATUS
                  </label>

                  <select
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={saving}
                  >

                    <option value="VACANT">
                      VACANT
                    </option>

                    <option value="OCCUPIED">
                      OCCUPIED
                    </option>

                    <option value="MAINTENANCE">
                      MAINTENANCE
                    </option>

                  </select>

                </div>

              </div>

              {/* MODAL ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  className="save-button"
                  disabled={saving}
                >

                  {saving
                    ? "SAVING..."
                    : editingShop
                    ? "UPDATE SHOP"
                    : "CREATE SHOP"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =========================
          DELETE CONFIRMATION
      ========================= */}

      {deleteShop && (

        <div className="modal-overlay">

          <div className="delete-modal">

            <div className="delete-icon">
              !
            </div>

            <p className="delete-eyebrow">
              DELETE SHOP
            </p>

            <h2>

              Remove{" "}

              <em>
                {deleteShop.name}
              </em>
              ?

            </h2>

            <p>

              This will permanently
              remove shop{" "}

              <strong>
                {deleteShop.shop_code}
              </strong>{" "}

              from the system. If it
              has existing leases or
              related records, the
              system will prevent
              deletion.

            </p>

            <div className="delete-actions">

              <button
                className="cancel-button"
                onClick={() =>
                  setDeleteShop(null)
                }
                disabled={deleting}
              >
                CANCEL
              </button>

              <button
                className="confirm-delete"
                onClick={
                  handleDeleteShop
                }
                disabled={deleting}
              >

                {deleting
                  ? "DELETING..."
                  : "DELETE SHOP"}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default ManagerShops;