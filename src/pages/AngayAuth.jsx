import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import { Wheat, Eye, EyeOff, Upload, Building2, Home, User, ArrowLeft, X, Mail } from "lucide-react";
import AddressAutocomplete from "../components/AddressAutocomplete";
import OperatingHoursPicker from "../components/OperatingHoursPicker";
import FlashMessage from "../components/FlashMessage";

const ROLES = [
  { id: "foodbank", label: "I'm a Foodbank", Icon: Building2 },
  { id: "barangay", label: "I'm a Barangay Rep", Icon: Home },
  { id: "donor", label: "I'm a Donor", Icon: User },
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

const FileField = ({ label, id, file, preview, onChange, onRemove, accept = "image/*,.pdf" }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
    {!file ? (
      <label className="block border-2 border-dashed border-gray-200 rounded-xl p-4 text-center
        cursor-pointer transition-all duration-200 hover:border-[#FE9800] bg-white hover:bg-orange-50/20">
        <input type="file" className="hidden" accept={accept} onChange={onChange} />
        <Upload size={20} className="mx-auto text-gray-400 mb-1.5" />
        <p className="text-[10px] text-gray-400 font-medium">Click to upload document</p>
      </label>
    ) : (
      <div className="relative border border-gray-200 rounded-xl p-3 bg-gray-50 flex items-center gap-3">
        <button type="button" onClick={onRemove}
          className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-sm text-gray-400 hover:text-red-500 transition-colors border border-gray-100">
          <X size={12} />
        </button>
        {preview ? (
          <img src={preview} alt="Preview" className="h-10 w-10 object-cover rounded-lg shadow-sm" />
        ) : (
          <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 shadow-sm">
            <span className="text-[8px] font-bold text-gray-400 uppercase">{file.name.split('.').pop()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-600 font-semibold truncate">{file.name}</p>
          <p className="text-[8px] text-gray-400 uppercase font-black">Ready for upload</p>
        </div>
      </div>
    )}
  </div>
);

const ContactField = ({ value, onChange }) => {
  const format = (raw) => {
    let digits = raw.replace(/\D/g, "");
    if (digits.startsWith("63")) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
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
  donor: "/donor/home",
  foodbank: "/foodbank/dashboard",
  barangay: "/barangay/dashboard",
};

const ForgotPasswordPage = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setAlert(null);
    if (!email) { setAlert({ message: "Please enter your email address.", type: "error" }); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setAlert({ message: error.message, type: "error" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      {alert && (
        <FlashMessage message={alert.message} type={alert.type} onClose={() => setAlert(null)} />
      )}
      <div className="w-full max-w-sm mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#FE9800] mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Login
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <Wheat size={24} color="#FE9800" />
            <span className="text-2xl font-semibold text-[#FE9800] tracking-wide">ANGAY</span>
          </div>
          <div className="flex justify-center mb-3">
            <div className="bg-orange-50 p-3 rounded-full">
              <Mail size={28} className="text-[#FE9800]" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Forgot Password?</h1>
          <p className="text-sm text-slate-500 mt-1">
            {sent ? "Check your inbox for the reset link." : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {sent ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
            <p className="text-sm text-emerald-700 font-medium mb-1">Reset email sent!</p>
            <p className="text-xs text-emerald-600">
              We sent a password reset link to <span className="font-semibold">{email}</span>.
              Check your inbox (and spam folder).
            </p>
            <button
              type="button"
              onClick={onBack}
              className="mt-4 text-sm text-[#FE9800] font-semibold hover:underline"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl
                  outline-none transition-all focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#FE9800] text-white font-semibold rounded-xl shadow-md
                hover:bg-[#e58a00] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const LoginPage = ({ onSwitch, onForgot }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

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
      const role = data?.user?.user_metadata?.role ?? "donor";
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
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <InputField label="Email Address" type="email" placeholder="your@email.com"
            value={email} onChange={e => setEmail(e.target.value)} />
          <InputField label="Password" showToggle toggled={showPw} onToggle={() => setShowPw(p => !p)}
            placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
          <div className="text-right -mt-2 mb-5">
            <a href="#" onClick={(e) => { e.preventDefault(); onForgot(); }} className="text-sm text-[#FE9800] font-medium hover:underline">Forgot Password?</a>
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#FE9800] text-white font-semibold rounded-xl shadow-md
              hover:bg-[#e58a00] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-5">
          Don't have an account?{" "}
          <button type="button" onClick={onSwitch} className="text-[#FE9800] font-semibold hover:underline">Sign up</button>
        </p>
      </div>
    </div>
  );
};

const RegisterPage = ({ onSwitch }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirm: "",
    orgName: "", address: "", lat: null, lng: null, contact: "", hours: "",
    // Foodbank Verification
    secRegNo: "", dswdLicenseNo: "", expiryDate: "",
    // Barangay Verification
    position: "", termEndsAt: ""
  });

  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleFileChange = (key) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFiles(prev => ({ ...prev, [key]: file }));
    if (file.type.startsWith("image/")) {
      setPreviews(prev => ({ ...prev, [key]: URL.createObjectURL(file) }));
    }
  };

  const removeFile = (key) => {
    setFiles(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setPreviews(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const isFoodbank = role === "foodbank";
  const isBarangay = role === "barangay";

  const totalSteps = role === 'donor' ? 3 : 4;

  const validateStep = () => {
    if (step === 2) {
      if (!form.fullName || !form.email || !form.password || !form.confirm) {
        setAlert({ message: "Please fill in all account identity fields.", type: "error" });
        return false;
      }
      if (form.password !== form.confirm) {
        setAlert({ message: "Passwords do not match.", type: "error" });
        return false;
      }
      if (form.password.length < 6) {
        setAlert({ message: "Password must be at least 6 characters.", type: "error" });
        return false;
      }
    }
    if (step === 3) {
      if ((isFoodbank || isBarangay) && !form.orgName) {
        setAlert({ message: `Please enter your ${isFoodbank ? 'organization' : 'barangay'} name.`, type: "error" });
        return false;
      }
      if ((isFoodbank || isBarangay) && (!form.lat || !form.lng)) {
        setAlert({ message: "Please select your address from the dropdown.", type: "error" });
        return false;
      }
      const contactRegex = /^\d{3}\s\d{3}\s\d{4}$/;
      if (!form.contact || !contactRegex.test(form.contact)) {
        setAlert({ message: "Invalid contact number format.", type: "error" });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      if (step === totalSteps) handleRegister();
      else setStep(s => s + 1);
    }
  };

  const handleRegister = async () => {
    setAlert(null);
    setLoading(true);
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role,
          org_name: form.orgName || null,
          address: form.address || null,
          latitude: form.lat || null,
          longitude: form.lng || null,
          contact: form.contact ? `+63 ${form.contact}` : null,
          hours: form.hours || null,
        },
      },
    });

    if (signUpError) {
      setAlert({ message: signUpError.message, type: "error" });
      setLoading(false);
      return;
    }

    const userId = authData.user.id;

    // Upload files and save verification data
    const uploadTasks = Object.entries(files).map(async ([key, file]) => {
      const bucket = isFoodbank ? "logos" : "documents";
      const fileName = `${userId}/${Date.now()}_${key}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return { key, url: urlData.publicUrl };
    });

    try {
      const uploadedUrls = await Promise.all(uploadTasks);
      const urlMap = uploadedUrls.reduce((acc, { key, url }) => ({ ...acc, [key]: url }), {});

      if (isFoodbank) {
        await supabase.from('foodbank_verification').insert({
          foodbank_id: userId,
          sec_reg_no: form.secRegNo,
          sec_cert_url: urlMap.secCert,
          dswd_license_no: form.dswdLicenseNo,
          dswd_cert_url: urlMap.dswdCert,
          bir_2303_url: urlMap.bir2303,
          sanitary_permit_url: urlMap.sanitaryPermit,
          expiry_date: form.expiryDate || null
        });
      } else if (isBarangay) {
        await supabase.from('barangay_verification').insert({
          user_id: userId,
          position: form.position,
          id_front_url: urlMap.idFront,
          appointment_doc_url: urlMap.appointmentDoc,
          auth_letter_url: urlMap.authLetter,
          term_ends_at: form.termEndsAt || null
        });
      }
      
      setAlert({ message: "Account created! Redirecting to login…", type: "success" });
      setTimeout(() => onSwitch(), 1200);
    } catch (err) {
      setAlert({ message: "Verification setup failed: " + err.message, type: "error" });
    } finally {
      setLoading(false);
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
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#FE9800] mb-6 transition-colors"
            >
              <ArrowLeft size={15} />
              {step === 2 ? "Back to roles" : "Back"}
            </button>

            <div className="flex gap-1.5 mb-8 justify-center">
              {[...Array(totalSteps)].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i + 1 <= step ? "w-8 bg-[#FE9800]" : "w-4 bg-gray-200"
                  }`} 
                />
              ))}
            </div>

            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-2">
                {role === 'foodbank' ? <Building2 size={24} className="text-[#FE9800]" /> :
                  role === 'barangay' ? <Home size={24} className="text-[#FE9800]" /> :
                    <User size={24} className="text-[#FE9800]" />}
              </div>
              <h1 className="text-lg font-semibold text-slate-800">
                {step === 2 ? "Account Identity" : 
                 step === 3 ? "Location & Contact" : 
                 "Verification & Details"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {step === 2 ? "Provide your basic login information" :
                 step === 3 ? "Tell us where you are located" :
                 "Finalize your registration details"}
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <InputField label="Full Name" placeholder="Enter your full name"
                    value={form.fullName} onChange={set("fullName")} />
                  <InputField label="Email Address" type="email" placeholder="your@email.com"
                    value={form.email} onChange={set("email")} />
                  <InputField label="Password" showToggle toggled={showPw} onToggle={() => setShowPw(p => !p)}
                    placeholder="Create a password" value={form.password} onChange={set("password")} />
                  <InputField label="Confirm Password" showToggle toggled={showConfirm} onToggle={() => setShowConfirm(p => !p)}
                    placeholder="Confirm your password" value={form.confirm} onChange={set("confirm")} />
                </div>
              )}

              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  {(isFoodbank || isBarangay) && (
                    <>
                      <InputField
                        label={isFoodbank ? "Organization Name" : "Barangay Name"}
                        placeholder={isFoodbank ? "Enter organization name" : "Enter barangay name"}
                        value={form.orgName} onChange={set("orgName")}
                      />
                      <AddressAutocomplete
                        label={isFoodbank ? "Foodbank Address" : "Barangay Address"}
                        placeholder="Type your address to search…"
                        onSelect={(addr, lat, lng) => setForm(f => ({ ...f, address: addr, lat, lng }))}
                      />
                    </>
                  )}
                  <ContactField value={form.contact} onChange={(v) => setForm(f => ({ ...f, contact: v }))} />
                </div>
              )}

              {step === 4 && (isFoodbank || isBarangay) && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4">
                  {isFoodbank ? (
                    <>
                      <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100 mb-4">
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 text-center italic">Highly Recommended for Verification</p>
                        <InputField label="SEC Registration No." placeholder="Enter SEC number" value={form.secRegNo} onChange={set("secRegNo")} />
                        <FileField label="SEC Certificate" id="secCert" file={files.secCert} preview={previews.secCert} onChange={handleFileChange("secCert")} onRemove={() => removeFile("secCert")} />
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <InputField label="DSWD License No." placeholder="Enter DSWD license" value={form.dswdLicenseNo} onChange={set("dswdLicenseNo")} />
                          <FileField label="DSWD License Document" id="dswdCert" file={files.dswdCert} preview={previews.dswdCert} onChange={handleFileChange("dswdCert")} onRemove={() => removeFile("dswdCert")} />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <InputField label="License Expiry" type="date" value={form.expiryDate} onChange={set("expiryDate")} />
                          <FileField label="BIR 2303 Certificate" id="bir2303" file={files.bir2303} preview={previews.bir2303} onChange={handleFileChange("bir2303")} onRemove={() => removeFile("bir2303")} />
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <FileField label="Sanitary Permit" id="sanitaryPermit" file={files.sanitaryPermit} preview={previews.sanitaryPermit} onChange={handleFileChange("sanitaryPermit")} onRemove={() => removeFile("sanitaryPermit")} />
                        </div>
                      </div>
                      <OperatingHoursPicker onChange={(val) => setForm(f => ({ ...f, hours: val }))} />
                    </>
                  ) : (
                    <>
                      <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-4">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 text-center italic">Official Verification</p>
                        <InputField label="Official Position" placeholder="e.g. Secretary, Kagawad" value={form.position} onChange={set("position")} />
                        <InputField label="Term Ends At" type="date" value={form.termEndsAt} onChange={set("termEndsAt")} />
                      </div>
                      
                      <div className="space-y-4">
                        <FileField label="Front of ID" id="idFront" file={files.idFront} preview={previews.idFront} onChange={handleFileChange("idFront")} onRemove={() => removeFile("idFront")} />
                        <FileField label="Appointment Document" id="appointmentDoc" file={files.appointmentDoc} preview={previews.appointmentDoc} onChange={handleFileChange("appointmentDoc")} onRemove={() => removeFile("appointmentDoc")} />
                        <FileField label="Authorization Letter" id="authLetter" file={files.authLetter} preview={previews.authLetter} onChange={handleFileChange("authLetter")} onRemove={() => removeFile("authLetter")} />
                      </div>
                    </>
                  )}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full py-3.5 bg-[#FE9800] text-white font-bold rounded-xl shadow-lg mt-6
                  hover:bg-[#e58a00] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200">
                {loading ? "Processing..." : step === totalSteps ? "Create Account" : "Continue"}
              </button>
            </form>
            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{" "}
              <button type="button" onClick={onSwitch} className="text-[#FE9800] font-semibold hover:underline">Log in</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default function AngayAuth() {
  const [page, setPage] = useState("login");
  if (page === "forgot") return <ForgotPasswordPage onBack={() => setPage("login")} />;
  return page === "login"
    ? <LoginPage onSwitch={() => setPage("register")} onForgot={() => setPage("forgot")} />
    : <RegisterPage onSwitch={() => setPage("login")} />;
}
