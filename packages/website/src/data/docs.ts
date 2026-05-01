import type { ComponentType } from "react";

import InstallationComponent from "./docs/installation.mdx";
import QuickStartComponent from "./docs/quick-start.mdx";
import ProjectSetupComponent from "./docs/project-setup.mdx";
import DescribeItComponent from "./docs/describe-it.mdx";
import ExpectComponent from "./docs/expect.mdx";
import RenderComponent from "./docs/render.mdx";
import SnapshotComponent from "./docs/snapshot.mdx";
import FireEventComponent from "./docs/fire-event.mdx";
import MockComponent from "./docs/mock.mdx";
import UiOverviewComponent from "./docs/ui-overview.mdx";
import FilmstripComponent from "./docs/filmstrip.mdx";
import TabsComponent from "./docs/tabs.mdx";
import GraphViewComponent from "./docs/graph-view.mdx";
import NodeModeComponent from "./docs/node-mode.mdx";
import WatchModeComponent from "./docs/watch-mode.mdx";
import CoverageComponent from "./docs/coverage.mdx";
import ShardingComponent from "./docs/sharding.mdx";
import CachingComponent from "./docs/caching.mdx";
import VitePluginComponent from "./docs/vite-plugin.mdx";
import EnvOverrideComponent from "./docs/env-override.mdx";
import RegisterTabComponent from "./docs/register-tab.mdx";
import AfterTestHookComponent from "./docs/after-test-hook.mdx";
import VitestCompatComponent from "./docs/vitest-compat.mdx";

export interface DocEntry {
  id: string;
  category: string;
  title: string;
  Component: ComponentType;
}

export const docs: DocEntry[] = [
  // ── Getting Started ──────────────────────────────────────────────────────
  {
    id: "installation",
    category: "Getting Started",
    title: "Installation",
    Component: InstallationComponent,
  },
  {
    id: "quick-start",
    category: "Getting Started",
    title: "Quick Start",
    Component: QuickStartComponent,
  },
  {
    id: "project-setup",
    category: "Getting Started",
    title: "Project Setup",
    Component: ProjectSetupComponent,
  },

  // ── Core API ─────────────────────────────────────────────────────────────
  {
    id: "describe-it",
    category: "Core API",
    title: "describe / it / test",
    Component: DescribeItComponent,
  },
  { id: "expect", category: "Core API", title: "expect", Component: ExpectComponent },
  { id: "render", category: "Core API", title: "render", Component: RenderComponent },
  { id: "snapshot", category: "Core API", title: "snapshot", Component: SnapshotComponent },
  { id: "fire-event", category: "Core API", title: "fireEvent", Component: FireEventComponent },
  { id: "mock", category: "Core API", title: "mock / unmock", Component: MockComponent },

  // ── Browser UI ───────────────────────────────────────────────────────────
  { id: "ui-overview", category: "Browser UI", title: "Overview", Component: UiOverviewComponent },
  { id: "filmstrip", category: "Browser UI", title: "Filmstrip", Component: FilmstripComponent },
  { id: "tabs", category: "Browser UI", title: "Tabs", Component: TabsComponent },
  { id: "graph-view", category: "Browser UI", title: "Graph View", Component: GraphViewComponent },

  // ── Node / CI ────────────────────────────────────────────────────────────
  { id: "node-mode", category: "Node / CI", title: "Running Tests", Component: NodeModeComponent },
  {
    id: "vitest-compat",
    category: "Node / CI",
    title: "Vitest Compatibility",
    Component: VitestCompatComponent,
  },
  { id: "watch-mode", category: "Node / CI", title: "Watch Mode", Component: WatchModeComponent },
  { id: "coverage", category: "Node / CI", title: "Coverage", Component: CoverageComponent },
  { id: "sharding", category: "Node / CI", title: "Sharding", Component: ShardingComponent },
  { id: "caching", category: "Node / CI", title: "Caching", Component: CachingComponent },

  // ── Configuration ─────────────────────────────────────────────────────────
  {
    id: "vite-plugin",
    category: "Configuration",
    title: "Vite Plugin",
    Component: VitePluginComponent,
  },
  {
    id: "env-override",
    category: "Configuration",
    title: "Environment Override",
    Component: EnvOverrideComponent,
  },

  // ── Plugins ───────────────────────────────────────────────────────────────
  {
    id: "register-tab",
    category: "Plugins",
    title: "registerTab",
    Component: RegisterTabComponent,
  },
  {
    id: "after-test-hook",
    category: "Plugins",
    title: "registerAfterTestHook",
    Component: AfterTestHookComponent,
  },
];

export const categories = [...new Set(docs.map((d) => d.category))];
