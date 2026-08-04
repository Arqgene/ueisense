import { motion } from "framer-motion";
import { AlertTriangle, Eye, TimerReset, Stethoscope, ScanEye } from "lucide-react";

const painPoints = [
  {
    icon: <AlertTriangle size={18} />,
    title: "Subjective early symptoms",
    text: "Early uveitis signs are vague and easily missed in non-specialist settings.",
  },
  {
    icon: <Eye size={18} />,
    title: "Expert-dependent examination",
    text: "Slit-lamp interpretation depends on experience and clinical context.",
  },
  {
    icon: <ScanEye size={18} />,
    title: "Variable image interpretation",
    text: "Image quality and interpretation can vary across users and devices.",
  },
  {
    icon: <TimerReset size={18} />,
    title: "Recurrence is common",
    text: "Repeated episodes require follow-up rather than one-time classification.",
  },
  {
    icon: <Stethoscope size={18} />,
    title: "Delayed access to specialists",
    text: "A structured front-end screening layer can help with earlier referral.",
  },
];

export default function ClinicalProblem() {
  return (
    <section className="section section-alt" id="problem">
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="section-label">Clinical problem</span>
          <h2 className="section-title">Why a simple CNN is not enough.</h2>
          <p className="section-subtitle">
            Uveitis screening needs more than a binary classifier. It needs
            symptom reasoning, image validation, localization, explainability,
            and recurrence-aware support.
          </p>
        </motion.div>

        <div className="problem-grid">
          {painPoints.map((item, index) => (
            <motion.article
              key={item.title}
              className="problem-card card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <div className="problem-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
