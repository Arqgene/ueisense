import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldPlus } from "lucide-react";

export default function CTA() {
  return (
    <section className="section section-alt">
      <div className="container">
        <motion.div
          className="cta-shell card"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          <div className="cta-copy">
            <span className="section-label">Clinical decision support</span>
            <h2 className="section-title">A research-ready framework for screening.</h2>
            <p className="section-subtitle">
              Uveitis is designed for academic evaluation, prototype
              demonstrations, and future expansion into a real clinical AI
              platform.
            </p>
          </div>

          <div className="cta-actions">
            <Link className="btn btn-primary" to="/questionnaire">
              Start Diagnostic Intake
              <ArrowRight size={18} />
            </Link>
            <div className="cta-note">
              <ShieldPlus size={18} />
              <span>Decision support only, not automatic treatment.</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
