import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Circle, ChevronRight, Lock } from "lucide-react";

const STEPS = [
  { key: "dashboard", label: "L4 — Doctor Review", sub: "Q&A + AI Explanation", path: "dashboard" },
  { key: "imaging",   label: "L5 — Image Upload",  sub: "CNN Analysis (Hidden)", path: "imaging" },
  { key: "final-review", label: "L6 — Final Disclosure", sub: "Reveal AI Results", path: "final-review" },
  { key: "diagnosis", label: "L7 — Final Diagnosis", sub: "Consensus + Treatment", path: "diagnosis" },
];

export default function LayerProgress({ currentStep, completedSteps = [] }) {
  const { patientId } = useParams();
  const navigate = useNavigate();

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: "20px",
        padding: "16px 28px",
        border: "1px solid rgba(226, 232, 240, 0.9)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
        marginBottom: "24px",
        display: "flex",
        alignItems: "center",
        gap: "0",
        overflowX: "auto",
      }}
    >
      {STEPS.map((step, idx) => {
        const isCompleted = completedSteps.includes(step.key);
        const isCurrent = step.key === currentStep;
        const isLocked = !isCompleted && !isCurrent && !completedSteps.includes(STEPS[idx - 1]?.key) && idx > 0;
        const isClickable = isCompleted && step.key !== currentStep;

        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center", flex: "0 0 auto" }}>
            {/* Step */}
            <div
              onClick={() => isClickable && navigate(`/doctor/patient/${patientId}/${step.path}`)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 16px",
                borderRadius: "12px",
                cursor: isClickable ? "pointer" : "default",
                backgroundColor: isCurrent
                  ? "rgba(37, 99, 235, 0.08)"
                  : isCompleted
                  ? "rgba(16, 185, 129, 0.06)"
                  : "transparent",
                border: isCurrent
                  ? "1px solid rgba(37, 99, 235, 0.25)"
                  : isCompleted
                  ? "1px solid rgba(16, 185, 129, 0.2)"
                  : "1px solid transparent",
                transition: "all 0.15s ease",
              }}
            >
              {/* Icon */}
              <div>
                {isCompleted ? (
                  <CheckCircle2 size={22} style={{ color: "#10b981" }} />
                ) : isLocked ? (
                  <Lock size={18} style={{ color: "#cbd5e1" }} />
                ) : (
                  <div
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      border: `2px solid ${isCurrent ? "#2563eb" : "#cbd5e1"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.72rem",
                      fontWeight: 900,
                      color: isCurrent ? "#2563eb" : "#94a3b8",
                    }}
                  >
                    {idx + 1}
                  </div>
                )}
              </div>

              {/* Labels */}
              <div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 800,
                    color: isCurrent ? "#1d4ed8" : isCompleted ? "#059669" : isLocked ? "#94a3b8" : "#334155",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step.label}
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: isCurrent ? "#3b82f6" : isCompleted ? "#10b981" : "#94a3b8",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step.sub}
                </div>
              </div>
            </div>

            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <ChevronRight
                size={18}
                style={{
                  color: isCompleted ? "#10b981" : "#cbd5e1",
                  flexShrink: 0,
                  margin: "0 4px",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
