import { useCallback, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import type { StoreState, TestCase } from "../../framework/types";
import type { SandboxApi } from "../context";

function toTestUrl(suiteName: string, testName: string) {
  return `/suite/${encodeURIComponent(suiteName)}/test/${encodeURIComponent(testName)}`;
}

function toSuiteUrl(suiteName: string) {
  return `/suite/${encodeURIComponent(suiteName)}`;
}

export interface TestNavigation {
  handleSelect: (test: TestCase) => void;
  handleSelectSuite: (suiteId: string) => void;
  handleNavigateToTest: (suiteId: string, testId: string) => void;
  handleRunAll: () => void;
  handleRunSuite: (id: string) => void;
  handleRunTest: (suiteId: string, testId: string) => void;
}

/**
 * Centralises all test/suite navigation and run-trigger callbacks used by
 * DetailLayout. Extracted so the routing + API-call logic can be tested in
 * isolation without rendering the full layout tree.
 */
export function useTestNavigation(
  state: StoreState,
  apiRef: RefObject<SandboxApi | null>,
): TestNavigation {
  const navigate = useNavigate();

  const handleSelect = useCallback(
    (test: TestCase) => navigate(toTestUrl(test.suiteName, test.name)),
    [navigate],
  );

  const handleSelectSuite = useCallback(
    (suiteId: string) => {
      const s = state.suites.find((su) => su.id === suiteId);
      if (s) navigate(toSuiteUrl(s.name));
    },
    [navigate, state.suites],
  );

  const handleNavigateToTest = useCallback(
    (suiteId: string, testId: string) => {
      const test = state.suites
        .flatMap((s) => s.tests)
        .find((t) => t.suiteId === suiteId && t.id === testId);
      if (test) navigate(toTestUrl(test.suiteName, test.name));
    },
    [navigate, state.suites],
  );

  const handleRunAll = useCallback(() => {
    apiRef.current?.runAll();
  }, [apiRef]);

  const handleRunSuite = useCallback(
    (id: string) => {
      const s = state.suites.find((su) => su.id === id);
      if (s) navigate(toSuiteUrl(s.name));
      apiRef.current?.runSuite(id);
    },
    [navigate, state.suites, apiRef],
  );

  const handleRunTest = useCallback(
    (suiteId: string, testId: string) => {
      const test = state.suites
        .flatMap((s) => s.tests)
        .find((t) => t.suiteId === suiteId && t.id === testId);
      if (test) navigate(toTestUrl(test.suiteName, test.name));
      apiRef.current?.runTest(suiteId, testId);
    },
    [navigate, state.suites, apiRef],
  );

  return {
    handleSelect,
    handleSelectSuite,
    handleNavigateToTest,
    handleRunAll,
    handleRunSuite,
    handleRunTest,
  };
}
