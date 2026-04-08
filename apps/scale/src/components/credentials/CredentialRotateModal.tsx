import React, { useState } from "react";
import { Credential } from "../../types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Spinner } from "../ui/Spinner";
import { CredentialTypeBadge } from "./CredentialTypeBadge";

interface CredentialRotateModalProps {
  credential: Credential;
  open: boolean;
  onClose: () => void;
  onConfirm: (newValue: string) => void;
  loading?: boolean;
}

const TYPE_FIELD_LABELS: Record<Credential["type"], string> = {
  "api-key": "New API Key",
  certificate: "New Certificate (PEM)",
  password: "New Password",
  "oauth-token": "New OAuth Token",
};

const TYPE_PLACEHOLDERS: Record<Credential["type"], string> = {
  "api-key": "sk-...",
  certificate: "-----BEGIN CERTIFICATE-----",
  password: "Enter new password",
  "oauth-token": "ya29.a0...",
};

export function CredentialRotateModal({
  credential,
  open,
  onClose,
  onConfirm,
  loading = false,
}: CredentialRotateModalProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = () => {
    if (!value.trim()) {
      setError("This field is required");
      return;
    }
    setError("");
    onConfirm(value);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (error) setError("");
  };

  const handleClose = () => {
    setValue("");
    setError("");
    onClose();
  };

  const isCertificate = credential.type === "certificate";

  return (
    <div
      data-testid="rotate-modal"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        data-testid="rotate-modal-content"
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "480px",
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div>
            <h2
              data-testid="modal-title"
              style={{ fontSize: "18px", fontWeight: 700, color: "#111827", margin: 0 }}
            >
              Rotate Credential
            </h2>
            <p
              data-testid="modal-subtitle"
              style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0" }}
            >
              {credential.name}
            </p>
          </div>
          <CredentialTypeBadge type={credential.type} size="sm" />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.5, marginBottom: "16px" }}>
            Enter the new value for this credential. The old value will be invalidated.
          </p>

          <label
            data-testid="field-label"
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "6px",
            }}
          >
            {TYPE_FIELD_LABELS[credential.type]}
          </label>

          {isCertificate ? (
            <textarea
              data-testid="credential-value-input"
              value={value}
              onChange={handleChange}
              placeholder={TYPE_PLACEHOLDERS[credential.type]}
              rows={6}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: `1px solid ${error ? "#dc2626" : "#d1d5db"}`,
                fontSize: "13px",
                fontFamily: "monospace",
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          ) : (
            <input
              data-testid="credential-value-input"
              type={credential.type === "password" ? "password" : "text"}
              value={value}
              onChange={handleChange}
              placeholder={TYPE_PLACEHOLDERS[credential.type]}
              disabled={loading}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "6px",
                border: `1px solid ${error ? "#dc2626" : "#d1d5db"}`,
                fontSize: "13px",
                fontFamily: "monospace",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          )}

          {error && (
            <div
              data-testid="field-error"
              style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px" }}
            >
              {error}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <Button data-testid="cancel-btn" variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            data-testid="confirm-btn"
            variant="primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <Spinner size="xs" /> : "Rotate Credential"}
          </Button>
        </div>
      </div>
    </div>
  );
}
