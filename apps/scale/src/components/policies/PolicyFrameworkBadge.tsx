import React from "react";
import { Framework } from "../../types";
import { Badge } from "../ui/Badge";

interface PolicyFrameworkBadgeProps {
  framework: Framework;
  size?: "sm" | "md";
  showFull?: boolean;
  "data-testid"?: string;
}

const frameworkColors: Record<Framework, string> = {
  SOC2: "purple",
  ISO27001: "blue",
  HIPAA: "green",
  GDPR: "orange",
  "PCI-DSS": "red",
  FedRAMP: "indigo",
};

const frameworkShortLabels: Record<Framework, string> = {
  SOC2: "SOC2",
  ISO27001: "ISO27001",
  HIPAA: "HIPAA",
  GDPR: "GDPR",
  "PCI-DSS": "PCI-DSS",
  FedRAMP: "FedRAMP",
};

const frameworkFullLabels: Record<Framework, string> = {
  SOC2: "SOC 2 Type II",
  ISO27001: "ISO/IEC 27001",
  HIPAA: "HIPAA Privacy & Security",
  GDPR: "General Data Protection Regulation",
  "PCI-DSS": "Payment Card Industry DSS",
  FedRAMP: "Federal Risk and Authorization Management Program",
};

export function PolicyFrameworkBadge({
  framework,
  size = "md",
  showFull = false,
  "data-testid": testId,
}: PolicyFrameworkBadgeProps) {
  const color = frameworkColors[framework];
  const label = showFull ? frameworkFullLabels[framework] : frameworkShortLabels[framework];

  return (
    <Badge
      data-testid={testId || `framework-badge-${framework}`}
      color={color}
      size={size}
      data-framework={framework}
      data-color={color}
    >
      <span data-testid={`framework-label-${framework}`}>{label}</span>
    </Badge>
  );
}
