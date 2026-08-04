import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Stethoscope, Lock, Mail, Building, ArrowRight, Sparkles, Activity, CheckCircle2 } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import "../styles/doctor.css";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("dr.elena.rostova@eyeclinic.org");
  const [password, setPassword] = useState("••••••••••••");
  const [clinic, setClinic] = useState("Metropolitan Ocular Immunology Center");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/doctor/queue");
    }, 600);
  };

  const handleQuickDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/doctor/queue");
    }, 400);
  };

  return (
    <div className="doctor-page-wrapper">
      <Navbar />
      <div className="container" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
        <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1.1fr",
              gap: "40px",
              alignItems: "center",
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
                Physician & Specialist Portal
              </div>

              <h1 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#0f172a", lineHeight: 1.25, margin: "0 0 16px" }}>
                Uveitis Clinical Decision Platform
              </h1>

              <p style={{ fontSize: "0.95rem", color: "#64748b", lineHeight: 1.6, margin: "0 0 28px" }}>
                Secure clinician dashboard for reviewing Neuro-Fuzzy intake screening, analyzing slitlamp anterior chamber images, and validating disease triage.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ backgroundColor: "#eff6ff", color: "#2563eb", padding: "8px", borderRadius: "10px", marginTop: "2px" }}>
                    <Activity size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px", fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
                      Adaptive Neuro-Fuzzy Patient Triage
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b" }}>
                      Real-time probability scoring and multi-index severity classification.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ backgroundColor: "#ecfdf5", color: "#10b981", padding: "8px", borderRadius: "10px", marginTop: "2px" }}>
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px", fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
                      Slitlamp & Fundus Image Workbench
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b" }}>
                      AI feature overlays for keratic precipitates, hypopyon, and AC cell grading.
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ backgroundColor: "#fef3c7", color: "#d97706", padding: "8px", borderRadius: "10px", marginTop: "2px" }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px", fontSize: "0.95rem", fontWeight: 700, color: "#1e293b" }}>
                      HIPAA / GDPR Compliant Workflow
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b" }}>
                      Encrypted health record queue with role-based clinical access.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Login Form */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "20px",
                padding: "32px",
                border: "1px solid rgba(226, 232, 240, 0.8)",
              }}
            >
              <div style={{ marginBottom: "24px", textAlign: "center" }}>
                <h3 style={{ margin: "0 0 6px", fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
                  Clinician Authentication
                </h3>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                  Enter your credentials or test with 1-click Demo Login
                </p>
              </div>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Affiliated Clinic / Institute
                  </label>
                  <div style={{ position: "relative" }}>
                    <Building size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <select
                      value={clinic}
                      onChange={(e) => setClinic(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "11px 14px 11px 40px",
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        fontSize: "0.9rem",
                        outline: "none",
                      }}
                    >
                      <option value="Metropolitan Ocular Immunology Center">Metropolitan Ocular Immunology Center</option>
                      <option value="Vision & Retina Specialists">Vision & Retina Specialists</option>
                      <option value="University Eye Institute & Research">University Eye Institute & Research</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Physician Email Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="dr.smith@eyeclinic.org"
                      required
                      style={{
                        width: "100%",
                        padding: "11px 14px 11px 40px",
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        fontSize: "0.9rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      style={{
                        width: "100%",
                        padding: "11px 14px 11px 40px",
                        borderRadius: "12px",
                        border: "1px solid #cbd5e1",
                        backgroundColor: "#ffffff",
                        fontSize: "0.9rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    marginBottom: "12px",
                  }}
                >
                  {loading ? "Authenticating Clinician..." : "Log in to Doctor Portal"}
                  <ArrowRight size={16} style={{ marginLeft: "8px" }} />
                </button>
              </form>

              <div style={{ position: "relative", textAlign: "center", margin: "16px 0" }}>
                <span style={{ backgroundColor: "#f8fafc", padding: "0 10px", fontSize: "0.78rem", color: "#94a3b8", fontWeight: 700 }}>
                  OR FOR EASY EVALUATION
                </span>
                <div style={{ position: "absolute", left: 0, right: 0, top: "50%", borderTop: "1px solid #e2e8f0", zIndex: -1 }} />
              </div>

              <button
                type="button"
                onClick={handleQuickDemo}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: "12px",
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  border: "1px solid rgba(37, 99, 235, 0.3)",
                  fontSize: "0.9rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
              >
                <Sparkles size={16} />
                Quick Demo Doctor Login
              </button>

              <div style={{ marginTop: "20px", textAlign: "center", fontSize: "0.78rem", color: "#64748b" }}>
                Need patient intake screening? <Link to="/questionnaire" style={{ color: "#2563eb", fontWeight: 700 }}>Go to Symptom Questionnaire</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
