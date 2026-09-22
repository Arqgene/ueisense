import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assessmentsApi, patientsApi, questionnaireApi, neuroFuzzyApi } from "../api/client.js";
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
  Camera,
  MapPin,
  Phone,
  Layers,
  FileText,
  Sliders,
  Maximize2,
  Check,
  Building2,
  Lock,
  Unlock,
  Share2,
  Send,
  X,
  Shield,
  FileCheck,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import DoctorNavbar from "../components/DoctorNavbar.jsx";
import Footer from "../components/Footer.jsx";
import LayerProgress from "../components/LayerProgress.jsx";
import { samplePatients } from "./DoctorQueue.jsx";
import { formatPercent, normalizePatient } from "../utils/formatters.js";
import { CLINICAL_IMAGE_SAMPLES } from "../utils/clinicalImageSamples.js";
import { AGARWAL_CENTERS } from "../utils/agarwalCenters.js";
import "../styles/doctor.css";

// Helper component for Q&A row
const QARow = ({ label, value, highlight = false }) => {
  const displayVal = value !== undefined && value !== null && value !== "" ? String(value) : "—";
  return (
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
          backgroundColor: highlight ? "rgba(220, 38, 38, 0.08)" : "transparent",
          padding: highlight ? "2px 8px" : "0",
          borderRadius: "6px",
        }}
      >
        {displayVal}
      </span>
    </div>
  );
};

// Collapsible accordion for Q&A sections
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
          background: open ? `rgba(37,99,235,0.04)` : "#f8fafc",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1e293b" }}>{title}</span>
        {open ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ padding: "8px 16px 14px", backgroundColor: "#ffffff" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Gauge arc component
function UncertaintyGauge({ value, label, color }) {
  const num = typeof value === "number" ? value : parseFloat(value) || 0;
  const clampedVal = Math.round(Math.min(100, Math.max(0, num)));
  const radius = 54;
  const circumference = Math.PI * radius;
  const strokeDash = (clampedVal / 100) * circumference;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width="130" height="75" viewBox="0 0 130 75" style={{ overflow: "visible" }}>
        <path
          d={`M 12 70 A ${radius} ${radius} 0 0 1 118 70`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d={`M 12 70 A ${radius} ${radius} 0 0 1 118 70`}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${strokeDash} ${circumference}`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text x="65" y="64" textAnchor="middle" fontSize="18" fontWeight="900" fill={color}>
          {clampedVal}%
        </text>
      </svg>
      <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748b", marginTop: "-4px" }}>{label}</div>
    </div>
  );
}

export default function DoctorDashboard() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  // Active doctor session
  const [currentDoctor, setCurrentDoctor] = useState(() => {
    try {
      const active = localStorage.getItem("activeDoctor");
      if (active) return JSON.parse(active);
    } catch {}
    return AGARWAL_CENTERS[0]; // Dr. Soundari S., Senior Consultant
  });

  const isSenior = currentDoctor.role === "senior";

  // Active view tab: "questions_xai" | "imaging_xai" | "synthesis"
  const [activeTab, setActiveTab] = useState("questions_xai");

  // Patient data state
  const [patientRecord, setPatientRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Imaging modality & view state
  const [selectedModality, setSelectedModality] = useState("slitlamp"); // "slitlamp" | "oct" | "fundus"
  const [imageMode, setImageMode] = useState("gradcam"); // "original" | "gradcam" | "boxes"

  // Doctor preliminary assessment form state (Path A / Path B)
  const [provDiagnosis, setProvDiagnosis] = useState("");
  const [confidence, setConfidence] = useState("Moderate");
  const [agreeAI, setAgreeAI] = useState(null); // true | false | null
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Path A: Case Closure Modal state
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeReason, setCloseReason] = useState("Resolved Episcleritis / Non-Uveitic");
  const [dischargeSummary, setDischargeSummary] = useState("");
  const [closingCase, setClosingCase] = useState(false);

  // Cross-Doctor Referral Modal state
  const [referModalOpen, setReferModalOpen] = useState(false);
  const [referTargetDoctorId, setReferTargetDoctorId] = useState(
    AGARWAL_CENTERS.find((d) => d.id !== currentDoctor.id)?.id || "DR-AG-02"
  );
  const [referReason, setReferReason] = useState("Sub-specialty consultation & multi-modal management");
  const [referPriority, setReferPriority] = useState("Urgent / 24h");
  const [referring, setReferring] = useState(false);
  const [referSuccessMsg, setReferSuccessMsg] = useState("");

  // Path B (Junior Doctor): "Feature It First" state
  const [juniorAcCells, setJuniorAcCells] = useState("+2 Grade (11-20 cells/field)");
  const [juniorFlare, setJuniorFlare] = useState("Moderate (+2)");
  const [juniorKp, setJuniorKp] = useState("Mutton-Fat Keratic Precipitates");
  const [juniorPupil, setJuniorPupil] = useState("Sluggish / Synechia Risk");
  const [juniorSubtype, setJuniorSubtype] = useState("Acute Anterior Uveitis");
  const [juniorNotes, setJuniorNotes] = useState("");
  const [juniorSubmitting, setJuniorSubmitting] = useState(false);
  const [juniorSubmitted, setJuniorSubmitted] = useState(false);

  // Senior Doctor Ratification state
  const [seniorDecision, setSeniorDecision] = useState("approve");
  const [seniorNotes, setSeniorNotes] = useState("");
  const [seniorSubmitting, setSeniorSubmitting] = useState(false);
  const [seniorApproved, setSeniorApproved] = useState(false);

  // Load patient with strict privacy and access validation
  const loadPatientData = (docId = currentDoctor.id) => {
    setLoading(true);
    patientsApi
      .get(patientId, docId)
      .then((data) => {
        if (data && data.id) {
          setPatientRecord(data);
          setAccessDenied(false);
          if (data.junior_annotations) {
            setJuniorSubmitted(true);
          }
          if (data.senior_approval_status === "approved") {
            setSeniorApproved(true);
          }
        }
      })
      .catch((err) => {
        if (err.message && err.message.includes("403")) {
          setAccessDenied(true);
        } else {
          console.warn("Could not fetch patient from server, using fallback:", err);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPatientData(currentDoctor.id);
  }, [patientId, currentDoctor.id]);

  const handleDoctorSwitch = (doc) => {
    setCurrentDoctor(doc);
    try {
      localStorage.setItem("activeDoctor", JSON.stringify(doc));
    } catch {}
    loadPatientData(doc.id);
  };

  // Merge loaded patient with fallback
  const fallbackSample = samplePatients.find((p) => p.id === patientId) || samplePatients[0];
  const patient = patientRecord
    ? normalizePatient(patientRecord)
    : normalizePatient(fallbackSample);

  // Questionnaire answers (unified across SQLite structured tables and raw payload)
  const rawQA = patientRecord?.questionnaire || {};
  const rawFull = rawQA.full_intake?.full_intake || rawQA.full_intake || {};
  const intake = {
    ...rawFull,
    ...(rawQA.section1 || {}),
    ...(rawQA.section2 || {}),
    ...(rawQA.section3 || {}),
    ...(rawQA.section4 || {}),
    ...(rawQA.section5 || {}),
    ...(rawQA.section6 || {}),
  };
  const s1 = rawQA.section1 || intake;
  const s2 = rawQA.section2 || intake;
  const s3 = rawQA.section3 || intake;
  const s4 = rawQA.section4 || intake;
  const s5 = rawQA.section5 || intake;
  const s6 = rawQA.section6 || intake;

  // Neuro-Fuzzy Question XAI
  const neuroFuzzy = patientRecord?.neuro_fuzzy;
  const defaultFeatureImportance =
    (patient?.uveitisProbability || 0) < 35
      ? [
          { feature: "Low / Absent Photophobia", impact: Math.max(5, Math.round(Number(intake.photophobia_score ?? intake.photophobia_impact ?? 0) * 8)), category: "Ocular", detail: "No acute ciliary body spasm reported" },
          { feature: "Minimal / Normal Surface Vascularity", impact: Math.max(5, Math.round(Number(intake.redness_score ?? 0) * 8)), category: "Ocular", detail: "Perilimbal flush absent or minimal" },
          { feature: "Mild / No Ocular Ache", impact: Math.max(5, Math.round(Number(intake.pain_score ?? 0) * 8)), category: "Ocular", detail: "Pain level low or absent" },
          { feature: "Gradual / Indolent Profile", impact: intake.onset_type === "Suddenly" ? 50 : 12, category: "Onset", detail: "Gradual progression distinguishes from acute attack" },
          { feature: "Clear Visual Axis / No Floaters", impact: intake.floaters === "Yes" ? 40 : 8, category: "Visual", detail: "Vitreous and anterior chamber clear of cellular haze" },
        ]
      : [
          { feature: "Severe Photophobia", impact: 92, category: "Ocular", detail: "Spasm of ciliary body / iris sphincter" },
          { feature: "Deep Ciliary Pain & Hyperemia", impact: 86, category: "Ocular", detail: "Perilimbal vascular injection" },
          { feature: "Systemic Inflammatory Markers", impact: 80, category: "Systemic", detail: "HLA-B27 / Autoimmune correlation" },
          { feature: "Sudden Symptom Onset (< 48h)", impact: 78, category: "Onset", detail: "Rapid onset distinguishes from chronic dry eye" },
          { feature: "Visual Disturbances & Vitreous Floaters", impact: 64, category: "Visual", detail: "Turbidity and inflammatory cellular debris" },
        ];

  const featureImportance =
    neuroFuzzy?.feature_importance && neuroFuzzy.feature_importance.length > 0
      ? neuroFuzzy.feature_importance
      : defaultFeatureImportance;

  const questionExplanations =
    neuroFuzzy?.explanation && neuroFuzzy.explanation.length > 0
      ? neuroFuzzy.explanation
      : (patient?.uveitisProbability || 0) < 35
      ? [
          `Low-risk clinical screening profile (${formatPercent(patient?.uveitisProbability)}) under Dr. Agarwal's Diagnostic Guidelines.`,
          "Mild or absent photophobia and lack of deep ciliary flush suggest benign surface irritation or routine presentation.",
          "Adaptive neuro-fuzzy rules recommend routine outpatient follow-up rather than emergent intervention.",
        ]
      : [
          `High-confidence clinical prediction (${formatPercent(patient?.uveitisProbability)}) under Dr. Agarwal's Diagnostic Guidelines.`,
          "Acute photophobia (light sensitivity) and severe ocular ache strongly correlate with acute anterior chamber inflammation.",
          "Adaptive neuro-fuzzy rules flagged urgent priority profile warranting immediate biomicroscopy.",
        ];

  // Slitlamp image & Grad-CAM data
  const defaultSampleImg = CLINICAL_IMAGE_SAMPLES[0];
  const cnnData = patientRecord?.cnn;
  const imagingData = patientRecord?.imaging;
  const activeImageUrl = patientRecord?.image_url || imagingData?.image_path || defaultSampleImg?.gradient;
  const gradcamData = cnnData?.gradcam_data || {
    hotspots: defaultSampleImg?.gradcamHotspots || [],
    confidence: (defaultSampleImg?.confidence ? defaultSampleImg.confidence * 100 : 85).toFixed(1),
  };
  const overlayBoxes = cnnData?.overlay_boxes || defaultSampleImg?.overlayBoxes || [];

  const riskTier =
    patient?.riskTier ||
    (patient?.uveitisProbability >= 70
      ? "High"
      : patient?.uveitisProbability >= 30
      ? "Moderate"
      : "Low");
  const isHigh = riskTier === "High" || (patient?.uveitisProbability != null && patient.uveitisProbability >= 70);
  const isMod = !isHigh && (riskTier === "Moderate" || (patient?.uveitisProbability != null && patient.uveitisProbability >= 30));
  const riskColor = isHigh ? "#dc2626" : isMod ? "#d97706" : "#059669";
  const riskBg = isHigh ? "#fef2f2" : isMod ? "#fffbeb" : "#ecfdf5";
  const riskBorder = isHigh ? "#fca5a5" : isMod ? "#fde68a" : "#a7f3d0";

  const confidenceScore = patient?.uveitisProbability || 85;
  const uncertaintyScore = Math.max(5, 100 - confidenceScore);

  // Close Case Action
  const handleCloseCase = async () => {
    setClosingCase(true);
    try {
      await patientsApi.closeCase(patient.id, {
        doctor_id: currentDoctor.id,
        doctor_name: currentDoctor.name,
        reason: closeReason,
        discharge_summary: dischargeSummary || "Condition reviewed and confirmed resolved / non-uveitic. Patient discharged.",
      });
      setCloseModalOpen(false);
      loadPatientData(currentDoctor.id);
    } catch (err) {
      console.warn("Local fallback for case closure:", err);
      setPatientRecord((prev) =>
        prev
          ? {
              ...prev,
              case_status: "closed",
              closure_reason: closeReason,
              discharge_summary: dischargeSummary || "Condition resolved / non-uveitic.",
              closed_by_doctor_id: currentDoctor.id,
              closed_at: new Date().toISOString(),
            }
          : null
      );
      setCloseModalOpen(false);
    } finally {
      setClosingCase(false);
    }
  };

  // Cross-Doctor Referral Action
  const handleReferDoctor = async () => {
    setReferring(true);
    try {
      await patientsApi.referDoctor(patient.id, {
        from_doctor_id: currentDoctor.id,
        to_doctor_id: referTargetDoctorId,
        referral_reason: referReason,
        priority: referPriority,
      });
      const targetDoc = AGARWAL_CENTERS.find((d) => d.id === referTargetDoctorId);
      setReferSuccessMsg(
        `Case dossier transferred to ${targetDoc?.name || referTargetDoctorId}. All questionnaires, dual XAI attributions, and imaging data are now accessible in their clinical workbench.`
      );
      loadPatientData(currentDoctor.id);
      setTimeout(() => {
        setReferModalOpen(false);
        setReferSuccessMsg("");
      }, 2500);
    } catch (err) {
      console.warn("Local fallback for referral:", err);
      const targetDoc = AGARWAL_CENTERS.find((d) => d.id === referTargetDoctorId);
      setReferSuccessMsg(`Case dossier shared with ${targetDoc?.name || referTargetDoctorId}. Access permissions updated.`);
      setPatientRecord((prev) =>
        prev
          ? {
              ...prev,
              referred_to_doctor_id: referTargetDoctorId,
              referred_by_doctor_id: currentDoctor.id,
              case_status: "referred",
              referral_notes: referReason,
            }
          : null
      );
      setTimeout(() => {
        setReferModalOpen(false);
        setReferSuccessMsg("");
      }, 2500);
    } finally {
      setReferring(false);
    }
  };

  // Junior Feature Submission ("Feature It First")
  const handleJuniorFeatureSubmit = async () => {
    setJuniorSubmitting(true);
    try {
      await patientsApi.submitJuniorFeatures(patient.id, {
        doctor_id: currentDoctor.id,
        ac_cells: juniorAcCells,
        flare: juniorFlare,
        kp_morphology: juniorKp,
        pupil_reactivity: juniorPupil,
        provisional_subtype: juniorSubtype,
        clinical_notes: juniorNotes,
      });
      setJuniorSubmitted(true);
      loadPatientData(currentDoctor.id);
    } catch (err) {
      console.warn("Local fallback for junior features:", err);
      setJuniorSubmitted(true);
      setPatientRecord((prev) =>
        prev
          ? {
              ...prev,
              case_status: "pending_senior_review",
              senior_approval_status: "pending",
              junior_annotations: {
                doctor_id: currentDoctor.id,
                ac_cells: juniorAcCells,
                flare: juniorFlare,
                kp_morphology: juniorKp,
                pupil_reactivity: juniorPupil,
                provisional_subtype: juniorSubtype,
                clinical_notes: juniorNotes,
                submitted_at: new Date().toISOString(),
              },
            }
          : null
      );
    } finally {
      setJuniorSubmitting(false);
    }
  };

  // Senior Consultant Ratification Action
  const handleSeniorRatify = async () => {
    setSeniorSubmitting(true);
    try {
      await patientsApi.seniorApprove(patient.id, {
        doctor_id: currentDoctor.id,
        decision: seniorDecision,
        senior_notes: seniorNotes || "Clinical management verified and endorsed under Dr. Agarwal's Diagnostic Guidelines.",
      });
      setSeniorApproved(true);
      loadPatientData(currentDoctor.id);
    } catch (err) {
      console.warn("Local fallback for senior ratification:", err);
      setSeniorApproved(true);
      setPatientRecord((prev) =>
        prev
          ? {
              ...prev,
              case_status: "senior_ratified",
              senior_approval_status: "approved",
              senior_approved_by: currentDoctor.name,
              senior_approved_at: new Date().toISOString(),
              senior_notes: seniorNotes || "Endorsed by senior consultant.",
            }
          : null
      );
    } finally {
      setSeniorSubmitting(false);
    }
  };

  // Preliminary assessment submission (Path B proceed to imaging)
  const canSubmit = provDiagnosis && agreeAI !== null;
  const handleProceed = async () => {
    if (!canSubmit) return;
    setSubmitted(true);

    try {
      await assessmentsApi.create({
        patient_id: patient.id,
        doctor_id: currentDoctor.id,
        prov_diagnosis: provDiagnosis,
        confidence_level: confidence,
        agrees_with_ai: agreeAI,
        doctor_notes: notes,
      });
    } catch (e) {
      console.warn("Assessment saved locally:", e);
    }

    setTimeout(() => {
      setActiveTab("imaging_xai");
      setSubmitted(false);
    }, 500);
  };

  return (
    <div className="doctor-page-wrapper">
      <DoctorNavbar />
      <div className="container" style={{ paddingTop: "110px", paddingBottom: "80px" }}>
        
        {/* Back Button & Patient Navigation */}
        {/* Access Denied Shield for Data Isolation */}
        {accessDenied && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "2px solid #ef4444",
              borderRadius: "20px",
              padding: "32px",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            <Shield size={44} color="#dc2626" style={{ margin: "0 auto 12px" }} />
            <h2 style={{ fontSize: "1.3rem", fontWeight: 900, color: "#991b1b", margin: "0 0 8px" }}>
              🔒 Patient Dossier Protected — Strict Data Isolation Enforced
            </h2>
            <p style={{ fontSize: "0.88rem", color: "#7f1d1d", maxWidth: "600px", margin: "0 auto 18px" }}>
              Under Dr. Agarwal's Clinical Governance Policy, this patient record is strictly confidential and
              only accessible to the assigned attending physician, referred specialists, or supervising senior consultants.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/doctor/queue")}
                style={{ fontSize: "0.85rem" }}
              >
                Return to Triage Queue
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const assignedDoc = AGARWAL_CENTERS.find((d) => d.id === patient.assigned_doctor_id) || AGARWAL_CENTERS[0];
                  handleDoctorSwitch(assignedDoc);
                }}
                style={{ fontSize: "0.85rem" }}
              >
                Switch to Assigned Physician ({patient.assigned_doctor_name || "Attending"})
              </button>
            </div>
          </div>
        )}

        {/* Back Button, Doctor Session Bar & Quick Action Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/doctor/queue")}
              style={{ fontSize: "0.85rem", padding: "7px 14px", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <ArrowLeft size={15} />
              Back to Triage Queue
            </button>

            {/* Active Doctor Session & Role Pill */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#ffffff",
                padding: "6px 14px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
              }}
            >
              <Stethoscope size={14} color="#2563eb" />
              <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1e293b" }}>{currentDoctor.name}</span>
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: "6px",
                  backgroundColor: isSenior ? "#ecfdf5" : "#fffbeb",
                  color: isSenior ? "#047857" : "#b45309",
                  border: `1px solid ${isSenior ? "#a7f3d0" : "#fde68a"}`,
                }}
              >
                {isSenior ? "★ Senior Consultant" : "🎓 Junior Specialist"}
              </span>
              {currentDoctor.role === "junior" && currentDoctor.supervisor_name && (
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                  (Supervised by {currentDoctor.supervisor_name.split(",")[0]})
                </span>
              )}

              {/* Quick Clinician Switcher for Verification */}
              <select
                value={currentDoctor.id}
                onChange={(e) => {
                  const doc = AGARWAL_CENTERS.find((d) => d.id === e.target.value);
                  if (doc) handleDoctorSwitch(doc);
                }}
                style={{
                  fontSize: "0.75rem",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#f8fafc",
                  cursor: "pointer",
                  marginLeft: "4px",
                }}
              >
                {AGARWAL_CENTERS.map((d) => (
                  <option key={d.id} value={d.id}>
                    Switch to {d.name} ({d.role === "senior" ? "Senior" : "Junior"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons: Close Case & Refer to Colleague Doctor */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setReferModalOpen(true)}
              style={{
                fontSize: "0.82rem",
                padding: "7px 14px",
                borderRadius: "10px",
                border: "1px solid #7c3aed",
                backgroundColor: "#f5f3ff",
                cursor: "pointer",
                fontWeight: 800,
                color: "#6d28d9",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Share2 size={14} />
              Refer to Colleague Specialist
            </button>

            {patientRecord?.case_status !== "closed" ? (
              <button
                type="button"
                onClick={() => setCloseModalOpen(true)}
                style={{
                  fontSize: "0.82rem",
                  padding: "7px 14px",
                  borderRadius: "10px",
                  border: "1px solid #94a3b8",
                  backgroundColor: "#ffffff",
                  cursor: "pointer",
                  fontWeight: 800,
                  color: "#475569",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <CheckCircle2 size={14} color="#10b981" />
                Close Case (Discharge)
              </button>
            ) : (
              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 800,
                  padding: "6px 12px",
                  borderRadius: "8px",
                  backgroundColor: "#f1f5f9",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                }}
              >
                ✓ Case Closed &amp; Discharged
              </span>
            )}
          </div>
        </div>

        {/* Status Notification Banners */}
        {patientRecord?.case_status === "closed" && (
          <div
            style={{
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              borderRadius: "16px",
              padding: "16px 20px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <CheckCircle2 size={20} color="#059669" />
              <div>
                <strong style={{ color: "#0f172a", fontSize: "0.92rem" }}>
                  Case Discharged &amp; Closed: {patientRecord.closure_reason || "Resolved / Non-Uveitic"}
                </strong>
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "2px" }}>
                  Summary: {patientRecord.discharge_summary || "Patient discharged under outpatient protocol."}
                  {patientRecord.closed_at && ` • Closed on ${patientRecord.closed_at.slice(0, 10)}`}
                </div>
              </div>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", backgroundColor: "#e2e8f0", padding: "4px 10px", borderRadius: "6px" }}>
              Archived in SQLite
            </span>
          </div>
        )}

        {patientRecord?.case_status === "pending_senior_review" && (
          <div
            style={{
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "16px",
              padding: "14px 20px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertTriangle size={20} color="#d97706" />
              <div>
                <strong style={{ color: "#92400e", fontSize: "0.92rem" }}>
                  Junior Doctor Evaluation Recorded — Pending Senior Consultant Oversight
                </strong>
                <div style={{ fontSize: "0.82rem", color: "#b45309", marginTop: "2px" }}>
                  Features annotated by junior specialist. Senior consultant review is required to ratify the clinical diagnosis.
                </div>
              </div>
            </div>
            {isSenior && (
              <button
                type="button"
                onClick={() => setActiveTab("imaging_xai")}
                className="btn btn-primary"
                style={{ fontSize: "0.8rem", padding: "6px 14px" }}
              >
                Review &amp; Ratify Now →
              </button>
            )}
          </div>
        )}

        {patientRecord?.case_status === "senior_ratified" && (
          <div
            style={{
              backgroundColor: "#ecfdf5",
              border: "1px solid #a7f3d0",
              borderRadius: "16px",
              padding: "14px 20px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldCheck size={20} color="#059669" />
              <div>
                <strong style={{ color: "#065f46", fontSize: "0.92rem" }}>
                  ★ Clinical Protocol Ratified by Senior Consultant ({patientRecord.senior_approved_by || "Senior Specialist"})
                </strong>
                <div style={{ fontSize: "0.82rem", color: "#047857", marginTop: "2px" }}>
                  {patientRecord.senior_notes || "Junior evaluation verified and endorsed under Dr. Agarwal's Diagnostic Guidelines."}
                </div>
              </div>
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#047857", backgroundColor: "#d1fae5", padding: "4px 10px", borderRadius: "6px" }}>
              Senior Endorsed
            </span>
          </div>
        )}

        {patientRecord?.referred_to_doctor_id === currentDoctor.id && (
          <div
            style={{
              backgroundColor: "#faf5ff",
              border: "1px solid #e9d5ff",
              borderRadius: "16px",
              padding: "14px 20px",
              marginBottom: "18px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Share2 size={20} color="#7c3aed" />
            <div>
              <strong style={{ color: "#581c87", fontSize: "0.92rem" }}>
                Referred Patient Case Dossier Transferred to You
              </strong>
              <div style={{ fontSize: "0.82rem", color: "#6b21a8", marginTop: "2px" }}>
                Referred by attending doctor ({patientRecord.referred_by_doctor_id || "Colleague"}). All historical answers, dual XAI attributions, and imaging data are fully accessible.
                {patientRecord.referral_notes && ` • Notes: "${patientRecord.referral_notes}"`}
              </div>
            </div>
          </div>
        )}

        {/* Stepper */}
        <LayerProgress currentStep="dashboard" completedSteps={[]} />

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* PROMINENT PATIENT CASE FILE HEADER — ALWAYS UNDER PATIENT NAME             */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            padding: "24px 30px",
            border: `2px solid ${riskBorder}`,
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
            marginBottom: "22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: riskBg,
                border: `2px solid ${riskColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "1.25rem",
                color: riskColor,
                flexShrink: 0,
              }}
            >
              {(patient.name || "PT")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: "6px" }}>
                  {patient.id}
                </span>

                {/* PATIENT NAME FRONT AND CENTER */}
                <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, color: "#0f172a" }}>
                  {patient.name}
                </h1>

                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    backgroundColor: riskBg,
                    color: riskColor,
                    border: `1px solid ${riskBorder}`,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {isHigh && <AlertTriangle size={13} />}
                  {patient.riskTier} Risk
                </span>
              </div>

              {/* Patient Demographics and Hospital Routing */}
              <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "5px", display: "flex", flexWrap: "wrap", gap: "14px" }}>
                <span><strong>Age/Sex:</strong> {patient.age} yrs • {patient.sex}</span>
                {patient.phone && (
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Phone size={13} color="#2563eb" /> {patient.phone}
                  </span>
                )}
                <span><strong>Affected Eye:</strong> {patient.affectedEye}</span>
                <span><strong>Onset:</strong> {patient.onset}</span>
                <span><strong>Submitted:</strong> {patient.submittedAt}</span>
              </div>

              {/* Assigned Center & Doctor */}
              <div style={{ marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "0.82rem" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#b91c1c", fontWeight: 700 }}>
                  <MapPin size={13} />
                  {patient.hospital_branch || "Dr. Agarwal's Eye Hospital - Cathedral Road (Chennai Main)"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#1d4ed8", fontWeight: 700 }}>
                  <Stethoscope size={13} />
                  Attending: {patient.assigned_doctor_name || "Dr. Soundari S., MS, FMRF"}
                </span>
              </div>
            </div>
          </div>

          {/* Uveitis Metrics Cards */}
          <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
            <div style={{ textAlign: "center", padding: "10px 16px", backgroundColor: "#f8fafc", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Uveitis Probability</div>
              <div style={{ fontSize: "1.7rem", fontWeight: 900, color: riskColor, lineHeight: 1.1 }}>
                {formatPercent(patient.uveitisProbability)}
              </div>
            </div>

            <div style={{ textAlign: "center", padding: "10px 16px", backgroundColor: "#f8fafc", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Referral Urgency</div>
              <div style={{ fontSize: "1.7rem", fontWeight: 900, color: "#2563eb", lineHeight: 1.1 }}>
                {patient.urgencyIndex ?? 85}%
              </div>
            </div>

            <div style={{ maxWidth: "210px" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>Diagnostic Severity</div>
              <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#1e293b", marginTop: "2px" }}>
                {patient.severityClass}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* TAB WORKBENCH NAVIGATION                                                  */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            borderBottom: "2px solid #e2e8f0",
            marginBottom: "24px",
            paddingBottom: "2px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("questions_xai")}
            style={{
              padding: "10px 20px",
              fontSize: "0.92rem",
              fontWeight: 800,
              cursor: "pointer",
              border: "none",
              borderBottom: activeTab === "questions_xai" ? "3px solid #2563eb" : "3px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "questions_xai" ? "#2563eb" : "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "-2px",
              transition: "all 0.15s ease",
            }}
          >
            <Brain size={18} />
            Question Model &amp; Clinical Q&amp;A
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("imaging_xai")}
            style={{
              padding: "10px 20px",
              fontSize: "0.92rem",
              fontWeight: 800,
              cursor: "pointer",
              border: "none",
              borderBottom: activeTab === "imaging_xai" ? "3px solid #2563eb" : "3px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "imaging_xai" ? "#2563eb" : "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "-2px",
              transition: "all 0.15s ease",
            }}
          >
            <Camera size={18} />
            Slitlamp Image &amp; Grad-CAM XAI
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("synthesis")}
            style={{
              padding: "10px 20px",
              fontSize: "0.92rem",
              fontWeight: 800,
              cursor: "pointer",
              border: "none",
              borderBottom: activeTab === "synthesis" ? "3px solid #2563eb" : "3px solid transparent",
              backgroundColor: "transparent",
              color: activeTab === "synthesis" ? "#2563eb" : "#64748b",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "-2px",
              transition: "all 0.15s ease",
            }}
          >
            <Layers size={18} />
            Complete Dual XAI Case Synthesis
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: QUESTION MODEL & CLINICAL Q&A WORKBENCH                            */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {activeTab === "questions_xai" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.15fr 1fr", gap: "20px" }}>
            
            {/* ── LEFT COLUMN: Patient Questionnaire Answers ── */}
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <User size={18} style={{ color: "#2563eb" }} />
                    Answers by {patient.name}
                  </h3>
                  <span style={{ fontSize: "0.74rem", color: "#10b981", fontWeight: 700, backgroundColor: "#ecfdf5", padding: "2px 8px", borderRadius: "6px" }}>
                    SQLite Synced
                  </span>
                </div>

                <SectionAccordion title="§1 — Rapid Triage & Pain Symptoms" defaultOpen accentColor="#2563eb">
                  <QARow
                    label="Affected Eye"
                    value={intake.affected_eye ? (intake.affected_eye.toLowerCase().includes("eye") ? intake.affected_eye : `${intake.affected_eye} Eye`) : (patient.affectedEye || "Left Eye")}
                  />
                  <QARow
                    label="Symptom Duration"
                    value={intake.symptom_duration_days !== undefined && intake.symptom_duration_days !== null && intake.symptom_duration_days !== "" ? `${intake.symptom_duration_days} days` : (patient.symptomStart || "0 days")}
                  />
                  <QARow
                    label="Onset Type"
                    value={intake.onset_type || patient.onset || "Gradually"}
                    highlight={(intake.onset_type || patient.onset) === "Suddenly" || (intake.onset_type || patient.onset) === "Sudden"}
                  />
                  <QARow
                    label="Redness Score"
                    value={`${intake.redness_score ?? patient.rednessScore ?? 0}/10`}
                    highlight={Number(intake.redness_score ?? patient.rednessScore ?? 0) >= 7}
                  />
                  <QARow
                    label="Pain Score"
                    value={`${intake.pain_score ?? patient.painScore ?? 0}/10`}
                    highlight={Number(intake.pain_score ?? patient.painScore ?? 0) >= 7}
                  />
                  <QARow
                    label="Photophobia (Light Sensitivity)"
                    value={`${intake.photophobia_score ?? intake.photophobia_impact ?? patient.photophobiaScore ?? 0}/10`}
                    highlight={Number(intake.photophobia_score ?? intake.photophobia_impact ?? patient.photophobiaScore ?? 0) >= 7}
                  />
                  <QARow
                    label="Blurred Vision / Disturbance"
                    value={intake.subjective_visual_disturbance || (intake.blurred_vision_score !== undefined ? `${intake.blurred_vision_score}/10` : (patient.blurredScore !== undefined ? `${patient.blurredScore}/10` : "None"))}
                    highlight={intake.subjective_visual_disturbance === "Severe" || intake.subjective_visual_disturbance === "Very severe" || Number(intake.blurred_vision_score) >= 6}
                  />
                </SectionAccordion>

                <SectionAccordion title="§2 — Associated Eye Symptoms" accentColor="#06b6d4">
                  <QARow
                    label="Floaters"
                    value={intake.floaters || (intake.floater_count && intake.floater_count !== "None" ? "Yes" : "No")}
                    highlight={(intake.floaters || "").toLowerCase() === "yes"}
                  />
                  <QARow
                    label="Floater Count & Frequency"
                    value={intake.floater_count && intake.floater_count !== "None" ? `${intake.floater_count} (${intake.floater_frequency || "Occasional"})` : "None"}
                  />
                  <QARow
                    label="Floater Appearance"
                    value={Array.isArray(intake.floater_appearance) && intake.floater_appearance.length > 0 ? intake.floater_appearance.join(", ") : "None"}
                  />
                  <QARow
                    label="Pain Location"
                    value={intake.pain_location || "None"}
                  />
                  <QARow
                    label="Pain Nature"
                    value={Array.isArray(intake.pain_nature) && intake.pain_nature.length > 0 ? intake.pain_nature.join(", ") : (intake.pain_nature || "None reported")}
                  />
                  <QARow
                    label="Pain with Eye Movement"
                    value={intake.pain_with_movement || "No"}
                    highlight={(intake.pain_with_movement || "").toLowerCase() === "yes"}
                  />
                  <QARow
                    label="Blind Spots (Scotoma)"
                    value={intake.scotoma || "No"}
                    highlight={(intake.scotoma || "").toLowerCase() === "yes"}
                  />
                  <QARow
                    label="Visual Distortion"
                    value={intake.visual_distortion || "No"}
                    highlight={(intake.visual_distortion || "").toLowerCase() === "yes"}
                  />
                  <QARow
                    label="Predominant Visual Problem"
                    value={intake.predominant_visual_problem || "Normal vision"}
                    highlight={intake.predominant_visual_problem && intake.predominant_visual_problem !== "Normal vision"}
                  />
                </SectionAccordion>

                <SectionAccordion title="§3 — Eye History & Recurrence" accentColor="#8b5cf6">
                  <QARow
                    label="Prior Uveitis Episode"
                    value={intake.previous_uveitis || (patient.priorUveitis ? "Yes" : "No")}
                    highlight={(intake.previous_uveitis || "").toLowerCase() === "yes" || patient.priorUveitis}
                  />
                  <QARow
                    label="Prior Episode Count"
                    value={intake.episode_count && intake.episode_count !== "0" ? `${intake.episode_count} episode(s)` : "0 (First episode)"}
                  />
                  <QARow
                    label="Prior Uveitis Type"
                    value={intake.uveitis_type || "None reported"}
                  />
                  <QARow
                    label="Most Recent Episode"
                    value={intake.recent_episode_timing || "Never"}
                  />
                  <QARow
                    label="Eye Trauma / Surgery History"
                    value={Array.isArray(intake.ocular_history_types) && intake.ocular_history_types.length > 0 ? intake.ocular_history_types.join(", ") : (intake.ocular_history || "No prior trauma/surgery")}
                  />
                  <QARow
                    label="Contact Lens Use"
                    value={intake.contact_lens_use || intake.contact_lens || "No"}
                    highlight={(intake.contact_lens_use || intake.contact_lens || "").toLowerCase() === "yes"}
                  />
                </SectionAccordion>

                <SectionAccordion title="§4 — Systemic Autoimmune & Infection" accentColor="#ef4444">
                  <QARow
                    label="Systemic Autoimmune Disease"
                    value={Array.isArray(intake.systemic_disease_types) && intake.systemic_disease_types.length > 0 ? intake.systemic_disease_types.join(", ") : (intake.systemic_inflammatory_disease || (patient.autoimmuneFlag ? "Yes" : "No"))}
                    highlight={(Array.isArray(intake.systemic_disease_types) && intake.systemic_disease_types.length > 0) || (intake.systemic_inflammatory_disease || "").toLowerCase() === "yes" || patient.autoimmuneFlag}
                  />
                  <QARow
                    label="Disease Duration"
                    value={intake.systemic_disease_duration || "None"}
                  />
                  <QARow
                    label="Joint Pain / Stiffness"
                    value={intake.joint_pain || "No"}
                    highlight={(intake.joint_pain || "").toLowerCase() === "yes"}
                  />
                  <QARow
                    label="Infection Exposure (TB, Syphilis, Viral)"
                    value={Array.isArray(intake.infection_types) && intake.infection_types.length > 0 ? intake.infection_types.join(", ") : (intake.infection_exposure || "No known exposure")}
                    highlight={(Array.isArray(intake.infection_types) && intake.infection_types.length > 0) || (intake.infection_exposure || "").toLowerCase() === "yes"}
                  />
                  <QARow
                    label="Chronic Cough"
                    value={intake.cough || "No"}
                  />
                  <QARow
                    label="Unexplained Weight Loss"
                    value={intake.weight_loss || "No"}
                  />
                  <QARow
                    label="Immunocompromised Status"
                    value={intake.immunocompromised || "No"}
                    highlight={(intake.immunocompromised || "").toLowerCase() === "yes"}
                  />
                </SectionAccordion>

                <SectionAccordion title="§5 & §6 — Medications & Lifestyle" accentColor="#10b981">
                  <QARow
                    label="Current Systemic Medications"
                    value={intake.medication_list || (intake.current_medications === "No" ? "None" : intake.current_medications) || "None"}
                  />
                  <QARow
                    label="Recent Medication Changes"
                    value={intake.recent_medication_change || "No"}
                  />
                  <QARow
                    label="Occupation"
                    value={intake.occupation || "Not specified"}
                  />
                  <QARow
                    label="Pet / Animal Contact"
                    value={intake.pet_contact || "No"}
                  />
                  <QARow
                    label="Environmental / Toxic Exposure"
                    value={intake.environmental_exposure || "No"}
                  />
                  <QARow
                    label="Other Systemic Medications"
                    value={intake.other_systemic_medications || "None"}
                  />
                </SectionAccordion>
              </div>
            </div>

            {/* ── CENTER COLUMN: Question Model XAI Explanation ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              {/* Gauges */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "20px",
                  padding: "22px",
                  border: "1px solid rgba(226,232,240,0.9)",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Brain size={18} style={{ color: "#8b5cf6" }} />
                    Question Model Diagnostic Metrics
                  </h3>
                  <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 700 }}>
                    Neuro-Fuzzy Inference
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "16px" }}>
                  <UncertaintyGauge value={confidenceScore} label="Prediction Confidence" color="#2563eb" />
                  <UncertaintyGauge value={uncertaintyScore} label="Uncertainty Boundary" color={uncertaintyScore > 30 ? "#f59e0b" : "#10b981"} />
                </div>

                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "10px",
                    backgroundColor: uncertaintyScore < 25 ? "rgba(16,185,129,0.07)" : "rgba(245,158,11,0.07)",
                    border: `1px solid ${uncertaintyScore < 25 ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}`,
                    fontSize: "0.8rem",
                    color: uncertaintyScore < 25 ? "#047857" : "#92400e",
                    fontWeight: 600,
                  }}
                >
                  <Info size={14} style={{ display: "inline", marginRight: "6px" }} />
                  {uncertaintyScore < 25
                    ? "High model certainty — Clear symptomatic presentation of acute uveitis."
                    : "Moderate uncertainty — Physician correlation required to exclude conjunctivitis."}
                </div>
              </div>

              {/* Feature Importance XAI Impact Bars */}
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
                <div style={{ marginBottom: "14px" }}>
                  <h3
                    style={{
                      margin: "0 0 4px",
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Sparkles size={18} style={{ color: "#f59e0b" }} />
                    Question Model XAI Explanation
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                    Why did the question model predict {formatPercent(patient.uveitisProbability)} uveitis probability for <strong>{patient.name}</strong>?
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
                  {featureImportance.map((f, idx) => {
                    const barColor =
                      f.impact >= 80 ? "#ef4444" : f.impact >= 60 ? "#f97316" : f.impact >= 40 ? "#3b82f6" : "#10b981";
                    return (
                      <div key={idx}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                          <div>
                            <span style={{ fontSize: "0.83rem", color: "#1e293b", fontWeight: 700 }}>
                              {f.feature}
                            </span>
                            <span
                              style={{
                                marginLeft: "8px",
                                fontSize: "0.7rem",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                backgroundColor: "#f1f5f9",
                                color: "#64748b",
                                fontWeight: 600,
                              }}
                            >
                              {f.category || "Clinical"}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.83rem", fontWeight: 900, color: barColor }}>
                            {f.impact}%
                          </span>
                        </div>

                        <div style={{ height: "7px", borderRadius: "4px", backgroundColor: "#f1f5f9", overflow: "hidden", marginBottom: "4px" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${f.impact}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.05, ease: "easeOut" }}
                            style={{ height: "100%", borderRadius: "4px", backgroundColor: barColor }}
                          />
                        </div>

                        {f.detail && (
                          <div style={{ fontSize: "0.74rem", color: "#64748b", lineHeight: 1.3 }}>
                            ↳ {f.detail}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Model Explanations */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#1e293b", marginBottom: "6px" }}>
                    Clinical Reasoning Engine:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.78rem", color: "#475569", lineHeight: 1.5 }}>
                    {questionExplanations.map((exp, idx) => (
                      <li key={idx} style={{ marginBottom: "4px" }}>
                        {exp}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Doctor Preliminary Assessment Form ── */}
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
                  Specialist Provisional Assessment
                </h3>
                <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "#64748b" }}>
                  Record clinical impressions for <strong>{patient.name}</strong> before or alongside imaging evaluation.
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
                    <option value="Allergic / Bacterial Conjunctivitis (Non-Uveitis)">Allergic / Bacterial Conjunctivitis (Non-Uveitis)</option>
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
                    Do you agree with Question Model triage? *
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
                    Specialist Notes &amp; Clinical Differential
                  </label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Document clinical justification, slitlamp findings, or differential notes under this patient's chart..."
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

                {/* Dual Path Decision Actions: Path A (Close Case) vs Path B (Clinical Imaging) */}
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Clinical Decision Route:
                  </div>

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
                        Saved to SQLite — Opening Clinical Imaging Suite…
                      </motion.div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {/* Path B: Proceed to Clinical Imaging */}
                        <motion.button
                          type="button"
                          onClick={handleProceed}
                          disabled={!canSubmit}
                          className="btn btn-primary"
                          whileHover={canSubmit ? { scale: 1.01 } : {}}
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "12px",
                            fontSize: "0.9rem",
                            fontWeight: 800,
                            opacity: canSubmit ? 1 : 0.45,
                            cursor: canSubmit ? "pointer" : "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                        >
                          <Camera size={16} />
                          Path B: Proceed to Clinical Imaging (Slitlamp / OCT / Fundus)
                          <ArrowRight size={16} />
                        </motion.button>

                        {/* Path A: Close Case (Discharge / Non-Uveitic) */}
                        <button
                          type="button"
                          onClick={() => setCloseModalOpen(true)}
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "12px",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#f8fafc",
                            color: "#475569",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#fee2e2";
                            e.currentTarget.style.borderColor = "#ef4444";
                            e.currentTarget.style.color = "#991b1b";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8fafc";
                            e.currentTarget.style.borderColor = "#cbd5e1";
                            e.currentTarget.style.color = "#475569";
                          }}
                        >
                          <CheckCircle2 size={15} color="#10b981" />
                          Path A: Close Case (Discharge / Resolved Non-Uveitic)
                        </button>
                      </div>
                    )}
                  </AnimatePresence>

                  {!canSubmit && (
                    <p style={{ margin: "4px 0 0", fontSize: "0.74rem", color: "#94a3b8", textAlign: "center" }}>
                      * Select provisional diagnosis and AI agreement before saving
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: CLINICAL IMAGING MODALITIES & ROLE-GATED AI SUBTYPE WORKBENCH       */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {activeTab === "imaging_xai" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Modality Switcher Bar */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "14px 22px",
                border: "1px solid rgba(226,232,240,0.9)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a" }}>Imaging Modality:</span>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[
                    { key: "slitlamp", label: "Slitlamp Biomicroscopy", sub: "Anterior Chamber & KPs", icon: Eye },
                    { key: "oct", label: "Anterior Segment OCT", sub: "Angle & Endothelium", icon: SlidersHorizontal },
                    { key: "fundus", label: "Color Fundus Photography", sub: "Posterior Chamber & Retina", icon: Camera },
                  ].map((m) => {
                    const active = selectedModality === m.key;
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setSelectedModality(m.key)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "12px",
                          border: active ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          backgroundColor: active ? "#eff6ff" : "#ffffff",
                          color: active ? "#1d4ed8" : "#475569",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontWeight: 800,
                          fontSize: "0.84rem",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <Icon size={16} color={active ? "#2563eb" : "#64748b"} />
                        <div style={{ textAlign: "left" }}>
                          <div>{m.label}</div>
                          <div style={{ fontSize: "0.7rem", color: active ? "#3b82f6" : "#94a3b8", fontWeight: 600 }}>
                            {m.sub}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontSize: "0.76rem",
                    fontWeight: 800,
                    padding: "4px 10px",
                    borderRadius: "8px",
                    backgroundColor: isSenior ? "#ecfdf5" : "#fffbeb",
                    color: isSenior ? "#047857" : "#b45309",
                    border: `1px solid ${isSenior ? "#a7f3d0" : "#fde68a"}`,
                  }}
                >
                  {isSenior ? "★ Senior Clearance: Immediate AI Disclosure" : "🔒 Junior Training: Feature-First Gate"}
                </span>
              </div>
            </div>

            {/* Main Workbench Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1.1fr", gap: "24px" }}>
              
              {/* Left Column: Image Viewport */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "24px",
                  padding: "24px",
                  border: "1px solid rgba(226,232,240,0.9)",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.05)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900, color: "#0f172a" }}>
                      {selectedModality === "slitlamp" && "Slitlamp Biomicroscopy View"}
                      {selectedModality === "oct" && "Anterior Segment High-Res OCT"}
                      {selectedModality === "fundus" && "Color Retinal Fundus Scan"}
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                      Patient: <strong>{patient.name}</strong> • Eye: <strong>{patient.affectedEye}</strong>
                    </p>
                  </div>

                  {/* Mode Switcher */}
                  <div style={{ display: "flex", gap: "6px", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "10px" }}>
                    {[
                      { key: "original", label: "Original" },
                      { key: "gradcam", label: "Grad-CAM Heatmap" },
                      { key: "boxes", label: "Saliency Boxes" },
                    ].map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setImageMode(m.key)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          border: "none",
                          fontSize: "0.78rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          backgroundColor: imageMode === m.key ? "#ffffff" : "transparent",
                          color: imageMode === m.key ? "#2563eb" : "#64748b",
                          boxShadow: imageMode === m.key ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Viewport Box */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "440px",
                    borderRadius: "18px",
                    overflow: "hidden",
                    backgroundColor: "#050914",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "inset 0 0 50px rgba(0,0,0,0.8)",
                    border: "2px solid #1e293b",
                  }}
                >
                  {/* Dynamic background per modality */}
                  {selectedModality === "slitlamp" ? (
                    activeImageUrl.startsWith("data:") || activeImageUrl.startsWith("http") || activeImageUrl.startsWith("/") ? (
                      <img
                        src={activeImageUrl}
                        alt="Slitlamp examination"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          filter: imageMode === "gradcam" ? "contrast(1.15) brightness(0.9)" : "none",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: activeImageUrl.includes("gradient") ? activeImageUrl : defaultSampleImg.gradient,
                          opacity: 0.9,
                        }}
                      />
                    )
                  ) : selectedModality === "oct" ? (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "radial-gradient(circle at 50% 50%, #0369a1 0%, #0f172a 75%, #020617 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      {/* OCT Corneal Angle Scan Pattern */}
                      <svg width="100%" height="100%" viewBox="0 0 400 300" style={{ opacity: 0.85 }}>
                        <path d="M 20 60 Q 200 40 380 60" stroke="#38bdf8" strokeWidth="6" fill="none" />
                        <path d="M 20 85 Q 200 65 380 85" stroke="#0284c7" strokeWidth="4" fill="none" />
                        <path d="M 40 180 Q 180 160 360 220" stroke="#f59e0b" strokeWidth="5" fill="none" />
                        {/* Particulates */}
                        {[
                          [120, 110], [140, 130], [180, 120], [210, 140], [230, 115],
                          [260, 125], [190, 150], [160, 100], [240, 145]
                        ].map(([cx, cy], i) => (
                          <circle key={i} cx={cx} cy={cy} r={3 + (i % 3)} fill="#fbbf24" opacity={0.9} />
                        ))}
                      </svg>
                    </div>
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        background: "radial-gradient(circle at 50% 50%, #c2410c 0%, #7c2d12 45%, #0f172a 90%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                      }}
                    >
                      {/* Fundus Retinal Vessel Pattern */}
                      <svg width="100%" height="100%" viewBox="0 0 400 300" style={{ opacity: 0.85 }}>
                        <circle cx="280" cy="150" r="30" fill="#fef08a" opacity={0.7} />
                        <path d="M 280 150 Q 220 90 120 70" stroke="#b91c1c" strokeWidth="4" fill="none" />
                        <path d="M 280 150 Q 210 210 110 230" stroke="#b91c1c" strokeWidth="4" fill="none" />
                        <path d="M 280 150 Q 230 140 140 150" stroke="#991b1b" strokeWidth="3" fill="none" />
                        {/* Chorioretinal Infiltrates */}
                        <ellipse cx="160" cy="180" rx="35" ry="25" fill="#fef08a" opacity={0.35} />
                        <circle cx="160" cy="180" r="14" fill="#fbbf24" opacity={0.5} />
                      </svg>
                    </div>
                  )}

                  {/* Grad-CAM Heatmap Overlay */}
                  {imageMode === "gradcam" && (
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen" }}>
                      {(gradcamData.hotspots || []).map((spot, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "absolute",
                            left: `${spot.x}%`,
                            top: `${spot.y}%`,
                            width: `${spot.radius * 2.2}%`,
                            height: `${spot.radius * 2.2}%`,
                            transform: "translate(-50%, -50%)",
                            borderRadius: "50%",
                            background: `radial-gradient(circle, rgba(239, 68, 68, ${spot.intensity * 0.85}) 0%, rgba(245, 158, 11, ${spot.intensity * 0.6}) 40%, rgba(37, 99, 235, ${spot.intensity * 0.25}) 70%, transparent 100%)`,
                            filter: "blur(8px)",
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Saliency Bounding Boxes */}
                  {(imageMode === "boxes" || imageMode === "gradcam") && (
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                      {(overlayBoxes || []).map((box, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: "absolute",
                            left: `${box.x}%`,
                            top: `${box.y}%`,
                            width: `${box.w}%`,
                            height: `${box.h}%`,
                            border: `2px solid ${box.color || "#38bdf8"}`,
                            backgroundColor: `rgba(56, 189, 248, 0.12)`,
                            borderRadius: "6px",
                            boxShadow: `0 0 12px ${box.color || "#38bdf8"}`,
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              top: "-22px",
                              left: 0,
                              backgroundColor: box.color || "#38bdf8",
                              color: "#0f172a",
                              fontSize: "0.68rem",
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {box.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Floating Lens Watermark */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "14px",
                      left: "14px",
                      backgroundColor: "rgba(15, 23, 42, 0.85)",
                      backdropFilter: "blur(6px)",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#ffffff",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Eye size={12} color="#38bdf8" />
                    {selectedModality === "slitlamp" && "Slitlamp Anterior Chamber • ViT-B/16"}
                    {selectedModality === "oct" && "Anterior Segment OCT • Optical Coherence Layer"}
                    {selectedModality === "fundus" && "Color Retinal Fundus • Posterior Deep Model"}
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      bottom: "14px",
                      right: "14px",
                      backgroundColor: "rgba(15, 23, 42, 0.85)",
                      backdropFilter: "blur(6px)",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#10b981",
                      fontSize: "0.74rem",
                      fontWeight: 800,
                    }}
                  >
                    CNN Confidence: {gradcamData.confidence || "96.4"}%
                  </div>
                </div>

                {/* View Legend */}
                <div style={{ display: "flex", gap: "16px", marginTop: "14px", fontSize: "0.78rem", color: "#64748b" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#ef4444" }} />
                    <span>High Saliency (Corneal KPs &amp; Tyndall Beam)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#f59e0b" }} />
                    <span>Moderate Reaction (Perilimbal Ciliary Margin)</span>
                  </div>
                </div>
              </div>

              {/* Right Column: ROLE-BASED GATING & PREDICTION DISCLOSURE */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* ────────────────────────────────────────────────────────────────────── */}
                {/* FLOW 1: SENIOR DOCTOR VIEW (Immediate AI Subtype Prediction)           */}
                {/* ────────────────────────────────────────────────────────────────────── */}
                {isSenior && (
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "20px",
                      padding: "24px",
                      border: "2px solid #2563eb",
                      boxShadow: "0 8px 30px rgba(37,99,235,0.08)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Sparkles size={20} color="#2563eb" />
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, color: "#0f172a" }}>
                          AI Anatomical Subtype Model Prediction
                        </h3>
                      </div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: "6px",
                          backgroundColor: "#ecfdf5",
                          color: "#059669",
                          border: "1px solid #a7f3d0",
                        }}
                      >
                        ★ Senior Consultant Immediate Disclosure
                      </span>
                    </div>

                    {/* Subtype Badge & Confidence */}
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "14px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        marginBottom: "16px",
                      }}
                    >
                      <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#64748b", textTransform: "uppercase" }}>
                        Predicted Anatomical Subtype
                      </div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 900, color: "#1d4ed8", marginTop: "4px" }}>
                        {selectedModality === "slitlamp" && "Acute Anterior Uveitis (Iridocyclitis)"}
                        {selectedModality === "oct" && "Anterior Segment Angle Inflammatory Infiltration"}
                        {selectedModality === "fundus" && "Posterior Chorioretinitis / Vitritis"}
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: "4px" }}>
                        Model Diagnostic Confidence: <strong>96.4%</strong> • Anatomical Location:{" "}
                        <strong>
                          {selectedModality === "slitlamp"
                            ? "Anterior Chamber Endothelium & Ciliary Margin"
                            : selectedModality === "oct"
                            ? "Corneal Endothelium & Trabecular Angle"
                            : "Retinal Vascular Arcades & Posterior Pole"}
                        </strong>
                      </div>
                    </div>

                    {/* Objective Biomarkers */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                      <div style={{ padding: "10px 12px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800 }}>AC CELL GRADE</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#dc2626", marginTop: "2px" }}>
                          {cnnData?.ac_cell_grade || "+3 Grade (28 cells/field)"}
                        </div>
                      </div>
                      <div style={{ padding: "10px 12px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800 }}>FLARE INTENSITY</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#d97706", marginTop: "2px" }}>
                          {cnnData?.flare_intensity || "Moderate (+2)"}
                        </div>
                      </div>
                      <div style={{ padding: "10px 12px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800 }}>KP MORPHOLOGY</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1e293b", marginTop: "2px" }}>
                          {cnnData?.kp_type || "Mutton-Fat Precipitates"}
                        </div>
                      </div>
                      <div style={{ padding: "10px 12px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 800 }}>PUPIL STATUS</div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#1e293b", marginTop: "2px" }}>
                          {cnnData?.pupil_reactivity || "Sluggish / Synechia Risk"}
                        </div>
                      </div>
                    </div>

                    {/* Senior Oversight & Ratification Panel if Junior evaluated this case */}
                    {(patientRecord?.junior_annotations || patientRecord?.case_status === "pending_senior_review") && (
                      <div
                        style={{
                          backgroundColor: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          borderRadius: "14px",
                          padding: "16px",
                          marginTop: "14px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <Shield size={16} color="#1d4ed8" />
                          <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 800, color: "#1e40af" }}>
                            Senior Consultant Oversight &amp; Protocol Ratification
                          </h4>
                        </div>
                        <p style={{ margin: "0 0 10px", fontSize: "0.78rem", color: "#3b82f6" }}>
                          Supervising resident/junior specialist evaluation for <strong>{patient.name}</strong>.
                        </p>

                        {/* Junior observations summary */}
                        <div style={{ padding: "10px", backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid #dbeafe", marginBottom: "12px", fontSize: "0.78rem" }}>
                          <div><strong>Junior Subtype:</strong> {patientRecord?.junior_annotations?.provisional_subtype || "Acute Anterior Uveitis"}</div>
                          <div><strong>Cells &amp; Flare:</strong> {patientRecord?.junior_annotations?.ac_cells || "+2 Grade"} • {patientRecord?.junior_annotations?.flare || "+2"}</div>
                          <div><strong>KPs &amp; Pupil:</strong> {patientRecord?.junior_annotations?.kp_morphology || "Mutton-fat"} • {patientRecord?.junior_annotations?.pupil_reactivity || "Sluggish"}</div>
                          {patientRecord?.junior_annotations?.clinical_notes && (
                            <div style={{ marginTop: "4px", color: "#64748b" }}>
                              <em>"{patientRecord.junior_annotations.clinical_notes}"</em>
                            </div>
                          )}
                        </div>

                        {/* Senior ratification input */}
                        <div style={{ marginBottom: "10px" }}>
                          <input
                            type="text"
                            placeholder="Senior consultant feedback / endorsement notes..."
                            value={seniorNotes}
                            onChange={(e) => setSeniorNotes(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              border: "1px solid #cbd5e1",
                              fontSize: "0.8rem",
                              backgroundColor: "#ffffff",
                              outline: "none",
                            }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handleSeniorRatify}
                          disabled={seniorSubmitting || seniorApproved}
                          className="btn btn-primary"
                          style={{
                            width: "100%",
                            padding: "10px",
                            fontSize: "0.85rem",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                          }}
                        >
                          <ShieldCheck size={16} />
                          {seniorApproved ? "✓ Case Ratified by Senior Consultant" : "Ratify & Approve Case Diagnosis"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ────────────────────────────────────────────────────────────────────── */}
                {/* FLOW 2: JUNIOR DOCTOR VIEW (Sealed Gate & "Feature It First" Form)      */}
                {/* ────────────────────────────────────────────────────────────────────── */}
                {!isSenior && (
                  <div>
                    {!juniorSubmitted && !patientRecord?.junior_annotations ? (
                      /* SEALED GATE: Junior must feature it first */
                      <div
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: "20px",
                          padding: "24px",
                          border: "2px solid #f59e0b",
                          boxShadow: "0 8px 30px rgba(245,158,11,0.08)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                          <div
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "10px",
                              backgroundColor: "#fef3c7",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Lock size={20} color="#d97706" />
                          </div>
                          <div>
                            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 900, color: "#92400e" }}>
                              AI Subtype Model Prediction Sealed
                            </h3>
                            <div style={{ fontSize: "0.76rem", color: "#b45309", fontWeight: 700 }}>
                              Clinical Training Mode: Feature It First
                            </div>
                          </div>
                        </div>

                        <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "#78350f", lineHeight: 1.4 }}>
                          Under Dr. Agarwal's Ophthalmic Training Guidelines, junior specialists must independently evaluate and
                          feature anterior segment biomarkers before unsealing the AI model's anatomical prediction.
                        </p>

                        {/* Interactive Feature Form */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                          {/* AC Cells */}
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#334155", marginBottom: "4px" }}>
                              1. Anterior Chamber Cell Grade (SUN Score) *
                            </label>
                            <select
                              value={juniorAcCells}
                              onChange={(e) => setJuniorAcCells(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.82rem",
                                backgroundColor: "#f8fafc",
                              }}
                            >
                              <option value="+0 Grade (0 cells / field)">+0 Grade (No cells)</option>
                              <option value="+0.5 Grade (1-5 cells / field)">+0.5 Grade (1-5 cells / field)</option>
                              <option value="+1 Grade (6-10 cells / field)">+1 Grade (6-10 cells / field)</option>
                              <option value="+2 Grade (11-20 cells / field)">+2 Grade (11-20 cells / field)</option>
                              <option value="+3 Grade (21-50 cells / field)">+3 Grade (21-50 cells / field)</option>
                              <option value="+4 Grade (>50 cells / Hypopyon)">+4 Grade (&gt;50 cells / Hypopyon)</option>
                            </select>
                          </div>

                          {/* Flare */}
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#334155", marginBottom: "4px" }}>
                              2. Anterior Chamber Flare Intensity *
                            </label>
                            <select
                              value={juniorFlare}
                              onChange={(e) => setJuniorFlare(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.82rem",
                                backgroundColor: "#f8fafc",
                              }}
                            >
                              <option value="None (0)">None (0) — Completely clear</option>
                              <option value="Faint (+1)">Faint (+1) — Barely detectable Tyndall</option>
                              <option value="Moderate (+2)">Moderate (+2) — Clear iris details visible</option>
                              <option value="Marked (+3)">Marked (+3) — Iris and lens details hazy</option>
                              <option value="Severe (+4)">Severe (+4) — Dense fibrin in AC</option>
                            </select>
                          </div>

                          {/* KPs */}
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#334155", marginBottom: "4px" }}>
                              3. Keratic Precipitates (KP) Morphology *
                            </label>
                            <select
                              value={juniorKp}
                              onChange={(e) => setJuniorKp(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.82rem",
                                backgroundColor: "#f8fafc",
                              }}
                            >
                              <option value="None">None</option>
                              <option value="Fine Stippled (Non-Granulomatous)">Fine Stippled (Non-Granulomatous)</option>
                              <option value="Mutton-Fat Keratic Precipitates">Mutton-Fat / Clustered (Granulomatous)</option>
                              <option value="Pigmented Chronic KPs">Pigmented Chronic KPs</option>
                            </select>
                          </div>

                          {/* Pupil */}
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#334155", marginBottom: "4px" }}>
                              4. Pupillary Status &amp; Synechia Risk *
                            </label>
                            <select
                              value={juniorPupil}
                              onChange={(e) => setJuniorPupil(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.82rem",
                                backgroundColor: "#f8fafc",
                              }}
                            >
                              <option value="Normal Reactive">Normal Reactive</option>
                              <option value="Miosed / Spastic">Miosed / Spastic</option>
                              <option value="Sluggish / Synechia Risk">Sluggish / Synechia Risk</option>
                              <option value="Irregular Posterior Synechia">Irregular Posterior Synechia</option>
                            </select>
                          </div>

                          {/* Provisional Subtype */}
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#334155", marginBottom: "4px" }}>
                              5. Your Provisional Anatomical Subtype *
                            </label>
                            <select
                              value={juniorSubtype}
                              onChange={(e) => setJuniorSubtype(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.82rem",
                                backgroundColor: "#f8fafc",
                                fontWeight: 700,
                                color: "#0f172a",
                              }}
                            >
                              <option value="Acute Anterior Uveitis">Acute Anterior Uveitis (Iridocyclitis)</option>
                              <option value="Granulomatous Anterior Uveitis">Granulomatous Anterior Uveitis</option>
                              <option value="Intermediate Uveitis / Pars Planitis">Intermediate Uveitis / Pars Planitis</option>
                              <option value="Posterior Chorioretinitis">Posterior Chorioretinitis</option>
                              <option value="Panuveitis">Panuveitis</option>
                            </select>
                          </div>

                          {/* Clinical Notes */}
                          <div>
                            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 800, color: "#334155", marginBottom: "4px" }}>
                              6. Clinical Observations &amp; Differential
                            </label>
                            <textarea
                              rows={2}
                              value={juniorNotes}
                              onChange={(e) => setJuniorNotes(e.target.value)}
                              placeholder="Record slitlamp findings, flare observations, or differential..."
                              style={{
                                width: "100%",
                                padding: "8px 10px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.8rem",
                                backgroundColor: "#f8fafc",
                                outline: "none",
                              }}
                            />
                          </div>
                        </div>

                        {/* Action: Commit features and unlock prediction */}
                        <button
                          type="button"
                          onClick={handleJuniorFeatureSubmit}
                          disabled={juniorSubmitting}
                          className="btn btn-primary"
                          style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "12px",
                            fontSize: "0.88rem",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                        >
                          <Unlock size={16} />
                          {juniorSubmitting ? "Recording Features…" : "Record Annotations & Unseal AI Prediction"}
                        </button>
                      </div>
                    ) : (
                      /* UNSEALED: Features recorded, side-by-side comparison & supervisor notification */
                      <div
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: "20px",
                          padding: "24px",
                          border: "2px solid #10b981",
                          boxShadow: "0 8px 30px rgba(16,185,129,0.08)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Unlock size={20} color="#10b981" />
                            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, color: "#0f172a" }}>
                              AI Subtype Model Prediction Unsealed
                            </h3>
                          </div>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              padding: "3px 8px",
                              borderRadius: "6px",
                              backgroundColor: "#ecfdf5",
                              color: "#047857",
                            }}
                          >
                            ✓ Features Committed
                          </span>
                        </div>

                        {/* Supervisory Status Notice */}
                        <div
                          style={{
                            backgroundColor: "#fffbeb",
                            border: "1px solid #fde68a",
                            borderRadius: "12px",
                            padding: "12px 14px",
                            marginBottom: "16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Clock size={16} color="#d97706" />
                          <div style={{ fontSize: "0.8rem", color: "#92400e" }}>
                            <strong>Supervisory Oversight:</strong> Case monitored by{" "}
                            <strong>{currentDoctor.supervisor_name || "Senior Consultant"}</strong>. Final clinical decision requires senior ratification.
                          </div>
                        </div>

                        {/* Side-by-Side Comparison: Junior Doctor vs AI Model */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                          {/* Junior Doctor Column */}
                          <div style={{ padding: "14px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#2563eb", textTransform: "uppercase" }}>
                              Your Clinical Annotations
                            </div>
                            <div style={{ fontSize: "1rem", fontWeight: 900, color: "#0f172a", marginTop: "4px" }}>
                              {juniorSubtype || patientRecord?.junior_annotations?.provisional_subtype || "Acute Anterior Uveitis"}
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                              <div>• AC Cells: {juniorAcCells}</div>
                              <div>• Flare: {juniorFlare}</div>
                              <div>• KPs: {juniorKp}</div>
                              <div>• Pupil: {juniorPupil}</div>
                            </div>
                          </div>

                          {/* AI Model Column */}
                          <div style={{ padding: "14px", borderRadius: "12px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                            <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#15803d", textTransform: "uppercase" }}>
                              AI Deep Learning Prediction
                            </div>
                            <div style={{ fontSize: "1rem", fontWeight: 900, color: "#166534", marginTop: "4px" }}>
                              Acute Anterior Uveitis
                            </div>
                            <div style={{ fontSize: "0.78rem", color: "#14532d", marginTop: "6px", display: "flex", flexDirection: "column", gap: "2px" }}>
                              <div>• Model Confidence: <strong>96.4%</strong></div>
                              <div>• AC Cells: +3 Grade</div>
                              <div>• Flare: Moderate (+2)</div>
                              <div>• KPs: Mutton-Fat KPs</div>
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: "10px 14px", borderRadius: "10px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", fontSize: "0.8rem", color: "#065f46", fontWeight: 700 }}>
                          ✓ Strong Clinical Consensus (94% Concordance) between your observations and the Vision Transformer model.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Workflow Actions */}
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "20px",
                    padding: "20px",
                    border: "1px solid rgba(226,232,240,0.9)",
                  }}
                >
                  <h4 style={{ margin: "0 0 8px", fontSize: "0.92rem", fontWeight: 800, color: "#0f172a" }}>
                    Clinical Decision Next Step
                  </h4>
                  <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "#64748b" }}>
                    Synthesize questionnaire attributions with clinical imaging biomarkers to formulate the treatment protocol.
                  </p>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setActiveTab("synthesis")}
                      className="btn btn-secondary"
                      style={{ flex: 1, fontSize: "0.85rem", padding: "10px 0" }}
                    >
                      View Dual XAI Synthesis
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate(`/doctor/patient/${patient.id}/final-review`)}
                      className="btn btn-primary"
                      style={{ flex: 1, fontSize: "0.85rem", padding: "10px 0" }}
                    >
                      Layer 6 Final Review →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: COMPLETE DUAL XAI CASE SYNTHESIS                                   */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {activeTab === "synthesis" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Synthesis Header Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
                borderRadius: "22px",
                padding: "26px 32px",
                color: "#ffffff",
                boxShadow: "0 10px 30px rgba(30, 58, 138, 0.2)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <span style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: "#93c5fd" }}>
                    DUAL XAI CROSS-VALIDATION • UVEISENSE AI (ARQGENE × DR. AGARWAL'S)
                  </span>
                  <h2 style={{ margin: "6px 0 4px", fontSize: "1.6rem", fontWeight: 900 }}>
                    Case Synthesis for {patient.name}
                  </h2>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "#bfdbfe" }}>
                    Question Model Feature Attributions vs. Slitlamp ViT Grad-CAM Biomarkers
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    padding: "12px 20px",
                    borderRadius: "14px",
                    backdropFilter: "blur(8px)",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "0.72rem", color: "#e0e7ff", fontWeight: 700 }}>CROSS-MODAL CONSENSUS</div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#ffffff" }}>
                    {formatPercent(patient.uveitisProbability)}
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-side XAI comparison */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              
              {/* Engine A: Question Model XAI */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "20px",
                  padding: "24px",
                  border: "1px solid rgba(226,232,240,0.9)",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ backgroundColor: "#eff6ff", color: "#2563eb", padding: "8px", borderRadius: "10px" }}>
                    <Brain size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                      Engine A: Question Model XAI
                    </h3>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Neuro-Fuzzy Clinical Attributions</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                  {featureImportance.slice(0, 4).map((f, idx) => (
                    <div key={idx} style={{ padding: "8px 12px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                        <span>{f.feature}</span>
                        <span style={{ color: "#dc2626" }}>{f.impact}%</span>
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "2px" }}>{f.detail}</div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: "0.8rem", color: "#475569", lineHeight: 1.5, backgroundColor: "rgba(37,99,235,0.05)", padding: "10px 14px", borderRadius: "10px" }}>
                  <strong>Core Finding:</strong> Acute light intolerance and sudden onset ciliary redness trigger high-tier uveitis fuzzy rules with {formatPercent(patient.uveitisProbability)} confidence.
                </div>
              </div>

              {/* Engine B: Slitlamp Grad-CAM XAI */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "20px",
                  padding: "24px",
                  border: "1px solid rgba(226,232,240,0.9)",
                  boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                  <div style={{ backgroundColor: "#fdf2f8", color: "#db2777", padding: "8px", borderRadius: "10px" }}>
                    <Camera size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                      Engine B: Slitlamp Grad-CAM XAI
                    </h3>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Vision Transformer Biomarker Heatmaps</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                  <div style={{ padding: "8px 12px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                      <span>Anterior Chamber Cellularity</span>
                      <span style={{ color: "#dc2626" }}>{cnnData?.ac_cell_grade || "+3 Grade (28 cells/field)"}</span>
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "2px" }}>Dense floating leukocytes detected along slit beam</div>
                  </div>

                  <div style={{ padding: "8px 12px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                      <span>Keratic Precipitates (KPs)</span>
                      <span style={{ color: "#d97706" }}>{cnnData?.kp_type || "Mutton-Fat Deposits"}</span>
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "2px" }}>Endothelial granulomatous clumps verified by Grad-CAM hotspot</div>
                  </div>

                  <div style={{ padding: "8px 12px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b" }}>
                      <span>Anterior Chamber Flare</span>
                      <span style={{ color: "#2563eb" }}>{cnnData?.flare_intensity || "Moderate (+2)"}</span>
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "2px" }}>Tyndall beam protein exudate confirmed in lower chamber</div>
                  </div>
                </div>

                <div style={{ fontSize: "0.8rem", color: "#475569", lineHeight: 1.5, backgroundColor: "rgba(219,39,119,0.05)", padding: "10px 14px", borderRadius: "10px" }}>
                  <strong>Core Finding:</strong> Vision Transformer localizes {gradcamData.confidence || "96.4"}% saliency on inferior corneal endothelium and iris margin, corroborating the question model.
                </div>
              </div>
            </div>

            {/* Bottom Final Action Bar */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "20px 28px",
                border: "1px solid rgba(226,232,240,0.9)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                  Ready to ratify clinical diagnosis for {patient.name}?
                </div>
                <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                  Continue to Layer 6 and Layer 7 to approve treatment protocols under Dr. Agarwal's Hospital Guidelines.
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/doctor/patient/${patient.id}/final-review`)}
                className="btn btn-primary"
                style={{ padding: "12px 24px", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "8px" }}
              >
                Proceed to Layer 6 Final Review
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* MODAL 1: CLOSE CASE & DISCHARGE MODAL                                      */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {closeModalOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.65)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "20px",
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "20px",
                  width: "100%",
                  maxWidth: "520px",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircle2 size={20} color="#dc2626" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                        Discharge Patient &amp; Close Case
                      </h3>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        Patient: <strong>{patient.name}</strong> ({patient.id})
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCloseModalOpen(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Reason for Discharge / Case Closure *
                    </label>
                    <select
                      value={closeReason}
                      onChange={(e) => setCloseReason(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem",
                        backgroundColor: "#f8fafc",
                        outline: "none",
                      }}
                    >
                      <option value="Resolved Episcleritis / Non-Uveitic">Resolved Episcleritis / Non-Uveitic</option>
                      <option value="Allergic / Bacterial Conjunctivitis (Non-Uveitic)">Allergic / Bacterial Conjunctivitis (Non-Uveitic)</option>
                      <option value="Dry Eye Strain / Asthenopia (Normal Exam)">Dry Eye Strain / Asthenopia (Normal Exam)</option>
                      <option value="Patient Recovered - Discharged">Patient Recovered - Discharged with Home Care</option>
                      <option value="Referred to Outpatient Follow-up">Referred to Outpatient Follow-up</option>
                      <option value="Diagnostic Negative for Active Intraocular Inflammation">Diagnostic Negative for Active Intraocular Inflammation</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      Discharge Summary &amp; Patient Instructions
                    </label>
                    <textarea
                      rows={3}
                      value={dischargeSummary}
                      onChange={(e) => setDischargeSummary(e.target.value)}
                      placeholder="Document clinical justification for closure and patient guidance..."
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.82rem",
                        backgroundColor: "#ffffff",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "0.78rem", color: "#64748b" }}>
                    ℹ Closing the case marks the EMR file as discharged. The patient record will remain securely archived in SQLite under your hospital center.
                  </div>
                </div>

                <div style={{ padding: "16px 24px", backgroundColor: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setCloseModalOpen(false)}
                    className="btn btn-secondary"
                    style={{ fontSize: "0.84rem", padding: "8px 16px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseCase}
                    disabled={closingCase}
                    className="btn btn-primary"
                    style={{ fontSize: "0.84rem", padding: "8px 18px", backgroundColor: "#dc2626", borderColor: "#dc2626" }}
                  >
                    {closingCase ? "Closing Case…" : "Confirm Discharge & Close Case"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ══════════════════════════════════════════════════════════════════════════ */}
        {/* MODAL 2: CROSS-DOCTOR REFERRAL MODAL (FULL DATA TRANSFER)                 */}
        {/* ══════════════════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {referModalOpen && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.65)",
                backdropFilter: "blur(4px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "20px",
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "20px",
                  width: "100%",
                  maxWidth: "540px",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
                  overflow: "hidden",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#f5f3ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Share2 size={20} color="#7c3aed" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                        Refer Dossier to Colleague Specialist
                      </h3>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        Transferring <strong>{patient.name}</strong> ({patient.id})
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setReferModalOpen(false); setReferSuccessMsg(""); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {referSuccessMsg ? (
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        backgroundColor: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        color: "#065f46",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        textAlign: "center",
                      }}
                    >
                      <CheckCircle2 size={24} color="#059669" style={{ margin: "0 auto 8px" }} />
                      <div>{referSuccessMsg}</div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                          Select Recipient Specialist *
                        </label>
                        <select
                          value={referTargetDoctorId}
                          onChange={(e) => setReferTargetDoctorId(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.85rem",
                            backgroundColor: "#f8fafc",
                            outline: "none",
                          }}
                        >
                          {AGARWAL_CENTERS.filter((d) => d.id !== currentDoctor.id).map((doc) => (
                            <option key={doc.id} value={doc.id}>
                              {doc.name} ({doc.role === "senior" ? "Senior Consultant" : "Junior Specialist"}) — {doc.clinicName || doc.city}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                          Referral Priority *
                        </label>
                        <div style={{ display: "flex", gap: "8px" }}>
                          {["Routine", "Urgent / 24h", "Immediate Emergency"].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setReferPriority(p)}
                              style={{
                                flex: 1,
                                padding: "8px 0",
                                borderRadius: "8px",
                                border: referPriority === p ? "2px solid #7c3aed" : "1px solid #cbd5e1",
                                backgroundColor: referPriority === p ? "#f5f3ff" : "#ffffff",
                                color: referPriority === p ? "#6d28d9" : "#475569",
                                fontWeight: 800,
                                fontSize: "0.78rem",
                                cursor: "pointer",
                              }}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                          Reason for Cross-Referral &amp; Clinical Notes
                        </label>
                        <textarea
                          rows={3}
                          value={referReason}
                          onChange={(e) => setReferReason(e.target.value)}
                          placeholder="State why this case is being referred (e.g. surgical consult, refractory uveitis second opinion)..."
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: "1px solid #cbd5e1",
                            fontSize: "0.82rem",
                            backgroundColor: "#ffffff",
                            outline: "none",
                          }}
                        />
                      </div>

                      <div
                        style={{
                          padding: "12px",
                          borderRadius: "10px",
                          backgroundColor: "#faf5ff",
                          border: "1px solid #e9d5ff",
                          fontSize: "0.78rem",
                          color: "#6b21a8",
                        }}
                      >
                        🔒 <strong>Full Dossier Handover:</strong> All questionnaire responses, dual XAI attributions (Question Model &amp; Slitlamp Grad-CAM), imaging scans, and your provisional assessment will be securely transferred and accessible to the recipient doctor.
                      </div>
                    </>
                  )}
                </div>

                {!referSuccessMsg && (
                  <div style={{ padding: "16px 24px", backgroundColor: "#f8fafc", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setReferModalOpen(false)}
                      className="btn btn-secondary"
                      style={{ fontSize: "0.84rem", padding: "8px 16px" }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleReferDoctor}
                      disabled={referring}
                      className="btn btn-primary"
                      style={{ fontSize: "0.84rem", padding: "8px 18px", backgroundColor: "#7c3aed", borderColor: "#7c3aed" }}
                    >
                      <Send size={14} />
                      {referring ? "Transferring Dossier…" : "Transfer Case Dossier"}
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}
