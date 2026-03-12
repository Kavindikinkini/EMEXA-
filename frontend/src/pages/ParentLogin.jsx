import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import logo from "../assets/auth-pages-images/EMEXA Logo.png";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

const ParentLogin = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const message   = location.state?.message;

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe,   setRememberMe]   = useState(false);   

  useEffect(() => {
    const savedEmail    = localStorage.getItem("parentRememberEmail");
    const savedPassword = localStorage.getItem("parentRememberPassword");
    if (savedEmail) {
      setEmail(savedEmail);
      setPassword(savedPassword || "");
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/parent/login`, { email, password });
      localStorage.setItem("token",    res.data.token);
      localStorage.setItem("user",     JSON.stringify(res.data.user));
      localStorage.setItem("userName", res.data.user.name);
      localStorage.setItem("userRole", "parent");

       if (rememberMe) {
        localStorage.setItem("parentRememberEmail",    email);
        localStorage.setItem("parentRememberPassword", password);
      } else {
        localStorage.removeItem("parentRememberEmail");
        localStorage.removeItem("parentRememberPassword");
      }

      navigate("/parent/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">

        <img src={logo} alt="EMEXA logo" className="w-20 h-20 object-contain mx-auto mb-4" />

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" value={email}
              onChange={e => setEmail(e.target.value)} required
              placeholder="your@email.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)} required
                placeholder="Your password"
                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-400 outline-none text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {/* ← NEW: Remember me — sits between password and Sign In button */}
          <div className="flex items-center pt-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  rememberMe
                    ? "bg-teal-600 border-teal-600"
                    : "border-gray-300 group-hover:border-teal-400"
                }`}
              >
                {rememberMe && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-600 select-none">Remember me</span>
            </label>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold text-sm disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link to="/parent/register" className="text-teal-600 font-medium hover:underline">
            Register here
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-3">
          Are you a student or teacher?{" "}
          <Link to="/login" className="text-gray-500 hover:underline">
            Go to main login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ParentLogin;