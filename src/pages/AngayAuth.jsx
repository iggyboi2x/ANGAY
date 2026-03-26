import { useState } from "react";
import { supabase } from "../../supabase";
import { Wheat, Eye, EyeOff, Upload, Building2, Home, User } from "lucide-react";

// ─── Role Selector Data ───────────────────────────────────────────────────────
const ROLES = [
  { id: "foodbank", label: "I'm a Foodbank", Icon: Building2 },
  { id: "barangay", label: "I'm a Barangay Rep", Icon: Home },
  { id: "donor", label: "I'm a Donor", Icon: User },
];

// ─── Shared Input ─────────────────────────────────────────────────────────────
const InputField = ({ label, type = "text", placeholder, value, onChange, showToggle, toggled, onToggle }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={showToggle ? (toggled ? "text" : "password") : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none transition-all focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/20"
      />
      {showToggle && (
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          {toggled ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      )}
    </div>
  </div>
);

// ─── Alert Box ────────────────────────────────────────────────────────────────
const Alert = ({ message, type }) => (
  <div className={`px-4 py-2.5 rounded-xl text-sm mb-4 border ${
    type === "error"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-green-50 text-green-700 border-green-200"
  }`}>
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setAlert({ message: error.message, type: "error" });
    } else {
      setAlert({ message: "Logged in successfully!", type: "success" });
      // TODO: redirect to dashboard
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#fffaf1]">
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-lg relative overflow-hidden">
        {/* Orange top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FE9800] to-[#FBBF24]" />

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2 mb-3">
            <Wheat size={24} color="#FE9800" />
            <span className="text-2xl font-semibold text-[#FE9800] tracking-wide">ANGAY</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Log in to your account</p>
        </div>

        {alert && <Alert {...alert} />}

        <InputField label="Email Address" type="email" placeholder="your@email.com"
          value={email} onChange={e => setEmail(e.target.value)} />
        <InputField label="Password" showToggle toggled={showPw}
          onToggle={() => setShowPw(p => !p)} placeholder="Enter your password"
          value={password} onChange={e => setPassword(e.target.value)} />

        {/* Forgot Password */}
        <div className="text-right -mt-2 mb-5">
          <a href="#" className="text-sm text-[#FE9800] font-medium hover:text-[#e58a00] hover:underline transition-colors">
            Forgot Password?
          </a>
        </div>

        {/* Login Button */}
        <button onClick={handleLogin} disabled={loading}
          className="w-full py-3 bg-[#FE9800] text-white font-semibold rounded-xl shadow-md
            hover:bg-[#e58a00] hover:shadow-lg active:scale-[0.98]
            disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="text-center text-sm text-slate-500 mt-5">
          Don't have an account?{" "}
          <button onClick={onSwitch}
            className="text-[#FE9800] font-semibold hover:text-[#e58a00] hover:underline transition-colors">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};


// ─── Register Page ────────────────────────────────────────────────────────────
const RegisterPage = ({ onSwitch }) => {
  const [role, setRole] = useState("foodbank");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirm: "",
    orgName: "", address: "", contact: "", hours: "",
  });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const isFoodbank = role === "foodbank";
  const isBarangay = role === "barangay";

  const handleRegister = async () => {
    setAlert(null);
    if (!form.fullName || !form.email || !form.password || !form.confirm) {
      setAlert({ message: "Please fill in all required fields.", type: "error" }); return;
    }
    if (form.password !== form.confirm) {
      setAlert({ message: "Passwords do not match.", type: "error" }); return;
    }
    if (form.password.length < 6) {
      setAlert({ message: "Password must be at least 6 characters.", type: "error" }); return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.fullName, role, org_name: form.orgName || null,
        address: form.address || null, contact: form.contact || null, hours: form.hours || null } }
    });
    setLoading(false);
    if (error) setAlert({ message: error.message, type: "error" });
    else setAlert({ message: "Account created! Please check your email to confirm.", type: "success" });
  };


  return (
    <div className="flex items-start justify-center min-h-screen bg-[#fffaf1] py-8 px-4">
      <div className="bg-white rounded-2xl p-9 w-full max-w-md shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FE9800] to-[#FBBF24]" />

        {/* Logo */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 mb-2">
            <Wheat size={22} color="#FE9800" />
            <span className="text-2xl font-semibold text-[#FE9800] tracking-wide">ANGAY</span>
          </div>
          <h1 className="text-lg font-semibold text-slate-800">Create your account</h1>
          <p className="text-xs text-slate-500 mt-0.5">Select your role to get started</p>
        </div>

        {/* Role Selector */}
        <div className="flex gap-2.5 mb-5">
          {ROLES.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setRole(id)}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-1.5 rounded-xl border-2 transition-all duration-200
                ${role === id
                  ? "border-[#FE9800] bg-orange-50 text-[#FE9800]"
                  : "border-gray-200 bg-white text-gray-400 hover:border-[#FE9800]/50 hover:bg-orange-50/50 hover:text-[#FE9800]/70"
                }`}>
              <Icon size={24} />
              <span className={`text-[11px] font-semibold leading-tight text-center ${role === id ? "text-[#b45309]" : "text-gray-500"}`}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {alert && <Alert {...alert} />}

        <InputField label="Full Name" placeholder="Enter your full name" value={form.fullName} onChange={set("fullName")} />
        <InputField label="Email Address" type="email" placeholder="your@email.com" value={form.email} onChange={set("email")} />
        <InputField label="Password" showToggle toggled={showPw} onToggle={() => setShowPw(p => !p)}
          placeholder="Create a password" value={form.password} onChange={set("password")} />
        <InputField label="Confirm Password" showToggle toggled={showConfirm} onToggle={() => setShowConfirm(p => !p)}
          placeholder="Confirm your password" value={form.confirm} onChange={set("confirm")} />

        {role === "donor" && (
          <InputField label="Contact Number" placeholder="+63 XXX XXX XXXX" value={form.contact} onChange={set("contact")} />
        )}


        {(isFoodbank || isBarangay) && (
          <>
            {/* Section Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {isFoodbank ? "Organization Info" : "Barangay Info"}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <InputField label={isFoodbank ? "Organization Name" : "Barangay Name"}
              placeholder={isFoodbank ? "Enter organization name" : "Enter barangay name"}
              value={form.orgName} onChange={set("orgName")} />
            <InputField label={isFoodbank ? "Foodbank Address" : "Barangay Address"}
              placeholder="Complete address" value={form.address} onChange={set("address")} />
            <InputField label="Contact Number" placeholder="+63 XXX XXX XXXX"
              value={form.contact} onChange={set("contact")} />
            {isFoodbank && (
              <InputField label="Operating Hours" placeholder="e.g. Mon–Fri 8AM–5PM"
                value={form.hours} onChange={set("hours")} />
            )}

            {/* Upload Box */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {isFoodbank ? "Upload Logo" : "Upload Authorization Letter"}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer
                transition-colors duration-200 hover:border-[#FE9800] bg-gray-50 hover:bg-orange-50/30">
                <Upload size={28} className="mx-auto text-gray-400" />
                <p className="text-xs text-gray-400 mt-2">Drag & drop or click to browse</p>
              </div>
            </div>
          </>
        )}

        {/* Create Account Button */}
        <button onClick={handleRegister} disabled={loading}
          className="w-full py-3 bg-[#FE9800] text-white font-semibold rounded-xl shadow-md mt-1
            hover:bg-[#e58a00] hover:shadow-lg active:scale-[0.98]
            disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{" "}
          <button onClick={onSwitch}
            className="text-[#FE9800] font-semibold hover:text-[#e58a00] hover:underline transition-colors">
            Log in
          </button>
        </p>
      </div>
    </div>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function AngayAuth() {
  const [page, setPage] = useState("login");
  return page === "login"
    ? <LoginPage onSwitch={() => setPage("register")} />
    : <RegisterPage onSwitch={() => setPage("login")} />;
}
