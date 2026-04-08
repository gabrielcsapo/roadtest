import React from "react";
import { Personnel } from "../../types";
import { Button } from "../ui/Button";
import { Progress } from "../ui/Progress";

interface PersonnelOffboardingFlowProps {
  person: Personnel;
  completedSteps: string[];
  onComplete: (step: string) => void;
  onFinish: () => void;
}

const OFFBOARDING_STEPS = [
  {
    id: "revoke-access",
    label: "Revoke Access",
    description: "Remove all system access and permissions",
    icon: "🔒",
  },
  {
    id: "return-equipment",
    label: "Return Equipment",
    description: "Collect laptop, badge, and other company property",
    icon: "💼",
  },
  {
    id: "exit-interview",
    label: "Exit Interview",
    description: "Conduct exit interview with HR",
    icon: "📋",
  },
  {
    id: "final-payroll",
    label: "Final Payroll",
    description: "Process final paycheck and benefits",
    icon: "💰",
  },
];

export function PersonnelOffboardingFlow({
  person,
  completedSteps,
  onComplete,
  onFinish,
}: PersonnelOffboardingFlowProps) {
  const allDone = OFFBOARDING_STEPS.every((s) => completedSteps.includes(s.id));
  const progress = Math.round((completedSteps.length / OFFBOARDING_STEPS.length) * 100);

  return (
    <div data-testid="offboarding-flow" style={{ padding: "24px", maxWidth: "640px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h2
          data-testid="offboarding-title"
          style={{ fontSize: "20px", fontWeight: 700, color: "#111827", margin: 0 }}
        >
          Offboarding: {person.name}
        </h2>
        <p
          data-testid="offboarding-subtitle"
          style={{ color: "#6b7280", fontSize: "14px", marginTop: "4px" }}
        >
          {person.department} · {person.jobTitle}
        </p>
      </div>

      <div data-testid="offboarding-progress" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "13px", color: "#374151" }}>
            {completedSteps.length} of {OFFBOARDING_STEPS.length} steps completed
          </span>
          <span
            data-testid="progress-percentage"
            style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}
          >
            {progress}%
          </span>
        </div>
        <Progress value={progress} />
      </div>

      <div
        data-testid="offboarding-steps"
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        {OFFBOARDING_STEPS.map((step) => {
          const isComplete = completedSteps.includes(step.id);
          return (
            <div
              key={step.id}
              data-testid={`step-${step.id}`}
              data-completed={isComplete ? "true" : "false"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                padding: "16px",
                borderRadius: "8px",
                border: `1px solid ${isComplete ? "#bbf7d0" : "#e5e7eb"}`,
                background: isComplete ? "#f0fdf4" : "#fff",
              }}
            >
              <div
                data-testid={`step-indicator-${step.id}`}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isComplete ? "#22c55e" : "#f3f4f6",
                  color: isComplete ? "#fff" : "#6b7280",
                  fontWeight: 700,
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                {isComplete ? "✓" : step.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  data-testid={`step-label-${step.id}`}
                  style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    color: isComplete ? "#15803d" : "#111827",
                  }}
                >
                  {step.label}
                </div>
                <div
                  data-testid={`step-desc-${step.id}`}
                  style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}
                >
                  {step.description}
                </div>
              </div>

              <div>
                {isComplete ? (
                  <span
                    data-testid={`step-done-${step.id}`}
                    style={{ fontSize: "13px", color: "#15803d", fontWeight: 500 }}
                  >
                    Done
                  </span>
                ) : (
                  <Button
                    data-testid={`step-complete-btn-${step.id}`}
                    size="sm"
                    variant="primary"
                    onClick={() => onComplete(step.id)}
                  >
                    Complete
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allDone && (
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <Button data-testid="finish-offboarding-btn" variant="primary" onClick={onFinish}>
            Finish Offboarding
          </Button>
        </div>
      )}
    </div>
  );
}
