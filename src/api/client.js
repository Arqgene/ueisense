/**
 * src/api/client.js
 *
 * Client-side Storage API layer for Uveitis AI Diagnosis System.
 * Uses browser localStorage for complete persistence with zero external backend.
 */

const STORAGE_KEYS = {
  PATIENTS: "uveitis_patients_v1",
  QUESTIONNAIRES: "uveitis_questionnaires_v1",
  NEURO_FUZZY: "uveitis_neuro_fuzzy_v1",
  REFERRALS: "uveitis_referrals_v1",
  ASSESSMENTS: "uveitis_assessments_v1",
  IMAGING: "uveitis_imaging_v1",
  CNN: "uveitis_cnn_v1",
  REVIEWS: "uveitis_reviews_v1",
  DIAGNOSES: "uveitis_diagnoses_v1",
  DOCTORS: "uveitis_doctors_v1",
  AUDIT: "uveitis_audit_v1",
};

// Initial Seed Doctors
const INITIAL_DOCTORS = [
  { id: "DR-001", name: "Dr. Elena Rostova", email: "dr.elena.rostova@eyeclinic.org", clinic: "Metropolitan Ocular Immunology Center", specialty: "Uveitis & Inflammatory Eye Disease" },
  { id: "DR-002", name: "Dr. Marcus Vance", email: "dr.marcus.vance@retina.org", clinic: "Vision & Retina Specialists", specialty: "Retinal Vasculitis & Posterior Uveitis" },
  { id: "DR-003", name: "Dr. Priya Patel", email: "dr.priya.patel@university.org", clinic: "University Eye Institute & Research", specialty: "Anterior Uveitis & Cornea" },
];

// Initial Seed Patients
export const INITIAL_PATIENTS = [
  {
    id: "PT-8942",
    name: "Sarah Jenkins",
    age: 42,
    sex: "Female",
    affectedEye: "Left Eye",
    affected_eye: "Left Eye",
    symptomStart: "2 days ago",
    symptom_start: "2 days ago",
    onset: "Sudden",
    onset_type: "Sudden",
    riskTier: "High",
    risk_tier: "High",
    uveitisProbability: 94.2,
    uveitis_prob: 94.2,
    urgencyIndex: 88,
    urgency_index: 88,
    severityClass: "Severe Acute Anterior Uveitis",
    severity_class: "Severe Acute Anterior Uveitis",
    rednessScore: 9,
    painScore: 8,
    photophobiaScore: 9,
    blurredScore: 7,
    autoimmuneFlag: true,
    priorUveitis: false,
    slitlampStatus: "Awaiting Photo",
    slitlamp_status: "Awaiting Photo",
    submittedAt: "12 mins ago",
    submitted_at: new Date(Date.now() - 12 * 60000).toISOString(),
    primarySymptoms: ["Severe Photophobia", "Deep Eye Pain 8/10", "Acute Ciliary Flush", "Floaters"],
  },
  {
    id: "PT-8945",
    name: "Robert Vance",
    age: 58,
    sex: "Male",
    affectedEye: "Right Eye",
    affected_eye: "Right Eye",
    symptomStart: "4 days ago",
    symptom_start: "4 days ago",
    onset: "Sudden",
    onset_type: "Sudden",
    riskTier: "High",
    risk_tier: "High",
    uveitisProbability: 89.5,
    uveitis_prob: 89.5,
    urgencyIndex: 82,
    urgency_index: 82,
    severityClass: "Intermediate / Posterior Vasculitis",
    severity_class: "Intermediate / Posterior Vasculitis",
    rednessScore: 7,
    painScore: 6,
    photophobiaScore: 8,
    blurredScore: 9,
    autoimmuneFlag: true,
    priorUveitis: true,
    slitlampStatus: "Photo Uploaded",
    slitlamp_status: "Photo Uploaded",
    submittedAt: "35 mins ago",
    submitted_at: new Date(Date.now() - 35 * 60000).toISOString(),
    primarySymptoms: ["Hazy Vision 9/10", "Vitritis Floaters", "Anterior Chamber Flare"],
  },
  {
    id: "PT-8939",
    name: "Amanda Chen",
    age: 31,
    sex: "Female",
    affectedEye: "Both Eyes",
    affected_eye: "Both Eyes",
    symptomStart: "5 days ago",
    symptom_start: "5 days ago",
    onset: "Gradual",
    onset_type: "Gradual",
    riskTier: "Moderate",
    risk_tier: "Moderate",
    uveitisProbability: 64.0,
    uveitis_prob: 64.0,
    urgencyIndex: 55,
    urgency_index: 55,
    severityClass: "Moderate Recurrent Anterior Uveitis",
    severity_class: "Moderate Recurrent Anterior Uveitis",
    rednessScore: 5,
    painScore: 4,
    photophobiaScore: 6,
    blurredScore: 4,
    autoimmuneFlag: false,
    priorUveitis: true,
    slitlampStatus: "Photo Uploaded",
    slitlamp_status: "Photo Uploaded",
    submittedAt: "1 hr ago",
    submitted_at: new Date(Date.now() - 60 * 60000).toISOString(),
    primarySymptoms: ["Mild Glare & Halos", "Bilateral Mild Irritation", "Prior Episode 2024"],
  },
  {
    id: "PT-8935",
    name: "Michael Ross",
    age: 49,
    sex: "Male",
    affectedEye: "Right Eye",
    affected_eye: "Right Eye",
    symptomStart: "1 week ago",
    symptom_start: "1 week ago",
    onset: "Gradual",
    onset_type: "Gradual",
    riskTier: "Moderate",
    risk_tier: "Moderate",
    uveitisProbability: 58.2,
    uveitis_prob: 58.2,
    urgencyIndex: 48,
    urgency_index: 48,
    severityClass: "Post-Traumatic Mild Inflammation",
    severity_class: "Post-Traumatic Mild Inflammation",
    rednessScore: 4,
    painScore: 3,
    photophobiaScore: 3,
    blurredScore: 2,
    autoimmuneFlag: false,
    priorUveitis: false,
    slitlampStatus: "Awaiting Photo",
    slitlamp_status: "Awaiting Photo",
    submittedAt: "2 hrs ago",
    submitted_at: new Date(Date.now() - 120 * 60000).toISOString(),
    primarySymptoms: ["鈍Pain Post Blunt Trauma", "Mild Injection", "Low Inflammatory Markers"],
  },
  {
    id: "PT-8930",
    name: "Elena Rodriguez",
    age: 26,
    sex: "Female",
    affectedEye: "Left Eye",
    affected_eye: "Left Eye",
    symptomStart: "3 days ago",
    symptom_start: "3 days ago",
    onset: "Gradual",
    onset_type: "Gradual",
    riskTier: "Low",
    risk_tier: "Low",
    uveitisProbability: 21.0,
    uveitis_prob: 21.0,
    urgencyIndex: 15,
    urgency_index: 15,
    severityClass: "Low Risk / Dry Eye Strain",
    severity_class: "Low Risk / Dry Eye Strain",
    rednessScore: 2,
    painScore: 1,
    photophobiaScore: 1,
    blurredScore: 1,
    autoimmuneFlag: false,
    priorUveitis: false,
    slitlampStatus: "Cleared",
    slitlamp_status: "Cleared",
    submittedAt: "3 hrs ago",
    submitted_at: new Date(Date.now() - 180 * 60000).toISOString(),
    primarySymptoms: ["Contact Lens Strain", "Surface Dryness", "No Deep Pain"],
  },
  {
    id: "PT-8924",
    name: "David Miller",
    age: 65,
    sex: "Male",
    affectedEye: "Both Eyes",
    affected_eye: "Both Eyes",
    symptomStart: "6 days ago",
    symptom_start: "6 days ago",
    onset: "Gradual",
    onset_type: "Gradual",
    riskTier: "Low",
    risk_tier: "Low",
    uveitisProbability: 18.5,
    uveitis_prob: 18.5,
    urgencyIndex: 12,
    urgency_index: 12,
    severityClass: "Allergic Conjunctivitis Suspicion",
    severity_class: "Allergic Conjunctivitis Suspicion",
    rednessScore: 3,
    painScore: 0,
    photophobiaScore: 1,
    blurredScore: 1,
    autoimmuneFlag: false,
    priorUveitis: false,
    slitlampStatus: "Cleared",
    slitlamp_status: "Cleared",
    submittedAt: "5 hrs ago",
    submitted_at: new Date(Date.now() - 300 * 60000).toISOString(),
    primarySymptoms: ["Itching & Tearing", "Bilateral Redness", "Clear Vision"],
  },
];

// Helper functions for localStorage CRUD
function getItem(key, defaultValue) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage:`, e);
    return defaultValue;
  }
}

function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing ${key} to localStorage:`, e);
  }
}

// Initialize seed data if not present
function initializeStore() {
  if (!getItem(STORAGE_KEYS.PATIENTS, null)) {
    setItem(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
  }
  if (!getItem(STORAGE_KEYS.DOCTORS, null)) {
    setItem(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
  }
}

initializeStore();

// Log audit helper
function addAuditLog(entity_type, entity_id, action, details) {
  const logs = getItem(STORAGE_KEYS.AUDIT, []);
  logs.unshift({
    id: Date.now(),
    entity_type,
    entity_id,
    action,
    details,
    created_at: new Date().toISOString(),
  });
  setItem(STORAGE_KEYS.AUDIT, logs.slice(0, 100));
}

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email, clinic) => {
    const doctors = getItem(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
    const doctor = doctors.find((d) => d.email.toLowerCase() === (email || "").toLowerCase()) || doctors[0];
    return { token: "demo-token", doctor };
  },
  doctors: async () => getItem(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS),
};

// ─── Patients ─────────────────────────────────────────────────────────────
export const patientsApi = {
  list: async (filters = {}) => {
    let list = getItem(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    if (filters.risk) {
      list = list.filter((p) => p.riskTier === filters.risk || p.risk_tier === filters.risk);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter((p) => (p.name || "").toLowerCase().includes(q) || (p.id || "").toLowerCase().includes(q));
    }
    return list;
  },

  get: async (id) => {
    const list = getItem(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const patient = list.find((p) => p.id === id);
    if (!patient) throw new Error("Patient not found");
    return patient;
  },

  create: async (data) => {
    const list = getItem(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const id = data.id || `PT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient = {
      id,
      name: data.name || "Anonymous Patient",
      age: data.age || 35,
      sex: data.sex || "Not Specified",
      affectedEye: data.affected_eye || data.affectedEye || "Left Eye",
      affected_eye: data.affected_eye || data.affectedEye || "Left Eye",
      symptomStart: data.symptom_start || data.symptomStart || "Recently",
      symptom_start: data.symptom_start || data.symptomStart || "Recently",
      onset: data.onset_type || data.onset || "Gradual",
      onset_type: data.onset_type || data.onset || "Gradual",
      riskTier: data.risk_tier || data.riskTier || "Moderate",
      risk_tier: data.risk_tier || data.riskTier || "Moderate",
      uveitisProbability: data.uveitis_prob || data.uveitisProbability || 50.0,
      uveitis_prob: data.uveitis_prob || data.uveitisProbability || 50.0,
      urgencyIndex: data.urgency_index || data.urgencyIndex || 50,
      urgency_index: data.urgency_index || data.urgencyIndex || 50,
      severityClass: data.severity_class || data.severityClass || "Moderate Uveitis",
      severity_class: data.severity_class || data.severityClass || "Moderate Uveitis",
      rednessScore: data.rednessScore || 5,
      painScore: data.painScore || 5,
      photophobiaScore: data.photophobiaScore || 5,
      blurredScore: data.blurredScore || 4,
      autoimmuneFlag: data.autoimmuneFlag || false,
      priorUveitis: data.priorUveitis || false,
      slitlampStatus: data.slitlamp_status || data.slitlampStatus || "Awaiting Photo",
      slitlamp_status: data.slitlamp_status || data.slitlampStatus || "Awaiting Photo",
      submittedAt: "Just now",
      submitted_at: new Date().toISOString(),
      primarySymptoms: data.primarySymptoms || ["Patient Intake Form Submitted"],
      ...data,
    };

    list.unshift(newPatient);
    setItem(STORAGE_KEYS.PATIENTS, list);
    addAuditLog("patient", id, "created", newPatient);
    return newPatient;
  },

  update: async (id, data) => {
    const list = getItem(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Patient not found");

    list[index] = { ...list[index], ...data, updated_at: new Date().toISOString() };
    setItem(STORAGE_KEYS.PATIENTS, list);
    addAuditLog("patient", id, "updated", data);
    return list[index];
  },
};

// ─── Questionnaire ────────────────────────────────────────────────────────
export const questionnaireApi = {
  get: async (patientId) => {
    const store = getItem(STORAGE_KEYS.QUESTIONNAIRES, {});
    return store[patientId] || null;
  },
  save: async (patientId, section, answers) => {
    const store = getItem(STORAGE_KEYS.QUESTIONNAIRES, {});
    if (!store[patientId]) store[patientId] = {};
    store[patientId][section] = answers;
    setItem(STORAGE_KEYS.QUESTIONNAIRES, store);
    return { status: "success", patientId, section };
  },
};

// ─── Neuro-Fuzzy ──────────────────────────────────────────────────────────
export const neuroFuzzyApi = {
  get: async (patientId) => {
    const store = getItem(STORAGE_KEYS.NEURO_FUZZY, {});
    return store[patientId] || null;
  },
  save: async (data) => {
    const store = getItem(STORAGE_KEYS.NEURO_FUZZY, {});
    store[data.patient_id || data.patientId] = data;
    setItem(STORAGE_KEYS.NEURO_FUZZY, store);
    return { status: "success" };
  },
};

// ─── Referrals ────────────────────────────────────────────────────────────
export const referralsApi = {
  get: async (patientId) => {
    const store = getItem(STORAGE_KEYS.REFERRALS, {});
    return store[patientId] || null;
  },
  create: async (data) => {
    const store = getItem(STORAGE_KEYS.REFERRALS, {});
    store[data.patient_id] = data;
    setItem(STORAGE_KEYS.REFERRALS, store);
    return { status: "success", id: Date.now() };
  },
};

// ─── Preliminary Assessments (Layer 4) ────────────────────────────────────
export const assessmentsApi = {
  get: async (patientId) => {
    const store = getItem(STORAGE_KEYS.ASSESSMENTS, {});
    return store[patientId] || null;
  },
  create: async (data) => {
    const store = getItem(STORAGE_KEYS.ASSESSMENTS, {});
    store[data.patient_id] = data;
    setItem(STORAGE_KEYS.ASSESSMENTS, store);
    addAuditLog("assessment", data.patient_id, "created", data);
    return { status: "success", id: Date.now() };
  },
};

// ─── Imaging & CNN (Layer 5) ──────────────────────────────────────────────
export const imagingApi = {
  list: async (patientId) => {
    const store = getItem(STORAGE_KEYS.IMAGING, {});
    return store[patientId] ? [store[patientId]] : [];
  },

  upload: async (patientId, doctorId, imageType, file) => {
    const imagingRecord = {
      id: Date.now(),
      patient_id: patientId,
      doctor_id: doctorId,
      image_type: imageType,
      image_filename: file ? file.name : "sample_slitlamp.jpg",
      image_url: file && typeof file === "object" ? URL.createObjectURL(file) : null,
      preprocessing_done: true,
      cnn_sealed: true,
      created_at: new Date().toISOString(),
    };

    const store = getItem(STORAGE_KEYS.IMAGING, {});
    store[patientId] = imagingRecord;
    setItem(STORAGE_KEYS.IMAGING, store);

    // Update patient status to 'Photo Uploaded'
    patientsApi.update(patientId, { slitlampStatus: "Photo Uploaded", slitlamp_status: "Photo Uploaded" }).catch(() => {});

    return imagingRecord;
  },

  preprocess: async (imagingId, doctorId) => {
    return { status: "success", preprocessing_done: true };
  },

  getCNN: async (patientId) => {
    const store = getItem(STORAGE_KEYS.CNN, {});
    return store[patientId] || null;
  },
};

// ─── Final Review (Layer 6) ───────────────────────────────────────────────
export const finalReviewApi = {
  reveal: async (patientId, doctorId) => {
    const store = getItem(STORAGE_KEYS.CNN, {});
    store[patientId] = {
      ...(store[patientId] || {}),
      revealed: true,
      revealed_at: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.CNN, store);
    addAuditLog("imaging", patientId, "revealed", { doctorId });
    return { status: "success", revealed: true };
  },

  save: async (data) => {
    const store = getItem(STORAGE_KEYS.REVIEWS, {});
    store[data.patient_id] = data;
    setItem(STORAGE_KEYS.REVIEWS, store);
    addAuditLog("review", data.patient_id, "saved", data);
    return { status: "success", id: Date.now() };
  },
};

// ─── Final Diagnosis (Layer 7) ────────────────────────────────────────────
export const diagnosisApi = {
  get: async (patientId) => {
    const store = getItem(STORAGE_KEYS.DIAGNOSES, {});
    return store[patientId] || null;
  },
  save: async (data) => {
    const store = getItem(STORAGE_KEYS.DIAGNOSES, {});
    store[data.patient_id] = data;
    setItem(STORAGE_KEYS.DIAGNOSES, store);

    // Update patient status to 'Completed'
    patientsApi.update(data.patient_id, { slitlampStatus: "Completed", slitlamp_status: "Completed" }).catch(() => {});
    addAuditLog("diagnosis", data.patient_id, "saved", data);
    return { status: "success", id: Date.now() };
  },
  update: async (id, data) => {
    const store = getItem(STORAGE_KEYS.DIAGNOSES, {});
    store[id] = { ...(store[id] || {}), ...data };
    setItem(STORAGE_KEYS.DIAGNOSES, store);
    return { status: "success" };
  },
};

// ─── Stats & Audit ────────────────────────────────────────────────────────
export const statsApi = {
  get: async () => {
    const patients = getItem(STORAGE_KEYS.PATIENTS, INITIAL_PATIENTS);
    const high = patients.filter((p) => p.riskTier === "High" || p.risk_tier === "High").length;
    const mod = patients.filter((p) => p.riskTier === "Moderate" || p.risk_tier === "Moderate").length;
    const low = patients.filter((p) => p.riskTier === "Low" || p.risk_tier === "Low").length;
    const total = patients.length;

    return {
      total_patients: total,
      high_risk_count: high,
      moderate_risk_count: mod,
      low_risk_count: low,
      photos_uploaded: patients.filter((p) => p.slitlampStatus === "Photo Uploaded" || p.slitlamp_status === "Photo Uploaded").length,
      awaiting_photos: patients.filter((p) => p.slitlampStatus === "Awaiting Photo" || p.slitlamp_status === "Awaiting Photo").length,
    };
  },
  audit: async (patientId) => {
    const logs = getItem(STORAGE_KEYS.AUDIT, []);
    return patientId ? logs.filter((l) => l.entity_id === patientId) : logs;
  },
};

// ─── Health check ─────────────────────────────────────────────────────────
export const healthCheck = async () => ({ status: "ok", mode: "pure-frontend-localStorage" });

const api = {
  auth: authApi,
  patients: patientsApi,
  questionnaire: questionnaireApi,
  neuroFuzzy: neuroFuzzyApi,
  referrals: referralsApi,
  assessments: assessmentsApi,
  imaging: imagingApi,
  finalReview: finalReviewApi,
  diagnosis: diagnosisApi,
  stats: statsApi,
  healthCheck,
};

export default api;
