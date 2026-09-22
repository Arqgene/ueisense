/**
 * src/utils/clinicalImageSamples.js
 *
 * Clinically verified sample slitlamp and anterior segment imaging cases
 * for patient demonstration and clinician training under Dr. Agarwal's Diagnostic AI.
 */

export const CLINICAL_IMAGE_SAMPLES = [
  {
    id: "sample-kp",
    name: "Acute Anterior Uveitis — Keratic Precipitates",
    category: "Anterior Uveitis",
    severityClass: "Severe Acute Anterior Uveitis",
    description: "Retroillumination showing classic mutton-fat keratic precipitates (KPs) on the lower corneal endothelium and intense +3 anterior chamber cellular reaction.",
    gradient: "radial-gradient(circle at 45% 45%, #2563eb 0%, #1e3a8a 50%, #0b132b 100%)",
    confidence: 0.948,
    probableDisease: "Uveitis",
    acCells: "+3 Grade (28 cells/field)",
    flare: "Moderate AC Flare (+2)",
    kpType: "Mutton-Fat / Granulomatous KPs",
    pupilReactivity: "Sluggish / Synechia Risk",
    overlayBoxes: [
      { x: 36, y: 38, w: 26, h: 24, label: "Mutton-Fat KPs (96.4%)", color: "#38bdf8" },
      { x: 54, y: 56, w: 22, h: 20, label: "AC Cells +3 (91.2%)", color: "#f59e0b" },
    ],
    gradcamHotspots: [
      { x: 48, y: 50, radius: 32, intensity: 0.96, label: "Endothelial Inflammatory Precipitates" },
      { x: 38, y: 36, radius: 24, intensity: 0.88, label: "Ciliary Hyperemia Margin" },
      { x: 62, y: 62, radius: 20, intensity: 0.81, label: "Anterior Chamber Tyndall Flare" },
    ],
  },
  {
    id: "sample-hypopyon",
    name: "Severe Acute Hypopyon Uveitis",
    category: "Severe Anterior Uveitis",
    severityClass: "Severe Hypopyon Iridocyclitis",
    description: "Visible sterile purulent layer (hypopyon) settling in the inferior anterior chamber angle with heavy fibrinous exudate, typical of HLA-B27 or Behçet's.",
    gradient: "radial-gradient(circle at 50% 60%, #dc2626 0%, #7f1d1d 55%, #0b132b 100%)",
    confidence: 0.976,
    probableDisease: "Uveitis",
    acCells: "+4 Grade (Hypopyon Exudate)",
    flare: "Severe Fibrin Flare (+4)",
    kpType: "Fibrin Meshwork with Cellular Layering",
    pupilReactivity: "Fixed / Dilated Cycloplegic Urgency",
    overlayBoxes: [
      { x: 34, y: 64, w: 32, h: 20, label: "Hypopyon Layer (98.7%)", color: "#ef4444" },
      { x: 30, y: 28, w: 40, h: 32, label: "Fibrin Meshwork +4 (94.0%)", color: "#ec4899" },
    ],
    gradcamHotspots: [
      { x: 50, y: 72, radius: 34, intensity: 0.98, label: "Inferior Chamber Cellular Sediment" },
      { x: 48, y: 44, radius: 30, intensity: 0.91, label: "Dense Pupillary Fibrinous Exudate" },
    ],
  },
  {
    id: "sample-synechia",
    name: "Recurrent Uveitis with Posterior Synechiae",
    category: "Chronic / Recurrent Uveitis",
    severityClass: "Moderate Recurrent Anterior Uveitis",
    description: "Fibrous adhesion of the iris pupillary border to the anterior lens capsule, leading to irregular 'cloverleaf' pupil shape and elevated IOP risk.",
    gradient: "radial-gradient(circle at 50% 50%, #059669 0%, #064e3b 50%, #0b132b 100%)",
    confidence: 0.932,
    probableDisease: "Uveitis",
    acCells: "+2 Grade (12 cells/field)",
    flare: "Mild-Moderate Flare (+1)",
    kpType: "Fine Pigmented KPs (Chronic)",
    pupilReactivity: "Irregular — Fixed at 4 & 8 o'clock",
    overlayBoxes: [
      { x: 26, y: 34, w: 24, h: 26, label: "Posterior Synechia (93.1%)", color: "#10b981" },
      { x: 58, y: 52, w: 22, h: 24, label: "Iris Pigment on Capsule (89.5%)", color: "#f59e0b" },
    ],
    gradcamHotspots: [
      { x: 38, y: 44, radius: 26, intensity: 0.94, label: "Iridolenticular Adhesion Zone" },
      { x: 62, y: 54, radius: 22, intensity: 0.86, label: "Capsular Inflammatory Footprint" },
    ],
  },
  {
    id: "sample-ciliary-flush",
    name: "Early Acute Ciliary Hyperemia",
    category: "Hyperacute Onset",
    severityClass: "Early Acute Anterior Uveitis",
    description: "Deep, violaceous perilimbal ring of injected episcleral vessels extending radially from the cornea with light anterior chamber flare.",
    gradient: "radial-gradient(circle at 50% 50%, #f97316 0%, #9a3412 50%, #0b132b 100%)",
    confidence: 0.915,
    probableDisease: "Uveitis",
    acCells: "+2 Grade (15 cells/field)",
    flare: "Moderate (+2)",
    kpType: "Early Endothelial Stippling",
    pupilReactivity: "Miosed / Spastic",
    overlayBoxes: [
      { x: 20, y: 20, w: 60, h: 60, label: "Perilimbal Ciliary Flush (95.2%)", color: "#f97316" },
    ],
    gradcamHotspots: [
      { x: 50, y: 50, radius: 36, intensity: 0.93, label: "Perilimbal Vascular Engorgement" },
    ],
  },
];
