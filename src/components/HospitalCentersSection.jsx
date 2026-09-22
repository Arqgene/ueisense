import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Phone, Star, Clock, Calendar, CheckCircle2, ArrowRight, Stethoscope, ShieldCheck } from "lucide-react";
import { AGARWAL_CENTERS } from "../utils/agarwalCenters.js";

export default function HospitalCentersSection() {
  return (
    <section className="section" id="centers" style={{ padding: "80px 0", backgroundColor: "#f8fafc" }}>
      <div className="container">
        <motion.div
          className="section-head"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          style={{ textAlign: "center", maxWidth: "780px", margin: "0 auto 48px" }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "5px 14px",
              borderRadius: "20px",
              backgroundColor: "rgba(37, 99, 235, 0.08)",
              border: "1px solid rgba(37, 99, 235, 0.2)",
              color: "#2563eb",
              fontSize: "0.82rem",
              fontWeight: 800,
              marginBottom: "12px",
            }}
          >
            <MapPin size={14} />
            DIRECT REFERRAL NETWORK
          </div>
          <h2 style={{ fontSize: "2.35rem", fontWeight: 900, color: "#0f172a", marginBottom: "14px", letterSpacing: "-0.02em" }}>
            Dr. Agarwal's Eye Hospital Uveitis Centers
          </h2>
          <p style={{ fontSize: "1.02rem", color: "#64748b", lineHeight: 1.6 }}>
            Screen your symptoms online and instantly route your diagnostic file with full AI &amp; XAI reasoning to our dedicated Uveitis specialists across 5 flagship hospital branches.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {AGARWAL_CENTERS.map((center, index) => (
            <motion.div
              key={center.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "24px",
                border: "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow: "0 6px 24px rgba(15, 23, 42, 0.04)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
              }}
              whileHover={{ y: -4, boxShadow: "0 14px 36px rgba(37, 99, 235, 0.1)" }}
            >
              <div>
                {/* Branch Header Badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 800,
                      color: "#2563eb",
                      backgroundColor: "rgba(37, 99, 235, 0.08)",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {center.badge}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#fef3c7", padding: "3px 8px", borderRadius: "10px" }}>
                    <Star size={13} style={{ fill: "#d97706", color: "#d97706" }} />
                    <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#92400e" }}>{center.rating}</span>
                    <span style={{ fontSize: "0.74rem", color: "#b45309" }}>({center.reviews})</span>
                  </div>
                </div>

                {/* Doctor Name & Specialty */}
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", marginBottom: "14px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      flexShrink: 0,
                    }}
                  >
                    <Stethoscope size={22} />
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 2px", fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                      {center.name}
                    </h3>
                    <p style={{ margin: "0 0 4px", fontSize: "0.82rem", fontWeight: 700, color: "#2563eb" }}>
                      {center.title}
                    </p>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {center.experience} Experience • {center.fellowship}
                    </span>
                  </div>
                </div>

                {/* Clinic Location & Distance */}
                <div style={{ backgroundColor: "#f8fafc", padding: "12px 14px", borderRadius: "12px", marginBottom: "16px", fontSize: "0.82rem", color: "#475569", lineHeight: 1.4 }}>
                  <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>
                    {center.hospital}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", marginBottom: "4px" }}>
                    <MapPin size={13} style={{ flexShrink: 0 }} />
                    <span>{center.address}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#059669", fontWeight: 700 }}>
                    <Clock size={13} style={{ flexShrink: 0 }} />
                    <span>Next Slot: {center.nextSlot} • <strong>{center.distance}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div>
                <Link
                  to={`/patient-portal?center=${center.id}`}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.88rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    textDecoration: "none",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                    transition: "background-color 0.2s ease",
                  }}
                >
                  <Calendar size={15} />
                  Route My Intake Here
                  <ArrowRight size={14} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
