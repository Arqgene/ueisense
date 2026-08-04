/**
 * src/api/client.js
 *
 * Centralized API client for all frontend ↔ DB server communication.
 * Base URL: http://localhost:3001/api
 *
 * Usage:
 *   import api from '../api/client';
 *   const patients = await api.patients.list({ risk: 'High' });
 */

const BASE = import.meta.env.VITE_API_URL || (typeof window !== "undefined" && window.location.hostname !== "localhost" ? `${window.location.origin}/api` : "http://localhost:3001/api");

async function request(method, path, body, isFormData = false) {
  const opts = { method };
  if (body) {
    if (isFormData) {
      opts.body = body;
    } else {
      opts.headers = { "Content-Type": "application/json" };
      opts.body = JSON.stringify(body);
    }
  }
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

const get  = (path)        => request("GET",   path);
const post = (path, body)  => request("POST",  path, body);
const patch = (path, body) => request("PATCH", path, body);

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, clinic) => post("/auth/login", { email, clinic }),
  doctors: ()            => get("/auth/doctors"),
};

// ─── Patients ─────────────────────────────────────────────────────────────
export const patientsApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return get(`/patients${params ? `?${params}` : ""}`);
  },
  get:    (id)   => get(`/patients/${id}`),
  create: (data) => post("/patients", data),
  update: (id, data) => patch(`/patients/${id}`, data),
};

// ─── Questionnaire ────────────────────────────────────────────────────────
export const questionnaireApi = {
  get:  (patientId) => get(`/questionnaire/${patientId}`),
  save: (patientId, section, answers) => post("/questionnaire", { patient_id: patientId, section, answers }),
};

// ─── Neuro-Fuzzy ──────────────────────────────────────────────────────────
export const neuroFuzzyApi = {
  get:    (patientId)  => get(`/neuro-fuzzy/${patientId}`),
  save:   (data)       => post("/neuro-fuzzy", data),
};

// ─── Referrals ────────────────────────────────────────────────────────────
export const referralsApi = {
  get:    (patientId) => get(`/referrals/${patientId}`),
  create: (data)      => post("/referrals", data),
};

// ─── Preliminary Assessments (Layer 4) ────────────────────────────────────
export const assessmentsApi = {
  get:    (patientId) => get(`/assessments/${patientId}`),
  create: (data)      => post("/assessments", data),
};

// ─── Imaging & CNN (Layer 5) ──────────────────────────────────────────────
export const imagingApi = {
  list: (patientId) => get(`/imaging/${patientId}`),

  upload: (patientId, doctorId, imageType, file) => {
    const form = new FormData();
    form.append("patient_id", patientId);
    form.append("doctor_id", doctorId);
    form.append("image_type", imageType);
    form.append("image", file);
    return request("POST", "/imaging/upload", form, true);
  },

  preprocess: (imagingId, doctorId) =>
    request("POST", `/imaging/${imagingId}/preprocess`, { doctor_id: doctorId }),

  getCNN: (patientId) => get(`/cnn/${patientId}`),
};

// ─── Final Review (Layer 6) ───────────────────────────────────────────────
export const finalReviewApi = {
  reveal: (patientId, doctorId) =>
    post("/final-review/reveal", { patient_id: patientId, doctor_id: doctorId }),
  save: (data) => post("/final-review", data),
};

// ─── Final Diagnosis (Layer 7) ────────────────────────────────────────────
export const diagnosisApi = {
  get:    (patientId) => get(`/diagnosis/${patientId}`),
  save:   (data)      => post("/diagnosis", data),
  update: (id, data)  => patch(`/diagnosis/${id}`, data),
};

// ─── Stats & Audit ────────────────────────────────────────────────────────
export const statsApi = {
  get:   ()           => get("/stats"),
  audit: (patientId)  => get(`/audit${patientId ? `?patient_id=${patientId}` : ""}`),
};

// ─── Health check ─────────────────────────────────────────────────────────
export const healthCheck = () => get("/health");

// Default export: all API namespaces
const api = {
  auth:        authApi,
  patients:    patientsApi,
  questionnaire: questionnaireApi,
  neuroFuzzy:  neuroFuzzyApi,
  referrals:   referralsApi,
  assessments: assessmentsApi,
  imaging:     imagingApi,
  finalReview: finalReviewApi,
  diagnosis:   diagnosisApi,
  stats:       statsApi,
  healthCheck,
};

export default api;
