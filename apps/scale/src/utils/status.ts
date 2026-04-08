import type { Status, ComplianceStatus } from "../types";

export function statusToColor(status: Status): string {
  switch (status) {
    case "active":
      return "#22c55e";
    case "inactive":
      return "#6b7280";
    case "pending":
      return "#f59e0b";
    case "archived":
      return "#9ca3af";
  }
}

export function statusToLabel(status: Status): string {
  switch (status) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "pending":
      return "Pending";
    case "archived":
      return "Archived";
  }
}

export function statusToIcon(status: Status): string {
  switch (status) {
    case "active":
      return "✅";
    case "inactive":
      return "⭕";
    case "pending":
      return "⏳";
    case "archived":
      return "📁";
  }
}

export function isActiveStatus(status: Status): boolean {
  return status === "active";
}

// Define valid transitions
const TRANSITIONS: Record<Status, Status[]> = {
  active: ["inactive", "archived"],
  inactive: ["active", "archived"],
  pending: ["active", "inactive", "archived"],
  archived: [],
};

export function canTransitionTo(from: Status, to: Status): boolean {
  return TRANSITIONS[from].includes(to);
}

export function getStatusWeight(status: Status): number {
  switch (status) {
    case "active":
      return 1;
    case "pending":
      return 2;
    case "inactive":
      return 3;
    case "archived":
      return 4;
  }
}

export function complianceStatusToColor(status: ComplianceStatus): string {
  switch (status) {
    case "compliant":
      return "#22c55e";
    case "non-compliant":
      return "#ef4444";
    case "in-progress":
      return "#f59e0b";
    case "not-applicable":
      return "#9ca3af";
  }
}

export function complianceStatusToLabel(status: ComplianceStatus): string {
  switch (status) {
    case "compliant":
      return "Compliant";
    case "non-compliant":
      return "Non-Compliant";
    case "in-progress":
      return "In Progress";
    case "not-applicable":
      return "Not Applicable";
  }
}
