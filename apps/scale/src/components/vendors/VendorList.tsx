import React from "react";
import { Vendor } from "../../types";
import { VendorCard } from "./VendorCard";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/EmptyState";

interface VendorListProps {
  vendors: Vendor[];
  loading?: boolean;
  onSelect?: (vendor: Vendor) => void;
  onEdit?: (vendor: Vendor) => void;
  onDelete?: (vendor: Vendor) => void;
  selectedIds?: string[];
}

export function VendorList({
  vendors,
  loading = false,
  onSelect,
  onEdit,
  onDelete,
  selectedIds = [],
}: VendorListProps) {
  if (loading) {
    return (
      <div
        data-testid="vendor-list-loading"
        style={{ display: "flex", justifyContent: "center", padding: "48px" }}
      >
        <Spinner data-testid="loading-spinner" />
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div data-testid="vendor-list-empty">
        <EmptyState title="No vendors found" description="Add a vendor to get started." />
      </div>
    );
  }

  return (
    <div
      data-testid="vendor-list"
      style={{ display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <div data-testid="vendor-list-count" style={{ fontSize: "13px", color: "#6b7280" }}>
        {vendors.length} vendor{vendors.length !== 1 ? "s" : ""}
      </div>
      {vendors.map((vendor) => (
        <VendorCard
          key={vendor.id}
          vendor={vendor}
          onClick={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          selected={selectedIds.includes(vendor.id)}
        />
      ))}
    </div>
  );
}

export default VendorList;
