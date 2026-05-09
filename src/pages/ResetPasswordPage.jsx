import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import { Wheat, Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";
import FlashMessage from "../components/FlashMessage";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [ready, setReady] = useState(false); // true once Supabase confirms recovery session

  // Supabase fires PASSWORD_RECOVERY when the user lands via the email link.
  // We must wait for that event before allowing the password update.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if there's already an active session from the URL hash
    // (handles hard refreshes after the link was already processed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    setAlert(null);
    if (!password || !confirm) {
      setAlert({ message: "Please fill in both fields.", type: "error" }); return;
    }
    if (password.length < 6) {
      setAlert({ message: "Password must be at least 6 characters.", type: "error" }); return;
    }
    if (password !== confirm) {
      setAlert({ message: "Passwords do not match.", type: "error" }); return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setAlert({ message: error.message, type: "error" });
    } else {
      setAlert({ message: "Password updated! Redirecting to login…", type: "success" });
      setTimeout(async () => {
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
      }, 1500);
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
          onClick={() => navigate("/login")}
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
              <ShieldCheck size={28} className="text-[#FE9800]" />
            </div>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Set New Password</h1>
          <p className="text-sm text-slate-500 mt-1">Choose a strong password for your account</p>
        </div>

        {!ready ? (
          <div className="text-center py-10">
            <div className="inline-block w-6 h-6 border-2 border-[#FE9800] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-500">Verifying your reset link…</p>
            <p className="text-xs text-gray-400 mt-2">
              If nothing happens,{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-[#FE9800] hover:underline"
              >
                go back to login
              </button>{" "}
              and request a new link.
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleReset(); }}>
            {/* New Password */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl
                    outline-none transition-all focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl
                    outline-none transition-all focus:border-[#FE9800] focus:ring-2 focus:ring-[#FE9800]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirm ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#FE9800] text-white font-semibold rounded-xl shadow-md
                hover:bg-[#e58a00] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
