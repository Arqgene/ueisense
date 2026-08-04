/**
 * db.js — SQLite database initialization
 * Creates all tables for the Uveitis AI Diagnosis System
 */
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_DIR = path.join(__dirname, "db");
const DB_PATH = path.join(DB_DIR, "uveitis.db");

// Ensure db directory exists
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─────────────────────────────────────────────────────────────────────────────
// TABLE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

db.exec(`
  -- ── Layer 1: Patients ──
  CREATE TABLE IF NOT EXISTS patients (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    age             INTEGER,
    sex             TEXT,
    affected_eye    TEXT,
    symptom_start   TEXT,
    onset_type      TEXT,
    risk_tier       TEXT,
    uveitis_prob    REAL,
    urgency_index   REAL,
    severity_class  TEXT,
    slitlamp_status TEXT DEFAULT 'Awaiting Photo',
    submitted_at    TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
  );

  -- ── Layer 1: Patient Questionnaire Answers (raw section data) ──
  CREATE TABLE IF NOT EXISTS questionnaire_answers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    section         TEXT NOT NULL,  -- 'section1' .. 'section6'
    answers_json    TEXT NOT NULL,  -- JSON blob of all field answers
    created_at      TEXT DEFAULT (datetime('now'))
  );

  -- ── Layer 2: Neuro-Fuzzy Prediction Results ──
  CREATE TABLE IF NOT EXISTS neuro_fuzzy_results (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id        TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    uveitis_prob      REAL,
    uveitis_yes_no    INTEGER,
    severity_score    REAL,
    severity_class    TEXT,
    clinical_risk     TEXT,
    inflammation_idx  REAL,
    visual_idx        REAL,
    autoimmune_idx    REAL,
    infectious_idx    REAL,
    recurrence_idx    REAL,
    urgency_idx       REAL,
    explanation_json  TEXT,         -- JSON array of explanation strings
    uncertainty_score REAL,
    created_at        TEXT DEFAULT (datetime('now'))
  );

  -- ── Layer 3: Specialist Referral Records ──
  CREATE TABLE IF NOT EXISTS specialist_referrals (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id      TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    specialist_name TEXT,
    clinic_name     TEXT,
    specialty       TEXT,
    address         TEXT,
    phone           TEXT,
    referral_priority TEXT,          -- High / Medium / Low
    referral_reason TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
  );

  -- ── Layer 4: Doctor Preliminary Assessments ──
  CREATE TABLE IF NOT EXISTS preliminary_assessments (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id         TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id          TEXT NOT NULL REFERENCES doctors(id),
    prov_diagnosis     TEXT,
    confidence_level   TEXT,
    agrees_with_ai     INTEGER,      -- 1=agree, 0=disagree
    doctor_notes       TEXT,
    submitted_at       TEXT DEFAULT (datetime('now'))
  );

  -- ── Layer 5: Imaging Sessions ──
  CREATE TABLE IF NOT EXISTS imaging_sessions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id       TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id        TEXT NOT NULL REFERENCES doctors(id),
    image_type       TEXT,           -- slitlamp / fundus / oct
    image_filename   TEXT,
    image_path       TEXT,
    preprocessing_done INTEGER DEFAULT 0,
    preprocessing_at   TEXT,
    cnn_sealed         INTEGER DEFAULT 1,  -- 1=sealed until Layer 6
    created_at         TEXT DEFAULT (datetime('now'))
  );

  -- ── Layer 5: CNN Analysis Results (sealed until Layer 6) ──
  CREATE TABLE IF NOT EXISTS cnn_results (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    imaging_id       INTEGER NOT NULL REFERENCES imaging_sessions(id) ON DELETE CASCADE,
    patient_id       TEXT NOT NULL REFERENCES patients(id),
    ac_cell_grade    TEXT,
    flare_intensity  TEXT,
    kp_type          TEXT,
    pupil_reactivity TEXT,
    cnn_confidence   REAL,
    overlay_boxes_json TEXT,          -- JSON array of detected box coords
    revealed         INTEGER DEFAULT 0,
    revealed_at      TEXT,
    created_at       TEXT DEFAULT (datetime('now'))
  );

  -- ── Layer 6: Final Review Sessions ──
  CREATE TABLE IF NOT EXISTS final_reviews (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id       TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id        TEXT NOT NULL REFERENCES doctors(id),
    combined_score   REAL,
    uncertainty_level TEXT,
    doctor_vs_ai_match INTEGER DEFAULT 0,
    review_notes     TEXT,
    reviewed_at      TEXT DEFAULT (datetime('now'))
  );

  -- ── Layer 7: Final Diagnoses & Treatment Plans ──
  CREATE TABLE IF NOT EXISTS final_diagnoses (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id       TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id        TEXT NOT NULL REFERENCES doctors(id),
    final_diagnosis  TEXT NOT NULL,
    severity_grade   TEXT,
    consensus_score  REAL,
    topical_steroid  TEXT,
    cycloplegic      TEXT,
    systemic_tx      TEXT,
    followup_schedule TEXT,
    referral_priority TEXT,
    physician_notes  TEXT,
    status           TEXT DEFAULT 'pending',  -- pending / validated / complete
    validated_at     TEXT,
    created_at       TEXT DEFAULT (datetime('now'))
  );

  -- ── Doctors / Auth ──
  CREATE TABLE IF NOT EXISTS doctors (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    clinic          TEXT,
    specialty       TEXT,
    role            TEXT DEFAULT 'doctor',
    created_at      TEXT DEFAULT (datetime('now'))
  );

  -- ── Audit Log ──
  CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT,   -- patient / assessment / imaging / diagnosis
    entity_id   TEXT,
    action      TEXT,   -- created / updated / deleted / revealed
    performed_by TEXT,
    details_json TEXT,
    created_at  TEXT DEFAULT (datetime('now'))
  );
`);

// ─────────────────────────────────────────────────────────────────────────────
// SEED: Default doctor accounts
// ─────────────────────────────────────────────────────────────────────────────
const existingDoctors = db.prepare("SELECT COUNT(*) as cnt FROM doctors").get();
if (existingDoctors.cnt === 0) {
  const insertDoctor = db.prepare(`
    INSERT OR IGNORE INTO doctors (id, name, email, password_hash, clinic, specialty)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertDoctor.run("DR-001", "Dr. Elena Rostova", "dr.elena.rostova@eyeclinic.org", "demo_hash_1", "Metropolitan Ocular Immunology Center", "Uveitis & Inflammatory Eye Disease");
  insertDoctor.run("DR-002", "Dr. Marcus Vance",  "dr.marcus.vance@retina.org",      "demo_hash_2", "Vision & Retina Specialists",          "Retinal Vasculitis & Posterior Uveitis");
  insertDoctor.run("DR-003", "Dr. Priya Patel",   "dr.priya.patel@university.org",   "demo_hash_3", "University Eye Institute & Research",  "Anterior Uveitis & Cornea");
}

// ─────────────────────────────────────────────────────────────────────────────
// SEED: Sample patients (matching the frontend samplePatients array)
// ─────────────────────────────────────────────────────────────────────────────
const existingPatients = db.prepare("SELECT COUNT(*) as cnt FROM patients").get();
if (existingPatients.cnt === 0) {
  const insertPatient = db.prepare(`
    INSERT OR IGNORE INTO patients
      (id, name, age, sex, affected_eye, symptom_start, onset_type, risk_tier,
       uveitis_prob, urgency_index, severity_class, slitlamp_status, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const patients = [
    ["PT-8942", "Sarah Jenkins",    42, "Female", "Left Eye",   "2 days ago", "Sudden",  "High",     94.2, 88, "Severe Acute Anterior Uveitis",            "Awaiting Photo", new Date(Date.now() - 12 * 60000).toISOString()],
    ["PT-8945", "Robert Vance",     58, "Male",   "Right Eye",  "4 days ago", "Sudden",  "High",     89.5, 82, "Intermediate / Posterior Vasculitis",      "Photo Uploaded", new Date(Date.now() - 35 * 60000).toISOString()],
    ["PT-8939", "Amanda Chen",      31, "Female", "Both Eyes",  "5 days ago", "Gradual", "Moderate", 64.0, 55, "Moderate Recurrent Anterior Uveitis",      "Photo Uploaded", new Date(Date.now() - 60 * 60000).toISOString()],
    ["PT-8935", "Michael Ross",     49, "Male",   "Right Eye",  "1 week ago", "Gradual", "Moderate", 58.2, 48, "Post-Traumatic Mild Inflammation",         "Awaiting Photo", new Date(Date.now() - 120 * 60000).toISOString()],
    ["PT-8930", "Elena Rodriguez",  26, "Female", "Left Eye",   "3 days ago", "Gradual", "Low",      21.0, 15, "Low Risk / Dry Eye Strain",               "Cleared",        new Date(Date.now() - 180 * 60000).toISOString()],
    ["PT-8924", "David Miller",     65, "Male",   "Both Eyes",  "6 days ago", "Gradual", "Low",      18.5, 12, "Allergic Conjunctivitis Suspicion",       "Cleared",        new Date(Date.now() - 300 * 60000).toISOString()],
  ];

  for (const p of patients) insertPatient.run(...p);

  // Seed questionnaire answers for PT-8942
  db.prepare(`
    INSERT OR IGNORE INTO questionnaire_answers (patient_id, section, answers_json) VALUES (?, ?, ?)
  `).run("PT-8942", "section1", JSON.stringify({
    affected_eye: "Left Eye", symptom_start_days: 2, onset_type: "Sudden",
    redness_score: 9, pain_score: 8, photophobia_score: 9, blurred_vision_score: 7,
  }));

  db.prepare(`
    INSERT OR IGNORE INTO questionnaire_answers (patient_id, section, answers_json) VALUES (?, ?, ?)
  `).run("PT-8942", "section4", JSON.stringify({
    autoimmune_disease: "Yes", tuberculosis: "No", fever: "Yes",
    joint_pain: "Yes", immunocompromised: "No",
  }));

  // Seed neuro-fuzzy results for PT-8942
  db.prepare(`
    INSERT OR IGNORE INTO neuro_fuzzy_results
      (patient_id, uveitis_prob, uveitis_yes_no, severity_score, severity_class,
       clinical_risk, inflammation_idx, visual_idx, autoimmune_idx, infectious_idx,
       recurrence_idx, urgency_idx, explanation_json, uncertainty_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "PT-8942", 0.942, 1, 89.4, "Severe", "High",
    0.92, 0.78, 0.88, 0.22, 0.35, 0.91,
    JSON.stringify(["Sudden bilateral photophobia (9/10) strongly correlates with anterior uveitis.", "Active autoimmune condition (Methotrexate) elevates inflammatory index."]),
    5.8
  );
}

console.log("✅ SQLite database initialized:", DB_PATH);

module.exports = db;
