import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { patientsApi, statsApi } from "../api/client.js";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Camera,
  ChevronRight,
  Activity,
  Shield,
  Eye,
  LogOut,
  Stethoscope,
  Sparkles,
  ArrowUpRight,
  MapPin,
  Phone,
  UserCheck,
  Building2,
  RefreshCw,
} from "lucide-react";
import DoctorNavbar from "../components/DoctorNavbar.jsx";
import Footer from "../components/Footer.jsx";
import { formatPercent, normalizePatient } from "../utils/formatters.js";
import { AGARWAL_CENTERS } from "../utils/agarwalCenters.js";
import "../styles/doctor.css";

export const samplePatients = [
  {
    id: "PT-8942",
    name: "Sarah Jenkins",
    age: 42,
    sex: "Female",
    phone: "+91 98401 23456",
    assigned_doctor_id: "DR-AG-01",
    assigned_doctor_name: "Dr. Soundari S., MS, FMRF",
    hospital_branch: "Dr. Agarwal's Eye Hospital - Cathedral Road (Chennai Main)",
    affectedEye: "Left Eye",
    symptomStart: "2 days ago",
    onset: "Sudden",
    riskTier: "High",
    uveitisProbability: 94.2,
    urgencyIndex: 88,
    severityClass: "Severe Acute Anterior Uveitis",
    rednessScore: 9,
    painScore: 8,
    photophobiaScore: 9,
    blurredScore: 7,
    autoimmuneFlag: true,
    priorUveitis: false,
    slitlampStatus: "Photo Uploaded",
    submittedAt: "12 mins ago",
    primarySymptoms: ["Severe Photophobia", "Deep Eye Pain 8/10", "Acute Ciliary Flush", "Floaters"],
  },
  {
    id: "PT-8945",
    name: "Robert Vance",
    age: 58,
    sex: "Male",
    phone: "+91 98840 98765",
    assigned_doctor_id: "DR-AG-02",
    assigned_doctor_name: "Dr. Ramamurthy Sundar, DNB, FRCS",
    hospital_branch: "Dr. Agarwal's Eye Hospital - Indiranagar (Bengaluru)",
    affectedEye: "Right Eye",
    symptomStart: "4 days ago",
    onset: "Sudden",
    riskTier: "High",
    uveitisProbability: 89.5,
    urgencyIndex: 82,
    severityClass: "Intermediate / Posterior Vasculitis",
    rednessScore: 7,
    painScore: 6,
    photophobiaScore: 8,
    blurredScore: 9,
    autoimmuneFlag: true,
    priorUveitis: true,
    slitlampStatus: "Photo Uploaded",
    submittedAt: "35 mins ago",
    primarySymptoms: ["Hazy Vision 9/10", "Vitritis Floaters", "Anterior Chamber Flare"],
  },
  {
    id: "PT-8939",
    name: "Amanda Chen",
    age: 31,
    sex: "Female",
    phone: "+91 94440 55432",
    assigned_doctor_id: "DR-AG-03",
    assigned_doctor_name: "Dr. V. Rajeshwari, MS",
    hospital_branch: "Dr. Agarwal's Eye Hospital - Banjara Hills (Hyderabad)",
    affectedEye: "Both Eyes",
    symptomStart: "5 days ago",
    onset: "Gradual",
    riskTier: "Moderate",
    uveitisProbability: 64.0,
    urgencyIndex: 55,
    severityClass: "Moderate Recurrent Anterior Uveitis",
    rednessScore: 5,
    painScore: 4,
    photophobiaScore: 6,
    blurredScore: 4,
    autoimmuneFlag: false,
    priorUveitis: true,
    slitlampStatus: "Photo Uploaded",
    submittedAt: "1 hr ago",
    primarySymptoms: ["Mild Glare & Halos", "Bilateral Mild Irritation", "Prior Episode 2024"],
  },
  {
    id: "PT-8935",
    name: "Michael Ross",
    age: 49,
    sex: "Male",
    phone: "+91 97900 11223",
    assigned_doctor_id: "DR-AG-04",
    assigned_doctor_name: "Dr. Anand Parthasarathy, MS, FICO",
    hospital_branch: "Dr. Agarwal's Eye Hospital - Velachery (Chennai South)",
    affectedEye: "Right Eye",
    symptomStart: "1 week ago",
    onset: "Gradual",
    riskTier: "Moderate",
    uveitisProbability: 58.2,
    urgencyIndex: 48,
    severityClass: "Post-Traumatic Mild Inflammation",
    rednessScore: 6,
    painScore: 5,
    photophobiaScore: 4,
    blurredScore: 5,
    autoimmuneFlag: false,
    priorUveitis: false,
    slitlampStatus: "Awaiting Photo",
    submittedAt: "2 hrs ago",
    primarySymptoms: ["Tearing & Irritation", "Eye Trauma History", "Moderate Redness"],
  },
  {
    id: "PT-8930",
    name: "Elena Rodriguez",
    age: 26,
    sex: "Female",
    phone: "+91 99620 44556",
    assigned_doctor_id: "DR-AG-05",
    assigned_doctor_name: "Dr. Preethi Govindarajan, MD",
    hospital_branch: "Dr. Agarwal's Eye Hospital - R.S. Puram (Coimbatore)",
    affectedEye: "Left Eye",
    symptomStart: "3 days ago",
    onset: "Gradual",
    riskTier: "Low",
    uveitisProbability: 21.0,
    urgencyIndex: 15,
    severityClass: "Low Risk / Dry Eye Strain",
    rednessScore: 2,
    painScore: 1,
    photophobiaScore: 2,
    blurredScore: 1,
    autoimmuneFlag: false,
    priorUveitis: false,
    slitlampStatus: "Cleared",
    submittedAt: "3 hrs ago",
    primarySymptoms: ["Contact Lens Strain", "Surface Dryness", "No Deep Pain"],
  },
  {
    id: "PT-8924",
    name: "David Miller",
    age: 65,
    sex: "Male",
    phone: "+91 98410 77889",
    assigned_doctor_id: "DR-AG-01",
    assigned_doctor_name: "Dr. Soundari S., MS, FMRF",
    hospital_branch: "Dr. Agarwal's Eye Hospital - Cathedral Road (Chennai Main)",
    affectedEye: "Both Eyes",
    symptomStart: "6 days ago",
    onset: "Gradual",
    riskTier: "Low",
    uveitisProbability: 18.5,
    urgencyIndex: 12,
    severityClass: "Allergic Conjunctivitis Suspicion",
    rednessScore: 3,
    painScore: 0,
    photophobiaScore: 1,
    blurredScore: 1,
    autoimmuneFlag: false,
    priorUveitis: false,
    slitlampStatus: "Cleared",
    submittedAt: "5 hrs ago",
    primarySymptoms: ["Itching & Tearing", "Bilateral Redness", "Clear Vision"],
  },
];

export default function DoctorQueue() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState("All");
  const [doctorScope, setDoctorScope] = useState("assigned"); // "assigned" | "all"
  const [dbPatients, setDbPatients] = useState(null); // null = loading
  const [dbStats, setDbStats] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Active doctor state
  const [currentDoctor, setCurrentDoctor] = useState(() => {
    try {
      const active = localStorage.getItem("activeDoctor");
      if (active) return JSON.parse(active);
    } catch {}
    return AGARWAL_CENTERS[0];
  });

  const loadPatients = (doc = currentDoctor) => {
    setIsRefreshing(true);
    // Request only cases accessible to the active doctor under strict isolation
    patientsApi
      .list({ doctor_id: doc.id })
      .then((rows) => {
        if (Array.isArray(rows)) {
          setDbPatients(rows.map(normalizePatient));
        } else {
          setDbPatients([]);
        }
      })
      .catch((err) => {
        console.warn("Could not load from API, fallback to filtered samples:", err);
        // Strict fallback isolation:
        const filtered = samplePatients.filter(
          (p) =>
            p.assigned_doctor_id === doc.id ||
            p.referred_to_doctor_id === doc.id ||
            (doc.role === "senior" && (p.supervisor_id === doc.id || doc.id === "DR-AG-01"))
        );
        setDbPatients(filtered.length > 0 ? filtered : [samplePatients[0]]);
      })
      .finally(() => setIsRefreshing(false));

    statsApi
      .get()
      .then(setDbStats)
      .catch(() => setDbStats(null));
  };

  // Load patients from DB on mount and when doctor switches
  useEffect(() => {
    loadPatients(currentDoctor);
  }, [currentDoctor.id]);

  const handleDoctorSwitch = (doc) => {
    setCurrentDoctor(doc);
    setDoctorScope("assigned");
    try {
      localStorage.setItem("activeDoctor", JSON.stringify(doc));
    } catch {}
    loadPatients(doc);
  };

  const allPatients = dbPatients ?? [];

  // Filter based on doctor scope, risk tier, search term
  const filteredPatients = allPatients.filter((p) => {
    // 1. Doctor Scope filter
    if (doctorScope === "assigned") {
      const isAssigned =
        p.assigned_doctor_id === currentDoctor.id ||
        (p.assigned_doctor_name || "").toLowerCase().includes((currentDoctor.name || "").toLowerCase());
      if (!isAssigned) return false;
    } else if (doctorScope === "referred") {
      if (p.referred_to_doctor_id !== currentDoctor.id && p.case_status !== "referred") return false;
    } else if (doctorScope === "supervised") {
      // Supervised junior cases (for senior consultants)
      const isMyJunior = p.assigned_doctor_id !== currentDoctor.id;
      if (!isMyJunior) return false;
    } else if (doctorScope === "closed") {
      if (p.case_status !== "closed") return false;
    }

    // 2. Search filter
    const matchesSearch =
      (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.hospital_branch || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.assigned_doctor_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.primarySymptoms || []).some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // 3. Risk Tier filter
    if (filterTier === "All") return true;
    if (filterTier === "High") return p.riskTier === "High";
    if (filterTier === "Moderate") return p.riskTier === "Moderate";
    if (filterTier === "Low") return p.riskTier === "Low";
    if (filterTier === "Awaiting") return p.slitlampStatus === "Awaiting Photo";
    if (filterTier === "Uploaded") return p.slitlampStatus === "Photo Uploaded";
    return true;
  });

  const myAssignedCount = allPatients.filter(
    (p) => p.assigned_doctor_id === currentDoctor.id || (p.assigned_doctor_name || "").includes(currentDoctor.name)
  ).length;

  const referredToMeCount = allPatients.filter(
    (p) => p.referred_to_doctor_id === currentDoctor.id || (p.case_status === "referred" && p.assigned_doctor_id === currentDoctor.id)
  ).length;

  const supervisedCount = allPatients.filter(
    (p) => p.assigned_doctor_id !== currentDoctor.id
  ).length;

  const closedCount = allPatients.filter((p) => p.case_status === "closed").length;
  const highUrgencyCount = allPatients.filter((p) => p.riskTier === "High").length;
  const awaitingPhotoCount = allPatients.filter((p) => p.slitlampStatus === "Awaiting Photo").length;
  const photoUploadedCount = allPatients.filter((p) => p.slitlampStatus === "Photo Uploaded").length;

  return (
    <div className="doctor-page-wrapper">
      <DoctorNavbar />
      <div className="container" style={{ paddingTop: "110px", paddingBottom: "80px" }}>
        
        {/* Clinician Header Bar */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            padding: "24px 32px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
            border: "1px solid rgba(226, 232, 240, 0.9)",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          {/* Active Doctor Profile with Switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: "300px" }}>
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "1.1rem",
                boxShadow: "0 6px 16px rgba(37, 99, 235, 0.25)",
                border: "2px solid #ffffff",
                flexShrink: 0,
              }}
            >
              DR
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
                  {currentDoctor.name}
                </h2>
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: "8px",
                    backgroundColor: currentDoctor.role === "senior" ? "#ecfdf5" : "#fffbeb",
                    color: currentDoctor.role === "senior" ? "#047857" : "#b45309",
                    border: `1px solid ${currentDoctor.role === "senior" ? "#a7f3d0" : "#fde68a"}`,
                  }}
                >
                  {currentDoctor.role === "senior" ? "★ Senior Consultant" : "🎓 Junior Specialist"}
                </span>
                <span className="badge badge-primary" style={{ fontSize: "0.74rem" }}>
                  {currentDoctor.specialty || "Uveitis & Ocular Immunology Specialist"}
                </span>
              </div>
              <p style={{ margin: "3px 0 0", fontSize: "0.85rem", color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}>
                <MapPin size={13} color="#dc2626" />
                <strong>{currentDoctor.clinicName || currentDoctor.city}</strong>
                <span style={{ color: "#94a3b8" }}>• ID: {currentDoctor.id}</span>
                {currentDoctor.role === "junior" && currentDoctor.supervisor_name && (
                  <span style={{ color: "#d97706", fontWeight: 700, marginLeft: "4px" }}>
                    • Supervised by {currentDoctor.supervisor_name}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Quick Doctor Switch Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700 }}>Switch Specialist:</span>
            <select
              value={currentDoctor.id}
              onChange={(e) => {
                const doc = AGARWAL_CENTERS.find((d) => d.id === e.target.value);
                if (doc) handleDoctorSwitch(doc);
              }}
              style={{
                padding: "8px 14px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#f8fafc",
                fontSize: "0.84rem",
                fontWeight: 700,
                color: "#1e293b",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {AGARWAL_CENTERS.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.role === "senior" ? "Senior" : "Junior"}) — {doc.city}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => loadPatients(currentDoctor)}
              title="Refresh Queue from SQLite DB"
              style={{
                padding: "8px 12px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#475569",
              }}
            >
              <RefreshCw size={14} className={isRefreshing ? "spin" : ""} />
              Sync DB
            </button>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <div
              style={{
                backgroundColor: "#eff6ff",
                padding: "10px 18px",
                borderRadius: "14px",
                border: "1px solid #bfdbfe",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "#1d4ed8", fontWeight: 800 }}>MY ASSIGNED CASES</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1e40af" }}>{myAssignedCount}</div>
            </div>

            <div
              style={{
                backgroundColor: "#faf5ff",
                padding: "10px 18px",
                borderRadius: "14px",
                border: "1px solid #e9d5ff",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "#7e22ce", fontWeight: 800 }}>REFERRED TO ME</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#6b21a8" }}>{referredToMeCount}</div>
            </div>

            {currentDoctor.role === "senior" && (
              <div
                style={{
                  backgroundColor: "#f0fdfa",
                  padding: "10px 18px",
                  borderRadius: "14px",
                  border: "1px solid #99f6e4",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "0.72rem", color: "#0f766e", fontWeight: 800 }}>SUPERVISED JUNIORS</div>
                <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#115e59" }}>{supervisedCount}</div>
              </div>
            )}

            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                padding: "10px 18px",
                borderRadius: "14px",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.72rem", color: "#dc2626", fontWeight: 700 }}>HIGH RISK</div>
              <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#b91c1c" }}>{highUrgencyCount}</div>
            </div>
          </div>
        </div>

        {/* Doctor Routing Scope Filter Toggle with Strict Isolation */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "18px",
            padding: "14px 24px",
            border: "1px solid rgba(226, 232, 240, 0.9)",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#1e293b" }}>Queue Dossier:</span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setDoctorScope("assigned")}
                style={{
                  padding: "7px 16px",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  border: doctorScope === "assigned" ? "1px solid #2563eb" : "1px solid #cbd5e1",
                  backgroundColor: doctorScope === "assigned" ? "#eff6ff" : "#ffffff",
                  color: doctorScope === "assigned" ? "#1d4ed8" : "#475569",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: doctorScope === "assigned" ? "0 2px 8px rgba(37, 99, 235, 0.15)" : "none",
                }}
              >
                <UserCheck size={14} />
                My Direct Cases ({myAssignedCount})
              </button>

              <button
                type="button"
                onClick={() => setDoctorScope("referred")}
                style={{
                  padding: "7px 16px",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  border: doctorScope === "referred" ? "1px solid #7c3aed" : "1px solid #cbd5e1",
                  backgroundColor: doctorScope === "referred" ? "#f5f3ff" : "#ffffff",
                  color: doctorScope === "referred" ? "#6d28d9" : "#475569",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: doctorScope === "referred" ? "0 2px 8px rgba(124, 58, 237, 0.15)" : "none",
                }}
              >
                <Sparkles size={14} />
                Referred to Me ({referredToMeCount})
              </button>

              {currentDoctor.role === "senior" && (
                <button
                  type="button"
                  onClick={() => setDoctorScope("supervised")}
                  style={{
                    padding: "7px 16px",
                    borderRadius: "10px",
                    fontSize: "0.84rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    border: doctorScope === "supervised" ? "1px solid #0d9488" : "1px solid #cbd5e1",
                    backgroundColor: doctorScope === "supervised" ? "#f0fdfa" : "#ffffff",
                    color: doctorScope === "supervised" ? "#0f766e" : "#475569",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: doctorScope === "supervised" ? "0 2px 8px rgba(13, 148, 136, 0.15)" : "none",
                  }}
                >
                  <Shield size={14} />
                  Supervised Junior Cases ({supervisedCount})
                </button>
              )}

              <button
                type="button"
                onClick={() => setDoctorScope("closed")}
                style={{
                  padding: "7px 16px",
                  borderRadius: "10px",
                  fontSize: "0.84rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  border: doctorScope === "closed" ? "1px solid #64748b" : "1px solid #cbd5e1",
                  backgroundColor: doctorScope === "closed" ? "#f1f5f9" : "#ffffff",
                  color: doctorScope === "closed" ? "#334155" : "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: doctorScope === "closed" ? "0 2px 8px rgba(100, 116, 139, 0.15)" : "none",
                }}
              >
                <CheckCircle2 size={14} />
                Closed Cases ({closedCount})
              </button>
            </div>
          </div>

          <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
            <span>
              🔒 Strict Clinical Privacy Enforced — You are logged in as <strong>{currentDoctor.name}</strong> (
              {currentDoctor.role === "senior" ? "Senior Consultant" : "Junior Specialist"}).
            </span>
          </div>
        </div>

        {/* Filters & Search Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Triage Filter Pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[
              { label: "All Tiers", key: "All" },
              { label: "High Risk", key: "High" },
              { label: "Moderate Risk", key: "Moderate" },
              { label: "Low Risk", key: "Low" },
              { label: "Photo Uploaded", key: "Uploaded" },
              { label: "Awaiting Photo", key: "Awaiting" },
            ].map((item) => {
              const active = filterTier === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilterTier(item.key)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: active ? "1px solid #2563eb" : "1px solid #cbd5e1",
                    backgroundColor: active ? "#2563eb" : "#ffffff",
                    color: active ? "#ffffff" : "#475569",
                    transition: "all 0.2s ease",
                    boxShadow: active ? "0 4px 12px rgba(37, 99, 235, 0.2)" : "none",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ position: "relative", minWidth: "300px" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search patient name, ID, branch or symptoms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 14px 9px 38px",
                borderRadius: "12px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                fontSize: "0.88rem",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Empty State */}
        {filteredPatients.length === 0 && (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              padding: "60px 20px",
              textAlign: "center",
              border: "1px dashed #cbd5e1",
            }}
          >
            <AlertTriangle size={40} color="#f59e0b" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#1e293b", margin: "0 0 8px" }}>
              No Patients Found in Current Filter
            </h3>
            <p style={{ fontSize: "0.88rem", color: "#64748b", maxWidth: "500px", margin: "0 auto 20px" }}>
              {doctorScope === "assigned"
                ? `No intake cases are currently assigned to ${currentDoctor.name}. Switch queue view to "All Dr. Agarwal's Centers" or submit a new test case via Patient Portal.`
                : "No patients matched your search or tier criteria."}
            </p>
            {doctorScope === "assigned" && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDoctorScope("all")}
                style={{ fontSize: "0.85rem" }}
              >
                View All Network Cases
              </button>
            )}
          </div>
        )}

        {/* Patient Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: "20px" }}>
          {filteredPatients.map((patient) => {
            const isHigh = patient.riskTier === "High";
            const isMod = patient.riskTier === "Moderate";
            const isAssignedToCurrent =
              patient.assigned_doctor_id === currentDoctor.id ||
              (patient.assigned_doctor_name || "").includes(currentDoctor.name);

            return (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate(`/doctor/patient/${patient.id}/dashboard`)}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "20px",
                  padding: "24px",
                  border: isHigh
                    ? "2px solid rgba(239, 68, 68, 0.35)"
                    : isMod
                    ? "1px solid rgba(245, 158, 11, 0.35)"
                    : "1px solid rgba(226, 232, 240, 0.9)",
                  boxShadow: isHigh
                    ? "0 8px 24px rgba(239, 68, 68, 0.08)"
                    : "0 4px 16px rgba(0, 0, 0, 0.03)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Top strip indicator */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    backgroundColor: isHigh ? "#ef4444" : isMod ? "#f59e0b" : "#10b981",
                  }}
                />

                <div>
                  {/* Top Bar: Name, ID, Risk Badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#64748b", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: "6px" }}>
                          {patient.id}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>• Submitted {patient.submittedAt}</span>
                        {isAssignedToCurrent && (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              color: "#1d4ed8",
                              backgroundColor: "#eff6ff",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              border: "1px solid #bfdbfe",
                            }}
                          >
                            ✓ Direct Case
                          </span>
                        )}
                        {patient.referred_to_doctor_id === currentDoctor.id && (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              color: "#7e22ce",
                              backgroundColor: "#f5f3ff",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              border: "1px solid #ddd6fe",
                            }}
                          >
                            ↗ Referred to You
                          </span>
                        )}
                        {currentDoctor.role === "senior" && patient.assigned_doctor_id !== currentDoctor.id && (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              color: "#0f766e",
                              backgroundColor: "#f0fdfa",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              border: "1px solid #99f6e4",
                            }}
                          >
                            👁️ Supervised Junior Case
                          </span>
                        )}
                        {patient.case_status === "closed" && (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              color: "#475569",
                              backgroundColor: "#f1f5f9",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              border: "1px solid #cbd5e1",
                            }}
                          >
                            ✓ Closed &amp; Discharged
                          </span>
                        )}
                        {patient.case_status === "pending_senior_review" && (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              color: "#b45309",
                              backgroundColor: "#fffbeb",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              border: "1px solid #fde68a",
                            }}
                          >
                            ⚠️ Pending Senior Review
                          </span>
                        )}
                        {patient.case_status === "senior_ratified" && (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              color: "#047857",
                              backgroundColor: "#ecfdf5",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              border: "1px solid #a7f3d0",
                            }}
                          >
                            ★ Senior Ratified
                          </span>
                        )}
                      </div>

                      {/* PATIENT NAME FRONT AND CENTER */}
                      <h3 style={{ margin: "2px 0 0", fontSize: "1.35rem", fontWeight: 900, color: "#0f172a" }}>
                        {patient.name}
                      </h3>

                      <div style={{ fontSize: "0.83rem", color: "#475569", marginTop: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{patient.age} yrs • {patient.sex}</span>
                        {patient.phone && (
                          <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#64748b" }}>
                            <Phone size={12} /> {patient.phone}
                          </span>
                        )}
                        <span>• <strong>{patient.affectedEye}</strong> ({patient.onset} onset)</span>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "6px 12px",
                        borderRadius: "12px",
                        fontWeight: 800,
                        fontSize: "0.85rem",
                        backgroundColor: isHigh
                          ? "rgba(239, 68, 68, 0.1)"
                          : isMod
                          ? "rgba(245, 158, 11, 0.1)"
                          : "rgba(16, 185, 129, 0.1)",
                        color: isHigh ? "#b91c1c" : isMod ? "#b45309" : "#047857",
                        border: "1px solid",
                        borderColor: isHigh
                          ? "rgba(239, 68, 68, 0.2)"
                          : isMod
                          ? "rgba(245, 158, 11, 0.2)"
                          : "rgba(16, 185, 129, 0.2)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isHigh && <AlertTriangle size={14} />}
                      {patient.riskTier} ({formatPercent(patient.uveitisProbability)})
                    </div>
                  </div>

                  {/* Assigned Hospital Branch & Doctor */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "12px",
                      padding: "10px 14px",
                      marginBottom: "14px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ fontSize: "0.8rem", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                      <MapPin size={13} color="#dc2626" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 700 }}>Branch:</span>
                      <span style={{ color: "#0f172a" }}>{patient.hospital_branch || "Dr. Agarwal's Eye Hospital"}</span>
                    </div>

                    <div style={{ fontSize: "0.8rem", color: "#334155", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Stethoscope size={13} color="#2563eb" style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 700 }}>Specialist:</span>
                      <span style={{ color: "#2563eb", fontWeight: 700 }}>
                        {patient.assigned_doctor_name || currentDoctor.name}
                      </span>
                    </div>
                  </div>

                  {/* Primary Symptoms Chips */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                    {(patient.primarySymptoms || []).map((sym, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "0.75rem",
                          padding: "3px 9px",
                          borderRadius: "8px",
                          backgroundColor: "#ffffff",
                          border: "1px solid #e2e8f0",
                          color: "#334155",
                          fontWeight: 600,
                        }}
                      >
                        {sym}
                      </span>
                    ))}
                  </div>

                  {/* Neuro-Fuzzy Analytics Bar */}
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      marginBottom: "16px",
                      border: "1px dashed #cbd5e1",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      <span>AI Triage Diagnosis:</span>
                      <span style={{ color: isHigh ? "#dc2626" : "#2563eb" }}>{patient.severityClass}</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", fontSize: "0.78rem", color: "#64748b" }}>
                      <div>Redness: <strong>{patient.rednessScore ?? 7}/10</strong></div>
                      <div>Pain: <strong>{patient.painScore ?? 6}/10</strong></div>
                      <div>Photophobia: <strong>{patient.photophobiaScore ?? 8}/10</strong></div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "12px",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Camera size={15} style={{ color: patient.slitlampStatus === "Photo Uploaded" ? "#10b981" : "#d97706" }} />
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: patient.slitlampStatus === "Photo Uploaded" ? "#047857" : "#b45309",
                      }}
                    >
                      {patient.slitlampStatus}
                    </span>
                  </div>

                  <div
                    style={{
                      color: "#2563eb",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    Open Case &amp; XAI Workbench
                    <ChevronRight size={16} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}
