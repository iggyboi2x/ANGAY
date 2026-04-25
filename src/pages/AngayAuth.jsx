import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import { Wheat, Eye, EyeOff, Upload, Building2, Home, User, ArrowLeft, X } from "lucide-react";
import AddressAutocomplete from "../components/AddressAutocomplete";
import OperatingHoursPicker from "../components/OperatingHoursPicker";
import FlashMessage from "../components/FlashMessage";

const ROLES = [
  { id: "foodbank", label: "I'm a Foodbank",     Icon: Building2 },
  { id: "barangay", label: "I'm a Barangay Rep", Icon: Home      },
  { id: "donor",    label: "I'm a Donor",         Icon: User      },
];

const InputField = ({ label, type = "text", placeholder, value, onChange, showToggle, toggled, onToggle }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={showToggle ? (toggled ? "text" : "password") : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl
          outline-none transition-all focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/20"
      />
      {showToggle && (
        <button type="button" onClick={onToggle} tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          {toggled ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      )}
    </div>
  </div>
);

const ContactField = ({ value, onChange }) => {
  const format = (raw) => {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("63")) digits = digits.slice(2);
    if (digits.startsWith("0"))  digits = digits.slice(1);
    digits = digits.slice(0, 10);
    let out = digits.slice(0, 3);
    if (digits.length > 3) out += " " + digits.slice(3, 6);
    if (digits.length > 6) out += " " + digits.slice(6, 10);
    return out;
  };
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Number</label>
      <div className="flex bg-gray-50 border border-gray-200 rounded-xl overflow-hidden transition-all
        focus-within:border-[#FE9800] focus-within:ring-2 focus-within:ring-[#FE9800]/20">
        <span className="px-3.5 py-2.5 text-sm text-gray-500 font-medium border-r border-gray-200 bg-gray-100 select-none">
          +63
        </span>
        <input type="tel" placeholder="9XX XXX XXXX" value={value}
          onChange={(e) => onChange(format(e.target.value))}
          className="flex-1 px-3.5 py-2.5 text-sm bg-transparent outline-none" />
      </div>
    </div>
  );
};

const ROLE_ROUTES = {
  donor:    "/donor/home",
  foodbank: "/foodbank/dashboard",
  barangay: "/barangay/dashboard",
};

const LoginPage = ({ onSwitch }) => {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [alert, setAlert]       = useState(null);

  const handleLogin = async () => {
    setAlert(null);
    if (!email || !password) { setAlert({ message: "Please fill in all fields.", type: "error" }); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setAlert({ message: error.message, type: "error" });
    } else {
      setAlert({ message: "Logged in successfully!", type: "success" });
      const role  = data?.user?.user_metadata?.role ?? "donor";
      const route = ROLE_ROUTES[role] ?? "/donor/home";
      setTimeout(() => navigate(route), 800);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      {alert && (
        <FlashMessage
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      <div className="w-full max-w-sm mx-auto">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#FE9800] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2 mb-3">
            <Wheat size={24} color="#FE9800" />
            <span className="text-2xl font-semibold text-[#FE9800] tracking-wide">ANGAY</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">Log in to your account</p>
        </div>
        <InputField label="Email Address" type="email" placeholder="your@email.com"
          value={email} onChange={e => setEmail(e.target.value)} />
        <InputField label="Password" showToggle toggled={showPw} onToggle={() => setShowPw(p => !p)}
          placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
        <div className="text-right -mt-2 mb-5">
          <a href="#" className="text-sm text-[#FE9800] font-medium hover:underline">Forgot Password?</a>
        </div>
        <button onClick={handleLogin} disabled={loading}
          className="w-full py-3 bg-[#FE9800] text-white font-semibold rounded-xl shadow-md
            hover:bg-[#e58a00] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
          {loading ? "Logging in..." : "Log In"}
        </button>
        <p className="text-center text-sm text-slate-500 mt-5">
          Don't have an account?{" "}
          <button onClick={onSwitch} className="text-[#FE9800] font-semibold hover:underline">Sign up</button>
        </p>
      </div>
    </div>
  );
};

const RegisterPage = ({ onSwitch }) => {
  const navigate = useNavigate();
  const [step, setStep]               = useState(1);
  const [role, setRole]               = useState(null);
  const [showPw, setShowPw]           = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [alert, setAlert]             = useState(null);
  const [uploadFile, setUploadFile]   = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirm: "",
    orgName: "", address: "", lat: null, lng: null, contact: "", hours: "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadFile(file);
    if (file.type.startsWith("image/")) setUploadPreview(URL.createObjectURL(file));
    else setUploadPreview(null);
  };

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
    const contactRegex = /^\d{3}\s\d{3}\s\d{4}$/;
    if (!form.contact || !contactRegex.test(form.contact)) {
      setAlert({ message: "Invalid contact number. Please check and try again.", type: "error" }); return;
    }
    if ((isFoodbank || isBarangay) && (!form.lat || !form.lng)) {
      setAlert({ message: "Please search and select your address from the dropdown to enable geotagging.", type: "error" }); return;
    }
    setLoading(true);
    let fileUrl = null;
    if (uploadFile && (isFoodbank || isBarangay)) {
      const bucket   = isFoodbank ? "logos" : "documents";
      const fileName = `${Date.now()}_${uploadFile.name}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, uploadFile);
      if (uploadError) {
        setAlert({ message: "File upload failed: " + uploadError.message, type: "error" });
        setLoading(false); return;
      }
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      fileUrl = urlData.publicUrl;
    }

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role,
          org_name:  form.orgName || null,
          address:   form.address || null,
          latitude:  form.lat     || null,
          longitude: form.lng     || null,
          contact:   form.contact ? `+63 ${form.contact}` : null,
          hours:     form.hours   || null,
          file_url:  fileUrl      || null,
        },
      },
    });
    setLoading(false);
    if (error) {
      setAlert({ message: error.message, type: "error" });
    } else {
      setAlert({ message: "Account created! Redirecting to login…", type: "success" });
      setTimeout(() => onSwitch(), 1200);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      {alert && (
        <FlashMessage
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert(null)}
        />
      )}
      <div className="w-full max-w-sm mx-auto">
        {step === 1 ? (
          <>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#FE9800] mb-6 transition-colors"
            >
              <ArrowLeft size={15} />
              Back
            </button>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-2">
                <Wheat size={24} color="#FE9800" />
                <span className="text-2xl font-semibold text-[#FE9800] tracking-wide">ANGAY</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-800">Create your account</h1>
              <p className="text-sm text-slate-500 mt-1">Select your role to get started</p>
            </div>
            
            <div className="flex flex-col gap-3 mb-6 mt-2">
              {ROLES.map(({ id, label, Icon }) => (
                <button 
                  key={id} 
                  onClick={() => { setRole(id); setStep(2); }}
                  className="flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 border-gray-200 bg-white text-gray-600 hover:border-[#FE9800] hover:bg-orange-50 hover:shadow-md group"
                >
                  <div className="bg-gray-50 p-3 rounded-xl group-hover:bg-white group-hover:text-[#FE9800] transition-colors">
                    <Icon size={24} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800 group-hover:text-[#b45309]">{label}</h3>
                    <p className="text-xs text-gray-500 group-hover:text-[#b45309]/70 mt-0.5 leading-tight">
                      {id === 'foodbank' ? "Register to receive and manage donations" :
                       id === 'barangay' ? "Register to request items for your community" :
                       "Register to donate food and supplies"}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{" "}
              <button onClick={onSwitch} className="text-[#FE9800] font-semibold hover:underline">Log in</button>
            </p>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#FE9800] mb-6 transition-colors"
            >
              <ArrowLeft size={15} />
              Back to roles
            </button>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-2">
                {role === 'foodbank' ? <Building2 size={24} color="#FE9800" /> :
                 role === 'barangay' ? <Home size={24} color="#FE9800" /> :
                 <User size={24} color="#FE9800" />}
              </div>
              <h1 className="text-lg font-semibold text-slate-800">
                {role === 'foodbank' ? "Foodbank Registration" :
                 role === 'barangay' ? "Barangay Rep Registration" :
                 "Donor Registration"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Complete your profile to continue</p>
            </div>
            
            <InputField label="Full Name" placeholder="Enter your full name"
              value={form.fullName} onChange={set("fullName")} />
            <InputField label="Email Address" type="email" placeholder="your@email.com"
              value={form.email} onChange={set("email")} />
            <InputField label="Password" showToggle toggled={showPw} onToggle={() => setShowPw(p => !p)}
              placeholder="Create a password" value={form.password} onChange={set("password")} />
            <InputField label="Confirm Password" showToggle toggled={showConfirm} onToggle={() => setShowConfirm(p => !p)}
              placeholder="Confirm your password" value={form.confirm} onChange={set("confirm")} />
            
            {role === "donor" && (
              <ContactField value={form.contact} onChange={(v) => setForm(f => ({ ...f, contact: v }))} />
            )}

            {(isFoodbank || isBarangay) && (
              <>
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {isFoodbank ? "Organization Info" : "Barangay Info"}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <InputField
                  label={isFoodbank ? "Organization Name" : "Barangay Name"}
                  placeholder={isFoodbank ? "Enter organization name" : "Enter barangay name"}
                  value={form.orgName} onChange={set("orgName")}
                />
                <AddressAutocomplete
                  label={isFoodbank ? "Foodbank Address" : "Barangay Address"}
                  placeholder="Type your address to search and pin location…"
                  onSelect={(addr, lat, lng) => setForm(f => ({ ...f, address: addr, lat, lng }))}
                />
                <ContactField value={form.contact} onChange={(v) => setForm(f => ({ ...f, contact: v }))} />
                {isFoodbank && (
                  <OperatingHoursPicker onChange={(val) => setForm(f => ({ ...f, hours: val }))} />
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {isFoodbank ? "Upload Logo" : "Upload Authorization Letter"}
                  </label>
                  {!uploadFile ? (
                    <label className="block border-2 border-dashed border-gray-300 rounded-xl p-5 text-center
                      cursor-pointer transition-colors duration-200 hover:border-[#FE9800] bg-gray-50 hover:bg-orange-50/30">
                      <input type="file" className="hidden"
                        accept={isFoodbank ? "image/*" : "image/*,.pdf"}
                        onChange={handleFileChange} />
                      <Upload size={28} className="mx-auto text-gray-400" />
                      <p className="text-xs text-gray-400 mt-2">
                        Drag & drop or click to browse
                      </p>
                    </label>
                  ) : (
                    <div className="relative border-2 border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col items-center justify-center">
                      <button 
                        onClick={() => { setUploadFile(null); setUploadPreview(null); }}
                        className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm text-gray-400 hover:text-red-500 transition-colors"
                        title="Remove file"
                      >
                        <X size={16} />
                      </button>
                      {uploadPreview ? (
                        <img src={uploadPreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg mb-2" />
                      ) : (
                        <div className="h-20 w-20 bg-white rounded-lg mb-2 flex items-center justify-center border border-gray-200">
                          <span className="text-[10px] font-bold text-gray-400">FILE</span>
                        </div>
                      )}
                      <p className="text-xs text-gray-600 font-medium truncate w-full text-center px-4">
                        {uploadFile.name}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
            
            <button onClick={handleRegister} disabled={loading}
              className="w-full py-3 bg-[#FE9800] text-white font-semibold rounded-xl shadow-md mt-4
                hover:bg-[#e58a00] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
              {loading ? "Creating account…" : "Create Account"}
            </button>
            <p className="text-center text-sm text-slate-500 mt-5">
              Already have an account?{" "}
              <button onClick={onSwitch} className="text-[#FE9800] font-semibold hover:underline">Log in</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default function AngayAuth() {
  const [page, setPage] = useState("login");
  return page === "login"
    ? <LoginPage onSwitch={() => setPage("register")} />
    : <RegisterPage onSwitch={() => setPage("login")} />;
}
