import { useState, useEffect } from "react";
import logo from "../assets/auth-pages-images/EMEXA Logo.png";
import api from "../lib/api";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./Form.css";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accountType, setAccountType] = useState("student");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!fullName.trim()) {
      e.fullName = "Full name is required";
    }
    if (!email.trim()) {
      e.email = "Email is required";
    } else if (!/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      e.email = "Please enter a valid email address";
    } else if (email !== email.toLowerCase()) {
      e.email = "Email must be in lowercase only";
    } else {
      const tld = email.split(".").pop().toLowerCase();
      const validTLDs = [
        "com", "org", "net", "edu", "gov", "mil", "int", "co", "uk", "us",
        "ca", "au", "de", "fr", "jp", "cn", "in", "br", "ru", "za", "es",
        "it", "nl", "se", "no", "dk", "fi", "be", "ch", "at", "nz", "sg",
        "hk", "kr", "tw", "mx", "ar", "cl", "info", "biz", "io", "ai",
        "app", "dev", "tech", "online", "site", "website", "space", "store",
        "club", "xyz", "top", "pro", "name", "me", "tv", "cc", "ws",
        "mobi", "asia", "tel", "travel", "museum", "coop", "aero", "jobs", "cat"
      ];
      if (!validTLDs.includes(tld)) {
        e.email = "Please enter a valid email address";
      }
    }
    if (!password) {
      e.password = "Password is required";
    } else if (password.length < 8) {
      e.password = "Password must be at least 8 characters";
    }
    if (!confirm) {
      e.confirm = "Please confirm your password";
    } else if (password !== confirm) {
      e.confirm = "Passwords do not match";
    }
    
    // Only validate academic fields for students
    if (accountType === "student") {
      if (!academicYear) {
        e.academicYear = "Academic year is required for students";
      }
      if (!semester) {
        e.semester = "Semester is required for students";
      }
    }
    
    return e;
  };

  const onSubmit = (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    
    if (Object.keys(e).length === 0) {
      setLoading(true);
      setErrors({});

      // Prepare registration data - matching backend expectations
      const registrationData = {
        fullName,
        email,
        password,
        accountType,
      };

      // Only include academic fields for students
      if (accountType === "student") {
        registrationData.year = academicYear;
        registrationData.semester = semester;
      }

      console.log("📤 Sending registration to backend:", {
        ...registrationData,
        password: "***",
      });

      api
        .post("/auth/register", registrationData)
        .then((res) => {
          console.log("✅ Registration response:", res);

          setUserName(res.user?.name || fullName);
          
          // Check if approval is pending
          if (res.pendingApproval) {
            console.log("⏳ Account pending approval");
            setPendingApproval(true);
            setRegistered(true);
            
            // Redirect to login after showing message
            setTimeout(() => {
              navigate("/login", { 
                replace: true,
                state: { 
                  message: "Registration successful! Please wait for admin approval before logging in.",
                  email: email
                }
              });
            }, 3000);
          } else {
            // Old flow - shouldn't happen anymore
            setRegistered(true);
            setTimeout(() => {
              navigate("/login", { replace: true });
            }, 2000);
          }
        })
        .catch((err) => {
          console.error("❌ Registration error:", err);

          let errorMessage = "Registration failed. Please try again.";

          if (err.message && err.message.includes("HTTP")) {
            errorMessage = `Server error: ${err.message}`;
          } else if (err.isNetworkError) {
            errorMessage = "⚠️ Cannot connect to server. Please check if backend is running.";
          } else if (err.message) {
            errorMessage = err.message;
          }

          setErrors({ form: errorMessage });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  // Reset academic fields when account type changes to teacher
  useEffect(() => {
    if (accountType === "teacher") {
      setAcademicYear("");
      setSemester("");
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.academicYear;
        delete newErrors.semester;
        return newErrors;
      });
    }
  }, [accountType]);

  return (
    <div className="app-root">
      <div className="auth-container">
        {!registered ? (
          <>
            <div className="brand">
              <img src={logo} alt="EMEXA logo" className="brand-logo" />
            </div>
            <div className="auth-title">Create your account</div>

            <div className="auth-inner">
              <form noValidate onSubmit={onSubmit}>
                <div className={`field ${errors.fullName ? "error" : ""}`}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                  {errors.fullName && (
                    <div className="error-text">{errors.fullName}</div>
                  )}
                </div>

                <div className={`field ${errors.email ? "error" : ""}`}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      const newEmail = e.target.value;
                      setEmail(newEmail);

                      if (newEmail.trim()) {
                        if (!/^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(newEmail)) {
                          setErrors((prev) => ({
                            ...prev,
                            email: "Please enter a valid email address",
                          }));
                        } else if (newEmail !== newEmail.toLowerCase()) {
                          setErrors((prev) => ({
                            ...prev,
                            email: "Email must be in lowercase only",
                          }));
                        } else {
                          const tld = newEmail.split(".").pop().toLowerCase();
                          const validTLDs = [
                            "com", "org", "net", "edu", "gov", "mil", "int", "co", "uk",
                            "us", "ca", "au", "de", "fr", "jp", "cn", "in", "br", "ru",
                            "za", "es", "it", "nl", "se", "no", "dk", "fi", "be", "ch",
                            "at", "nz", "sg", "hk", "kr", "tw", "mx", "ar", "cl", "info",
                            "biz", "io", "ai", "app", "dev", "tech", "online", "site",
                            "website", "space", "store", "club", "xyz", "top", "pro",
                            "name", "me", "tv", "cc", "ws", "mobi", "asia", "tel",
                            "travel", "museum", "coop", "aero", "jobs", "cat"
                          ];

                          if (!validTLDs.includes(tld)) {
                            setErrors((prev) => ({
                              ...prev,
                              email: "Please enter a valid email address",
                            }));
                          } else {
                            setErrors((prev) => ({ ...prev, email: "" }));
                          }
                        }
                      } else {
                        setErrors((prev) => ({ ...prev, email: "" }));
                      }
                    }}
                    placeholder="Enter your email"
                  />
                  {errors.email && (
                    <div className="error-text">{errors.email}</div>
                  )}
                </div>

                <div className={`field ${errors.password ? "error" : ""}`}>
                  <label>Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
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
                        color: "#888",
                        padding: "4px",
                        outline: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "color 0.2s ease",
                      }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="error-text">{errors.password}</div>
                  )}
                </div>

                <div className={`field ${errors.confirm ? "error" : ""}`}>
                  <label>Confirm Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Confirm your password"
                      style={{ paddingRight: "40px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: "#888",
                        padding: "4px",
                        outline: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "color 0.2s ease",
                      }}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                  {errors.confirm && (
                    <div className="error-text">{errors.confirm}</div>
                  )}
                </div>

                {/* Academic Year and Semester - Only for Students - Horizontal Layout */}
                {accountType === "student" && (
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div className={`field ${errors.academicYear ? "error" : ""}`} style={{ flex: 1 }}>
                      <label>Academic Year</label>
                      <select
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px",
                          fontSize: "14px",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          backgroundColor: "white",
                          cursor: "pointer",
                          outline: "none",
                          transition: "border-color 0.2s ease",
                          color: academicYear ? "#000" : "#999",
                          appearance: "none",
                          backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 12px center",
                          backgroundSize: "20px",
                          paddingRight: "40px"
                        }}
                      >
                        <option value="" style={{ color: "#999" }}>Select academic year</option>
                        <option value="1st year" style={{ color: "#000" }}>1st Year</option>
                        <option value="2nd year" style={{ color: "#000" }}>2nd Year</option>
                        <option value="3rd year" style={{ color: "#000" }}>3rd Year</option>
                        <option value="4th year" style={{ color: "#000" }}>4th Year</option>
                      </select>
                      {errors.academicYear && (
                        <div className="error-text">{errors.academicYear}</div>
                      )}
                    </div>

                    <div className={`field ${errors.semester ? "error" : ""}`} style={{ flex: 1 }}>
                      <label>Semester</label>
                      <select
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px",
                          fontSize: "14px",
                          border: "1px solid #ddd",
                          borderRadius: "8px",
                          backgroundColor: "white",
                          cursor: "pointer",
                          outline: "none",
                          transition: "border-color 0.2s ease",
                          color: semester ? "#000" : "#999",
                          appearance: "none",
                          backgroundImage: "url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27currentColor%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 12px center",
                          backgroundSize: "20px",
                          paddingRight: "40px"
                        }}
                      >
                        <option value="" style={{ color: "#999" }}>Select semester</option>
                        <option value="1st semester" style={{ color: "#000" }}>1st Semester</option>
                        <option value="2nd semester" style={{ color: "#000" }}>2nd Semester</option>
                      </select>
                      {errors.semester && (
                        <div className="error-text">{errors.semester}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="field">
                  <label>Account Type</label>
                  <div className="radio-row">
                    <label>
                      <input
                        type="radio"
                        name="acct"
                        checked={accountType === "student"}
                        onChange={() => setAccountType("student")}
                      />{" "}
                      Student
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="acct"
                        checked={accountType === "teacher"}
                        onChange={() => setAccountType("teacher")}
                      />{" "}
                      Teacher
                    </label>
                  </div>
                </div>

                {errors.form && (
                  <div
                    style={{
                      padding: "12px",
                      marginTop: "12px",
                      marginBottom: "8px",
                      backgroundColor: "#f8d7da",
                      color: "#721c24",
                      borderRadius: "8px",
                      border: "1px solid #f5c6cb",
                      textAlign: "center",
                      fontSize: "14px",
                      fontWeight: "500",
                    }}
                  >
                    {errors.form}
                  </div>
                )}

                <button
                  className="btn"
                  type="submit"
                  disabled={loading}
                  style={{
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                    position: "relative",
                  }}
                >
                  {loading ? (
                    <span>
                      <span
                        style={{
                          display: "inline-block",
                          width: "16px",
                          height: "16px",
                          border: "2px solid #ffffff",
                          borderTopColor: "transparent",
                          borderRadius: "50%",
                          animation: "spin 0.6s linear infinite",
                          marginRight: "8px",
                          verticalAlign: "middle",
                        }}
                      ></span>
                      Registering...
                    </span>
                  ) : (
                    "Register"
                  )}
                </button>

                <div className="small-note">
                  Already have an account?{" "}
                  <Link className="link" to="/login">
                    Log in
                  </Link>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="success-message-container">
            <div className="brand">
              <img src={logo} alt="EMEXA logo" className="brand-logo" />
            </div>

            <div className="success-card">
              <div
                className="success-icon"
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  margin: "0 auto 20px",
                }}
              >
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
                  <circle
                    cx="30"
                    cy="30"
                    r="28"
                    fill={pendingApproval ? "#ff9800" : "#155724"}
                    stroke={pendingApproval ? "#ff9800" : "#155724"}
                    strokeWidth="2"
                  />
                  {pendingApproval ? (
                    <path
                      d="M30 15v20M30 40v2"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  ) : (
                    <path
                      d="M20 30L26 36L40 22"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </div>

              <h2 className="success-title" style={{ textAlign: "center" }}>
                {pendingApproval ? "Registration Pending Approval" : "Registration Successful!"}
              </h2>

              <p className="success-subtitle" style={{ textAlign: "center" }}>
                {pendingApproval ? (
                  <>
                    Welcome {userName}! Your account has been created and is pending admin approval.
                    <br /><br />
                    <strong>You will be able to login once an admin approves your account.</strong>
                    <br /><br />
                    Redirecting to login page...
                  </>
                ) : (
                  <>
                    Welcome {userName}! Your account has been created successfully.
                    Redirecting to login...
                  </>
                )}
              </p>
            </div>

            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <Link className="link" to="/login">
                Go to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}