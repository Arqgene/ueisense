// test_sqlite_sync.js
const path = require("path");
const db = require("./db.js");

console.log("=== Testing SQLite DB & Schema ===");

// 1. Check doctors table
const doctors = db.prepare("SELECT * FROM doctors").all();
console.log(`✓ Doctors in SQLite DB: ${doctors.length}`);
doctors.forEach(d => console.log(`  - [${d.id}] ${d.name} (${d.clinic_name})`));

// 2. Insert test patient intake directly using SQLite to verify integrity
const testPatientId = "PT-TEST-AARAV";
const testDoc = doctors[0]; // Dr. Soundari S.

db.prepare(`
  INSERT OR REPLACE INTO patients
    (id, name, age, sex, phone, affected_eye, symptom_start, onset_type,
     risk_tier, uveitis_prob, urgency_index, severity_class, slitlamp_status,
     assigned_doctor_id, assigned_doctor_name, hospital_branch, image_url, submitted_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`).run(
  testPatientId,
  "Aarav Sharma",
  38,
  "Male",
  "+91 98402 11223",
  "Left Eye",
  "2 days ago",
  "Sudden",
  "High",
  95,
  88,
  "Severe Acute Anterior Uveitis",
  "Photo Uploaded",
  testDoc.id,
  testDoc.name,
  testDoc.clinic_name,
  "sample-slitlamp-kp"
);
console.log("✓ Inserted test patient Aarav Sharma");

// 3. Insert questionnaire answers
const testAnswers = {
  section1: {
    affected_eye: "Left Eye",
    symptom_duration_days: 2,
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
    swelling: "No",
    headache: "Yes",
    bright_light_worsening: "Yes",
    hazy_vision: "Yes",
  },
  section4: {
    autoimmune_disease: "Yes",
    joint_pain: "Yes",
    fever: "No",
  }
};

db.prepare(`
  INSERT OR REPLACE INTO questionnaire_answers (patient_id, section, answers_json)
  VALUES (?, ?, ?)
`).run(testPatientId, "full_intake", JSON.stringify(testAnswers));
console.log("✓ Inserted questionnaire answers for Aarav Sharma");

// 4. Insert Neuro-Fuzzy Question XAI
const featureImportance = [
  { feature: "Severe Photophobia (9/10)", impact: 94, category: "Ocular", detail: "Spasm of ciliary body / iris sphincter" },
  { feature: "Perilimbal Redness (9/10)", impact: 88, category: "Ocular", detail: "Perilimbal vascular injection" },
  { feature: "Active Autoimmune Co-morbidity", impact: 84, category: "Systemic", detail: "HLA-B27 correlation with joint stiffness" },
  { feature: "Sudden Onset < 48 Hours", impact: 80, category: "Onset", detail: "Acute severe presentation" },
];

db.prepare(`
  INSERT OR REPLACE INTO neuro_fuzzy_results
    (patient_id, uveitis_prob, uveitis_yes_no, severity_score, severity_class,
     clinical_risk, inflammation_idx, visual_idx, autoimmune_idx, infectious_idx,
     recurrence_idx, urgency_idx, explanation_json, uncertainty_score, feature_importance_json)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  testPatientId,
  0.95,
  1,
  88.5,
  "Severe Acute Anterior Uveitis",
  "High",
  0.92,
  0.78,
  0.85,
  0.15,
  0.30,
  0.88,
  JSON.stringify(["High-confidence prediction under Dr. Agarwal's Guidelines", "Acute photophobia flags anterior chamber cellularity"]),
  5.5,
  JSON.stringify(featureImportance)
);
console.log("✓ Inserted Neuro-Fuzzy Question XAI for Aarav Sharma");

// 5. Insert Slitlamp Grad-CAM XAI
const imgResult = db.prepare(`
  INSERT INTO imaging_sessions
    (patient_id, doctor_id, image_type, image_filename, image_path, preprocessing_done, preprocessing_at, cnn_sealed)
  VALUES (?, ?, ?, ?, ?, 1, datetime('now'), 0)
`).run(testPatientId, testDoc.id, "Slitlamp Biomicroscopy", "aarav_slitlamp.jpg", "sample-slitlamp-kp");

const gradcamData = {
  hotspots: [
    { x: 48, y: 50, radius: 32, intensity: 0.96, label: "Endothelial Inflammatory Precipitates" },
    { x: 38, y: 36, radius: 24, intensity: 0.88, label: "Ciliary Hyperemia Margin" },
    { x: 62, y: 62, radius: 20, intensity: 0.81, label: "Anterior Chamber Tyndall Flare" }
  ],
  confidence: "96.4",
  layer: "vit_b_16_encoder_block_11"
};

const overlayBoxes = [
  { x: 36, y: 38, w: 26, h: 24, label: "Mutton-Fat KPs (96.4%)", color: "#38bdf8" },
  { x: 54, y: 56, w: 22, h: 20, label: "AC Cells +3 (91.2%)", color: "#f59e0b" }
];

db.prepare(`
  INSERT OR REPLACE INTO cnn_results
    (imaging_id, patient_id, ac_cell_grade, flare_intensity, kp_type, pupil_reactivity, cnn_confidence, overlay_boxes_json, gradcam_data_json, revealed, revealed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
`).run(
  imgResult.lastInsertRowid,
  testPatientId,
  "+3 Grade (28 cells/field)",
  "Moderate AC Flare (+2)",
  "Mutton-Fat / Granulomatous KPs",
  "Sluggish / Synechia Risk",
  "96.4",
  JSON.stringify(overlayBoxes),
  JSON.stringify(gradcamData)
);
console.log("✓ Inserted Slitlamp Grad-CAM XAI for Aarav Sharma");

// 6. Verify querying patient under Doctor's ID (DR-AG-01)
const docPatients = db.prepare("SELECT * FROM patients WHERE assigned_doctor_id = ?").all(testDoc.id);
console.log(`✓ Patients retrieved for doctor ${testDoc.name} (${testDoc.id}): ${docPatients.length}`);
const aarav = docPatients.find(p => p.id === testPatientId);
console.log(`  Found patient: ${aarav.name} (Risk: ${aarav.risk_tier}, Uveitis Prob: ${aarav.uveitis_prob}%, Hospital: ${aarav.hospital_branch})`);

// 7. Verify retrieving full XAI and questionnaire data
const qa = db.prepare("SELECT * FROM questionnaire_answers WHERE patient_id = ?").all(testPatientId);
const nfr = db.prepare("SELECT * FROM neuro_fuzzy_results WHERE patient_id = ?").get(testPatientId);
const cnn = db.prepare("SELECT * FROM cnn_results WHERE patient_id = ?").get(testPatientId);

console.log(`✓ Verification Summary for ${aarav.name}:`);
console.log(`  - Questionnaire answers saved: ${qa.length} row(s)`);
console.log(`  - Question Model XAI feature count: ${JSON.parse(nfr.feature_importance_json).length}`);
console.log(`  - Slitlamp Grad-CAM hotspots count: ${JSON.parse(cnn.gradcam_data_json).hotspots.length}`);
console.log(`  - AC Cell Grade: ${cnn.ac_cell_grade}`);
console.log(`  - AC Flare Intensity: ${cnn.flare_intensity}`);
console.log("=== ALL SQLITE SYNC TESTS PASSED! ===");
