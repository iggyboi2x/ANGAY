
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AngayAuth from "./pages/AngayAuth";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AngayAuth />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
