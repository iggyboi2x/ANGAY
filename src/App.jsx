import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AngayAuth from "./pages/AngayAuth";
import DonorHome from "./pages/donor/DonorHome";
import DonorMessages from "./pages/donor/DonorMessages";
import FoodbankInventory from "./pages/foodbank/FoodbankInventory";


function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AngayAuth />} />
          <Route path="/donor/home" element={<DonorHome />} />
          <Route path="/donor/messages" element={<DonorMessages />} />
          <Route path="/foodbank/inventory" element={<FoodbankInventory />} />

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
