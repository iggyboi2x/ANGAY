import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "../supabase";
import LandingPage from "./pages/LandingPage";
import AngayAuth from "./pages/AngayAuth";
import DonorHome from "./pages/donor/DonorHome";
import DonorMessages from "./pages/donor/DonorMessages";
import DonorDonations from "./pages/donor/DonorDonations";
import DonorAccountSettings from "./pages/donor/DonorAccountSettings";
import FoodbankInventory from "./pages/foodbank/FoodbankInventory";
import FoodbankDashboard from "./pages/foodbank/FoodbankDashboard";
import FoodbankMessages from "./pages/foodbank/FoodbankMessages";
import FoodbankPackages from "./pages/foodbank/FoodbankPackages";
import FoodbankDonations from "./pages/foodbank/FoodbankDonations";
import AccountSettings from './pages/AccountSettings';
import BarangayDashboard from "./pages/barangay/BarangayDashboard";
import BarangayMessages from "./pages/barangay/BarangayMessages";
import BarangayDemographics from "./pages/barangay/BarangayDemographics";
import BarangayDonations from "./pages/barangay/BarangayDonations";
import BarangayAccountSettings from './pages/barangay/BarangayAccountSettings';
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVerification from "./pages/admin/AdminVerification";
import AdminLogistics from "./pages/admin/AdminLogistics";
import AdminEmergency from "./pages/admin/AdminEmergency";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminReports from "./pages/admin/AdminReports";
import AdminInquiries from "./pages/admin/AdminInquiries";
import NotFound from "./pages/NotFound";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import BannedPage from "./pages/BannedPage";

function PresenceTracker() {
  useEffect(() => {
    let channel;
    const initPresence = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.user) return;
      
      channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: data.session.user.id,
          },
        },
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: data.session.user.id, online_at: new Date().toISOString() });
        }
      });
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && !channel) {
        initPresence();
      } else if (event === 'SIGNED_OUT' && channel) {
        channel.unsubscribe();
        channel = null;
      }
    });

    initPresence();

    return () => {
      if (channel) channel.unsubscribe();
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return null;
}


const ROLE_HOME = {
  donor: "/donor/home",
  foodbank: "/foodbank/dashboard",
  barangay: "/barangay/dashboard",
  admin: "/admin/dashboard",
};

function RequireAuth({ children, allowedRoles }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    let mounted = true;

    // Set a timeout to prevent infinite "checking" state
    const timeout = setTimeout(() => {
      if (mounted && checking) {
        setChecking(false);
      }
    }, 5000);

    const init = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (mounted && session) {
          // Check for ban status in profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_banned')
            .eq('id', session.user.id)
            .single();

          if (profile?.is_banned) {
            setAuthed(true);
            setRole('banned');
            setChecking(false);
            return;
          }

          setAuthed(true);
          setRole(session?.user?.user_metadata?.role || null);
          setChecking(false);
        } else if (mounted) {
          setAuthed(false);
          setRole(null);
          setChecking(false);
        }
      } catch (err) {
        console.error("Auth init failed:", err);
        if (mounted) {
          setAuthed(false);
          setRole(null);
          setChecking(false);
        }
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setAuthed(Boolean(session));
        setRole(session?.user?.user_metadata?.role || null);
        setChecking(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!authed) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'banned') {
    return <Navigate to="/banned" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={ROLE_HOME[role] || "/login"} replace />;
  }

  return children;
}

function App() {
  return (
    <>
      <BrowserRouter>
        <PresenceTracker />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AngayAuth />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/banned" element={<BannedPage />} />
          <Route path="/donor/home" element={<RequireAuth allowedRoles={["donor"]}><DonorHome /></RequireAuth>} />
          <Route path="/donor/donations" element={<RequireAuth allowedRoles={["donor"]}><DonorDonations /></RequireAuth>} />
          <Route path="/donor/messages" element={<RequireAuth allowedRoles={["donor"]}><DonorMessages /></RequireAuth>} />
          <Route path="/donor/account" element={<RequireAuth allowedRoles={["donor"]}><DonorAccountSettings /></RequireAuth>} />
          <Route path="/foodbank/dashboard" element={<RequireAuth allowedRoles={["foodbank"]}><FoodbankDashboard /></RequireAuth>} />
          <Route path="/foodbank/messages" element={<RequireAuth allowedRoles={["foodbank"]}><FoodbankMessages /></RequireAuth>} />
          <Route path="/foodbank/packages" element={<RequireAuth allowedRoles={["foodbank"]}><FoodbankPackages /></RequireAuth>} />
          <Route path="/foodbank/inventory" element={<RequireAuth allowedRoles={["foodbank"]}><FoodbankInventory /></RequireAuth>} />
          <Route path="/foodbank/donations" element={<RequireAuth allowedRoles={["foodbank"]}><FoodbankDonations /></RequireAuth>} />
          <Route path="/account/settings" element={<RequireAuth allowedRoles={["foodbank"]}><AccountSettings /></RequireAuth>} />
          <Route path="/barangay/dashboard" element={<RequireAuth allowedRoles={["barangay"]}><BarangayDashboard /></RequireAuth>} />
          <Route path="/barangay/messages" element={<RequireAuth allowedRoles={["barangay"]}><BarangayMessages /></RequireAuth>} />
          <Route path="/barangay/demographics" element={<RequireAuth allowedRoles={["barangay"]}><BarangayDemographics /></RequireAuth>} />
          <Route path="/barangay/donations" element={<RequireAuth allowedRoles={["barangay"]}><BarangayDonations /></RequireAuth>} />
          <Route path="/barangay/account" element={<RequireAuth allowedRoles={["barangay"]}><AccountSettings /></RequireAuth>} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<RequireAuth allowedRoles={["admin"]}><AdminDashboard /></RequireAuth>} />
          <Route path="/admin/users" element={<RequireAuth allowedRoles={["admin"]}><AdminVerification /></RequireAuth>} />
          <Route path="/admin/inquiries" element={<RequireAuth allowedRoles={["admin"]}><AdminInquiries /></RequireAuth>} />
          <Route path="/admin/reports" element={<RequireAuth allowedRoles={["admin"]}><AdminReports /></RequireAuth>} />
          <Route path="/admin/logistics" element={<RequireAuth allowedRoles={["admin"]}><AdminLogistics /></RequireAuth>} />
          <Route path="/admin/emergency" element={<RequireAuth allowedRoles={["admin"]}><AdminEmergency /></RequireAuth>} />
          <Route path="/admin/logs" element={<RequireAuth allowedRoles={["admin"]}><AdminLogs /></RequireAuth>} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
