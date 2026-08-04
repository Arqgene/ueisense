import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Brain, Activity } from "lucide-react";

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero-grid">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Next-gen clinical screening framework
          </div>

          <h1>
            Hierarchical Explainable AI for{" "}
            <span className="gradient-text">Uveitis Screening</span>
          </h1>

          <p className="hero-desc">
            A premium clinical AI workflow that starts with fuzzy symptom
            screening, validates image quality, localizes inflammation,
            classifies subtype and severity, predicts recurrence risk, and
            explains every decision in clinician-friendly language.
          </p>

          <div className="hero-actions">
            <Link className="btn btn-primary" to="/questionnaire">
              Start Patient Intake
              <ArrowRight size={18} />
            </Link>
            <a className="btn btn-secondary" href="#pipeline">
              View Architecture
            </a>
          </div>

          <div className="hero-trust">
            <div className="trust-item">
              <ShieldCheck size={18} />
              <div>
                <strong>Safe triage</strong>
                <span>Decision support, not auto-prescription</span>
              </div>
            </div>
            <div className="trust-item">
              <Brain size={18} />
              <div>
                <strong>Clinical reasoning</strong>
                <span>Fuzzy logic + XAI + structured output</span>
              </div>
            </div>
            <div className="trust-item">
              <Activity size={18} />
              <div>
                <strong>Recurrence aware</strong>
                <span>Risk-based follow-up and referral support</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.08 }}
        >
          <div className="floating-card floating-card-a card">
            <span className="floating-title">Symptom engine</span>
            <strong>Fuzzy inference</strong>
            <p>Redness, pain, photophobia, floaters, blurred vision</p>
          </div>

          <div className="hero-dashboard card">
            <div className="hero-dashboard-top">
              <div className="mini-chip">Live AI Screening</div>
              <div className="mini-chip secondary">Light Theme</div>
            </div>

            <div className="dashboard-main-score">
              <div className="score-ring">
                <span>87%</span>
              </div>
              <div>
                <h3>Uveitis Suspicion</h3>
                <p>High-confidence screening result</p>
              </div>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-card">
                <span className="dashboard-label">Anatomical site</span>
                <strong>Anterior</strong>
              </div>
              <div className="dashboard-card">
                <span className="dashboard-label">Severity</span>
                <strong>Moderate</strong>
              </div>
              <div className="dashboard-card">
                <span className="dashboard-label">Recurrence risk</span>
                <strong>78%</strong>
              </div>
              <div className="dashboard-card heatmap">
                <span className="dashboard-label">XAI heatmap</span>
                <strong>Grad-CAM</strong>
              </div>
            </div>

            <div className="dashboard-footer">
              <span>Clinician-readable reasoning generated</span>
              <span>Retake recommended if image quality is low</span>
            </div>
          </div>

          <div className="floating-card floating-card-b card">
            <span className="floating-title">Quality gate</span>
            <strong>Image validation</strong>
            <p>Blur, exposure, occlusion, angle, resolution checks</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
