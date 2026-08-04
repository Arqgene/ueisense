import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assessmentsApi } from "../api/client.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Brain,
  ShieldCheck,
  Eye,
  Activity,
  Info,
  ChevronDown,
  ChevronUp,
  EyeOff,
  CheckCircle2,
  HelpCircle,
  Gauge,
  User,
  Calendar,
  Clock,
  Stethoscope,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import LayerProgress from "../components/LayerProgress.jsx";
import { samplePatients } from "./DoctorQueue.jsx";
import "../styles/doctor.css";

// Detailed simulated Q&A answers per patient
const patientQAAnswers = {
  "PT-8942": {
    section1: {
      affected_eye: "Left Eye",
      symptom_start_days: 2,
      onset_type: "Sudden",
      redness_score: 9,
      pain_score: 8,
      photophobia_score: 9,
      blurred_vision_score: 7,
    },
    section2: {
      floaters: "Yes",
      tearing: "Yes",
      discharge: "No",
      swelling: "Maybe",
      headache: "Yes",
      bright_light_worsening: "Yes",
      hazy_vision: "Yes",
      glare_halos: "Maybe",
      peripheral_vision_loss: "No",
    },
    section3: {
      previous_uveitis: "No",
      eye_trauma: "No",
      eye_surgery: "No",
      contact_lens: "No",
      steroid_eye_drop_use: "No",
      prior_treatment: "No",
      episode_count: 0,
    },
    section4: {
      autoimmune_disease: "Yes",
      tuberculosis: "No",
      syphilis: "No",
      immunocompromised: "No",
      recent_infection: "Maybe",
      fever: "Yes",
      weight_loss: "No",
      cough: "No",
      joint_pain: "Yes",
      skin_rash: "No",
      oral_ulcers: "No",
    },
    section5: {
      tb_contact: "No",
      cold_sores: "No",
      chickenpox: "No",
      recent_travel: "No",
      animal_exposure: "No",
      unsafe_food_water: "No",
      current_medications: "Methotrexate 10mg/week",
      steroid_tablets: "No",
      immunosuppressants: "Yes",
      new_medication: "No",
    },
    section6: {
      family_uveitis: "No",
      family_autoimmune: "Yes",
      age: 42,
      sex: "Female",
      smoker: "No",
      allergies: "Penicillin",
      pregnant: "No",
      recent_hospitalization: "No",
    },
  },
};

// Fuzzy model explanation factors — keyed by patient
const aiExplanationFactors = {
  "PT-8942": [
    { label: "Severe Photophobia (9/10)", weight: 94, color: "#ef4444", icon: "🔦" },
    { label: "Sudden Onset Inflammation", weight: 88, color: "#f97316", icon: "⚡" },
    { label: "Active Autoimmune Dx (Methotrexate)", weight: 85, color: "#a855f7", icon: "🧬" },
    { label: "Deep Eye Pain (8/10)", weight: 82, color: "#dc2626", icon: "😣" },
    { label: "Periorbital Redness (9/10)", weight: 80, color: "#f59e0b", icon: "👁️" },
    { label: "Floaters Present", weight: 65, color: "#06b6d4", icon: "💧" },
    { label: "Joint Pain Co-morbidity", weight: 60, color: "#8b5cf6", icon: "🦴" },
    { label: "Hazy Vision Confirmed", weight: 55, color: "#3b82f6", icon: "🌫️" },
  ],
  default: [
    { label: "Redness Score Elevated", weight: 70, color: "#ef4444", icon: "🔴" },
    { label: "Pain Score Present", weight: 65, color: "#f97316", icon: "😣" },
    { label: "Photophobia Reported", weight: 60, color: "#f59e0b", icon: "🔦" },
    { label: "Onset Pattern", weight: 50, color: "#3b82f6", icon: "⏱️" },
    { label: "Symptom Duration", weight: 45, color: "#06b6d4", icon: "📅" },
  ],
};

const QARow = ({ label, value, highlight = false }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      borderBottom: "1px solid rgba(226, 232, 240, 0.6)",
    }}
  >
    <span style={{ fontSize: "0.82rem", color: "#64748b", flex: 1 }}>{label}</span>
    <span
      style={{
        fontSize: "0.85rem",
        fontWeight: 700,
        color: highlight ? "#dc2626" : "#0f172a",
        textAlign: "right",
        marginLeft: "12px",
        backgroundColor: highlight ? "rgba(220, 38, 38, 0.07)" : "transparent",
        padding: highlight ? "2px 8px" : "0",
        borderRadius: "6px",
      }}
    >
      {typeof value === "number" ? (
        <span>{value}{typeof value === "number" && label.includes("Score") ? "/10" : ""}</span>
      ) : (
        value
      )}
    </span>
  </div>
);

const SectionAccordion = ({ title, children, defaultOpen = false, accentColor = "#2563eb" }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      style={{
        borderRadius: "14px",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        marginBottom: "10px",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          background: open ? `rgba(${accentColor === "#2563eb" ? "37,99,235" : "6,182,212"},0.05)` : "#f8fafc",
          border: "none",
          cursor: "pointer",
          fontWeight: 800,
          fontSize: "0.85rem",
          color: open ? accentColor : "#334155",
        }}
      >
        <span>{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "4px 16px 12px" }}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Gauge arc component
function UncertaintyGauge({ value, label, color }) {
  const clampedVal = Math.min(100, Math.max(0, value));
  const radius = 56;
  const circumference = Math.PI * radius;
  const strokeDash = (clampedVal / 100) * circumference;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width="140" height="80" viewBox="0 0 140 80" style={{ overflow: "visible" }}>
        {/* Track */}
        <path
          d={`M 14 74 A ${radius} ${radius} 0 0 1 126 74`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M 14 74 A ${radius} ${radius} 0 0 1 126 74`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="70" y="66" textAnchor="middle" fontSize="20" fontWeight="900" fill={color}>
          {clampedVal}%
        </text>
      </svg>
      <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", marginTop: "-4px" }}>{label}</div>
    </div>
  );
}

export default function DoctorDashboard() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const patient = samplePatients.find((p) => p.id === patientId) || samplePatients[0];
  const qa = patientQAAnswers[patient.id] || patientQAAnswers["PT-8942"];
  const factors = aiExplanationFactors[patient.id] || aiExplanationFactors.default;

  const isHigh = patient.riskTier === "High";
  const isMod = patient.riskTier === "Moderate";

  // Doctor preliminary assessment form state
  const [provDiagnosis, setProvDiagnosis] = useState("");
  const [confidence, setConfidence] = useState("Moderate");
  const [agreeAI, setAgreeAI] = useState(null); // true | false | null
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = provDiagnosis && agreeAI !== null;

  const handleProceed = async () => {
    if (!canSubmit) return;
    setSubmitted(true);

    // Persist preliminary assessment to DB (fire-and-forget, don't block navigation)
    assessmentsApi.create({
      patient_id: patient.id,
      doctor_id: "DR-001", // TODO: replace with session doctor ID
      prov_diagnosis: provDiagnosis,
      confidence_level: confidence,
      agrees_with_ai: agreeAI,
      doctor_notes: notes,
    }).catch(console.warn);

    setTimeout(() => navigate(`/doctor/patient/${patient.id}/imaging`), 600);
  };

  const riskColor = isHigh ? "#dc2626" : isMod ? "#d97706" : "#059669";
  const riskBg = isHigh ? "rgba(220,38,38,0.08)" : isMod ? "rgba(217,119,6,0.08)" : "rgba(5,150,105,0.08)";
  const riskBorder = isHigh ? "rgba(220,38,38,0.2)" : isMod ? "rgba(217,119,6,0.2)" : "rgba(5,150,105,0.2)";

  const uncertaintyScore = Math.max(5, 100 - patient.uveitisProbability);
  const confidenceScore = patient.uveitisProbability;

  return (
    <div className="doctor-page-wrapper">
      <Navbar />
      <div className="container" style={{ paddingTop: "110px", paddingBottom: "80px" }}>

        {/* Back Button */}
        <div style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/doctor/queue")}
            style={{ fontSize: "0.85rem", padding: "7px 14px" }}
          >
            <ArrowLeft size={15} style={{ marginRight: "6px" }} />
            Back to Queue
          </button>
        </div>

        {/* Layer Progress Stepper */}
        <LayerProgress currentStep="dashboard" completedSteps={[]} />

        {/* Patient Banner */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            padding: "20px 28px",
            border: `2px solid ${riskBorder}`,
            backgroundColor: riskBg,
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.8)",
                border: `2px solid ${riskColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "1.1rem",
                color: riskColor,
              }}
            >
              {patient.name.split(" ").map((n) => n[0]).join("")}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 900, color: "#0f172a" }}>{patient.name}</h2>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "8px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    backgroundColor: riskBg,
                    color: riskColor,
                    border: `1px solid ${riskBorder}`,
                  }}
                >
                  {isHigh && <AlertTriangle size={12} style={{ marginRight: "4px", display: "inline" }} />}
                  {patient.riskTier} Risk
                </span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "2px" }}>
                <span>{patient.id}</span> • {patient.age} yrs • {patient.sex} • {patient.affectedEye} • Submitted {patient.submittedAt}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Uveitis Prob.</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 900, color: riskColor, lineHeight: 1 }}>
                {patient.uveitisProbability.toFixed(1)}%
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Severity Class</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1e293b", maxWidth: "200px" }}>
                {patient.severityClass}
              </div>
            </div>
          </div>
        </div>

        {/* Bias-Aware Warning Banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 20px",
            borderRadius: "14px",
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            marginBottom: "24px",
          }}
        >
          <EyeOff size={20} style={{ color: "#d97706", flexShrink: 0 }} />
          <div>
            <span style={{ fontWeight: 800, fontSize: "0.88rem", color: "#92400e" }}>
              Bias-Aware Workflow — Image Results Hidden
            </span>
            <span style={{ fontSize: "0.83rem", color: "#78350f", marginLeft: "8px" }}>
              Slitlamp & fundus CNN analysis results are sealed until you complete your preliminary clinical assessment below. This prevents confirmation bias in your evaluation.
            </span>
          </div>
        </div>

        {/* Main 3-column grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr 1fr", gap: "20px" }}>

          {/* ── LEFT: Patient Q&A Answers ── */}
          <div>
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "22px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                height: "100%",
              }}
            >
              <h3
                style={{
                  margin: "0 0 16px",
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <User size={18} style={{ color: "#2563eb" }} />
                Patient Q&A Answers
              </h3>

              <SectionAccordion title="§1 — Rapid Triage & Onset" defaultOpen accentColor="#2563eb">
                <QARow label="Affected Eye" value={qa.section1.affected_eye} />
                <QARow label="Symptom Duration" value={`${qa.section1.symptom_start_days} days`} />
                <QARow label="Onset Type" value={qa.section1.onset_type} highlight={qa.section1.onset_type === "Sudden"} />
                <QARow label="Redness Score" value={qa.section1.redness_score} highlight={qa.section1.redness_score >= 7} />
                <QARow label="Pain Score" value={qa.section1.pain_score} highlight={qa.section1.pain_score >= 7} />
                <QARow label="Photophobia Score" value={qa.section1.photophobia_score} highlight={qa.section1.photophobia_score >= 7} />
                <QARow label="Blurred Vision Score" value={qa.section1.blurred_vision_score} highlight={qa.section1.blurred_vision_score >= 6} />
              </SectionAccordion>

              <SectionAccordion title="§2 — Associated Eye Symptoms" accentColor="#06b6d4">
                <QARow label="Floaters" value={qa.section2.floaters} highlight={qa.section2.floaters === "Yes"} />
                <QARow label="Tearing" value={qa.section2.tearing} />
                <QARow label="Discharge" value={qa.section2.discharge} />
                <QARow label="Periorbital Swelling" value={qa.section2.swelling} />
                <QARow label="Headache" value={qa.section2.headache} highlight={qa.section2.headache === "Yes"} />
                <QARow label="Bright Light Worsening" value={qa.section2.bright_light_worsening} highlight={qa.section2.bright_light_worsening === "Yes"} />
                <QARow label="Hazy Vision" value={qa.section2.hazy_vision} highlight={qa.section2.hazy_vision === "Yes"} />
                <QARow label="Glare / Halos" value={qa.section2.glare_halos} />
                <QARow label="Peripheral Loss" value={qa.section2.peripheral_vision_loss} />
              </SectionAccordion>

              <SectionAccordion title="§3 — Eye History & Recurrence" accentColor="#8b5cf6">
                <QARow label="Prior Uveitis" value={qa.section3.previous_uveitis} highlight={qa.section3.previous_uveitis === "Yes"} />
                <QARow label="Eye Trauma" value={qa.section3.eye_trauma} />
                <QARow label="Eye Surgery" value={qa.section3.eye_surgery} />
                <QARow label="Contact Lens Use" value={qa.section3.contact_lens} />
                <QARow label="Steroid Drops" value={qa.section3.steroid_eye_drop_use} />
                <QARow label="Prior Treatment" value={qa.section3.prior_treatment} />
                <QARow label="Episode Count" value={qa.section3.episode_count} />
              </SectionAccordion>

              <SectionAccordion title="§4 — Systemic Medical History" accentColor="#ef4444">
                <QARow label="Autoimmune Disease" value={qa.section4.autoimmune_disease} highlight={qa.section4.autoimmune_disease === "Yes"} />
                <QARow label="Tuberculosis" value={qa.section4.tuberculosis} />
                <QARow label="Syphilis" value={qa.section4.syphilis} />
                <QARow label="Immunocompromised" value={qa.section4.immunocompromised} highlight={qa.section4.immunocompromised === "Yes"} />
                <QARow label="Recent Infection" value={qa.section4.recent_infection} />
                <QARow label="Fever" value={qa.section4.fever} highlight={qa.section4.fever === "Yes"} />
                <QARow label="Joint Pain" value={qa.section4.joint_pain} highlight={qa.section4.joint_pain === "Yes"} />
                <QARow label="Skin Rash" value={qa.section4.skin_rash} />
                <QARow label="Oral Ulcers" value={qa.section4.oral_ulcers} />
              </SectionAccordion>

              <SectionAccordion title="§5 & §6 — Exposure, Medications & Demographics" accentColor="#10b981">
                <QARow label="Current Medications" value={qa.section5.current_medications} />
                <QARow label="Immunosuppressants" value={qa.section5.immunosuppressants} highlight={qa.section5.immunosuppressants === "Yes"} />
                <QARow label="TB Contact" value={qa.section5.tb_contact} />
                <QARow label="Family Autoimmune Hx" value={qa.section6.family_autoimmune} highlight={qa.section6.family_autoimmune === "Yes"} />
                <QARow label="Allergies" value={qa.section6.allergies || "None reported"} />
                <QARow label="Sex" value={qa.section6.sex} />
                <QARow label="Smoker" value={qa.section6.smoker} />
              </SectionAccordion>
            </div>
          </div>

          {/* ── CENTER: AI Explanation ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Confidence + Uncertainty Gauges */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "22px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 16px",
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Brain size={18} style={{ color: "#8b5cf6" }} />
                Neuro-Fuzzy Model Output
              </h3>

              <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "16px" }}>
                <UncertaintyGauge value={confidenceScore} label="Model Confidence" color="#2563eb" />
                <UncertaintyGauge value={uncertaintyScore} label="Uncertainty Score" color={uncertaintyScore > 30 ? "#f59e0b" : "#10b981"} />
              </div>

              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  backgroundColor: uncertaintyScore < 20 ? "rgba(16,185,129,0.07)" : "rgba(245,158,11,0.07)",
                  border: `1px solid ${uncertaintyScore < 20 ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                  fontSize: "0.8rem",
                  color: uncertaintyScore < 20 ? "#047857" : "#92400e",
                  fontWeight: 600,
                }}
              >
                <Info size={14} style={{ display: "inline", marginRight: "6px" }} />
                {uncertaintyScore < 20
                  ? "High model confidence — AI is not abstaining from this prediction."
                  : "Moderate uncertainty detected — AI recommends physician-led final validation."}
              </div>
            </div>

            {/* Key Contributing Factors */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "22px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                flex: 1,
              }}
            >
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Sparkles size={18} style={{ color: "#f59e0b" }} />
                AI Explainability — Key Factors
              </h3>
              <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "#64748b" }}>
                Why did the model predict {patient.uveitisProbability.toFixed(1)}% uveitis probability?
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {factors.map((factor, idx) => (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.82rem", color: "#334155", fontWeight: 600 }}>
                        {factor.icon} {factor.label}
                      </span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color: factor.color }}>
                        {factor.weight}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: "7px",
                        borderRadius: "4px",
                        backgroundColor: "#f1f5f9",
                        overflow: "hidden",
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${factor.weight}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.06, ease: "easeOut" }}
                        style={{
                          height: "100%",
                          borderRadius: "4px",
                          backgroundColor: factor.color,
                          opacity: 0.85,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "16px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  backgroundColor: "rgba(37,99,235,0.05)",
                  border: "1px solid rgba(37,99,235,0.15)",
                  fontSize: "0.78rem",
                  color: "#475569",
                  lineHeight: 1.5,
                }}
              >
                <ShieldCheck size={13} style={{ display: "inline", color: "#2563eb", marginRight: "6px" }} />
                Neuro-Fuzzy inference uses adaptive membership functions. Factors are ranked by their individual fuzzy contribution to the final diagnosis score.
              </div>
            </div>
          </div>

          {/* ── RIGHT: Doctor Preliminary Assessment ── */}
          <div>
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "22px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <h3
                style={{
                  margin: "0 0 6px",
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Stethoscope size={18} style={{ color: "#10b981" }} />
                Doctor Preliminary Assessment
              </h3>
              <p style={{ margin: "0 0 20px", fontSize: "0.8rem", color: "#64748b" }}>
                Provide your provisional assessment <em>before</em> reviewing imaging results. This prevents confirmation bias.
              </p>

              {/* Provisional Diagnosis */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Provisional Diagnosis *
                </label>
                <select
                  value={provDiagnosis}
                  onChange={(e) => setProvDiagnosis(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    outline: "none",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <option value="">Select provisional diagnosis…</option>
                  <option value="Acute Non-Granulomatous Anterior Uveitis">Acute Non-Granulomatous Anterior Uveitis</option>
                  <option value="Granulomatous Anterior Uveitis (Sarcoid / HLA-B27)">Granulomatous Anterior Uveitis (Sarcoid / HLA-B27)</option>
                  <option value="Intermediate Uveitis / Pars Planitis">Intermediate Uveitis / Pars Planitis</option>
                  <option value="Posterior Chorioretinitis">Posterior Chorioretinitis</option>
                  <option value="Panuveitis">Panuveitis</option>
                  <option value="Infectious Uveitis (Viral / TB / Toxo)">Infectious Uveitis (Viral / TB / Toxo)</option>
                  <option value="Episcleritis / Scleritis">Episcleritis / Scleritis</option>
                  <option value="Other / Unclear — Needs Imaging">Other / Unclear — Needs Imaging</option>
                </select>
              </div>

              {/* Confidence Level */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                  Confidence in Provisional Diagnosis
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {["Low", "Moderate", "High"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setConfidence(c)}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: "10px",
                        border: confidence === c ? "2px solid #2563eb" : "1px solid #cbd5e1",
                        backgroundColor: confidence === c ? "#eff6ff" : "#ffffff",
                        color: confidence === c ? "#1d4ed8" : "#475569",
                        fontWeight: 800,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Agreement */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                  Do you agree with the AI triage result? *
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { label: "✓ Agree", value: true, color: "#10b981", bg: "rgba(16,185,129,0.08)" },
                    { label: "✗ Disagree / Modify", value: false, color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setAgreeAI(opt.value)}
                      style={{
                        flex: 1,
                        padding: "10px 0",
                        borderRadius: "10px",
                        border: agreeAI === opt.value ? `2px solid ${opt.color}` : "1px solid #cbd5e1",
                        backgroundColor: agreeAI === opt.value ? opt.bg : "#ffffff",
                        color: agreeAI === opt.value ? opt.color : "#475569",
                        fontWeight: 800,
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: "20px", flex: 1 }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Clinical Notes / Justification
                </label>
                <textarea
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note any clinical findings, differential diagnoses, or reasons for disagreeing with the AI result…"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.83rem",
                    lineHeight: 1.5,
                    outline: "none",
                    resize: "vertical",
                    backgroundColor: "#ffffff",
                  }}
                />
              </div>

              {/* Proceed Button */}
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      padding: "12px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(16,185,129,0.1)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      color: "#047857",
                      fontWeight: 800,
                      fontSize: "0.9rem",
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    <CheckCircle2 size={18} />
                    Assessment saved — redirecting to imaging…
                  </motion.div>
                ) : (
                  <motion.button
                    type="button"
                    onClick={handleProceed}
                    disabled={!canSubmit}
                    className="btn btn-primary"
                    whileHover={canSubmit ? { scale: 1.02 } : {}}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "12px",
                      fontSize: "0.92rem",
                      fontWeight: 800,
                      opacity: canSubmit ? 1 : 0.45,
                      cursor: canSubmit ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    Save Preliminary Assessment & Proceed to Imaging
                    <ArrowRight size={16} />
                  </motion.button>
                )}
              </AnimatePresence>

              {!canSubmit && (
                <p style={{ margin: "8px 0 0", fontSize: "0.75rem", color: "#94a3b8", textAlign: "center" }}>
                  * Select a provisional diagnosis and AI agreement to proceed
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
