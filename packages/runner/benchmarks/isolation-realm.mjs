import { parentPort, workerData } from "node:worker_threads";
import { performance } from "node:perf_hooks";

const isThread = parentPort !== null;
const runtime = isThread
  ? workerData?.runtime === true
  : process.env.ROADTEST_BENCH_RUNTIME === "1";
const initializedAt = performance.now();

let window;
if (runtime) {
  const { Window } = await import("happy-dom");
  window = new Window({ url: "http://localhost/", width: 1024, height: 768 });
  await import("roadtest");
}

const send = isThread
  ? (message) => parentPort.postMessage(message)
  : (message) => process.send(message);
const receive = isThread
  ? (listener) => parentPort.on("message", listener)
  : (listener) => process.on("message", listener);

send({
  type: "ready",
  initMs: performance.now() - initializedAt,
  heapUsed: process.memoryUsage().heapUsed,
});

receive((message) => {
  if (message.type === "run") {
    const previous = globalThis.__roadtestIsolationProbe ?? 0;
    globalThis.__roadtestIsolationProbe = previous + 1;
    send({ type: "result", id: message.id, previous });
    return;
  }
  if (message.type === "close") {
    window?.close();
    process.exit(0);
  }
});
