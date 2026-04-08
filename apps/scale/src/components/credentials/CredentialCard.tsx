import React from "react";
import { Credential } from "../../types";
import { CredentialTypeBadge } from "./CredentialTypeBadge";
import { CredentialStatusBadge } from "./CredentialStatusBadge";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";

interface CredentialCardProps {
  credential: Credential;
  onClick?: (credential: Credential) => void;
  onRotate?: (credential: Credential) => void;
  onDelete?: (credential: Credential) => void;
  onEdit?: (credential: Credential) => void;
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "No expiry";
  try {
    return new Date(expiresAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return expiresAt;
  }
}

export function CredentialCard({
  credential,
  onClick,
  onRotate,
  onDelete,
  onEdit,
}: CredentialCardProps) {
  const handleClick = () => onClick?.(credential);
  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRotate?.(credential);
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(credential);
  };
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(credential);
  };

  return (
    <div
      data-testid="credential-card"
      data-credential-id={credential.id}
      onClick={handleClick}
      style={{
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        background: "#fff",
        cursor: onClick ? "pointer" : "default",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div
            data-testid="credential-name"
            style={{ fontWeight: 600, fontSize: "15px", color: "#111827" }}
          >
            {credential.name}
          </div>
          <div
            data-testid="credential-service"
            style={{ fontSize: "12px", color: "#9ca3af", marginTop: "2px" }}
          >
            {credential.service}
          </div>
        </div>
        <CredentialTypeBadge type={credential.type} size="sm" />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <CredentialStatusBadge
          status={credential.status}
          expiresAt={credential.expiresAt}
          showDaysRemaining={true}
        />
      </div>

      <div data-testid="credential-expiry" style={{ fontSize: "12px", color: "#6b7280" }}>
        Expires: {formatExpiry(credential.expiresAt)}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Avatar name={credential.owner.name} src={credential.owner.avatarUrl} size={24} />
        <div data-testid="credential-owner" style={{ fontSize: "13px", color: "#374151" }}>
          {credential.owner.name}
        </div>
      </div>

      {(onRotate || onDelete || onEdit) && (
        <div
          data-testid="credential-actions"
          style={{ display: "flex", gap: "8px", paddingTop: "4px", borderTop: "1px solid #f3f4f6" }}
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <Button
              data-testid="credential-edit-btn"
              variant="ghost"
              size="sm"
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
          {onRotate && (
            <Button
              data-testid="credential-rotate-btn"
              variant="secondary"
              size="sm"
              onClick={handleRotate}
            >
              Rotate
            </Button>
          )}
          {onDelete && (
            <Button
              data-testid="credential-delete-btn"
              variant="danger"
              size="sm"
              onClick={handleDelete}
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
