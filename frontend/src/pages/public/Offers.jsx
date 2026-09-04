import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Offers.css";

const API_URL = "http://127.0.0.1:8001";

function Offers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/offers/public`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load offers");
        }
        return response.json();
      })
      .then((data) => {
        setOffers(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to connect to the PHOENIX offers directory.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="offers-page">

      <nav className="offers-navbar">
        <Link to="/" className="offers-logo">
          PHOENIX<span>.</span>
        </Link>

        <div className="offers-nav-links">
          <Link to="/">Home</Link>
          <Link to="/stores">Stores</Link>
          <Link to="/dining">Dining</Link>
          <Link to="/offers" className="active">Offers</Link>
          <Link to="/events">Events</Link>
          <Link to="/reviews">Reviews</Link>
        </div>

        <Link to="/login" className="offers-login">
          Login
        </Link>
      </nav>

      <section className="offers-hero">
        <div>
          <p>EXCLUSIVE AT PHOENIX</p>

          <h1>
            Something
            <br />
            <em>extraordinary.</em>
          </h1>

          <span>
            Discover the latest offers, experiences and
            special moments waiting for you.
          </span>
        </div>
      </section>

      <main className="offers-main">

        <div className="offers-heading">
          <div>
            <p>PHOENIX SPECIALS</p>
            <h2>
              Don't miss
              <br />
              <em>out.</em>
            </h2>
          </div>

          <div className="offers-count">
            <strong>{offers.length}</strong>
            <span>active offers</span>
          </div>
        </div>

        {loading && (
          <div className="offers-message">
            <div className="offers-loader"></div>
            <p>Finding today's offers...</p>
          </div>
        )}

        {!loading && error && (
          <div className="offers-message">
            <h3>Something went wrong.</h3>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && offers.length > 0 && (
          <div className="offers-grid">
            {offers.map((offer, index) => (
              <article className="offer-card" key={offer.id}>

                <div className="offer-visual">
                  <span>
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <strong>
                    {offer.discount_percentage
                      ? `${offer.discount_percentage}%`
                      : "SPECIAL"}
                  </strong>

                  {offer.discount_percentage && (
                    <small>OFF</small>
                  )}
                </div>

                <div className="offer-content">

                  <p className="offer-restaurant">
                    {offer.restaurant_name}
                  </p>

                  <h3>{offer.title}</h3>

                  <p className="offer-description">
                    {offer.description}
                  </p>

                  <div className="offer-details">
                    <span>
                      FLOOR {offer.floor}
                    </span>

                    <span>
                      {offer.shop_code}
                    </span>

                    <span>
                      UNTIL{" "}
                      {new Date(
                        `${offer.valid_until}T00:00:00`
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                </div>

                <div className="offer-arrow">
                  →
                </div>

              </article>
            ))}
          </div>
        )}

        {!loading && !error && offers.length === 0 && (
          <div className="offers-message">
            <h3>No active offers right now.</h3>
            <p>Check back soon for something special.</p>
          </div>
        )}

      </main>

      <footer className="offers-footer">
        <div className="offers-logo">
          PHOENIX<span>.</span>
        </div>

        <p>
          Shopping, dining and extraordinary experiences.
        </p>

        <div>
          <Link to="/">Home</Link>
          <Link to="/stores">Stores</Link>
          <Link to="/dining">Dining</Link>
          <Link to="/reviews">Reviews</Link>
        </div>

        <small>© 2026 PHOENIX</small>
      </footer>

    </div>
  );
}

export default Offers;