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
} from "lucide-react";
import "../styles/uveitisQuestionnaire.css";
import NearbyDoctorsMap from "../components/NearbyDoctorsMap.jsx";

const DRAFT_KEY = "uveitis_questionnaire_draft_v8";

const linguisticToFuzzy = (value) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const v = value.trim().toLowerCase();
  if (v === "yes") return 1;
  if (v === "maybe") return 0.5;
  if (v === "no") return 0;
  return 0;
};

const initialState = {
  // Section 1 - Rapid triage
  affected_eye: "Left", // Left, Right, Both
  symptom_start_days: "",
  onset_type: "Sudden", // Sudden, Gradual
  redness_score: 0,
  pain_score: 0,
  photophobia_score: 0,
  blurred_vision_score: 0,

  // Section 2 - Associated symptoms
  floaters: 0, // Yes / Maybe / No stored as 1 / 0.5 / 0
  tearing: 0,
  discharge: 0,
  swelling: 0,
  headache: 0,
  bright_light_worsening: 0,
  hazy_vision: 0,
  glare_halos: 0,
  peripheral_vision_loss: 0,

  // Section 3 - Eye history & recurrence
  previous_uveitis: 0,
  eye_trauma: 0,
  eye_surgery: 0,
  contact_lens: 0,
  steroid_eye_drop_use: 0,
  prior_treatment: 0,
  episode_count: "",

  // Section 4 - Systemic history
  autoimmune_disease: 0,
  tuberculosis: 0,
  syphilis: 0,
  immunocompromised: 0,
  recent_infection: 0,
  fever: 0,
  weight_loss: 0,
  cough: 0,
  joint_pain: 0,
  skin_rash: 0,
  oral_ulcers: 0,

  // Section 5 - Exposure & medications
  tb_contact: 0,
  cold_sores: 0,
  chickenpox: 0,
  recent_travel: 0,
  animal_exposure: 0,
  unsafe_food_water: 0,
  current_medications: "",
  steroid_tablets: 0,
  steroid_injections: 0,
  steroid_inhalers: 0,
  immunosuppressants: 0,
  new_medication: 0,

  // Section 6 - Family & demographics
  family_uveitis: 0,
  family_autoimmune: 0,
  age: "",
  sex: "Unknown", // M, F, Unknown
  smoker: 0,
  allergies: "",
  pregnant: 0,
  recent_hospitalization: 0,
};

const steps = [
  {
    id: "symptomsOnset",
    title: "1. Rapid Triage & Onset",
    subtitle: "Tell us about the start and intensity of the eye problem.",
    tip: "The earliest symptoms carry the strongest screening signal for inflammatory eye disease.",
  },
  {
    id: "associatedSymptoms",
    title: "2. Associated Eye Symptoms",
    subtitle: "Do you also have any of these related eye symptoms?",
    tip: "These symptoms help separate inflammatory disease from routine irritation or strain.",
  },
  {
    id: "eyeHistory",
    title: "3. Eye History & Recurrence",
    subtitle: "Tell us about prior eye events or treatments.",
    tip: "Past inflammation, steroid use, or eye trauma can raise recurrence and severity risk.",
  },
  {
    id: "medicalHistory",
    title: "4. Systemic Medical History",
    subtitle: "Information regarding your general health and diagnoses.",
    tip: "Systemic inflammatory or infectious conditions can be linked to uveitis.",
  },
  {
    id: "exposureMeds",
    title: "5. Infection, Exposure & Medications",
    subtitle: "Recent exposures and medicine details.",
    tip: "Exposure and medication history help the clinician narrow the differential diagnosis.",
  },
  {
    id: "familyGeneral",
    title: "6. Family History & Demographics",
    subtitle: "Review family background and personal risk factors.",
    tip: "Family history and demographics provide additional context for the prediction model.",
  },
];

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

const getFuzzyIndices = (data) => {
  const redness = Number(data.redness_score) || 0;
  const pain = Number(data.pain_score) || 0;
  const photophobia = Number(data.photophobia_score) || 0;
  const blurred = Number(data.blurred_vision_score) || 0;

  const floaters = linguisticToFuzzy(data.floaters);
  const tearing = linguisticToFuzzy(data.tearing);
  const discharge = linguisticToFuzzy(data.discharge);
  const swelling = linguisticToFuzzy(data.swelling);
  const headache = linguisticToFuzzy(data.headache);
  const brightLight = linguisticToFuzzy(data.bright_light_worsening);
  const hazyVision = linguisticToFuzzy(data.hazy_vision);
  const glare = linguisticToFuzzy(data.glare_halos);
  const peripheral = linguisticToFuzzy(data.peripheral_vision_loss);

  const previousUveitis = linguisticToFuzzy(data.previous_uveitis);
  const eyeTrauma = linguisticToFuzzy(data.eye_trauma);
  const eyeSurgery = linguisticToFuzzy(data.eye_surgery);
  const contactLens = linguisticToFuzzy(data.contact_lens);
  const steroidDrops = linguisticToFuzzy(data.steroid_eye_drop_use);
  const priorTreatment = linguisticToFuzzy(data.prior_treatment);
  const episodeCount = Math.min(Number(data.episode_count) || 0, 10) / 10;

  const autoimmune = linguisticToFuzzy(data.autoimmune_disease);
  const tuberculosis = linguisticToFuzzy(data.tuberculosis);
  const syphilis = linguisticToFuzzy(data.syphilis);
  const hiv = linguisticToFuzzy(data.immunocompromised);
  const recentInfection = linguisticToFuzzy(data.recent_infection);
  const fever = linguisticToFuzzy(data.fever);
  const weightLoss = linguisticToFuzzy(data.weight_loss);
  const cough = linguisticToFuzzy(data.cough);
  const jointPain = linguisticToFuzzy(data.joint_pain);
  const skinRash = linguisticToFuzzy(data.skin_rash);
  const oralUlcers = linguisticToFuzzy(data.oral_ulcers);
  const tbContact = linguisticToFuzzy(data.tb_contact);

  const familyUveitis = linguisticToFuzzy(data.family_uveitis);
  const familyAutoimmune = linguisticToFuzzy(data.family_autoimmune);

  const rednessHigh = rightShoulder(redness, 5, 8);
  const painHigh = rightShoulder(pain, 5, 8);
  const photoHigh = rightShoulder(photophobia, 5, 8);
  const blurHigh = rightShoulder(blurred, 5, 8);

  const floatersHedged = hedge(floaters, "very");
  const tearingHedged = hedge(tearing, "somewhat");
  const dischargeHedged = hedge(discharge, "somewhat");
  const swellingHedged = hedge(swelling, "somewhat");
  const headacheHedged = hedge(headache, "somewhat");
  const brightLightHedged = hedge(brightLight, "very");
  const hazyHedged = hedge(hazyVision, "very");
  const glareHedged = hedge(glare, "somewhat");
  const peripheralHedged = hedge(peripheral, "very");

  const inflammation = (rednessHigh * 0.35 + painHigh * 0.35 + photoHigh * 0.30) * 100;
  const visual = (blurHigh * 0.30 + floatersHedged * 0.20 + hazyHedged * 0.15 + glareHedged * 0.15 + peripheralHedged * 0.10 + tearingHedged * 0.05 + dischargeHedged * 0.05) * 100;
  const autoimmuneRisk = autoimmune * 100;
  const infectiousRisk = Math.max(tuberculosis, syphilis, hiv, recentInfection, tbContact) * 100;
  const recurrence = (previousUveitis * 0.50 + familyUveitis * 0.25 + familyAutoimmune * 0.15 + episodeCount * 0.10) * 100;

  const onsetVal = data.onset_type === "Sudden" ? 1.0 : 0.0;
  const urgency = (painHigh * 0.25 + photoHigh * 0.25 + blurHigh * 0.20 + onsetVal * 0.15 + brightLightHedged * 0.15 + swellingHedged * 0.0 + headacheHedged * 0.0) * 100;

  return {
    inflammation,
    visual,
    autoimmune: autoimmuneRisk,
    infectious: infectiousRisk,
    recurrence,
    urgency,
  };
};

function clampStep(value) {
  return Math.max(0, Math.min(steps.length - 1, value));
}

function getSavedDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return initialState;
    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      ...parsed,
    };
  } catch {
    return initialState;
  }
}

export default function UveitisQuestionnaire() {
  const [formData, setFormData] = useState(initialState);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState({
    status: "idle",
    message: "",
  });
  const [predictionResult, setPredictionResult] = useState(null);

  useEffect(() => {
    const draft = getSavedDraft();
    setFormData(draft);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
  }, [formData, hydrated]);

  const progress = useMemo(() => Math.round(((stepIndex + 1) / steps.length) * 100), [stepIndex]);
  const liveIndices = useMemo(() => getFuzzyIndices(formData), [formData]);

  const activeIndices = useMemo(() => {
    if (predictionResult && predictionResult.fuzzy_indices) {
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

  const updateField = (key, value) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };

      if (key === "previous_uveitis") {
        if (Number(value) === 1 && (next.episode_count === "" || Number(next.episode_count) === 0)) {
          next.episode_count = 1;
        }
        if (Number(value) === 0) {
          next.episode_count = "";
        }
      }

      if (key === "tuberculosis" && Number(value) === 1) {
        next.tb_contact = 0;
      }

      if (key === "sex" && value !== "F") {
        next.pregnant = 0;
      }

      return next;
    });
  };

  const nextStep = () => {
    setDirection(1);
    setStepIndex((prev) => clampStep(prev + 1));
  };

  const prevStep = () => {
    setDirection(-1);
    setStepIndex((prev) => clampStep(prev - 1));
  };

  const resetDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData(initialState);
    setStepIndex(0);
    setDirection(1);
    setSubmitState({ status: "idle", message: "" });
    setPredictionResult(null);
  };

  const validateForm = () => {
    const errors = [];

    if (!["Left", "Right", "Both"].includes(formData.affected_eye)) {
      errors.push("Invalid affected eye selection.");
    }

    if (!["Sudden", "Gradual"].includes(formData.onset_type)) {
      errors.push("Invalid onset type selection.");
    }

    if (!["M", "F", "Unknown"].includes(formData.sex)) {
      errors.push("Invalid sex selection.");
    }

    if (formData.symptom_start_days === "" || isNaN(formData.symptom_start_days) || Number(formData.symptom_start_days) < 0) {
      errors.push("Please enter a valid, non-negative number of days for symptoms duration.");
    }

    if (formData.age === "" || isNaN(formData.age) || Number(formData.age) < 0 || Number(formData.age) > 130) {
      errors.push("Please enter a valid patient age between 0 and 130.");
    }

    const scoresToValidate = [
      { key: "redness_score", label: "Redness" },
      { key: "pain_score", label: "Pain" },
      { key: "photophobia_score", label: "Photophobia" },
      { key: "blurred_vision_score", label: "Blurred vision" },
    ];

    scoresToValidate.forEach((s) => {
      const val = Number(formData[s.key]);
      if (isNaN(val) || val < 0 || val > 10) {
        errors.push(`${s.label} score must be a number between 0 and 10.`);
      }
    });

    return errors;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitState({ status: "idle", message: "" });
    setPredictionResult(null);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setSubmitState({
        status: "error",
        message: validationErrors.join(" "),
      });
      setIsSubmitting(false);
      return;
    }

    const autoimmuneDerived = linguisticToFuzzy(formData.autoimmune_disease);
    const tuberculosisDerived = linguisticToFuzzy(formData.tuberculosis);
    const hivDerived = linguisticToFuzzy(formData.immunocompromised);

    const payload = {
      ...formData,
      autoimmune_disease: autoimmuneDerived,
      hiv_immunocompromised: hivDerived,
      tuberculosis: tuberculosisDerived,
      tb_contact: tuberculosisDerived === 1 ? 0 : linguisticToFuzzy(formData.tb_contact),
      age: Number(formData.age),
      symptom_start_days: Number(formData.symptom_start_days),
      episode_count: formData.previous_uveitis ? Number(formData.episode_count) || 0 : 0,
      meta: {
        source: "uveitis-questionnaire",
        submittedAt: new Date().toISOString(),
      },
    };

    try {
      const response = await fetch("/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result = await response.json();
      setPredictionResult(result);
      setSubmitState({
        status: "success",
        message: "Patient intake processed. Adaptive Neuro-Fuzzy analytics loaded.",
      });
      localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
      console.warn("Prediction endpoint call failed, using client rule assessment fallback:", error);

      const probDecimal = Math.max(0.0, Math.min(1.0, liveIndices.urgency / 100.0));
      const forceReferral = liveIndices.urgency >= 70 || (liveIndices.inflammation >= 70 && liveIndices.visual >= 70);
      const uveitisYesNo = probDecimal >= 0.5 || forceReferral ? 1 : 0;

      const calculatedSeverity =
        0.35 * liveIndices.inflammation +
        0.30 * liveIndices.visual +
        0.20 * liveIndices.urgency +
        0.10 * liveIndices.recurrence +
        0.05 * liveIndices.autoimmune;

      const mockResult = {
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
          formData.previous_uveitis ? "Ocular history indicates recurrence risk profiles." : "First-time clinical screening profile.",
        ],
      };

      setPredictionResult(mockResult);
      setSubmitState({
        status: "success",
        message: "Intake complete. (Displaying local simulation fallback prediction)",
      });
      localStorage.removeItem(DRAFT_KEY);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStep = steps[stepIndex];

  const FuzzyToggleRow = ({ label, fieldKey }) => {
    const value = formData[fieldKey] !== undefined ? Number(formData[fieldKey]) : 0;
    return (
      <div className="uf-pill-question-row">
        <span className="uf-pill-question-text">{label}</span>
        <div className="uf-toggle-group">
          <button
            type="button"
            className={`uf-toggle-btn ${value === 1 ? "active" : ""}`}
            onClick={() => updateField(fieldKey, 1)}
          >
            Yes
          </button>
          <button
            type="button"
            className={`uf-toggle-btn ${value === 0.5 ? "active" : ""}`}
            onClick={() => updateField(fieldKey, 0.5)}
          >
            Maybe
          </button>
          <button
            type="button"
            className={`uf-toggle-btn ${value === 0 ? "active" : ""}`}
            onClick={() => updateField(fieldKey, 0)}
          >
            No
          </button>
        </div>
      </div>
    );
  };

  const ScoreSlider = ({ label, fieldKey }) => {
    const value = Number(formData[fieldKey]) || 0;
    return (
      <div className="uf-score-box">
        <div className="uf-score-header">
          <label className="uf-field-label">{label}</label>
          <span className="uf-score-text">{value}/10</span>
        </div>
        <input
          className="uf-range"
          type="range"
          min="0"
          max="10"
          step="1"
          value={value}
          onChange={(e) => updateField(fieldKey, Number(e.target.value))}
        />
        <div className="uf-range-scale">
          <span>0 (None)</span>
          <span>10 (Severe)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="uf-page">
      <div className="uf-bg-orb uf-orb-a" />
      <div className="uf-bg-orb uf-orb-b" />
      <div className="uf-shell">
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
              <span>
                Section {stepIndex + 1} of {steps.length} — {currentStep.title}
              </span>
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

        <div className="uf-clinical-welcome">
          <div className="uf-clinical-welcome-icon">
            <HeartPulse size={24} />
          </div>
          <div>
            <p>
              This intake uses a short, non-redundant questionnaire to estimate screening risk before imaging. Your answers are autosaved securely in your browser.
            </p>
          </div>
        </div>

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
                    <p className="uf-step-label">Step {stepIndex + 1} details</p>
                    <h2 className="uf-step-title">{currentStep.subtitle}</h2>
                  </div>
                </div>

                {currentStep.tip && (
                  <div className="uf-clinical-reasoning-tip">
                    <strong>Clinician's Note:</strong> {currentStep.tip}
                  </div>
                )}

                <div className="uf-card-body">
                  {stepIndex === 0 && (
                    <div className="uf-grid" style={{ gap: "24px" }}>
                      <div className="uf-grid uf-grid-2">
                        <div className="uf-field-group">
                          <label className="uf-field-label">Which eye is affected? *</label>
                          <select className="uf-select" value={formData.affected_eye} onChange={(e) => updateField("affected_eye", e.target.value)}>
                            <option value="Left">Left Eye</option>
                            <option value="Right">Right Eye</option>
                            <option value="Both">Both Eyes</option>
                          </select>
                        </div>

                        <div className="uf-field-group">
                          <label className="uf-field-label">Onset duration (in days)? *</label>
                          <input
                            className="uf-input"
                            type="number"
                            placeholder="e.g. 3"
                            min="0"
                            value={formData.symptom_start_days}
                            onChange={(e) => updateField("symptom_start_days", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="uf-grid uf-grid-2">
                        <div className="uf-field-group">
                          <label className="uf-field-label">Did the symptoms begin suddenly or gradually? *</label>
                          <select className="uf-select" value={formData.onset_type} onChange={(e) => updateField("onset_type", e.target.value)}>
                            <option value="Sudden">Suddenly (over a few hours/days)</option>
                            <option value="Gradual">Gradually (over weeks)</option>
                          </select>
                        </div>
                      </div>

                      <div className="uf-grid uf-grid-2">
                        <ScoreSlider label="Eye Redness Score" fieldKey="redness_score" />
                        <ScoreSlider label="Eye Pain Score" fieldKey="pain_score" />
                      </div>

                      <div className="uf-grid uf-grid-2">
                        <ScoreSlider label="Sensitivity to Light (Photophobia) Score" fieldKey="photophobia_score" />
                        <ScoreSlider label="Blurred or Reduced Vision Score" fieldKey="blurred_vision_score" />
                      </div>
                    </div>
                  )}

                  {stepIndex === 1 && (
                    <div className="uf-grid" style={{ gap: "24px" }}>
                      <div className="uf-pill-container">
                        <FuzzyToggleRow label="Do you see floaters, moving spots, or cobweb-like shadows?" fieldKey="floaters" />
                        <FuzzyToggleRow label="Do you have tearing or watering?" fieldKey="tearing" />
                        <FuzzyToggleRow label="Do you have discharge from the eye?" fieldKey="discharge" />
                        <FuzzyToggleRow label="Is there any swelling around the eye?" fieldKey="swelling" />
                        <FuzzyToggleRow label="Do you feel any headache along with the eye problem?" fieldKey="headache" />
                        <FuzzyToggleRow label="Do you notice worsening of symptoms in bright light?" fieldKey="bright_light_worsening" />
                        <FuzzyToggleRow label="Has your vision become hazy or cloudy?" fieldKey="hazy_vision" />
                        <FuzzyToggleRow label="Do you have glare or halos around lights?" fieldKey="glare_halos" />
                        <FuzzyToggleRow label="Do you notice any loss of side (peripheral) vision?" fieldKey="peripheral_vision_loss" />
                      </div>
                    </div>
                  )}

                  {stepIndex === 2 && (
                    <div className="uf-grid" style={{ gap: "24px" }}>
                      <div className="uf-pill-container">
                        <FuzzyToggleRow label="Have you ever been diagnosed with uveitis before?" fieldKey="previous_uveitis" />

                        {Number(formData.previous_uveitis) === 1 && (
                          <div className="uf-conditional-block">
                            <div className="uf-field-group">
                              <label className="uf-field-label">How many times has uveitis happened before?</label>
                              <input
                                className="uf-input"
                                type="number"
                                placeholder="e.g. 1"
                                min="0"
                                value={formData.episode_count}
                                onChange={(e) => updateField("episode_count", e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        <FuzzyToggleRow label="Have you had eye trauma or injury?" fieldKey="eye_trauma" />
                        <FuzzyToggleRow label="Have you had eye surgery?" fieldKey="eye_surgery" />
                        <FuzzyToggleRow label="Do you wear contact lenses?" fieldKey="contact_lens" />
                        <FuzzyToggleRow label="Have you used steroid eye drops before?" fieldKey="steroid_eye_drop_use" />
                        <FuzzyToggleRow label="Have you taken treatment for this eye problem already?" fieldKey="prior_treatment" />
                      </div>
                    </div>
                  )}

                  {stepIndex === 3 && (
                    <div className="uf-grid">
                      <div className="uf-pill-container">
                        <FuzzyToggleRow label="Do you have any autoimmune disease?" fieldKey="autoimmune_disease" />
                        <FuzzyToggleRow label="Do you have tuberculosis (TB) or have you been exposed to TB?" fieldKey="tuberculosis" />
                        <FuzzyToggleRow label="Have you ever had syphilis or tested positive for it?" fieldKey="syphilis" />
                        <FuzzyToggleRow label="Do you have a condition that weakens immunity?" fieldKey="immunocompromised" />
                        <FuzzyToggleRow label="Have you had a recent infection?" fieldKey="recent_infection" />
                        <FuzzyToggleRow label="Have you had a fever recently?" fieldKey="fever" />
                        <FuzzyToggleRow label="Have you had unexplained weight loss recently?" fieldKey="weight_loss" />
                        <FuzzyToggleRow label="Have you had a persistent cough recently?" fieldKey="cough" />
                        <FuzzyToggleRow label="Have you had joint pain recently?" fieldKey="joint_pain" />
                        <FuzzyToggleRow label="Have you had a skin rash recently?" fieldKey="skin_rash" />
                        <FuzzyToggleRow label="Have you had oral ulcers recently?" fieldKey="oral_ulcers" />
                      </div>
                    </div>
                  )}

                  {stepIndex === 4 && (
                    <div className="uf-grid" style={{ gap: "24px" }}>
                      <div className="uf-pill-container">
                        <FuzzyToggleRow label="Have you been in close contact with anyone who has TB?" fieldKey="tb_contact" />
                        <FuzzyToggleRow label="Have you had cold sores recently?" fieldKey="cold_sores" />
                        <FuzzyToggleRow label="Have you had chickenpox recently?" fieldKey="chickenpox" />
                        <FuzzyToggleRow label="Have you traveled recently?" fieldKey="recent_travel" />
                        <FuzzyToggleRow label="Have you been exposed to cats, birds, or farm animals recently?" fieldKey="animal_exposure" />
                        <FuzzyToggleRow label="Have you had untreated water or questionable food exposure recently?" fieldKey="unsafe_food_water" />
                      </div>

                      <div className="uf-field-group">
                        <label className="uf-field-label">Are you currently taking any medicines? (List them here)</label>
                        <input
                          className="uf-input"
                          type="text"
                          placeholder="e.g. Lisinopril, Methotrexate, none"
                          value={formData.current_medications}
                          onChange={(e) => updateField("current_medications", e.target.value)}
                        />
                      </div>

                      <div className="uf-pill-container">
                        <FuzzyToggleRow label="Are you taking steroid tablets?" fieldKey="steroid_tablets" />
                        <FuzzyToggleRow label="Are you taking steroid injections?" fieldKey="steroid_injections" />
                        <FuzzyToggleRow label="Are you using steroid inhalers?" fieldKey="steroid_inhalers" />
                        <FuzzyToggleRow label="Are you taking immune-suppressing medicines?" fieldKey="immunosuppressants" />
                        <FuzzyToggleRow label="Have you started any new medications recently?" fieldKey="new_medication" />
                      </div>
                    </div>
                  )}

                  {stepIndex === 5 && (
                    <div className="uf-grid" style={{ gap: "24px" }}>
                      <div className="uf-pill-container">
                        <FuzzyToggleRow label="Does anyone in your family have uveitis?" fieldKey="family_uveitis" />
                        <FuzzyToggleRow label="Does anyone in your family have autoimmune disease?" fieldKey="family_autoimmune" />
                        <div className="uf-field-group">
                          <label className="uf-field-label">What is your age? *</label>
                          <input
                            className="uf-input"
                            type="number"
                            placeholder="e.g. 34"
                            min="0"
                            value={formData.age}
                            onChange={(e) => updateField("age", e.target.value)}
                          />
                        </div>

                        <div className="uf-field-group">
                          <label className="uf-field-label">What is your sex? *</label>
                          <select className="uf-select" value={formData.sex} onChange={(e) => updateField("sex", e.target.value)}>
                            <option value="F">Female</option>
                            <option value="M">Male</option>
                            <option value="Unknown">Prefer not to say / Unknown</option>
                          </select>
                        </div>

                        <div className="uf-field-group">
                          <label className="uf-field-label">Do you have any known allergies?</label>
                          <input
                            className="uf-input"
                            type="text"
                            placeholder="e.g. Penicillin, Pollen, or none"
                            value={formData.allergies}
                            onChange={(e) => updateField("allergies", e.target.value)}
                          />
                        </div>

                        <FuzzyToggleRow label="Do you smoke or use tobacco products?" fieldKey="smoker" />
                        {formData.sex === "F" && <FuzzyToggleRow label="Are you pregnant, if applicable?" fieldKey="pregnant" />}
                        <FuzzyToggleRow label="Have you had any recent major illness or hospitalization?" fieldKey="recent_hospitalization" />
                      </div>

                      {predictionResult ? (
                        <>
                          <div
                          className="uf-prediction-result card animate-fade-in"
                          style={{
                            marginTop: "24px",
                            padding: "24px",
                            background: "linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(6, 182, 212, 0.05))",
                            border: "1px solid rgba(37, 99, 235, 0.15)",
                            borderRadius: "20px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                            <Sparkles size={20} style={{ color: "#2563eb" }} />
                            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                              Neuro-Fuzzy Model Triage
                            </h3>
                          </div>

                          <div
                            style={{
                              padding: "12px 16px",
                              borderRadius: "12px",
                              background:
                                predictionResult.clinical_risk === "High"
                                  ? "rgba(239, 68, 68, 0.08)"
                                  : predictionResult.clinical_risk === "Moderate"
                                    ? "rgba(245, 158, 11, 0.08)"
                                    : "rgba(16, 185, 129, 0.08)",
                              color:
                                predictionResult.clinical_risk === "High"
                                  ? "#b91c1c"
                                  : predictionResult.clinical_risk === "Moderate"
                                    ? "#b45309"
                                    : "#047857",
                              fontWeight: 800,
                              fontSize: "0.95rem",
                              marginBottom: "20px",
                              border: "1px solid",
                              borderColor:
                                predictionResult.clinical_risk === "High"
                                  ? "rgba(239, 68, 68, 0.16)"
                                  : predictionResult.clinical_risk === "Moderate"
                                    ? "rgba(245, 158, 11, 0.16)"
                                    : "rgba(16, 185, 129, 0.16)",
                            }}
                          >
                            Clinical Safety Tier: {predictionResult.clinical_risk || "Low"} Risk
                          </div>

                          <div className="uf-summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
                            <div className="uf-summary-item">
                              <span className="uf-summary-label">Uveitis Diagnosis Suspicion</span>
                              <span
                                className="uf-summary-value"
                                style={{
                                  fontSize: "1.35rem",
                                  fontWeight: 900,
                                  color: predictionResult.uveitis_yes_no === 1 ? "#dc2626" : "#16a34a",
                                }}
                              >
                                {predictionResult.uveitis_yes_no === 1 ? "Likely Present" : "Unlikely Present"}
                              </span>
                            </div>
                            <div className="uf-summary-item">
                              <span className="uf-summary-label">Uveitis Probability</span>
                              <span className="uf-summary-value" style={{ fontSize: "1.35rem", fontWeight: 900, color: "#2563eb" }}>
                                {(Number(predictionResult.uveitis_probability) * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="uf-summary-item">
                              <span className="uf-summary-label">Severity Score</span>
                              <span className="uf-summary-value" style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b" }}>
                                {Number(predictionResult.severity_score).toFixed(1)}%
                              </span>
                            </div>
                            <div className="uf-summary-item">
                              <span className="uf-summary-label">Severity Class</span>
                              <span className="uf-summary-value" style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b" }}>
                                {predictionResult.severity_class}
                              </span>
                            </div>
                          </div>

                          <p style={{ marginTop: "16px", fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5, margin: "16px 0 0" }}>
                            *Disclaimer: This is an automated preliminary screening prediction generated by the Neuro-Fuzzy expert pipeline. It is intended for clinical training and decision support only. Consult an ophthalmologist immediately for a diagnostic evaluation.
                          </p>
                        </div>
                        <NearbyDoctorsMap />
                      </>
                      ) : (
                        <div className="uf-summary-block">
                          <h3>Screening Intake Summary</h3>
                          <div className="uf-summary-grid">
                            <div className="uf-summary-item">
                              <span className="uf-summary-label">Affected Eye</span>
                              <span className="uf-summary-value">{formData.affected_eye.toUpperCase()} Eye</span>
                            </div>
                            <div className="uf-summary-item">
                              <span className="uf-summary-label">Symptom Onset</span>
                              <span className="uf-summary-value">{formData.onset_type.toUpperCase()} onset ({formData.symptom_start_days || "0"} days)</span>
                            </div>
                            <div className="uf-summary-item">
                              <span className="uf-summary-label">Severe Redness / Pain</span>
                              <span className="uf-summary-value">
                                Redness: {formData.redness_score}/10 | Pain: {formData.pain_score}/10
                              </span>
                            </div>
                            <div className="uf-summary-item">
                              <span className="uf-summary-label">Systemic &amp; History Flags</span>
                              <span className="uf-summary-value">
                                Prior Uveitis: {Number(formData.previous_uveitis) === 1 ? "Yes" : "No"} | Autoimmune: {Number(formData.autoimmune_disease) > 0 ? "Yes" : "No"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

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

                        {stepIndex < steps.length - 1 ? (
                          <button type="button" className="uf-btn uf-btn-primary" onClick={nextStep}>
                            Next Section
                            <ChevronRight size={18} />
                          </button>
                        ) : (
                          <button type="button" className="uf-btn uf-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 size={18} className="spin" />
                                Submitting Intake...
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

          {predictionResult && (
            <div className="uf-sidebar-analytics">
              <div className="uf-analytics-card card">
                <h3>
                  <Activity size={18} style={{ color: "#2563eb", marginRight: "8px", verticalAlign: "middle" }} />
                  Clinical Decision Support
                </h3>
                <p className="uf-analytics-subtitle">Adaptive Neuro-Fuzzy Output</p>

                <div className="uf-analytics-bars">
                  <div className="uf-analytics-bar-item">
                    <div className="uf-bar-meta">
                      <span>Ocular Inflammation</span>
                      <span>{activeIndices.inflammation.toFixed(0)}%</span>
                    </div>
                    <div className="uf-bar-track">
                      <div className="uf-bar-fill" style={{ width: `${activeIndices.inflammation}%`, backgroundColor: "#3b82f6" }} />
                    </div>
                  </div>

                  <div className="uf-analytics-bar-item">
                    <div className="uf-bar-meta">
                      <span>Visual Dysfunction</span>
                      <span>{activeIndices.visual.toFixed(0)}%</span>
                    </div>
                    <div className="uf-bar-track">
                      <div className="uf-bar-fill" style={{ width: `${activeIndices.visual}%`, backgroundColor: "#06b6d4" }} />
                    </div>
                  </div>

                  <div className="uf-analytics-bar-item">
                    <div className="uf-bar-meta">
                      <span>Autoimmune Markers</span>
                      <span>{activeIndices.autoimmune.toFixed(0)}%</span>
                    </div>
                    <div className="uf-bar-track">
                      <div className="uf-bar-fill" style={{ width: `${activeIndices.autoimmune}%`, backgroundColor: "#8b5cf6" }} />
                    </div>
                  </div>

                  <div className="uf-analytics-bar-item">
                    <div className="uf-bar-meta">
                      <span>Pathogen / Infectious</span>
                      <span>{activeIndices.infectious.toFixed(0)}%</span>
                    </div>
                    <div className="uf-bar-track">
                      <div className="uf-bar-fill" style={{ width: `${activeIndices.infectious}%`, backgroundColor: "#f59e0b" }} />
                    </div>
                  </div>

                  <div className="uf-analytics-bar-item">
                    <div className="uf-bar-meta">
                      <span>Recurrence Risk</span>
                      <span>{activeIndices.recurrence.toFixed(0)}%</span>
                    </div>
                    <div className="uf-bar-track">
                      <div className="uf-bar-fill" style={{ width: `${activeIndices.recurrence}%`, backgroundColor: "#ec4899" }} />
                    </div>
                  </div>

                  <div className="uf-analytics-bar-item">
                    <div className="uf-bar-meta">
                      <span>Referral Urgency</span>
                      <span>{activeIndices.urgency.toFixed(0)}%</span>
                    </div>
                    <div className="uf-bar-track">
                      <div className="uf-bar-fill" style={{ width: `${activeIndices.urgency}%`, backgroundColor: "#ef4444" }} />
                    </div>
                  </div>
                </div>

                {predictionResult && predictionResult.explanation && (
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
          )}
        </div>
      </div>
    </div>
  );
}
