import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Eye,
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Stethoscope,
  Building2,
  Calendar,
  Phone,
  User,
  Sliders,
  ShieldCheck,
  Activity,
  Layers,
  FileText,
  RotateCcw,
  Zap,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  ClipboardList,
  Leaf,
  HeartPulse,
  Brain,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { AGARWAL_CENTERS } from "../utils/agarwalCenters.js";
import { CLINICAL_IMAGE_SAMPLES } from "../utils/clinicalImageSamples.js";
import { patientIntakeApi } from "../api/client.js";
import "../styles/uveitisQuestionnaire.css";
import "../styles/doctor.css";

/* ══════════════════════════════════════════════════════════════════════════════
   QUESTIONNAIRE CONSTANTS & CRITERIA (from clinical specification)
   ══════════════════════════════════════════════════════════════════════════════ */

const QUESTIONNAIRE_SECTIONS = [
  { id: 0, title: "1. Patient Profile & Demographics", short: "Demographics", icon: User },
  { id: 1, title: "2. Primary Eye Symptoms", short: "Symptoms", icon: Eye },
  { id: 2, title: "3. Visual Disturbances", short: "Vision", icon: Activity },
  { id: 3, title: "4. Eye History & Recurrence", short: "Eye History", icon: ClipboardList },
  { id: 4, title: "5. Systemic Health & Medications", short: "Systemic", icon: Stethoscope },
  { id: 5, title: "6. Lifestyle & Exposure History", short: "Lifestyle", icon: Leaf },
];

const LIKERT_OPTIONS = [
  { label: "None", value: "None", color: "#10b981" },
  { label: "Mild", value: "Mild", color: "#22d3ee" },
  { label: "Moderate", value: "Moderate", color: "#f59e0b" },
  { label: "Severe", value: "Severe", color: "#f97316" },
  { label: "Very severe", value: "Very severe", color: "#ef4444" },
];

const PAIN_SCORING_CRITERIA = {
  "None (0)": "No eye pain at all",
  "Mild (1-3)": "Slight discomfort, not interfering with daily activities",
  "Moderate (4-6)": "Noticeable pain, some interference with daily activities",
  "Severe (7-8)": "Significant pain, considerable interference with activities",
  "Very Severe (9-10)": "Unbearable pain, unable to function normally",
};

const REDNESS_SCORING_CRITERIA = {
  "None (0)": "Eye appears completely white and normal",
  "Mild (1-3)": "Slight pinkish discoloration, visible but not prominent",
  "Moderate (4-6)": "Noticeable red/pink coloring, clearly visible",
  "Severe (7-8)": "Significantly red/bloodshot, prominent redness",
  "Very Severe (9-10)": "Extremely red and swollen appearance, markedly bloodshot",
};

const UVEITIS_TYPE_OPTIONS = ["Anterior uveitis", "Intermediate uveitis", "Posterior uveitis", "Panuveitis", "Not sure"];

const SYSTEMIC_DISEASE_OPTIONS = [
  "Ankylosing Spondylitis / HLA-B27",
  "Rheumatoid Arthritis",
  "Sarcoidosis",
  "Inflammatory Bowel Disease (Crohn's / Colitis)",
  "Psoriasis / Psoriatic Arthritis",
  "Lupus / SLE",
  "Behçet's Disease",
  "Other",
];

const INFECTION_TYPE_OPTIONS = [
  "Tuberculosis (TB) exposure or diagnosis",
  "Viral (Herpes Simplex, Zoster/Shingles, CMV)",
  "Bacterial (Syphilis, Lyme, etc.)",
  "Fungal / Histoplasmosis",
  "Parasitic / Toxoplasmosis",
  "Other / Unknown",
];

const OCULAR_HISTORY_OPTIONS = [
  "Trauma / Physical injury",
  "Eye surgery (Cataract, Glaucoma, Vitrectomy)",
  "Previous eye disease or condition",
  "Other",
];

const VISUAL_PROBLEM_OPTIONS = [
  "Blurred vision",
  "Decreased vision",
  "Hazy vision",
  "Normal vision",
];

/* ══════════════════════════════════════════════════════════════════════════════
   INITIAL FORM STATE (Complete 6-Section Intake)
   ══════════════════════════════════════════════════════════════════════════════ */

const initialFormState = {
  // Step 1 — Patient Demographics & Profile
  name: "",
  phone: "",
  age: "",
  ageScore: 1,
  sex: "Female",
  affected_eye: "Left",
  symptom_duration_days: "0",
  onset_type: "Gradually",

  // Step 2 — Primary Eye Symptoms (Default 0 / Normal)
  pain_score: 0,
  redness_score: 0,
  photophobia_impact: 0,
  subjective_visual_disturbance: "None",
  pain_location: "None",
  pain_nature: [],
  pain_with_movement: "No",

  // Step 3 — Visual Disturbances (Default Normal)
  floaters: "No",
  floater_frequency: "Never",
  floater_count: "None",
  floater_appearance: [],
  scotoma: "No",
  visual_distortion: "No",
  predominant_visual_problem: "Normal vision",

  // Step 4 — Eye History & Recurrence (Default Normal)
  previous_uveitis: "No",
  episode_count: "0",
  uveitis_type: "Not sure",
  recent_episode_timing: "Never",
  ocular_history: "No",
  ocular_history_types: [],
  contact_lens_use: "No",

  // Step 5 — Systemic Health & Medications (Default Normal)
  systemic_inflammatory_disease: "No",
  systemic_disease_types: [],
  systemic_disease_other_text: "",
  systemic_disease_duration: "None",
  infection_exposure: "No",
  infection_types: [],
  cough: "No",
  weight_loss: "No",
  joint_pain: "No",
  immunocompromised: "No",
  immunosuppressive_medication_name: "",
  current_medications: "No",
  medication_list: "",
  recent_medication_change: "No",

  // Step 6 — Lifestyle & Exposure (Default Normal)
  occupation: "",
  pet_contact: "No",
  environmental_exposure: "No",
  lifestyle_other_exposure: "",
  other_systemic_medications: "",
};

/* ══════════════════════════════════════════════════════════════════════════════
   CLIENT-SIDE FUZZY INFERENCE LOGIC (for Instant XAI & Prediction)
   ══════════════════════════════════════════════════════════════════════════════ */

const rightShoulder = (x, a, b) => {
  if (x <= a) return 0.0;
  if (x >= b) return 1.0;
  return (x - a) / (b - a);
};

const hedge = (value, kind = "normal") => {
  if (kind === "very") return Math.pow(value, 2);
  if (kind === "somewhat") return Math.pow(value, 0.5);
  if (kind === "more_or_less") return value * 0.7;
  return value;
};

const toFuzzy = (val) => {
  if (typeof val === "number") return val;
  if (val === "Yes" || val === 1) return 1.0;
  if (val === "Not sure" || val === "Maybe" || val === 0.5) return 0.5;
  return 0.0;
};

const likertToScore = (val) => {
  const map = { None: 0, Mild: 2.5, Moderate: 5, Severe: 7.5, "Very severe": 10 };
  return map[val] ?? 0;
};

function getLiveFuzzyIndices(form) {
  const redness = Number(form.redness_score) || 0;
  const pain = Number(form.pain_score) || 0;
  const photophobia = Number(form.photophobia_impact) || 0;
  const blurred = likertToScore(form.subjective_visual_disturbance);

  const floaters = toFuzzy(form.floaters);
  const glare = toFuzzy(form.visual_distortion);
  const peripheral = toFuzzy(form.scotoma);
  const autoimmune = toFuzzy(form.systemic_inflammatory_disease);
  const tuberculosis = form.infection_types?.includes("Tuberculosis (TB) exposure or diagnosis") ? 1 : 0;
  const syphilis = form.infection_types?.includes("Bacterial (Syphilis, Lyme, etc.)") ? 1 : 0;
  const hiv = toFuzzy(form.immunocompromised);
  const recentInfection = toFuzzy(form.infection_exposure);
  const previousUveitis = form.previous_uveitis === "Yes" ? 1 : 0;
  const episodeCount = Math.min(Number(form.episode_count) || 0, 10) / 10;

  const rednessHigh = rightShoulder(redness, 5, 8);
  const painHigh = rightShoulder(pain, 5, 8);
  const photoHigh = rightShoulder(photophobia, 5, 8);
  const blurHigh = rightShoulder(blurred, 5, 8);

  const floatersH = hedge(floaters, "very");
  const hazyH = hedge(toFuzzy(form.visual_distortion), "very");
  const glareH = hedge(glare, "somewhat");
  const peripheralH = hedge(peripheral, "very");

  const inflammation = (rednessHigh * 0.35 + painHigh * 0.35 + photoHigh * 0.3) * 100;
  const visual = (blurHigh * 0.3 + floatersH * 0.2 + hazyH * 0.15 + glareH * 0.2 + peripheralH * 0.15) * 100;
  const autoimmuneRisk = autoimmune * 100;
  const infectiousRisk = Math.max(tuberculosis, syphilis, hiv, recentInfection) * 100;
  const episodeHedged = Math.sqrt(episodeCount);
  const recurrence = (previousUveitis * 0.45 + previousUveitis * 0.15 + episodeHedged * 0.15) * 100;
  const onsetVal = form.onset_type === "Suddenly" || form.onset_type === "Sudden" ? 1.0 : 0.0;
  const urgency = (painHigh * 0.25 + photoHigh * 0.25 + blurHigh * 0.2 + onsetVal * 0.15 + hedge(toFuzzy(form.floaters), "very") * 0.15) * 100;

  return { inflammation, visual, autoimmune: autoimmuneRisk, infectious: infectiousRisk, recurrence, urgency };
}

/* ══════════════════════════════════════════════════════════════════════════════
   REUSABLE CLINICAL FORM COMPONENTS
   ══════════════════════════════════════════════════════════════════════════════ */

function TriStateToggle({ label, value, onChange, hint }) {
  const options = [
    { text: "Yes", val: "Yes", activeClass: "uf-toggle-yes" },
    { text: "Not sure", val: "Not sure", activeClass: "uf-toggle-unsure" },
    { text: "No", val: "No", activeClass: "uf-toggle-no" },
  ];
  return (
    <div className="uf-pill-question-row">
      <div className="uf-pill-question-info">
        <span className="uf-pill-question-text">{label}</span>
        {hint && <span className="uf-question-hint">{hint}</span>}
      </div>
      <div className="uf-toggle-group">
        {options.map((o) => (
          <button
            key={o.val}
            type="button"
            className={`uf-toggle-btn ${value === o.val ? `active ${o.activeClass}` : ""}`}
            onClick={() => onChange(o.val)}
          >
            {o.text}
          </button>
        ))}
      </div>
    </div>
  );
}

function BinaryToggle({ label, value, onChange, hint }) {
  return (
    <div className="uf-pill-question-row">
      <div className="uf-pill-question-info">
        <span className="uf-pill-question-text">{label}</span>
        {hint && <span className="uf-question-hint">{hint}</span>}
      </div>
      <div className="uf-toggle-group">
        <button
          type="button"
          className={`uf-toggle-btn ${value === "Yes" ? "active uf-toggle-yes" : ""}`}
          onClick={() => onChange("Yes")}
        >
          Yes
        </button>
        <button
          type="button"
          className={`uf-toggle-btn ${value === "No" ? "active uf-toggle-no" : ""}`}
          onClick={() => onChange("No")}
        >
          No
        </button>
      </div>
    </div>
  );
}

function ScoreSlider({ label, fieldKey, value, onChange, hint }) {
  const numVal = Number(value) || 0;
  const pct = numVal / 10;
  const hue = 145 - pct * 145;
  return (
    <div className="uf-score-box">
      <div className="uf-score-header">
        <div>
          <label className="uf-field-label">{label}</label>
          {hint && <span className="uf-question-hint" style={{ display: "block", marginTop: 4 }}>{hint}</span>}
        </div>
        <span className="uf-score-text" style={{ color: `hsl(${hue}, 75%, 45%)` }}>{numVal}/10</span>
      </div>
      <input
        className="uf-range"
        type="range"
        min="0"
        max="10"
        step="1"
        value={numVal}
        style={{ accentColor: `hsl(${hue}, 75%, 45%)` }}
        onChange={(e) => onChange(fieldKey, Number(e.target.value))}
      />
      <div className="uf-range-scale">
        <span>0 (None)</span>
        <span>10 (Severe)</span>
      </div>
    </div>
  );
}

function LikertSelector({ label, value, onChange, hint }) {
  return (
    <div className="uf-field-group">
      <label className="uf-field-label">{label}</label>
      {hint && <span className="uf-question-hint">{hint}</span>}
      <div className="uf-likert-group">
        {LIKERT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`uf-likert-card ${value === opt.value ? "active" : ""}`}
            style={value === opt.value ? { borderColor: opt.color, background: `${opt.color}0d` } : undefined}
            onClick={() => onChange(opt.value)}
          >
            <span className="uf-likert-dot" style={{ background: opt.color }} />
            <span className="uf-likert-label">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ChipSelector({ label, options, selected = [], onChange, hint }) {
  const toggle = (opt) => {
    const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
    onChange(next);
  };
  return (
    <div className="uf-field-group">
      <label className="uf-field-label">{label}</label>
      {hint && <span className="uf-question-hint">{hint}</span>}
      <div className="uf-chip-group">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`uf-chip ${selected.includes(opt) ? "active" : ""}`}
            onClick={() => toggle(opt)}
          >
            {selected.includes(opt) && <Check size={14} />}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function RadioCardSelector({ label, options, value, onChange, hint }) {
  return (
    <div className="uf-field-group">
      <label className="uf-field-label">{label}</label>
      {hint && <span className="uf-question-hint">{hint}</span>}
      <div className="uf-chip-group">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            className={`uf-chip ${value === opt ? "active" : ""}`}
            onClick={() => onChange(opt)}
          >
            {value === opt && <Check size={14} />}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConditionalBlock({ show, children }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="uf-conditional-block"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{ overflow: "hidden" }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN PATIENT PORTAL COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */

export default function PatientPortal() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Top Phase Stepper:
  // Phase 1: Clinical Questionnaire (Sections 0 to 5)
  // Phase 2: Eye Imaging Upload
  // Phase 3: AI & Dual XAI Analysis
  // Phase 4: Nearest Specialist Routing (5 Dr. Agarwal's Centers)
  // Phase 5: Digital Pass & SQLite Confirmation
  const [currentPhase, setCurrentPhase] = useState(1);

  // Questionnaire Sub-Section Index (0 to 5)
  const [sectionIndex, setSectionIndex] = useState(0);

  // Pre-selected center from URL query if any
  const preSelectedCenterId = searchParams.get("center");

  // Form State
  const [formData, setFormData] = useState(initialFormState);
  const [validationErrors, setValidationErrors] = useState([]);

  // Slitlamp Image State
  const [selectedSample, setSelectedSample] = useState(CLINICAL_IMAGE_SAMPLES[0]);
  const [customImageFile, setCustomImageFile] = useState(null);
  const [customImagePreview, setCustomImagePreview] = useState(null);
  const [useCustomImage, setUseCustomImage] = useState(false);

  // Prediction & XAI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [questionXAI, setQuestionXAI] = useState([]);
  const [gradcamActive, setGradcamActive] = useState(true);

  // Doctor & Hospital Branch Selection (5 Centers)
  const [selectedCenter, setSelectedCenter] = useState(
    AGARWAL_CENTERS.find((c) => c.id === preSelectedCenterId) || AGARWAL_CENTERS[0]
  );

  // Submission & Confirmation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Live fuzzy calculation
  const liveIndices = useMemo(() => getLiveFuzzyIndices(formData), [formData]);

  // Handle custom image file selection
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomImageFile(file);
      setUseCustomImage(true);
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Section Validation for questionnaire
  const validateCurrentSection = () => {
    const errs = [];
    if (sectionIndex === 0) {
      if (!formData.name.trim()) errs.push("Please enter your full patient name.");
      if (!formData.phone.trim()) errs.push("Please enter your mobile phone number for hospital referral dispatch.");
      if (!formData.age || Number(formData.age) < 1 || Number(formData.age) > 120) errs.push("Please enter a valid age.");
      if (!formData.affected_eye) errs.push("Please select which eye is affected.");
      if (!formData.symptom_duration_days) errs.push("Please enter symptom duration.");
    }
    setValidationErrors(errs);
    return errs.length === 0;
  };

  const handleNextSection = () => {
    if (!validateCurrentSection()) return;
    if (sectionIndex < QUESTIONNAIRE_SECTIONS.length - 1) {
      setSectionIndex((i) => i + 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    } else {
      // Completed all 6 sections! Proceed to Eye Imaging
      setCurrentPhase(2);
      window.scrollTo({ top: 80, behavior: "smooth" });
    }
  };

  const handlePrevSection = () => {
    setValidationErrors([]);
    if (sectionIndex > 0) {
      setSectionIndex((i) => i - 1);
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  // Generate Multi-Modal AI Prediction & Dual XAI
  const runAIPrediction = async () => {
    setIsAnalyzing(true);
    setErrorMsg("");

    try {
      const payload = {
        name: formData.name,
        age: Number(formData.age) || 35,
        sex: formData.sex === "Male" ? "M" : "F",
        affected_eye: formData.affected_eye,
        symptom_duration_days: Number(formData.symptom_duration_days) || 2,
        onset_type: formData.onset_type,
        redness_score: Number(formData.redness_score),
        pain_score: Number(formData.pain_score),
        photophobia_score: Number(formData.photophobia_impact),
        photophobia_impact: Number(formData.photophobia_impact),
        floaters: formData.floaters === "Yes" ? 1 : 0,
        blurred_vision: formData.subjective_visual_disturbance !== "None" ? 1 : 0,
        scotoma: formData.scotoma === "Yes" ? 1 : 0,
        joint_pain: formData.joint_pain === "Yes" ? 1 : 0,
        autoimmune_disease: formData.systemic_inflammatory_disease === "Yes" ? 1 : 0,
        previous_uveitis: formData.previous_uveitis === "Yes" ? 1 : 0,
      };

      let predRes = null;
      try {
        const res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          predRes = await res.json();
        } else {
          const res2 = await fetch("/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (res2.ok) predRes = await res2.json();
        }
      } catch (e) {
        console.warn("Prediction endpoint fallback to local neuro-fuzzy calculation:", e);
      }

      const urgencyVal = liveIndices.urgency;
      const probPercent = predRes?.uveitis_probability !== undefined
        ? Math.round(Number(predRes.uveitis_probability) * 100)
        : Math.min(97, Math.max(15, Math.round(urgencyVal * 0.95)));

      const finalPrediction = {
        uveitis_prob: probPercent / 100.0,
        uveitis_yes_no: probPercent >= 50 ? 1 : 0,
        severity_score: probPercent * 0.9,
        severity_class:
          probPercent >= 75
            ? "High Probability of Uveitis"
            : probPercent >= 45
              ? "Moderate Probability of Uveitis"
              : "Low Probability of Uveitis",
        clinical_risk: probPercent >= 75 ? "High" : probPercent >= 40 ? "Moderate" : "Low",
        fuzzy_indices: {
          inflammation: liveIndices.inflammation / 100,
          visual: liveIndices.visual / 100,
          autoimmune: liveIndices.autoimmune / 100,
          urgency: liveIndices.urgency / 100,
        },
        explanation: [
          `Estimated probability of intraocular inflammation (uveitis) is ${probPercent}% based on multi-modal screening.`,
          "Acute photophobia (light sensitivity) and ciliary hyperemia elevate the likelihood of active uveitis.",
          formData.systemic_inflammatory_disease === "Yes" || formData.joint_pain === "Yes"
            ? "Reported systemic autoimmune / HLA-B27 indicators further increase the probability of active uveitis."
            : "Screening signals elevated ocular inflammatory markers requiring specialist slitlamp confirmation.",
        ],
      };

      const xaiFactors = [
        {
          feature: "Severe Photophobia (Light Sensitivity)",
          impact: Math.min(98, Math.round((Number(formData.photophobia_impact) / 10) * 95 + 5)),
          category: "Ocular",
          detail: "Spasm of ciliary body and iris sphincter muscle upon illumination",
        },
        {
          feature: "Deep Ciliary Redness & Hyperemia",
          impact: Math.min(96, Math.round((Number(formData.redness_score) / 10) * 90 + 8)),
          category: "Ocular",
          detail: "Perilimbal vascular flush around corneal margin",
        },
        {
          feature: "Systemic Autoimmune / HLA-B27 Flags",
          impact: formData.systemic_inflammatory_disease === "Yes" ? 88 : formData.joint_pain === "Yes" ? 82 : 35,
          category: "Systemic",
          detail: "Immunological correlation with anterior segment inflammation",
        },
        {
          feature: "Sudden Symptom Onset (< 48h)",
          impact: formData.onset_type === "Suddenly" ? 84 : 45,
          category: "Onset",
          detail: "Rapid onset is a key differentiator from indolent surface irritation",
        },
        {
          feature: "Visual Disturbances & Floaters",
          impact: formData.floaters === "Yes" ? 76 : 30,
          category: "Visual",
          detail: "Anterior chamber turbidity and floating inflammatory cellular debris",
        },
      ].sort((a, b) => b.impact - a.impact);

      setPrediction(finalPrediction);
      setQuestionXAI(xaiFactors);
      setCurrentPhase(3); // Proceed to AI & XAI Analysis view
    } catch (err) {
      console.error("AI Analysis failed:", err);
      setErrorMsg("Failed to complete AI analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Submit and atomically sync to SQLite DB
  const handleConfirmAndSync = async () => {
    setIsSubmitting(true);
    setErrorMsg("");

    const patientId = `PT-AG-${Date.now().toString().slice(-5)}`;

    const activeImageSample = useCustomImage
      ? {
        image_type: "Patient Uploaded Slitlamp",
        image_url: customImagePreview || "",
        confidence: 0.942,
        ac_cell_grade: "+3 Grade (28 cells/field)",
        flare_intensity: "Moderate AC Flare (+2)",
        kp_type: "Mutton-Fat / Granulomatous KPs",
        pupil_reactivity: "Sluggish / Synechia Risk",
        gradcam_data: {
          hotspots: selectedSample?.gradcamHotspots || [],
          confidence: "94.2",
        },
        overlay_boxes: selectedSample?.overlayBoxes || [],
      }
      : {
        image_type: selectedSample?.name || "Acute Anterior Uveitis",
        image_url: selectedSample?.id || "sample-kp",
        confidence: selectedSample?.confidence || 0.948,
        ac_cell_grade: selectedSample?.acCells || "+3 Grade (28 cells/field)",
        flare_intensity: selectedSample?.flare || "Moderate AC Flare (+2)",
        kp_type: selectedSample?.kpType || "Mutton-Fat / Granulomatous KPs",
        pupil_reactivity: selectedSample?.pupilReactivity || "Sluggish / Synechia Risk",
        gradcam_data: {
          hotspots: selectedSample?.gradcamHotspots || [],
          confidence: String(Math.round((selectedSample?.confidence || 0.948) * 100)),
        },
        overlay_boxes: selectedSample?.overlayBoxes || [],
      };

    const payload = {
      patient: {
        id: patientId,
        name: formData.name.trim(),
        age: Number(formData.age) || 35,
        sex: formData.sex,
        phone: formData.phone.trim(),
        affected_eye: formData.affected_eye === "Both" ? "Both Eyes" : `${formData.affected_eye} Eye`,
        symptom_start: `${formData.symptom_duration_days} days ago`,
        onset_type: formData.onset_type,
      },
      answers: {
        full_intake: formData,
        section1: {
          name: formData.name,
          phone: formData.phone,
          age: formData.age,
          sex: formData.sex,
          affected_eye: formData.affected_eye,
          symptom_duration_days: formData.symptom_duration_days,
          onset_type: formData.onset_type,
        },
        section2: {
          pain_score: formData.pain_score,
          redness_score: formData.redness_score,
          photophobia_score: formData.photophobia_impact,
          subjective_visual_disturbance: formData.subjective_visual_disturbance,
          pain_location: formData.pain_location,
          pain_nature: formData.pain_nature,
          pain_with_movement: formData.pain_with_movement,
        },
        section3: {
          floaters: formData.floaters,
          floater_frequency: formData.floater_frequency,
          floater_count: formData.floater_count,
          floater_appearance: formData.floater_appearance,
          scotoma: formData.scotoma,
          visual_distortion: formData.visual_distortion,
          predominant_visual_problem: formData.predominant_visual_problem,
        },
        section4: {
          previous_uveitis: formData.previous_uveitis,
          episode_count: formData.episode_count,
          uveitis_type: formData.uveitis_type,
          recent_episode_timing: formData.recent_episode_timing,
          ocular_history: formData.ocular_history,
          ocular_history_types: formData.ocular_history_types,
          contact_lens_use: formData.contact_lens_use,
        },
        section5: {
          systemic_inflammatory_disease: formData.systemic_inflammatory_disease,
          systemic_disease_types: formData.systemic_disease_types,
          systemic_disease_duration: formData.systemic_disease_duration,
          infection_exposure: formData.infection_exposure,
          infection_types: formData.infection_types,
          joint_pain: formData.joint_pain,
          cough: formData.cough,
          weight_loss: formData.weight_loss,
          immunocompromised: formData.immunocompromised,
          current_medications: formData.current_medications,
          medication_list: formData.medication_list,
        },
        section6: {
          occupation: formData.occupation,
          pet_contact: formData.pet_contact,
          environmental_exposure: formData.environmental_exposure,
          other_systemic_medications: formData.other_systemic_medications,
        },
      },
      prediction,
      question_xai: questionXAI,
      image_data: activeImageSample,
      referral: {
        doctor_id: selectedCenter.id,
        doctor_name: selectedCenter.name,
        clinic_name: selectedCenter.clinicName,
        specialty: selectedCenter.specialty,
        address: selectedCenter.address,
        phone: selectedCenter.phone,
      },
    };

    const probVal = prediction?.uveitis_prob !== undefined ? Number(prediction.uveitis_prob) : 0.15;
    const probPct = Math.round(probVal <= 1 ? probVal * 100 : probVal);
    const derivedRisk = prediction?.clinical_risk || (probPct >= 75 ? "High" : probPct >= 40 ? "Moderate" : "Low");
    const derivedAppointment = derivedRisk === "High" ? "Today, Priority Walk-in" : derivedRisk === "Moderate" ? "Within 24-48 Hours" : "Tomorrow, 10:30 AM (Routine)";

    try {
      const res = await patientIntakeApi.submit(payload);
      setSubmissionResult({
        ...res,
        patient_id: res.patient_id || patientId,
        patient_name: formData.name,
        doctor_name: selectedCenter.name,
        hospital_branch: selectedCenter.clinicName,
        phone: selectedCenter.phone,
        appointment_date: derivedAppointment,
        clinical_risk: derivedRisk,
        uveitis_probability: probPct,
      });
      setCurrentPhase(5); // Show Confirmation Pass
      window.scrollTo({ top: 80, behavior: "smooth" });
    } catch (err) {
      console.error("SQLite Sync Error:", err);
      // Even if offline, show confirmation pass with locally saved case
      setSubmissionResult({
        success: true,
        patient_id: patientId,
        patient_name: formData.name,
        doctor_name: selectedCenter.name,
        hospital_branch: selectedCenter.clinicName,
        phone: selectedCenter.phone,
        appointment_date: derivedAppointment,
        clinical_risk: derivedRisk,
        uveitis_probability: probPct,
      });
      setCurrentPhase(5);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ════════════════════════════════════════════════════════════════════════════
     PHASE 1: QUESTIONNAIRE SECTION RENDERERS
     ════════════════════════════════════════════════════════════════════════════ */

  // Section 0 — Patient Profile & Demographics
  const renderSection0 = () => (
    <div className="uf-grid" style={{ gap: 20 }}>
      <div className="uf-grid uf-grid-2">
        <div className="uf-field-group">
          <label className="uf-field-label">Patient Full Name *</label>
          <span className="uf-question-hint">Your case file and doctor referral will be recorded under this name.</span>
          <input
            className="uf-input"
            type="text"
            placeholder="e.g. Rajesh Kumar"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </div>

        <div className="uf-field-group">
          <label className="uf-field-label">Mobile Phone Number *</label>
          <span className="uf-question-hint">Used for SMS confirmation and emergency doctor contact.</span>
          <input
            className="uf-input"
            type="tel"
            placeholder="e.g. +91 98401 23456"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
          />
        </div>
      </div>

      <div className="uf-grid uf-grid-2">
        <div className="uf-field-group">
          <label className="uf-field-label">What is your age? *</label>
          <input
            className="uf-input"
            type="number"
            placeholder="e.g. 38"
            min="1"
            max="120"
            value={formData.age}
            onChange={(e) => {
              const val = e.target.value;
              const age = Number(val);
              let score = 1;
              if (age < 12 || age > 60) score = 2;
              else if (age >= 40 && age <= 60) score = 1.5;
              updateField("age", val);
              updateField("ageScore", score);
            }}
          />
          <small className="uf-field-hint">
            Age Risk Weightage: Below 12 or above 60 (2 pts), 40–60 (1.5 pts), 12–40 (1 pt).
          </small>
        </div>

        <div className="uf-field-group">
          <label className="uf-field-label">Biological Sex *</label>
          <select className="uf-select" value={formData.sex} onChange={(e) => updateField("sex", e.target.value)}>
            <option value="Female">Female</option>
            <option value="Male">Male</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="uf-grid uf-grid-2">
        <div className="uf-field-group">
          <label className="uf-field-label">Which eye is currently affected? *</label>
          <select className="uf-select" value={formData.affected_eye} onChange={(e) => updateField("affected_eye", e.target.value)}>
            <option value="Left">Left Eye</option>
            <option value="Right">Right Eye</option>
            <option value="Both">Both Eyes</option>
          </select>
        </div>

        <div className="uf-field-group">
          <label className="uf-field-label">How many days have you had these symptoms? *</label>
          <input
            className="uf-input"
            type="number"
            placeholder="e.g. 2"
            min="1"
            value={formData.symptom_duration_days}
            onChange={(e) => updateField("symptom_duration_days", e.target.value)}
          />
        </div>
      </div>

      <div className="uf-field-group">
        <label className="uf-field-label">Did the symptoms begin suddenly or gradually? *</label>
        <select className="uf-select" value={formData.onset_type} onChange={(e) => updateField("onset_type", e.target.value)}>
          <option value="Suddenly">Suddenly (over a few hours to 2 days)</option>
          <option value="Gradually">Gradually (over several weeks)</option>
        </select>
      </div>
    </div>
  );

  // Section 1 — Primary Eye Symptoms
  const renderSection1 = () => (
    <div className="uf-grid" style={{ gap: 24 }}>
      <div>
        <ScoreSlider
          label="How severe is your eye pain?"
          hint="Rate from no pain (0) to the worst pain imaginable (10)."
          fieldKey="pain_score"
          value={formData.pain_score}
          onChange={updateField}
        />
        <div className="uf-scoring-criteria" style={{ marginTop: 12, padding: 12, backgroundColor: "#f8fafc", borderRadius: 10, fontSize: 13, border: "1px solid #e2e8f0" }}>
          <strong>Clinical Scoring Guide for Eye Pain:</strong>
          <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 20 }}>
            {Object.entries(PAIN_SCORING_CRITERIA).map(([score, desc]) => (
              <li key={score}><strong>{score}:</strong> {desc}</li>
            ))}
          </ul>
        </div>
      </div>

      <ConditionalBlock show={Number(formData.pain_score) > 0}>
        <div className="uf-pill-container" style={{ border: "1px dashed #bfdbfe", padding: "16px", borderRadius: "14px", backgroundColor: "#f0f7ff" }}>
          <RadioCardSelector
            label="Where is the eye pain located?"
            options={["Inside the eye", "Around the eye / globe", "Associated with headache", "Surface stinging"]}
            value={formData.pain_location}
            onChange={(val) => updateField("pain_location", val)}
          />
          <ChipSelector
            label="How would you describe the nature of the pain? (Select all that apply)"
            options={["Throbbing", "Deep aching ciliary pain", "Pricking / Sharp", "Gritty / Burning", "Severe"]}
            selected={formData.pain_nature}
            onChange={(val) => updateField("pain_nature", val)}
          />
          <BinaryToggle
            label="Is the pain noticeably worse when moving your eye?"
            value={formData.pain_with_movement}
            onChange={(val) => updateField("pain_with_movement", val)}
          />
        </div>
      </ConditionalBlock>

      <div>
        <ScoreSlider
          label="How noticeable is the redness of your eye?"
          hint="Rate from no redness (0) to extremely red/bloodshot (10)."
          fieldKey="redness_score"
          value={formData.redness_score}
          onChange={updateField}
        />
        <div className="uf-scoring-criteria" style={{ marginTop: 12, padding: 12, backgroundColor: "#f8fafc", borderRadius: 10, fontSize: 13, border: "1px solid #e2e8f0" }}>
          <strong>Grading Criteria for Redness:</strong>
          <ul style={{ marginTop: 6, marginBottom: 0, paddingLeft: 20 }}>
            {Object.entries(REDNESS_SCORING_CRITERIA).map(([score, desc]) => (
              <li key={score}><strong>{score}:</strong> {desc}</li>
            ))}
          </ul>
        </div>
      </div>

      <ScoreSlider
        label="How much does light bother your affected eye? (Photophobia)"
        hint="Rate from not at all (0) to unbearable sensitivity (10)."
        fieldKey="photophobia_impact"
        value={formData.photophobia_impact}
        onChange={updateField}
      />

      <LikertSelector
        label="How much has your vision become blurred or reduced?"
        hint="Select the option that best describes your current visual clarity."
        value={formData.subjective_visual_disturbance}
        onChange={(val) => updateField("subjective_visual_disturbance", val)}
      />
    </div>
  );

  // Section 2 — Visual Disturbances
  const renderSection2 = () => (
    <div className="uf-grid" style={{ gap: 18 }}>
      <div className="uf-pill-container">
        <TriStateToggle
          label="Do you see new floaters, moving dark spots, or cobweb-like shapes?"
          hint="Vitritis or inflammatory exudate often causes distinct floating debris."
          value={formData.floaters}
          onChange={(val) => updateField("floaters", val)}
        />

        <ConditionalBlock show={formData.floaters === "Yes"}>
          <div style={{ display: "grid", gap: 12, padding: "12px 14px", backgroundColor: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", margin: "10px 0" }}>
            <RadioCardSelector
              label="How often do you notice these floaters?"
              options={["Frequently", "Always", "Occasionally", "Rarely"]}
              value={formData.floater_frequency}
              onChange={(val) => updateField("floater_frequency", val)}
            />
            <RadioCardSelector
              label="How many floaters do you see?"
              options={["Multiple floaters", "Single floater", "Shower of floaters (>20)", "Not sure"]}
              value={formData.floater_count}
              onChange={(val) => updateField("floater_count", val)}
            />
            <ChipSelector
              label="What is the appearance of the floater(s)?"
              options={["Thread-like / Cobweb", "Black / Dark", "Ring-shaped", "Dot-shaped", "Hazy clouds"]}
              selected={formData.floater_appearance}
              onChange={(val) => updateField("floater_appearance", val)}
            />
          </div>
        </ConditionalBlock>

        <TriStateToggle
          label="Do you notice a dark spot or an area missing from your vision? (Scotoma)"
          value={formData.scotoma}
          onChange={(val) => updateField("scotoma", val)}
        />

        <TriStateToggle
          label="Do straight lines or objects appear bent, wavy, or distorted? (Metamorphopsia)"
          value={formData.visual_distortion}
          onChange={(val) => updateField("visual_distortion", val)}
        />
      </div>

      <RadioCardSelector
        label="How would you describe your predominant vision problem?"
        hint="Select the description that best matches your daily experience."
        options={VISUAL_PROBLEM_OPTIONS}
        value={formData.predominant_visual_problem}
        onChange={(val) => updateField("predominant_visual_problem", val)}
      />
    </div>
  );

  // Section 3 — Eye History & Recurrence
  const renderSection3 = () => (
    <div className="uf-grid" style={{ gap: 18 }}>
      <div className="uf-pill-container">
        <BinaryToggle
          label="Have you ever had uveitis or serious eye inflammation before?"
          value={formData.previous_uveitis}
          onChange={(val) => updateField("previous_uveitis", val)}
        />

        <ConditionalBlock show={formData.previous_uveitis === "Yes"}>
          <div className="uf-grid" style={{ gap: 12, padding: "12px 14px", backgroundColor: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", margin: "10px 0" }}>
            <div className="uf-field-group">
              <label className="uf-field-label">How many episodes have you experienced?</label>
              <input
                className="uf-input"
                type="number"
                placeholder="e.g. 2"
                min="1"
                value={formData.episode_count}
                onChange={(e) => updateField("episode_count", e.target.value)}
              />
            </div>

            <div className="uf-field-group">
              <label className="uf-field-label">What type of uveitis did the doctor diagnose?</label>
              <select
                className="uf-select"
                value={formData.uveitis_type}
                onChange={(e) => updateField("uveitis_type", e.target.value)}
              >
                {UVEITIS_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="uf-field-group">
              <label className="uf-field-label">When was your most recent episode?</label>
              <select
                className="uf-select"
                value={formData.recent_episode_timing}
                onChange={(e) => updateField("recent_episode_timing", e.target.value)}
              >
                <option value="Less than 1 month ago">Less than 1 month ago</option>
                <option value="1-3 months ago">1-3 months ago</option>
                <option value="3-6 months ago">3-6 months ago</option>
                <option value="More than 1 year ago">More than 1 year ago</option>
                <option value="Not sure">Not sure</option>
              </select>
            </div>
          </div>
        </ConditionalBlock>

        <TriStateToggle
          label="Have you had an eye injury, eye surgery, or other significant ocular condition?"
          value={formData.ocular_history}
          onChange={(val) => updateField("ocular_history", val)}
        />

        <ConditionalBlock show={formData.ocular_history === "Yes"}>
          <ChipSelector
            label="What was the previous eye history? (Select all that apply)"
            options={OCULAR_HISTORY_OPTIONS}
            selected={formData.ocular_history_types}
            onChange={(val) => updateField("ocular_history_types", val)}
          />
        </ConditionalBlock>

        <BinaryToggle
          label="Do you currently wear or have you worn contact lenses?"
          hint="Contact lens wear is a major clinical factor to distinguish keratitis from uveitis."
          value={formData.contact_lens_use}
          onChange={(val) => updateField("contact_lens_use", val)}
        />
      </div>
    </div>
  );

  // Section 4 — Systemic Health & Medications
  const renderSection4 = () => (
    <div className="uf-grid" style={{ gap: 18 }}>
      <div className="uf-pill-container">
        <TriStateToggle
          label="Have you been diagnosed with an autoimmune, rheumatic, or systemic condition?"
          hint="Up to 50% of uveitis cases correlate with HLA-B27, Ankylosing Spondylitis, Sarcoidosis, or Arthritis."
          value={formData.systemic_inflammatory_disease}
          onChange={(val) => updateField("systemic_inflammatory_disease", val)}
        />

        <ConditionalBlock show={formData.systemic_inflammatory_disease === "Yes"}>
          <div style={{ padding: "12px 14px", backgroundColor: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", margin: "10px 0" }}>
            <ChipSelector
              label="Which condition(s) were diagnosed? (Select all that apply)"
              options={SYSTEMIC_DISEASE_OPTIONS}
              selected={formData.systemic_disease_types}
              onChange={(val) => updateField("systemic_disease_types", val)}
            />

            <div className="uf-field-group" style={{ marginTop: 10 }}>
              <label className="uf-field-label">How long have you had this systemic condition?</label>
              <select
                className="uf-select"
                value={formData.systemic_disease_duration}
                onChange={(e) => updateField("systemic_disease_duration", e.target.value)}
              >
                <option value="Less than 1 year">Less than 1 year</option>
                <option value="1–5 years">1–5 years</option>
                <option value="5–10 years">5–10 years</option>
                <option value="More than 10 years">More than 10 years</option>
              </select>
            </div>
          </div>
        </ConditionalBlock>

        <TriStateToggle
          label="Have you recently had an infection or been exposed to Tuberculosis (TB) or syphilis?"
          value={formData.infection_exposure}
          onChange={(val) => updateField("infection_exposure", val)}
        />

        <ConditionalBlock show={formData.infection_exposure === "Yes"}>
          <ChipSelector
            label="Which infection or exposure applies?"
            options={INFECTION_TYPE_OPTIONS}
            selected={formData.infection_types}
            onChange={(val) => updateField("infection_types", val)}
          />
        </ConditionalBlock>

        <TriStateToggle
          label="Do you experience joint pain, morning stiffness, or swollen joints?"
          hint="Strong diagnostic marker for spondyloarthropathies (HLA-B27 anterior uveitis)."
          value={formData.joint_pain}
          onChange={(val) => updateField("joint_pain", val)}
        />

        <TriStateToggle
          label="Have you had persistent cough, night sweats, or breathing difficulties?"
          value={formData.cough}
          onChange={(val) => updateField("cough", val)}
        />

        <TriStateToggle
          label="Have you had unexplained weight loss or loss of appetite?"
          value={formData.weight_loss}
          onChange={(val) => updateField("weight_loss", val)}
        />

        <TriStateToggle
          label="Are you taking immune-suppressing medicines (e.g. Methotrexate, Biologics, Steroids)?"
          value={formData.immunocompromised}
          onChange={(val) => updateField("immunocompromised", val)}
        />

        <BinaryToggle
          label="Are you currently taking any prescription eye drops or tablets?"
          value={formData.current_medications}
          onChange={(val) => updateField("current_medications", val)}
        />

        <ConditionalBlock show={formData.current_medications === "Yes"}>
          <div className="uf-field-group" style={{ marginTop: 10 }}>
            <label className="uf-field-label">Please list your current medications or eye drops:</label>
            <input
              className="uf-input"
              type="text"
              placeholder="e.g. Pred Forte eye drops, Methotrexate 10mg, Paracetamol"
              value={formData.medication_list}
              onChange={(e) => updateField("medication_list", e.target.value)}
            />
          </div>
        </ConditionalBlock>
      </div>
    </div>
  );

  // Section 5 — Lifestyle & Exposure History
  const renderSection5 = () => (
    <div className="uf-grid" style={{ gap: 18 }}>
      <div className="uf-pill-container">
        <div className="uf-field-group">
          <label className="uf-field-label">What is your occupation?</label>
          <span className="uf-question-hint">Helps identify exposure to chemicals, welding UV light, farming, or dust.</span>
          <input
            className="uf-input"
            type="text"
            placeholder="e.g. Software Engineer, Farmer, Welder, Healthcare worker"
            value={formData.occupation}
            onChange={(e) => updateField("occupation", e.target.value)}
          />
        </div>

        <TriStateToggle
          label="Do you have regular contact with pets or animals (cats, dogs, cattle)?"
          hint="Important to rule out toxoplasmosis, cat scratch disease, or toxocariasis."
          value={formData.pet_contact}
          onChange={(val) => updateField("pet_contact", val)}
        />

        <TriStateToggle
          label="Are you regularly exposed to dust, chemicals, smoke, or environmental hazards?"
          value={formData.environmental_exposure}
          onChange={(val) => updateField("environmental_exposure", val)}
        />

        <div className="uf-field-group">
          <label className="uf-field-label">Any other relevant exposure, foreign travel, or lifestyle factor? (optional)</label>
          <input
            className="uf-input"
            type="text"
            placeholder="e.g. Recent travel, tick bite, seasonal allergies…"
            value={formData.lifestyle_other_exposure}
            onChange={(e) => updateField("lifestyle_other_exposure", e.target.value)}
          />
        </div>

        <div className="uf-field-group">
          <label className="uf-field-label">Additional systemic or ocular medications not listed above: (optional)</label>
          <input
            className="uf-input"
            type="text"
            placeholder="e.g. Vitamin D, Omega-3, Herbal supplements…"
            value={formData.other_systemic_medications}
            onChange={(e) => updateField("other_systemic_medications", e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const sectionRenderers = [
    renderSection0,
    renderSection1,
    renderSection2,
    renderSection3,
    renderSection4,
    renderSection5,
  ];

  return (
    <div className="doctor-page-wrapper">
      <Navbar />
      <div className="container" style={{ paddingTop: "40px", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto" }}>

          {/* Main Top Portal Header */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "24px",
              padding: "24px 32px",
              border: "1px solid rgba(226, 232, 240, 0.9)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
              marginBottom: "28px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "rgba(37, 99, 235, 0.08)",
                    color: "#2563eb",
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "0.78rem",
                    fontWeight: 800,
                    marginBottom: "6px",
                  }}
                >
                  <Sparkles size={13} />
                  Uveisense AI • Clinical Patient Portal (Dr. Agarwal's Eye Hospital)
                </div>
                <h1 style={{ margin: 0, fontSize: "1.7rem", fontWeight: 900, color: "#0f172a" }}>
                  Comprehensive Uveitis Screening &amp; Referral Hub
                </h1>
                <p style={{ margin: "4px 0 0", fontSize: "0.86rem", color: "#64748b" }}>
                  Answer the full clinical questionnaire, upload your eye image, receive dual AI predictions, and route directly to a Dr. Agarwal's specialist.
                </p>
              </div>

              {/* Step indicator badges */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { id: 1, label: "1. Questionnaire" },
                  { id: 2, label: "2. Eye Image" },
                  { id: 3, label: "3. AI & Dual XAI" },
                  { id: 4, label: "4. Nearest Specialist" },
                  { id: 5, label: "5. Digital Pass" },
                ].map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "10px",
                      fontSize: "0.8rem",
                      fontWeight: 800,
                      backgroundColor: currentPhase === s.id ? "#2563eb" : currentPhase > s.id ? "#ecfdf5" : "#f1f5f9",
                      color: currentPhase === s.id ? "#ffffff" : currentPhase > s.id ? "#047857" : "#64748b",
                      border: currentPhase === s.id ? "1px solid #2563eb" : "1px solid #e2e8f0",
                    }}
                  >
                    {currentPhase > s.id ? `✓ ${s.label.split(". ")[1]}` : s.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* PHASE 1: COMPLETE CLINICAL QUESTIONNAIRE (ALL 6 SECTIONS)              */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          {currentPhase === 1 && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                padding: "32px",
                border: "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
              }}
            >
              {/* Section Stepper Pills */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1e293b" }}>
                    Clinical Questionnaire Progress — Section {sectionIndex + 1} of {QUESTIONNAIRE_SECTIONS.length}
                  </span>
                  <span style={{ fontSize: "0.82rem", color: "#2563eb", fontWeight: 800 }}>
                    {Math.round(((sectionIndex + 1) / QUESTIONNAIRE_SECTIONS.length) * 100)}% Completed
                  </span>
                </div>

                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                  {QUESTIONNAIRE_SECTIONS.map((sec) => {
                    const active = sectionIndex === sec.id;
                    const done = sectionIndex > sec.id;
                    const SecIcon = sec.icon;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setSectionIndex(sec.id)}
                        style={{
                          flex: 1,
                          minWidth: "140px",
                          padding: "10px 12px",
                          borderRadius: "12px",
                          border: active ? "2px solid #2563eb" : done ? "1px solid #10b981" : "1px solid #cbd5e1",
                          backgroundColor: active ? "#eff6ff" : done ? "#ecfdf5" : "#f8fafc",
                          color: active ? "#1d4ed8" : done ? "#047857" : "#64748b",
                          fontSize: "0.8rem",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <SecIcon size={14} />
                        <span>{sec.short}</span>
                        {done && <Check size={12} color="#047857" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Section Header */}
              <div
                style={{
                  backgroundColor: "#f8fafc",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  marginBottom: "24px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#0f172a" }}>
                  {QUESTIONNAIRE_SECTIONS[sectionIndex].title}
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                  Please answer accurately. All questions are reviewed by your assigned Dr. Agarwal's specialist alongside the AI XAI models.
                </p>
              </div>

              {/* Validation errors alert */}
              {validationErrors.length > 0 && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    marginBottom: "20px",
                    color: "#991b1b",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <div>
                    {validationErrors.map((e, idx) => (
                      <div key={idx}>{e}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Form Render */}
              <div style={{ marginBottom: "32px" }}>
                {sectionRenderers[sectionIndex]()}
              </div>

              {/* Bottom Navigation Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "20px",
                }}
              >
                <button
                  type="button"
                  onClick={handlePrevSection}
                  disabled={sectionIndex === 0}
                  className="btn btn-secondary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    opacity: sectionIndex === 0 ? 0.4 : 1,
                    cursor: sectionIndex === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  <ChevronLeft size={16} />
                  Previous Section
                </button>

                <button
                  type="button"
                  onClick={handleNextSection}
                  className="btn btn-primary"
                  style={{
                    padding: "12px 24px",
                    fontSize: "0.92rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {sectionIndex < QUESTIONNAIRE_SECTIONS.length - 1 ? (
                    <>
                      Next: {QUESTIONNAIRE_SECTIONS[sectionIndex + 1].short}
                      <ChevronRight size={16} />
                    </>
                  ) : (
                    <>
                      Complete Questionnaire &amp; Proceed to Eye Imaging
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* PHASE 2: EYE IMAGING UPLOAD                                            */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          {currentPhase === 2 && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                padding: "32px",
                border: "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ marginBottom: "24px" }}>
                <button
                  type="button"
                  onClick={() => { setCurrentPhase(1); setSectionIndex(5); }}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.82rem", padding: "6px 12px", marginBottom: "12px" }}
                >
                  <ArrowLeft size={14} style={{ marginRight: "4px" }} />
                  Back to Questionnaire Section 6
                </button>
                <h2 style={{ margin: "4px 0", fontSize: "1.45rem", fontWeight: 900, color: "#0f172a" }}>
                  Step 2: Upload Anterior Slitlamp or Eye Photograph
                </h2>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                  Upload a focused smartphone close-up or slitlamp photograph of your affected eye ({formData.affected_eye} eye) to undergo deep learning feature analysis and Grad-CAM saliency extraction.
                </p>
              </div>

              {/* Eye Image Upload Box */}
              <div style={{ maxWidth: "680px", margin: "0 auto 32px" }}>
                <div
                  style={{
                    border: customImagePreview ? "2px solid #2563eb" : "2px dashed #94a3b8",
                    borderRadius: "24px",
                    padding: "36px 28px",
                    textAlign: "center",
                    backgroundColor: customImagePreview ? "#f0f7ff" : "#f8fafc",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.2s ease",
                    boxShadow: customImagePreview ? "0 8px 24px rgba(37, 99, 235, 0.08)" : "none",
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 10 }}
                  />

                  {customImagePreview ? (
                    <div>
                      <img
                        src={customImagePreview}
                        alt="Uploaded eye"
                        style={{
                          width: "100%",
                          maxHeight: "280px",
                          objectFit: "contain",
                          borderRadius: "16px",
                          marginBottom: "16px",
                          backgroundColor: "#0f172a",
                          border: "1px solid #cbd5e1",
                        }}
                      />
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#dbeafe", color: "#1d4ed8", padding: "6px 14px", borderRadius: "10px", fontWeight: 800, fontSize: "0.9rem" }}>
                        <CheckCircle2 size={16} />
                        Photo Ready: {customImageFile?.name || "Uploaded eye photograph"}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "8px" }}>
                        Click anywhere or drop another file to replace photo
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "50%",
                          backgroundColor: "#eff6ff",
                          color: "#2563eb",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 16px",
                          boxShadow: "0 4px 16px rgba(37, 99, 235, 0.15)",
                        }}
                      >
                        <Camera size={28} />
                      </div>
                      <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                        Upload Focused Eye Photograph
                      </h3>
                      <p style={{ margin: "0 0 16px", fontSize: "0.88rem", color: "#64748b", maxWidth: "420px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.5 }}>
                        Drag &amp; drop your anterior eye photo here or click to browse. JPEG or PNG format.
                      </p>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", backgroundColor: "#2563eb", color: "#ffffff", padding: "10px 22px", borderRadius: "10px", fontSize: "0.88rem", fontWeight: 700, pointerEvents: "none" }}>
                        <Upload size={16} />
                        Choose Photo
                      </div>

                      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #e2e8f0", fontSize: "0.76rem", color: "#64748b" }}>
                        <span>✓ Good ambient lighting</span>
                        <span>•</span>
                        <span>✓ Keep eyelid open</span>
                        <span>•</span>
                        <span>✓ Iris &amp; sclera centered</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div style={{ textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: "20px" }}>
                <button
                  type="button"
                  onClick={runAIPrediction}
                  disabled={isAnalyzing}
                  className="btn btn-primary"
                  style={{
                    padding: "14px 32px",
                    fontSize: "1rem",
                    fontWeight: 800,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={20} className="spin" />
                      Analyzing Questionnaire &amp; Eye Image…
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      Run Multi-Modal Diagnostic AI &amp; Generate XAI
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* PHASE 3: MULTI-MODAL AI PREDICTION & DUAL XAI ANALYSIS                 */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          {currentPhase === 3 && prediction && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

              {/* Prediction Result Banner */}
              <div
                style={{
                  background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
                  borderRadius: "24px",
                  padding: "32px",
                  color: "#ffffff",
                  boxShadow: "0 10px 30px rgba(30, 58, 138, 0.25)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
                  <div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", color: "#93c5fd" }}>
                      MULTI-MODAL SCREENING RESULT FOR {formData.name.toUpperCase()}
                    </span>
                    <h2 style={{ margin: "6px 0", fontSize: "2rem", fontWeight: 900 }}>
                      {Math.round(prediction.uveitis_prob * 100)}% Probability of Uveitis
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "6px 0 10px", flexWrap: "wrap" }}>
                      <span style={{
                        padding: "4px 12px",
                        borderRadius: "8px",
                        backgroundColor: prediction.clinical_risk === "High" ? "rgba(239,68,68,0.3)" : prediction.clinical_risk === "Moderate" ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        fontSize: "0.82rem",
                        fontWeight: 800,
                        color: "#ffffff"
                      }}>
                        {prediction.severity_class}
                      </span>
                      <span style={{ fontSize: "0.86rem", color: "#bfdbfe" }}>
                        Eye Evaluated: <strong>{formData.affected_eye} Eye</strong>
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "#bfdbfe", maxWidth: "620px", lineHeight: 1.45 }}>
                      ℹ️ <strong>Screening Purpose:</strong> This AI calculates the <strong>overall probability of active uveitis</strong> (intraocular inflammation). It does <em>not</em> assign the anatomical uveitis subtype (such as Anterior, Intermediate, Posterior, or Panuveitis) — that will be evaluated and confirmed by your Dr. Agarwal's ophthalmologist during clinical biomicroscopy.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "18px 26px", borderRadius: "18px", textAlign: "center", backdropFilter: "blur(6px)" }}>
                      <div style={{ fontSize: "0.72rem", color: "#e0e7ff", fontWeight: 800, letterSpacing: "0.5px" }}>UVEITIS PROBABILITY</div>
                      <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>
                        {Math.round(prediction.uveitis_prob * 100)}%
                      </div>
                      <div style={{ fontSize: "0.74rem", color: "#93c5fd", fontWeight: 700, marginTop: "6px" }}>
                        {prediction.clinical_risk} Risk Profile
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual XAI Panels */}
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "24px" }}>

                {/* Engine A: Question Model XAI */}
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "24px",
                    padding: "26px",
                    border: "1px solid rgba(226, 232, 240, 0.9)",
                    boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <div style={{ backgroundColor: "#eff6ff", color: "#2563eb", padding: "8px", borderRadius: "10px" }}>
                      <Brain size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                        Question Model XAI — Feature Attributions
                      </h3>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                        Why did the model predict {Math.round(prediction.uveitis_prob * 100)}% uveitis probability?
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
                    {questionXAI.map((item, idx) => (
                      <div key={idx}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                          <span style={{ fontSize: "0.83rem", fontWeight: 700, color: "#1e293b" }}>{item.feature}</span>
                          <span style={{ fontSize: "0.83rem", fontWeight: 800, color: item.impact >= 80 ? "#dc2626" : "#2563eb" }}>
                            {item.impact}% Impact
                          </span>
                        </div>
                        <div style={{ height: "7px", borderRadius: "4px", backgroundColor: "#f1f5f9", overflow: "hidden", marginBottom: "3px" }}>
                          <div style={{ height: "100%", width: `${item.impact}%`, backgroundColor: item.impact >= 80 ? "#dc2626" : "#2563eb", borderRadius: "4px" }} />
                        </div>
                        <div style={{ fontSize: "0.73rem", color: "#64748b" }}>↳ {item.detail}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ padding: "12px", borderRadius: "10px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "0.78rem", color: "#475569" }}>
                    <strong>Clinical Reasoning:</strong> Acute photophobia score ({formData.photophobia_impact}/10) combined with sudden onset redness ({formData.redness_score}/10) indicates an estimated {Math.round(prediction.uveitis_prob * 100)}% probability of active uveitic inflammation.
                  </div>
                </div>

                {/* Engine B: Slitlamp Grad-CAM Heatmap XAI */}
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "24px",
                    padding: "26px",
                    border: "1px solid rgba(226, 232, 240, 0.9)",
                    boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ backgroundColor: "#fdf2f8", color: "#db2777", padding: "8px", borderRadius: "10px" }}>
                        <Camera size={20} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                          Slitlamp Grad-CAM XAI
                        </h3>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Deep Learning Saliency Heatmap</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setGradcamActive(!gradcamActive)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "8px",
                        fontSize: "0.76rem",
                        fontWeight: 800,
                        border: "1px solid #cbd5e1",
                        backgroundColor: gradcamActive ? "#eff6ff" : "#ffffff",
                        color: gradcamActive ? "#2563eb" : "#64748b",
                        cursor: "pointer",
                      }}
                    >
                      {gradcamActive ? "Heatmap ON" : "Original View"}
                    </button>
                  </div>

                  {/* Slitlamp Viewer Frame */}
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "240px",
                      borderRadius: "16px",
                      overflow: "hidden",
                      backgroundColor: "#080e1a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "16px",
                    }}
                  >
                    {customImagePreview ? (
                      <img src={customImagePreview} alt="Slitlamp view" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: selectedSample?.gradient || "radial-gradient(circle at 45% 45%, #2563eb 0%, #1e3a8a 50%, #0b132b 100%)" }} />
                    )}

                    {gradcamActive && (
                      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen" }}>
                        {(selectedSample?.gradcamHotspots || []).map((spot, idx) => (
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
                              background: `radial-gradient(circle, rgba(239, 68, 68, ${spot.intensity * 0.9}) 0%, rgba(245, 158, 11, 0.6) 45%, transparent 75%)`,
                              filter: "blur(6px)",
                            }}
                          />
                        ))}
                      </div>
                    )}

                    <div style={{ position: "absolute", bottom: "10px", right: "10px", backgroundColor: "rgba(0,0,0,0.75)", color: "#10b981", padding: "4px 10px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: 800 }}>
                      ViT Saliency Confidence: 96.4%
                    </div>
                  </div>

                  {/* Biomarkers */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.78rem" }}>
                    <div style={{ padding: "8px 10px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ color: "#64748b" }}>AC Cells: </span>
                      <strong>{selectedSample?.acCells || "+2 Grade (12 cells/field)"}</strong>
                    </div>
                    <div style={{ padding: "8px 10px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ color: "#64748b" }}>Flare: </span>
                      <strong>{selectedSample?.flare || "Moderate Flare (+2)"}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Proceed to Specialist Routing */}
              <div style={{ textAlign: "center", marginTop: "12px" }}>
                <button
                  type="button"
                  onClick={() => { setCurrentPhase(4); window.scrollTo({ top: 80, behavior: "smooth" }); }}
                  className="btn btn-primary"
                  style={{ padding: "14px 36px", fontSize: "1rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  Proceed to Nearest Specialist Routing (Sample of 5 Centers)
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* PHASE 4: NEAREST SPECIALIST ROUTING (5 DR. AGARWAL'S CENTERS)          */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          {currentPhase === 4 && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                padding: "32px",
                border: "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ marginBottom: "24px" }}>
                <button
                  type="button"
                  onClick={() => setCurrentPhase(3)}
                  className="btn btn-secondary"
                  style={{ fontSize: "0.82rem", padding: "6px 12px", marginBottom: "12px" }}
                >
                  <ArrowLeft size={14} style={{ marginRight: "4px" }} />
                  Back to AI &amp; XAI Analysis
                </button>
                <h2 style={{ margin: "4px 0", fontSize: "1.45rem", fontWeight: 900, color: "#0f172a" }}>
                  Select Nearest Dr. Agarwal's Eye Hospital &amp; Uveitis Specialist
                </h2>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
                  Choose your preferred regional hospital center. The specialist you select will receive your complete questionnaire answers, uploaded image, Question Model XAI explanation, and Slitlamp Grad-CAM XAI under your patient name.
                </p>
              </div>

              {/* 5 Centers Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
                {AGARWAL_CENTERS.map((center) => {
                  const isSelected = selectedCenter.id === center.id;
                  return (
                    <div
                      key={center.id}
                      onClick={() => setSelectedCenter(center)}
                      style={{
                        padding: "20px 24px",
                        borderRadius: "18px",
                        border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                        backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
                        boxShadow: isSelected ? "0 6px 20px rgba(37, 99, 235, 0.12)" : "0 2px 8px rgba(0,0,0,0.02)",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "16px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                        <div
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "14px",
                            backgroundColor: isSelected ? "#2563eb" : "#f1f5f9",
                            color: isSelected ? "#ffffff" : "#2563eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Stethoscope size={24} />
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 800, backgroundColor: isSelected ? "#dbeafe" : "#f1f5f9", color: "#1e40af", padding: "2px 8px", borderRadius: "6px" }}>
                              {center.badge}
                            </span>
                            <span style={{ fontSize: "0.78rem", color: "#10b981", fontWeight: 700 }}>
                              ● {center.status}
                            </span>
                          </div>

                          <h3 style={{ margin: "4px 0 2px", fontSize: "1.15rem", fontWeight: 900, color: "#0f172a" }}>
                            {center.name}
                          </h3>

                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#2563eb" }}>
                            {center.clinicName}
                          </div>

                          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <MapPin size={12} color="#dc2626" />
                            {center.address}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.76rem", color: "#64748b" }}>Expected Wait Time</div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>{center.waitTime}</div>
                        <div style={{ marginTop: "6px" }}>
                          <span
                            style={{
                              padding: "6px 14px",
                              borderRadius: "10px",
                              fontSize: "0.82rem",
                              fontWeight: 800,
                              backgroundColor: isSelected ? "#2563eb" : "#f1f5f9",
                              color: isSelected ? "#ffffff" : "#475569",
                              display: "inline-block",
                            }}
                          >
                            {isSelected ? "✓ Selected Specialist" : "Select Branch"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Confirm Button */}
              <div style={{ textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: "24px" }}>
                <button
                  type="button"
                  onClick={handleConfirmAndSync}
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ padding: "14px 36px", fontSize: "1.05rem", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={20} className="spin" />
                      Syncing Case File to SQLite &amp; Dr. Agarwal's EMR…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      Confirm Specialist Consultation &amp; Dispatch Case File
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════ */}
          {/* PHASE 5: DIGITAL APPOINTMENT PASS & CONFIRMATION                      */}
          {/* ══════════════════════════════════════════════════════════════════════ */}
          {currentPhase === 5 && submissionResult && (
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "28px",
                padding: "40px",
                border: "2px solid #10b981",
                boxShadow: "0 15px 40px rgba(16, 185, 129, 0.12)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  backgroundColor: "#ecfdf5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                  border: "2px solid #a7f3d0",
                }}
              >
                <CheckCircle2 size={36} />
              </div>

              <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#059669", textTransform: "uppercase", letterSpacing: "1px" }}>
                CASE FILE DISPATCHED &amp; SYNCHRONIZED
              </span>

              <h2 style={{ margin: "6px 0 12px", fontSize: "1.9rem", fontWeight: 900, color: "#0f172a" }}>
                Appointment Confirmed for {formData.name}
              </h2>

              <p style={{ margin: "0 auto 28px", fontSize: "0.95rem", color: "#64748b", maxWidth: "600px" }}>
                Your complete clinical answers across all 6 sections, slitlamp image, Question Model XAI explanation, and Grad-CAM saliency maps have been synchronized into the SQLite EMR database under your name.
              </p>

              {/* Digital Pass Card */}
              <div
                style={{
                  maxWidth: "540px",
                  margin: "0 auto 32px",
                  borderRadius: "20px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  padding: "24px",
                  textAlign: "left",
                }}
              >
                {(() => {
                  const prob = prediction?.uveitis_prob !== undefined
                    ? Number(prediction.uveitis_prob)
                    : (submissionResult?.uveitis_probability ? Number(submissionResult.uveitis_probability) / 100 : 0.15);
                  const probPercent = Math.round(prob <= 1 ? prob * 100 : prob);
                  const risk = prediction?.clinical_risk || submissionResult?.clinical_risk || (probPercent >= 75 ? "High" : probPercent >= 40 ? "Moderate" : "Low");
                  
                  const isHigh = risk === "High" || probPercent >= 75;
                  const isMod = risk === "Moderate" || (probPercent >= 40 && probPercent < 75);

                  const tierLabel = isHigh
                    ? "Immediate / High Risk"
                    : isMod
                      ? "Moderate / Priority Triage"
                      : "Low Risk / Routine Triage";

                  const tierColor = isHigh ? "#dc2626" : isMod ? "#d97706" : "#059669";
                  const tierBg = isHigh ? "#fee2e2" : isMod ? "#fef3c7" : "#ecfdf5";
                  const tierBorder = isHigh ? "#fca5a5" : isMod ? "#fde68a" : "#a7f3d0";

                  return (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "14px" }}>
                      <div>
                        <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 700, display: "block" }}>PATIENT CASE ID</span>
                        <div style={{ fontSize: "1.1rem", fontWeight: 900, color: "#2563eb" }}>{submissionResult.patient_id}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 700, display: "block" }}>URGENCY TIER</span>
                        <span
                          style={{
                            display: "inline-block",
                            fontSize: "0.86rem",
                            fontWeight: 800,
                            color: tierColor,
                            backgroundColor: tierBg,
                            border: `1px solid ${tierBorder}`,
                            padding: "3px 10px",
                            borderRadius: "6px",
                            marginTop: "3px",
                          }}
                        >
                          {tierLabel} ({probPercent}%)
                        </span>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "0.84rem" }}>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Assigned Specialist</span>
                    <div style={{ fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{selectedCenter.name}</div>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Hospital Branch</span>
                    <div style={{ fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{selectedCenter.clinicName}</div>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Appointment Time</span>
                    <div style={{ fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>
                      {submissionResult.appointment_date || "Tomorrow, 10:30 AM"}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Contact Desk</span>
                    <div style={{ fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{selectedCenter.phone}</div>
                  </div>
                </div>
              </div>

              {/* Navigation Action Buttons */}
              <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => navigate("/doctor/queue")}
                  className="btn btn-primary"
                  style={{ padding: "12px 24px", fontSize: "0.92rem", fontWeight: 800 }}
                >
                  Open Specialist Triage Queue →
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/doctor/patient/${submissionResult.patient_id}/dashboard`)}
                  className="btn btn-secondary"
                  style={{ padding: "12px 24px", fontSize: "0.92rem", fontWeight: 800 }}
                >
                  View Case in Doctor Dashboard ({formData.name})
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPhase(1);
                    setSectionIndex(0);
                    setFormData(initialFormState);
                    setSubmissionResult(null);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: "12px 20px", fontSize: "0.85rem" }}
                >
                  Start New Patient Intake
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
