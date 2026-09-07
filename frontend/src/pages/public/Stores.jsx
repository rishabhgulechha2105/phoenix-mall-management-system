import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./Stores.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001";

const categoryNames = {
  1: "Fashion",
  2: "Electronics",
  3: "Dining",
  4: "Beauty & Wellness",
  5: "Home & Lifestyle",
  6: "Sports & Fitness",
  7: "Entertainment",
  8: "Grocery",
  9: "Jewellery",
  10: "Services",
};

const categoryIcons = {
  Fashion: "✦",
  Electronics: "◈",
  Dining: "♨",
  "Beauty & Wellness": "✧",
  "Home & Lifestyle": "⌂",
  "Sports & Fitness": "◇",
  Entertainment: "○",
  Grocery: "▦",
  Jewellery: "◇",
  Services: "＋",
};

function Stores() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [floor, setFloor] = useState("All");

  useEffect(() => {
    fetch(`${API_URL}/shops/public`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Unable to load stores");
        }

        return response.json();
      })
      .then((data) => {
        setStores(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to connect to the PHOENIX mall directory.");
        setLoading(false);
      });
  }, []);

  const enrichedStores = useMemo(() => {
    return stores.map((store) => ({
      ...store,
      category: categoryNames[store.category_id] || "Other",
    }));
  }, [stores]);

  const categories = useMemo(() => {
    return [
      "All",
      ...new Set(enrichedStores.map((store) => store.category)),
    ];
  }, [enrichedStores]);

  const floors = useMemo(() => {
    return [
      "All",
      ...new Set(enrichedStores.map((store) => store.floor)),
    ];
  }, [enrichedStores]);

  const filteredStores = useMemo(() => {
    return enrichedStores.filter((store) => {
      const matchesSearch =
        store.name.toLowerCase().includes(search.toLowerCase()) ||
        store.shop_code.toLowerCase().includes(search.toLowerCase()) ||
        store.category.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || store.category === category;

      const matchesFloor =
        floor === "All" || store.floor === floor;

      return matchesSearch && matchesCategory && matchesFloor;
    });
  }, [enrichedStores, search, category, floor]);

  return (
    <div className="stores-page">

      {/* NAVBAR */}

      <nav className="stores-navbar">
        <Link to="/" className="stores-logo">
          PHOENIX<span>.</span>
        </Link>

        <div className="stores-nav-links">
          <Link to="/">Home</Link>
          <Link to="/stores" className="active">
            Stores
          </Link>
          <Link to="/dining">Dining</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/events">Events</Link>
          <Link to="/reviews">Reviews</Link>
        </div>

        <Link to="/login" className="stores-login">
          Login
        </Link>
      </nav>

      {/* PAGE HERO */}

      <section className="stores-hero">
        <div className="stores-hero-content">
          <p className="stores-eyebrow">DISCOVER PHOENIX</p>

          <h1>
            Find your
            <br />
            <em>favourite.</em>
          </h1>

          <p>
            Explore the brands, experiences and destinations
            waiting for you at PHOENIX.
          </p>
        </div>
      </section>

      {/* DIRECTORY */}

      <main className="stores-main">

        <div className="directory-heading">
          <div>
            <p className="section-label">THE DIRECTORY</p>

            <h2>
              Explore our
              <br />
              <em>stores.</em>
            </h2>
          </div>

          <div className="store-count">
            <strong>{filteredStores.length}</strong>
            <span>stores</span>
          </div>
        </div>

        {/* SEARCH */}

        <div className="store-search">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search stores, categories or shop numbers..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button onClick={() => setSearch("")}>
              ×
            </button>
          )}
        </div>

        {/* FILTERS */}

        <div className="filter-area">

          <div className="filter-group">
            <span className="filter-label">CATEGORY</span>

            <div className="filter-buttons">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? "selected" : ""}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group floor-filter">
            <span className="filter-label">FLOOR</span>

            <div className="filter-buttons">
              {floors.map((item) => (
                <button
                  key={item}
                  className={floor === item ? "selected" : ""}
                  onClick={() => setFloor(item)}
                >
                  {item === "All" ? "All Floors" : `Floor ${item}`}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* LOADING */}

        {loading && (
          <div className="stores-message">
            <div className="loader"></div>
            <p>Discovering PHOENIX stores...</p>
          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div className="stores-message error-message">
            <h3>Something went wrong.</h3>
            <p>{error}</p>
          </div>
        )}

        {/* STORE GRID */}

        {!loading && !error && (
          <>
            {filteredStores.length > 0 ? (
              <div className="store-grid">

                {filteredStores.map((store, index) => (
                  <article
                    className="store-card"
                    key={store.id}
                  >
                    <div className="store-card-top">

                      <span className="store-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="store-icon">
                        {categoryIcons[store.category] || "✦"}
                      </span>

                    </div>

                    <div className="store-card-content">

                      <span className="store-category">
                        {store.category}
                      </span>

                      <h3>{store.name}</h3>

                      <div className="store-location">
                        <span>⌖</span>

                        <span>
                          {store.floor === "Ground"
                            ? "Ground Floor"
                            : `Floor ${store.floor}`}
                        </span>

                        <span className="location-divider">
                          ·
                        </span>

                        <span>{store.shop_code}</span>
                      </div>

                    </div>

                    <div className="store-card-arrow">
                      →
                    </div>
                  </article>
                ))}

              </div>
            ) : (
              <div className="no-results">
                <span>⌕</span>

                <h3>No stores found</h3>

                <p>
                  Try changing your search or filters.
                </p>

                <button
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                    setFloor("All");
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

      <footer className="stores-footer">

        <div className="footer-brand">
          <div className="stores-logo">
            PHOENIX<span>.</span>
          </div>

          <p>
            Your destination for shopping,
            dining and extraordinary experiences.
          </p>
        </div>

        <div className="footer-links">
          <Link to="/">Home</Link>
          <Link to="/dining">Dining</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/events">Events</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div className="stores-footer-bottom">
          <span>© 2026 PHOENIX</span>
          <span>Experience Extraordinary.</span>
        </div>

      </footer>

    </div>
  );
}

export default Stores;