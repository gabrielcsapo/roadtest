import React from "react";
import { Vendor } from "../../types";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Alert } from "../ui/Alert";

interface VendorReviewScheduleProps {
  vendor: Vendor;
  reviewIntervalDays?: number;
  onScheduleReview?: (vendor: Vendor) => void;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from);
  const b = new Date(to);
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export function VendorReviewSchedule({
  vendor,
  reviewIntervalDays = 365,
  onScheduleReview,
}: VendorReviewScheduleProps) {
  const today = new Date().toISOString().split("T")[0];
  const nextReviewDate = addDays(vendor.lastReviewDate, reviewIntervalDays);
  const daysUntilNextReview = daysBetween(today, nextReviewDate);
  const daysSinceLastReview = daysBetween(vendor.lastReviewDate, today);
  const isOverdue = daysUntilNextReview < 0;
  const isDueSoon = daysUntilNextReview >= 0 && daysUntilNextReview <= 30;

  return (
    <Card data-testid="vendor-review-schedule">
      <h3 data-testid="review-schedule-title" style={{ margin: "0 0 16px 0" }}>
        Review Schedule
      </h3>

      {isOverdue && (
        <Alert data-testid="overdue-alert" variant="error" style={{ marginBottom: "12px" }}>
          Review is overdue by {Math.abs(daysUntilNextReview)} days.
        </Alert>
      )}

      {isDueSoon && !isOverdue && (
        <Alert data-testid="due-soon-alert" variant="warning" style={{ marginBottom: "12px" }}>
          Review is due in {daysUntilNextReview} days.
        </Alert>
      )}

      <div
        data-testid="review-info"
        style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}
      >
        <div data-testid="last-review-section">
          <span style={{ color: "#6b7280" }}>Last reviewed:</span>{" "}
          <strong data-testid="last-review-date">{vendor.lastReviewDate}</strong>
          <span
            data-testid="days-since-review"
            style={{ marginLeft: "8px", color: "#9ca3af", fontSize: "12px" }}
          >
            ({daysSinceLastReview} days ago)
          </span>
        </div>

        <div data-testid="next-review-section">
          <span style={{ color: "#6b7280" }}>Next review due:</span>{" "}
          <strong data-testid="next-review-date">{nextReviewDate}</strong>
          <span data-testid="days-until-review" style={{ marginLeft: "8px" }}>
            <Badge
              data-testid="review-status-badge"
              style={{
                backgroundColor: isOverdue ? "#ef4444" : isDueSoon ? "#f59e0b" : "#22c55e",
                color: "white",
              }}
            >
              {isOverdue
                ? `${Math.abs(daysUntilNextReview)}d overdue`
                : isDueSoon
                  ? `${daysUntilNextReview}d`
                  : "On schedule"}
            </Badge>
          </span>
        </div>

        <div data-testid="review-interval-section">
          <span style={{ color: "#6b7280" }}>Review interval:</span>{" "}
          <strong data-testid="review-interval">{reviewIntervalDays} days</strong>
        </div>
      </div>

      {onScheduleReview && (
        <Button
          data-testid="schedule-review-button"
          variant="secondary"
          onClick={() => onScheduleReview(vendor)}
          style={{ marginTop: "16px" }}
        >
          Schedule Review
        </Button>
      )}
    </Card>
  );
}

export default VendorReviewSchedule;
