import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Brain, Activity, Sparkles, Building2, MapPin, Eye, Stethoscope } from "lucide-react";

export default function Hero() {
  return (
    <section className="hero" id="top" style={{ paddingTop: "48px", paddingBottom: "64px" }}>
      <div className="container hero-grid">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Partnership Banner Badge */}
          <div
            className="hero-badge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "20px",
              background: "linear-gradient(90deg, rgba(37,99,235,0.12) 0%, rgba(16,185,129,0.12) 100%)",
              border: "1px solid rgba(37,99,235,0.3)",
              marginBottom: "16px",
            }}
          >
            <span className="hero-badge-dot" style={{ backgroundColor: "#2563eb" }} />
            <span style={{ fontWeight: 900, color: "#1e3a8a", fontSize: "0.85rem" }}>
              Uveisense AI
            </span>
            <span style={{ color: "#94a3b8" }}>•</span>
            <span style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: 600 }}>
              • Clinical AI Platform
            </span>
          </div>

          <h1 style={{ fontSize: "2.75rem", lineHeight: 1.15, fontWeight: 900, color: "#0f172a", marginBottom: "16px" }}>
            Uveisense AI: Intelligent Uveitis Screening &amp;<br />
            <span
              style={{
                background: "linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Direct Specialist Routing
            </span>
          </h1>

          <p className="hero-desc" style={{ fontSize: "1.08rem", lineHeight: 1.6, color: "#475569", marginBottom: "28px" }}>
            <strong>Uveisense AI</strong> is a breakthrough clinical platform developed by <strong>Arqgene</strong> in collaboration with <strong>Dr. Agarwal's Eye Hospital</strong>. We unite patient symptom intake, slitlamp photographic analysis, and dual Explainable AI (XAI) to deliver under-60-second risk stratification and automated routing to our senior uveitis experts across India.
          </p>

          <div className="hero-actions" style={{ display: "flex", gap: "14px", flexWrap: "wrap", marginBottom: "36px" }}>
            <Link
              className="btn btn-primary"
              to="/patient-portal"
              style={{
                fontSize: "1.02rem",
                padding: "14px 26px",
                borderRadius: "12px",
                fontWeight: 800,
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                boxShadow: "0 6px 20px rgba(37,99,235,0.35)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
                color: "#ffffff",
              }}
            >
              <Sparkles size={18} />
              Enter Patient Portal
              <ArrowRight size={18} />
            </Link>

            <Link
              className="btn btn-secondary"
              to="/doctor-login"
              style={{
                fontSize: "1.02rem",
                padding: "14px 24px",
                borderRadius: "12px",
                fontWeight: 700,
                backgroundColor: "#f8fafc",
                color: "#1e293b",
                border: "1.5px solid #cbd5e1",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                textDecoration: "none",
              }}
            >
              <Stethoscope size={18} style={{ color: "#2563eb" }} />
              Doctor Workspace
            </Link>
          </div>

          <div className="hero-trust" style={{ display: "grid", gap: "16px", paddingTop: "20px", borderTop: "1px solid rgba(226,232,240,0.8)" }}>
            <div className="trust-item" style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "#eff6ff", color: "#2563eb" }}>
                <Building2 size={20} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.9rem", color: "#0f172a" }}>5 Regional Hub</strong>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Dr. Agarwal's Network</span>
              </div>
            </div>

            <div className="trust-item" style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "#f0fdf4", color: "#10b981" }}>
                <Brain size={20} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.9rem", color: "#0f172a" }}>Dual-Model XAI</strong>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Grad-CAM + Clinical Q&amp;A</span>
              </div>
            </div>

            <div className="trust-item" style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "#fef3c7", color: "#d97706" }}>
                <MapPin size={20} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.9rem", color: "#0f172a" }}>Direct Specialist</strong>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Automated branch sync</span>
              </div>
            </div>

            <div className="trust-item" style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <div style={{ padding: "8px", borderRadius: "10px", backgroundColor: "#fce7f3", color: "#db2777" }}>
                <Eye size={20} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "0.9rem", color: "#0f172a" }}>Uveitis</strong>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>5th leading cause of blindness</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Live Clinical Card Simulation */}
        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.08 }}
        >


          <div
            className="hero-dashboard card"
            style={{
              borderRadius: "26px",
              padding: "24px",
              boxShadow: "0 24px 60px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(191, 219, 254, 0.7)",
              background: "linear-gradient(165deg, #ffffff 0%, #f8fafc 55%, #eff6ff 100%)",
              position: "relative",
            }}
          >
            {/* Card Header Chips */}
            <div className="hero-dashboard-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div className="mini-chip" style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", padding: "4px 12px", borderRadius: "8px", fontSize: "0.78rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#2563eb", boxShadow: "0 0 8px #2563eb" }} />
                Synced Patient Case
              </div>
              <div className="mini-chip secondary" style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748b", backgroundColor: "#f1f5f9", padding: "4px 10px", borderRadius: "8px" }}>
                Case #PT-AG-8942
              </div>
            </div>

            {/* Score Row with Slitlamp Eye Aperture Lens */}
            <div className="dashboard-main-score" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              
              {/* Ophthalmic Slitlamp Aperture Ring with Real Eye Photo Texture */}
              <div
                style={{
                  position: "relative",
                  width: "78px",
                  height: "78px",
                  flexShrink: 0,
                  borderRadius: "50%",
                  padding: "3px",
                  background: "conic-gradient(#ef4444 0% 94%, #e2e8f0 94% 100%)",
                  boxShadow: "0 0 18px rgba(239, 68, 68, 0.35)",
                }}
              >
                {/* Circular Lens with Real Slitlamp Photo */}
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "2px solid #ffffff",
                    boxShadow: "inset 0 0 12px rgba(0, 0, 0, 0.75)",
                    backgroundColor: "#050914",
                  }}
                >
                  <img
                    src="/images/hero-slitlamp-eye.jpg"
                    alt="Clinical slitlamp biomicroscopy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transform: "scale(1.3)",
                      filter: "contrast(1.2) saturate(1.15)",
                    }}
                  />

                  {/* Grad-CAM Saliency Hotspot Texture */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "radial-gradient(circle at 35% 45%, rgba(239, 68, 68, 0.75) 0%, rgba(245, 158, 11, 0.5) 40%, transparent 75%)",
                      mixBlendMode: "screen",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Slitlamp Optical Illumination Beam */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: "36%",
                      width: "4px",
                      background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(191,219,254,0.9) 50%, rgba(255,255,255,0.95) 100%)",
                      boxShadow: "0 0 8px rgba(255,255,255,0.95), 0 0 14px rgba(56,189,248,0.8)",
                      transform: "rotate(10deg)",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                {/* Score Pill Overlay */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "-5px",
                    right: "-6px",
                    backgroundColor: "rgba(15, 23, 42, 0.92)",
                    backdropFilter: "blur(6px)",
                    border: "1.5px solid rgba(255, 255, 255, 0.4)",
                    color: "#ffffff",
                    fontSize: "0.75rem",
                    fontWeight: 900,
                    padding: "2px 7px",
                    borderRadius: "10px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#ef4444", boxShadow: "0 0 5px #ef4444" }} />
                  94%
                </div>
              </div>

              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                  Acute Uveitis Identified
                </h3>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.78rem", color: "#dc2626", fontWeight: 800, backgroundColor: "#fee2e2", padding: "2px 8px", borderRadius: "6px" }}>
                    High Urgency • Slitlamp Indicated
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#0369a1", fontWeight: 700, backgroundColor: "#e0f2fe", padding: "2px 6px", borderRadius: "6px" }}>
                    KPs Detected
                  </span>
                </div>
              </div>
            </div>

            {/* Clinical Slitlamp Image Scan Window with Grad-CAM Saliency Texture */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "155px",
                borderRadius: "16px",
                overflow: "hidden",
                marginBottom: "16px",
                backgroundColor: "#050914",
                border: "1.5px solid rgba(191, 219, 254, 0.9)",
                boxShadow: "inset 0 0 24px rgba(0, 0, 0, 0.8), 0 8px 24px rgba(15, 23, 42, 0.08)",
              }}
            >
              {/* Actual Slitlamp Eye Image Texture */}
              <img
                src="/images/hero-slitlamp-eye.jpg"
                alt="Slitlamp biomicroscopy examination"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "center 42%",
                  filter: "contrast(1.12) brightness(0.96)",
                }}
              />

              {/* Multi-tier Grad-CAM Heatmap Radial Overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "radial-gradient(circle at 40% 46%, rgba(239, 68, 68, 0.78) 0%, rgba(245, 158, 11, 0.55) 32%, rgba(37, 99, 235, 0.22) 58%, transparent 78%)",
                  mixBlendMode: "screen",
                  pointerEvents: "none",
                }}
              />

              {/* Optical Slit Beam Glare Overlay */}
              <div
                style={{
                  position: "absolute",
                  top: "-10%",
                  bottom: "-10%",
                  left: "38%",
                  width: "12px",
                  background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 40%, rgba(186,230,253,0.9) 60%, rgba(255,255,255,0) 100%)",
                  filter: "blur(2px)",
                  transform: "rotate(10deg)",
                  mixBlendMode: "screen",
                  pointerEvents: "none",
                }}
              />

              {/* Saliency Bounding Box for Keratic Precipitates */}
              <div
                style={{
                  position: "absolute",
                  top: "28%",
                  left: "32%",
                  width: "36%",
                  height: "46%",
                  border: "1.5px solid #38bdf8",
                  borderRadius: "8px",
                  backgroundColor: "rgba(56, 189, 248, 0.12)",
                  boxShadow: "0 0 10px rgba(56, 189, 248, 0.45)",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-9px",
                    left: "6px",
                    backgroundColor: "#0284c7",
                    color: "#ffffff",
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    padding: "1px 5px",
                    borderRadius: "4px",
                    letterSpacing: "0.02em",
                  }}
                >
                  KP Footprint (96.4%)
                </div>
              </div>

              {/* Top Viewfinder Pill */}
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  left: "8px",
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  backdropFilter: "blur(6px)",
                  color: "#93c5fd",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  border: "1px solid rgba(147, 197, 253, 0.3)",
                }}
              >
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 6px #10b981" }} />
                SLITLAMP GRAD-CAM SENSING
              </div>

              {/* Bottom Biomarker Pill */}
              <div
                style={{
                  position: "absolute",
                  bottom: "8px",
                  right: "8px",
                  backgroundColor: "rgba(15, 23, 42, 0.85)",
                  backdropFilter: "blur(6px)",
                  color: "#fde047",
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(253, 224, 71, 0.3)",
                }}
              >
                AC Cells +3 Grade • Flare +2
              </div>
            </div>

            {/* XAI Preview Feature Bars */}
            <div style={{ marginBottom: "16px", backgroundColor: "#f8fafc", padding: "12px 14px", borderRadius: "14px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b", marginBottom: "8px", letterSpacing: "0.03em" }}>
                EXPLAINABLE AI (XAI) ATTRIBUTION
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>Severe Photophobia (9/10)</span>
                    <strong style={{ color: "#ef4444" }}>+94%</strong>
                  </div>
                  <div style={{ height: "6px", borderRadius: "3px", backgroundColor: "#e2e8f0", overflow: "hidden", marginTop: "3px" }}>
                    <div style={{ width: "94%", height: "100%", background: "linear-gradient(90deg, #f87171, #ef4444)" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>Perilimbal Redness &amp; Pain</span>
                    <strong style={{ color: "#f97316" }}>+88%</strong>
                  </div>
                  <div style={{ height: "6px", borderRadius: "3px", backgroundColor: "#e2e8f0", overflow: "hidden", marginTop: "3px" }}>
                    <div style={{ width: "88%", height: "100%", background: "linear-gradient(90deg, #fb923c, #f97316)" }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>Autoimmune / Joint Pain Flag</span>
                    <strong style={{ color: "#8b5cf6" }}>+85%</strong>
                  </div>
                  <div style={{ height: "6px", borderRadius: "3px", backgroundColor: "#e2e8f0", overflow: "hidden", marginTop: "3px" }}>
                    <div style={{ width: "85%", height: "100%", background: "linear-gradient(90deg, #a78bfa, #8b5cf6)" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.76rem", color: "#64748b", borderTop: "1px dashed #cbd5e1", paddingTop: "12px" }}>
              <span>✓ Synced to Dr. Agarwal's SQLite DB</span>
              <span style={{ color: "#059669", fontWeight: 800 }}>Grad-CAM Overlay Verified</span>
            </div>
          </div>

          {/* Floating Clinical Card with Slitlamp Macro Thumbnail */}
          <div
            className="floating-card floating-card-b card"
            style={{
              bottom: "-20px",
              right: "8px",
              zIndex: 5,
              padding: "12px 16px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 14px 34px rgba(15, 23, 42, 0.15)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              backgroundColor: "#ffffff",
            }}
          >
            {/* Eye Thumbnail */}
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1.5px solid #10b981",
                boxShadow: "0 0 10px rgba(16, 185, 129, 0.3)",
                flexShrink: 0,
              }}
            >
              <img
                src="/images/hero-slitlamp-eye.jpg"
                alt="Cornea Keratic Precipitates"
                style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.5)" }}
              />
            </div>

            <div>
              <span className="floating-title" style={{ color: "#059669", fontWeight: 800, fontSize: "0.75rem", display: "block" }}>
                Vision Transformer Grad-CAM
              </span>
              <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>Keratic Precipitates Detected</strong>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
                Endothelial footprint (96.4%)
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

