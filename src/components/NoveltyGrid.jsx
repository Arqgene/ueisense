import { motion } from "framer-motion";
import { Puzzle, Bot, SearchCheck, BookOpenText, ArrowUpRight } from "lucide-react";

const novelty = [
  {
    icon: <Bot size={18} />,
    title: "Fuzzy symptom reasoning",
    text: "Uses uncertainty-aware symptom processing instead of hard binary screening.",
  },
  {
    icon: <SearchCheck size={18} />,
    title: "Image quality gate",
    text: "Rejects unreliable input before model inference.",
  },
  {
    icon: <Puzzle size={18} />,
    title: "Localization before subtype",
    text: "Mirrors real ophthalmology workflow: where first, then what.",
  },
  {
    icon: <BookOpenText size={18} />,
    title: "Dual explainability",
    text: "Gives both visual heatmaps and natural-language reasoning.",
  },
  {
    icon: <ArrowUpRight size={18} />,
    title: "Actionable output",
    text: "Ends with referral support, not just a label.",
  },
  {
    icon: <SearchCheck size={18} />,
    title: "Recurrence awareness",
    text: "Adds longitudinal thinking instead of single-visit detection.",
  },
];

export default function NoveltyGrid() {
  return (
    <section className="section" id="novelty">
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <span className="section-label">Novelty</span>
          <h2 className="section-title">Beyond a simple classifier.</h2>
          <p className="section-subtitle">
            This framework behaves like a clinical reasoning system, not a
            single-image prediction model.
          </p>
        </motion.div>

        <div className="bento-grid novelty-grid">
          {novelty.map((item, index) => (
            <motion.article
              key={item.title}
              className={`novelty-card card novelty-${index + 1}`}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.04 }}
            >
              <div className="novelty-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
