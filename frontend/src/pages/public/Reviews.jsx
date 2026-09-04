import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Reviews.css";

const API_URL = "http://127.0.0.1:8001";

function Stars({ rating }) {
  return (
    <span className="review-stars">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [restaurantFilter, setRestaurantFilter] = useState("All");

  useEffect(() => {
    fetch(`${API_URL}/reviews/public`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load reviews");
        }

        return response.json();
      })
      .then((data) => {
        setReviews(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to connect to the PHOENIX reviews directory.");
        setLoading(false);
      });
  }, []);

  const restaurants = useMemo(() => {
    return [
      "All",
      ...new Set(reviews.map((review) => review.restaurant_name)),
    ];
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    if (restaurantFilter === "All") {
      return reviews;
    }

    return reviews.filter(
      (review) => review.restaurant_name === restaurantFilter
    );
  }, [reviews, restaurantFilter]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return "0.0";

    const total = reviews.reduce(
      (sum, review) => sum + review.rating,
      0
    );

    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <div className="reviews-page">

      {/* NAVBAR */}

      <nav className="reviews-navbar">

        <Link to="/" className="reviews-logo">
          PHOENIX<span>.</span>
        </Link>

        <div className="reviews-nav-links">
          <Link to="/">Home</Link>
          <Link to="/stores">Stores</Link>
          <Link to="/dining">Dining</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/events">Events</Link>
          <Link to="/reviews" className="active">
            Reviews
          </Link>
        </div>

        <Link to="/login" className="reviews-login">
          Login
        </Link>

      </nav>

      {/* HERO */}

      <section className="reviews-hero">

        <div className="reviews-hero-content">

          <p className="reviews-eyebrow">
            THE PHOENIX EXPERIENCE
          </p>

          <h1>
            Loved by
            <br />
            <em>you.</em>
          </h1>

          <p>
            Discover what our visitors have to say about
            their experiences at PHOENIX.
          </p>

        </div>

      </section>

      {/* MAIN */}

      <main className="reviews-main">

        {/* SUMMARY */}

        <section className="reviews-summary">

          <div className="rating-number">
            <strong>{averageRating}</strong>
            <span>/ 5</span>
          </div>

          <div className="rating-stars">
            <Stars rating={Math.round(Number(averageRating))} />
            <p>Average visitor rating</p>
          </div>

          <div className="rating-total">
            <strong>{reviews.length}</strong>
            <span>reviews</span>
          </div>

        </section>

        <div className="reviews-heading">

          <div>
            <p className="section-label">
              VISITOR VOICES
            </p>

            <h2>
              Real experiences.
              <br />
              <em>Real people.</em>
            </h2>
          </div>

        </div>

        {/* FILTER */}

        <div className="reviews-filter">

          <span className="filter-label">
            RESTAURANT
          </span>

          <div className="review-filter-buttons">

            {restaurants.map((restaurant) => (
              <button
                key={restaurant}
                className={
                  restaurantFilter === restaurant
                    ? "selected"
                    : ""
                }
                onClick={() => setRestaurantFilter(restaurant)}
              >
                {restaurant}
              </button>
            ))}

          </div>

        </div>

        {/* LOADING */}

        {loading && (
          <div className="reviews-message">

            <div className="reviews-loader"></div>

            <p>
              Reading what our visitors have to say...
            </p>

          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="reviews-message">

            <h3>
              Something went wrong.
            </h3>

            <p>{error}</p>

          </div>
        )}

        {/* REVIEWS */}

        {!loading && !error && filteredReviews.length > 0 && (

          <div className="reviews-grid">

            {filteredReviews.map((review, index) => (

              <article
                className="review-card"
                key={review.id}
              >

                <div className="review-card-top">

                  <span className="review-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <Stars rating={review.rating} />

                </div>

                <div className="review-quote">
                  “
                </div>

                <p className="review-comment">
                  {review.comment}
                </p>

                <div className="review-footer">

                  <div>
                    <strong>
                      {review.customer_name}
                    </strong>

                    <span>
                      Visitor
                    </span>
                  </div>

                  <div className="review-restaurant">
                    {review.restaurant_name}
                  </div>

                </div>

              </article>

            ))}

          </div>

        )}

        {!loading &&
          !error &&
          filteredReviews.length === 0 && (

            <div className="reviews-message">
              <h3>No reviews found.</h3>
              <p>
                Try selecting another restaurant.
              </p>
            </div>

          )}

      </main>

      {/* FOOTER */}

      <footer className="reviews-footer">

        <div className="reviews-logo">
          PHOENIX<span>.</span>
        </div>

        <p>
          Shopping, dining and extraordinary experiences.
        </p>

        <div className="reviews-footer-links">
          <Link to="/">Home</Link>
          <Link to="/stores">Stores</Link>
          <Link to="/dining">Dining</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/events">Events</Link>
        </div>

        <small>
          © 2026 PHOENIX
        </small>

      </footer>

    </div>
  );
}

export default Reviews;