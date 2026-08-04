import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Microscope, Stethoscope } from "lucide-react";

import { Link } from "react-router-dom";

const navItems = [
  { label: "Problem", href: "/#problem" },
  { label: "Architecture", href: "/#pipeline" },
  { label: "Explainability", href: "/#explainability" },
  { label: "Recurrence", href: "/#recurrence" },
  { label: "Novelty", href: "/#novelty" },
];

export default function Navbar() {
  return (
    <motion.header
      className="navbar"
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
    >
      <div className="container navbar-inner">
        <Link className="brand" to="/" aria-label="Uveitites home">
          <span className="brand-mark">
            <Microscope size={18} />
          </span>
          <span className="brand-text">
            Uveitis
            <small>Explainable Uveitis AI</small>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {navItems.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Link className="btn btn-secondary navbar-cta" to="/doctor-login" style={{ backgroundColor: "#eff6ff", color: "#2563eb", border: "1px solid rgba(37,99,235,0.3)" }}>
            <Stethoscope size={16} />
            Doctor Portal
          </Link>

          <Link className="btn btn-primary navbar-cta" to="/questionnaire">
            <Sparkles size={16} />
            Symptom Intake
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
