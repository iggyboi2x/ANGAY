import { useState } from "react";
import { supabase } from "../../supabase";

// ─── Icons ───────────────────────────────────────────────────────────────────
const WheatIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#F59E0B"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2a10 10 0 0 1 0 20" />
    <path d="M12 2a10 10 0 0 0 0 20" />
    <path d="M12 2v20" />
    <path d="M12 7c1.657 0 3-1.343 3-3" />
    <path d="M12 7c-1.657 0-3-1.343-3-3" />
    <path d="M12 12c1.657 0 3-1.343 3-3" />
    <path d="M12 12c-1.657 0-3-1.343-3-3" />
    <path d="M12 17c1.657 0 3-1.343 3-3" />
    <path d="M12 17c-1.657 0-3-1.343-3-3" />
  </svg>
);

const EyeIcon = ({ open }) =>
  open ? (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

const FoodbankIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="7" width="18" height="14" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 4 0v2" />
    <path d="M16 7V5a2 2 0 0 0-4 0v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
);

const BarangayIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="7" width="20" height="14" rx="1" />
    <path d="M16 21V11a4 4 0 0 0-8 0v10" />
    <path d="M2 10l10-7 10 7" />
    <rect x="10" y="14" width="4" height="7" />
  </svg>
);

const DonorIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const UploadIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#9CA3AF"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

// ─── Shared Input ─────────────────────────────────────────────────────────────
const InputField = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  showToggle,
  toggled,
  onToggle,
}) => (
  <div style={{ marginBottom: "16px" }}>
    <label
      style={{
        display: "block",
        fontSize: "13px",
        fontWeight: "500",
        color: "#374151",
        marginBottom: "6px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {label}
    </label>
    <div style={{ position: "relative" }}>
      <input
        type={showToggle ? (toggled ? "text" : "password") : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          padding: showToggle ? "11px 44px 11px 14px" : "11px 14px",
          border: "1.5px solid #E5E7EB",
          borderRadius: "10px",
          fontSize: "14px",
          backgroundColor: "#F9FAFB",
          color: "#111827",
          outline: "none",
          fontFamily: "'DM Sans', sans-serif",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#F59E0B")}
        onBlur={(e) => (e.target.style.borderColor = "#E5E7EB")}
      />
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#9CA3AF",
            display: "flex",
            alignItems: "center",
          }}
        >
          <EyeIcon open={toggled} />
        </button>
      )}
    </div>
  </div>
);

// ─── Alert Box ────────────────────────────────────────────────────────────────
const Alert = ({ message, type }) => (
  <div
    style={{
      padding: "10px 14px",
      borderRadius: "10px",
      fontSize: "13px",
      marginBottom: "16px",
      fontFamily: "'DM Sans', sans-serif",
      background: type === "error" ? "#FEE2E2" : "#D1FAE5",
      color: type === "error" ? "#B91C1C" : "#065F46",
      border: `1px solid ${type === "error" ? "#FECACA" : "#A7F3D0"}`,
    }}
  >
    {message}
  </div>
);

// ─── Login Page ───────────────────────────────────────────────────────────────
const LoginPage = ({ onSwitch }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const handleLogin = async () => {
    setAlert(null);
    if (!email || !password) {
      setAlert({ message: "Please fill in all fields.", type: "error" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setAlert({ message: error.message, type: "error" });
    } else {
      setAlert({ message: "Logged in successfully!", type: "success" });
      // TODO: redirect to dashboard
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#F5F5F5",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "40px 44px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 4px 40px rgba(0,0,0,0.10)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "5px",
            background: "linear-gradient(90deg, #F59E0B, #FBBF24)",
          }}
        />

        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "12px",
            }}
          >
            <WheatIcon />
            <span
              style={{
                fontSize: "26px",
                fontWeight: "800",
                color: "#F59E0B",
                letterSpacing: "1px",
              }}
            >
              ANGAY
            </span>
          </div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#111827",
              margin: "0 0 4px",
            }}
          >
            Welcome back
          </h1>
          <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>
            Log in to your account
          </p>
        </div>

        {alert && <Alert {...alert} />}

        <InputField
          label="Email Address"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <InputField
          label="Password"
          showToggle
          toggled={showPw}
          onToggle={() => setShowPw((p) => !p)}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div
          style={{
            textAlign: "right",
            marginTop: "-8px",
            marginBottom: "20px",
          }}
        >
          <a
            href="#"
            style={{
              fontSize: "13px",
              color: "#F59E0B",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            Forgot Password?
          </a>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            background: loading
              ? "#FCD34D"
              : "linear-gradient(135deg, #F59E0B, #FBBF24)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
          }}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#6B7280",
            marginTop: "20px",
            marginBottom: 0,
          }}
        >
          Don't have an account?{" "}
          <button
            onClick={onSwitch}
            style={{
              background: "none",
              border: "none",
              color: "#F59E0B",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

// ─── Register Page ────────────────────────────────────────────────────────────
const ROLES = [
  { id: "foodbank", label: "I'm a Foodbank", Icon: FoodbankIcon },
  { id: "barangay", label: "I'm a Barangay Rep", Icon: BarangayIcon },
  { id: "donor", label: "I'm a Donor", Icon: DonorIcon },
];

const RegisterPage = ({ onSwitch }) => {
  const [role, setRole] = useState("foodbank");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirm: "",
    orgName: "",
    address: "",
    contact: "",
    hours: "",
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isFoodbank = role === "foodbank";
  const isBarangay = role === "barangay";

  const handleRegister = async () => {
    setAlert(null);
    if (!form.fullName || !form.email || !form.password || !form.confirm) {
      setAlert({
        message: "Please fill in all required fields.",
        type: "error",
      });
      return;
    }
    if (form.password !== form.confirm) {
      setAlert({ message: "Passwords do not match.", type: "error" });
      return;
    }
    if (form.password.length < 6) {
      setAlert({
        message: "Password must be at least 6 characters.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role: role,
          org_name: form.orgName || null,
          address: form.address || null,
          contact: form.contact || null,
          hours: form.hours || null,
        },
      },
    });
    setLoading(false);

    if (error) {
      setAlert({ message: error.message, type: "error" });
    } else {
      setAlert({
        message: "Account created! Please check your email to confirm.",
        type: "success",
      });
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#F5F5F5",
        fontFamily: "'DM Sans', sans-serif",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px",
          padding: "36px 40px 32px",
          width: "100%",
          maxWidth: "440px",
          boxShadow: "0 4px 40px rgba(0,0,0,0.10)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "5px",
            background: "linear-gradient(90deg, #F59E0B, #FBBF24)",
          }}
        />

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "8px",
            }}
          >
            <WheatIcon />
            <span
              style={{
                fontSize: "24px",
                fontWeight: "800",
                color: "#F59E0B",
                letterSpacing: "1px",
              }}
            >
              ANGAY
            </span>
          </div>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#111827",
              margin: "0 0 2px",
            }}
          >
            Create your account
          </h1>
          <p style={{ fontSize: "12px", color: "#6B7280", margin: 0 }}>
            Select your role to get started
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "22px" }}>
          {ROLES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setRole(id)}
              style={{
                flex: 1,
                padding: "12px 6px",
                border:
                  role === id ? "2px solid #F59E0B" : "1.5px solid #E5E7EB",
                borderRadius: "12px",
                background: role === id ? "#FEF3C7" : "white",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s",
              }}
            >
              <div style={{ color: role === id ? "#F59E0B" : "#9CA3AF" }}>
                <Icon />
              </div>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: role === id ? "#B45309" : "#6B7280",
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: "1.2",
                  textAlign: "center",
                }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>

        {alert && <Alert {...alert} />}

        <InputField
          label="Full Name"
          placeholder="Enter your full name"
          value={form.fullName}
          onChange={set("fullName")}
        />
        <InputField
          label="Email Address"
          type="email"
          placeholder="your@email.com"
          value={form.email}
          onChange={set("email")}
        />
        <InputField
          label="Password"
          showToggle
          toggled={showPw}
          onToggle={() => setShowPw((p) => !p)}
          placeholder="Create a password"
          value={form.password}
          onChange={set("password")}
        />
        <InputField
          label="Confirm Password"
          showToggle
          toggled={showConfirm}
          onToggle={() => setShowConfirm((p) => !p)}
          placeholder="Confirm your password"
          value={form.confirm}
          onChange={set("confirm")}
        />

        {(isFoodbank || isBarangay) && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                margin: "8px 0 16px",
                gap: "10px",
              }}
            >
              <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#9CA3AF",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                {isFoodbank ? "Organization Info" : "Barangay Info"}
              </span>
              <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
            </div>
            <InputField
              label={isFoodbank ? "Organization Name" : "Barangay Name"}
              placeholder={
                isFoodbank ? "Enter organization name" : "Enter barangay name"
              }
              value={form.orgName}
              onChange={set("orgName")}
            />
            <InputField
              label={isFoodbank ? "Foodbank Address" : "Barangay Address"}
              placeholder="Complete address"
              value={form.address}
              onChange={set("address")}
            />
            <InputField
              label="Contact Number"
              placeholder="+63 XXX XXX XXXX"
              value={form.contact}
              onChange={set("contact")}
            />
            {isFoodbank && (
              <InputField
                label="Operating Hours"
                placeholder="e.g. Mon–Fri 8AM–5PM"
                value={form.hours}
                onChange={set("hours")}
              />
            )}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "6px",
                }}
              >
                {isFoodbank ? "Upload Logo" : "Upload Supporting Document"}
              </label>
              <div
                style={{
                  border: "1.5px dashed #D1D5DB",
                  borderRadius: "10px",
                  padding: "20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "#F9FAFB",
                }}
              >
                <UploadIcon />
                <p
                  style={{
                    margin: "8px 0 0",
                    fontSize: "12px",
                    color: "#9CA3AF",
                  }}
                >
                  Drag & drop or click to browse
                </p>
              </div>
            </div>
          </>
        )}

        <button
          onClick={handleRegister}
          disabled={loading}
          style={{
            width: "100%",
            padding: "13px",
            background: loading
              ? "#FCD34D"
              : "linear-gradient(135deg, #F59E0B, #FBBF24)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
            marginTop: "4px",
          }}
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#6B7280",
            marginTop: "16px",
            marginBottom: 0,
          }}
        >
          Already have an account?{" "}
          <button
            onClick={onSwitch}
            style={{
              background: "none",
              border: "none",
              color: "#F59E0B",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "13px",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};

export default function AngayAuth() {
  const [page, setPage] = useState("login");
  return page === "login" ? (
    <LoginPage onSwitch={() => setPage("register")} />
  ) : (
    <RegisterPage onSwitch={() => setPage("login")} />
  );
}
