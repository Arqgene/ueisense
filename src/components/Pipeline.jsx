import { motion } from "framer-motion";
import {
  MessageCircleMore,
  ImageUp,
  Crosshair,
  ScanFace,
  BadgeInfo,
  ChevronDown,
  MapPin,
} from "lucide-react";

const steps = [
  {
    icon: <MessageCircleMore size={22} />,
    title: "1. Patient Clinical Intake & Fuzzy Triage",
    desc: "Evaluates patient eye symptoms (pain, redness, photophobia) and systemic markers using adaptive neuro-fuzzy inference.",
    tag: "Phase 1",
  },
  {
    icon: <ImageUp size={22} />,
    title: "2. Slitlamp & Ocular Image Analysis",
    desc: "Processes corneal and anterior chamber slitlamp photographs with our Vision Transformer deep learning model.",
    tag: "Phase 2",
  },
  {
    icon: <BadgeInfo size={22} />,
    title: "3. Dual-Model Explainable AI (XAI)",
    desc: "Generates visual Grad-CAM saliency heatmaps on the eye image and clinical feature importance attribution on symptoms.",
    tag: "Phase 3",
  },
  {
    icon: <MapPin size={22} />,
    title: "4. Nearest Hospital & Specialist Routing",
    desc: "Identifies the nearest Dr. Agarwal's Eye Hospital branch and routes the diagnostic case directly to a dedicated Uveitis expert.",
    tag: "Phase 4",
  },
  {
    icon: <ScanFace size={22} />,
    title: "5. Real-Time Specialist Dashboard Sync",
    desc: "The assigned ophthalmologist receives the patient's questions, image XAI, and clinical justification under the patient's name via SQLite API.",
    tag: "Phase 5",
  },
];

export default function Pipeline() {
  return (
    <section className="section" id="architecture">
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="section-label">Screening Architecture</span>
          <h2 className="section-title">End-to-End AI Clinical Workflow</h2>
          <p className="section-subtitle">
            From patient symptom intake to specialist validation across Dr. Agarwal's Eye Hospital network.
          </p>
        </motion.div>

        <div className="pipeline-shell card">
          {steps.map((step, index) => (
            <motion.div
              className="pipeline-step"
              key={step.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <div className="pipeline-step-left">
                <div className="pipeline-icon">{step.icon}</div>
                <span className="pipeline-tag">{step.tag}</span>
              </div>

              <div className="pipeline-step-content">
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>

              {index < steps.length - 1 && (
                <div className="pipeline-arrow">
                  <ChevronDown size={18} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

