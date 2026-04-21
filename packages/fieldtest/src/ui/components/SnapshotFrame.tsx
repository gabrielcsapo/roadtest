import React from "react";

/**
 * Renders arbitrary HTML in a fully isolated iframe so the FieldTest UI's own
 * CSS never bleeds into the snapshot. The iframe is sized to virtualWidth and
 * scaled down to fit displayWidth × displayHeight via CSS transform.
 */
export function SnapshotFrame({
  html,
  displayWidth,
  displayHeight,
  virtualWidth = 1024,
  style,
}: {
  html: string;
  displayWidth: number;
  displayHeight: number;
  virtualWidth?: number;
  style?: React.CSSProperties;
}) {
  const scale = displayWidth / virtualWidth;
  const virtualHeight = displayHeight / scale;
  return (
    <div
      style={{
        width: displayWidth,
        height: displayHeight,
        overflow: "hidden",
        flexShrink: 0,
        ...style,
      }}
    >
      <iframe
        srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;padding:0;background:transparent}</style></head><body>${html}</body></html>`}
        sandbox="allow-scripts"
        style={{
          border: "none",
          width: virtualWidth,
          height: virtualHeight,
          transformOrigin: "top left",
          transform: `scale(${scale})`,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
