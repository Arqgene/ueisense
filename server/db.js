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
// SAFE SCHEMA UPGRADE (Add new columns to existing DB if missing)
// ─────────────────────────────────────────────────────────────────────────────
function ensureColumn(table, column, def) {
  try {
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!info.some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
    }
  } catch (e) {
    console.warn(`Could not ensure column ${table}.${column}:`, e.message);
  }
}

ensureColumn("patients", "phone", "TEXT");
ensureColumn("patients", "assigned_doctor_id", "TEXT");
ensureColumn("patients", "assigned_doctor_name", "TEXT");
ensureColumn("patients", "hospital_branch", "TEXT");
ensureColumn("patients", "image_url", "TEXT");

// Referral & Multi-Doctor Access columns
ensureColumn("patients", "referred_to_doctor_id", "TEXT");
ensureColumn("patients", "referred_by_doctor_id", "TEXT");
ensureColumn("patients", "referral_notes", "TEXT");
ensureColumn("patients", "referred_at", "TEXT");

// Case Closure & Clinical Status
ensureColumn("patients", "case_status", "TEXT DEFAULT 'active'");
ensureColumn("patients", "closure_reason", "TEXT");
ensureColumn("patients", "closed_at", "TEXT");
ensureColumn("patients", "closed_by_doctor_id", "TEXT");
ensureColumn("patients", "discharge_summary", "TEXT");

// Junior Doctor Clinical Annotations & Senior Oversight
ensureColumn("patients", "junior_annotations_json", "TEXT");
ensureColumn("patients", "senior_approval_status", "TEXT DEFAULT 'none'");
ensureColumn("patients", "senior_approved_at", "TEXT");
ensureColumn("patients", "senior_approved_by", "TEXT");
ensureColumn("patients", "senior_notes", "TEXT");

// Imaging Sessions upgrades
ensureColumn("imaging_sessions", "doctor_annotations_json", "TEXT");
ensureColumn("imaging_sessions", "ai_subtype_prediction_json", "TEXT");
ensureColumn("imaging_sessions", "sealed_for_junior", "INTEGER DEFAULT 0");

ensureColumn("neuro_fuzzy_results", "feature_importance_json", "TEXT");
ensureColumn("cnn_results", "gradcam_data_json", "TEXT");
ensureColumn("doctors", "city", "TEXT");
ensureColumn("doctors", "phone", "TEXT");
ensureColumn("doctors", "distance_label", "TEXT");
ensureColumn("doctors", "role", "TEXT DEFAULT 'senior'");
ensureColumn("doctors", "supervisor_id", "TEXT");
ensureColumn("doctors", "supervisor_name", "TEXT");

// ─────────────────────────────────────────────────────────────────────────────
// SEED: Dr. Agarwal's Eye Hospital Uveitis Specialists & Network Doctors
// ─────────────────────────────────────────────────────────────────────────────
const agarwalDoctors = [
  {
    id: "DR-AG-01",
    name: "Dr. Soundari S., MS, FMRF",
    email: "dr.soundari@agarwaleye.com",
    clinic: "Dr. Agarwal's Eye Hospital - Cathedral Road (Chennai Main)",
    specialty: "Senior Consultant - Uveitis & Ocular Immunology",
    city: "Chennai",
    phone: "+91 44 4378 7777",
    distance_label: "2.1 km away",
    role: "senior",
    supervisor_id: null,
    supervisor_name: null,
  },
  {
    id: "DR-AG-02",
    name: "Dr. Ramamurthy Sundar, DNB, FRCS",
    email: "dr.ramamurthy@agarwaleye.com",
    clinic: "Dr. Agarwal's Eye Hospital - Indiranagar",
    specialty: "Vitreo-Retina & Posterior Uveitis Specialist",
    city: "Bengaluru",
    phone: "+91 80 4680 8800",
    distance_label: "5.4 km away",
    role: "senior",
    supervisor_id: null,
    supervisor_name: null,
  },
  {
    id: "DR-AG-03",
    name: "Dr. V. Rajeshwari, MS",
    email: "dr.rajeshwari@agarwaleye.com",
    clinic: "Dr. Agarwal's Eye Hospital - Banjara Hills",
    specialty: "Senior Consultant - Uveitis & Cornea",
    city: "Hyderabad",
    phone: "+91 40 6815 6500",
    distance_label: "7.8 km away",
    role: "senior",
    supervisor_id: null,
    supervisor_name: null,
  },
  {
    id: "DR-AG-04",
    name: "Dr. Anand Parthasarathy, MS, FICO",
    email: "dr.anand@agarwaleye.com",
    clinic: "Dr. Agarwal's Eye Hospital - Velachery",
    specialty: "Anterior Segment & Uveitis Specialist",
    city: "Chennai",
    phone: "+91 44 4055 4055",
    distance_label: "9.2 km away",
    role: "junior",
    supervisor_id: "DR-AG-01",
    supervisor_name: "Dr. Soundari S., MS, FMRF",
  },
  {
    id: "DR-AG-05",
    name: "Dr. Preethi Govindarajan, MD",
    email: "dr.preethi@agarwaleye.com",
    clinic: "Dr. Agarwal's Eye Hospital - R.S. Puram",
    specialty: "Paediatric & Autoimmune Uveitis Specialist",
    city: "Coimbatore",
    phone: "+91 422 422 8800",
    distance_label: "12.0 km away",
    role: "junior",
    supervisor_id: "DR-AG-02",
    supervisor_name: "Dr. Ramamurthy Sundar, DNB, FRCS",
  },
];

const insertOrUpdateDoctor = db.prepare(`
  INSERT INTO doctors (id, name, email, password_hash, clinic, specialty, city, phone, distance_label, role, supervisor_id, supervisor_name)
  VALUES (@id, @name, @email, 'demo_hash_agarwal', @clinic, @specialty, @city, @phone, @distance_label, @role, @supervisor_id, @supervisor_name)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    email = excluded.email,
    clinic = excluded.clinic,
    specialty = excluded.specialty,
    city = excluded.city,
    phone = excluded.phone,
    distance_label = excluded.distance_label,
    role = excluded.role,
    supervisor_id = excluded.supervisor_id,
    supervisor_name = excluded.supervisor_name
`);

for (const doc of agarwalDoctors) {
  insertOrUpdateDoctor.run(doc);
}

// Seed legacy fallback doctors if not already present
db.prepare(`
  INSERT OR IGNORE INTO doctors (id, name, email, password_hash, clinic, specialty)
  VALUES ('DR-001', 'Dr. Elena Rostova', 'dr.elena.rostova@eyeclinic.org', 'demo_hash_1', 'Metropolitan Ocular Immunology Center', 'Uveitis & Inflammatory Eye Disease')
`).run();

// ─────────────────────────────────────────────────────────────────────────────
// SEED: Sample patients
// ─────────────────────────────────────────────────────────────────────────────
const existingPatients = db.prepare("SELECT COUNT(*) as cnt FROM patients").get();
if (existingPatients.cnt === 0) {
  const insertPatient = db.prepare(`
    INSERT OR IGNORE INTO patients
      (id, name, age, sex, affected_eye, symptom_start, onset_type, risk_tier,
       uveitis_prob, urgency_index, severity_class, slitlamp_status, assigned_doctor_id, assigned_doctor_name, hospital_branch, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const patients = [
    ["PT-8942", "Sarah Jenkins",    42, "Female", "Left Eye",   "2 days ago", "Sudden",  "High",     94.2, 88, "Severe Acute Anterior Uveitis",            "Photo Uploaded", "DR-AG-01", "Dr. Soundari S., MS, FMRF", "Dr. Agarwal's Eye Hospital - Cathedral Road (Chennai Main)", new Date(Date.now() - 12 * 60000).toISOString()],
    ["PT-8945", "Robert Vance",     58, "Male",   "Right Eye",  "4 days ago", "Sudden",  "High",     89.5, 82, "Intermediate / Posterior Vasculitis",      "Photo Uploaded", "DR-AG-02", "Dr. Ramamurthy Sundar, DNB, FRCS", "Dr. Agarwal's Eye Hospital - Indiranagar", new Date(Date.now() - 35 * 60000).toISOString()],
    ["PT-8939", "Amanda Chen",      31, "Female", "Both Eyes",  "5 days ago", "Gradual", "Moderate", 64.0, 55, "Moderate Recurrent Anterior Uveitis",      "Photo Uploaded", "DR-AG-03", "Dr. V. Rajeshwari, MS", "Dr. Agarwal's Eye Hospital - Banjara Hills", new Date(Date.now() - 60 * 60000).toISOString()],
    ["PT-8935", "Michael Ross",     49, "Male",   "Right Eye",  "1 week ago", "Gradual", "Moderate", 58.2, 48, "Post-Traumatic Mild Inflammation",         "Awaiting Photo", "DR-AG-01", "Dr. Soundari S., MS, FMRF", "Dr. Agarwal's Eye Hospital - Cathedral Road (Chennai Main)", new Date(Date.now() - 120 * 60000).toISOString()],
    ["PT-8930", "Elena Rodriguez",  26, "Female", "Left Eye",   "3 days ago", "Gradual", "Low",      21.0, 15, "Low Risk / Dry Eye Strain",               "Cleared",        "DR-AG-04", "Dr. Anand Parthasarathy, MS, FICO", "Dr. Agarwal's Eye Hospital - Velachery", new Date(Date.now() - 180 * 60000).toISOString()],
    ["PT-8924", "David Miller",     65, "Male",   "Both Eyes",  "6 days ago", "Gradual", "Low",      18.5, 12, "Allergic Conjunctivitis Suspicion",       "Cleared",        "DR-AG-05", "Dr. Preethi Govindarajan, MD", "Dr. Agarwal's Eye Hospital - R.S. Puram", new Date(Date.now() - 300 * 60000).toISOString()],
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
       recurrence_idx, urgency_idx, explanation_json, uncertainty_score, feature_importance_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "PT-8942", 0.942, 1, 89.4, "Severe", "High",
    0.92, 0.78, 0.88, 0.22, 0.35, 0.91,
    JSON.stringify([
      "Severe Photophobia (9/10) with acute sudden onset strongly correlates with anterior uveitis.",
      "Active autoimmune joint pain flags HLA-B27 spondyloarthropathy risk profile.",
      "Deep perilimbal ciliary injection and 8/10 pain score elevate inflammatory urgency index to 91%."
    ]),
    5.8,
    JSON.stringify([
      { feature: "Severe Photophobia (9/10)", impact: 94, category: "Ocular", detail: "Hallmark sign of ciliary muscle spasm and iridocyclitis" },
      { feature: "Perilimbal Redness & Pain (8/10)", impact: 88, category: "Ocular", detail: "Deep ciliary flush indicates active intraocular inflammation" },
      { feature: "Active Autoimmune / Joint Pain", impact: 85, category: "Systemic", detail: "HLA-B27 associated anterior uveitis profile" },
      { feature: "Sudden Onset (2 days)", impact: 82, category: "Timing", detail: "Acute explosive onset vs chronic insidious presentation" },
      { feature: "Visual Distortion & Floaters", impact: 65, category: "Visual", detail: "Early anterior vitreous cellular spillover" }
    ])
  );
}

console.log("✅ SQLite database initialized with Dr. Agarwal's Eye Hospital network:", DB_PATH);

module.exports = db;

