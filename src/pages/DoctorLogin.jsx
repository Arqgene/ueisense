import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Stethoscope,
  Lock,
  Mail,
  Building,
  ArrowRight,
  Sparkles,
  Activity,
  CheckCircle2,
  Award,
  UserCheck,
  Eye,
  GitBranch,
  Shield,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import { AGARWAL_CENTERS } from "../utils/agarwalCenters.js";
import "../styles/doctor.css";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const [selectedDocId, setSelectedDocId] = useState("DR-AG-01");
  const [password, setPassword] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);

  const selectedDoc = AGARWAL_CENTERS.find((d) => d.id === selectedDocId) || AGARWAL_CENTERS[0];

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    localStorage.setItem("activeDoctor", JSON.stringify(selectedDoc));
    setTimeout(() => {
      setLoading(false);
      navigate("/doctor/queue");
    }, 400);
  };

  const handleSelectDoctor = (doc) => {
    setSelectedDocId(doc.id);
    localStorage.setItem("activeDoctor", JSON.stringify(doc));
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/doctor/queue");
    }, 300);
  };

  return (
    <div className="doctor-page-wrapper">
      <Navbar />
      <div className="container" style={{ paddingTop: "60px", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.2fr",
              gap: "36px",
              alignItems: "flex-start",
              backgroundColor: "#ffffff",
              borderRadius: "28px",
              padding: "40px",
              boxShadow: "0 20px 60px -15px rgba(0, 0, 0, 0.08)",
              border: "1px solid rgba(226, 232, 240, 0.9)",
            }}
          >
            {/* Left Info Panel */}
            <div style={{ paddingRight: "10px" }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  backgroundColor: "rgba(37, 99, 235, 0.08)",
                  color: "#2563eb",
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  marginBottom: "20px",
                }}
              >
                <Stethoscope size={15} />
                Uveisense AI • Specialist Workstation (Dr. Agarwal's Network)
              </div>

              <h1 style={{ fontSize: "2.1rem", fontWeight: 900, color: "#0f172a", lineHeight: 1.25, margin: "0 0 16px" }}>
                Specialist Decision Support &amp; Referral Hub
              </h1>

              <p style={{ fontSize: "0.95rem", color: "#64748b", lineHeight: 1.6, margin: "0 0 28px" }}>
                Secure clinical portal for reviewing incoming patient intakes, evaluating Grad-CAM image saliency, conducting multi-modal feature extraction, and ratifying final management plans.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ backgroundColor: "#eff6ff", color: "#2563eb", padding: "8px", borderRadius: "10px", marginTop: "2px" }}>
                    <Activity size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px", fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
                      Synced Patient Case Files under Patient Name
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b" }}>
                      Direct SQLite sync of intake questions, visual symptoms, and systemic flags tagged to the physician.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ backgroundColor: "#ecfdf5", color: "#10b981", padding: "8px", borderRadius: "10px", marginTop: "2px" }}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px", fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
                      Explainable AI (XAI) Justifications
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b" }}>
                      Inspect the exact clinical rules, photophobia weights, and Grad-CAM attention hotspots.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ backgroundColor: "#fef3c7", color: "#d97706", padding: "8px", borderRadius: "10px", marginTop: "2px" }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px", fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
                      Two-Tier Supervisory Hierarchy &amp; Referral Lock
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b" }}>
                      Senior Consultants supervise Junior Specialists. Referred cases share full data exclusively with the assigned physician with strict confidentiality isolation.
                    </p>
                  </div>
                </div>
              </div>

              {/* Role hierarchy legend badge */}
              <div
                style={{
                  marginTop: "28px",
                  padding: "16px",
                  borderRadius: "14px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                  Clinical Role Permissions
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem", color: "#475569" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", padding: "2px 8px", borderRadius: "6px", fontWeight: 700, fontSize: "0.72rem" }}>
                      <Award size={11} /> Senior Consultant
                    </span>
                    <span>Direct multi-modal AI predictions &amp; final ratification authority</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", backgroundColor: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: "6px", fontWeight: 700, fontSize: "0.72rem" }}>
                      <UserCheck size={11} /> Junior Specialist
                    </span>
                    <span>Feature-extraction workflow with mandatory Senior oversight</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Login & Doctor Selector */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "20px",
                padding: "28px",
                border: "1px solid rgba(226, 232, 240, 0.8)",
              }}
            >
              <div style={{ marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                    Select Physician Account
                  </h3>
                  <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#2563eb", backgroundColor: "#eff6ff", padding: "2px 8px", borderRadius: "10px" }}>
                    5 Specialists Available
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                  Authenticate as a Dr. Agarwal's Eye Hospital specialist:
                </p>
              </div>

              {/* 5 Doctor Fast-Select Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                {AGARWAL_CENTERS.map((doc) => {
                  const isSelected = selectedDocId === doc.id;
                  const isSenior = doc.role === "senior";
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "12px",
                        border: isSelected
                          ? isSenior ? "2px solid #2563eb" : "2px solid #d97706"
                          : "1px solid #cbd5e1",
                        borderLeft: `5px solid ${isSenior ? "#2563eb" : "#d97706"}`,
                        backgroundColor: isSelected ? "#ffffff" : "#f8fafc",
                        boxShadow: isSelected ? "0 4px 14px rgba(37,99,235,0.12)" : "none",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, paddingRight: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px" }}>
                          <span style={{ fontSize: "0.88rem", fontWeight: 800, color: isSelected ? (isSenior ? "#1d4ed8" : "#b45309") : "#1e293b" }}>
                            {doc.name}
                          </span>
                          {/* Role Badge */}
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: "6px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              backgroundColor: isSenior ? "#eff6ff" : "#fffbeb",
                              color: isSenior ? "#2563eb" : "#d97706",
                              border: `1px solid ${isSenior ? "#bfdbfe" : "#fde68a"}`,
                            }}
                          >
                            {isSenior ? <Award size={10} /> : <UserCheck size={10} />}
                            {doc.roleLabel || (isSenior ? "Senior Consultant" : "Junior Specialist")}
                          </span>
                        </div>

                        <div style={{ fontSize: "0.74rem", color: "#64748b", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>{doc.hospital.split("-")[1]?.trim() || doc.hospital}</span>
                          <span>•</span>
                          <span>{doc.experience}</span>
                        </div>

                        {/* Supervisor info for Junior Doctors */}
                        {!isSenior && doc.supervisorName && (
                          <div style={{ fontSize: "0.71rem", color: "#b45309", marginTop: "3px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
                            <span>⚡ Supervised by:</span>
                            <span style={{ textDecoration: "underline" }}>{doc.supervisorName.split(",")[0]}</span>
                          </div>
                        )}
                        {isSenior && (
                          <div style={{ fontSize: "0.71rem", color: "#059669", marginTop: "3px", fontWeight: 600 }}>
                            <span>✓ Full AI Diagnostics &amp; Supervises Fellows</span>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectDoctor(doc);
                        }}
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "6px 12px",
                          borderRadius: "8px",
                          backgroundColor: isSelected ? (isSenior ? "#2563eb" : "#d97706") : "#e2e8f0",
                          color: isSelected ? "#ffffff" : "#475569",
                          border: "none",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          transition: "all 0.15s ease",
                        }}
                      >
                        {loading && isSelected ? "Loading..." : "Enter Workspace →"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Selected Doctor Summary Pill */}
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  backgroundColor: selectedDoc.role === "senior" ? "#eff6ff" : "#fffbeb",
                  border: `1px solid ${selectedDoc.role === "senior" ? "#bfdbfe" : "#fde68a"}`,
                  marginBottom: "16px",
                  fontSize: "0.78rem",
                  color: selectedDoc.role === "senior" ? "#1e40af" : "#92400e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <strong>Active Session:</strong> {selectedDoc.name.split(",")[0]}
                  <span style={{ marginLeft: "6px", opacity: 0.85 }}>({selectedDoc.roleLabel})</span>
                </div>
                <span style={{ fontWeight: 700, fontSize: "0.72rem" }}>
                  {selectedDoc.role === "senior" ? "Senior Sign-off Privilege" : `Supervised by ${selectedDoc.supervisorName?.split(",")[0]}`}
                </span>
              </div>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Physician Email
                  </label>
                  <input
                    type="email"
                    value={selectedDoc.email}
                    readOnly
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      fontSize: "0.85rem",
                      color: "#475569",
                    }}
                  />
                </div>

                <div style={{ marginBottom: "18px" }}>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "#334155", marginBottom: "4px" }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      fontSize: "0.85rem",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "10px",
                    backgroundColor: selectedDoc.role === "senior" ? "#2563eb" : "#d97706",
                    color: "#ffffff",
                    fontSize: "0.92rem",
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: selectedDoc.role === "senior" ? "0 4px 14px rgba(37,99,235,0.3)" : "0 4px 14px rgba(217,119,6,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "background-color 0.2s ease",
                  }}
                >
                  <Stethoscope size={16} />
                  {loading ? "Authenticating Doctor..." : `Login as ${selectedDoc.name.split(",")[0]} (${selectedDoc.role === "senior" ? "Senior" : "Junior"})`}
                </button>
              </form>

              <div style={{ marginTop: "16px", textAlign: "center", fontSize: "0.78rem", color: "#64748b" }}>
                Patient seeking care? <Link to="/patient-portal" style={{ color: "#2563eb", fontWeight: 700 }}>Go to Patient Intake Portal</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

