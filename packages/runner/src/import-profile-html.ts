import { existsSync, readFileSync } from "node:fs";
import type { ImportProfile } from "./import-profile.js";
import { buildImportProfileReport } from "./import-profile-report.js";

export interface ImportProfileHtmlOptions {
  cwd: string;
  generatedAt?: Date;
  command?: string;
}

/** Escape everything that could close the host <script> element or break the parse. */
function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

function reportAppBundle(): string {
  const adjacentBundle = new URL("./import-profile-app.js", import.meta.url);
  const bundle = existsSync(adjacentBundle)
    ? adjacentBundle
    : new URL("../dist/import-profile-app.js", import.meta.url);
  return readFileSync(bundle, "utf8").replaceAll("</script", "<\\/script");
}

const STYLES = `
:root {
  --paper: #f3f5f8;
  --surface: #fff;
  --ink: #172033;
  --muted: #657086;
  --line: #dce1e9;
  --cpu: #3659e3;
  font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--ink);
  background: var(--paper);
}
* { box-sizing: border-box; }
body { margin: 0; min-width: 340px; }
button, input, select { font: inherit; color: inherit; }
#report { width: min(1680px, calc(100% - 36px)); margin: auto; padding: 26px 0 46px; }
.kicker {
  display: block; color: var(--muted); font-size: 11px; font-weight: 750;
  letter-spacing: .08em; text-transform: uppercase;
}

.masthead { display: grid; grid-template-columns: minmax(0, 1fr) minmax(250px, .34fr); gap: 36px; align-items: end; }
.masthead .kicker { color: var(--cpu); margin-bottom: 8px; }
.masthead h1 { margin: 0; font-size: clamp(30px, 4vw, 48px); line-height: 1.02; letter-spacing: -.045em; }
.masthead p { max-width: 720px; margin: 14px 0 0; color: var(--muted); font-size: 14px; line-height: 1.55; }
.masthead-meta { display: grid; gap: 7px; color: var(--muted); font: 11px/1.5 ui-monospace, monospace; text-align: right; }
.masthead-meta > * { overflow-wrap: anywhere; }
.masthead-meta code { color: var(--ink); }
select, input {
  width: 100%; min-width: 0; padding: 9px 11px; background: #fff;
  border: 1px solid var(--line); border-radius: 7px; outline: none;
}
select:focus, input:focus { border-color: var(--cpu); box-shadow: 0 0 0 3px #3659e31f; }
.masthead-meta select { text-align: left; font: 12px ui-monospace, monospace; }

.run {
  display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(280px, 1fr); gap: 1px;
  margin-top: 26px; padding: 1px; background: var(--line); border: 1px solid var(--line);
}
.run > * { min-width: 0; padding: 16px 18px; background: var(--surface); }
.run-list { display: grid; gap: 2px; max-height: 178px; overflow-y: auto; margin-top: 10px; }
.run-row {
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(120px, .8fr) 62px; gap: 12px;
  align-items: center; padding: 5px 7px; background: transparent; border: 0; border-radius: 5px;
  cursor: pointer; text-align: left;
}
.run-row:hover { background: #f4f6fb; }
.run-row[aria-current="true"] { background: #eaefff; }
.run-row > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 11px/1.3 ui-monospace, monospace; }
.run-row > i { display: flex; height: 11px; background: #eef1f6; border-radius: 2px; overflow: hidden; }
.run-row em { display: block; }
.run-row > strong { text-align: right; font: 700 10px/1 ui-monospace, monospace; }
.phase-legend { display: grid; gap: 8px; margin: 12px 0 0; padding: 0; list-style: none; }
.phase-legend li { display: grid; grid-template-columns: 9px minmax(0, 1fr) auto; gap: 9px; align-items: center; }
.phase-legend i { width: 9px; height: 15px; border-radius: 2px; }
.phase-legend span { font-size: 12px; }
.phase-legend strong { font: 700 11px/1 ui-monospace, monospace; }
.run-note { margin: 13px 0 0; color: var(--muted); font-size: 11px; line-height: 1.55; }

.workbench {
  display: grid; grid-template-columns: minmax(300px, 400px) minmax(0, 1fr); gap: 18px;
  margin-top: 18px; height: max(660px, calc(100vh - 120px));
}
.ranked, .graph-panel {
  display: flex; flex-direction: column; min-width: 0; min-height: 0;
  background: var(--surface); border: 1px solid var(--line);
}
.ranked-tools { display: grid; grid-template-columns: minmax(0, 1fr) 132px; gap: 8px; padding: 13px 14px 0; }
.ranked-hint {
  display: flex; justify-content: space-between; gap: 12px; align-items: baseline;
  margin: 8px 14px 10px; color: var(--muted); font-size: 11px; line-height: 1.4;
}
.ranked-hint button {
  flex: none; padding: 3px 8px; color: var(--muted); background: #fff;
  border: 1px solid var(--line); border-radius: 20px; cursor: pointer; font-size: 10px; font-weight: 650;
}
.ranked-hint button[aria-pressed="true"] { color: var(--cpu); background: #eef2ff; border-color: var(--cpu); }
.ranked-viewport { flex: 1; min-height: 0; overflow-y: auto; border-top: 1px solid var(--line); }
.ranked-spacer { position: relative; }
.ranked-row {
  position: absolute; left: 0; right: 0; display: grid;
  grid-template-columns: minmax(0, 1fr) 74px; grid-template-rows: auto auto;
  gap: 0 10px; align-content: center; padding: 0 12px; overflow: hidden;
  background: transparent; border: 0; border-bottom: 1px solid #eef1f6; cursor: pointer; text-align: left;
}
.ranked-row:hover { background: #f6f8fc; }
.ranked-row[aria-current="true"] { background: #eaefff; box-shadow: inset 3px 0 0 var(--cpu); }
.ranked-fill { position: absolute; inset: auto auto 0 0; height: 3px; background: var(--cpu); opacity: .5; }
.ranked-path { display: flex; min-width: 0; font: 11px/1.4 ui-monospace, monospace; }
/* Shrink the directory long before the file name, which is the identifying part. */
.path-dir { flex: 0 100 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-style: normal; }
.path-name { flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
.ranked-cost { text-align: right; font: 700 11px/1.4 ui-monospace, monospace; }
.ranked-why { grid-column: 1 / -1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-size: 10px; }
.ranked-empty { margin: 0; padding: 22px 14px; color: var(--muted); font-size: 12px; line-height: 1.5; }
.ranked-note { margin: 0; padding: 9px 14px; color: var(--muted); border-top: 1px solid var(--line); font-size: 11px; }

.graph-bar { display: flex; justify-content: space-between; gap: 14px; align-items: center; padding: 10px 13px; border-bottom: 1px solid var(--line); }
.crumbs { display: flex; gap: 4px; min-width: 0; overflow-x: auto; }
.crumbs button {
  max-width: 190px; padding: 6px 9px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  background: #f4f6fb; border: 1px solid var(--line); border-radius: 6px; cursor: pointer;
  font: 10px/1.2 ui-monospace, monospace;
}
.crumbs button[aria-current="true"] { color: #fff; background: var(--cpu); border-color: var(--cpu); }
.graph-controls { display: flex; gap: 6px; }
.graph-controls button {
  white-space: nowrap; padding: 6px 10px; background: #fff; border: 1px solid var(--line);
  border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 650;
}
.graph-controls button[aria-pressed="true"] { color: var(--cpu); background: #eef2ff; border-color: var(--cpu); }
.graph-body { display: grid; grid-template-columns: minmax(0, 1fr) minmax(270px, 330px); flex: 1; min-height: 0; }
.graph-scroll {
  min-width: 0; overflow: auto; border-right: 1px solid var(--line);
  background-color: #fafbfe; background-image: radial-gradient(#d5dbe8 1px, transparent 1px); background-size: 18px 18px;
}
.graph { display: block; }
.edge { fill: none; stroke: #b7c0d1; stroke-width: 1.3; }
.edge-primary { stroke: #5c6f96; stroke-width: 1.9; }
.node { cursor: pointer; }
.node rect { stroke: #c6cfdf; stroke-width: 1.2; filter: drop-shadow(0 2px 4px #23325014); }
.node:hover rect, .node:focus rect { stroke: var(--cpu); stroke-width: 2; }
.node.is-focus rect { stroke: var(--cpu); stroke-width: 2.6; }
.node.is-path rect { stroke: #8aa0e0; stroke-width: 2; }
.column-more { fill: var(--muted); font: 10px ui-monospace, monospace; }
.node text { pointer-events: none; font: 11px ui-monospace, monospace; }
.node .node-cost { font-size: 10px; }
.node .node-owned { font-size: 9px; }
.graph-truncation { margin: 0; padding: 9px 14px; color: var(--muted); font-size: 11px; }

.inspector { display: flex; flex-direction: column; gap: 14px; min-width: 0; padding: 16px; overflow-y: auto; }
.inspector-path { margin: 7px 0 0; overflow-wrap: anywhere; font: 700 12px/1.5 ui-monospace, monospace; }
.inspector-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; padding: 1px; background: var(--line); }
.inspector-metrics div { min-width: 0; padding: 9px 10px; overflow: hidden; background: #fff; }
.inspector-metrics span { display: block; color: var(--muted); font-size: 9px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.inspector-metrics strong { display: block; margin-top: 4px; font: 700 13px/1.2 ui-monospace, monospace; }
.inspector-diagnosis { margin: 0; padding: 12px 13px; color: #39445b; background: #eef2ff; border-left: 3px solid var(--cpu); font-size: 12px; line-height: 1.55; }
.inspector-section { display: grid; grid-template-columns: minmax(0, 1fr); gap: 7px; min-width: 0; }
.inspector-section h3 { margin: 0; font-size: 12px; }
.inspector-empty { margin: 0; color: var(--muted); font-size: 11px; line-height: 1.5; }
.inspector-list { display: grid; grid-template-columns: minmax(0, 1fr); min-width: 0; max-height: 210px; overflow-y: auto; border: 1px solid var(--line); border-radius: 5px; }
.inspector-list button {
  display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: center;
  min-width: 0; padding: 7px 9px; overflow: hidden; background: #fff; border: 0;
  border-bottom: 1px solid #eef1f6; cursor: pointer; text-align: left;
}
.inspector-list button:last-child { border-bottom: 0; }
.inspector-list button:hover { background: #f2f5fb; }
.inspector-list strong { white-space: nowrap; font: 700 10px/1.3 ui-monospace, monospace; }
.inspector-list button > span { display: flex; min-width: 0; overflow: hidden; font: 10px/1.3 ui-monospace, monospace; }
.inspector-chain h3 { margin: 0 0 7px; font-size: 12px; }
.inspector-chain ol { display: grid; grid-template-columns: minmax(0, 1fr); gap: 3px; margin: 0; padding: 0; list-style: none; }
.inspector-chain button {
  display: flex; width: 100%; min-width: 0; padding: 7px 9px; overflow: hidden;
  background: #fff; border: 1px solid var(--line); border-radius: 5px; cursor: pointer;
  text-align: left; font: 10px/1.3 ui-monospace, monospace;
}
.inspector-chain button > span { display: flex; min-width: 0; }
.inspector-chain button:hover { border-color: var(--cpu); }
.inspector-shared { margin: 0; color: var(--muted); font-size: 11px; line-height: 1.5; }

.boot { padding: 60px 0; color: var(--muted); font-size: 14px; }
.empty { display: grid; gap: 10px; justify-items: start; padding: 70px 0; }
.empty p { max-width: 620px; margin: 0; font-size: 20px; letter-spacing: -.02em; }
.empty code { color: var(--muted); font: 12px ui-monospace, monospace; }

@media (max-width: 1100px) {
  .masthead, .run { grid-template-columns: minmax(0, 1fr); }
  .masthead-meta { text-align: left; }
  .workbench { grid-template-columns: minmax(0, 1fr); height: auto; }
  .ranked-viewport { height: 420px; }
  .graph-body { grid-template-columns: minmax(0, 1fr); }
  .graph-scroll { height: 480px; border-right: 0; border-bottom: 1px solid var(--line); }
}
`;

/**
 * Build a portable report: a static shell, one normalized JSON payload, and the
 * React bundle that renders every view from it. The shell renders no data of
 * its own, so the payload and the bundle are the only sources of truth.
 */
export function renderImportProfileHtml(
  profile: ImportProfile,
  options: ImportProfileHtmlOptions,
): string {
  const payload = buildImportProfileReport(profile, {
    cwd: options.cwd,
    generatedAt: options.generatedAt ?? new Date(),
    command: options.command ?? "roadtest --profile-imports",
  });

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Roadtest import profile</title>
<style>${STYLES}</style>
</head><body>
<div id="report"><p class="boot">Loading import profile…</p></div>
<script id="profile-data" type="application/json">${safeJson(payload)}</script>
<script data-roadtest-react-app>${reportAppBundle()}</script>
</body></html>`;
}
