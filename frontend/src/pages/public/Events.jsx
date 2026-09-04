import { Link } from "react-router-dom";
import "./Events.css";

const events = [
  {
    date: "14",
    month: "SEP",
    title: "Autumn Fashion Week",
    category: "FASHION",
    description:
      "Discover the season's newest collections, exclusive showcases and styling experiences.",
    time: "11:00 AM — 9:00 PM",
    location: "Central Atrium",
  },
  {
    date: "21",
    month: "SEP",
    title: "Live Music Evening",
    category: "ENTERTAINMENT",
    description:
      "An evening of live performances, great food and an atmosphere made for unwinding.",
    time: "6:00 PM — 10:00 PM",
    location: "Phoenix Courtyard",
  },
  {
    date: "28",
    month: "SEP",
    title: "Kids Discovery Day",
    category: "FAMILY",
    description:
      "A day filled with games, creative activities and unforgettable experiences for little explorers.",
    time: "12:00 PM — 7:00 PM",
    location: "Entertainment Zone",
  },
  {
    date: "05",
    month: "OCT",
    title: "Festive Food Festival",
    category: "DINING",
    description:
      "Taste your way through special menus, live cooking and exclusive dining experiences.",
    time: "12:00 PM — 11:00 PM",
    location: "Dining District",
  },
];

function Events() {
  return (
    <div className="events-page">

      <nav className="events-navbar">

        <Link to="/" className="events-logo">
          PHOENIX<span>.</span>
        </Link>

        <div className="events-nav-links">
          <Link to="/">Home</Link>
          <Link to="/stores">Stores</Link>
          <Link to="/dining">Dining</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/events" className="active">
            Events
          </Link>
          <Link to="/reviews">Reviews</Link>
        </div>

        <Link to="/login" className="events-login">
          Login
        </Link>

      </nav>

      <section className="events-hero">

        <div className="events-hero-content">

          <p>WHAT'S HAPPENING</p>

          <h1>
            Moments worth
            <br />
            <em>remembering.</em>
          </h1>

          <span>
            From fashion and food to music and family
            experiences, there is always something happening
            at PHOENIX.
          </span>

        </div>

      </section>

      <main className="events-main">

        <div className="events-heading">

          <div>
            <p className="section-label">
              THE PHOENIX CALENDAR
            </p>

            <h2>
              What's on
              <br />
              <em>your calendar?</em>
            </h2>
          </div>

          <div className="events-count">
            <strong>{events.length}</strong>
            <span>upcoming events</span>
          </div>

        </div>

        <div className="events-list">

          {events.map((event, index) => (

            <article
              className="event-card"
              key={event.title}
            >

              <div className="event-date">

                <strong>{event.date}</strong>

                <span>{event.month}</span>

              </div>

              <div className="event-main">

                <span className="event-category">
                  {event.category}
                </span>

                <h3>{event.title}</h3>

                <p>{event.description}</p>

                <div className="event-meta">

                  <span>
                    ◷ {event.time}
                  </span>

                  <span>
                    ⌖ {event.location}
                  </span>

                </div>

              </div>

              <div className="event-index">
                {String(index + 1).padStart(2, "0")}
                <span>→</span>
              </div>

            </article>

          ))}

        </div>

      </main>

      <footer className="events-footer">

        <div className="events-logo">
          PHOENIX<span>.</span>
        </div>

        <p>
          Shopping, dining and extraordinary experiences.
        </p>

        <div className="events-footer-links">
          <Link to="/">Home</Link>
          <Link to="/stores">Stores</Link>
          <Link to="/dining">Dining</Link>
          <Link to="/offers">Offers</Link>
          <Link to="/reviews">Reviews</Link>
        </div>

        <small>
          © 2026 PHOENIX
        </small>

      </footer>

    </div>
  );
}

export default Events;