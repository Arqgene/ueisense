import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity,
  Users,
  BarChart3,
  Building2,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Stethoscope,
  ChevronDown,
  Sparkles,
  Eye,
} from "lucide-react";
import { useState } from "react";
import { AGARWAL_CENTERS } from "../utils/agarwalCenters.js";

export default function DoctorNavbar() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  // Retrieve stored doctor session or default to Dr. Agarwal's flagship specialist
  const storedDoctor = (() => {
    try {
      const active = localStorage.getItem("activeDoctor");
      if (active) return JSON.parse(active);
      const saved = localStorage.getItem("uveitis_doctor");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })() || AGARWAL_CENTERS[0];

  const handleLogout = () => {
    try {
      localStorage.removeItem("activeDoctor");
      localStorage.removeItem("uveitis_doctor");
    } catch {}
    navigate("/doctor-login");
  };

  return (
    <header className="doctor-portal-header">
      <div className="doctor-header-inner">
        {/* Brand */}
        <div className="doctor-brand-group">
          <div className="doctor-brand-badge" onClick={() => navigate("/doctor/queue")}>
            <div className="doctor-brand-icon" style={{ background: "linear-gradient(135deg, #1e3a8a, #2563eb)" }}>
              <Eye size={20} color="#ffffff" />
            </div>
            <div className="doctor-brand-text">
              <div className="doctor-brand-title">
                Uveisense <span>AI</span>
              </div>
              <div className="doctor-brand-subtitle">
                Doctor Workspace • Dr. Agarwal's Network
              </div>
            </div>
          </div>

          <div className="doctor-system-pill">
            <span className="doctor-pulse-dot"></span>
            <span>SQLite Synced • Live EMR Active</span>
          </div>
        </div>


        {/* Navigation Pages */}
        <nav className="doctor-nav-links">
          <NavLink
            to="/doctor/queue"
            className={({ isActive }) =>
              `doctor-nav-item ${isActive ? "active" : ""}`
            }
          >
            <Users size={16} />
            <span>Triage Queue</span>
          </NavLink>

          <NavLink
            to="/doctor/analytics"
            className={({ isActive }) =>
              `doctor-nav-item ${isActive ? "active" : ""}`
            }
          >
            <BarChart3 size={16} />
            <span>Analytics</span>
          </NavLink>

          <NavLink
            to="/doctor/referrals"
            className={({ isActive }) =>
              `doctor-nav-item ${isActive ? "active" : ""}`
            }
          >
            <Building2 size={16} />
            <span>Specialist Network</span>
          </NavLink>

          <NavLink
            to="/doctor/audit"
            className={({ isActive }) =>
              `doctor-nav-item ${isActive ? "active" : ""}`
            }
          >
            <ShieldCheck size={16} />
            <span>Audit Trail</span>
          </NavLink>
        </nav>

        {/* Right Actions & Doctor Profile */}
        <div className="doctor-header-right">
          <button
            type="button"
            className="doctor-intake-btn"
            onClick={() => window.open("/questionnaire", "_blank")}
            title="Open patient screening intake in new window"
          >
            <Sparkles size={14} />
            <span>Patient Intake</span>
            <ExternalLink size={12} style={{ opacity: 0.7 }} />
          </button>

          {/* Doctor Profile Pill */}
          <div className="doctor-profile-wrapper">
            <div
              className="doctor-profile-chip"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              <div className="doctor-avatar">
                {storedDoctor.name
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .slice(-2)
                  .join("")}
              </div>
              <div className="doctor-profile-info">
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="doctor-profile-name">{storedDoctor.name}</span>
                  <span
                    style={{
                      fontSize: "0.66rem",
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: "6px",
                      backgroundColor: storedDoctor.role === "senior" ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)",
                      color: storedDoctor.role === "senior" ? "#34d399" : "#fbbf24",
                      border: `1px solid ${storedDoctor.role === "senior" ? "rgba(16,185,129,0.4)" : "rgba(245,158,11,0.4)"}`,
                    }}
                  >
                    {storedDoctor.role === "senior" ? "Senior Consultant" : "Junior Specialist"}
                  </span>
                </div>
                <div className="doctor-profile-clinic">
                  {storedDoctor.clinic}
                  {storedDoctor.role === "junior" && storedDoctor.supervisor_name && (
                    <span style={{ marginLeft: "4px", color: "#94a3b8", fontSize: "0.7rem" }}>
                      • Supervised by {storedDoctor.supervisor_name.split(",")[0]}
                    </span>
                  )}
                </div>
              </div>
              <ChevronDown
                size={14}
                style={{
                  color: "#94a3b8",
                  transform: profileOpen ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s ease",
                }}
              />
            </div>

            {profileOpen && (
              <div className="doctor-profile-dropdown">
                <div className="doctor-dropdown-header">
                  <div className="doctor-dropdown-name">{storedDoctor.name}</div>
                  <div className="doctor-dropdown-email">{storedDoctor.email}</div>
                  <div className="doctor-dropdown-specialty">
                    <Stethoscope size={12} /> {storedDoctor.role || "Ophthalmologist"}
                  </div>
                </div>
                <div className="doctor-dropdown-divider" />
                <button
                  type="button"
                  className="doctor-dropdown-logout"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  <span>Sign Out Session</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
