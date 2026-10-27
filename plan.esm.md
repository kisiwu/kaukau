# Plan: isolate each set of parameters in a child process (`isolate` option)

Status: **plan only, no code changed yet.**

## 1. The problem

With several sets of `parameters`, `Kaukau.run()` (src/kaukau.ts) runs Mocha once per set **in the same Node process**. To reload the test files it does `delete require.cache[require.resolve(file)]` and relies on Mocha's `loadFilesAsync({ esmDecorator })` (`?v=<timestamp>`).

Mocha 12 (`lib/nodejs/esm-utils.cjs`, `requireModule`, used when `process.features.require_module` is true: Node >= 20.19 / 22.12) does this for every file that is not `.mjs`:

1. `require(file)`. Only if it throws does it fall back to `import()`, which is the only place `esmDecorator` is applied.
2. A `.js` file with ESM syntax loads fine through `require(esm)` (no top-level await). Node detects the syntax, or `"type": "module"` declares it.
3. For the first set the file is evaluated and its `describe` registered.
4. For the next set, deleting `require.cache` is not enough. An ES module also lives in Node's ESM module map (keyed by URL), so the second `require()` returns the already-evaluated module and **nothing is executed**. The suites are silently missing.

CommonJS files are recompiled after the cache entry is deleted, and `.mjs` files go through `import()` with a new `?v=`. Only ESM-syntax `.js` files are affected (see notes.local.md, PROBLEM 1).

More generally, the in-process model leaks state between sets: module-level singletons, globals, `process.env` changes, open handles, timers, monkey-patched prototypes.

## 2. Goal

An opt-in `isolate` option that runs **each set of parameters in a fresh child process**. Module caches (CJS and ESM) and global state are then guaranteed clean. The in-process mode remains the default and keeps its current behaviour.

Non-goals: running sets in parallel (still sequential, `exitOnFail` semantics unchanged), reusing a pool of children (reuse would defeat the isolation), Mocha's `--parallel`.

## 3. Worker thread or child process?

| Criterion | `worker_threads` | `child_process.fork` |
|---|---|---|
| Fresh module caches (CJS + ESM) | yes | yes |
| Startup cost per set | lower | higher (a new Node process, tens of ms), negligible next to loading Mocha and running tests with network calls, and only paid once per set |
| Process-level state | shared: `process.chdir()` unsupported, `process.exit()` only ends the thread, native addons and signals shared, env is a copy | fully isolated: cwd, env, signals, native addons, `process.exit()` in a test |
| Crash / OOM / `process.exit` in a test | can take down or confuse the parent unless resource limits are tuned | contained, reported through the exit code / signal |
| stdout / TTY | `process.stdout` in a worker is piped asynchronously through the main thread, not a TTY, so color auto-detection and ordering with the parent's logger are worse | `stdio: 'inherit'`: direct writes, TTY and colors preserved, Mocha reporters work unchanged |
| `--require ts-node/register`, `--import` | must be re-applied per worker | natural through `execArgv` |
| Leaked handles / timers in tests | live as long as the worker | child is force-exited after the run (like Mocha's `--exit`) |
| Precedent | | Mocha's own parallel mode uses child processes (`workerType: "process"` in `lib/nodejs/buffered-worker-pool.cjs`) |

**Decision: `child_process.fork`, one child per set of parameters, with `serialization: 'advanced'`.**
Worker threads only win on startup time, but they share process-level state and have awkward stdio, which defeats the goal of this feature (a clean slate) and makes the output ordering fragile. The per-set spawn cost is small and constant.

## 4. Public API

- `isolate?: boolean | { require?: string[]; execArgv?: string[] }` in `KaukauOptions` (src/options.ts), and `isolate?: boolean` in `BaseOptions` so a set can override it through `kaukauOptions`. Default: `false`.
  - `true`: isolated children with the parent's `process.execArgv`.
  - object form: also `require` (modules preloaded in the child as `--require`, e.g. `ts-node/register`) and extra `execArgv` (e.g. `--max-old-space-size=4096`, `--import ...`).
- CLI: `--isolate` / `--no-isolate`. The CLI's existing `--require` list is forwarded to `isolate.require` when isolation is on (change in bin/start.js, maintainer side).
- `Kaukau#isolate(): { require: string[]; execArgv: string[] } | null` accessor, like the other getters.
- Semver: minor release (6.1.0), no breaking change.

## 5. Architecture

Split the per-set work of `runMocha` in src/kaukau.ts into two phases:

1. **`prepareSet()` (parent, always).** Everything that exists today up to `setting end`:
   - `c.next()`, the events `setting`, `setting tester`, `setting options`, `setting options end`, `setting mocha`,
   - option merging (`parseKaukauOptions`, `parseMochaOptions`),
   - **file resolution** (`listFilesRecSync`, existence checks) and the events `add file`, `setting mocha end`, `setting end`.
   It returns `{ count, params, tester, kaukauOptions, mochaOptions, files }`. File resolution only touches the file system, never loads modules, so it can stay in the parent and users keep their listeners and `add file` error logs unchanged. The `delete require.cache` call is only needed in-process.
2. **`executeSet(prepared)` (differs per mode).**
   - In-process: the current code (new `Mocha`, `ctx.kaukau`, `loadFilesAsync`, `run`).
   - Isolated: `runInChild(prepared)` (below).

The loop in `run()` (sequential, `exitOnFail`, `done`) is unchanged and picks the mode per set from the merged `kaukauOptions.isolate`.

### What runs in the child

New entry `src/isolation/child.ts` (emitted as `lib/isolation/child.js`, CommonJS), responsible for everything that loads or runs user code:

1. Creates a local emitter + `createStatsCollector` and a child `KaukauLogger` (so `this.ctx.kaukau.logger` in tests writes directly to the inherited stdout, with correct indentation).
2. Rebuilds the context: `params` from `new Parameters([paramsSet])`, `tester` from the snapshot (`new Tester()`, `setRequestDefaults(requestInit)`, `sessionId`).
3. `new Mocha(mochaOptions)`, `mocha.addFile` for each resolved file, `mocha.suite.ctx.kaukau = {...}`, `await loadFilesAsync(...)`, `mocha.run(cb)`.
4. Forwards every Mocha runner event (the `MOCHA_RUNNER_EVENTS` list) to the parent as serialized messages, plus the final result.
5. After the result is sent and flushed, exits (`process.exit(0)`), the same effect as Mocha's `--exit`.

### What stays in the parent

- The user-facing emitter, all `setting*` / `add file` events, and `done`.
- The parent `KaukauLogger` (`setting*` logs, `ALL DONE`). It keeps tracking indentation from forwarded events, but **does not print the `Test n° x` / `Test n° x done` lines** (new logger option `printRunEvents`, default `true`, `false` for the parent in isolated mode). The child prints them, so they are ordered with the reporter output of the same process.
- `createStatsCollector(emitter)`: it only needs event names and `suite.root`, so `ALL DONE - x/y passing` keeps working on forwarded events.

## 6. IPC protocol

`fork(childPath, [], { serialization: 'advanced', stdio: ['inherit', 'inherit', 'inherit', 'ipc'], execArgv: [...process.execArgv, ...require flags, ...isolate.execArgv], env: process.env, cwd: process.cwd() })`

| Direction | Message | Purpose |
|---|---|---|
| child -> parent | `{ type: 'ready' }` | the child's `message` listener is attached (avoids a race, nothing is sent before it) |
| parent -> child | `{ type: 'run', count, paramsSet, tester: { requestInit, sessionId }, mochaOptions, files, loggerOptions }` | everything the child needs |
| child -> parent | `{ type: 'event', name, args }` | a Mocha runner event, args serialized (section 7) |
| child -> parent | `{ type: 'result', failures }` | `mocha.run` callback |
| child -> parent | `{ type: 'error', error }` | load error (e.g. a missing file, a syntax error) |

Parent side, per set: `fork`, wait for `ready`, send `run`, re-emit events on the user emitter as `emitter.emit(name, ...deserialized, { count, logger })` (same shape as today), resolve with `failures` on `result`, then wait for the child `exit`.

### Lifecycle and failure handling

- **Result vs exit race:** the `result` message is authoritative. If the child exits first, wait one tick (`setImmediate`) before concluding it crashed. Validate on Windows.
- **Crash, `process.exit()` in a test, OOM, signal (no `result`):** log with `logger.error` including `code` / `signal`, count it as **1 failure** so `exitOnFail` and the exit code behave. (Today a loading error is an unhandled rejection that kills the run; decide whether to keep that for parity.)
- **`error` message:** log it and count 1 failure for the set.
- **Parent killed (e.g. `bin/watch.js` calls `cp.kill()` on the CLI process, which on Windows does not kill the grandchild):** the child listens to `process.on('disconnect', () => process.exit(1))`.
- **SIGINT / SIGTERM in the parent:** forward to the running child and let the loop stop.
- **Child never exits (leaked handles):** after `result` is flushed the child calls `process.exit()` itself. The parent adds a safety `kill()` after a grace period.

## 7. Serialization

Everything sent must be structured-cloneable. Mocha `Test` / `Suite` / `Hook` objects are not (circular parents, functions), and Mocha's serializer (`lib/nodejs/serializer.js`) is private and ESM-only, so kaukau gets its own small one in `src/isolation/serialize.ts`:

- **Runnable (test/hook):** `{ title, titlePath, fullTitle, type, state, pending, duration, speed, file, timedOut, parent: <suite ref>, err }`.
- **Suite:** `{ title, titlePath, fullTitle, root, pending, file, parent: <suite ref> }` (`root` is required by Mocha's stats collector).
- **Error:** `{ name, message, stack, code, actual, expected, showDiff, ...other enumerable own props }`.
- **Deserialization (parent):** lightweight objects with the same read-only fields plus `fullTitle()` and `titlePath()` methods, so existing `.on('fail', (test, err) => ...)` listeners (title, `test.err.message`, `test.file`) keep working. Document that listeners get **copies**, not live Mocha objects.

Parent -> child payload (`paramsSet`, `mochaOptions`, `tester.requestInit`) must also be cloneable. Validate with `structuredClone(payload)` before forking and throw a clear error (which key, "use plain data, e.g. `reporter` as a module path string, plain objects instead of `Headers`, no functions in parameters"). Otherwise `DataCloneError` surfaces too late and too cryptically.

## 8. Implementation steps (src/)

1. **Types and options**
   - `src/options.ts`: `isolate` on `KaukauOptions` and `BaseOptions`, plus an `IsolateOptions` type.
   - `src/parse-options.ts`: add `ISOLATE` to the table (kept as a boolean or an object, not blindly `!!`-coerced), default `false`; export it in `ParsedKaukauOptions`.
   - `src/kaukau.ts`: `isolate()` accessor.
2. **Logger**: `KaukauLoggerOptions.printRunEvents` (default `true`); when `false`, still track indent but skip the `Test n°` logs.
3. **Refactor `src/kaukau.ts`**: extract `prepareSet()` and `executeInProcess()` from `runMocha` with **no behaviour change**; verify with the existing scripts before adding anything else.
4. **`src/isolation/protocol.ts`**: message types shared by parent and child.
5. **`src/isolation/serialize.ts`**: serialize/deserialize for runnables, suites and errors.
6. **`src/isolation/child.ts`**: child entry (section 5).
7. **`src/isolation/run-in-child.ts`**: `runInChild(prepared, options): Promise<number>` (fork, handshake, event forwarding, lifecycle, signals, validation).
8. **`src/kaukau.ts`**: choose the mode per set; `__dirname`-based path to `isolation/child.js` (the project is CommonJS, so `__dirname` is available).
9. **`src/index.ts`**: export `IsolateOptions`.

Outside src/ (maintainer): `bin/start.js` (`--isolate` / `--no-isolate`, forward `--require`), package.json (`engines` unchanged, nothing new to install), README (document `isolate`, and point the "ES modules in .js" section at it), tests below.

## 9. Edge cases to decide or verify

- **`delete require.cache`** is skipped in isolated mode (a fresh process has no cache).
- **Reporters / `require` / `rootHooks` in `mochaOptions`** must be module-path strings to be cloneable; they resolve in the child relative to `cwd`.
- **Custom `--require` loaders** (ts-node) come through `isolate.require` -> `--require` in `execArgv`. ESM loaders through `isolate.execArgv` (`--import`).
- **Colors:** with `stdio: 'inherit'` the TTY is preserved. `mochaOptions.color` still wins when set.
- **Event `setting tester`:** user mutations of `tester` happen before the snapshot, so they are carried to the child. Later mutations (during the tests) stay in the child only.
- **Memory / time:** one extra Node process per set (the parent stays idle while it runs).
- **Mocha version coupling:** only `Mocha`, `Runner.constants` and `mocha/lib/stats-collector` (already used) are needed in the child, no new private Mocha API.

## 10. Verification

1. `npx tsc --noEmit` passes.
2. Regression, in-process mode: `npm run cmd`, `cmd:esm`, `cmd:esm1`, `test`, `test:esm`, `test:esm1` give the same results as before the refactor.
3. The PROBLEM 1 reproduction (`webph.2.spec.js` with `import { expect } from "chai"`) with `isolate: true`: 5 tests run (3 in set 2, including "Route 1 sub2 spec"), where in-process mode runs 4.
4. Output parity: reporter output, indentation, `Test n° x` lines, `ALL DONE` count, exit code with and without failures.
5. `exitOnFail` stops after the first failing set in isolated mode.
6. Crash cases: `process.exit(3)` in a test, an uncaught exception at load, a missing file, an infinite handle: each yields a logged error, a counted failure and no hang.
7. Cloning errors: a function inside `parameters` gives the explicit error before spawning.
8. Listeners: `fail` / `pass` / `done` events receive usable copies.
9. Watch mode (`npm run watch`): killing the CLI does not leave an orphan child.
10. Windows and Linux, on Node 20.19, 22.12 and 24.

## 11. Rollout

Ship `isolate` as opt-in (default `false`) in 6.1.0. If it proves stable, consider auto-enabling it (or warning) when a set after the first loads a file that registers no suite. That can be detected by listening to the root suite's `pre-require` / `post-require` events and comparing suite and test counts.