import type {
  TestSuite,
  TestCase,
  Assertion,
  Snapshot,
  TestStatus,
  IstanbulCoverage,
  ConsoleEntry,
} from "fieldtest";

export interface SerializableSnapshot {
  label: string;
  timestamp: number;
  html: string;
  // element (ReactElement) intentionally omitted — not serializable
}

export interface SerializableTestCase {
  id: string;
  name: string;
  suiteId: string;
  suiteName: string;
  status: TestStatus;
  error?: string;
  assertions: Assertion[];
  snapshots: SerializableSnapshot[];
  consoleLogs: ConsoleEntry[];
  testCoverage: IstanbulCoverage | null;
  // fn intentionally omitted — not serializable
}

export interface SerializableTestSuite {
  id: string;
  name: string;
  tests: SerializableTestCase[];
  status: TestStatus;
  sourceFile?: string;
  duration?: number;
}

export function serializeSnapshot(s: Snapshot): SerializableSnapshot {
  return { label: s.label, timestamp: s.timestamp, html: s.html };
}

export function serializeTestCase(t: TestCase): SerializableTestCase {
  return {
    id: t.id,
    name: t.name,
    suiteId: t.suiteId,
    suiteName: t.suiteName,
    status: t.status,
    error: t.error,
    assertions: t.assertions,
    snapshots: t.snapshots.map(serializeSnapshot),
    consoleLogs: t.consoleLogs,
    testCoverage: t.testCoverage,
  };
}

export function serializeTestSuite(s: TestSuite): SerializableTestSuite {
  return {
    id: s.id,
    name: s.name,
    tests: s.tests.map(serializeTestCase),
    status: s.status,
    sourceFile: s.sourceFile,
    duration: s.duration,
  };
}
