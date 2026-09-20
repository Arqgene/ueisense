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
} from "lucide-react";
import { useState } from "react";

export default function DoctorNavbar() {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  // Retrieve stored doctor session or default
  const storedDoctor = (() => {
    try {
      const saved = localStorage.getItem("uveitis_doctor");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })() || {
    name: "Dr. Elena Rostova",
    role: "Senior Uveitis Specialist",
    clinic: "Metropolitan Ocular Immunology Center",
    email: "dr.rostova@eyeclinic.org",
  };

  const handleLogout = () => {
    try {
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
            <div className="doctor-brand-icon">
              <Activity size={20} color="#38bdf8" />
            </div>
            <div className="doctor-brand-text">
              <div className="doctor-brand-title">
                UEISENSE <span>CLINICAL OS</span>
              </div>
              <div className="doctor-brand-subtitle">
                Ophthalmic Neuro-Fuzzy & ViT Decision Support
              </div>
            </div>
          </div>

          <div className="doctor-system-pill">
            <span className="doctor-pulse-dot"></span>
            <span>EMR Active • SQLite Ready</span>
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
                <div className="doctor-profile-name">{storedDoctor.name}</div>
                <div className="doctor-profile-clinic">{storedDoctor.clinic}</div>
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
