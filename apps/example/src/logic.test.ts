/**
 * Pure logic tests — no render() call, no component.
 * These run identically in the browser and in Node.
 */
import { describe, it, expect } from "@fieldtest/core";
import type { Task } from "./TaskBoard";

function countPending(tasks: Task[]) {
  return tasks.filter((t) => !t.done).length;
}

function filterByKeyword(tasks: Task[], keyword: string) {
  const lower = keyword.toLowerCase();
  return tasks.filter(
    (t) => t.title.toLowerCase().includes(lower) || t.description.toLowerCase().includes(lower),
  );
}

function sortByTitle(tasks: Task[]) {
  return [...tasks].sort((a, b) => a.title.localeCompare(b.title));
}

const TASKS: Task[] = [
  { id: "1", title: "Write tests", description: "Cover all edge cases.", done: false },
  { id: "2", title: "Review PR", description: "Leave constructive feedback.", done: true },
  { id: "3", title: "Deploy", description: "Push to production.", done: false },
];

describe("countPending()", () => {
  it("counts only non-done tasks", () => {
    expect(countPending(TASKS)).toBe(2);
  });

  it("returns 0 when all done", () => {
    expect(countPending(TASKS.map((t) => ({ ...t, done: true })))).toBe(0);
  });

  it("returns full count when none done", () => {
    expect(countPending(TASKS.map((t) => ({ ...t, done: false })))).toBe(3);
  });
});

describe("filterByKeyword()", () => {
  it("matches by title", () => {
    expect(filterByKeyword(TASKS, "deploy").length).toBe(1);
  });

  it("matches by description", () => {
    expect(filterByKeyword(TASKS, "edge cases").length).toBe(1);
  });

  it("is case-insensitive", () => {
    expect(filterByKeyword(TASKS, "WRITE").length).toBe(1);
  });

  it("returns empty when no match", () => {
    expect(filterByKeyword(TASKS, "zzznomatch").length).toBe(0);
  });
});

describe("sortByTitle()", () => {
  it("sorts tasks alphabetically", () => {
    const sorted = sortByTitle(TASKS);
    expect(sorted[0].title).toBe("Deploy");
    expect(sorted[1].title).toBe("Review PR");
    expect(sorted[2].title).toBe("Write tests");
  });

  it("does not mutate the original array", () => {
    sortByTitle(TASKS);
    expect(TASKS[0].title).toBe("Write tests");
  });
});
