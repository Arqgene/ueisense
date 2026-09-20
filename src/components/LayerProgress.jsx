import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, ChevronRight, Activity, Camera, Layers, CheckSquare } from "lucide-react";

const STEPS = [
  { key: "dashboard", label: "Stage 1 — Clinical Intake & NF", sub: "Neuro-Fuzzy & Symptoms", path: "dashboard", icon: Activity },
  { key: "imaging",   label: "Stage 2 — Slit-Lamp Imaging",  sub: "Deep ViT / CNN Analysis", path: "imaging", icon: Camera },
  { key: "final-review", label: "Stage 3 — Multimodal Review", sub: "Consensus & Blinded Review", path: "final-review", icon: Layers },
  { key: "diagnosis", label: "Stage 4 — Final Diagnosis", sub: "Rx Plan & Validation", path: "diagnosis", icon: CheckSquare },
];

export default function LayerProgress({ currentStep, completedSteps = [] }) {
  const { patientId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="layer-progress-container">
      <div className="layer-progress-header">
        <span className="layer-progress-tag">CLINICAL WORKFLOW PIPELINE</span>
        <span className="layer-progress-hint">Click any stage tab to inspect or review records</span>
      </div>

      <div className="layer-progress-track">
        {STEPS.map((step, idx) => {
          const isCompleted = completedSteps.includes(step.key);
          const isCurrent = step.key === currentStep;
          const Icon = step.icon;

          return (
            <div key={step.key} className="layer-step-wrapper">
              <button
                type="button"
                className={`layer-step-btn ${isCurrent ? "current" : isCompleted ? "completed" : "available"}`}
                onClick={() => navigate(`/doctor/patient/${patientId}/${step.path}`)}
                title={`Navigate to ${step.label}`}
              >
                <div className="layer-step-icon-box">
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="step-icon-completed" />
                  ) : (
                    <Icon size={16} className={isCurrent ? "step-icon-current" : "step-icon-idle"} />
                  )}
                </div>

                <div className="layer-step-text">
                  <div className="layer-step-title">{step.label}</div>
                  <div className="layer-step-sub">{step.sub}</div>
                </div>

                {isCurrent && <div className="layer-active-indicator" />}
              </button>

              {idx < STEPS.length - 1 && (
                <div className="layer-step-divider">
                  <ChevronRight size={16} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
