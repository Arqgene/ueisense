import { motion } from "framer-motion";
import { AlertTriangle, Eye, TimerReset, Stethoscope, ScanEye, Building2 } from "lucide-react";

const painPoints = [
  {
    icon: <AlertTriangle size={18} />,
    title: "10-15% of Preventable Blindness",
    text: "Uveitis is the 3rd leading cause of preventable blindness in the working-age population, often misdiagnosed as simple conjunctivitis.",
  },
  {
    icon: <Eye size={18} />,
    title: "Subtle Slit-Lamp Biomarkers",
    text: "Keratic precipitates, anterior chamber flare, and hypopyon require seasoned ophthalmic expertise to detect in early stages.",
  },
  {
    icon: <ScanEye size={18} />,
    title: "Multi-Modal AI Synergy",
    text: "Pure symptom checklists or standalone CNN models fall short. Fusing fuzzy symptom reasoning with deep image models achieves clinical-grade triage.",
  },
  {
    icon: <TimerReset size={18} />,
    title: "High Risk of Recurrence",
    text: "Over 60% of non-infectious anterior uveitis cases flare repeatedly, demanding longitudinal risk modeling and HLA-B27 tracking.",
  },
  {
    icon: <Building2 size={18} />,
    title: "Direct Specialist Routing",
    text: "Bridging patients from home screening directly to the nearest Dr. Agarwal's Eye Hospital tertiary uveitis clinic eliminates diagnostic delays.",
  },
];

export default function ClinicalProblem() {
  return (
    <section className="section section-alt" id="mission">
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="section-label">Partnership &amp; Mission</span>
          <h2 className="section-title">The Arqgene × Dr. Agarwal's Clinical Mission</h2>
          <p className="section-subtitle">
            Bridging the gap between intelligent home triage and India's foremost ocular immunology clinics to prevent irreversible vision loss and streamline urgent care.
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

