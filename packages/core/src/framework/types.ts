import type { ReactElement } from "react";

export type TestStatus = "pending" | "running" | "pass" | "fail" | "skipped";

export interface Assertion {
  label: string;
  status: "pass" | "fail";
  error?: string;
  /**
   * Present on snapshot assertions created by snapshot() / toMatchSnapshot().
   * Holds the captured HTML and — after comparison — the baseline HTML when
   * there is a mismatch, so the diff can be displayed in the assertions tab.
   */
  snapshot?: {
    label: string;
    html: string;
    baselineHtml?: string;
    /** Context needed to write the baseline back to the server */
    sourceFile?: string;
    suiteName?: string;
    testName?: string;
  };
}

export interface Snapshot {
  label: string;
  /** ms since epoch when this snapshot was captured */
  timestamp: number;
  /** The React element — used for the live interactive canvas */
  element: ReactElement;
  /** DOM innerHTML captured at this point — used for filmstrip thumbnails */
  html: string;
  /** Stored baseline HTML — set when a mismatch is detected, used for side-by-side comparison */
  baselineHtml?: string;
  /**
   * When true this snapshot was taken by an explicit snapshot() / toMatchSnapshot() call
   * and is compared against stored baselines.
   * When false (default for render() auto-captures) it is preview-only — shown in the
   * filmstrip but never written to disk or compared against baselines.
   */
  comparison?: boolean;
}

export type ConsoleLevel = "log" | "warn" | "error" | "info" | "debug";

export interface ConsoleEntry {
  level: ConsoleLevel;
  args: string[];
  timestamp: number;
}

export interface MockCall {
  /** Name of the exported function that was called */
  fnName: string;
  /** Arguments passed to the function */
  args: unknown[];
  /** Value returned (or thrown) by the function */
  result: unknown;
  /** Whether the function threw instead of returning */
  threw: boolean;
  /** ms since epoch when the call happened */
  timestamp: number;
}

export interface MockEntry {
  moduleId: string;
  hasFactory: boolean;
  /** Call history for every spied function exported by this mock */
  calls: MockCall[];
}

export interface NetworkEntry {
  method: string;
  url: string;
  status: number;
  /** Whether this request was intercepted by an MSW handler */
  mocked: boolean;
  requestBody?: string;
  responseBody?: string;
  duration: number;
  timestamp: number;
}

export interface TestCase {
  id: string;
  name: string;
  suiteId: string;
  suiteName: string;
  status: TestStatus;
  error?: string;
  assertions: Assertion[];
  /** Ordered list of visual snapshots captured during this test */
  snapshots: Snapshot[];
  /** Console output captured during this test */
  consoleLogs: ConsoleEntry[];
  /** Network requests captured during this test (requires MSW integration) */
  networkEntries: NetworkEntry[];
  /** Module mocks active when this test ran (populated by the FieldTest Vite transform) */
  mockEntries: MockEntry[];
  /** Coverage delta — statements hit specifically during this test */
  testCoverage: IstanbulCoverage | null;
  /** Wall-clock ms the test took to run */
  duration?: number;
  /** Undefined for node tests — results arrive from the server, not executed in-browser */
  fn?: () => void | Promise<void>;
  /** Marked with it.only or inside a describe.only — only these run when any .only exists */
  only?: boolean;
}

export interface TestSuite {
  id: string;
  name: string;
  tests: TestCase[];
  status: TestStatus;
  /** Absolute path of the test file that registered this suite */
  sourceFile?: string;
  /** Wall-clock ms the suite took to run (all tests) */
  duration?: number;
  /** Where the tests ran — browser (default) or Node via the Vite server */
  runtime?: "browser" | "node";
}

// Istanbul coverage types (subset we actually use)
export interface IstanbulLocation {
  line: number;
  column: number;
}
export interface IstanbulRange {
  start: IstanbulLocation;
  end: IstanbulLocation;
}

export interface IstanbulSourceMap {
  version: number;
  sources: string[];
  sourcesContent?: string[];
  mappings: string;
  names?: string[];
}

export interface IstanbulFileCoverage {
  path: string;
  s: Record<string, number>; // statement hit counts
  b: Record<string, number[]>; // branch hit counts
  f: Record<string, number>; // function hit counts
  statementMap: Record<string, IstanbulRange>;
  branchMap: Record<string, { locations: IstanbulRange[] }>;
  fnMap: Record<string, { name: string; loc: IstanbulRange }>;
  inputSourceMap?: IstanbulSourceMap;
}

export type IstanbulCoverage = Record<string, IstanbulFileCoverage>;

export interface RunProgress {
  done: number;
  total: number;
  startedAt: number;
}

export interface StoreState {
  suites: TestSuite[];
  running: boolean;
  lastRunAt: Date | null;
  coverage: IstanbulCoverage | null;
  runProgress: RunProgress | null;
}
