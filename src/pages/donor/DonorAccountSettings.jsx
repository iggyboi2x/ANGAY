import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import DonorLayout from "../../components/donor/DonorLayout";
import { supabase } from "../../../supabase";
import FlashMessage from "../../components/FlashMessage";

export default function DonorAccountSettings() {
  const [form, setForm] = useState({ full_name: "", contact: "", email: "" });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, contact")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setForm({
          full_name: profile?.full_name || "",
          contact: profile?.contact || "",
          email: user.email || "",
        });
        setLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSaveProfile = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name,
        contact: form.contact,
      })
      .eq("id", user.id);
    setSaving(false);

    if (error) {
      setFlash({ type: "error", message: error.message });
      return;
    }

    setFlash({ type: "success", message: "Account settings updated." });
  };

  const onUpdatePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setFlash({ type: "error", message: "Please complete both password fields." });
      return;
    }
    if (newPassword.length < 6) {
      setFlash({ type: "error", message: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setFlash({ type: "error", message: "Passwords do not match." });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setFlash({ type: "error", message: error.message });
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setFlash({ type: "success", message: "Password updated successfully." });
  };

  return (
    <DonorLayout>
      {flash && (
        <FlashMessage
          message={flash.message}
          type={flash.type}
          onClose={() => setFlash(null)}
        />
      )}
      <div className="px-10 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6">Account Settings</h1>

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-6 text-sm text-gray-500">
            Loading account details...
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[#888888] mb-1.5">Full Name</label>
                  <input
                    value={form.full_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FE9800]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888888] mb-1.5">Email</label>
                  <input
                    value={form.email}
                    disabled
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-100 border border-gray-200 rounded-xl text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#888888] mb-1.5">Contact Number</label>
                  <input
                    value={form.contact}
                    onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                    className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FE9800]"
                  />
                </div>
                <button
                  onClick={onSaveProfile}
                  disabled={saving}
                  className="w-full py-2.5 bg-[#FE9800] text-white font-semibold text-sm rounded-xl hover:bg-[#e58a00] transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-base font-semibold text-[#1A1A1A] mb-4">Security</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[#888888] mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FE9800]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-[#888888] mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#FE9800]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={onUpdatePassword}
                  className="w-full py-2.5 border border-[#FE9800] text-[#FE9800] font-semibold text-sm rounded-xl hover:bg-orange-50 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DonorLayout>
  );
}
