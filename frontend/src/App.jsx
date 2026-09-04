import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Stores from "./pages/public/Stores";
import Dining from "./pages/public/Dining";
import Offers from "./pages/public/Offers";
import Reviews from "./pages/public/Reviews";
import Events from "./pages/public/Events";
import Login from "./pages/auth/Login";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerShops from "./pages/manager/ManagerShops";
import ManagerTenants from "./pages/manager/ManagerTenants";
import ManagerLeases from "./pages/manager/ManagerLeases";
import ManagerInvoices from "./pages/manager/ManagerInvoices";
import ManagerPayments from "./pages/manager/ManagerPayments";
import ManagerRestaurants from "./pages/manager/ManagerRestaurants";
import ManagerOffers from "./pages/manager/ManagerOffers";
import ManagerReviews from "./pages/manager/ManagerReviews";
import ManagerSales from "./pages/manager/ManagerSales";
import ManagerReports from "./pages/manager/ManagerReports";
import TenantDashboard from "./pages/tenant/TenantDashboard";
import TenantSales from "./pages/tenant/TenantSales";
import ManagerRetailSales from "./pages/manager/ManagerRetailSales";
import TenantSupport from "./pages/tenant/TenantSupport";
import ManagerSupport from "./pages/manager/ManagerSupport";

function Home() {
  return (
    <div className="phoenix-page">

      {/* NAVBAR */}
      <nav className="navbar">
        <Link to="/" className="logo">
          PHOENIX<span>.</span>
        </Link>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/stores">Stores</Link>
          <Link to="/dining">Dining</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/events">Events</Link>
          <Link to="/reviews">Reviews</Link>
        </div>

        <Link to="/login" className="login-btn">
          Login
        </Link>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <p className="eyebrow">WELCOME TO PHOENIX</p>

          <h1>
            Experience
            <br />
            <span>Extraordinary.</span>
          </h1>

          <p className="hero-description">
            Discover the finest fashion, dining, entertainment and
            experiences — all under one roof.
          </p>

          <div className="hero-buttons">
            <Link to="/stores" className="primary-btn">
              Explore Stores
            </Link>

            <Link to="/offers" className="secondary-btn">
              View Offers
            </Link>
          </div>
        </div>

        <div className="scroll-indicator">
          <span></span>
          Scroll to explore
        </div>
      </section>

      {/* INTRO */}
      <section className="intro-section">
        <div>
          <p className="section-label">MORE THAN A MALL</p>
          <h2>
            Your world of
            <br />
            <em>possibilities.</em>
          </h2>
        </div>

        <p className="intro-text">
          From the latest fashion to unforgettable dining experiences,
          PHOENIX brings together everything you love in one vibrant
          destination.
        </p>
      </section>

      {/* CATEGORIES */}
      <section className="categories-section">
        <div className="section-heading">
          <div>
            <p className="section-label">DISCOVER PHOENIX</p>
            <h2>Something for everyone.</h2>
          </div>

          <Link to="/stores" className="text-link">
            Explore all →
          </Link>
        </div>

        <div className="category-grid">

          <Link to="/stores" className="category-card fashion">
            <div className="category-content">
              <p>01</p>
              <h3>Fashion</h3>
              <span>Discover the latest styles →</span>
            </div>
          </Link>

          <Link to="/dining" className="category-card dining">
            <div className="category-content">
              <p>02</p>
              <h3>Dining</h3>
              <span>Taste something extraordinary →</span>
            </div>
          </Link>

          <Link to="/events" className="category-card entertainment">
            <div className="category-content">
              <p>03</p>
              <h3>Entertainment</h3>
              <span>Make memories that last →</span>
            </div>
          </Link>

        </div>
      </section>

      {/* FEATURED */}
      <section className="featured-section">
        <div className="section-heading">
          <div>
            <p className="section-label">TRENDING NOW</p>
            <h2>Featured at PHOENIX</h2>
          </div>
        </div>

        <div className="feature-grid">

          <div className="feature-card">
            <div className="feature-icon">✦</div>
            <p>SHOPPING</p>
            <h3>Find your style.</h3>
            <span>Explore premium fashion brands.</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon">◈</div>
            <p>DINING</p>
            <h3>Come hungry.</h3>
            <span>From quick bites to fine dining.</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon">○</div>
            <p>EXPERIENCES</p>
            <h3>Stay awhile.</h3>
            <span>There's always something happening.</span>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <p className="section-label">PLAN YOUR VISIT</p>

        <h2>
          Your next
          <br />
          <span>great day</span> starts here.
        </h2>

        <div className="cta-buttons">
          <Link to="/stores" className="primary-btn">
            Explore PHOENIX
          </Link>

          <Link to="/info" className="secondary-btn dark">
            Mall Information
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">

        <div className="footer-main">

          <div>
            <div className="footer-logo">
              PHOENIX<span>.</span>
            </div>

            <p>
              A destination for shopping,
              dining and experiences.
            </p>
          </div>

          <div className="footer-column">
            <h4>Explore</h4>
            <Link to="/stores">Stores</Link>
            <Link to="/dining">Dining</Link>
            <Link to="/offers">Offers</Link>
            <Link to="/events">Events</Link>
          </div>

          <div className="footer-column">
            <h4>Information</h4>
            <Link to="/info">Mall Timings</Link>
            <Link to="/info">Parking</Link>
            <Link to="/reviews">Reviews</Link>
            <Link to="/contact">Contact</Link>
          </div>

          <div className="footer-column">
            <h4>Visit Us</h4>
            <p>Open daily</p>
            <p>10:00 AM — 10:00 PM</p>
          </div>

        </div>

        <div className="footer-bottom">
          <span>© 2026 PHOENIX. All rights reserved.</span>
          <span>Made for extraordinary experiences.</span>
        </div>

      </footer>

    </div>
  );
}


function Placeholder({ title }) {
  return (
    <div className="placeholder-page">
      <Link to="/" className="logo">
        PHOENIX<span>.</span>
      </Link>

      <h1>{title}</h1>

      <p>This section is coming together next.</p>

      <Link to="/" className="primary-btn">
        Back to Home
      </Link>
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route
          path="/stores"
          element={<Stores />}
        />

        <Route
          path="/dining"
          element={<Dining />}
        />

        <Route
          path="/offers"
          element={<Offers />}
        />

        <Route
          path="/events"
          element={<Events />}
        />

        <Route
          path="/reviews"
          element={<Reviews />}
        />

        <Route
          path="/info"
          element={<Placeholder title="Mall Information" />}
        />

        <Route
          path="/contact"
          element={<Placeholder title="Contact PHOENIX" />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
           path="/manager"
           element={<ManagerDashboard />}
        />
        <Route
           path="/manager/shops"
           element={<ManagerShops />}
        />
        <Route 
           path="/manager/tenants" element={<ManagerTenants />} 
        />
        <Route
           path="/manager/leases" element={<ManagerLeases />}
         />
         <Route path="/manager/invoices" element={<ManagerInvoices />} 
         />
         <Route
          path="/manager/payments"
          element={<ManagerPayments />}
         />
         <Route
          path="/manager/restaurants"
          element={<ManagerRestaurants />}
         />
         <Route
          path="/manager/offers"
          element={<ManagerOffers />}
         />
         <Route path="/manager/reviews" element={<ManagerReviews />} 
         />
         <Route
           path="/manager/sales"
           element={<ManagerSales />}
         />
         <Route
           path="/manager/reports"
           element={<ManagerReports />}
         />
         <Route path="/tenant" element={<TenantDashboard />} 
         />
         <Route path="/tenant/sales" element={<TenantSales />} 
         />
         <Route
           path="/manager/retail-sales"
           element={<ManagerRetailSales />}
         />
         <Route
           path="/tenant/support"
           element={<TenantSupport />}
         />
         <Route
           path="/manager/support"
           element={<ManagerSupport />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;