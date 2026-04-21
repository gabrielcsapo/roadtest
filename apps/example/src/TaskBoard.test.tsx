import { describe, it, expect, render, fireEvent } from "roadtest";
import { TaskBoard } from "./TaskBoard";
import type { Task } from "./TaskBoard";

const TASKS: Task[] = [
  { id: "1", title: "Write tests", description: "Cover all edge cases.", done: false },
  { id: "2", title: "Review PR", description: "Leave constructive feedback.", done: false },
  { id: "3", title: "Deploy", description: "Push to production.", done: true },
];

describe("TaskBoard", () => {
  it("renders pending tasks", async () => {
    const { getByText } = await render(<TaskBoard initialTasks={TASKS} />);
    expect(getByText("Write tests")).toBeTruthy();
    expect(getByText("Review PR")).toBeTruthy();
  });

  it("shows pending count badge", async () => {
    const { getByTestId } = await render(<TaskBoard initialTasks={TASKS} />);
    expect(getByTestId("pending-count").textContent).toBe("2");
  });

  it("shows completed task count in done section", async () => {
    const { getByTestId } = await render(<TaskBoard initialTasks={TASKS} />);
    expect(getByTestId("done-section")).toBeTruthy();
  });

  it("shows empty state when no pending tasks", async () => {
    const allDone = TASKS.map((t) => ({ ...t, done: true }));
    const { getByTestId } = await render(<TaskBoard initialTasks={allDone} />);
    expect(getByTestId("empty-pending")).toBeTruthy();
  });

  it("completing a task moves it to done section", async () => {
    const pending = TASKS.filter((t) => !t.done);
    const { getAllByRole, getByTestId } = await render(<TaskBoard initialTasks={pending} />);
    const [firstComplete] = getAllByRole("button", { name: "Complete" });
    await fireEvent.click(firstComplete);
    expect(getByTestId("done-section")).toBeTruthy();
  });

  it("clearing done tasks removes the done section", async () => {
    const { getByRole, queryByTestId } = await render(<TaskBoard initialTasks={TASKS} />);
    await fireEvent.click(getByRole("button", { name: "Clear" }));
    expect(queryByTestId("done-section")).toBeFalsy();
  });

  it("empty board shows no pending tasks message", async () => {
    const { getByTestId } = await render(<TaskBoard initialTasks={[]} />);
    expect(getByTestId("empty-pending").textContent).toBe("All caught up!");
  });
});
