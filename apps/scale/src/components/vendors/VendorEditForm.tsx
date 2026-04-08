import React, { useState } from "react";
import { Vendor, Risk, Status } from "../../types";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Alert } from "../ui/Alert";
import { Spinner } from "../ui/Spinner";

interface VendorEditFormProps {
  vendor?: Vendor;
  onSubmit: (v: Partial<Vendor>) => void;
  onCancel: () => void;
  loading?: boolean;
}

const RISK_OPTIONS: Risk[] = ["low", "medium", "high", "critical"];
const STATUS_OPTIONS: Status[] = ["active", "inactive", "pending", "archived"];
const CATEGORY_OPTIONS = [
  "Cloud Infrastructure",
  "Payment Processing",
  "HR Software",
  "Security",
  "Analytics",
  "Communication",
  "Other",
];

export function VendorEditForm({
  vendor,
  onSubmit,
  onCancel,
  loading = false,
}: VendorEditFormProps) {
  const [name, setName] = useState(vendor?.name ?? "");
  const [website, setWebsite] = useState(vendor?.website ?? "");
  const [contactEmail, setContactEmail] = useState(vendor?.contactEmail ?? "");
  const [riskLevel, setRiskLevel] = useState<Risk>(vendor?.riskLevel ?? "low");
  const [status, setStatus] = useState<Status>(vendor?.status ?? "active");
  const [category, setCategory] = useState(vendor?.category ?? "");
  const [description, setDescription] = useState(vendor?.description ?? "");
  const [tags, setTags] = useState(vendor?.tags?.join(", ") ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!website.trim()) errs.website = "Website is required";
    if (!contactEmail.trim()) errs.contactEmail = "Contact email is required";
    if (contactEmail && !contactEmail.includes("@")) errs.contactEmail = "Invalid email address";
    if (!category.trim()) errs.category = "Category is required";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onSubmit({
      name: name.trim(),
      website: website.trim(),
      contactEmail: contactEmail.trim(),
      riskLevel,
      status,
      category: category.trim(),
      description: description.trim() || undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  };

  const isEditing = !!vendor;

  return (
    <form data-testid="vendor-edit-form" onSubmit={handleSubmit} noValidate>
      <h2 data-testid="form-title">{isEditing ? "Edit Vendor" : "Add Vendor"}</h2>

      {Object.keys(errors).length > 0 && (
        <Alert data-testid="form-errors" variant="error">
          Please fix the errors below.
        </Alert>
      )}

      <div data-testid="field-name" style={{ marginBottom: "16px" }}>
        <label htmlFor="vendor-name">Name *</label>
        <Input
          id="vendor-name"
          data-testid="input-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
        {errors.name && (
          <span data-testid="error-name" style={{ color: "red", fontSize: "12px" }}>
            {errors.name}
          </span>
        )}
      </div>

      <div data-testid="field-website" style={{ marginBottom: "16px" }}>
        <label htmlFor="vendor-website">Website *</label>
        <Input
          id="vendor-website"
          data-testid="input-website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          disabled={loading}
        />
        {errors.website && (
          <span data-testid="error-website" style={{ color: "red", fontSize: "12px" }}>
            {errors.website}
          </span>
        )}
      </div>

      <div data-testid="field-contact-email" style={{ marginBottom: "16px" }}>
        <label htmlFor="vendor-contact">Contact Email *</label>
        <Input
          id="vendor-contact"
          data-testid="input-contact-email"
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          disabled={loading}
        />
        {errors.contactEmail && (
          <span data-testid="error-contact-email" style={{ color: "red", fontSize: "12px" }}>
            {errors.contactEmail}
          </span>
        )}
      </div>

      <div data-testid="field-category" style={{ marginBottom: "16px" }}>
        <label htmlFor="vendor-category">Category *</label>
        <Select
          id="vendor-category"
          data-testid="select-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={loading}
        >
          <option value="">Select category...</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        {errors.category && (
          <span data-testid="error-category" style={{ color: "red", fontSize: "12px" }}>
            {errors.category}
          </span>
        )}
      </div>

      <div data-testid="field-risk" style={{ marginBottom: "16px" }}>
        <label htmlFor="vendor-risk">Risk Level</label>
        <Select
          id="vendor-risk"
          data-testid="select-risk"
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value as Risk)}
          disabled={loading}
        >
          {RISK_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </div>

      <div data-testid="field-status" style={{ marginBottom: "16px" }}>
        <label htmlFor="vendor-status">Status</label>
        <Select
          id="vendor-status"
          data-testid="select-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as Status)}
          disabled={loading}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      <div data-testid="field-description" style={{ marginBottom: "16px" }}>
        <label htmlFor="vendor-description">Description</label>
        <Input
          id="vendor-description"
          data-testid="input-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      </div>

      <div data-testid="field-tags" style={{ marginBottom: "24px" }}>
        <label htmlFor="vendor-tags">Tags (comma-separated)</label>
        <Input
          id="vendor-tags"
          data-testid="input-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          disabled={loading}
        />
      </div>

      <div data-testid="form-actions" style={{ display: "flex", gap: "12px" }}>
        <Button data-testid="submit-button" type="submit" disabled={loading}>
          {loading ? <Spinner size="sm" /> : isEditing ? "Save Changes" : "Add Vendor"}
        </Button>
        <Button
          data-testid="cancel-button"
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default VendorEditForm;
