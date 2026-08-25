import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
  HeartPulse,
  Activity,
  Eye,
  Stethoscope,
  ClipboardList,
  UserRound,
  AlertCircle,
  Leaf,
} from "lucide-react";
import "../styles/uveitisQuestionnaire.css";

/* ══════════════════════════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════════════════════════ */

const DRAFT_KEY = "uveitis_questionnaire_v3_draft";

const STEPS = [
  {
    id: "demographics",
    title: "1. Patient Profile & Demographics",
    subtitle: "Tell us about yourself.",
    tip: "Demographic context helps narrow the differential diagnosis—age, sex, and laterality each carry distinct risk profiles.",
    icon: UserRound,
  },
  {
    id: "ocularSymptoms",
    title: "2. Primary Eye Symptoms",
    subtitle: "Rate the severity of your eye symptoms.",
    tip: "Pain, redness, and photophobia scores are the most powerful screening signals for acute anterior uveitis.",
    icon: Eye,
  },
  {
    id: "visualDisturbances",
    title: "3. Visual Disturbances",
    subtitle: "Describe any changes in your vision.",
    tip: "Floaters, scotomata, and metamorphopsia help localize disease to posterior or intermediate segments.",
    icon: Activity,
  },
  {
    id: "ocularHistory",
    title: "4. Eye History & Recurrence",
    subtitle: "Your ocular and recurrence history.",
    tip: "Prior uveitis episodes and ocular procedures significantly alter recurrence probability and treatment urgency.",
    icon: ClipboardList,
  },
  {
    id: "systemicHealth",
    title: "5. Systemic Health & Medications",
    subtitle: "Your general health, infections, and medications.",
    tip: "Up to 50% of uveitis cases have an associated systemic condition—capturing these connections is essential.",
    icon: Stethoscope,
  },
  {
    id: "lifestyleExposure",
    title: "6. Lifestyle & Exposure History",
    subtitle: "Your daily activities and environmental exposures.",
    tip: "Occupational hazards, animal contact, and environmental exposures can be relevant risk factors for certain infectious and inflammatory uveitis types.",
    icon: Leaf,
  },
];

const LIKERT_OPTIONS = [
  { label: "None", value: "None", color: "#10b981" },
  { label: "Mild", value: "Mild", color: "#22d3ee" },
  { label: "Moderate", value: "Moderate", color: "#f59e0b" },
  { label: "Severe", value: "Severe", color: "#f97316" },
  { label: "Very severe", value: "Very severe", color: "#ef4444" },
];

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
   INITIAL UI STATE — clean keys matching the new specification
   ══════════════════════════════════════════════════════════════════════════════ */

const initialFormState = {
  // Step 1 — Demographics & Onset
  age: "",
  sex: "",
  affected_eye: "",
  symptom_duration_days: "",
  onset_type: "",

  // Step 2 — Primary Eye Symptoms
  pain_score: 0,
  redness_score: 0,
  photophobia_impact: 0,
  subjective_visual_disturbance: "",
  // Q6 sub-questions (shown when pain_score > 0)
  pain_location: "",
  pain_nature: [],
  pain_with_movement: "",

  // Step 3 — Visual Disturbances
  floaters: "",
  floater_frequency: "",
  floater_count: "",
  floater_appearance: [],
  scotoma: "",
  visual_distortion: "",
  predominant_visual_problem: "",

  // Step 4 — Eye History
  previous_uveitis: "",
  episode_count: "",
  ocular_history: "",
  ocular_history_types: [],
  contact_lens_use: "",

  // Step 5 — Systemic & Medications
  systemic_inflammatory_disease: "",
  systemic_disease_types: [],
  systemic_disease_other_text: "",
  systemic_disease_duration: "",
  infection_exposure: "",
  infection_types: [],
  cough: "",
  weight_loss: "",
  joint_pain: "",
  immunocompromised: "",
  current_medications: "",
  medication_list: "",
  recent_medication_change: "",

  // Step 6 — Lifestyle & Exposure
  occupation: "",
  pet_contact: "",
  environmental_exposure: "",
  lifestyle_other_exposure: "",
  other_systemic_medications: "",
};

/* ══════════════════════════════════════════════════════════════════════════════
   CLIENT-SIDE FUZZY MATH — preserved exactly from original for fallback
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
  const tbContact = tuberculosis;

  const rednessHigh = rightShoulder(redness, 5, 8);
  const painHigh = rightShoulder(pain, 5, 8);
  const photoHigh = rightShoulder(photophobia, 5, 8);
  const blurHigh = rightShoulder(blurred, 5, 8);

  const floatersH = hedge(floaters, "very");
  const hazyH = hedge(toFuzzy(form.visual_distortion), "very");
  const glareH = hedge(glare, "somewhat");
  const peripheralH = hedge(peripheral, "very");

  const inflammation = (rednessHigh * 0.35 + painHigh * 0.35 + photoHigh * 0.30) * 100;
  // Visual Dysfunction — weights match backend visual_impairment_index
  const visual = (blurHigh * 0.30 + floatersH * 0.20 + hazyH * 0.15 + glareH * 0.20 + peripheralH * 0.15) * 100;
  const autoimmuneRisk = autoimmune * 100;
  const infectiousRisk = Math.max(tuberculosis, syphilis, hiv, recentInfection, tbContact) * 100;
  // Recurrence — weights match updated backend recurrence_index
  const episodeHedged = Math.sqrt(episodeCount); // hedge(episode_norm, "somewhat")
  const recurrence = (previousUveitis * 0.45 + 0 * 0.25 + (previousUveitis) * 0.15 + episodeHedged * 0.15) * 100;
  const onsetVal = form.onset_type === "Suddenly" || form.onset_type === "Sudden" ? 1.0 : 0.0;
  const urgency = (painHigh * 0.25 + photoHigh * 0.25 + blurHigh * 0.20 + onsetVal * 0.15 + hedge(toFuzzy(form.floaters), "very") * 0.15) * 100;

  return { inflammation, visual, autoimmune: autoimmuneRisk, infectious: infectiousRisk, recurrence, urgency };
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAYLOAD ADAPTER — transforms new UI state → legacy backend keys
   ══════════════════════════════════════════════════════════════════════════════ */

function buildLegacyPayload(form) {
  const diseases = form.systemic_disease_types || [];
  const infections = form.infection_types || [];
  const isAutoimmune = form.systemic_inflammatory_disease === "Yes";
  const isInfected = form.infection_exposure === "Yes";
  const ocularTypes = form.ocular_history_types || [];

  return {
    // ── Core ML preprocessor keys (backend/utils/preprocessing.py) ──
    redness_score: Number(form.redness_score) || 0,
    pain_score: Number(form.pain_score) || 0,
    photophobia_score: Number(form.photophobia_impact) || 0,
    blurred_vision_score: likertToScore(form.subjective_visual_disturbance),
    floaters: toFuzzy(form.floaters),
    glare_halos: toFuzzy(form.visual_distortion),
    peripheral_vision_loss: toFuzzy(form.scotoma),

    // Autoimmune markers
    autoimmune_disease: toFuzzy(form.systemic_inflammatory_disease),
    rheumatoid_arthritis: isAutoimmune && diseases.includes("Rheumatoid Arthritis") ? 1 : 0,
    ankylosing_spondylitis: isAutoimmune && diseases.includes("Ankylosing Spondylitis / HLA-B27") ? 1 : 0,
    inflammatory_bowel_disease: isAutoimmune && diseases.includes("Inflammatory Bowel Disease (Crohn's / Colitis)") ? 1 : 0,
    psoriasis: isAutoimmune && diseases.includes("Psoriasis / Psoriatic Arthritis") ? 1 : 0,
    sarcoidosis: isAutoimmune && diseases.includes("Sarcoidosis") ? 1 : 0,

    // Infectious markers
    tuberculosis: isInfected && infections.includes("Tuberculosis (TB) exposure or diagnosis") ? 1 : 0,
    tb_contact: isInfected && infections.includes("Tuberculosis (TB) exposure or diagnosis") ? 1 : 0,
    syphilis: isInfected && infections.includes("Bacterial (Syphilis, Lyme, etc.)") ? 1 : 0,
    cold_sores: isInfected && infections.includes("Viral (Herpes Simplex, Zoster/Shingles, CMV)") ? 1 : 0,
    chickenpox: isInfected && infections.includes("Viral (Herpes Simplex, Zoster/Shingles, CMV)") ? 1 : 0,
    recent_infection: toFuzzy(form.infection_exposure),
    hiv_immunocompromised: toFuzzy(form.immunocompromised),
    immunocompromised: toFuzzy(form.immunocompromised),

    // Recurrence markers
    previous_uveitis: form.previous_uveitis === "Yes" ? 1 : 0,
    similar_episode_before: form.previous_uveitis === "Yes" ? 1 : 0,
    episode_count: form.previous_uveitis === "Yes" ? Number(form.episode_count) || 1 : 0,
    family_uveitis: 0,
    family_autoimmune: isAutoimmune ? 0.5 : 0,

    // Ocular history
    eye_trauma: ocularTypes.includes("Trauma / Physical injury") ? 1 : 0,
    eye_surgery: ocularTypes.includes("Eye surgery (Cataract, Glaucoma, Vitrectomy)") ? 1 : 0,
    prior_treatment: ocularTypes.includes("Previous eye disease or condition") ? 1 : 0,
    contact_lens: form.contact_lens_use === "Yes" ? 1 : 0,
    steroid_eye_drop_use: form.current_medications === "Yes" ? 0.5 : 0,

    // Systemic symptoms
    cough: toFuzzy(form.cough),
    weight_loss: toFuzzy(form.weight_loss),
    joint_pain: toFuzzy(form.joint_pain),
    fever: 0,
    skin_rash: 0,
    oral_ulcers: 0,

    // Demographics & triage
    age: Number(form.age) || 0,
    sex: form.sex === "Male" ? "M" : form.sex === "Female" ? "F" : "Unknown",
    affected_eye: form.affected_eye || "Left",
    onset_type: form.onset_type === "Suddenly" ? "Sudden" : form.onset_type === "Gradually" ? "Gradual" : "Sudden",
    symptom_start_days: Number(form.symptom_duration_days) || 0,

    // Legacy orphaned keys — hardcoded safe defaults so nothing breaks
    tearing: 0,
    discharge: 0,
    swelling: 0,
    headache: 0,
    bright_light_worsening: 0,
    hazy_vision: toFuzzy(form.visual_distortion),
    animal_exposure: 0,
    unsafe_food_water: 0,
    recent_travel: 0,
    current_medications: form.medication_list || "",
    steroid_tablets: 0,
    steroid_injections: 0,
    steroid_inhalers: 0,
    immunosuppressants: toFuzzy(form.immunocompromised),
    new_medication: form.recent_medication_change === "Yes" ? 1 : 0,
    smoker: 0,
    allergies: "",
    pregnant: 0,
    recent_hospitalization: 0,

    meta: {
      source: "uveitis-questionnaire-v3",
      predominant_visual_problem: form.predominant_visual_problem || "",
      systemic_disease_types: form.systemic_disease_types || [],
      infection_types: form.infection_types || [],
      ocular_history_types: form.ocular_history_types || [],
      // Q6 pain details
      pain_location: form.pain_location || "",
      pain_nature: form.pain_nature || [],
      pain_with_movement: form.pain_with_movement || "",
      // Q10 floater details
      floater_frequency: form.floater_frequency || "",
      floater_count: form.floater_count || "",
      floater_appearance: form.floater_appearance || [],
      // Systemic duration
      systemic_disease_duration: form.systemic_disease_duration || "",
      // Lifestyle & exposure
      occupation: form.occupation || "",
      pet_contact: form.pet_contact || "",
      environmental_exposure: form.environmental_exposure || "",
      lifestyle_other_exposure: form.lifestyle_other_exposure || "",
      other_systemic_medications: form.other_systemic_medications || "",
      submittedAt: new Date().toISOString(),
    },
  };
}

/* ══════════════════════════════════════════════════════════════════════════════
   VALIDATION
   ══════════════════════════════════════════════════════════════════════════════ */

function validateForm(form) {
  const errors = [];
  if (!form.age || isNaN(form.age) || Number(form.age) < 0 || Number(form.age) > 130)
    errors.push("Please enter a valid age (0-130).");
  if (!form.sex) errors.push("Please select your biological sex.");
  if (!form.affected_eye) errors.push("Please select which eye is affected.");
  if (form.symptom_duration_days === "" || isNaN(form.symptom_duration_days) || Number(form.symptom_duration_days) < 0)
    errors.push("Please enter a valid symptom duration in days.");
  if (!form.onset_type) errors.push("Please select whether symptoms began suddenly or gradually.");
  return errors;
}

/* ══════════════════════════════════════════════════════════════════════════════
   HELPER UTILITIES
   ══════════════════════════════════════════════════════════════════════════════ */

function getSavedDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return initialFormState;
    return { ...initialFormState, ...JSON.parse(raw) };
  } catch {
    return initialFormState;
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   REUSABLE SUB-COMPONENTS
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

function ChipSelector({ label, options, selected, onChange, hint }) {
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
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */

export default function UveitisQuestionnaire() {
  const [formData, setFormData] = useState(initialFormState);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState({ status: "idle", message: "" });
  const [predictionResult, setPredictionResult] = useState(null);

  // ── Draft hydration & auto-save ──
  useEffect(() => {
    setFormData(getSavedDraft());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData, hydrated]);

  // ── Derived ──
  const progress = useMemo(() => Math.round(((stepIndex + 1) / STEPS.length) * 100), [stepIndex]);
  const liveIndices = useMemo(() => getLiveFuzzyIndices(formData), [formData]);
  const activeIndices = useMemo(() => {
    if (predictionResult?.fuzzy_indices) {
      return {
        inflammation: (predictionResult.fuzzy_indices.inflammation || 0) * 100,
        visual: (predictionResult.fuzzy_indices.visual || 0) * 100,
        autoimmune: (predictionResult.fuzzy_indices.autoimmune || 0) * 100,
        infectious: (predictionResult.fuzzy_indices.infectious || 0) * 100,
        recurrence: (predictionResult.fuzzy_indices.recurrence || 0) * 100,
        urgency: (predictionResult.fuzzy_indices.urgency || 0) * 100,
      };
    }
    return liveIndices;
  }, [liveIndices, predictionResult]);

  const currentStep = STEPS[stepIndex];

  // ── Field updater ──
  const updateField = (key, value) => setFormData((prev) => ({ ...prev, [key]: value }));

  // ── Navigation ──
  const nextStep = () => { setDirection(1); setStepIndex((i) => Math.min(STEPS.length - 1, i + 1)); };
  const prevStep = () => { setDirection(-1); setStepIndex((i) => Math.max(0, i - 1)); };

  const resetDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData(initialFormState);
    setStepIndex(0);
    setDirection(1);
    setSubmitState({ status: "idle", message: "" });
    setPredictionResult(null);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitState({ status: "idle", message: "" });
    setPredictionResult(null);

    const errors = validateForm(formData);
    if (errors.length > 0) {
      setSubmitState({ status: "error", message: errors.join(" ") });
      setIsSubmitting(false);
      return;
    }

    const payload = buildLegacyPayload(formData);

    try {
      const res = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Server returned status ${res.status}`);
      const result = await res.json();
      setPredictionResult(result);
      setSubmitState({ status: "success", message: "Patient intake processed. Adaptive Neuro-Fuzzy analytics loaded." });
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.warn("Prediction endpoint call failed, using client rule assessment fallback:", error);
      const probDecimal = Math.max(0.0, Math.min(1.0, liveIndices.urgency / 100.0));
      const forceReferral = liveIndices.urgency >= 70 || (liveIndices.inflammation >= 70 && liveIndices.visual >= 70);
      const uveitisYesNo = probDecimal >= 0.5 || forceReferral ? 1 : 0;
      const calculatedSeverity = 0.35 * liveIndices.inflammation + 0.30 * liveIndices.visual + 0.20 * liveIndices.urgency + 0.10 * liveIndices.recurrence + 0.05 * liveIndices.autoimmune;

      setPredictionResult({
        uveitis_probability: probDecimal,
        uveitis_yes_no: uveitisYesNo,
        severity_score: calculatedSeverity,
        severity_class: calculatedSeverity >= 65 ? "Severe" : calculatedSeverity >= 35 ? "Moderate" : "Mild",
        clinical_risk: uveitisYesNo === 1 ? "High" : probDecimal >= 0.35 || calculatedSeverity >= 35 ? "Moderate" : "Low",
        fuzzy_indices: {
          inflammation: liveIndices.inflammation / 100,
          visual: liveIndices.visual / 100,
          autoimmune: liveIndices.autoimmune / 100,
          infectious: liveIndices.infectious / 100,
          recurrence: liveIndices.recurrence / 100,
          urgency: liveIndices.urgency / 100,
        },
        explanation: [
          forceReferral
            ? "Clinical Safety Alert: High urgency or visual impairment flags suggest immediate ophthalmic assessment is required."
            : "Standard screening criteria processed.",
          liveIndices.urgency > 65 ? "High urgency detected from primary ocular indicators." : "Standard symptoms reported.",
          liveIndices.inflammation > 50 ? "Significant localized clinical inflammation scores." : "Mild inflammatory values.",
          formData.previous_uveitis === "Yes" ? "Ocular history indicates recurrence risk profiles." : "First-time clinical screening profile.",
        ],
      });
      setSubmitState({ status: "success", message: "Intake complete. (Displaying local simulation fallback prediction)" });
      localStorage.removeItem(DRAFT_KEY);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ════════════════════════════════════════════════════════════════════════════
     STEP RENDERERS
     ════════════════════════════════════════════════════════════════════════════ */

  const renderStep0 = () => (
    <div className="uf-grid" style={{ gap: 24 }}>
      {/* Q1: Age */}
      <div className="uf-grid uf-grid-2">
        <div className="uf-field-group">
          <label className="uf-field-label">What is your age? *</label>
          <input
            className="uf-input"
            type="number"
            placeholder="e.g. 42"
            min="0"
            max="130"
            value={formData.age}
            onChange={(e) => updateField("age", e.target.value)}
          />
        </div>

        {/* Q2: Sex */}
        <div className="uf-field-group">
          <label className="uf-field-label">What is your biological sex? *</label>
          <select className="uf-select" value={formData.sex} onChange={(e) => updateField("sex", e.target.value)}>
            <option value="" disabled>Select…</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Q3: Affected eye */}
      <div className="uf-grid uf-grid-2">
        <div className="uf-field-group">
          <label className="uf-field-label">Which eye is affected? *</label>
          <select className="uf-select" value={formData.affected_eye} onChange={(e) => updateField("affected_eye", e.target.value)}>
            <option value="" disabled>Select…</option>
            <option value="Left">Left Eye</option>
            <option value="Right">Right Eye</option>
            <option value="Both">Both Eyes</option>
          </select>
        </div>

        {/* Q4: Duration */}
        <div className="uf-field-group">
          <label className="uf-field-label">How long have you had these eye symptoms? (days) *</label>
          <input
            className="uf-input"
            type="number"
            placeholder="e.g. 3"
            min="0"
            value={formData.symptom_duration_days}
            onChange={(e) => updateField("symptom_duration_days", e.target.value)}
          />
        </div>
      </div>

      {/* Q5: Onset type */}
      <div className="uf-field-group">
        <label className="uf-field-label">Did the symptoms begin suddenly or gradually? *</label>
        <select className="uf-select" value={formData.onset_type} onChange={(e) => updateField("onset_type", e.target.value)}>
          <option value="" disabled>Select…</option>
          <option value="Suddenly">Suddenly (over a few hours/days)</option>
          <option value="Gradually">Gradually (over weeks)</option>
          <option value="Not sure">Not sure</option>
        </select>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="uf-grid" style={{ gap: 24 }}>
      {/* Q6: Pain severity */}
      <ScoreSlider
        label="How severe is your eye pain?"
        hint="Rate from no pain (0) to the worst pain imaginable (10)."
        fieldKey="pain_score"
        value={formData.pain_score}
        onChange={updateField}
      />
      {/* Q6 sub-questions — visible when pain > 0 */}
      <ConditionalBlock show={Number(formData.pain_score) > 0}>
        <div className="uf-pill-container">
          <RadioCardSelector
            label="Where is the pain located?"
            options={["Around the eye / globe", "Inside the eye", "Associated with headache"]}
            value={formData.pain_location}
            onChange={(val) => updateField("pain_location", val)}
          />
          <ChipSelector
            label="How would you describe the nature of the pain? (select all that apply)"
            options={["Mild", "Moderate", "Severe", "Pricking / Sharp", "Throbbing"]}
            selected={formData.pain_nature}
            onChange={(val) => updateField("pain_nature", val)}
          />
          <BinaryToggle
            label="Is the pain made worse by moving your eye?"
            value={formData.pain_with_movement}
            onChange={(val) => updateField("pain_with_movement", val)}
          />
        </div>
      </ConditionalBlock>
      {/* Q7: Redness */}
      <ScoreSlider
        label="How noticeable is the redness of your eye?"
        hint="Rate from no redness (0) to extremely red/bloodshot (10)."
        fieldKey="redness_score"
        value={formData.redness_score}
        onChange={updateField}
      />
      {/* Q8: Photophobia */}
      <ScoreSlider
        label="How much does light bother your affected eye(s)?"
        hint="Rate from not at all (0) to unbearable sensitivity (10)."
        fieldKey="photophobia_impact"
        value={formData.photophobia_impact}
        onChange={updateField}
      />
      {/* Q9: Subjective Visual Disturbance */}
      <LikertSelector
        label="How much has your vision become blurred or reduced?"
        hint="Select the option that best describes your current experience."
        value={formData.subjective_visual_disturbance}
        onChange={(val) => updateField("subjective_visual_disturbance", val)}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="uf-grid" style={{ gap: 16 }}>
      <div className="uf-pill-container">
        {/* Q10: Floaters */}
        <TriStateToggle
          label="Do you see new floaters, moving spots, or cobweb-like shapes?"
          value={formData.floaters}
          onChange={(val) => {
            updateField("floaters", val);
            if (val !== "Yes") {
              updateField("floater_frequency", "");
              updateField("floater_count", "");
              updateField("floater_appearance", []);
            }
          }}
        />
        {/* Q10 sub-questions — visible when floaters = Yes */}
        <ConditionalBlock show={formData.floaters === "Yes"}>
          <div style={{ display: "grid", gap: 12, paddingTop: 4 }}>
            <RadioCardSelector
              label="How often do you notice the floaters?"
              options={["Always", "Frequently", "Occasionally", "Rarely"]}
              value={formData.floater_frequency}
              onChange={(val) => updateField("floater_frequency", val)}
            />
            <RadioCardSelector
              label="How many floaters do you see?"
              options={["Single floater", "Multiple floaters", "Not sure"]}
              value={formData.floater_count}
              onChange={(val) => updateField("floater_count", val)}
            />
            <ChipSelector
              label="What is the appearance of the floater(s)? (select all that apply)"
              options={["Black / Dark", "Grey", "Coloured", "Thread-like / Cobweb", "Ring-shaped", "Other"]}
              selected={formData.floater_appearance}
              onChange={(val) => updateField("floater_appearance", val)}
            />
          </div>
        </ConditionalBlock>
        {/* Q11: Scotoma */}
        <TriStateToggle
          label="Do you notice a dark spot or an area missing from your vision?"
          value={formData.scotoma}
          onChange={(val) => updateField("scotoma", val)}
        />
        {/* Q12: Visual distortion */}
        <TriStateToggle
          label="Do straight lines or objects appear bent, wavy, or distorted?"
          value={formData.visual_distortion}
          onChange={(val) => updateField("visual_distortion", val)}
        />
      </div>
      {/* Q13: Vision description */}
      <RadioCardSelector
        label="How would you describe your vision?"
        hint="Select the option that best describes your current visual experience."
        options={VISUAL_PROBLEM_OPTIONS}
        value={formData.predominant_visual_problem}
        onChange={(val) => updateField("predominant_visual_problem", val)}
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="uf-grid" style={{ gap: 16 }}>
      <div className="uf-pill-container">
        {/* Q14: Previous uveitis (combined with episode count cue) */}
        <BinaryToggle
          label="Have you had uveitis before? If yes, how many episodes have you experienced?"
          value={formData.previous_uveitis}
          onChange={(val) => {
            updateField("previous_uveitis", val);
            if (val === "No") updateField("episode_count", "");
            if (val === "Yes" && (!formData.episode_count || formData.episode_count === "")) updateField("episode_count", "1");
          }}
        />
        <ConditionalBlock show={formData.previous_uveitis === "Yes"}>
          <div className="uf-field-group">
            <label className="uf-field-label">How many episodes in total?</label>
            <input
              className="uf-input"
              type="number"
              placeholder="e.g. 2"
              min="1"
              value={formData.episode_count}
              onChange={(e) => updateField("episode_count", e.target.value)}
            />
          </div>
        </ConditionalBlock>

        {/* Q20: Ocular history */}
        <TriStateToggle
          label="Have you had an eye injury, eye surgery, or another significant eye condition?"
          value={formData.ocular_history}
          onChange={(val) => {
            updateField("ocular_history", val);
            if (val !== "Yes") updateField("ocular_history_types", []);
          }}
        />
        <ConditionalBlock show={formData.ocular_history === "Yes"}>
          <ChipSelector
            label="What was the eye history? (select all that apply)"
            options={OCULAR_HISTORY_OPTIONS}
            selected={formData.ocular_history_types}
            onChange={(val) => updateField("ocular_history_types", val)}
          />
        </ConditionalBlock>

        {/* Contact lens usage */}
        <BinaryToggle
          label="Do you currently wear or have you previously worn contact lenses?"
          hint="Contact lens use can be a relevant ocular risk factor."
          value={formData.contact_lens_use}
          onChange={(val) => updateField("contact_lens_use", val)}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="uf-grid" style={{ gap: 16 }}>
      <div className="uf-pill-container">
        {/* Q15: Systemic inflammatory disease */}
        <TriStateToggle
          label="Have you been diagnosed with an autoimmune, rheumatic, inflammatory, or systemic disease?"
          value={formData.systemic_inflammatory_disease}
          onChange={(val) => {
            updateField("systemic_inflammatory_disease", val);
            if (val !== "Yes") {
              updateField("systemic_disease_types", []);
              updateField("systemic_disease_other_text", "");
              updateField("systemic_disease_duration", "");
            }
          }}
        />
        <ConditionalBlock show={formData.systemic_inflammatory_disease === "Yes"}>
          <ChipSelector
            label="Which condition(s) were you diagnosed with? (select all that apply)"
            options={SYSTEMIC_DISEASE_OPTIONS}
            selected={formData.systemic_disease_types}
            onChange={(val) => updateField("systemic_disease_types", val)}
          />
          <ConditionalBlock show={formData.systemic_disease_types.includes("Other")}>
            <div className="uf-field-group" style={{ marginTop: 12 }}>
              <label className="uf-field-label">Please specify:</label>
              <input
                className="uf-input"
                type="text"
                placeholder="e.g. Vogt-Koyanagi-Harada"
                value={formData.systemic_disease_other_text}
                onChange={(e) => updateField("systemic_disease_other_text", e.target.value)}
              />
            </div>
          </ConditionalBlock>
          {/* Q15 sub: duration of condition */}
          <div className="uf-field-group" style={{ marginTop: 12 }}>
            <label className="uf-field-label">How long have you had this condition?</label>
            <select
              className="uf-select"
              value={formData.systemic_disease_duration}
              onChange={(e) => updateField("systemic_disease_duration", e.target.value)}
            >
              <option value="" disabled>Select…</option>
              <option value="Less than 1 year">Less than 1 year</option>
              <option value="1–5 years">1–5 years</option>
              <option value="5–10 years">5–10 years</option>
              <option value="More than 10 years">More than 10 years</option>
              <option value="Not sure">Not sure</option>
            </select>
          </div>
        </ConditionalBlock>

        {/* Q16: Infection exposure */}
        <TriStateToggle
          label="Have you recently had an infection or fever, or been exposed to TB or another infectious disease?"
          value={formData.infection_exposure}
          onChange={(val) => {
            updateField("infection_exposure", val);
            if (val !== "Yes") updateField("infection_types", []);
          }}
        />
        <ConditionalBlock show={formData.infection_exposure === "Yes"}>
          <ChipSelector
            label="Which infection or exposure applies? (select all that apply)"
            options={INFECTION_TYPE_OPTIONS}
            selected={formData.infection_types}
            onChange={(val) => updateField("infection_types", val)}
          />
        </ConditionalBlock>

        {/* Q17: Cough */}
        <TriStateToggle
          label="Have you had a persistent cough or difficulty breathing?"
          value={formData.cough}
          onChange={(val) => updateField("cough", val)}
        />
        {/* Q18: Weight loss */}
        <TriStateToggle
          label="Have you had unexplained weight loss or loss of appetite?"
          value={formData.weight_loss}
          onChange={(val) => updateField("weight_loss", val)}
        />
        {/* Q19: Joint pain */}
        <TriStateToggle
          label="Have you experienced joint pain, joint swelling, or other inflammatory symptoms?"
          value={formData.joint_pain}
          onChange={(val) => updateField("joint_pain", val)}
        />
        {/* Q21: Immunocompromised */}
        <TriStateToggle
          label="Are you immunocompromised or taking immune-suppressing medicines?"
          value={formData.immunocompromised}
          onChange={(val) => updateField("immunocompromised", val)}
        />
        {/* Q22: Medications */}
        <BinaryToggle
          label="Are you currently taking any medications or eye drops?"
          value={formData.current_medications}
          onChange={(val) => {
            updateField("current_medications", val);
            if (val === "No") {
              updateField("medication_list", "");
              updateField("recent_medication_change", "");
            }
          }}
        />
        <ConditionalBlock show={formData.current_medications === "Yes"}>
          <div className="uf-grid" style={{ gap: 16 }}>
            <div className="uf-field-group">
              <label className="uf-field-label">Please list your current medications or eye drops:</label>
              <input
                className="uf-input"
                type="text"
                placeholder="e.g. Pred Forte, Methotrexate, Ibuprofen"
                value={formData.medication_list}
                onChange={(e) => updateField("medication_list", e.target.value)}
              />
            </div>
            <BinaryToggle
              label="Have you recently started, stopped, or changed any medication?"
              value={formData.recent_medication_change}
              onChange={(val) => updateField("recent_medication_change", val)}
            />
          </div>
        </ConditionalBlock>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════════════════════════════════
     STEP 6 — Lifestyle & Exposure History
     ════════════════════════════════════════════════════════════════════════════ */

  const renderStep5 = () => (
    <div className="uf-grid" style={{ gap: 16 }}>
      <div className="uf-pill-container">
        {/* Occupation */}
        <div className="uf-field-group">
          <label className="uf-field-label">What is your occupation?</label>
          <span className="uf-question-hint">Certain occupations involve exposure to chemicals, dust, UV light, or biological hazards.</span>
          <input
            className="uf-input"
            type="text"
            placeholder="e.g. Farmer, Welder, Teacher, Healthcare worker"
            value={formData.occupation}
            onChange={(e) => updateField("occupation", e.target.value)}
          />
        </div>

        {/* Pet / Animal contact */}
        <TriStateToggle
          label="Do you have regular contact with pets or animals?"
          hint="Includes cats, dogs, birds, reptiles, livestock, or wildlife."
          value={formData.pet_contact}
          onChange={(val) => updateField("pet_contact", val)}
        />

        {/* Environmental exposure */}
        <TriStateToggle
          label="Are you exposed to dust, chemicals, smoke, or other environmental hazards?"
          hint="Includes workplace chemicals, construction dust, agricultural pesticides, or heavy air pollution."
          value={formData.environmental_exposure}
          onChange={(val) => updateField("environmental_exposure", val)}
        />

        {/* Other exposure */}
        <div className="uf-field-group">
          <label className="uf-field-label">Any other relevant exposure or lifestyle factor? (optional)</label>
          <span className="uf-question-hint">e.g. recent foreign travel, outdoor activities, recreational habits.</span>
          <input
            className="uf-input"
            type="text"
            placeholder="Describe any other relevant exposure…"
            value={formData.lifestyle_other_exposure}
            onChange={(e) => updateField("lifestyle_other_exposure", e.target.value)}
          />
        </div>

        {/* Additional systemic / ocular medications */}
        <div className="uf-field-group">
          <label className="uf-field-label">Are you taking any additional drugs, treatments, or medications for other systemic or eye conditions?</label>
          <span className="uf-question-hint">Please list any medications not already mentioned, including over-the-counter drugs or supplements.</span>
          <input
            className="uf-input"
            type="text"
            placeholder="e.g. Methotrexate, Latanoprost, Vitamin D, Omega-3…"
            value={formData.other_systemic_medications}
            onChange={(e) => updateField("other_systemic_medications", e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const stepRenderers = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

  /* ════════════════════════════════════════════════════════════════════════════
     ANALYTICS SIDEBAR (rendered post-submission)
     ════════════════════════════════════════════════════════════════════════════ */

  const renderAnalytics = () => {
    const bars = [
      { label: "Ocular Inflammation", key: "inflammation", color: "#3b82f6" },
      { label: "Visual Dysfunction", key: "visual", color: "#06b6d4" },
      { label: "Autoimmune Markers", key: "autoimmune", color: "#8b5cf6" },
      { label: "Pathogen / Infectious", key: "infectious", color: "#f59e0b" },
      { label: "Recurrence Risk", key: "recurrence", color: "#ec4899" },
      { label: "Referral Urgency", key: "urgency", color: "#ef4444" },
    ];
    return (
      <div className="uf-sidebar-analytics">
        <div className="uf-analytics-card card">
          <h3>
            <Activity size={18} style={{ color: "#2563eb", marginRight: 8, verticalAlign: "middle" }} />
            Clinical Decision Support
          </h3>
          <p className="uf-analytics-subtitle">Adaptive Neuro-Fuzzy Output</p>
          <div className="uf-analytics-bars">
            {bars.map((b) => (
              <div key={b.key} className="uf-analytics-bar-item">
                <div className="uf-bar-meta">
                  <span>{b.label}</span>
                  <span>{activeIndices[b.key].toFixed(0)}%</span>
                </div>
                <div className="uf-bar-track">
                  <div className="uf-bar-fill" style={{ width: `${activeIndices[b.key]}%`, backgroundColor: b.color }} />
                </div>
              </div>
            ))}
          </div>
          {predictionResult?.explanation && (
            <div className="uf-analytics-explanations">
              <h4>Clinical Explanations</h4>
              <ul>
                {predictionResult.explanation.map((exp, idx) => (
                  <li key={idx}>{exp}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ════════════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════════════ */

  const StepIcon = currentStep.icon;

  return (
    <div className="uf-page">
      <div className="uf-bg-orb uf-orb-a" />
      <div className="uf-bg-orb uf-orb-b" />
      <div className="uf-shell">
        {/* ── Top Nav ── */}
        <div className="uf-top-nav">
          <Link to="/" className="uf-back-home">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <button type="button" className="uf-save" onClick={resetDraft}>
            <Save size={15} />
            Reset Questionnaire
          </button>
        </div>

        {/* ── Header Card ── */}
        <div className="uf-topbar card">
          <div className="uf-topbar-row">
            <div>
              <div className="uf-kicker">
                <Sparkles size={14} />
                Intelligent Intake Portal
              </div>
              <h1 className="uf-title">Screening &amp; Clinical Triage</h1>
            </div>
            <div className="uf-trust-chip">
              <ShieldCheck size={16} />
              Secured Screening Form
            </div>
          </div>
          <div className="uf-progress">
            <div className="uf-progress-meta">
              <span>Section {stepIndex + 1} of {STEPS.length} — {currentStep.title}</span>
              <span>{progress}% Completed</span>
            </div>
            <div className="uf-progress-track" aria-hidden="true">
              <motion.div
                className="uf-progress-fill"
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* ── Clinical Welcome ── */}
        <div className="uf-clinical-welcome">
          <div className="uf-clinical-welcome-icon">
            <HeartPulse size={24} />
          </div>
          <div>
            <p>
              <strong>Phase 1 — Screening &amp; Symptom Assessment.</strong> This questionnaire collects patient history, symptoms, systemic health, medication history, and relevant risk factors. It may help identify or raise suspicion of possible inflammatory conditions, but it is <strong>not intended to diagnose or classify the type of uveitis</strong>. Your answers are autosaved securely in your browser.
            </p>
          </div>
        </div>

        {/* ── Main Layout ── */}
        <div className={`uf-questionnaire-layout ${predictionResult ? "has-results" : "form-mode"}`}>
          <div className="uf-main-column">
            <AnimatePresence mode="wait" initial={false}>
              <motion.section
                key={currentStep.id}
                className="uf-card card"
                initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="uf-card-head">
                  <div>
                    <p className="uf-step-label">
                      <StepIcon size={13} style={{ marginRight: 6, verticalAlign: "-2px" }} />
                      Step {stepIndex + 1} of {STEPS.length}
                    </p>
                    <h2 className="uf-step-title">{currentStep.subtitle}</h2>
                  </div>
                </div>

                {currentStep.tip && (
                  <div className="uf-clinical-reasoning-tip">
                    <AlertCircle size={14} style={{ marginRight: 6, verticalAlign: "-2px", color: "#2563eb" }} />
                    <strong>Clinician's Note: </strong>{currentStep.tip}
                  </div>
                )}

                <div className="uf-card-body">
                  {stepRenderers[stepIndex]()}
                </div>

                {/* ── Actions Footer ── */}
                <div className="uf-actions">
                  {predictionResult ? (
                    <button type="button" className="uf-btn uf-btn-primary" onClick={resetDraft}>
                      Start New Intake
                    </button>
                  ) : (
                    <>
                      <button type="button" className="uf-btn uf-btn-ghost" onClick={prevStep} disabled={stepIndex === 0}>
                        <ChevronLeft size={18} />
                        Back
                      </button>
                      <div className="uf-actions-right">
                        {submitState.status === "success" && (
                          <div className="uf-status success">
                            <Check size={16} />
                            {submitState.message}
                          </div>
                        )}
                        {submitState.status === "error" && <div className="uf-status error">{submitState.message}</div>}
                        {stepIndex < STEPS.length - 1 ? (
                          <button type="button" className="uf-btn uf-btn-primary" onClick={nextStep}>
                            Next Section
                            <ChevronRight size={18} />
                          </button>
                        ) : (
                          <button type="button" className="uf-btn uf-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 size={18} className="spin" />
                                Submitting Intake…
                              </>
                            ) : (
                              <>
                                Submit Clinical Intake
                                <ArrowRight size={18} />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.section>
            </AnimatePresence>
          </div>

          {/* ── Analytics Sidebar ── */}
          {predictionResult && renderAnalytics()}
        </div>
      </div>
    </div>
  );
}
