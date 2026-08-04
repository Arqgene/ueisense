import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { diagnosisApi } from "../api/client.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Pill,
  ShieldCheck,
  Activity,
  Users,
  Sparkles,
  Save,
  Calendar,
  ArrowRight,
  Info,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import LayerProgress from "../components/LayerProgress.jsx";
import { samplePatients } from "./DoctorQueue.jsx";
import "../styles/doctor.css";

// Treatment plan templates by diagnosis type
const treatmentTemplates = {
  "Acute Non-Granulomatous Anterior Uveitis": {
    topicalSteroid: "Prednisolone Acetate 1% — 1 drop every 1 hour (Waking hours), taper over 4–6 weeks",
    cycloplegic: "Cyclopentolate 1% — 1 drop TID × 7 days (prevent posterior synechiae)",
    systemic: "None required (topical therapy sufficient for anterior uveitis)",
    referral: "Follow-up at 1 week — assess cell & flare response",
    followUp: "Day 7, 14, 28 — monitor IOP and AC cell grade",
  },
  "Granulomatous Anterior Uveitis (Sarcoid / HLA-B27)": {
    topicalSteroid: "Prednisolone Acetate 1% — 1 drop every 2 hours + periocular steroid injection",
    cycloplegic: "Atropine 1% — 1 drop BD × 14 days",
    systemic: "Rheumatology referral for systemic corticosteroids / DMARDs",
    referral: "Urgent rheumatology + chest X-ray / ACE level",
    followUp: "Day 7, 21, 42 — assess response to systemic therapy",
  },
  "Intermediate Uveitis / Pars Planitis": {
    topicalSteroid: "Periocular triamcinolone injection 40mg",
    cycloplegic: "Cyclopentolate 1% BD",
    systemic: "Consider oral prednisolone 1mg/kg/day if bilateral",
    referral: "MS screening + peripheral vitreous exam",
    followUp: "Monthly for first 3 months",
  },
  "Posterior Chorioretinitis": {
    topicalSteroid: "Not indicated for posterior segment — systemic only",
    cycloplegic: "Cyclopentolate 1% if anterior involvement present",
    systemic: "Oral prednisolone 60mg/day, taper over 8 weeks",
    referral: "Infectious workup (CMV, toxo, TB) before treatment",
    followUp: "2 weeks, monthly thereafter",
  },
  default: {
    topicalSteroid: "Prednisolone Acetate 1% — Frequency per clinical assessment",
    cycloplegic: "Cyclopentolate 1% — As indicated",
    systemic: "Evaluate for systemic involvement",
    referral: "Ophthalmology follow-up within 1 week",
    followUp: "Day 7, Day 30",
  },
};

const uveitisTypes = [
  "Acute Non-Granulomatous Anterior Uveitis",
  "Granulomatous Anterior Uveitis (Sarcoid / HLA-B27)",
  "Intermediate Uveitis / Pars Planitis",
  "Posterior Chorioretinitis",
  "Panuveitis",
  "Infectious Uveitis (CMV / Toxo / TB)",
  "HLA-B27 Associated Uveitis",
  "Fuchs Heterochromic Iridocyclitis",
];

// Animated consensus ring SVG
function ConsensusRing({ questionnaireScore, cnnScore, doctorScore }) {
  const consensus = Math.round((questionnaireScore * 0.35 + cnnScore * 0.40 + doctorScore * 0.25));
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (consensus / 100) * circumference;

  const color = consensus >= 80 ? "#10b981" : consensus >= 60 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <svg width="180" height="180">
          {/* Track */}
          <circle cx="90" cy="90" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="14" />
          {/* Animated fill */}
          <motion.circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${strokeDash} ${circumference}`}
            strokeDashoffset={circumference / 4}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${strokeDash} ${circumference}` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
          <text x="90" y="85" textAnchor="middle" fontSize="28" fontWeight="900" fill={color}>
            {consensus}%
          </text>
          <text x="90" y="105" textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">
            Consensus Score
          </text>
        </svg>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "14px" }}>
        {[
          { label: "Questionnaire AI", score: questionnaireScore, color: "#3b82f6", weight: "35%" },
          { label: "Image CNN", score: cnnScore, color: "#8b5cf6", weight: "40%" },
          { label: "Doctor Assess.", score: doctorScore, color: "#10b981", weight: "25%" },
        ].map((item) => (
          <div key={item.label} style={{ textAlign: "center", minWidth: "70px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: `${item.color}18`,
                border: `2px solid ${item.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 4px",
                fontSize: "0.82rem",
                fontWeight: 900,
                color: item.color,
              }}
            >
              {item.score}
            </div>
            <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 700, lineHeight: 1.3 }}>{item.label}</div>
            <div style={{ fontSize: "0.62rem", color: "#94a3b8" }}>Weight: {item.weight}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DoctorFinalDiagnosis() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const patient = samplePatients.find((p) => p.id === patientId) || samplePatients[0];
  const isHigh = patient.riskTier === "High";
  const isMod = patient.riskTier === "Moderate";
  const riskColor = isHigh ? "#dc2626" : isMod ? "#d97706" : "#059669";

  // Diagnosis form state
  const [finalDiagnosis, setFinalDiagnosis] = useState(
    isHigh ? "Acute Non-Granulomatous Anterior Uveitis" : "Granulomatous Anterior Uveitis (Sarcoid / HLA-B27)"
  );
  const [finalSeverity, setFinalSeverity] = useState(isHigh ? "Severe" : isMod ? "Moderate" : "Mild");
  const [doctorConfScore, setDoctorConfScore] = useState(85);
  const [topicalSteroid, setTopicalSteroid] = useState("");
  const [cycloplegic, setCycloplegic] = useState("");
  const [systemic, setSystemic] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [showFollowUpToast, setShowFollowUpToast] = useState(false);

  // Auto-fill treatment when diagnosis changes
  const handleDiagnosisChange = (val) => {
    setFinalDiagnosis(val);
    const tmpl = treatmentTemplates[val] || treatmentTemplates.default;
    setTopicalSteroid(tmpl.topicalSteroid);
    setCycloplegic(tmpl.cycloplegic);
    setSystemic(tmpl.systemic);
    setFollowUpNotes(tmpl.followUp);
  };

  // Initialize template on first load
  if (!topicalSteroid) {
    const tmpl = treatmentTemplates[finalDiagnosis] || treatmentTemplates.default;
    setTimeout(() => {
      setTopicalSteroid(tmpl.topicalSteroid);
      setCycloplegic(tmpl.cycloplegic);
      setSystemic(tmpl.systemic);
      setFollowUpNotes(tmpl.followUp);
    }, 0);
  }

  const handleSave = async (e) => {
    e.preventDefault();
    // Persist final diagnosis to DB
    try {
      await diagnosisApi.save({
        patient_id: patient.id,
        doctor_id: "DR-001",
        final_diagnosis: finalDiagnosis,
        severity_grade: finalSeverity,
        consensus_score: consensusScore,
        topical_steroid: topicalSteroid,
        cycloplegic,
        systemic_tx: systemic,
        followup_schedule: followUpNotes,
        referral_priority: isHigh ? "High" : isMod ? "Medium" : "Low",
        physician_notes: customNotes,
      });
    } catch (err) {
      console.warn("Diagnosis save to DB failed (offline mode):", err.message);
    }
    setSaved(true);
  };

  const handleFollowUp = () => {
    setShowFollowUpToast(true);
    setTimeout(() => setShowFollowUpToast(false), 4000);
  };

  const consensusScore = Math.round(patient.uveitisProbability * 0.35 + 96.4 * 0.40 + doctorConfScore * 0.25);

  return (
    <div className="doctor-page-wrapper">
      <Navbar />
      <div className="container" style={{ paddingTop: "110px", paddingBottom: "80px" }}>

        {/* Back */}
        <div style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/doctor/patient/${patient.id}/final-review`)}
            style={{ fontSize: "0.85rem", padding: "7px 14px" }}
          >
            <ArrowLeft size={15} style={{ marginRight: "6px" }} />
            Back to Final Review
          </button>
        </div>

        {/* Layer Progress */}
        <LayerProgress currentStep="diagnosis" completedSteps={["dashboard", "imaging", "final-review"]} />

        {/* Patient Banner */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            padding: "18px 28px",
            border: "1px solid rgba(226,232,240,0.9)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            marginBottom: "28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
              <span style={{ fontWeight: 800 }}>{patient.id}</span> — Layer 7: Consensus Score & Final Diagnosis
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0f172a" }}>
              {patient.name} — {patient.affectedEye}
            </div>
          </div>
          <div
            style={{
              padding: "8px 18px",
              borderRadius: "12px",
              backgroundColor: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.2)",
              fontSize: "0.88rem",
              fontWeight: 800,
              color: "#047857",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CheckCircle2 size={16} />
            All prior layers completed — Final decision step
          </div>
        </div>

        {/* Main grid */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "24px", alignItems: "start" }}>

          {/* LEFT: Consensus Score Ring + Breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: "300px" }}>
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "28px 22px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                textAlign: "center",
              }}
            >
              <h3 style={{ margin: "0 0 20px", fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                <Activity size={16} style={{ display: "inline", color: "#10b981", marginRight: "6px" }} />
                AI + Doctor Consensus
              </h3>

              <ConsensusRing
                questionnaireScore={Math.round(patient.uveitisProbability)}
                cnnScore={96}
                doctorScore={doctorConfScore}
              />

              {/* Doctor Confidence Slider */}
              <div style={{ marginTop: "20px", textAlign: "left" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "8px" }}>
                  Your Assessment Confidence: <span style={{ color: "#2563eb" }}>{doctorConfScore}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={doctorConfScore}
                  onChange={(e) => setDoctorConfScore(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#2563eb" }}
                />
              </div>
            </div>

            {/* Referral Priority */}
            <div
              style={{
                backgroundColor: isHigh ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
                borderRadius: "20px",
                padding: "20px",
                border: `1px solid ${isHigh ? "rgba(239,68,68,0.2)" : "rgba(245,158,11,0.2)"}`,
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: riskColor, textTransform: "uppercase", marginBottom: "8px" }}>
                Referral Priority
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, color: riskColor, marginBottom: "8px" }}>
                {isHigh ? "🔴 HIGH" : isMod ? "🟡 MEDIUM" : "🟢 LOW"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#475569", lineHeight: 1.5 }}>
                {isHigh
                  ? "Immediate ophthalmology review. Admit if IOP raised or vision threatened."
                  : isMod
                  ? "Outpatient ophthalmology within 48 hours. Start topical therapy now."
                  : "Routine ophthalmology within 1 week. Topical lubricants."}
              </div>
            </div>

            {/* Follow-Up Scheduling Button */}
            <button
              type="button"
              onClick={handleFollowUp}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "14px",
                backgroundColor: "#f8fafc",
                border: "2px dashed #cbd5e1",
                color: "#64748b",
                fontWeight: 800,
                fontSize: "0.88rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.15s",
              }}
            >
              <Calendar size={16} />
              Schedule Day 7 / 30 / 90 Follow-Up
            </button>
          </div>

          {/* RIGHT: Final Diagnosis Form + Treatment Plan */}
          <form onSubmit={handleSave}>
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "28px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ margin: "0 0 20px", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <Stethoscope size={18} style={{ color: "#2563eb" }} />
                Final Diagnosis
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Confirmed Uveitis Type *
                  </label>
                  <select
                    value={finalDiagnosis}
                    onChange={(e) => handleDiagnosisChange(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none", fontWeight: 600 }}
                  >
                    {uveitisTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Severity Grade
                  </label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {["Mild", "Moderate", "Severe"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFinalSeverity(s)}
                        style={{
                          flex: 1,
                          padding: "10px 0",
                          borderRadius: "10px",
                          border: finalSeverity === s
                            ? `2px solid ${s === "Severe" ? "#ef4444" : s === "Moderate" ? "#f59e0b" : "#10b981"}`
                            : "1px solid #cbd5e1",
                          backgroundColor: finalSeverity === s
                            ? (s === "Severe" ? "rgba(239,68,68,0.08)" : s === "Moderate" ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)")
                            : "#ffffff",
                          color: finalSeverity === s
                            ? (s === "Severe" ? "#b91c1c" : s === "Moderate" ? "#92400e" : "#047857")
                            : "#475569",
                          fontWeight: 800,
                          fontSize: "0.82rem",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI suggestion badge */}
              <div
                style={{
                  marginTop: "14px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(37,99,235,0.05)",
                  border: "1px solid rgba(37,99,235,0.15)",
                  fontSize: "0.8rem",
                  color: "#334155",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Sparkles size={14} style={{ color: "#2563eb" }} />
                <span>
                  <strong style={{ color: "#1d4ed8" }}>AI Suggestion:</strong> {patient.severityClass} — Consensus Score {consensusScore}%
                </span>
              </div>
            </div>

            {/* Treatment Plan */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "28px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ margin: "0 0 20px", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                <Pill size={18} style={{ color: "#10b981" }} />
                Treatment Plan
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    🔵 Topical Corticosteroid Regimen
                  </label>
                  <input
                    type="text"
                    value={topicalSteroid}
                    onChange={(e) => setTopicalSteroid(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    🟣 Cycloplegic / Mydriatic
                  </label>
                  <input
                    type="text"
                    value={cycloplegic}
                    onChange={(e) => setCycloplegic(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    🟠 Systemic / Adjunct Treatment
                  </label>
                  <input
                    type="text"
                    value={systemic}
                    onChange={(e) => setSystemic(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    🗓️ Follow-Up Schedule
                  </label>
                  <input
                    type="text"
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    📋 Attending Physician Notes
                  </label>
                  <textarea
                    rows={3}
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Additional clinical notes, IOP measurement, special precautions…"
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.83rem", outline: "none", lineHeight: 1.5, resize: "vertical" }}
                  />
                </div>
              </div>
            </div>

            {/* Prescription Summary Card */}
            {(topicalSteroid || cycloplegic) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  backgroundColor: "rgba(37,99,235,0.03)",
                  borderRadius: "20px",
                  padding: "22px",
                  border: "1px solid rgba(37,99,235,0.12)",
                  marginBottom: "20px",
                }}
              >
                <h4 style={{ margin: "0 0 14px", fontSize: "0.92rem", fontWeight: 800, color: "#1d4ed8", display: "flex", alignItems: "center", gap: "8px" }}>
                  <ShieldCheck size={16} style={{ color: "#2563eb" }} />
                  Prescription Summary — {patient.name} ({patient.id})
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[
                    { label: "Rx 1 — Topical Steroid", value: topicalSteroid, color: "#3b82f6" },
                    { label: "Rx 2 — Cycloplegic", value: cycloplegic, color: "#8b5cf6" },
                    { label: "Rx 3 — Systemic", value: systemic, color: "#f59e0b" },
                    { label: "Follow-Up", value: followUpNotes, color: "#10b981" },
                  ].filter((r) => r.value).map((rx) => (
                    <div
                      key={rx.label}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        backgroundColor: "#ffffff",
                        border: `1px solid rgba(226,232,240,0.9)`,
                        borderLeft: `3px solid ${rx.color}`,
                      }}
                    >
                      <div style={{ fontSize: "0.68rem", fontWeight: 800, color: rx.color, textTransform: "uppercase", marginBottom: "2px" }}>
                        {rx.label}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#334155", lineHeight: 1.4 }}>{rx.value}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleFollowUp}
                style={{
                  padding: "12px 24px",
                  borderRadius: "12px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  color: "#475569",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Calendar size={15} />
                Schedule Follow-Up (App)
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  padding: "12px 28px",
                  borderRadius: "12px",
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 6px 20px rgba(37,99,235,0.25)",
                }}
              >
                <Save size={16} />
                Validate & Save Final Diagnosis
              </button>
            </div>
          </form>
        </div>

        {/* Save Success notification */}
        <AnimatePresence>
          {saved && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                position: "fixed",
                bottom: "32px",
                right: "32px",
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                padding: "18px 24px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
                border: "1px solid rgba(16,185,129,0.3)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                zIndex: 9999,
                maxWidth: "400px",
              }}
            >
              <CheckCircle2 size={24} style={{ color: "#10b981", flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.92rem", color: "#047857" }}>
                  Final Diagnosis Saved & Validated
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                  {patient.name} ({patient.id}) — {finalDiagnosis} ({finalSeverity})
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/doctor/queue")}
                  style={{
                    marginTop: "8px",
                    background: "none",
                    border: "none",
                    color: "#2563eb",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Return to Patient Queue <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Follow-up coming soon toast */}
        <AnimatePresence>
          {showFollowUpToast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                position: "fixed",
                bottom: "32px",
                left: "32px",
                backgroundColor: "#1e293b",
                borderRadius: "14px",
                padding: "14px 20px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
                border: "1px solid rgba(99,102,241,0.3)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                zIndex: 9999,
              }}
            >
              <Calendar size={20} style={{ color: "#818cf8" }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.85rem", color: "#e2e8f0" }}>
                  Follow-Up Scheduling App
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                  Coming soon — Day 7 / 30 / 90 patient follow-up mobile app is under development
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}
