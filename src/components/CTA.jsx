import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Stethoscope, ShieldCheck } from "lucide-react";

export default function CTA() {
  return (
    <section className="section section-alt" style={{ padding: "80px 0" }}>
      <div className="container">
        <motion.div
          className="cta-shell card"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          style={{
            padding: "48px 40px",
            borderRadius: "28px",
            background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
            color: "#ffffff",
            boxShadow: "0 20px 60px rgba(15, 23, 42, 0.25)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "32px",
          }}
        >
          <div className="cta-copy" style={{ maxWidth: "600px" }}>
            <span
              className="section-label"
              style={{
                color: "#60a5fa",
                backgroundColor: "rgba(96, 165, 250, 0.15)",
                padding: "4px 12px",
                borderRadius: "8px",
                fontSize: "0.78rem",
                fontWeight: 800,
                display: "inline-block",
                marginBottom: "12px",
              }}
            >
              UVEISENSE AI • ARQGENE × DR. AGARWAL'S EYE HOSPITAL
            </span>
            <h2 className="section-title" style={{ color: "#ffffff", fontSize: "2.2rem", fontWeight: 900, margin: "0 0 12px" }}>
              Experience AI-Powered Uveitis Care Today
            </h2>
            <p className="section-subtitle" style={{ color: "#94a3b8", fontSize: "1.02rem", margin: 0, lineHeight: 1.6 }}>
              Whether you are experiencing sudden eye redness, deep aching pain, or photophobia, our intelligent screening engine provides immediate multi-modal risk analysis and direct specialist routing.
            </p>
          </div>

          <div className="cta-actions" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <Link
              className="btn btn-primary"
              to="/patient-portal"
              style={{
                padding: "14px 28px",
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "1rem",
                background: "linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)",
                color: "#ffffff",
                boxShadow: "0 6px 20px rgba(37, 99, 235, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
              }}
            >
              <Sparkles size={18} />
              Start Patient Intake
              <ArrowRight size={18} />
            </Link>

            <Link
              className="btn btn-secondary"
              to="/doctor-login"
              style={{
                padding: "12px 24px",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "0.92rem",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                textDecoration: "none",
              }}
            >
              <Stethoscope size={16} />
              Doctor Portal Access
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.76rem", color: "#94a3b8", marginTop: "4px" }}>
              <ShieldCheck size={14} style={{ color: "#34d399" }} />
              <span>Certified clinical screening decision support</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

