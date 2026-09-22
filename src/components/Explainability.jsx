import { motion } from "framer-motion";
import { Eye, MessageSquareText, Layers3, Sparkles, Sliders, BrainCircuit } from "lucide-react";

const items = [
  {
    icon: <Eye size={18} />,
    title: "Image Grad-CAM Saliency",
    text: "Deep visual heatmaps localize keratic precipitates, anterior chamber flare, ciliary flush, and pupillary irregularities on slitlamp photographs.",
  },
  {
    icon: <Sliders size={18} />,
    title: "Question Model Feature Attribution",
    text: "Transparent weight attribution ranks symptom scores (photophobia, redness, pain) and systemic risk factors (HLA-B27, joint pain, prior uveitis).",
  },
  {
    icon: <MessageSquareText size={18} />,
    title: "Clinician-Readable Plain Language",
    text: "Produces human-readable clinical justifications explaining why a case was flagged, directly accessible to both patient and consulting ophthalmologist.",
  },
  {
    icon: <BrainCircuit size={18} />,
    title: "Dr. Agarwal's Diagnostic Alignment",
    text: "Calibrated against real-world uveitis grading protocols to ensure high diagnostic concordance and eliminate false-negative acute crises.",
  },
];

export default function Explainability() {
  return (
    <section className="section" id="xai">
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="section-label">Explainable AI (XAI)</span>
          <h2 className="section-title">Transparent Dual-Mode Explainable AI</h2>
          <p className="section-subtitle">
            Every clinical decision is justified twice: visually via Grad-CAM image heatmaps and clinically via question feature importance.
          </p>
        </motion.div>

        <div className="xai-grid">
          {items.map((item, index) => (
            <motion.article
              key={item.title}
              className="xai-card card"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <div className="xai-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

