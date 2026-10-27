Read , lines 40 to 55
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\plan.esm.md",
  "view_range": [
    40,
    55
  ]
}

Read 
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\options.ts"
}

Read 
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\parse-options.ts"
}

Read 
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\index.ts"
}

Edit 

Edit 

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\parse-options.ts"}

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\parse-options.ts"}

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\parse-options.ts"}

Edit 

Read , lines 1 to 125
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\kaukau.ts",
  "view_range": [
    1,
    125
  ]
}

Edit 

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\kaukau.ts"}

Ran terminal command: npx tsc --noEmit; "tsc exit $LASTEXITCODE"; npx tsc --outDir .tmp-build; $js=@'
const { Kaukau } = require('./.tmp-build/index.js');
const { defineConfig } = require('./.tmp-build/config.js');
for (const isolate of [undefined, false, true, { require: 'ts-node/register,x', execArgv: ['--max-old-space-size=64'] }, 'yes', {}]) {
  const k = new Kaukau({ isolate });
  console.log(JSON.stringify(isolate), '=>', JSON.stringify(k.isolate()));
}
console.log(JSON.stringify(defineConfig({ isolate: true, parameters: [{ kaukauOptions: { isolate: { require: ['a'] } } }] })));
'@; $js | node -; Remove-Item -Recurse -Force .tmp-build

The `isolate` option is now part of the public API. It is only parsed and exposed, so setting it changes nothing yet. `npx tsc --noEmit` passes. A throwaway build gave the expected results, and I deleted that build afterwards. The only checks were `isolate()` values for several inputs and one `defineConfig` call.

**Files changed (all in `src/`)**
- **`options.ts`:**
  - New `IsolateOptions` type with `require` (string or string array) and `execArgv`.
  - New `ResolvedIsolateOptions` type, the normalized form (both arrays).
  - `isolate?: boolean | IsolateOptions` added to `BaseOptions`, with JSDoc.
- **`parse-options.ts`:**
  - New `isolate` entry in the option table.
  - A dedicated parser keeps the object form and normalizes it.
  - Any other value becomes a boolean.
  - New exported `resolveIsolate()` returns the child-process settings, or `null` when isolation is off.
- **`kaukau.ts`:** new `isolate(): ResolvedIsolateOptions | null` accessor.
- **`index.ts`:** exports `IsolateOptions` and `ResolvedIsolateOptions`.

**Results from the smoke test**
| Input | `isolate()` |
|---|---|
| `undefined` or `false` | `null` |
| `true` | `{ require: [], execArgv: [] }` |
| `{ require: 'ts-node/register,x', execArgv: [...] }` | `require` split into `['ts-node/register','x']`, `execArgv` kept |
| `{ isolate: true }` through `defineConfig` with a per-set override `kaukauOptions: { isolate: { require: ['a'] } }` | the override comes out normalized |

**Where I deviated from the plan**
- **Option type:** `isolate` is `boolean | IsolateOptions` on `BaseOptions`, not `boolean` as the plan said. `KaukauOptions` extends `BaseOptions`, so a narrower type on `BaseOptions` would be a type error. A set can now also override with the object form.
- **`require` format:** a string is split on commas, which matches the CLI's `--require`. `execArgv` strings are never split, because arguments can contain commas.
- **No default added:** I left `isolate` out of the defaults, so `defineConfig` doesn't add an `isolate` key unless you set one. An unset value behaves as off.

**Not done in this step**
- **CLI:** `--isolate` and `--no-isolate` in `bin/start.js`, and forwarding `--require` into `isolate.require`. That's outside `src/`, so it's yours.
- **Docs:** updating `plan.esm.md` for the type change above, and documenting the option in the README.

The next steps are the logger's `printRunEvents` option and the `prepareSet`/`executeInProcess` refactor of `run()`.

---

Read 
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\plan.esm.impl.md"
}

Read , lines 50 to 158
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\plan.esm.md",
  "view_range": [
    50,
    158
  ]
}

Read , lines 126 to 340
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\kaukau.ts",
  "view_range": [
    126,
    340
  ]
}

Create 

"Edit File" failed
Completed with input: {
  "new_str": "    // sets up the next set of parameters and resolves the files to load (nothing is loaded here)\n    const prepareSet = (): PreparedSet => {\n      // set next parameters for the next test\n      const count = c.next() ?? 0;\n\n      emitter.emit('setting', { count, logger: log } satisfies SettingEvent);\n\n      const params = c.get;\n\n      const tester = new Tester();\n\n      emitter.emit('setting tester', {\n        logger: log,\n        count,\n        params,\n        tester,\n      } satisfies SettingTesterEvent);\n\n      emitter.emit('setting options', {\n        logger: log,\n        count,\n        params,\n      } satisfies SettingOptionsEvent);\n\n      const kaukauOptions = parseKaukauOptions(\n        c.get('kaukauOptions') as object | undefined,\n        this.#parsedOptions.kaukau\n      );\n      const mochaOptions = parseMochaOptions(\n        c.get('mochaOptions') as MochaOptions | undefined,\n        this.#parsedOptions.mocha\n      );\n\n      const kaukauOptionsParams = new Parameters(kaukauOptions);\n      kaukauOptionsParams.next();\n      const mochaOptionsParams = new Parameters(mochaOptions);\n      mochaOptionsParams.next();\n\n      emitter.emit('setting options end', {\n        logger: log,\n        count,\n        kaukauOptions: kaukauOptionsParams.get,\n        mochaOptions: mochaOptionsParams.get,\n        params,\n      } satisfies SettingOptionsEndEvent);\n\n      emitter.emit('setting mocha', {\n        logger: log,\n        count,\n        params,\n      } satisfies SettingMochaEvent);\n\n      const files: string[] = [];\n\n      const addFile = (filename: string, errorMessage?: string): void => {\n        emitter.emit('add file', { filename, errorMessage, logger: log } satisfies AddFileEvent);\n        files.push(filename);\n      };\n\n      // only import the mentioned files\n      (kaukauOptions.files ?? []).forEach((file) => {\n        // avoid unstoppable loop\n        if (!file) {\n          return;\n        }\n\n        const filename = path.resolve(file);\n\n        // if the path does not exist\n        if (!fs.existsSync(filename)) {\n          const errorMessage = `no such file or directory - stat \"${filename}\"`;\n          addFile(filename, errorMessage);\n        }\n        // else if the path is a directory\n        else if (fs.statSync(filename).isDirectory()) {\n          // Searching ext files in directory\n          const exts = kaukauOptions.ext ?? [];\n          const subfiles = listFilesRecSync(filename).filter((subfile) =>\n            exts.some((ext) => subfile.endsWith(ext))\n          );\n\n          subfiles.forEach((subfile) => {\n            addFile(path.resolve(path.join(filename, subfile)));\n          });\n        }\n        // else if the path is a file\n        else {\n          addFile(filename);\n        }\n      });\n\n      emitter.emit('setting mocha end', {\n        logger: log,\n        count,\n        files: files.length,\n        params,\n      } satisfies SettingMochaEndEvent);\n      emitter.emit('setting end', {\n        logger: log,\n        count,\n        params,\n      } satisfies SettingEndEvent);\n\n      return {\n        count,\n        params,\n        tester,\n        kaukauOptions,\n        mochaOptions,\n        files,\n        isolate: resolveIsolate(kaukauOptions.isolate),\n      };\n    };\n\n    // runs the set with Mocha in the current process, resolves with the number of failures\n    const executeInProcess = ({ count, params, tester, mochaOptions, files }: PreparedSet): Promise<number> =>\n      new Promise<number>((resolve) => {\n        // Instantiate a Mocha instance.\n        const mocha = new Mocha(mochaOptions);\n\n        files.forEach((filename) => {\n          // delete cached file if it was previously required\n          delete require.cache[require.resolve(filename)];\n\n          // add file to Mocha instance\n          mocha.addFile(filename);\n        });\n\n        // add context to parent suite\n        mocha.suite.ctx.kaukau = {\n          logger: log,\n          log,\n          parameters: params,\n          params,\n          tester,\n        };\n\n        // handles ESM modules\n        const timestamp = Date.now();\n        (mocha as MochaWithEsmDecorator)\n          .loadFilesAsync({\n            esmDecorator: (file) => `${file}?v=${timestamp}`,\n          })\n          .then(\n            () => {\n              const mochaRunner = mocha.run((failures) => {\n                resolve(failures);\n              });\n              // listen to Mocha.Runner's events\n              MOCHA_RUNNER_EVENTS.forEach((evnt) => {\n                if (evnt) {\n                  mochaRunner.on(evnt, (...args: unknown[]) => {\n                    emitter.emit(evnt, ...args, { count, logger: log });\n                  });\n                }\n              });\n            },\n            (err) => {\n              throw err;\n            }\n          );\n      });\n\n    // run Mocha as many time as there are parameters (if parameters is array),\n    // started on a later tick so listeners can be attached to the returned emitter\n    setImmediate(async () => {\n      for (let i = 0; i < c.size(); i++) {\n        const failures = await executeInProcess(prepareSet());\n\n        totalFailures += failures || 0;\n\n        // stop at the first set of tests that has a fail\n        if (this.exitOnFail() && failures) {\n          break;\n        }\n      }\n      emitter.emit('done', totalFailures);\n    });\n\n    return emitter as unknown as Runner;\n  }\n}\n\nexport type { Runner };\n",
  "old_str": "PLACEHOLDER",
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\kaukau.ts"
}
Tool execution failed: No match found

Edit 

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\kaukau.ts"}

Read , lines 20 to 125
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\ctx\\logger.ts",
  "view_range": [
    20,
    125
  ]
}

Edit 

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\ctx\\logger.ts"}

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\ctx\\logger.ts"}

Ran terminal command: npx tsc --noEmit; "tsc exit $LASTEXITCODE"

"Create File" failed
Completed with input: {
  "file_text": "describe('tmp fail', function () {\n  const { params } = this.ctx.kaukau;\n  it('fails', () => {\n    throw new Error('boom ' + params('id'));\n  });\n});\n",
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\.tmp-fail\\a.js"
}
Tool execution failed: Parent directory does not exist

Ran terminal command: npx tsc --outDir .tmp-build; $js=@'
const { Kaukau } = require('./.tmp-build/index.js');
const events = [];
const run = (cfg) => new Promise(res => {
  const k = new Kaukau(cfg);
  k.run().on('setting', e => events.push('setting' + e.count)).on('add file', e => events.push('add ' + require('path').basename(e.filename)))
    .on('setting mocha end', e => events.push('files=' + e.files)).on('done', t => { events.push('done ' + t); res(t); });
});
(async () => {
  await run({ files: 'test/tests', ext: '.test.mjs', enableLogs: false, options: { reporter: 'dot' }, parameters: [{ id: 1 }, { id: 2 }] });
  console.log('\nA', events.join(' | ')); events.length = 0;
  await run({ files: '.tmp-fail', enableLogs: false, exitOnFail: true, options: { reporter: 'dot' }, parameters: [{ id: 1 }, { id: 2 }] });
  console.log('\nB exitOnFail', events.join(' | ')); events.length = 0;
  await run({ files: '.tmp-fail', enableLogs: false, options: { reporter: 'dot' }, parameters: [{ id: 1 }, { id: 2 }] });
  console.log('\nC no exitOnFail', events.join(' | '));
})();
'@; $js | node - 2>&1 | Select-String -Pattern "^(A|B|C)|Error:" ; Remove-Item -Recurse -Force .tmp-build, .tmp-fail
Tool execution failed with exit code 1

Ran terminal command: New-Item -ItemType Directory .tmp-fail | Out-Null; if (Test-Path .tmp-build) { "build exists" }

Create 

Ran terminal command: npx tsc --outDir .tmp-build; $js=@'
const { Kaukau } = require('./.tmp-build/index.js');
const events = [];
const run = (cfg) => new Promise(res => {
  const k = new Kaukau(cfg);
  k.run().on('setting', e => events.push('setting' + e.count)).on('setting mocha end', e => events.push('files=' + e.files)).on('done', t => { events.push('done ' + t); res(t); });
});
(async () => {
  await run({ files: '.tmp-fail', enableLogs: false, exitOnFail: true, options: { reporter: 'dot' }, parameters: [{ id: 1 }, { id: 2 }] });
  console.log('\nB exitOnFail', events.join(' | ')); events.length = 0;
  await run({ files: '.tmp-fail', enableLogs: false, options: { reporter: 'dot' }, parameters: [{ id: 1 }, { id: 2 }] });
  console.log('\nC no exitOnFail', events.join(' | '));
})();
'@; $js | node - 2>&1 | Select-String -Pattern "^(B|C)"; Remove-Item -Recurse -Force .tmp-build, .tmp-fail; git status --short

I've done the parent-side split from section 5 and added a logger option for the child run. The child process itself and the messaging between parent and child aren't built yet. `npx tsc --noEmit` passes.

**What changed in `src/`**
- **`prepared-set.ts` (new):** the `PreparedSet` type, which holds everything known about a set before any test file is loaded:
  - `count`
  - `params`
  - `tester`
  - the merged `kaukauOptions` and `mochaOptions`
  - the resolved absolute `files`
  - the per-set `isolate` settings (or `null`)
- **`kaukau.ts`:** `runMocha` is split into two closures inside `run()`:
  - `prepareSet()`:
    - advances to the next set and emits `setting`, `setting tester`, `setting options`, `setting options end` and `setting mocha`
    - merges the options and resolves the files from `files` and `ext`
    - emits `add file`, `setting mocha end` and `setting end`
    - loads nothing
  - `executeInProcess(prepared)`: clears the `require` cache, builds the Mocha instance, adds the files, sets `ctx.kaukau`, loads and runs. This is the previous code, moved.
- **The loop** now calls `executeInProcess(prepareSet())`. The sequential order, `exitOnFail` and `done` are unchanged.
- **`logger.ts`:** new `printRunEvents` option (default `true`) and a `setPrintRunEvents(bool)` method. When off, the `Test n° x` and `Test n° x done` lines are skipped, but the indentation still tracks events. I added the setter because the choice is per set, while the logger is created once per run.

**Checks**
I built into a temporary folder, deleted it afterwards, and ran three scenarios:
- **ESM test files, two sets:** events came in order (`setting1`, `add file`, …, `setting2`, …, `done 0`), and each set loaded 2 files.
- **Failing test with `exitOnFail`:** one set ran, and `done` reported 1 failure.
- **Same without `exitOnFail`:** both sets ran, and `done` reported 2 failures.

**Behaviour differences to know about**
- **File events and missing files:** `add file` events for all files now come before `setting mocha end`. Previously `add file` events were interleaved with loading, so a missing file crashed at the first one. Now the error message is still logged by `add file`, but the crash (`require.resolve` throwing) happens after `setting end`. Only the missing-file case is affected.
- **`isolate` is still not acted on.** `prepared.isolate` is computed, but every set still runs in-process. The dispatch to a child process needs the next pieces: the message types, serialization, `child.ts` and `run-in-child.ts` (sections 6 and 7, steps 4 to 8).

I also left alone `plan.esm.impl.md`, which is a transcript of the previous step.

---

Read , lines 1 to 100
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\kaukau.ts",
  "view_range": [
    1,
    100
  ]
}

Read , lines 1 to 35
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\events.ts",
  "view_range": [
    1,
    35
  ]
}

Create 

"Create File" failed
Completed with input: {
  "file_text": "import type { MochaOptions } from 'mocha';\nimport type { KaukauLoggerOptions } from '../ctx/logger';\nimport type { SerializedError } from './serialize';\n\n/**\n * Messages exchanged between the main process and the child process running a set of parameters.\n * The channel is opened by `child_process.fork` with `serialization: 'advanced'`, so every payload must be structured-cloneable.\n */\n\n/**\n * Parent -> child: everything the child needs to run the set. Sent once, after `ready`.\n */\nexport interface RunMessage {\n  type: 'run';\n  /** Number of the set (starts at 1). */\n  count: number;\n  /** The current set of parameters (as returned by `params()`). */\n  paramsSet: unknown;\n  /** Snapshot of the tester. */\n  tester: { requestInit: RequestInit; sessionId: string };\n  mochaOptions: MochaOptions;\n  /** Absolute paths of the test files. */\n  files: string[];\n  loggerOptions: KaukauLoggerOptions;\n}\n\n/**\n * Child -> parent: the child is listening, it can receive `run`.\n */\nexport interface ReadyMessage {\n  type: 'ready';\n}\n\n/**\n * Child -> parent: a Mocha runner event (without the kaukau payload, the parent adds its own).\n */\nexport interface EventMessage {\n  type: 'event';\n  name: string;\n  /** Serialized with `serializeValue` */\n  args: unknown[];\n}\n\n/**\n * Child -> parent: the run is over. Authoritative over the exit code of the child.\n */\nexport interface ResultMessage {\n  type: 'result';\n  failures: number;\n}\n\n/**\n * Child -> parent: the set could not be run (e.g. a test file cannot be loaded).\n */\nexport interface ErrorMessage {\n  type: 'error';\n  error: SerializedError;\n}\n\nexport type ParentToChildMessage = RunMessage;\n\nexport type ChildToParentMessage = ReadyMessage | EventMessage | ResultMessage | ErrorMessage;\n",
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\isolation\\protocol.ts"
}
Tool execution failed: Parent directory does not exist

Ran terminal command: New-Item -ItemType Directory src\isolation | Out-Null; "ok"

Create 

Create 

Create 

Create 

Edit 

Edit 

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\kaukau.ts"}

Ran terminal command: npx tsc --noEmit; "tsc exit $LASTEXITCODE"

Ran terminal command: New-Item -ItemType Directory .tmp-iso\ok, .tmp-iso\fail, .tmp-iso\exit | Out-Null; "ok"

Create 

Create 

Create 

Create 

Create 

Ran terminal command: (Get-Content .tmp-iso\harness.js -Raw) | Out-Null; npx tsc --outDir .tmp-build; "build $LASTEXITCODE"; Test-Path .tmp-build\isolation\child.js

Edit 

Ran terminal command: node .tmp-iso\harness.js 2>&1 | Out-String -Width 200
Tool execution failed with exit code 1

Ran terminal command: $js=@'
const { Kaukau } = require('./.tmp-build/index.js');
new Kaukau({ files: 'test/tests', ext: '.test.mjs', enableLogs: false, options: { reporter: 'dot' }, parameters: [{ id: 1 }, { id: 2 }] })
  .run().on('setting', e => console.log('setting', e.count)).on('done', t => console.log('done', t));
'@; $js | node - 2>&1 | Out-String; Remove-Item -Recurse -Force .tmp-build, .tmp-iso; Get-Process node -ErrorAction SilentlyContinue | Measure-Object | % Count; git status --short

The IPC layer from section 6 is in place and works when called directly. It is not wired into `Kaukau.run()` yet, so setting `isolate` still does nothing. `npx tsc --noEmit` passes, and the in-process run still gives the same results as before the refactor.

## Files in `src/`
- **`isolation/protocol.ts`:** the message types: `ready`, `run`, `event`, `result` and `error`.
- **`isolation/child.ts`:** the entry point of the child process, run with `fork`. It rebuilds `params` and `tester` from the `run` message, runs Mocha, forwards every runner event and the result to the parent, then flushes stdout/stderr and exits. It exits on its own if the parent disconnects.
- **`isolation/run-in-child.ts`:** `runInChild()` on the parent side:
  - It forks with `serialization: 'advanced'` and inherited stdio.
  - It waits for `ready`, sends `run`, and re-emits each event with `{ count, logger }` appended, as the in-process mode does.
  - It treats the `result` message as authoritative.
  - It switches off the parent logger's `Test n°` lines during the run.
- **`isolation/serialize.ts`:** this is section 7, which I pulled in because events can't cross the process boundary without it:
  - Mocha tests, hooks and suites become read-only copies with `fullTitle()` and `titlePath()`.
  - Errors keep their own properties (`code`, `actual`, `expected` and so on).
  - A check before forking gives a clear error when the parameters, Mocha options or request defaults can't be cloned.
- **`execute.ts`:** the in-process Mocha execution moved out of `kaukau.ts` so the child reuses the same code. `kaukau.ts` now calls it. One change: a failure while loading the test files now rejects the promise instead of throwing from a `.then` handler. It still surfaces as an unhandled rejection, and it lets the child report it as an `error` message.
- **`ctx/logger.ts`:** added `isPrintingRunEvents()`, so `runInChild` can restore the previous value.

## What I tested
I used a throwaway harness calling `runInChild` directly, and deleted it afterwards.

| Scenario | Result |
|---|---|
| A: ESM-syntax `.js` file plus a CommonJS file, 2 sets | All 4 tests ran, including the ESM file in set 2. This is the case that was skipped in `notes.local.md` PROBLEM 1. Parent stats gave 4/4. |
| B: failing test | Returned 1 failure. The parent's `fail` listener got the test copy and the error with `code`. |
| C: `process.exit(3)` in a test | Logged "ended without a result (exit code 3)" and counted 1 failure. |
| D: missing file | The child sent an `error` message, which was logged. Counted 1 failure. |
| E: function in the parameters | The clear error was thrown before forking. |

No leftover `node` processes remained.

## Deviation from the plan
I did not add SIGINT/SIGTERM forwarding. A listener on the parent would stop Ctrl+C from ending it, and the cases are already covered. Ctrl+C reaches the child directly in the same process group. If the parent is killed, the channel closes and the child exits by itself.

## Still to do
- **Next step:** choosing in-process or child per set inside `Kaukau.run()`, using `prepared.isolate`, and passing `enableLogs` and `logLevel`.
- **Your side:** `bin/start.js` for `--isolate`/`--no-isolate`, and the README and tests.

---

Edit 

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\isolation\\serialize.ts"}

Ran terminal command: npx tsc --noEmit; "tsc exit $LASTEXITCODE"; New-Item -ItemType Directory .tmp-ser | Out-Null

Edit 

Create 

Create 

Ran terminal command: npx tsc --noEmit; "tsc exit $LASTEXITCODE"; if ($LASTEXITCODE -eq 0) { npx tsc --outDir .tmp-build; node .tmp-ser\harness.js 2>&1 | Out-String -Width 250 }

Search for `^(failures|pass|fail|pending|retry|hook|hook end|end|badPayload|"isolate)|^   `

Read tool output
Completed with input: {
  "path": "C:\\Users\\Stephane\\AppData\\Local\\Temp\\1793138229953-copilot-tool-output-33064-61f602c3-c9fc-4ba5-9e17-7c5a58eb9fe2.txt",
  "view_range": [
    146,
    172
  ]
}

Search for `^(failures|fail =>|retry|hook|hook end|badPayload)|=>$`

Ran terminal command: Remove-Item -Recurse -Force .tmp-build, .tmp-ser; git status --short

Most of section 7 was already in `serialize.ts`, which I added last step because events can't cross the process boundary without it. This step I checked it against the real Mocha event types, hardened it, and made the clone check name the exact offending key. `npx tsc --noEmit` passes.

**Changes**
- **Errors:**
  - `cause` and `errors` (from `AggregateError`) are now carried, because they aren't enumerable and were being dropped.
  - If a thrown value isn't a proper error (no `name` or `message`), it gets `name: 'Error'` and an empty message, instead of the string `"undefined"`.
- **Clone check before forking:** the error now names the property, for example `"isolate": "parameters.credentials.check" cannot be sent to the child process…` or `parameters.list[1]`. Before, it only gave the top-level label such as `parameters`.

**What I tested**
I ran a throwaway Mocha file through `runInChild` and then deleted it. It had one passing test, one pending, four failing tests and one failing hook, with retries on.

| Event | What reached the parent |
|---|---|
| `fail` | 5 events, 4 tests plus the hook. The parent stats counted 5 failures, 1 pass, 1 pending and 6 tests. |
| `pass` / `pending` | Received, with `state` set. |
| `retry`, `hook`, `hook end`, `end` | All received. |
| Every event | Carried the parent-side `{ count: 1, logger }` payload as the last argument. |

Error contents on the parent side:
- **`deepStrictEqual` failure:** the diff text, `code` and the `actual`/`expected` strings survived. `showDiff` came through as `undefined`, which is just how Mocha leaves it.
- **Error with `cause` and extra properties:** the cause message and nested `details` data were kept.
- **Error with a circular reference, a function and a symbol:** these were turned into `[Circular]`, `[Function: namedFn]` and `Symbol(s)`, so nothing blocked the send.
- **Thrown non-Error:** it was received with Mocha's own wrapper message.

**Limitations**
- **Copies, not live Mocha objects:** listeners in the parent get read-only copies of tests, hooks and suites. They have `title`, `state`, `file`, `parent`, `err`, `fullTitle()`, `titlePath()`, `isPending()`, `isFailed()` and `isPassed()`. Calling Mocha methods that change state, or reading other internals, won't work. The README should say this when it documents `isolate`.
- **Depth cap:** nested values deeper than 8 levels are replaced by `[Object]`.
- **Class instances:** their own properties are copied as plain data, so methods are lost.

The next step is wiring the mode choice into `Kaukau.run()`, so `isolate: true` starts using `runInChild`. After that come the CLI flags and the README, which are on your side.

---

Search for `executeInProcess|import \{ createStats|setImmediate`

Read , lines 222 to 255
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\kaukau.ts",
  "view_range": [
    222,
    255
  ]
}

Edit 

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\src\\kaukau.ts"}

Ran terminal command: npx tsc --noEmit; "tsc exit $LASTEXITCODE"; New-Item -ItemType Directory .tmp-e2e\ok, .tmp-e2e\fail | Out-Null

Create 

Create 

Create 

Create 

Ran terminal command: npx tsc --outDir .tmp-build; node .tmp-e2e\harness.js *> .tmp-e2e\out.txt; Select-String -Path .tmp-e2e\out.txt -Pattern "^=====|^SEEN|^DONE|Test n°|ALL DONE|error" | % { $_.Line }

Ran terminal command: Remove-Item -Recurse -Force .tmp-build, .tmp-e2e; (Get-Process node -ErrorAction SilentlyContinue | Measure-Object).Count; git status --short

The `isolate` option now works end to end through `Kaukau`. That was the only step in section 8 still open, and `npx tsc --noEmit` passes. Steps 1 to 7 and 9 were already done in the earlier steps.

**The change**
In `kaukau.ts`, `run()` has a new `executeSet(prepared)`:
- If the set's merged `isolate` is set, it calls `runInChild`, passing `enableLogs` and `logLevel`.
- Otherwise it calls `executeInProcess`.
- The loop is otherwise unchanged: sequential, `exitOnFail`, and `done` with the total failures.

**What I tested**
I built into a temporary folder, ran five scenarios through `new Kaukau(...).run()` with a CommonJS file and an ESM-syntax `.js` file, then deleted everything. No `node` processes were left running.

| Scenario | Result |
|---|---|
| In-process, 2 sets (default) | ESM file skipped in set 2: 3 tests ran, `ALL DONE - 3/3`. This is PROBLEM 1. |
| `isolate: true`, 2 sets | Both files ran in both sets: `ALL DONE - 4/4 passing`, `Test n°` lines printed once per set, `setting1`/`setting2` events received. |
| Main off, set 2 has `kaukauOptions: { isolate: true }` | Per-set override works: set 2 ran in a child process with both files. |
| `isolate` + `exitOnFail`, failing tests | Stopped after set 1, `done` reported 1 failure, and `ALL DONE - 0/1`. |
| `isolate` without `exitOnFail`, failing tests | Both sets ran, `done` reported 2 failures. |

In the third scenario set 1 ran only one test, not two. That scenario ran in the same Node process as the first one, which had already loaded the ESM file in-process. So it's PROBLEM 1 showing up again across runs, not a bug in the override.

**Left for you** (outside `src/`)
- `bin/start.js`: `--isolate` / `--no-isolate`, and forwarding `--require` into `isolate.require`. A config file with `"isolate": true` already works, because the whole config object goes to `Kaukau`.
- Make sure `lib/` is rebuilt, because the child process runs `lib/isolation/child.js`.
- The README: document `isolate`, say that `fail`/`pass` listeners get read-only copies in isolated mode, and point the ESM-in-`.js` section at it.
- `plan.esm.md`: the type change on `BaseOptions`, the signal-forwarding deviation, and the logger setter are not reflected yet.

---

Search for `^#|isolate|ext. \||--watch|--ignore|--debug|exit-on-fail|Known limitation`

Read 
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\plan.esm.md"
}

Read , lines 1 to 14
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\README.md",
  "view_range": [
    1,
    14
  ]
}

Read , lines 80 to 160
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\README.md",
  "view_range": [
    80,
    160
  ]
}

Read , lines 160 to 250
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\README.md",
  "view_range": [
    160,
    250
  ]
}

Read , lines 330 to 420
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\README.md",
  "view_range": [
    330,
    420
  ]
}

Search for `isolate`

Search for `^#|BaseOptions|signal|SIGINT|printRunEvents|setPrintRunEvents|isolate\(\)|Pub...`

Read , lines 1 to 4
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\plan.esm.md",
  "view_range": [
    1,
    4
  ]
}

Read , lines 42 to 50
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\plan.esm.md",
  "view_range": [
    42,
    50
  ]
}

Read , lines 94 to 158
Completed with input: {
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\plan.esm.md",
  "view_range": [
    94,
    158
  ]
}

Edit 

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\plan.esm.md"}

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\plan.esm.md"}

"Edit File" failed
Completed with input: {
  "new_str": "- **Parent logger (changed):** the logger is created once per run, but the choice is per set, so besides the constructor option `printRunEvents` (default `true`) the logger has `setPrintRunEvents(bool)` and `isPrintingRunEvents()`. `runInChild` turns the lines off for the duration of the set and restores the previous value afterwards.",
  "old_str": "- **Parent logger (changed):** PLACEHOLDER",
  "path": "c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\plan.esm.md"
}
Tool execution failed: No match found

Edit 

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\plan.esm.md"}

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\plan.esm.md"}

Edit 

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\README.md"}

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\README.md"}

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\README.md"}

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\README.md"}

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\README.md"}

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\README.md"}

Edit 
Completed with input: {"path":"c:\\Users\\Stephane\\Documents\\GitHub\\kaukau\\README.md"}

Search for `PLACEHOLDER|isolate`

Both are done. I haven't run anything for this step, since only the two Markdown files changed.

## README.md
- **New section "Isolating sets of parameters (`isolate`)",** placed after Configuration and linked from the table of contents. It covers:
  - what `isolate` does and why
  - the `true` form and the object form (`require`, `execArgv`)
  - the per-set override with `kaukauOptions`
  - a note that the CLI takes it from the config file, since the `--isolate` flag doesn't exist yet
  - what changes when a set is isolated: results and output stay the same, and a child that dies counts as 1 failure
  - the cost, as rough estimates: about 0.2–0.6 s and 50–100 MB per set
- **Read-only copies:** the new section says that `fail` and `pass` listeners get read-only copies of tests, hooks and suites in isolated mode. It lists which fields you can read, and says that errors keep their own properties. The Events table in "Programmatic usage" carries the same note.
- **Plain data only:** the section says the parameters, `mochaOptions` and `tester` defaults must be plain data, quotes the error you get, and suggests module names such as `reporter: "spec"`.
- **Other places updated:** the configuration table and example have an `isolate` row, `kaukauOptions` can now overwrite `isolate`, and `IsolateOptions` is in the exported types list.
- **ESM-in-`.js` section:** it now points to `isolate` as the simple fix. The advice not to mix ESM syntax into `.js` files stays as the alternative. I also added that section to the table of contents, where it was missing.

## plan.esm.md
- **Status and section 4:**
  - The status line now says the work is implemented in `src/`, and deviations are marked **(changed)**.
  - The `BaseOptions` type change is documented, with the reason: `KaukauOptions` extends `BaseOptions`, so it can't widen a property.
  - Section 4 also describes the string-or-array `require`, the normalization, the accessor and the exports.
- **Section 5:** the logger's `setPrintRunEvents()` and `isPrintingRunEvents()`, which are needed because the choice is per set.
- **Section 6:**
  - The exit-and-result handling now waits for both `exit` and `disconnect` instead of one tick.
  - There is no signal forwarding, with the reason.
  - The child flushes stdout and stderr before exiting, and the parent kills it after a 5 s grace period.
- **Section 8:** every step is marked done, including the `execute.ts` and `prepared-set.ts` refactor and its two small behaviour differences. It lists what is left for you.
- **Section 10:** each check is marked as done or still open. Still open are the real npm scripts, the load-error and infinite-handle crash cases, watch mode, Linux and the other Node versions.

What's left for you, outside the docs: `bin/start.js` for `--isolate`/`--no-isolate`, rebuilding `lib/`, and tests under `test/`.