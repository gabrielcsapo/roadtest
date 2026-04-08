import React, { useState, useRef } from "react";
import { Vendor } from "../../types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { Spinner } from "../ui/Spinner";
import { Progress } from "../ui/Progress";

interface VendorImportModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: Partial<Vendor>[]) => void;
  loading?: boolean;
}

type ImportStep = "upload" | "preview" | "importing";

function parseCsv(text: string): Partial<Vendor>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const obj: Partial<Vendor> = {};
    headers.forEach((h, i) => {
      if (values[i]) (obj as Record<string, string>)[h] = values[i];
    });
    return obj;
  });
}

export function VendorImportModal({
  open,
  onClose,
  onImport,
  loading = false,
}: VendorImportModalProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [parsedData, setParsedData] = useState<Partial<Vendor>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const data = parseCsv(text);
        if (data.length === 0) {
          setError("No valid rows found in file.");
          return;
        }
        setParsedData(data);
        setStep("preview");
      } catch {
        setError("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    onImport(parsedData);
  };

  const handleReset = () => {
    setStep("upload");
    setParsedData([]);
    setError(null);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal data-testid="vendor-import-modal" open={open} onClose={handleClose}>
      <div data-testid="import-container">
        <h2 data-testid="import-title">Import Vendors</h2>

        {error && (
          <Alert data-testid="import-error" variant="error" style={{ marginBottom: "12px" }}>
            {error}
          </Alert>
        )}

        {step === "upload" && (
          <div data-testid="import-upload-step">
            <p data-testid="import-instructions">
              Upload a CSV file with columns: name, website, contactEmail, riskLevel, status,
              category, tags, description
            </p>
            <div data-testid="file-input-wrapper" style={{ marginTop: "16px" }}>
              <input
                data-testid="file-input"
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {step === "preview" && (
          <div data-testid="import-preview-step">
            <p data-testid="preview-info">
              Found <strong data-testid="preview-count">{parsedData.length}</strong> vendor
              {parsedData.length !== 1 ? "s" : ""} in{" "}
              <strong data-testid="preview-filename">{fileName}</strong>
            </p>
            <div
              data-testid="preview-table"
              style={{
                maxHeight: "200px",
                overflowY: "auto",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
              }}
            >
              {parsedData.slice(0, 10).map((item, i) => (
                <div
                  key={i}
                  data-testid={`preview-row-${i}`}
                  style={{
                    padding: "6px 12px",
                    borderBottom: "1px solid #f3f4f6",
                    fontSize: "13px",
                  }}
                >
                  {item.name || `Row ${i + 1}`}
                </div>
              ))}
              {parsedData.length > 10 && (
                <div
                  data-testid="preview-more"
                  style={{ padding: "6px 12px", color: "#6b7280", fontSize: "12px" }}
                >
                  +{parsedData.length - 10} more rows
                </div>
              )}
            </div>
          </div>
        )}

        {loading && (
          <div data-testid="import-progress" style={{ marginTop: "16px" }}>
            <Spinner data-testid="import-spinner" />
            <p data-testid="import-progress-text">Importing vendors...</p>
          </div>
        )}

        <div
          data-testid="import-actions"
          style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "24px" }}
        >
          {step === "preview" && (
            <Button
              data-testid="back-button"
              variant="secondary"
              onClick={handleReset}
              disabled={loading}
            >
              Back
            </Button>
          )}
          <Button
            data-testid="cancel-import-button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          {step === "preview" && (
            <Button
              data-testid="confirm-import-button"
              onClick={handleImport}
              disabled={loading || parsedData.length === 0}
            >
              Import {parsedData.length} Vendor{parsedData.length !== 1 ? "s" : ""}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default VendorImportModal;
