import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { imagingApi } from "../api/client.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Camera,
  Lock,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Layers,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import LayerProgress from "../components/LayerProgress.jsx";
import { samplePatients } from "./DoctorQueue.jsx";
import "../styles/doctor.css";

// Preset slitlamp samples — CNN overlay boxes are defined but hidden here (revealed in Layer 6)
const presetSamples = [
  {
    id: "sample-1",
    title: "Anterior Uveitis — KPs",
    description: "Slitlamp retroillumination showing keratic precipitates on corneal endothelium",
    type: "Slitlamp Beam",
    bgGradient: "radial-gradient(circle at 45% 45%, #3b82f6 0%, #1e3a8a 50%, #0f172a 100%)",
    // Hidden until Layer 6
    boxes: [
      { x: 38, y: 40, w: 24, h: 22, label: "Mutton-Fat KPs (96.4%)", color: "#38bdf8" },
      { x: 55, y: 58, w: 20, h: 18, label: "AC Cells +3 (91.2%)", color: "#f59e0b" },
    ],
    cnnResult: { acCells: "+3 Grade (28 cells/field)", flare: "Moderate (+2)", kps: "Mutton-Fat / Granulomatous", pupil: "Sluggish / Synechia Risk", confidence: 96.4 },
  },
  {
    id: "sample-2",
    title: "Acute Hypopyon",
    description: "Direct illumination: layered hypopyon in anterior chamber",
    type: "Anterior Segment",
    bgGradient: "radial-gradient(circle at 50% 60%, #ef4444 0%, #7f1d1d 55%, #0f172a 100%)",
    boxes: [
      { x: 35, y: 65, w: 30, h: 18, label: "Hypopyon Layer (98.7%)", color: "#ef4444" },
      { x: 30, y: 30, w: 40, h: 32, label: "Fibrin Meshwork +4 (94.0%)", color: "#ec4899" },
    ],
    cnnResult: { acCells: "+4 Grade (Hypopyon)", flare: "Severe (+4)", kps: "Fibrin Meshwork Present", pupil: "Dilated — Cycloplegia Required", confidence: 98.7 },
  },
  {
    id: "sample-3",
    title: "Posterior Synechiae",
    description: "Iris adhesion to lens capsule at 4 & 8 o'clock",
    type: "Pupil / Iris",
    bgGradient: "radial-gradient(circle at 50% 50%, #10b981 0%, #064e3b 50%, #0f172a 100%)",
    boxes: [
      { x: 25, y: 35, w: 22, h: 25, label: "Posterior Synechia (93.1%)", color: "#10b981" },
    ],
    cnnResult: { acCells: "+2 Grade (Recurrent)", flare: "Mild (+1)", kps: "Fine / Non-Granulomatous", pupil: "Irregular — Synechiae 4 & 8 o'clock", confidence: 93.1 },
  },
];

// Image preprocessing pipeline steps
const preprocessSteps = [
  { label: "Denoising", icon: "🔇", desc: "Gaussian adaptive filter applied" },
  { label: "Normalization", icon: "📊", desc: "Intensity histogram equalized" },
  { label: "Enhancement", icon: "✨", desc: "CLAHE contrast-limited enhancement" },
  { label: "Quality Check", icon: "✅", desc: "Image resolution & focus validated" },
];

export default function DoctorImagingUpload() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const patient = samplePatients.find((p) => p.id === patientId) || samplePatients[0];

  const [selectedSample, setSelectedSample] = useState(presetSamples[0]);
  const [customImage, setCustomImage] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imagingId, setImagingId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [contrastMode, setContrastMode] = useState(false);
  const [preprocessDone, setPreprocessDone] = useState(false);
  const [preprocessing, setPreprocessing] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  const handleSampleSelect = (sample) => {
    setCustomImage(null);
    setSelectedSample(sample);
    setPreprocessDone(false);
    setImageReady(false);
  };

  const handleCustomUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCustomImage(ev.target.result);
      setPreprocessDone(false);
      setImageReady(false);
    };
    reader.readAsDataURL(file);
    // Also upload to server DB immediately
    try {
      const res = await imagingApi.upload(patient.id, "DR-001", selectedSample.type || "slitlamp", file);
      setImagingId(res.imaging_id);
    } catch (e) {
      console.warn("Image upload to DB failed (offline mode):", e.message);
    }
  };

  const handlePreprocess = async () => {
    setPreprocessing(true);
    // Call DB API to run preprocessing if we have a server imaging ID
    if (imagingId) {
      try {
        await imagingApi.preprocess(imagingId, "DR-001");
      } catch (e) {
        console.warn("Preprocessing API failed (offline mode):", e.message);
      }
    }
    setTimeout(() => {
      setPreprocessing(false);
      setPreprocessDone(true);
      setImageReady(true);
    }, 1800);
  };

  return (
    <div className="doctor-page-wrapper">
      <Navbar />
      <div className="container" style={{ paddingTop: "110px", paddingBottom: "80px" }}>

        {/* Back Button */}
        <div style={{ marginBottom: "16px" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/doctor/patient/${patient.id}/dashboard`)}
            style={{ fontSize: "0.85rem", padding: "7px 14px" }}
          >
            <ArrowLeft size={15} style={{ marginRight: "6px" }} />
            Back to Dashboard
          </button>
        </div>

        {/* Layer Progress Stepper */}
        <LayerProgress currentStep="imaging" completedSteps={["dashboard"]} />

        {/* Patient Banner */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "20px",
            padding: "18px 28px",
            border: "1px solid rgba(226,232,240,0.9)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "2px" }}>
              <span style={{ fontWeight: 800 }}>{patient.id}</span> — Layer 5: Imaging & CNN Analysis
            </div>
            <div style={{ fontSize: "1.2rem", fontWeight: 900, color: "#0f172a" }}>
              {patient.name} — {patient.affectedEye}
            </div>
            <div style={{ fontSize: "0.83rem", color: "#475569" }}>
              Upload fundus / OCT / slitlamp images for CNN preprocessing
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.25)",
              padding: "8px 16px",
              borderRadius: "12px",
            }}
          >
            <Lock size={16} style={{ color: "#d97706" }} />
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#92400e" }}>
              CNN Results Sealed Until Layer 6
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "24px" }}>

          {/* LEFT: Image Upload & Viewer */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Upload Controls */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "24px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Camera size={18} style={{ color: "#2563eb" }} />
                    Image Upload Workbench
                  </h3>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
                    Accepted: Slitlamp, Fundus, OCT (PNG, JPG, TIFF)
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ fontSize: "0.83rem", padding: "7px 14px" }}
                >
                  <Upload size={14} style={{ marginRight: "6px" }} />
                  Upload from Device
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCustomUpload} style={{ display: "none" }} />
              </div>

              {/* Preset Sample Pills */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Load Clinical Sample Image:
                </div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {presetSamples.map((s) => {
                    const active = !customImage && selectedSample.id === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSampleSelect(s)}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "10px",
                          border: active ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          backgroundColor: active ? "#eff6ff" : "#ffffff",
                          color: active ? "#1d4ed8" : "#475569",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        {s.type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image Viewport */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "320px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: customImage ? "#090d16" : selectedSample.bgGradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(226,232,240,0.8)",
                  boxShadow: "inset 0 4px 20px rgba(0,0,0,0.5)",
                }}
              >
                {customImage ? (
                  <img
                    src={customImage}
                    alt="Uploaded"
                    style={{
                      maxHeight: "100%",
                      maxWidth: "100%",
                      objectFit: "contain",
                      transform: `scale(${zoomLevel})`,
                      filter: contrastMode ? "contrast(180%) brightness(110%)" : "none",
                      transition: "transform 0.2s, filter 0.2s",
                    }}
                  />
                ) : (
                  <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${zoomLevel})`, filter: contrastMode ? "contrast(180%) brightness(110%)" : "none" }}>
                    <svg width="260" height="260" viewBox="0 0 200 200" fill="none">
                      <circle cx="100" cy="100" r="80" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                      <circle cx="100" cy="100" r="50" fill="rgba(0,0,0,0.7)" stroke="rgba(255,255,255,0.4)" strokeWidth="3" />
                      <path d="M 60 20 L 140 180" stroke="rgba(255,255,255,0.85)" strokeWidth="14" opacity="0.75" />
                      <circle cx="100" cy="100" r="14" fill="rgba(37,99,235,0.4)" />
                    </svg>

                    {/* CNN RESULTS SEALED OVERLAY — No boxes shown here */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        backgroundColor: "rgba(15,23,42,0.82)",
                        backdropFilter: "blur(6px)",
                        borderRadius: "16px",
                        padding: "16px 24px",
                        textAlign: "center",
                        border: "1px dashed rgba(245,158,11,0.5)",
                      }}
                    >
                      <Lock size={24} style={{ color: "#f59e0b", marginBottom: "8px" }} />
                      <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#fbbf24", marginBottom: "4px" }}>
                        CNN Analysis Running
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#94a3b8", lineHeight: 1.4 }}>
                        Results will be revealed<br />after your clinical review (Layer 6)
                      </div>
                    </div>
                  </div>
                )}

                {/* Viewer Controls */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    left: "10px",
                    right: "10px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "rgba(15,23,42,0.85)",
                    backdropFilter: "blur(8px)",
                    padding: "7px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button type="button" onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 2.5))} style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer" }}>
                      <ZoomIn size={17} />
                    </button>
                    <button type="button" onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.7))} style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer" }}>
                      <ZoomOut size={17} />
                    </button>
                    <button type="button" onClick={() => setZoomLevel(1)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "0.72rem" }}>
                      <RefreshCw size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setContrastMode((c) => !c)}
                      style={{ background: contrastMode ? "#2563eb" : "rgba(255,255,255,0.15)", border: "none", color: "#ffffff", padding: "2px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "0.72rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Sliders size={13} />
                      CLAHE Filter
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <EyeOff size={13} style={{ color: "#f59e0b" }} />
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#fbbf24" }}>AI overlays sealed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Image type upload grid */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "22px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
              }}
            >
              <h4 style={{ margin: "0 0 14px", fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                <Layers size={16} style={{ display: "inline", color: "#06b6d4", marginRight: "8px" }} />
                Image Types Supported
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                {[
                  { icon: "🔬", label: "Slitlamp", desc: "Anterior segment beam" },
                  { icon: "🩺", label: "Fundus", desc: "Posterior segment photo" },
                  { icon: "📷", label: "OCT", desc: "Retinal cross-section" },
                ].map((img) => (
                  <div
                    key={img.label}
                    style={{
                      padding: "12px",
                      borderRadius: "12px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "1.5rem", marginBottom: "4px" }}>{img.icon}</div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#1e293b" }}>{img.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{img.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: Preprocessing Pipeline + CNN Sealed Status */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Preprocessing Pipeline */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "20px",
                padding: "24px",
                border: "1px solid rgba(226,232,240,0.9)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.04)",
              }}
            >
              <h3 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                🔧 Image Preprocessing Pipeline
              </h3>
              <p style={{ margin: "0 0 18px", fontSize: "0.8rem", color: "#64748b" }}>
                System checks quality, cleans, and prepares the image for CNN analysis.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                {preprocessSteps.map((step, idx) => (
                  <div
                    key={step.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      backgroundColor: preprocessDone ? "rgba(16,185,129,0.06)" : "#f8fafc",
                      border: preprocessDone ? "1px solid rgba(16,185,129,0.2)" : "1px solid #e2e8f0",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <div style={{ fontSize: "1.3rem" }}>{step.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 800, color: preprocessDone ? "#047857" : "#334155" }}>
                        {step.label}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{step.desc}</div>
                    </div>
                    {preprocessDone ? (
                      <CheckCircle2 size={18} style={{ color: "#10b981", flexShrink: 0 }} />
                    ) : preprocessing && idx === preprocessSteps.findIndex((_, i) => i < preprocessSteps.length) ? (
                      <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid #2563eb", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
                    ) : (
                      <div style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid #cbd5e1" }} />
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePreprocess}
                disabled={preprocessing || preprocessDone}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: "12px",
                  fontSize: "0.88rem",
                  fontWeight: 800,
                  opacity: preprocessing || preprocessDone ? 0.6 : 1,
                  cursor: preprocessing || preprocessDone ? "not-allowed" : "pointer",
                }}
              >
                {preprocessing ? "⏳ Processing Image…" : preprocessDone ? "✅ Preprocessing Complete" : "Run Preprocessing Pipeline"}
              </button>
            </div>

            {/* CNN Sealed Status */}
            <div
              style={{
                backgroundColor: "rgba(15,23,42,0.97)",
                borderRadius: "20px",
                padding: "24px",
                border: "1px solid rgba(245,158,11,0.3)",
                boxShadow: "0 6px 24px rgba(0,0,0,0.15)",
                flex: 1,
              }}
            >
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(245,158,11,0.15)",
                    border: "2px solid rgba(245,158,11,0.4)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "16px",
                  }}
                >
                  <Lock size={30} style={{ color: "#f59e0b" }} />
                </div>

                <h3 style={{ margin: "0 0 10px", fontSize: "1.1rem", fontWeight: 900, color: "#f8fafc" }}>
                  CNN Analysis — Results Sealed
                </h3>
                <p style={{ margin: "0 0 20px", fontSize: "0.83rem", color: "#94a3b8", lineHeight: 1.6 }}>
                  The CNN model is analyzing the uploaded image in the background. Results — including feature detections, confidence scores, and overlay annotations — are intentionally hidden to prevent confirmation bias in your clinical assessment.
                </p>

                <div
                  style={{
                    backgroundColor: "rgba(245,158,11,0.08)",
                    border: "1px dashed rgba(245,158,11,0.3)",
                    borderRadius: "12px",
                    padding: "14px",
                    marginBottom: "20px",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fbbf24", marginBottom: "6px" }}>
                    🔒 SEALED: CNN Feature Detections
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {["Keratic Precipitate Density", "AC Cell Grade", "Hypopyon Level", "Fibrin / Vitreous Opacity", "Synechiae Detection"].map((item) => (
                      <div
                        key={item}
                        style={{
                          fontSize: "0.75rem",
                          color: "#64748b",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <div style={{ width: "60%", height: "8px", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                          <div style={{ width: "100%", height: "100%", background: "repeating-linear-gradient(90deg, rgba(245,158,11,0.15) 0px, rgba(245,158,11,0.15) 8px, transparent 8px, transparent 16px)" }} />
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.5 }}>
                  Results will be automatically revealed when you proceed to{" "}
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>Layer 6 — Final Review & Disclosure</span>
                </div>
              </div>
            </div>

            {/* Proceed Button */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate(`/doctor/patient/${patient.id}/final-review`)}
              disabled={!imageReady}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "14px",
                fontSize: "1rem",
                fontWeight: 800,
                opacity: imageReady ? 1 : 0.4,
                cursor: imageReady ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              Complete Review & Reveal CNN Results
              <ArrowRight size={18} />
            </button>
            {!imageReady && (
              <p style={{ margin: "-6px 0 0", fontSize: "0.75rem", color: "#94a3b8", textAlign: "center" }}>
                Run the preprocessing pipeline to enable disclosure
              </p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

// Export preset samples so Layer 6 can access CNN results
export { presetSamples };
