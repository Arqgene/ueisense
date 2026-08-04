import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Calendar, Clock, Star, Phone, Navigation, AlertCircle, X, Shield } from "lucide-react";

const fakeDoctors = [
  {
    id: "doc-1",
    name: "Dr. Elena Rostova, MD",
    clinic: "Metropolitan Ocular Immunology Center",
    specialty: "Uveitis & Inflammatory Eye Disease",
    rating: 4.9,
    reviews: 128,
    distance: "1.2 miles away",
    address: "742 Evergreen Terrace, Suite 400",
    phone: "(555) 234-8901",
    nextAvailable: "Today, 3:30 PM",
    coords: { x: 38, y: 42 },
  },
  {
    id: "doc-2",
    name: "Dr. Marcus Vance, MD, PhD",
    clinic: "Vision & Retina Specialists",
    specialty: "Retinal Vasculitis & Posterior Uveitis",
    rating: 4.8,
    reviews: 94,
    distance: "2.8 miles away",
    address: "1088 Innovation Way, Bldg B",
    phone: "(555) 678-1234",
    nextAvailable: "Tomorrow, 9:00 AM",
    coords: { x: 62, y: 28 },
  },
  {
    id: "doc-3",
    name: "Dr. Priya Patel, MD",
    clinic: "University Eye Institute & Research",
    specialty: "Anterior Uveitis & Cornea",
    rating: 4.95,
    reviews: 210,
    distance: "4.1 miles away",
    address: "500 Medical Center Drive",
    phone: "(555) 901-4567",
    nextAvailable: "Thursday, 11:15 AM",
    coords: { x: 75, y: 68 },
  },
];

export default function NearbyDoctorsMap() {
  const [showModal, setShowModal] = useState(false);
  const [modalSource, setModalSource] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(fakeDoctors[0]);

  const handleUnderDevelopment = (source = "general") => {
    setModalSource(source);
    setShowModal(true);
  };

  return (
    <div className="nearby-doctors-section card animate-fade-in" style={{ marginTop: "32px", padding: "28px" }}>
      <div className="nearby-header" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: "8px" }}>
              <Navigation size={13} style={{ marginRight: "6px" }} />
              Location Screening matched
            </span>
            <h3 style={{ margin: "4px 0 0", fontSize: "1.35rem", fontWeight: 800 }}>
              Nearby Uveitis & Ocular Specialists
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "#64748b" }}>
              Recommended ophthalmologists & immunology centers near your location
            </p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => handleUnderDevelopment("Live Location Search")}
            style={{ fontSize: "0.85rem", padding: "8px 14px" }}
          >
            <MapPin size={14} style={{ marginRight: "6px" }} />
            Change Location
          </button>
        </div>
      </div>

      <div className="doctors-map-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Doctor List */}
        <div className="doctors-list" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {fakeDoctors.map((doc) => {
            const isSelected = selectedDoctor.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDoctor(doc)}
                style={{
                  padding: "16px",
                  borderRadius: "16px",
                  border: isSelected ? "2px solid #2563eb" : "1px solid rgba(226, 232, 240, 0.8)",
                  backgroundColor: isSelected ? "rgba(37, 99, 235, 0.03)" : "rgba(255, 255, 255, 0.6)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? "0 4px 16px rgba(37, 99, 235, 0.08)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>{doc.name}</h4>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#2563eb" }}>{doc.specialty}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", backgroundColor: "#fef3c7", padding: "3px 8px", borderRadius: "12px" }}>
                    <Star size={13} style={{ color: "#d97706", fill: "#d97706" }} />
                    <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#92400e" }}>{doc.rating}</span>
                    <span style={{ fontSize: "0.75rem", color: "#b45309" }}>({doc.reviews})</span>
                  </div>
                </div>

                <div style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "10px", lineHeight: 1.4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <BuildingIcon />
                    <span>{doc.clinic}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                    <MapPin size={13} style={{ color: "#64748b" }} />
                    <span>{doc.address} • <strong>{doc.distance}</strong></span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: "1px dashed rgba(226, 232, 240, 0.9)" }}>
                  <span style={{ fontSize: "0.78rem", color: "#059669", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} />
                    Next Slot: {doc.nextAvailable}
                  </span>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnderDevelopment(`Booking with ${doc.name}`);
                    }}
                    style={{ fontSize: "0.8rem", padding: "6px 12px", borderRadius: "8px" }}
                  >
                    <Calendar size={13} style={{ marginRight: "6px" }} />
                    Book Appointment
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fake Interactive Map Canvas */}
        <div
          className="map-container"
          onClick={() => handleUnderDevelopment("Interactive Map")}
          style={{
            position: "relative",
            minHeight: "340px",
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid rgba(226, 232, 240, 0.9)",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            cursor: "pointer",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {/* Map Grid Pattern */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.15) 0%, transparent 60%),
                linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
              `,
              backgroundSize: "100% 100%, 30px 30px, 30px 30px",
            }}
          />

          {/* Fake Roads & Land Graphic SVG */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.25 }}>
            <path d="M 0 100 Q 150 180 300 120 T 600 220" fill="none" stroke="#60a5fa" strokeWidth="6" />
            <path d="M 120 0 Q 180 200 240 400" fill="none" stroke="#38bdf8" strokeWidth="4" />
            <path d="M 0 280 Q 200 240 400 320" fill="none" stroke="#94a3b8" strokeWidth="3" strokeDasharray="6 6" />
            <circle cx="50%" cy="50%" r="120" fill="none" stroke="rgba(37, 99, 235, 0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
          </svg>

          {/* Current User Marker */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              zIndex: 5,
            }}
          >
            <div className="user-pulse-ring" style={{ position: "relative" }}>
              <div
                style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  backgroundColor: "#2563eb",
                  border: "3px solid #ffffff",
                  boxShadow: "0 0 16px rgba(37, 99, 235, 0.9)",
                }}
              />
            </div>
            <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#ffffff", backgroundColor: "rgba(15, 23, 42, 0.85)", padding: "2px 6px", borderRadius: "6px", marginTop: "4px", border: "1px solid rgba(255,255,255,0.2)" }}>
              Your Location
            </span>
          </div>

          {/* Doctor Map Pins */}
          {fakeDoctors.map((doc) => {
            const isSelected = selectedDoctor.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedDoctor(doc);
                  handleUnderDevelopment(`Map Pin: ${doc.name}`);
                }}
                style={{
                  position: "absolute",
                  top: `${doc.coords.y}%`,
                  left: `${doc.coords.x}%`,
                  transform: "translate(-50%, -100%)",
                  zIndex: isSelected ? 10 : 6,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    backgroundColor: isSelected ? "#ef4444" : "#2563eb",
                    color: "#ffffff",
                    padding: isSelected ? "8px 12px" : "6px 10px",
                    borderRadius: "12px",
                    boxShadow: isSelected ? "0 6px 20px rgba(239, 68, 68, 0.6)" : "0 4px 12px rgba(0, 0, 0, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    border: "2px solid #ffffff",
                    transform: isSelected ? "scale(1.1)" : "scale(1)",
                  }}
                >
                  <MapPin size={15} style={{ fill: "#ffffff" }} />
                  <span style={{ fontSize: "0.75rem", fontWeight: 800, whiteSpace: "nowrap" }}>{doc.name.split(" ")[1]}</span>
                </div>
              </div>
            );
          })}

          {/* Map Overlay Badge */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "12px",
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(8px)",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#cbd5e1",
              fontSize: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Shield size={13} style={{ color: "#38bdf8" }} />
            <span>Interactive GIS Clinic Map (Click map or pins to expand)</span>
          </div>
        </div>
      </div>

      {/* Under Development Modal */}
      <AnimatePresence>
        {showModal && (
          <div
            className="modal-backdrop"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
              backdropFilter: "blur(6px)",
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "24px",
                padding: "32px",
                maxWidth: "460px",
                width: "100%",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                border: "1px solid rgba(226, 232, 240, 0.9)",
                textAlign: "center",
                position: "relative",
              }}
            >
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  position: "absolute",
                  top: "16px",
                  right: "16px",
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                <X size={18} />
              </button>

              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  backgroundColor: "#eff6ff",
                  color: "#2563eb",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "20px",
                }}
              >
                <AlertCircle size={32} />
              </div>

              <h3 style={{ margin: "0 0 8px", fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
                Feature Under Development
              </h3>

              <p style={{ margin: "0 0 20px", fontSize: "0.92rem", color: "#64748b", lineHeight: 1.6 }}>
                Direct online appointment booking and live GIS clinic schedule integration for <strong>{selectedDoctor.name}</strong> are currently under active development.
              </p>

              <div
                style={{
                  backgroundColor: "#f8fafc",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px dashed #cbd5e1",
                  fontSize: "0.85rem",
                  color: "#334155",
                  marginBottom: "24px",
                  textAlign: "left",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: "4px", color: "#1e293b" }}>Direct Clinic Contact:</div>
                <div><strong>Phone:</strong> {selectedDoctor.phone}</div>
                <div><strong>Address:</strong> {selectedDoctor.address}</div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowModal(false)}
                style={{ width: "100%", padding: "12px", borderRadius: "12px", fontSize: "0.95rem", fontWeight: 700 }}
              >
                Got It, Thank You
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BuildingIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}
