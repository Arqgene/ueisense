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
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../styles/doctor.css";

export const samplePatients = [
  {
    id: "PT-8942",
    name: "Sarah Jenkins",
    age: 42,
    sex: "Female",
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
    slitlampStatus: "Awaiting Photo",
    submittedAt: "12 mins ago",
    primarySymptoms: ["Severe Photophobia", "Deep Eye Pain 8/10", "Acute Ciliary Flush", "Floaters"],
  },
  {
    id: "PT-8945",
    name: "Robert Vance",
    age: 58,
    sex: "Male",
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
  const [dbPatients, setDbPatients] = useState(null); // null = loading
  const [dbStats, setDbStats] = useState(null);

  // Load patients from DB on mount; fall back to samplePatients if server down
  useEffect(() => {
    patientsApi.list()
      .then((rows) => {
        // Normalize DB rows to match samplePatients shape
        setDbPatients(rows.map((r) => ({
          id: r.id,
          name: r.name,
          age: r.age,
          sex: r.sex,
          affectedEye: r.affected_eye,
          symptomStart: r.symptom_start,
          onset: r.onset_type,
          riskTier: r.risk_tier,
          uveitisProbability: r.uveitis_prob,
          urgencyIndex: r.urgency_index,
          severityClass: r.severity_class,
          slitlampStatus: r.slitlamp_status,
          submittedAt: r.submitted_at ? new Date(r.submitted_at).toLocaleTimeString() : "—",
          primarySymptoms: [],
        })));
      })
      .catch(() => setDbPatients(null)); // server offline → use local data

    statsApi.get()
      .then(setDbStats)
      .catch(() => setDbStats(null));
  }, []);

  const allPatients = dbPatients ?? samplePatients;

  const filteredPatients = allPatients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.primarySymptoms || []).some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterTier === "All") return matchesSearch;
    if (filterTier === "High") return matchesSearch && p.riskTier === "High";
    if (filterTier === "Moderate") return matchesSearch && p.riskTier === "Moderate";
    if (filterTier === "Low") return matchesSearch && p.riskTier === "Low";
    if (filterTier === "Awaiting") return matchesSearch && p.slitlampStatus === "Awaiting Photo";
    return matchesSearch;
  });

  const highUrgencyCount  = dbStats?.highRisk    ?? allPatients.filter((p) => p.riskTier === "High").length;
  const awaitingPhotoCount = dbStats?.awaitingPhoto ?? allPatients.filter((p) => p.slitlampStatus === "Awaiting Photo").length;

  return (
    <div className="doctor-page-wrapper">
      <Navbar />
      <div className="container" style={{ paddingTop: "110px", paddingBottom: "80px" }}>
        {/* Clinician Header Bar */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "24px",
            padding: "24px 32px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
            border: "1px solid rgba(226, 232, 240, 0.9)",
            marginBottom: "28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "#eff6ff",
                color: "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "1.2rem",
                border: "2px solid #bfdbfe",
              }}
            >
              DR
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
                  Dr. Elena Rostova, MD
                </h2>
                <span className="badge badge-primary" style={{ fontSize: "0.75rem" }}>
                  Attending Ophthalmologist
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#64748b" }}>
                Metropolitan Ocular Immunology Center • Active Session
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "10px 18px",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700 }}>TOTAL QUEUE</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#0f172a" }}>{samplePatients.length}</div>
            </div>

            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                padding: "10px 18px",
                borderRadius: "14px",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 700 }}>HIGH URGENCY</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#b91c1c" }}>{highUrgencyCount}</div>
            </div>

            <div
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.08)",
                padding: "10px 18px",
                borderRadius: "14px",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "#d97706", fontWeight: 700 }}>SLITLAMP PENDING</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 900, color: "#b45309" }}>{awaitingPhotoCount}</div>
            </div>
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
              { label: "All Patients", key: "All" },
              { label: "High Risk", key: "High" },
              { label: "Moderate Risk", key: "Moderate" },
              { label: "Low Risk", key: "Low" },
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
          <div style={{ position: "relative", minWidth: "280px" }}>
            <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search patient, ID or symptoms..."
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

        {/* Patient Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(480px, 1fr))", gap: "20px" }}>
          {filteredPatients.map((patient) => {
            const isHigh = patient.riskTier === "High";
            const isMod = patient.riskTier === "Moderate";

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
                    ? "2px solid rgba(239, 68, 68, 0.3)"
                    : isMod
                    ? "1px solid rgba(245, 158, 11, 0.3)"
                    : "1px solid rgba(226, 232, 240, 0.9)",
                  boxShadow: isHigh
                    ? "0 8px 24px rgba(239, 68, 68, 0.08)"
                    : "0 4px 16px rgba(0, 0, 0, 0.03)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  {/* Top Bar: Name, ID, Risk Badge */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#64748b", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: "6px" }}>
                          {patient.id}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#64748b" }}>• Submitted {patient.submittedAt}</span>
                      </div>
                      <h3 style={{ margin: "4px 0 0", fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                        {patient.name}
                      </h3>
                      <div style={{ fontSize: "0.83rem", color: "#475569", marginTop: "2px" }}>
                        {patient.age} yrs • {patient.sex} • <strong>{patient.affectedEye}</strong> ({patient.onset} onset)
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
                      }}
                    >
                      {isHigh && <AlertTriangle size={14} />}
                      {patient.riskTier} Risk ({patient.uveitisProbability.toFixed(1)}%)
                    </div>
                  </div>

                  {/* Primary Symptoms Chips */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" }}>
                    {patient.primarySymptoms.map((sym, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "0.75rem",
                          padding: "3px 9px",
                          borderRadius: "8px",
                          backgroundColor: "#f8fafc",
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
                      backgroundColor: "#f8fafc",
                      borderRadius: "12px",
                      padding: "12px 14px",
                      marginBottom: "16px",
                      border: "1px dashed #cbd5e1",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                      <span>AI Triage Diagnosis:</span>
                      <span style={{ color: "#2563eb" }}>{patient.severityClass}</span>
                    </div>
                    <div style={{ display: "flex", gap: "16px", fontSize: "0.78rem", color: "#64748b" }}>
                      <div>Redness: <strong>{patient.rednessScore}/10</strong></div>
                      <div>Pain: <strong>{patient.painScore}/10</strong></div>
                      <div>Photophobia: <strong>{patient.photophobiaScore}/10</strong></div>
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
                    Open Slitlamp Workbench
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
