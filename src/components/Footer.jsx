import { Eye, ShieldCheck, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer" style={{ backgroundColor: "#0b132b", color: "#94a3b8", padding: "64px 0 32px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
      <div className="container footer-inner" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "32px", marginBottom: "40px" }}>
        <div style={{ maxWidth: "480px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff" }}>
              <Eye size={18} />
            </div>
            <div>
              <strong style={{ color: "#ffffff", fontSize: "1.2rem", display: "block" }}>
                Uveisense <span style={{ color: "#60a5fa" }}>AI</span>
              </strong>
              <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                Arqgene × Dr. Agarwal's Eye Hospital
              </span>
            </div>
          </div>
          <p style={{ fontSize: "0.86rem", lineHeight: 1.6, color: "#94a3b8", margin: 0 }}>
            An advanced clinical artificial intelligence platform designed to eliminate preventable blindness through early, explainable uveitis screening and direct patient routing to specialist tertiary care.
          </p>
        </div>

        <div style={{ display: "flex", gap: "48px", flexWrap: "wrap" }}>
          <div>
            <h4 style={{ color: "#ffffff", fontSize: "0.9rem", fontWeight: 800, margin: "0 0 12px" }}>Network Hubs</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.82rem", lineHeight: 1.8 }}>
              <li>Chennai Main (Cathedral Rd)</li>
              <li>Bengaluru (Indiranagar)</li>
              <li>Hyderabad (Banjara Hills)</li>
              <li>Chennai (Velachery)</li>
              <li>Coimbatore (R.S. Puram)</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: "#ffffff", fontSize: "0.9rem", fontWeight: 800, margin: "0 0 12px" }}>Clinical Portals</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "0.82rem", lineHeight: 1.8 }}>
              <li><a href="/patient-portal" style={{ color: "#60a5fa", textDecoration: "none" }}>Patient Intake Portal</a></li>
              <li><a href="/doctor-login" style={{ color: "#94a3b8", textDecoration: "none" }}>Specialist Doctor Login</a></li>
              <li><a href="#xai" style={{ color: "#94a3b8", textDecoration: "none" }}>Dual-Model XAI Engine</a></li>
              <li><a href="#centers" style={{ color: "#94a3b8", textDecoration: "none" }}>Nearby Centers</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", fontSize: "0.78rem" }}>
        <span>© {new Date().getFullYear()} Uveisense AI • Arqgene Inc. &amp; Dr. Agarwal's Eye Hospital Network. All rights reserved.</span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <ShieldCheck size={14} style={{ color: "#10b981" }} />
          Medical Decision Support Framework • Powered by Deep Learning &amp; Neuro-Fuzzy Inference
        </span>
      </div>
    </footer>
  );
}

