import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { finalReviewApi } from "../api/client.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  Sparkles,
  Brain,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Info,
  Layers,
  Activity,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import LayerProgress from "../components/LayerProgress.jsx";
import { samplePatients } from "./DoctorQueue.jsx";
import { presetSamples } from "./DoctorPatientUpload.jsx";
import "../styles/doctor.css";

// Questionnaire model index breakdown per patient
const questionnaireModelData = {
  "PT-8942": {
    indices: [
      { label: "Ocular Inflammation", value: 92, color: "#3b82f6" },
      { label: "Visual Dysfunction", value: 78, color: "#06b6d4" },
      { label: "Autoimmune Markers", value: 88, color: "#8b5cf6" },
      { label: "Pathogen / Infectious", value: 22, color: "#f59e0b" },
      { label: "Recurrence Risk", value: 35, color: "#ec4899" },
      { label: "Referral Urgency", value: 91, color: "#ef4444" },
    ],
    probability: 94.2,
    severityClass: "Severe",
    explanation: [
      "Sudden bilateral photophobia (9/10) strongly correlates with anterior uveitis.",
      "Active autoimmune condition (Methotrexate) elevates inflammatory membrane index.",
      "Concurrent joint pain flags HLA-B27 related systemic association.",
      "Fever present at intake — systemic inflammatory episode confirmed.",
    ],
  },
  default: {
    indices: [
      { label: "Ocular Inflammation", value: 65, color: "#3b82f6" },
      { label: "Visual Dysfunction", value: 55, color: "#06b6d4" },
      { label: "Autoimmune Markers", value: 40, color: "#8b5cf6" },
      { label: "Pathogen / Infectious", value: 30, color: "#f59e0b" },
      { label: "Recurrence Risk", value: 45, color: "#ec4899" },
      { label: "Referral Urgency", value: 60, color: "#ef4444" },
    ],
    probability: 70.0,
    severityClass: "Moderate",
    explanation: [
      "Moderate redness and pain scores indicate possible inflammatory involvement.",
      "Onset pattern and duration are consistent with anterior uveitis.",
    ],
  },
};

function IndexBar({ label, value, color, revealed }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "0.8rem", color: "#334155", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: "0.8rem", fontWeight: 900, color: revealed ? color : "#94a3b8" }}>
          {revealed ? `${value}%` : "—"}
        </span>
      </div>
      <div style={{ height: "8px", borderRadius: "4px", backgroundColor: "#f1f5f9", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: revealed ? `${value}%` : 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: "4px", backgroundColor: revealed ? color : "#e2e8f0" }}
        />
      </div>
    </div>
  );
}

function RevealCard({ title, icon, children, revealDelay = 0, accentColor = "#2563eb" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: revealDelay }}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        padding: "22px",
        border: `1px solid rgba(226,232,240,0.9)`,
        boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
        borderTop: `3px solid ${accentColor}`,
      }}
    >
      <h3 style={{ margin: "0 0 14px", fontSize: "0.98rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
        {icon}
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

export default function DoctorFinalReview() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const patient = samplePatients.find((p) => p.id === patientId) || samplePatients[0];
  const qData = questionnaireModelData[patient.id] || questionnaireModelData.default;
  const cnnData = presetSamples[0].cnnResult;

  const isHigh = patient.riskTier === "High";
  const isMod = patient.riskTier === "Moderate";
  const riskColor = isHigh ? "#dc2626" : isMod ? "#d97706" : "#059669";

  const [revealed, setRevealed] = useState(false);
  const [revealStep, setRevealStep] = useState(0); // 0=not started, 1=revealing, 2=done

  const handleReveal = async () => {
    setRevealStep(1);
    // Call DB API to unseal CNN results
    try {
      await finalReviewApi.reveal(patient.id, "DR-001");
    } catch (e) {
      console.warn("Reveal API failed (offline mode):", e.message);
    }
    setTimeout(() => {
      setRevealed(true);
      setRevealStep(2);
      // Save final review record
      finalReviewApi.save({
        patient_id: patient.id,
        doctor_id: "DR-001",
        combined_score: Number(combinedScore),
        uncertainty_level: "Low",
        doctor_vs_ai_match: 1,
      }).catch(console.warn);
    }, 800);
  };

  const combinedScore = (qData.probability * 0.5 + cnnData.confidence * 0.5).toFixed(1);

  return (
    <div className="doctor-page-wrapper">
      <Navbar />
      <div className="container" style={{ paddingTop: "110px", paddingBottom: "80px" }}>

        {/* Back */}
        <div style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/doctor/patient/${patient.id}/imaging`)}
            style={{ fontSize: "0.85rem", padding: "7px 14px" }}
          >
            <ArrowLeft size={15} style={{ marginRight: "6px" }} />
            Back to Imaging
          </button>
        </div>

        {/* Layer Progress */}
        <LayerProgress currentStep="final-review" completedSteps={["dashboard", "imaging"]} />

        {/* Patient Banner */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            padding: "18px 28px",
            border: "1px solid rgba(226,232,240,0.9)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "2px" }}>
              <span style={{ fontWeight: 800 }}>{patient.id}</span> — Layer 6: Final Review & AI Disclosure
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0f172a" }}>{patient.name}</div>
          </div>
          <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Questionnaire AI</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#2563eb" }}>{qData.probability.toFixed(1)}%</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Image CNN AI</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#8b5cf6" }}>{cnnData.confidence}%</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Combined Score</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: riskColor }}>{combinedScore}%</div>
            </div>
          </div>
        </div>

        {/* Reveal Gate */}
        <AnimatePresence>
          {!revealed && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4 }}
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                borderRadius: "24px",
                padding: "48px 40px",
                textAlign: "center",
                marginBottom: "28px",
                border: "1px solid rgba(99,102,241,0.3)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2563eb, #8b5cf6)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                  boxShadow: "0 12px 32px rgba(37,99,235,0.4)",
                }}
              >
                <Eye size={36} style={{ color: "#ffffff" }} />
              </div>
              <h2 style={{ margin: "0 0 12px", fontSize: "1.8rem", fontWeight: 900, color: "#f8fafc" }}>
                Ready to Reveal AI Results
              </h2>
              <p style={{ margin: "0 0 28px", fontSize: "0.95rem", color: "#94a3b8", lineHeight: 1.7, maxWidth: "540px", marginLeft: "auto", marginRight: "auto" }}>
                You have completed your preliminary clinical assessment. Both AI outputs — the Neuro-Fuzzy questionnaire model and the CNN image analysis — will now be shown together for your informed decision-making.
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "rgba(245,158,11,0.12)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  padding: "10px 20px",
                  borderRadius: "12px",
                  marginBottom: "28px",
                }}
              >
                <ShieldCheck size={16} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: "0.83rem", color: "#fbbf24", fontWeight: 700 }}>
                  Bias-Aware Protocol — Your preliminary assessment has been recorded
                </span>
              </div>
              <br />
              <button
                type="button"
                onClick={handleReveal}
                disabled={revealStep === 1}
                style={{
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  color: "#ffffff",
                  border: "none",
                  padding: "14px 36px",
                  borderRadius: "14px",
                  fontSize: "1rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: "0 8px 24px rgba(37,99,235,0.35)",
                  transition: "all 0.2s",
                  opacity: revealStep === 1 ? 0.7 : 1,
                }}
              >
                {revealStep === 1 ? "⏳ Unlocking AI Results…" : "🔓 Reveal Both AI Results Now"}
                {revealStep === 0 && <ArrowRight size={18} />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Revealed Content */}
        {revealed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

            {/* Reveal Success Banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 22px",
                borderRadius: "16px",
                backgroundColor: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.25)",
                marginBottom: "24px",
              }}
            >
              <CheckCircle2 size={22} style={{ color: "#10b981", flexShrink: 0 }} />
              <div>
                <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "#047857" }}>
                  AI Results Disclosed — Both Model Outputs Revealed
                </span>
                <span style={{ fontSize: "0.82rem", color: "#065f46", marginLeft: "8px" }}>
                  Review the combined analysis below before proceeding to final diagnosis.
                </span>
              </div>
            </div>

            {/* Side-by-side AI Results */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>

              {/* Questionnaire Neuro-Fuzzy Results */}
              <RevealCard
                title="Layer 2 — Neuro-Fuzzy Questionnaire Model"
                icon={<Brain size={18} style={{ color: "#2563eb" }} />}
                revealDelay={0}
                accentColor="#2563eb"
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(37,99,235,0.06)",
                    border: "1px solid rgba(37,99,235,0.15)",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#3b82f6", textTransform: "uppercase" }}>Uveitis Probability</div>
                      <div style={{ fontSize: "2rem", fontWeight: 900, color: "#1d4ed8", lineHeight: 1 }}>{qData.probability.toFixed(1)}%</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Severity Class</div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>{qData.severityClass}</div>
                    </div>
                  </div>
                </div>

                {qData.indices.map((idx) => (
                  <IndexBar key={idx.label} label={idx.label} value={idx.value} color={idx.color} revealed={revealed} />
                ))}

                <div style={{ marginTop: "14px" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>Clinical Explanations:</div>
                  <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                    {qData.explanation.map((exp, i) => (
                      <li key={i} style={{ fontSize: "0.78rem", color: "#475569", marginBottom: "4px", lineHeight: 1.4 }}>
                        {exp}
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealCard>

              {/* CNN Image Analysis Results — NOW REVEALED */}
              <RevealCard
                title="Layer 5 — CNN Image Analysis (Now Revealed)"
                icon={<Sparkles size={18} style={{ color: "#8b5cf6" }} />}
                revealDelay={0.15}
                accentColor="#8b5cf6"
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    backgroundColor: "rgba(139,92,246,0.06)",
                    border: "1px solid rgba(139,92,246,0.15)",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#7c3aed", textTransform: "uppercase" }}>CNN Confidence</div>
                      <div style={{ fontSize: "2rem", fontWeight: 900, color: "#7c3aed", lineHeight: 1 }}>{cnnData.confidence}%</div>
                    </div>
                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        fontSize: "0.82rem",
                        fontWeight: 800,
                        color: "#b91c1c",
                      }}
                    >
                      🔴 High Severity
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {[
                    { label: "AC Cell Grade", value: cnnData.acCells, color: "#3b82f6" },
                    { label: "Flare Intensity", value: cnnData.flare, color: "#f59e0b" },
                    { label: "Keratic Precipitates", value: cnnData.kps, color: "#10b981" },
                    { label: "Pupil Reactivity", value: cnnData.pupil, color: "#8b5cf6" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      style={{
                        backgroundColor: "#f8fafc",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "2px" }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1e293b" }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Slitlamp image (now with boxes shown) */}
                <div
                  style={{
                    marginTop: "14px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    position: "relative",
                    height: "140px",
                    background: presetSamples[0].bgGradient,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="120" height="120" viewBox="0 0 200 200" fill="none">
                    <circle cx="100" cy="100" r="80" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                    <circle cx="100" cy="100" r="50" fill="rgba(0,0,0,0.7)" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
                    <path d="M 60 20 L 140 180" stroke="rgba(255,255,255,0.85)" strokeWidth="14" opacity="0.75" />
                  </svg>
                  {presetSamples[0].boxes.map((box, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        top: `${box.y}%`,
                        left: `${box.x}%`,
                        width: `${box.w}%`,
                        height: `${box.h}%`,
                        border: `2px dashed ${box.color}`,
                        borderRadius: "6px",
                        boxShadow: `0 0 10px ${box.color}`,
                      }}
                    >
                      <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "#fff", backgroundColor: box.color, padding: "1px 4px", borderRadius: "3px", whiteSpace: "nowrap" }}>
                        {box.label}
                      </span>
                    </div>
                  ))}
                </div>
              </RevealCard>
            </div>

            {/* Combined Explanation & Uncertainty */}
            <RevealCard
              title="Combined Explanation & Uncertainty Assessment"
              icon={<Activity size={18} style={{ color: "#10b981" }} />}
              revealDelay={0.3}
              accentColor="#10b981"
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", alignItems: "start" }}>
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", marginBottom: "8px" }}>WHY THIS CONCLUSION?</div>
                  <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                    <li style={{ fontSize: "0.8rem", color: "#334155", marginBottom: "6px", lineHeight: 1.5 }}>
                      Both AI models independently indicate <strong>High</strong> severity uveitis above 90% confidence.
                    </li>
                    <li style={{ fontSize: "0.8rem", color: "#334155", marginBottom: "6px", lineHeight: 1.5 }}>
                      Questionnaire Neuro-Fuzzy flags autoimmune association, CNN confirms granulomatous KPs.
                    </li>
                    <li style={{ fontSize: "0.8rem", color: "#334155", lineHeight: 1.5 }}>
                      Combined weighted score ({combinedScore}%) exceeds 90% diagnostic threshold.
                    </li>
                  </ul>
                </div>

                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", marginBottom: "8px" }}>UNCERTAINTY LEVEL</div>
                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(16,185,129,0.07)",
                      border: "1px solid rgba(16,185,129,0.2)",
                    }}
                  >
                    <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#059669", marginBottom: "4px" }}>Low</div>
                    <div style={{ fontSize: "0.78rem", color: "#047857" }}>
                      Both models agree — AI is not abstaining. Uncertainty score: {(100 - Number(combinedScore)).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", marginBottom: "8px" }}>DOCTOR vs AI COMPARISON</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ padding: "10px 12px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b" }}>Your Preliminary:</div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#0f172a" }}>Anterior Uveitis (High Confidence)</div>
                    </div>
                    <div style={{ padding: "10px 12px", borderRadius: "10px", backgroundColor: "rgba(37,99,235,0.05)", border: "1px solid rgba(37,99,235,0.15)" }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#3b82f6" }}>AI Combined Output:</div>
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1d4ed8" }}>{patient.severityClass}</div>
                    </div>
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: "10px",
                        backgroundColor: "rgba(16,185,129,0.08)",
                        border: "1px solid rgba(16,185,129,0.2)",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#047857",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <CheckCircle2 size={14} />
                      Consistent — No disagreement detected
                    </div>
                  </div>
                </div>
              </div>
            </RevealCard>

            {/* Proceed Button */}
            <div style={{ marginTop: "24px", textAlign: "right" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => navigate(`/doctor/patient/${patient.id}/diagnosis`)}
                style={{
                  padding: "14px 32px",
                  borderRadius: "14px",
                  fontSize: "1rem",
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  boxShadow: "0 8px 24px rgba(37,99,235,0.25)",
                }}
              >
                Proceed to Final Diagnosis & Treatment Plan
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </div>
      <Footer />
    </div>
  );
}
