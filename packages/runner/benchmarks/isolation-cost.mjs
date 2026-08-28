import { fork } from "node:child_process";
import { once } from "node:events";
import { availableParallelism } from "node:os";
import { performance } from "node:perf_hooks";
import { Worker } from "node:worker_threads";

const iterationsArg = process.argv.find((arg) => arg.startsWith("--iterations="));
const concurrencyArg = process.argv.find((arg) => arg.startsWith("--concurrency="));
const iterations = iterationsArg ? Number.parseInt(iterationsArg.slice(13), 10) : 20;
const concurrency = concurrencyArg ? Number.parseInt(concurrencyArg.slice(14), 10) : 4;
if (!Number.isInteger(iterations) || iterations < 1) {
  throw new Error("--iterations must be a positive integer");
}
if (!Number.isInteger(concurrency) || concurrency < 1) {
  throw new Error("--concurrency must be a positive integer");
}

const realmUrl = new URL("./isolation-realm.mjs", import.meta.url);

function round(value) {
  return Math.round(value * 100) / 100;
}

async function waitForMessage(emitter, expectedType) {
  while (true) {
    const [message] = await once(emitter, "message");
    if (message?.type === expectedType) return message;
  }
}

async function startThread(runtime) {
  const worker = new Worker(realmUrl, { workerData: { runtime } });
  const ready = await waitForMessage(worker, "ready");
  return { emitter: worker, ready, send: (message) => worker.postMessage(message) };
}

async function startProcess(runtime) {
  const child = fork(realmUrl, [], {
    env: { ...process.env, ROADTEST_BENCH_RUNTIME: runtime ? "1" : "0" },
    stdio: ["ignore", "ignore", "inherit", "ipc"],
  });
  const ready = await waitForMessage(child, "ready");
  return { emitter: child, ready, send: (message) => child.send(message) };
}

async function runTask(realm, id) {
  const result = waitForMessage(realm.emitter, "result");
  realm.send({ type: "run", id });
  return result;
}

async function closeRealm(realm) {
  const exited = once(realm.emitter, "exit");
  realm.send({ type: "close" });
  await exited;
}

async function benchmarkSameProcess(runtime) {
  const startedAt = performance.now();
  let window;
  if (runtime) {
    const { Window } = await import("happy-dom");
    window = new Window({ url: "http://localhost/", width: 1024, height: 768 });
    await import("roadtest");
  }
  const readyAt = performance.now();
  let probe = 0;
  for (let index = 0; index < iterations; index++) probe++;
  const completedAt = performance.now();
  window?.close();
  return {
    name: "same process",
    runtime,
    isolation: "shared realm",
    iterations,
    concurrency: 1,
    startupMs: round(readyAt - startedAt),
    runtimeInitMs: round(readyAt - startedAt),
    totalMs: round(completedAt - startedAt),
    perTestMs: round((completedAt - readyAt) / iterations),
    heapMb: round(process.memoryUsage().heapUsed / 1024 / 1024),
    concurrentHeapMb: round(process.memoryUsage().heapUsed / 1024 / 1024),
    leakedTasks: Math.max(0, probe - 1),
  };
}

async function benchmarkPersistent(name, start, runtime) {
  const startedAt = performance.now();
  const realm = await start(runtime);
  const readyAt = performance.now();
  let leakedTasks = 0;
  for (let index = 0; index < iterations; index++) {
    const result = await runTask(realm, index);
    if (result.previous !== 0) leakedTasks++;
  }
  const completedAt = performance.now();
  await closeRealm(realm);
  return {
    name,
    runtime,
    isolation: "shared realm",
    iterations,
    concurrency: 1,
    startupMs: round(readyAt - startedAt),
    runtimeInitMs: round(realm.ready.initMs),
    totalMs: round(completedAt - startedAt),
    perTestMs: round((completedAt - readyAt) / iterations),
    heapMb: round(realm.ready.heapUsed / 1024 / 1024),
    concurrentHeapMb: round(realm.ready.heapUsed / 1024 / 1024),
    leakedTasks,
  };
}

async function benchmarkFresh(name, start, runtime) {
  const startedAt = performance.now();
  let startupMs = 0;
  let runtimeInitMs = 0;
  let heapMb = 0;
  let leakedTasks = 0;
  for (let index = 0; index < iterations; index++) {
    const realmStartedAt = performance.now();
    const realm = await start(runtime);
    startupMs += performance.now() - realmStartedAt;
    runtimeInitMs += realm.ready.initMs;
    heapMb += realm.ready.heapUsed / 1024 / 1024;
    const result = await runTask(realm, index);
    if (result.previous !== 0) leakedTasks++;
    await closeRealm(realm);
  }
  const totalMs = performance.now() - startedAt;
  return {
    name,
    runtime,
    isolation: "fresh realm",
    iterations,
    concurrency: 1,
    startupMs: round(startupMs / iterations),
    runtimeInitMs: round(runtimeInitMs / iterations),
    totalMs: round(totalMs),
    perTestMs: round(totalMs / iterations),
    heapMb: round(heapMb / iterations),
    concurrentHeapMb: round(heapMb / iterations),
    leakedTasks,
  };
}

async function benchmarkFreshConcurrent(name, start, runtime) {
  const startedAt = performance.now();
  let nextIndex = 0;
  let startupMs = 0;
  let runtimeInitMs = 0;
  let heapMb = 0;
  let leakedTasks = 0;

  async function runLane() {
    while (nextIndex < iterations) {
      const index = nextIndex++;
      const realmStartedAt = performance.now();
      const realm = await start(runtime);
      startupMs += performance.now() - realmStartedAt;
      runtimeInitMs += realm.ready.initMs;
      heapMb += realm.ready.heapUsed / 1024 / 1024;
      const result = await runTask(realm, index);
      if (result.previous !== 0) leakedTasks++;
      await closeRealm(realm);
    }
  }

  const laneCount = Math.min(concurrency, iterations);
  await Promise.all(Array.from({ length: laneCount }, () => runLane()));
  const totalMs = performance.now() - startedAt;
  const heapPerRealmMb = heapMb / iterations;
  return {
    name,
    runtime,
    isolation: "fresh realm",
    iterations,
    concurrency: laneCount,
    startupMs: round(startupMs / iterations),
    runtimeInitMs: round(runtimeInitMs / iterations),
    totalMs: round(totalMs),
    perTestMs: round(totalMs / iterations),
    heapMb: round(heapPerRealmMb),
    concurrentHeapMb: round(heapPerRealmMb * laneCount),
    leakedTasks,
  };
}

const cases = [];
console.log(
  "Synthetic lower bound: Roadtest cases initialize Happy DOM and the runtime, but not app modules.\n",
);
for (const runtime of [false, true]) {
  cases.push(await benchmarkSameProcess(runtime));
  cases.push(await benchmarkPersistent("persistent thread", startThread, runtime));
  cases.push(await benchmarkFresh("fresh thread per test", startThread, runtime));
  cases.push(await benchmarkFreshConcurrent("fresh threads concurrent", startThread, runtime));
  cases.push(await benchmarkPersistent("persistent process", startProcess, runtime));
  cases.push(await benchmarkFresh("fresh process per test", startProcess, runtime));
  cases.push(await benchmarkFreshConcurrent("fresh processes concurrent", startProcess, runtime));
}

const isolatedThread = cases.find(
  (result) => result.runtime && result.name === "fresh thread per test" && result.concurrency === 1,
);
const isolatedProcess = cases.find(
  (result) =>
    result.runtime && result.name === "fresh process per test" && result.concurrency === 1,
);
const projections = [1, 10, 50, 100].map((testsPerFile) => ({
  testsPerFile,
  threadIsolationMsPerTest: round(isolatedThread.perTestMs / testsPerFile),
  processIsolationMsPerTest: round(isolatedProcess.perTestMs / testsPerFile),
}));

console.table(
  cases.map((result) => ({
    case: result.name,
    runtime: result.runtime ? "Roadtest" : "bare",
    isolation: result.isolation,
    concurrency: result.concurrency,
    startupMs: result.startupMs,
    perTestMs: result.perTestMs,
    heapPerRealmMb: result.heapMb,
    concurrentHeapMb: result.concurrentHeapMb,
    leakedTasks: result.leakedTasks,
  })),
);
console.log("\nProjected startup cost when isolation is applied per test file:");
console.table(projections);
process.stdout.write(
  `${JSON.stringify({ node: process.version, availableParallelism: availableParallelism(), iterations, concurrency, cases, projections }, null, 2)}\n`,
);
