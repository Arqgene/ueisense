import { motion } from "framer-motion";
import { Activity, ShieldCheck, MapPin, Gauge, BrainCircuit } from "lucide-react";

const metrics = [
  { label: "Suspicion", value: "87%", icon: <Gauge size={16} /> },
  { label: "Localization", value: "Anterior", icon: <MapPin size={16} /> },
  { label: "Severity", value: "Moderate", icon: <Activity size={16} /> },
  { label: "Recurrence", value: "78%", icon: <ShieldCheck size={16} /> },
];

export default function DashboardPreview() {
  return (
    <section className="section section-alt">
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="section-label">System output</span>
          <h2 className="section-title">What the clinician actually receives.</h2>
          <p className="section-subtitle">
            Safe decision support with interpretable outputs, not a black-box
            answer.
          </p>
        </motion.div>

        <div className="dashboard-layout">
          <motion.div
            className="dashboard-panel card"
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <div className="panel-header">
              <div>
                <span className="small-kicker">Screening summary</span>
                <h3>AI clinical dashboard</h3>
              </div>
              <BrainCircuit size={18} />
            </div>

            <div className="radial-score">
              <div className="radial-score-ring">
                <span>87%</span>
              </div>
              <div>
                <strong>Uveitis suspicion score</strong>
                <p>Derived from fuzzy symptom inference</p>
              </div>
            </div>

            <div className="metric-grid">
              {metrics.map((metric) => (
                <div className="metric-card" key={metric.label}>
                  <span className="metric-icon">{metric.icon}</span>
                  <span className="metric-label">{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="dashboard-panel card preview-panel"
            initial={{ opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <div className="panel-header">
              <div>
                <span className="small-kicker">Interpretability</span>
                <h3>Visual + textual reasoning</h3>
              </div>
            </div>

            <div className="heatmap-box">
              <div className="heatmap-overlay">
                <span>Grad-CAM</span>
              </div>
              <div className="heatmap-glow one" />
              <div className="heatmap-glow two" />
              <div className="heatmap-glow three" />
              <div className="heatmap-caption">
                Highlighting inflammation-related regions
              </div>
            </div>

            <div className="explain-box">
              <strong>Explanation</strong>
              <p>
                High redness score, photophobia present, anterior chamber
                inflammation detected, and recurrence history suggests close
                follow-up.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
