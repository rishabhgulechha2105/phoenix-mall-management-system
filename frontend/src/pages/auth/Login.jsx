import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const API_URL = "http://127.0.0.1:8001";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Invalid email or password."
        );
      }

      localStorage.setItem(
        "phoenix_token",
        data.access_token
      );

      localStorage.setItem(
        "phoenix_user",
        JSON.stringify({
          id: data.user_id,
          name: data.name,
          email: data.email,
          role: data.role,
        })
      );

      if (
        data.role === "ADMIN" ||
        data.role === "MANAGER"
      ) {
        navigate("/manager");
      } else if (data.role === "TENANT") {
        navigate("/tenant");
      } else {
        setError("Your account role is not supported.");
      }
    } catch (err) {
      setError(
        err.message ||
          "Unable to connect to the PHOENIX server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* LEFT SIDE */}

      <section className="login-visual">

        <div className="login-brand">
          PHOENIX<span>.</span>
        </div>

        <div className="login-visual-content">

          <p>PHOENIX MALL</p>

          <h1>
            One place.
            <br />
            <em>Every experience.</em>
          </h1>

          <span>
            Access your PHOENIX account and discover
            everything your role has to offer.
          </span>

        </div>

        <div className="login-visual-footer">
          <span>SHOP · DINE · EXPERIENCE</span>
        </div>

      </section>

      {/* RIGHT SIDE */}

      <section className="login-panel">

        <div className="login-panel-top">
          <Link to="/" className="back-home">
            ← Back to PHOENIX
          </Link>
        </div>

        <div className="login-form-wrapper">

          <div className="login-heading">

            <p>WELCOME BACK</p>

            <h2>
              Sign in to
              <br />
              <em>PHOENIX.</em>
            </h2>

            <span>
              Access your personalized PHOENIX portal.
            </span>

          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-field">

              <label htmlFor="email">
                EMAIL ADDRESS
              </label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                autoComplete="email"
              />

            </div>

            <div className="form-field">

              <label htmlFor="password">
                PASSWORD
              </label>

              <div className="password-input">

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="show-password"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>

              </div>

            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner"></span>
                  SIGNING IN...
                </>
              ) : (
                <>
                  SIGN IN
                  <span>→</span>
                </>
              )}
            </button>

          </form>

          <p className="login-note">
            Authorized PHOENIX management and shop
            accounts only.
          </p>

        </div>

      </section>

    </div>
  );
}

export default Login;