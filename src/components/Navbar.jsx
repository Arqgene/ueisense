import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Eye, Stethoscope, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Partnership & Mission", href: "#mission" },
  { label: "AI Screening Flow", href: "#architecture" },
  { label: "Dual XAI Engine", href: "#xai" },
  { label: "Hospital Centers", href: "#centers" },
];

export default function Navbar() {
  return (
    <motion.header
      className="navbar"
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      style={{
        backdropFilter: "blur(16px)",
        backgroundColor: "rgba(255, 255, 255, 0.92)",
        borderBottom: "1px solid rgba(226, 232, 240, 0.9)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div className="container navbar-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px" }}>
        <Link className="brand" to="/" aria-label="Uveisense AI" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)",
            }}
          >
            <Eye size={22} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "1.28rem", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.02em" }}>
                Uveisense <span style={{ color: "#2563eb" }}>AI</span>
              </span>
            </div>
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 700, letterSpacing: "0.03em" }}>
              ARQGENE × DR. AGARWAL'S EYE HOSPITAL
            </span>
          </div>
        </Link>

        <nav className="nav-links" aria-label="Primary" style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              style={{
                fontSize: "0.88rem",
                fontWeight: 600,
                color: "#475569",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2563eb")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link
            className="btn btn-secondary"
            to="/doctor-login"
            style={{
              fontSize: "0.86rem",
              padding: "9px 16px",
              borderRadius: "10px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "7px",
              backgroundColor: "#f8fafc",
              color: "#334155",
              border: "1px solid #cbd5e1",
              textDecoration: "none",
            }}
          >
            <Stethoscope size={16} style={{ color: "#2563eb" }} />
            Doctor Portal
          </Link>

          <Link
            className="btn btn-primary"
            to="/patient-portal"
            style={{
              fontSize: "0.86rem",
              padding: "9px 18px",
              borderRadius: "10px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "7px",
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              color: "#ffffff",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
              textDecoration: "none",
            }}
          >
            <Sparkles size={16} />
            Patient Portal
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </motion.header>
  );
}

