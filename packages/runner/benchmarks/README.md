# Isolation cost benchmark

This benchmark compares worker threads and child processes when they are reused or recreated
for every isolation unit. The Roadtest cases initialize Happy DOM and import the Roadtest runtime;
they do not import an application's dependency graph, so their startup measurements are a lower
bound for a real test file.

```sh
pnpm --filter @roadtest/runner benchmark:isolation -- --iterations=20 --concurrency=4
```

A fresh realm gets a new global object and ESM module cache. Persistent workers measure the lower
message-passing cost, but deliberately retain a probe between tasks to demonstrate that they do
not isolate test files by themselves.

Isolation should normally be applied per test file rather than per test case. The benchmark prints
the projected per-test startup cost for several test-file sizes.
