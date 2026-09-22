/**
 * End-to-End Clinical Workflow Test
 * Tests all major features of the Uveitis AI Diagnosis System
 */

const http = require('http');

let PASS = 0;
let FAIL = 0;

function assert(condition, label, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    PASS++;
  } else {
    console.log(`  ❌ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    FAIL++;
  }
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  🏥  Uveitis AI — Clinical Workflow E2E Test Suite   ');
  console.log('══════════════════════════════════════════════════════\n');

  // ─── [1] Health Check ──────────────────────────────────────────
  console.log('[Step 1] API Health Check');
  const health = await makeRequest('GET', '/api/health');
  assert(health.status === 200, 'Server is healthy', `Status: ${health.status}`);

  // ─── [2] Doctor Listing ────────────────────────────────────────
  console.log('\n[Step 2] Doctor Registry');
  const doctors = await makeRequest('GET', '/api/auth/doctors');
  assert(doctors.status === 200, 'GET /api/auth/doctors returns 200');
  assert(Array.isArray(doctors.body) && doctors.body.length >= 5, 'At least 5 doctors registered');
  const juniorDoc = doctors.body.find(d => d.id === 'DR-AG-04');
  const seniorDoc = doctors.body.find(d => d.id === 'DR-AG-01');
  const colleagueDoc = doctors.body.find(d => d.id === 'DR-AG-02');
  const unrelatedDoc = doctors.body.find(d => d.id === 'DR-AG-03');
  assert(!!juniorDoc, 'DR-AG-04 (Junior Specialist) found');
  assert(!!seniorDoc, 'DR-AG-01 (Senior Consultant) found');

  // ─── [3] Patient Intake (0/Normal Defaults) ─────────────────────
  console.log('\n[Step 3] Patient Intake — Unified Sync (POST /api/patient-intake)');
  const patientId = `PT-E2E-${Date.now().toString().slice(-5)}`;
  const intake = await makeRequest('POST', '/api/patient-intake', {
    patient: {
      id: patientId,
      name: 'E2E TestPatient Normal',
      age: 30,
      sex: 'Female',
      phone: '+91 99999 00001',
      affected_eye: 'Left Eye',
      onset_type: 'Gradual',
      symptom_duration_days: 1,
    },
    answers: {
      // ALL 0 / normal defaults
      pain_score: 0,
      redness_score: 0,
      photophobia_impact: 0,
      floaters: 'None',
      vision_blur: 'None',
      onset_speed: 'Gradual',
      prior_episodes: 'Never',
      systemic_flags: [],
    },
    prediction: {
      uveitis_prob: 0.12,
      clinical_risk: 'Low',
      severity_class: 'Low Probability of Uveitis',
      severity_score: 10.8,
      fuzzy_indices: { urgency: 0.12, inflammation: 0.08, visual: 0.05, autoimmune: 0.02 },
      explanation: ['Low-risk profile. No significant clinical features detected.'],
    },
    question_xai: [
      { feature: 'Pain Score (0/10)', impact: 0, category: 'Ocular', detail: 'No anterior ciliary spasm' },
      { feature: 'Redness Score (0/10)', impact: 0, category: 'Ocular', detail: 'No conjunctival injection' },
    ],
    referral: {
      doctor_id: 'DR-AG-04',
      doctor_name: 'Dr. Anand Parthasarathy',
      clinic_name: "Dr. Agarwal Eye Hospital, Adyar",
    },
  });
  assert(intake.status === 201, 'Patient intake created (201)', JSON.stringify(intake.body).slice(0, 120));
  assert(intake.body.patient_id === patientId, `Correct patient ID returned: ${intake.body.patient_id}`);

  // ─── [4] Junior Doctor Views Patient — AI Prediction Sealed ─────
  console.log('\n[Step 4] Junior Doctor (DR-AG-04) Views Patient — AI Should Be Sealed');
  const juniorView = await makeRequest('GET', `/api/patients/${patientId}?doctor_id=DR-AG-04`);
  assert(juniorView.status === 200, 'Junior doctor can access assigned patient (200)');
  assert(juniorView.body.ai_prediction_sealed !== false, 'AI subtype prediction is sealed for junior doctor');

  // ─── [5] Unauthorized Doctor Denied ────────────────────────────
  console.log('\n[Step 5] Data Isolation — DR-AG-03 (Unrelated Doctor) Denied Access');
  const unauthorized = await makeRequest('GET', `/api/patients/${patientId}?doctor_id=DR-AG-03`);
  assert(unauthorized.status === 403, `DR-AG-03 receives 403 Forbidden (got ${unauthorized.status})`);

  // ─── [6] Clinical Imaging Upload — Junior (Stays Sealed) ────────
  console.log('\n[Step 6] Junior Uploads Clinical Imaging — Prediction Still Sealed');
  const imagingRes = await makeRequest('POST', `/api/patients/${patientId}/clinical-imaging`, {
    doctor_id: 'DR-AG-04',
    image_type: 'slitlamp',
    image_url: 'slitlamp_test_scan.jpg',
    clinical_notes: 'Slit beam — 2+ AC cells, fine KPs visible.'
  });
  assert(imagingRes.status === 200, 'Clinical imaging endpoint responds 200');
  assert(imagingRes.body.is_senior === false, 'Correctly identified as junior doctor');
  assert(imagingRes.body.sealed_for_junior === 1 || imagingRes.body.sealed_for_junior === true, 'Prediction sealed for junior after imaging upload');
  assert(imagingRes.body.ai_prediction === null, 'AI prediction NOT returned to junior (null)');

  // ─── [7] Junior "Feature It First" Submission ───────────────────
  console.log('\n[Step 7] Junior Doctor Submits Clinical Features (Unseal Gate)');
  const juniorFeature = await makeRequest('POST', `/api/patients/${patientId}/junior-feature-submission`, {
    doctor_id: 'DR-AG-04',
    ac_cells: '2+ (11–20 cells/field)',
    flare: '1+ (Faint, mild protein turbidity)',
    kp_morphology: 'Fine/stellate KPs (non-granulomatous)',
    pupil_reactivity: 'Normal reactive, no posterior synechiae',
    provisional_subtype: 'Anterior Uveitis (HLA-B27 negative pattern)',
    clinical_notes: 'Patient presents with circumcorneal injection. AC moderate depth. No vitreous haze.'
  });
  assert(juniorFeature.status === 200, 'Junior feature submission responds 200');
  assert(!!juniorFeature.body.success, 'Feature submission successful');
  assert(!!juniorFeature.body.ai_prediction, 'AI subtype prediction now revealed in response');
  assert(!!juniorFeature.body.junior_annotations, 'Junior annotations saved and returned');

  // Verify patient status updated to pending_senior_review
  const afterFeature = await makeRequest('GET', `/api/patients/${patientId}?doctor_id=DR-AG-04`);
  assert(afterFeature.body.case_status === 'pending_senior_review', `Patient status = pending_senior_review (got: ${afterFeature.body.case_status})`);

  // ─── [8] Senior Supervisor Sees Junior's Case ────────────────────
  console.log('\n[Step 8] Senior Supervisor (DR-AG-01) Views Supervised Junior Cases');
  const seniorQueue = await makeRequest('GET', `/api/patients?doctor_id=DR-AG-01&scope=supervised`);
  assert(seniorQueue.status === 200, 'Senior queue responds 200');
  const foundInSupervised = Array.isArray(seniorQueue.body) && seniorQueue.body.some(p => p.id === patientId);
  // If body is wrapped in { patients: [] }:
  const seniorPatients = Array.isArray(seniorQueue.body) ? seniorQueue.body : (seniorQueue.body.patients || []);
  const foundCase = seniorPatients.some(p => p.id === patientId);
  assert(foundCase, 'Patient pending_senior_review found in senior supervisor queue');

  // ─── [9] Senior Approves & Ratifies ─────────────────────────────
  console.log('\n[Step 9] Senior Consultant (DR-AG-01) Ratifies Junior Evaluation');
  const seniorApproval = await makeRequest('POST', `/api/patients/${patientId}/senior-approve`, {
    doctor_id: 'DR-AG-01',
    decision: 'approve',
    senior_notes: 'Excellent junior assessment. Anterior Uveitis confirmed. Starting Pred Forte 1% q1h + Homatropine 2% BID. Review in 1 week.'
  });
  assert(seniorApproval.status === 200, 'Senior approval responds 200');
  assert(!!seniorApproval.body.success, 'Senior approval marked successful');

  // Confirm case_status = senior_ratified
  const afterApproval = await makeRequest('GET', `/api/patients/${patientId}?doctor_id=DR-AG-01`);
  assert(afterApproval.body.case_status === 'senior_ratified', `Case status = senior_ratified (got: ${afterApproval.body.case_status})`);

  // ─── [10] Cross-Doctor Referral ─────────────────────────────────
  console.log('\n[Step 10] Cross-Doctor Referral — DR-AG-01 Refers to DR-AG-02');
  const referral = await makeRequest('POST', `/api/patients/${patientId}/refer-doctor`, {
    from_doctor_id: 'DR-AG-01',
    to_doctor_id: 'DR-AG-02',
    referral_reason: 'Second-opinion: Considering immunomodulatory therapy for recurrent anterior uveitis.',
    priority: 'Routine / Elective'
  });
  assert(referral.status === 200, 'Referral endpoint responds 200');
  assert(!!referral.body.success, 'Referral acknowledged successful');
  assert(referral.body.referred_to?.id === 'DR-AG-02', `Correct referred doctor: ${referral.body.referred_to?.id}`);

  // Referred doctor (DR-AG-02) can now access full dossier
  const referredAccess = await makeRequest('GET', `/api/patients/${patientId}?doctor_id=DR-AG-02`);
  assert(referredAccess.status === 200, 'Referred doctor DR-AG-02 can access patient (200)');
  assert(!!referredAccess.body.id, 'Patient dossier fully available to referred doctor');

  // Unrelated doctor STILL can't access even after referral
  const stillDenied = await makeRequest('GET', `/api/patients/${patientId}?doctor_id=DR-AG-03`);
  assert(stillDenied.status === 403, `DR-AG-03 still denied (${stillDenied.status} === 403)`);

  // ─── [11] Case Closure (Path A) ─────────────────────────────────
  console.log('\n[Step 11] Case Closure (Path A — Discharge)');
  const closeCase = await makeRequest('POST', `/api/patients/${patientId}/close-case`, {
    doctor_id: 'DR-AG-02',
    reason: 'Uveitis fully resolved. Quiescent. Discharged to 3-month routine follow-up.',
    discharge_summary: 'AC cleared. IOP 14 mmHg OU. Tapering steroids over 4 weeks.'
  });
  assert(closeCase.status === 200, 'Close-case endpoint responds 200');
  assert(!!closeCase.body.success, 'Case closure acknowledged');

  // Confirm closed status
  const afterClose = await makeRequest('GET', `/api/patients/${patientId}?doctor_id=DR-AG-02`);
  assert(afterClose.body.case_status === 'closed', `Patient status = closed (got: ${afterClose.body.case_status})`);

  // ─── Results ─────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${PASS} passed, ${FAIL} failed`);
  if (FAIL === 0) {
    console.log('  🎉  ALL TESTS PASSED — System ready for clinical use!');
  } else {
    console.log('  ⚠️   SOME TESTS FAILED — See above for details.');
  }
  console.log('══════════════════════════════════════════════════════\n');
  process.exit(FAIL > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('💥 Test runner crashed:', err);
  process.exit(1);
});
