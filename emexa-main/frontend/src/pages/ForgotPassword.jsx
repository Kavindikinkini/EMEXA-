import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/auth-pages-images/EMEXA Logo.png";
import api from "../lib/api";
import "./Form.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    console.log("📤 Sending password reset request for:", email);

    api
      .post("/auth/forgot-password", { email })
      .then((res) => {
        console.log("✅ Password reset response:", res);
        setSent(true);

        // Generate a demo reset code (6 digits)
        const demoResetCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
        setSuccess(`✅ Reset code: ${demoResetCode} - Redirecting...`);

        // Redirect to reset password page after 2 seconds with reset code
        setTimeout(() => {
          navigate(
            `/reset-password?email=${encodeURIComponent(
              email
            )}&token=${demoResetCode}`
          );
        }, 2000);
      })
      .catch((err) => {
        console.error("❌ Password reset failed:", err);

        // Handle different types of errors
        let errorMessage = "Failed to send reset link. Please try again.";

        if (err.isNetworkError) {
          errorMessage =
            "Cannot connect to server. Please check if backend is running.";
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="app-root">
      <div className="auth-container">
        <div className="brand">
          <img src={logo} alt="EMEXA logo" className="brand-logo" />
        </div>
        <div className="auth-title">Reset your password</div>
        <div className="auth-sub">
          Enter your email address and we'll send you a link to reset your
          password.
        </div>

        <div className="auth-inner">
          <form noValidate onSubmit={onSubmit}>
            {success && (
              <div
                style={{
                  padding: "12px",
                  marginBottom: "16px",
                  backgroundColor: "#d4edda",
                  color: "#155724",
                  borderRadius: "8px",
                  border: "1px solid #c3e6cb",
                  textAlign: "center",
                  fontWeight: "500",
                }}
              >
                {success}
              </div>
            )}

            <div className={`field ${error ? "error" : ""}`}>
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  const newEmail = e.target.value;
                  setEmail(newEmail);

                  // Real-time validation
                  if (newEmail.trim()) {
                    if (
                      !/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
                        newEmail
                      )
                    ) {
                      setError("Please enter a valid email address");
                    } else {
                      // Validate TLD against whitelist
                      const tld = newEmail.split(".").pop().toLowerCase();
                      const validTLDs = [
                        "com",
                        "org",
                        "net",
                        "edu",
                        "gov",
                        "mil",
                        "int",
                        "co",
                        "uk",
                        "us",
                        "ca",
                        "au",
                        "de",
                        "fr",
                        "jp",
                        "cn",
                        "in",
                        "br",
                        "ru",
                        "za",
                        "es",
                        "it",
                        "nl",
                        "se",
                        "no",
                        "dk",
                        "fi",
                        "be",
                        "ch",
                        "at",
                        "nz",
                        "sg",
                        "hk",
                        "kr",
                        "tw",
                        "mx",
                        "ar",
                        "cl",
                        "info",
                        "biz",
                        "io",
                        "ai",
                        "app",
                        "dev",
                        "tech",
                        "online",
                        "site",
                        "website",
                        "space",
                        "store",
                        "club",
                        "xyz",
                        "top",
                        "pro",
                        "name",
                        "me",
                        "tv",
                        "cc",
                        "ws",
                        "mobi",
                        "asia",
                        "tel",
                        "travel",
                        "museum",
                        "coop",
                        "aero",
                        "jobs",
                        "cat",
                      ];

                      if (!validTLDs.includes(tld)) {
                        setError("Please enter a valid email address");
                      } else if (error && error.includes("valid email")) {
                        setError("");
                      }
                    }
                  } else if (error && error.includes("valid email")) {
                    setError("");
                  }
                }}
                onBlur={(e) => {
                  const emailValue = e.target.value.trim();
                  if (
                    emailValue &&
                    !/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(
                      emailValue
                    )
                  ) {
                    setError("Please enter a valid email address");
                  } else if (error && error.includes("valid email")) {
                    setError("");
                  }
                }}
                placeholder="Enter your email"
              />
              {error && <div className="error-text">{error}</div>}
            </div>

            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send reset link"}
            </button>

            <div style={{ marginTop: 12, textAlign: "center" }}>
              <Link className="link" to="/login">
                Back to login
              </Link>
            </div>
          </form>
        </div>

        {sent && (
          <div className="success-overlay">
            Your reset link has been sent successfully!
          </div>
        )}
      </div>
    </div>
  );
}
