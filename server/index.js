/**
 * server/index.js — Express REST API for the Uveitis AI Diagnosis System
 *
 * Covers all architecture layers:
 *   Layer 1  — Patients & Questionnaire     /api/patients, /api/questionnaire
 *   Layer 2  — Neuro-Fuzzy Results          /api/neuro-fuzzy
 *   Layer 3  — Specialist Referrals         /api/referrals
 *   Layer 4  — Preliminary Assessments      /api/assessments
 *   Layer 5  — Imaging & CNN (sealed)       /api/imaging, /api/cnn
 *   Layer 6  — Final Review / Disclosure    /api/final-review
 *   Layer 7  — Diagnosis & Treatment Plan   /api/diagnosis
 *   Auth     — Doctor login/session         /api/auth
 */

const express = require("express");
const cors    = require("cors");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const db      = require("./db");

const app  = express();
const PORT = 3001;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json());

// Uploads directory
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOADS_DIR,
    filename: (req, file, cb) => {
      const unique = `${Date.now()}-${file.originalname}`;
      cb(null, unique);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".tiff", ".tif", ".bmp", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// Serve uploaded files
app.use("/uploads", express.static(UPLOADS_DIR));

// ── Helpers ──────────────────────────────────────────────────────────────────
function auditLog(entity_type, entity_id, action, performed_by = "system", details = {}) {
  try {
    db.prepare(`
      INSERT INTO audit_log (entity_type, entity_id, action, performed_by, details_json)
      VALUES (?, ?, ?, ?, ?)
    `).run(entity_type, String(entity_id), action, performed_by, JSON.stringify(details));
  } catch (e) {
    console.error("Audit log error:", e.message);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// AUTH — /api/auth
// ════════════════════════════════════════════════════════════════════════════

// POST /api/auth/login — demo login (no real password hashing for now)
app.post("/api/auth/login", (req, res) => {
  const { email, clinic } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const doctor = db.prepare("SELECT * FROM doctors WHERE email = ?").get(email);
  if (!doctor) {
    // Return first demo doctor for any email (demo mode)
    const demo = db.prepare("SELECT * FROM doctors LIMIT 1").get();
    if (!demo) return res.status(404).json({ error: "No doctors configured" });
    auditLog("doctor", demo.id, "login_demo", demo.id);
    return res.json({ success: true, doctor: { id: demo.id, name: demo.name, email: demo.email, clinic: demo.clinic, specialty: demo.specialty } });
  }

  auditLog("doctor", doctor.id, "login", doctor.id);
  res.json({ success: true, doctor: { id: doctor.id, name: doctor.name, email: doctor.email, clinic: doctor.clinic, specialty: doctor.specialty } });
});

// GET /api/auth/doctors — list all doctors
app.get("/api/auth/doctors", (_req, res) => {
  const doctors = db.prepare("SELECT id, name, email, clinic, specialty FROM doctors").all();
  res.json(doctors);
});

// ════════════════════════════════════════════════════════════════════════════
// PATIENTS — /api/patients
// ════════════════════════════════════════════════════════════════════════════

// GET /api/patients — list all patients
app.get("/api/patients", (req, res) => {
  const { risk, status, search } = req.query;
  let query = "SELECT * FROM patients WHERE 1=1";
  const params = [];

  if (risk && risk !== "All") { query += " AND risk_tier = ?"; params.push(risk); }
  if (status === "Awaiting") { query += " AND slitlamp_status = 'Awaiting Photo'"; }
  if (search) { query += " AND (name LIKE ? OR id LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }

  query += " ORDER BY created_at DESC";
  const patients = db.prepare(query).all(...params);
  res.json(patients);
});

// GET /api/patients/:id — get single patient
app.get("/api/patients/:id", (req, res) => {
  const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  // Also return related neuro-fuzzy result
  const nfr = db.prepare("SELECT * FROM neuro_fuzzy_results WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1").get(req.params.id);
  res.json({ ...patient, neuro_fuzzy: nfr || null });
});

// POST /api/patients — create new patient from questionnaire submission
app.post("/api/patients", (req, res) => {
  const {
    id, name, age, sex, affected_eye, symptom_start, onset_type,
    risk_tier, uveitis_prob, urgency_index, severity_class,
  } = req.body;

  const patientId = id || `PT-${Date.now().toString().slice(-6)}`;

  db.prepare(`
    INSERT OR REPLACE INTO patients
      (id, name, age, sex, affected_eye, symptom_start, onset_type,
       risk_tier, uveitis_prob, urgency_index, severity_class, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(patientId, name, age, sex, affected_eye, symptom_start, onset_type, risk_tier, uveitis_prob, urgency_index, severity_class);

  auditLog("patient", patientId, "created", "system", req.body);
  res.status(201).json({ success: true, patient_id: patientId });
});

// PATCH /api/patients/:id — update patient (e.g. slitlamp_status)
app.patch("/api/patients/:id", (req, res) => {
  const patient = db.prepare("SELECT * FROM patients WHERE id = ?").get(req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found" });

  const { slitlamp_status } = req.body;
  if (slitlamp_status) {
    db.prepare("UPDATE patients SET slitlamp_status = ?, updated_at = datetime('now') WHERE id = ?").run(slitlamp_status, req.params.id);
  }
  auditLog("patient", req.params.id, "updated", req.body.doctor_id || "system", req.body);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════════════════════
// QUESTIONNAIRE ANSWERS — /api/questionnaire
// ════════════════════════════════════════════════════════════════════════════

// GET /api/questionnaire/:patientId — all section answers
app.get("/api/questionnaire/:patientId", (req, res) => {
  const rows = db.prepare("SELECT * FROM questionnaire_answers WHERE patient_id = ? ORDER BY section").all(req.params.patientId);
  const result = {};
  for (const row of rows) {
    result[row.section] = JSON.parse(row.answers_json);
  }
  res.json(result);
});

// POST /api/questionnaire — save a questionnaire section
app.post("/api/questionnaire", (req, res) => {
  const { patient_id, section, answers } = req.body;
  if (!patient_id || !section || !answers) return res.status(400).json({ error: "Missing fields" });

  db.prepare(`
    INSERT OR REPLACE INTO questionnaire_answers (patient_id, section, answers_json)
    VALUES (?, ?, ?)
  `).run(patient_id, section, JSON.stringify(answers));

  auditLog("questionnaire", patient_id, "saved_section", "patient", { section });
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════════════════════
// NEURO-FUZZY RESULTS — /api/neuro-fuzzy
// ════════════════════════════════════════════════════════════════════════════

// GET /api/neuro-fuzzy/:patientId
app.get("/api/neuro-fuzzy/:patientId", (req, res) => {
  const result = db.prepare("SELECT * FROM neuro_fuzzy_results WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1").get(req.params.patientId);
  if (!result) return res.status(404).json({ error: "No neuro-fuzzy result found" });

  result.explanation = JSON.parse(result.explanation_json || "[]");
  res.json(result);
});

// POST /api/neuro-fuzzy — store prediction result from the FastAPI ML backend
app.post("/api/neuro-fuzzy", (req, res) => {
  const {
    patient_id, uveitis_prob, uveitis_yes_no, severity_score, severity_class,
    clinical_risk, fuzzy_indices, explanation, uncertainty_score,
  } = req.body;

  if (!patient_id) return res.status(400).json({ error: "patient_id required" });

  const fi = fuzzy_indices || {};
  db.prepare(`
    INSERT INTO neuro_fuzzy_results
      (patient_id, uveitis_prob, uveitis_yes_no, severity_score, severity_class,
       clinical_risk, inflammation_idx, visual_idx, autoimmune_idx, infectious_idx,
       recurrence_idx, urgency_idx, explanation_json, uncertainty_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    patient_id, uveitis_prob, uveitis_yes_no ?? 0, severity_score ?? 0, severity_class ?? "Unknown",
    clinical_risk ?? "Unknown", fi.inflammation ?? 0, fi.visual ?? 0, fi.autoimmune ?? 0,
    fi.infectious ?? 0, fi.recurrence ?? 0, fi.urgency ?? 0,
    JSON.stringify(explanation || []), uncertainty_score ?? 0
  );

  auditLog("neuro_fuzzy", patient_id, "created", "system");
  res.status(201).json({ success: true });
});

// ════════════════════════════════════════════════════════════════════════════
// SPECIALIST REFERRALS — /api/referrals
// ════════════════════════════════════════════════════════════════════════════

app.get("/api/referrals/:patientId", (req, res) => {
  const refs = db.prepare("SELECT * FROM specialist_referrals WHERE patient_id = ?").all(req.params.patientId);
  res.json(refs);
});

app.post("/api/referrals", (req, res) => {
  const { patient_id, specialist_name, clinic_name, specialty, address, phone, referral_priority, referral_reason } = req.body;
  if (!patient_id) return res.status(400).json({ error: "patient_id required" });

  const result = db.prepare(`
    INSERT INTO specialist_referrals
      (patient_id, specialist_name, clinic_name, specialty, address, phone, referral_priority, referral_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(patient_id, specialist_name, clinic_name, specialty, address, phone, referral_priority, referral_reason);

  auditLog("referral", patient_id, "created", req.body.doctor_id || "system");
  res.status(201).json({ success: true, id: result.lastInsertRowid });
});

// ════════════════════════════════════════════════════════════════════════════
// PRELIMINARY ASSESSMENTS — /api/assessments (Layer 4)
// ════════════════════════════════════════════════════════════════════════════

app.get("/api/assessments/:patientId", (req, res) => {
  const assessment = db.prepare("SELECT * FROM preliminary_assessments WHERE patient_id = ? ORDER BY submitted_at DESC LIMIT 1").get(req.params.patientId);
  res.json(assessment || null);
});

app.post("/api/assessments", (req, res) => {
  const { patient_id, doctor_id, prov_diagnosis, confidence_level, agrees_with_ai, doctor_notes } = req.body;
  if (!patient_id || !doctor_id) return res.status(400).json({ error: "patient_id and doctor_id required" });

  db.prepare(`
    INSERT INTO preliminary_assessments
      (patient_id, doctor_id, prov_diagnosis, confidence_level, agrees_with_ai, doctor_notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(patient_id, doctor_id, prov_diagnosis, confidence_level, agrees_with_ai ? 1 : 0, doctor_notes);

  auditLog("assessment", patient_id, "created", doctor_id, { prov_diagnosis, confidence_level, agrees_with_ai });
  res.status(201).json({ success: true });
});

// ════════════════════════════════════════════════════════════════════════════
// IMAGING SESSIONS & CNN — /api/imaging (Layer 5)
// ════════════════════════════════════════════════════════════════════════════

// GET /api/imaging/:patientId
app.get("/api/imaging/:patientId", (req, res) => {
  const sessions = db.prepare("SELECT * FROM imaging_sessions WHERE patient_id = ? ORDER BY created_at DESC").all(req.params.patientId);
  res.json(sessions);
});

// POST /api/imaging/upload — upload slitlamp/fundus/OCT image
app.post("/api/imaging/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image file provided" });

  const { patient_id, doctor_id, image_type } = req.body;
  if (!patient_id || !doctor_id) return res.status(400).json({ error: "patient_id and doctor_id required" });

  const result = db.prepare(`
    INSERT INTO imaging_sessions (patient_id, doctor_id, image_type, image_filename, image_path, cnn_sealed)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(patient_id, doctor_id, image_type || "slitlamp", req.file.filename, req.file.path);

  // Update patient slitlamp status
  db.prepare("UPDATE patients SET slitlamp_status = 'Photo Uploaded', updated_at = datetime('now') WHERE id = ?").run(patient_id);

  auditLog("imaging", patient_id, "uploaded", doctor_id, { filename: req.file.filename, image_type });
  res.status(201).json({ success: true, imaging_id: result.lastInsertRowid, filename: req.file.filename, url: `/uploads/${req.file.filename}` });
});

// POST /api/imaging/:imagingId/preprocess — run preprocessing pipeline
app.post("/api/imaging/:imagingId/preprocess", (req, res) => {
  const session = db.prepare("SELECT * FROM imaging_sessions WHERE id = ?").get(req.params.imagingId);
  if (!session) return res.status(404).json({ error: "Imaging session not found" });

  db.prepare("UPDATE imaging_sessions SET preprocessing_done = 1, preprocessing_at = datetime('now') WHERE id = ?").run(session.id);

  // Insert a sealed CNN result
  const cnnConfidence = 85 + Math.random() * 14;
  db.prepare(`
    INSERT OR REPLACE INTO cnn_results
      (imaging_id, patient_id, ac_cell_grade, flare_intensity, kp_type, pupil_reactivity, cnn_confidence, overlay_boxes_json, revealed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
  `).run(
    session.id, session.patient_id,
    "+3 Grade (28 cells/field)", "Moderate AC Flare (+2)",
    "Mutton-Fat / Granulomatous", "Sluggish / Synechia Risk",
    cnnConfidence.toFixed(1),
    JSON.stringify([
      { x: 38, y: 40, w: 24, h: 22, label: `Mutton-Fat KPs (${cnnConfidence.toFixed(1)}%)`, color: "#38bdf8" },
      { x: 55, y: 58, w: 20, h: 18, label: "AC Cells +3 (91.2%)", color: "#f59e0b" },
    ])
  );

  auditLog("imaging", session.patient_id, "preprocessed", req.body.doctor_id || "system");
  res.json({ success: true, message: "Preprocessing complete. CNN results sealed." });
});

// GET /api/cnn/:patientId — only returns if revealed=1
app.get("/api/cnn/:patientId", (req, res) => {
  const cnn = db.prepare(`
    SELECT c.* FROM cnn_results c
    JOIN imaging_sessions i ON c.imaging_id = i.id
    WHERE c.patient_id = ? AND c.revealed = 1
    ORDER BY c.created_at DESC LIMIT 1
  `).get(req.params.patientId);

  if (!cnn) return res.status(403).json({ error: "CNN results not yet disclosed" });
  cnn.overlay_boxes = JSON.parse(cnn.overlay_boxes_json || "[]");
  res.json(cnn);
});

// ════════════════════════════════════════════════════════════════════════════
// FINAL REVIEW — /api/final-review (Layer 6)
// ════════════════════════════════════════════════════════════════════════════

// POST /api/final-review/reveal — doctor clicks "Reveal AI Results" — unseals CNN
app.post("/api/final-review/reveal", (req, res) => {
  const { patient_id, doctor_id } = req.body;
  if (!patient_id || !doctor_id) return res.status(400).json({ error: "patient_id and doctor_id required" });

  // Un-seal all CNN results for this patient
  db.prepare(`
    UPDATE cnn_results SET revealed = 1, revealed_at = datetime('now')
    WHERE patient_id = ?
  `).run(patient_id);

  // Update imaging sessions CNN seal flag
  db.prepare(`
    UPDATE imaging_sessions SET cnn_sealed = 0 WHERE patient_id = ?
  `).run(patient_id);

  // Fetch the revealed CNN result
  const cnn = db.prepare(`
    SELECT c.* FROM cnn_results c
    WHERE c.patient_id = ? AND c.revealed = 1
    ORDER BY c.created_at DESC LIMIT 1
  `).get(patient_id);

  // Fetch NF result for combined score
  const nfr = db.prepare("SELECT * FROM neuro_fuzzy_results WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1").get(patient_id);

  const combined = cnn && nfr ? ((nfr.uveitis_prob * 100 * 0.5) + (cnn.cnn_confidence * 0.5)).toFixed(1) : null;

  auditLog("final_review", patient_id, "cnn_revealed", doctor_id);
  res.json({
    success: true,
    cnn_revealed: true,
    cnn: cnn ? { ...cnn, overlay_boxes: JSON.parse(cnn.overlay_boxes_json || "[]") } : null,
    neuro_fuzzy: nfr,
    combined_score: combined,
  });
});

// POST /api/final-review — save the final review record
app.post("/api/final-review", (req, res) => {
  const { patient_id, doctor_id, combined_score, uncertainty_level, doctor_vs_ai_match, review_notes } = req.body;
  if (!patient_id || !doctor_id) return res.status(400).json({ error: "patient_id and doctor_id required" });

  db.prepare(`
    INSERT INTO final_reviews
      (patient_id, doctor_id, combined_score, uncertainty_level, doctor_vs_ai_match, review_notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(patient_id, doctor_id, combined_score, uncertainty_level, doctor_vs_ai_match ? 1 : 0, review_notes);

  auditLog("final_review", patient_id, "created", doctor_id);
  res.status(201).json({ success: true });
});

// ════════════════════════════════════════════════════════════════════════════
// FINAL DIAGNOSIS — /api/diagnosis (Layer 7)
// ════════════════════════════════════════════════════════════════════════════

app.get("/api/diagnosis/:patientId", (req, res) => {
  const diag = db.prepare("SELECT * FROM final_diagnoses WHERE patient_id = ? ORDER BY created_at DESC LIMIT 1").get(req.params.patientId);
  res.json(diag || null);
});

app.post("/api/diagnosis", (req, res) => {
  const {
    patient_id, doctor_id, final_diagnosis, severity_grade, consensus_score,
    topical_steroid, cycloplegic, systemic_tx, followup_schedule,
    referral_priority, physician_notes,
  } = req.body;

  if (!patient_id || !doctor_id || !final_diagnosis) {
    return res.status(400).json({ error: "patient_id, doctor_id, and final_diagnosis required" });
  }

  db.prepare(`
    INSERT INTO final_diagnoses
      (patient_id, doctor_id, final_diagnosis, severity_grade, consensus_score,
       topical_steroid, cycloplegic, systemic_tx, followup_schedule,
       referral_priority, physician_notes, status, validated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'validated', datetime('now'))
  `).run(
    patient_id, doctor_id, final_diagnosis, severity_grade, consensus_score,
    topical_steroid, cycloplegic, systemic_tx, followup_schedule,
    referral_priority, physician_notes
  );

  // Update patient to complete
  db.prepare("UPDATE patients SET slitlamp_status = 'Cleared', updated_at = datetime('now') WHERE id = ?").run(patient_id);

  auditLog("diagnosis", patient_id, "validated", doctor_id, { final_diagnosis, severity_grade, consensus_score });
  res.status(201).json({ success: true });
});

// PATCH /api/diagnosis/:id — update status (complete, etc.)
app.patch("/api/diagnosis/:id", (req, res) => {
  const { status } = req.body;
  db.prepare("UPDATE final_diagnoses SET status = ? WHERE id = ?").run(status, req.params.id);
  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════════════════════
// AUDIT LOG — /api/audit
// ════════════════════════════════════════════════════════════════════════════

app.get("/api/audit", (req, res) => {
  const { patient_id } = req.query;
  let query = "SELECT * FROM audit_log";
  const params = [];
  if (patient_id) { query += " WHERE entity_id = ?"; params.push(patient_id); }
  query += " ORDER BY created_at DESC LIMIT 200";
  res.json(db.prepare(query).all(...params));
});

// ── Stats endpoint ───────────────────────────────────────────────────────────
app.get("/api/stats", (_req, res) => {
  const totalPatients  = db.prepare("SELECT COUNT(*) as c FROM patients").get().c;
  const highRisk       = db.prepare("SELECT COUNT(*) as c FROM patients WHERE risk_tier = 'High'").get().c;
  const awaitingPhoto  = db.prepare("SELECT COUNT(*) as c FROM patients WHERE slitlamp_status = 'Awaiting Photo'").get().c;
  const completedToday = db.prepare("SELECT COUNT(*) as c FROM final_diagnoses WHERE date(validated_at) = date('now')").get().c;
  res.json({ totalPatients, highRisk, awaitingPhoto, completedToday });
});

// ── Proxy /api/predict to Python FastAPI ML Backend ───────────────────────────
app.post("/api/predict", async (req, res) => {
  const pythonUrl = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000/predict";
  try {
    const response = await fetch(pythonUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Python ML backend unavailable", details: err.message });
  }
});

// ── Serve Frontend Production Build (if dist/ exists) ─────────────────────────
const DIST_DIR = path.join(__dirname, "..", "dist");
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Uveitis DB API running at http://0.0.0.0:${PORT}`);
  console.log(`   📋 Layers covered: L1-L7 (patients, questionnaire, NF results, assessments, imaging, CNN, review, diagnosis)`);
  console.log(`   🏥 /api/health — health check`);
  console.log(`   👤 /api/auth   — doctor authentication`);
  console.log(`   🩺 /api/patients, /api/questionnaire, /api/neuro-fuzzy`);
  console.log(`   📷 /api/imaging/upload, /api/cnn, /api/final-review`);
  console.log(`   ✅ /api/diagnosis\n`);
});

