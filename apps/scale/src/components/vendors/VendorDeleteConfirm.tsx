import React from "react";
import { Vendor } from "../../types";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { Spinner } from "../ui/Spinner";

interface VendorDeleteConfirmProps {
  vendor: Vendor;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function VendorDeleteConfirm({
  vendor,
  open,
  onConfirm,
  onCancel,
  loading = false,
}: VendorDeleteConfirmProps) {
  if (!open) return null;

  return (
    <Modal data-testid="vendor-delete-modal" open={open} onClose={onCancel}>
      <div data-testid="delete-confirm-container">
        <h2 data-testid="delete-confirm-title">Delete Vendor</h2>

        <Alert data-testid="delete-confirm-alert" variant="warning">
          <p data-testid="delete-confirm-message">
            Are you sure you want to delete{" "}
            <strong data-testid="delete-vendor-name">{vendor.name}</strong>? This action cannot be
            undone.
          </p>
        </Alert>

        <div
          data-testid="delete-vendor-info"
          style={{ margin: "16px 0", padding: "12px", background: "#f9fafb", borderRadius: "6px" }}
        >
          <div data-testid="delete-vendor-category">
            <strong>Category:</strong> {vendor.category}
          </div>
          <div data-testid="delete-vendor-risk">
            <strong>Risk Level:</strong> {vendor.riskLevel}
          </div>
          <div data-testid="delete-vendor-status">
            <strong>Status:</strong> {vendor.status}
          </div>
        </div>

        <div
          data-testid="delete-confirm-actions"
          style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}
        >
          <Button
            data-testid="cancel-delete-button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            data-testid="confirm-delete-button"
            variant="danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" data-testid="delete-spinner" /> : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default VendorDeleteConfirm;
