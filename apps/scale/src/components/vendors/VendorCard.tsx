import React from "react";
import { Vendor } from "../../types";
import { Badge } from "../ui/Badge";
import { StatusBadge } from "../ui/StatusBadge";
import { RiskBadge } from "../ui/RiskBadge";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

interface VendorCardProps {
  vendor: Vendor;
  onClick?: (vendor: Vendor) => void;
  onEdit?: (vendor: Vendor) => void;
  onDelete?: (vendor: Vendor) => void;
  selected?: boolean;
  compact?: boolean;
}

export function VendorCard({
  vendor,
  onClick,
  onEdit,
  onDelete,
  selected = false,
  compact = false,
}: VendorCardProps) {
  const handleClick = () => onClick?.(vendor);
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(vendor);
  };
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(vendor);
  };

  return (
    <Card
      data-testid="vendor-card"
      data-selected={selected}
      data-compact={compact}
      onClick={handleClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        outline: selected ? "2px solid #3b82f6" : "none",
      }}
    >
      <div
        data-testid="vendor-card-header"
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <div>
          <h3 data-testid="vendor-name" style={{ margin: 0, fontSize: compact ? "14px" : "18px" }}>
            {vendor.name}
          </h3>
          <span data-testid="vendor-category" style={{ color: "#6b7280", fontSize: "13px" }}>
            {vendor.category}
          </span>
        </div>
        <div
          data-testid="vendor-badges"
          style={{ display: "flex", gap: "8px", alignItems: "center" }}
        >
          <RiskBadge data-testid="risk-badge" risk={vendor.riskLevel} />
          <StatusBadge data-testid="status-badge" status={vendor.status} />
        </div>
      </div>

      {!compact && vendor.description && (
        <p
          data-testid="vendor-description"
          style={{ margin: "8px 0", color: "#374151", fontSize: "14px" }}
        >
          {vendor.description}
        </p>
      )}

      <div
        data-testid="vendor-meta"
        style={{
          marginTop: "12px",
          display: "flex",
          gap: "16px",
          fontSize: "13px",
          color: "#6b7280",
        }}
      >
        <span data-testid="vendor-website">
          <a
            href={vendor.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            {vendor.website}
          </a>
        </span>
        <span data-testid="vendor-contact">{vendor.contactEmail}</span>
        <span data-testid="vendor-review-date">Last review: {vendor.lastReviewDate}</span>
      </div>

      {vendor.tags && vendor.tags.length > 0 && (
        <div
          data-testid="vendor-tags"
          style={{ marginTop: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}
        >
          {vendor.tags.map((tag) => (
            <Badge key={tag} data-testid={`tag-${tag}`}>
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {(onEdit || onDelete) && (
        <div
          data-testid="vendor-actions"
          style={{ marginTop: "12px", display: "flex", gap: "8px" }}
        >
          {onEdit && (
            <Button data-testid="edit-button" size="sm" variant="secondary" onClick={handleEdit}>
              Edit
            </Button>
          )}
          {onDelete && (
            <Button data-testid="delete-button" size="sm" variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

export default VendorCard;
