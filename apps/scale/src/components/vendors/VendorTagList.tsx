import React, { useState } from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

interface VendorTagListProps {
  tags: string[];
  maxVisible?: number;
  onTagClick?: (tag: string) => void;
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
  editable?: boolean;
}

export function VendorTagList({
  tags,
  maxVisible = 5,
  onTagClick,
  onAddTag,
  onRemoveTag,
  editable = false,
}: VendorTagListProps) {
  const [showAll, setShowAll] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [adding, setAdding] = useState(false);

  const visibleTags = showAll ? tags : tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && onAddTag) {
      onAddTag(trimmed);
      setNewTag("");
      setAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAddTag();
    if (e.key === "Escape") {
      setAdding(false);
      setNewTag("");
    }
  };

  if (tags.length === 0 && !editable) {
    return <div data-testid="vendor-tag-list-empty">No tags</div>;
  }

  return (
    <div
      data-testid="vendor-tag-list"
      style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}
    >
      {visibleTags.map((tag) => (
        <span
          key={tag}
          data-testid={`tag-item-${tag}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
        >
          <Badge
            data-testid={`tag-badge-${tag}`}
            onClick={() => onTagClick?.(tag)}
            style={{ cursor: onTagClick ? "pointer" : "default" }}
          >
            {tag}
          </Badge>
          {editable && onRemoveTag && (
            <button
              data-testid={`remove-tag-${tag}`}
              onClick={() => onRemoveTag(tag)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "0" }}
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          )}
        </span>
      ))}

      {!showAll && hiddenCount > 0 && (
        <button
          data-testid="show-more-tags"
          onClick={() => setShowAll(true)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#3b82f6",
            fontSize: "12px",
          }}
        >
          +{hiddenCount} more
        </button>
      )}

      {showAll && tags.length > maxVisible && (
        <button
          data-testid="show-less-tags"
          onClick={() => setShowAll(false)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#3b82f6",
            fontSize: "12px",
          }}
        >
          Show less
        </button>
      )}

      {editable && !adding && onAddTag && (
        <Button
          data-testid="add-tag-button"
          size="sm"
          variant="secondary"
          onClick={() => setAdding(true)}
        >
          + Add tag
        </Button>
      )}

      {editable && adding && (
        <div data-testid="add-tag-input-container" style={{ display: "inline-flex", gap: "4px" }}>
          <Input
            data-testid="add-tag-input"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tag name..."
            style={{ width: "120px", fontSize: "12px" }}
            autoFocus
          />
          <Button data-testid="confirm-add-tag" size="sm" onClick={handleAddTag}>
            Add
          </Button>
          <Button
            data-testid="cancel-add-tag"
            size="sm"
            variant="secondary"
            onClick={() => {
              setAdding(false);
              setNewTag("");
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

export default VendorTagList;
