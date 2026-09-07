import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Dining.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

function formatPriceRange(range) {
  if (range === "BUDGET") return "₹";
  if (range === "MODERATE") return "₹₹";
  if (range === "PREMIUM") return "₹₹₹";
  return "₹₹";
}

function formatTime(time) {
  if (!time) return "";

  const [hourString, minute] = time.split(":");
  let hour = Number(hourString);

  const period = hour >= 12 ? "PM" : "AM";

  hour = hour % 12 || 12;

  return `${hour}:${minute} ${period}`;
}

function Dining() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [priceFilter, setPriceFilter] = useState("All");

  useEffect(() => {
    fetch(`${API_URL}/restaurants/public`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load restaurants");
        }

        return response.json();
      })
      .then((data) => {
        setRestaurants(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to connect to the PHOENIX dining directory.");
        setLoading(false);
      });
  }, []);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((restaurant) => {
      const searchValue = search.toLowerCase();

      const matchesSearch =
        restaurant.name.toLowerCase().includes(searchValue) ||
        restaurant.cuisine.toLowerCase().includes(searchValue) ||
        restaurant.description?.toLowerCase().includes(searchValue);

      const matchesPrice =
        priceFilter === "All" ||
        restaurant.price_range === priceFilter;

      return matchesSearch && matchesPrice;
    });
  }, [restaurants, search, priceFilter]);

  return (
    <div className="dining-page">

      {/* NAVBAR */}

      <nav className="dining-navbar">

        <Link to="/" className="dining-logo">
          PHOENIX<span>.</span>
        </Link>

        <div className="dining-nav-links">
          <Link to="/">Home</Link>
          <Link to="/stores">Stores</Link>
          <Link to="/dining" className="active">
            Dining
          </Link>
          <Link to="/offers">Offers</Link>
          <Link to="/events">Events</Link>
          <Link to="/reviews">Reviews</Link>
        </div>

        <Link to="/login" className="dining-login">
          Login
        </Link>

      </nav>

      {/* HERO */}

      <section className="dining-hero">

        <div className="dining-hero-content">

          <p className="dining-eyebrow">
            DINE AT PHOENIX
          </p>

          <h1>
            Come hungry.
            <br />
            <em>Leave delighted.</em>
          </h1>

          <p>
            From quick bites to memorable dining experiences,
            discover flavours for every mood at PHOENIX.
          </p>

        </div>

      </section>

      {/* MAIN */}

      <main className="dining-main">

        <div className="dining-heading">

          <div>
            <p className="section-label">
              FOOD & BEVERAGES
            </p>

            <h2>
              Taste something
              <br />
              <em>extraordinary.</em>
            </h2>
          </div>

          <div className="restaurant-count">
            <strong>{filteredRestaurants.length}</strong>
            <span>restaurants</span>
          </div>

        </div>

        {/* SEARCH */}

        <div className="dining-search">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Search restaurants, cuisines..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button onClick={() => setSearch("")}>
              ×
            </button>
          )}

        </div>

        {/* FILTER */}

        <div className="dining-filters">

          <span className="filter-label">
            PRICE
          </span>

          {[
            ["All", "All"],
            ["BUDGET", "₹ Budget"],
            ["MODERATE", "₹₹ Moderate"],
            ["PREMIUM", "₹₹₹ Premium"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={
                priceFilter === value
                  ? "selected"
                  : ""
              }
              onClick={() => setPriceFilter(value)}
            >
              {label}
            </button>
          ))}

        </div>

        {/* LOADING */}

        {loading && (
          <div className="dining-message">

            <div className="dining-loader"></div>

            <p>
              Discovering places to eat...
            </p>

          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="dining-message">

            <h3>
              Something went wrong.
            </h3>

            <p>{error}</p>

          </div>
        )}

        {/* RESTAURANTS */}

        {!loading && !error && (
          <>
            {filteredRestaurants.length > 0 ? (

              <div className="restaurant-grid">

                {filteredRestaurants.map(
                  (restaurant, index) => (

                    <article
                      className="restaurant-card"
                      key={restaurant.id}
                    >

                      <div className="restaurant-image">

                        <div className="restaurant-number">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div className="restaurant-price">
                          {formatPriceRange(
                            restaurant.price_range
                          )}
                        </div>

                      </div>

                      <div className="restaurant-content">

                        <p className="restaurant-cuisine">
                          {restaurant.cuisine}
                        </p>

                        <h3>
                          {restaurant.name}
                        </h3>

                        <p className="restaurant-description">
                          {restaurant.description}
                        </p>

                        <div className="restaurant-details">

                          <div>
                            <span className="detail-label">
                              HOURS
                            </span>

                            <span>
                              {formatTime(
                                restaurant.opening_time
                              )}
                              {" — "}
                              {formatTime(
                                restaurant.closing_time
                              )}
                            </span>
                          </div>

                          <div>
                            <span className="detail-label">
                              LOCATION
                            </span>

                            <span>
                              Floor {restaurant.floor}
                              {" · "}
                              {restaurant.shop_code}
                            </span>
                          </div>

                        </div>

                      </div>

                      <div className="restaurant-arrow">
                        →
                      </div>

                    </article>

                  )
                )}

              </div>

            ) : (

              <div className="no-dining-results">

                <span>⌕</span>

                <h3>
                  No restaurants found
                </h3>

                <p>
                  Try another search or price range.
                </p>

                <button
                  onClick={() => {
                    setSearch("");
                    setPriceFilter("All");
                  }}
                >
                  Clear filters
                </button>

              </div>

            )}
          </>
        )}

      </main>

      {/* FOOTER */}

      <footer className="dining-footer">

        <div className="dining-footer-brand">

          <div className="dining-logo">
            PHOENIX<span>.</span>
          </div>

          <p>
            Your destination for shopping,
            dining and extraordinary experiences.
          </p>

        </div>

        <div className="dining-footer-links">
          <Link to="/">Home</Link>
          <Link to="/stores">Stores</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/events">Events</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="dining-footer-bottom">
          <span>© 2026 PHOENIX</span>
          <span>Experience Extraordinary.</span>
        </div>

      </footer>

    </div>
  );
}

export default Dining;