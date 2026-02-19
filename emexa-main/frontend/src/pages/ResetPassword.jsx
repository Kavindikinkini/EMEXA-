import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "../lib/api";
import logo from "../assets/auth-pages-images/EMEXA Logo.png";
import "./Form.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email] = useState(searchParams.get("email") || "");
  const [resetCode, setResetCode] = useState(searchParams.get("code") || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess("");

    // Validate fields
    const newErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    }

    if (!resetCode) {
      newErrors.resetCode = "Please enter your reset code";
    }

    if (!newPassword) {
      newErrors.newPassword = "Please enter a new password";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters long";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email: email.toLowerCase().trim(),
        resetCode,
        newPassword,
      });

      setSuccess("Password reset successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      setErrors({
        form: err.message || "Invalid reset code or email. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-root">
      <div className="auth-container">
        <div className="brand">
          <img src={logo} alt="EMEXA logo" className="brand-logo" />
        </div>
        <div className="auth-title">Reset Your Password</div>
        <div className="auth-sub">
          Enter the reset code sent to your email and your new password
        </div>

        <div className="auth-inner">
          {success && (
            <div
              style={{
                backgroundColor: "#d1f4e0",
                color: "#0f5132",
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "20px",
                textAlign: "center",
                fontWeight: "500",
              }}
            >
              {success}
            </div>
          )}

          {errors.form && (
            <div
              style={{
                padding: "12px",
                marginBottom: "12px",
                backgroundColor: "#fee",
                color: "#c0392b",
                borderRadius: "8px",
                border: "1px solid #f5c6cb",
                textAlign: "center",
                fontWeight: "500",
                fontSize: "14px",
              }}
            >
              ❌ {errors.form}
            </div>
          )}

          <form noValidate onSubmit={handleSubmit}>
            <div className={`field ${errors.email ? "error" : ""}`}>
              <label>Email address</label>
              <input
                type="email"
                value={email}
                disabled
                style={{ backgroundColor: "#f5f5f5", cursor: "not-allowed" }}
              />
              {errors.email && <div className="error-text">{errors.email}</div>}
            </div>

            <div className={`field ${errors.resetCode ? "error" : ""}`}>
              <label>Reset Code</label>
              <input
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                placeholder="Enter reset code"
                disabled={loading}
                autoComplete="off"
              />
              {errors.resetCode && (
                <div className="error-text">{errors.resetCode}</div>
              )}
            </div>

            <div className={`field ${errors.newPassword ? "error" : ""}`}>
              <label>New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={loading}
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "20px",
                    color: "#888",
                    padding: "0",
                    outline: "none",
                    lineHeight: "1",
                    transition: "color 0.2s ease",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.newPassword && (
                <div className="error-text">{errors.newPassword}</div>
              )}
            </div>

            <div className={`field ${errors.confirmPassword ? "error" : ""}`}>
              <label>Confirm New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={loading}
                  style={{ paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "20px",
                    color: "#888",
                    padding: "0",
                    outline: "none",
                    lineHeight: "1",
                    transition: "color 0.2s ease",
                  }}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="error-text">{errors.confirmPassword}</div>
              )}
            </div>

            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <Link
                to="/login"
                style={{
                  color: "#0f6848",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
