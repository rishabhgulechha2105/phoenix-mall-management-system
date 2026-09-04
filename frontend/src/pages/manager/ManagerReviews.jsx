import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerReviews.css";

const API_URL = "http://127.0.0.1:8001";

function ManagerReviews() {
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  const [form, setForm] = useState({
    restaurant_id: "",
    customer_name: "",
    rating: 5,
    comment: "",
  });

  const token = localStorage.getItem("phoenix_token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    fetchReviews();
    fetchRestaurants();
  }, []);

  async function fetchReviews() {
    try {
      const response = await fetch(`${API_URL}/manager/reviews/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchRestaurants() {
    try {
      const response = await fetch(`${API_URL}/manager/restaurants/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch restaurants");
      }

      const data = await response.json();
      setRestaurants(data);
    } catch (error) {
      console.error(error);
    }
  }

  function openAddModal() {
    setEditingReview(null);

    setForm({
      restaurant_id: "",
      customer_name: "",
      rating: 5,
      comment: "",
    });

    setShowModal(true);
  }

  function openEditModal(review) {
    setEditingReview(review);

    setForm({
      restaurant_id: review.restaurant_id,
      customer_name: review.customer_name,
      rating: review.rating,
      comment: review.comment || "",
    });

    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingReview(null);
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

    if (!form.restaurant_id) {
      alert("Please select a restaurant.");
      return;
    }

    if (!form.customer_name.trim()) {
      alert("Please enter the customer name.");
      return;
    }

    const payload = {
      restaurant_id: Number(form.restaurant_id),
      customer_name: form.customer_name.trim(),
      rating: Number(form.rating),
      comment: form.comment.trim(),
    };

    try {
      const url = editingReview
        ? `${API_URL}/manager/reviews/${editingReview.id}`
        : `${API_URL}/manager/reviews/`;

      const method = editingReview ? "PUT" : "POST";

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
        throw new Error(data.detail || "Failed to save review");
      }

      closeModal();
      fetchReviews();
    } catch (error) {
      alert(error.message);
    }
  }

  async function handleDelete(review) {
    const confirmed = window.confirm(
      `Delete the review by ${review.customer_name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/manager/reviews/${review.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to delete review");
      }

      fetchReviews();
    } catch (error) {
      alert(error.message);
    }
  }

  const filteredReviews = useMemo(() => {
    const query = search.toLowerCase().trim();

    return reviews.filter((review) => {
      const matchesSearch =
        !query ||
        review.customer_name?.toLowerCase().includes(query) ||
        review.restaurant_name?.toLowerCase().includes(query) ||
        review.shop_code?.toLowerCase().includes(query) ||
        review.comment?.toLowerCase().includes(query);

      const matchesRating =
        ratingFilter === "ALL" ||
        Number(review.rating) === Number(ratingFilter);

      return matchesSearch && matchesRating;
    });
  }, [reviews, search, ratingFilter]);

  const totalReviews = reviews.length;

  const averageRating =
    totalReviews > 0
      ? (
          reviews.reduce(
            (total, review) => total + Number(review.rating),
            0
          ) / totalReviews
        ).toFixed(1)
      : "0.0";

  const fiveStarReviews = reviews.filter(
    (review) => Number(review.rating) === 5
  ).length;

  const oneTwoStarReviews = reviews.filter(
    (review) => Number(review.rating) <= 2
  ).length;

  function renderStars(rating) {
    return (
      <span className="review-stars">
        {"★".repeat(Number(rating))}
        <span className="empty-stars">
          {"★".repeat(5 - Number(rating))}
        </span>
      </span>
    );
  }

  return (
    <div className="manager-page">
      <header className="manager-page-header">
        <div>
          <div className="manager-breadcrumb">PHOENIX / MANAGEMENT</div>
          <h1>Reviews</h1>
        </div>

        <div className="manager-status">
          <span className="status-dot"></span>
          <span>SYSTEM ONLINE</span>
          <div className="manager-avatar">R</div>
        </div>
      </header>

      <main className="reviews-content">
        <section className="reviews-heading">
          <div>
            <div className="section-eyebrow">CUSTOMER FEEDBACK</div>
            <h2>Restaurant Reviews</h2>
            <p>
              Review and manage customer feedback across PHOENIX dining
              outlets.
            </p>
          </div>

          <button className="primary-button" onClick={openAddModal}>
            + Add Review
          </button>
        </section>

        <section className="reviews-toolbar">
          <div className="search-box">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search reviews, customers or restaurants..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={ratingFilter}
            onChange={(event) => setRatingFilter(event.target.value)}
          >
            <option value="ALL">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </section>

        <section className="review-stat-grid">
          <div className="review-stat-card">
            <span>Total Reviews</span>
            <strong>{totalReviews}</strong>
          </div>

          <div className="review-stat-card">
            <span>Average Rating</span>
            <strong>{averageRating}</strong>
          </div>

          <div className="review-stat-card">
            <span>5-Star Reviews</span>
            <strong>{fiveStarReviews}</strong>
          </div>

          <div className="review-stat-card">
            <span>1–2 Star Reviews</span>
            <strong>{oneTwoStarReviews}</strong>
          </div>
        </section>

        <section className="reviews-table-card">
          <div className="reviews-table-header">
            <div>REVIEW</div>
            <div>RESTAURANT</div>
            <div>RATING</div>
            <div>DATE</div>
            <div>ACTIONS</div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="empty-reviews">
              <h3>No reviews found</h3>
              <p>
                Try changing your search or rating filter, or add a new
                review.
              </p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div className="review-row" key={review.id}>
                <div className="review-main">
                  <strong>{review.customer_name}</strong>

                  <p>
                    {review.comment || "No comment provided."}
                  </p>
                </div>

                <div className="review-restaurant">
                  <strong>{review.restaurant_name}</strong>
                  <span>
                    {review.shop_code} · Floor {review.floor}
                  </span>
                </div>

                <div className="review-rating">
                  {renderStars(review.rating)}
                  <span>{review.rating}/5</span>
                </div>

                <div className="review-date">
                  {review.created_at
                    ? new Date(review.created_at).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      )
                    : "—"}
                </div>

                <div className="review-actions">
                  <button
                    className="edit-button"
                    onClick={() => openEditModal(review)}
                  >
                    Edit
                  </button>

                  <button
                    className="delete-button"
                    onClick={() => handleDelete(review)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="review-modal">
            <div className="modal-header">
              <div>
                <div className="modal-eyebrow">
                  {editingReview ? "EDIT FEEDBACK" : "NEW FEEDBACK"}
                </div>

                <h2>
                  {editingReview ? "Edit Review" : "Add Review"}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-body">
                <div className="form-group">
                  <label>
                    Restaurant <span>*</span>
                  </label>

                  <select
                    name="restaurant_id"
                    value={form.restaurant_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select restaurant</option>

                    {restaurants.map((restaurant) => (
                      <option
                        key={restaurant.id}
                        value={restaurant.id}
                      >
                        {restaurant.shop_name} — {restaurant.shop_code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Customer Name <span>*</span>
                    </label>

                    <input
                      type="text"
                      name="customer_name"
                      placeholder="Enter customer name"
                      value={form.customer_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      Rating <span>*</span>
                    </label>

                    <select
                      name="rating"
                      value={form.rating}
                      onChange={handleChange}
                      required
                    >
                      <option value={5}>5 — Excellent</option>
                      <option value={4}>4 — Good</option>
                      <option value={3}>3 — Average</option>
                      <option value={2}>2 — Poor</option>
                      <option value={1}>1 — Very Poor</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Comment</label>

                  <textarea
                    name="comment"
                    placeholder="Write the customer review..."
                    value={form.comment}
                    onChange={handleChange}
                    rows={5}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button type="submit" className="primary-button">
                  {editingReview ? "Save Changes" : "Add Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerReviews;