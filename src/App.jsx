import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AngayAuth from "./pages/AngayAuth";
import DonorHome from "./pages/donor/DonorHome";
import DonorMessages from "./pages/donor/DonorMessages";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AngayAuth />} />
          <Route path="/donor/home" element={<DonorHome />} />
          <Route path="/donor/messages" element={<DonorMessages />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
