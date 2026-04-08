import type React from "react";
import type { TestCase } from "../framework/types";

export interface TabPlugin {
  id: string;
  label: string;
  /** Return a count badge value, or undefined to hide the badge */
  getCount?: (test: TestCase) => number | undefined;
  component: React.ComponentType<{ test: TestCase }>;
}

const _tabs: TabPlugin[] = [];

/**
 * Register a custom tab in the test detail panel.
 * Call this before `startApp` (e.g. in `.fieldtest/setup.ts`).
 *
 * Duplicate IDs are ignored so HMR re-execution doesn't stack entries.
 */
export function registerTab(plugin: TabPlugin) {
  if (!_tabs.find((t) => t.id === plugin.id)) {
    _tabs.push(plugin);
  }
}

export function getRegisteredTabs(): readonly TabPlugin[] {
  return _tabs;
}
