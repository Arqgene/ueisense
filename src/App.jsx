import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import UveitisQuestionnaire from "./pages/UveitisQuestionnaire.jsx";
import DoctorLogin from "./pages/DoctorLogin.jsx";
import DoctorQueue from "./pages/DoctorQueue.jsx";
// Layer 4 — Doctor Dashboard (Q&A Review + AI Explanation + Preliminary Assessment)
import DoctorDashboard from "./pages/DoctorDashboard.jsx";
// Layer 5 — Imaging Upload (CNN results hidden)
import DoctorPatientUpload from "./pages/DoctorPatientUpload.jsx";
// Layer 6 — Final Review & Disclosure
import DoctorFinalReview from "./pages/DoctorFinalReview.jsx";
// Layer 7 — Consensus Score + Final Diagnosis + Treatment Plan
import DoctorFinalDiagnosis from "./pages/DoctorFinalDiagnosis.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/questionnaire" element={<UveitisQuestionnaire />} />
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/doctor/queue" element={<DoctorQueue />} />
        {/* Doctor workflow — Layers 4 → 7 */}
        <Route path="/doctor/patient/:patientId/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/patient/:patientId/imaging" element={<DoctorPatientUpload />} />
        <Route path="/doctor/patient/:patientId/final-review" element={<DoctorFinalReview />} />
        <Route path="/doctor/patient/:patientId/diagnosis" element={<DoctorFinalDiagnosis />} />
      </Routes>
    </BrowserRouter>
  );
}

