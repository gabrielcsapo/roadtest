import React from "react";
import { Personnel } from "../../types";
import { PersonnelStatusBadge } from "./PersonnelStatusBadge";
import { BackgroundCheckBadge } from "./BackgroundCheckBadge";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { Avatar } from "../ui/Avatar";

interface PersonnelDetailsProps {
  person: Personnel;
  loading?: boolean;
  onEdit?: (person: Personnel) => void;
  onOffboard?: (person: Personnel) => void;
}

function Section({
  title,
  children,
  testId,
}: {
  title: string;
  children: React.ReactNode;
  testId: string;
}) {
  return (
    <div
      data-testid={testId}
      style={{
        padding: "20px",
        background: "#fff",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        marginBottom: "16px",
      }}
    >
      <h3
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: "#374151",
          marginBottom: "16px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  testId,
}: {
  label: string;
  value: React.ReactNode;
  testId: string;
}) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "2px" }}>{label}</div>
      <div data-testid={testId} style={{ fontSize: "14px", color: "#111827" }}>
        {value ?? <span style={{ color: "#d1d5db" }}>—</span>}
      </div>
    </div>
  );
}

export function PersonnelDetails({
  person,
  loading = false,
  onEdit,
  onOffboard,
}: PersonnelDetailsProps) {
  if (loading) {
    return (
      <div
        data-testid="personnel-details-loading"
        style={{ display: "flex", justifyContent: "center", padding: "64px" }}
      >
        <Spinner />
      </div>
    );
  }

  return (
    <div data-testid="personnel-details" style={{ maxWidth: "720px" }}>
      {/* Header */}
      <div
        data-testid="personnel-details-header"
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "20px",
          padding: "24px",
          background: "#fff",
          borderRadius: "12px",
          border: "1px solid #e5e7eb",
          marginBottom: "20px",
        }}
      >
        <Avatar name={person.name} src={person.avatarUrl} size={64} />
        <div style={{ flex: 1 }}>
          <div
            data-testid="details-name"
            style={{ fontSize: "22px", fontWeight: 700, color: "#111827" }}
          >
            {person.name}
          </div>
          <div
            data-testid="details-job-title"
            style={{ fontSize: "15px", color: "#6b7280", marginTop: "2px" }}
          >
            {person.jobTitle}
          </div>
          <div
            data-testid="details-department"
            style={{ fontSize: "13px", color: "#9ca3af", marginTop: "4px" }}
          >
            {person.department}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <PersonnelStatusBadge status={person.status} />
            <BackgroundCheckBadge status={person.backgroundCheckStatus} />
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {onEdit && (
            <Button
              data-testid="details-edit-btn"
              variant="secondary"
              size="sm"
              onClick={() => onEdit(person)}
            >
              Edit
            </Button>
          )}
          {onOffboard && person.status !== "offboarded" && (
            <Button
              data-testid="details-offboard-btn"
              variant="danger"
              size="sm"
              onClick={() => onOffboard(person)}
            >
              Offboard
            </Button>
          )}
        </div>
      </div>

      {/* Personal Info */}
      <Section title="Personal Information" testId="section-personal">
        <Field label="Full Name" value={person.name} testId="field-name" />
        <Field label="Email Address" value={person.email} testId="field-email" />
        {person.manager && (
          <Field label="Manager" value={person.manager.name} testId="field-manager" />
        )}
      </Section>

      {/* Employment */}
      <Section title="Employment" testId="section-employment">
        <Field label="Job Title" value={person.jobTitle} testId="field-job-title" />
        <Field label="Department" value={person.department} testId="field-department" />
        <Field label="Start Date" value={person.startDate} testId="field-start-date" />
        <Field
          label="Employment Status"
          value={<PersonnelStatusBadge status={person.status} size="sm" />}
          testId="field-status"
        />
      </Section>

      {/* Background Check */}
      <Section title="Background Check" testId="section-background-check">
        <Field
          label="Status"
          value={<BackgroundCheckBadge status={person.backgroundCheckStatus} />}
          testId="field-bg-check-status"
        />
      </Section>

      {/* Access */}
      <Section title="System Access" testId="section-access">
        <div
          data-testid="access-status"
          style={{
            padding: "12px",
            borderRadius: "6px",
            background: person.status === "active" ? "#f0fdf4" : "#fef2f2",
            fontSize: "14px",
            color: person.status === "active" ? "#15803d" : "#dc2626",
          }}
        >
          {person.status === "active"
            ? "Active — All systems accessible"
            : person.status === "offboarding"
              ? "Pending revocation — Access being removed"
              : "Revoked — No system access"}
        </div>
      </Section>
    </div>
  );
}
