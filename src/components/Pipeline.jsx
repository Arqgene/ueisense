import { motion } from "framer-motion";
import {
  MessageCircleMore,
  ImageUp,
  Crosshair,
  ScanFace,
  BadgeInfo,
  ChevronDown,
} from "lucide-react";

const steps = [
  {
    icon: <MessageCircleMore size={22} />,
    title: "Fuzzy Symptom Screening",
    desc: "Turns uncertain patient symptoms into a suspicion score using fuzzy inference.",
    tag: "Layer 1",
  },
  {
    icon: <ImageUp size={22} />,
    title: "Image Upload & Quality Check",
    desc: "Detects blur, illumination issues, wrong angle, occlusion, and low-resolution inputs.",
    tag: "Layer 2",
  },
  {
    icon: <Crosshair size={22} />,
    title: "Anatomical Localization",
    desc: "First identifies where inflammation is before subtype classification.",
    tag: "Layer 3",
  },
  {
    icon: <ScanFace size={22} />,
    title: "Type & Severity Classification",
    desc: "Classifies anterior, posterior, intermediate, or panuveitis and severity.",
    tag: "Layer 4",
  },
  {
    icon: <BadgeInfo size={22} />,
    title: "Explainable AI Output",
    desc: "Shows heatmaps and human-readable reasoning for trust and transparency.",
    tag: "Layer 5",
  },
];

export default function Pipeline() {
  return (
    <section className="section" id="pipeline">
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="section-label">Core architecture</span>
          <h2 className="section-title">A workflow-style clinical reasoning pipeline.</h2>
          <p className="section-subtitle">
            This is not just a detector. It is a layered decision-support
            system that mirrors how an ophthalmologist thinks.
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
