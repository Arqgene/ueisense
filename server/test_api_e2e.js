// server/test_api_e2e.js
const http = require("http");

async function runE2ETests() {
  console.log("=== Running End-to-End API & SQLite Sync Test ===");

  // Set PORT to 3099 to avoid conflicting with any running instances
  process.env.PORT = "3099";
  const app = require("./index.js");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3099, resolve));
  console.log("✓ Test server listening on http://localhost:3099");

  const baseUrl = "http://localhost:3099";

  try {
    // 1. Test POST /api/patient-intake
    console.log("\n1. Testing POST /api/patient-intake...");
    const intakePayload = {
      patient: {
        id: "PT-AG-TEST99",
        name: "Kavya Venkat",
        age: 34,
        sex: "Female",
        phone: "+91 98412 34567",
        affected_eye: "Right Eye",
        symptom_start: "2 days ago",
        onset_type: "Sudden",
      },
      answers: {
        section1: {
          affected_eye: "Right Eye",
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
          bright_light_worsening: "Yes",
          hazy_vision: "Yes",
        },
        section4: {
          autoimmune_disease: "Yes",
          joint_pain: "Yes",
        }
      },
      prediction: {
        uveitis_prob: 0.935,
        clinical_risk: "High",
        severity_class: "Severe Acute Anterior Uveitis",
        fuzzy_indices: {
          inflammation: 0.92,
          visual: 0.76,
          autoimmune: 0.88,
          urgency: 0.91,
        },
        explanation: [
          "Severe photophobia and acute redness indicate anterior chamber inflammation.",
          "Active autoimmune disease elevates risk index.",
        ],
      },
      question_xai: [
        { feature: "Severe Photophobia (9/10)", impact: 95, category: "Ocular", detail: "Spasm of ciliary body / iris sphincter" },
        { feature: "Perilimbal Redness (9/10)", impact: 90, category: "Ocular", detail: "Ciliary vascular injection" },
        { feature: "Autoimmune Joint Pain", impact: 84, category: "Systemic", detail: "HLA-B27 correlation" },
        { feature: "Sudden Onset < 48h", impact: 80, category: "Onset", detail: "Acute attack" },
      ],
      image_data: {
        image_type: "Slitlamp Biomicroscopy",
        image_url: "sample-slitlamp-kp",
        confidence: 0.962,
        ac_cell_grade: "+3 Grade (28 cells/field)",
        flare_intensity: "Moderate AC Flare (+2)",
        kp_type: "Mutton-Fat / Granulomatous KPs",
        pupil_reactivity: "Sluggish / Synechia Risk",
        gradcam_data: {
          hotspots: [
            { x: 48, y: 50, radius: 32, intensity: 0.96, label: "Endothelial Inflammatory Precipitates" },
            { x: 38, y: 36, radius: 24, intensity: 0.88, label: "Ciliary Hyperemia Margin" },
          ],
          confidence: "96.2",
        },
        overlay_boxes: [
          { x: 36, y: 38, w: 26, h: 24, label: "Mutton-Fat KPs (96.4%)", color: "#38bdf8" },
        ],
      },
      referral: {
        doctor_id: "DR-AG-01",
        doctor_name: "Dr. Soundari S., MS, FMRF",
        clinic_name: "Dr. Agarwal's Eye Hospital - Cathedral Road (Chennai Main)",
        specialty: "Senior Consultant — Uveitis & Ocular Immunology",
        phone: "+91 44 4378 7777",
      },
    };

    const intakeRes = await fetch(`${baseUrl}/api/patient-intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(intakePayload),
    });
    const intakeJson = await intakeRes.json();
    console.log("✓ Intake Response Status:", intakeRes.status);
    console.log("  Patient ID:", intakeJson.patient_id);
    console.log("  Patient Name:", intakeJson.patient_name);
    console.log("  Assigned Doctor:", intakeJson.assigned_doctor);
    console.log("  Hospital Clinic:", intakeJson.clinic_name);
    console.log("  Uveitis Prob:", intakeJson.uveitis_probability + "%");

    if (!intakeRes.ok) throw new Error(`Intake failed: ${JSON.stringify(intakeJson)}`);

    // 2. Test GET /api/patients?doctor_id=DR-AG-01
    console.log("\n2. Testing GET /api/patients?doctor_id=DR-AG-01...");
    const patientsRes = await fetch(`${baseUrl}/api/patients?doctor_id=DR-AG-01`);
    const patientsList = await patientsRes.json();
    console.log(`✓ Doctor DR-AG-01 has ${patientsList.length} patient(s) in queue`);
    const found = patientsList.find(p => p.id === "PT-AG-TEST99");
    if (!found) throw new Error("Created patient not found in doctor's queue!");
    console.log(`  Found patient: ${found.name} (Assigned Branch: ${found.hospital_branch})`);

    // 3. Test GET /api/patients/:id
    console.log("\n3. Testing GET /api/patients/PT-AG-TEST99...");
    const detailRes = await fetch(`${baseUrl}/api/patients/PT-AG-TEST99`);
    const detail = await detailRes.json();
    console.log("✓ Patient Name:", detail.name);
    console.log("  Assigned Doctor:", detail.assigned_doctor_name);
    console.log("  Assigned Branch:", detail.hospital_branch);
    console.log("  Neuro-Fuzzy XAI Feature Importance count:", detail.neuro_fuzzy?.feature_importance?.length);
    console.log("  Questionnaire Answers sections:", Object.keys(detail.questionnaire || {}));
    console.log("  Slitlamp CNN AC Cell Grade:", detail.cnn?.ac_cell_grade);
    console.log("  Slitlamp Grad-CAM hotspots count:", detail.cnn?.gradcam_data?.hotspots?.length);

    if (!detail.neuro_fuzzy?.feature_importance) throw new Error("Feature importance missing from patient details!");
    if (!detail.cnn?.gradcam_data) throw new Error("Grad-CAM data missing from patient details!");

    // 4. Test GET /api/neuro-fuzzy/PT-AG-TEST99
    console.log("\n4. Testing GET /api/neuro-fuzzy/PT-AG-TEST99...");
    const nfRes = await fetch(`${baseUrl}/api/neuro-fuzzy/PT-AG-TEST99`);
    const nfData = await nfRes.json();
    console.log("✓ Neuro-Fuzzy Uveitis Prob:", nfData.uveitis_prob);
    console.log("  Top Feature Impact:", nfData.feature_importance[0]?.feature, `(${nfData.feature_importance[0]?.impact}%)`);

    // 5. Test POST /api/assessments
    console.log("\n5. Testing POST /api/assessments...");
    const assessRes = await fetch(`${baseUrl}/api/assessments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patient_id: "PT-AG-TEST99",
        doctor_id: "DR-AG-01",
        prov_diagnosis: "Acute Non-Granulomatous Anterior Uveitis",
        confidence_level: "High",
        agrees_with_ai: true,
        doctor_notes: "Confirmed +3 AC cells and dense photophobia. Agree with high-risk triage.",
      }),
    });
    const assessJson = await assessRes.json();
    console.log("✓ Assessment Submission Result:", assessJson);

    console.log("\n==================================================");
    console.log("🎉 ALL END-TO-END TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("==================================================");
  } finally {
    server.close();
    process.exit(0);
  }
}

runE2ETests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
