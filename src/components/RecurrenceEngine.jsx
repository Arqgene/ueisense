import { motion } from "framer-motion";
import { History, Repeat2, ClipboardList, TrendingUp, AlarmClock } from "lucide-react";

const factors = [
  "Previous episodes",
  "Severity level",
  "Symptom duration",
  "Treatment history",
  "Prior response",
];

export default function RecurrenceEngine() {
  return (
    <section className="section section-alt" id="recurrence">
      <div className="container">
        <div className="recurrence-grid">
          <motion.div
            className="recurrence-copy card"
            initial={{ opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <span className="section-label">Unique feature</span>
            <h2 className="section-title">A recurrence-aware risk engine.</h2>
            <p className="section-subtitle">
              Uveitis often returns. This layer uses history, severity,
              treatment, and response patterns to estimate recurrence risk and
              suggest follow-up urgency.
            </p>

            <div className="factor-list">
              {factors.map((factor) => (
                <span key={factor} className="factor-pill">
                  <Repeat2 size={14} />
                  {factor}
                </span>
              ))}
            </div>

            <div className="recurrence-signals">
              <div className="signal">
                <History size={18} />
                <div>
                  <strong>History aware</strong>
                  <span>Uses prior episode information</span>
                </div>
              </div>
              <div className="signal">
                <TrendingUp size={18} />
                <div>
                  <strong>Risk ranked</strong>
                  <span>Outputs a probability-like recurrence score</span>
                </div>
              </div>
              <div className="signal">
                <AlarmClock size={18} />
                <div>
                  <strong>Follow-up support</strong>
                  <span>Suggests observation, review, or urgent referral</span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="recurrence-meter card"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <div className="meter-head">
              <ClipboardList size={18} />
              <span>Recurrence score</span>
            </div>

            <div className="meter-ring">
              <div className="meter-core">
                <strong>78%</strong>
                <span>High recurrence risk</span>
              </div>
            </div>

            <div className="meter-footer">
              <p>
                The system can flag patients for closer monitoring when prior
                episodes and current severity indicate increased recurrence
                probability.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
