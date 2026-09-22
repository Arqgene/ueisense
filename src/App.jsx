import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import PatientPortal from "./pages/PatientPortal.jsx";
import UveitisQuestionnaire from "./pages/UveitisQuestionnaire.jsx";
import DoctorLogin from "./pages/DoctorLogin.jsx";
import DoctorQueue from "./pages/DoctorQueue.jsx";
import DoctorAnalytics from "./pages/DoctorAnalytics.jsx";
import DoctorReferrals from "./pages/DoctorReferrals.jsx";
import DoctorAudit from "./pages/DoctorAudit.jsx";
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
        <Route path="/patient-portal" element={<PatientPortal />} />
        <Route path="/patient" element={<Navigate to="/patient-portal" replace />} />
        <Route path="/questionnaire" element={<PatientPortal />} />
        <Route path="/questionnaire-deep" element={<UveitisQuestionnaire />} />
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/doctor" element={<Navigate to="/doctor/queue" replace />} />
        <Route path="/doctor/queue" element={<DoctorQueue />} />
        <Route path="/doctor/analytics" element={<DoctorAnalytics />} />
        <Route path="/doctor/referrals" element={<DoctorReferrals />} />
        <Route path="/doctor/audit" element={<DoctorAudit />} />
        {/* Doctor patient workspace — Layers 4 → 7 */}
        <Route path="/doctor/patient/:patientId/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/patient/:patientId/imaging" element={<DoctorPatientUpload />} />
        <Route path="/doctor/patient/:patientId/final-review" element={<DoctorFinalReview />} />
        <Route path="/doctor/patient/:patientId/diagnosis" element={<DoctorFinalDiagnosis />} />
      </Routes>
    </BrowserRouter>
  );
}


