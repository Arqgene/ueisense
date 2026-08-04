import { motion } from "framer-motion";
import { Eye, MessageSquareText, Layers3, Sparkles } from "lucide-react";

const items = [
  {
    icon: <Eye size={18} />,
    title: "Visual explanation",
    text: "Heatmaps show which regions contributed to the prediction, such as keratic precipitates, cells, flare, retinal lesions, or vitreous haze.",
  },
  {
    icon: <MessageSquareText size={18} />,
    title: "Text explanation",
    text: "The system generates human-readable reasoning so the output can be reviewed by clinicians or used for triage documentation.",
  },
  {
    icon: <Layers3 size={18} />,
    title: "Layered reasoning",
    text: "Each layer contributes one clinical function: suspicion, validation, localization, classification, and explanation.",
  },
  {
    icon: <Sparkles size={18} />,
    title: "Trust calibration",
    text: "A confidence-aware summary helps users understand when the model is strong and when image retake or review is needed.",
  },
];

export default function Explainability() {
  return (
    <section className="section" id="explainability">
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="section-label">Explainability</span>
          <h2 className="section-title">Dual-mode XAI for clinical trust.</h2>
          <p className="section-subtitle">
            The framework explains itself twice: once visually, once in
            clinician-readable language.
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
