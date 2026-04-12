import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AngayAuth from "./pages/AngayAuth";
import DonorHome from "./pages/donor/DonorHome";
import DonorMessages from "./pages/donor/DonorMessages";
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


function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AngayAuth />} />
          <Route path="/donor/home" element={<DonorHome />} />
          <Route path="/donor/messages" element={<DonorMessages />} />
          <Route path="/foodbank/dashboard" element={<FoodbankDashboard />} />
          <Route path="/foodbank/messages" element={<FoodbankMessages />} />
          <Route path="/foodbank/packages" element={<FoodbankPackages />} />
          <Route path="/foodbank/inventory" element={<FoodbankInventory />} />
          <Route path="/foodbank/donations" element={<FoodbankDonations />} />
          <Route path="/account/settings" element={<AccountSettings />} />
          <Route path="/barangay/dashboard" element={<BarangayDashboard />} />
          <Route path="/barangay/messages" element={<BarangayMessages />} />
          <Route path="/barangay/demographics" element={<BarangayDemographics />} />
          <Route path="/barangay/donations" element={<BarangayDonations />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
