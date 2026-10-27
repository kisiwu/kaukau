# kaukau

Node.js test tools: a [Mocha](https://mochajs.org/) wrapper with sets of parameters, a logger and a request helper. Supports CommonJS and ESM (config files, parameters files and test files).

- [Install](#install)
- [Quick start](#quick-start)
- [CLI](#cli)
- [Programmatic usage](#programmatic-usage)
- [Configuration](#configuration)
- [Isolating sets of parameters (`isolate`)](#isolating-sets-of-parameters-isolate)
- [Helpers (`this.ctx.kaukau`)](#helpers-thisctxkaukau)
- [TypeScript](#typescript)
- [Migrating to v6](#migrating-to-v6)
- [References](#references)
- [Known limitation: ES modules in `.js` test files](#known-limitation-es-modules-in-js-test-files)

## Install

`mocha` is a peer dependency, install it alongside kaukau (Node.js `^20.19.0 || >=22.12.0`):

```bash
npm install kaukau mocha --save-dev
```

For TypeScript users, also install the type definitions:

```bash
npm install @types/mocha @types/node --save-dev
```

## Quick start

1. Generate a configuration file:

   ```bash
   kaukau setup --config kaukau-config.json --file tests/
   ```

2. Write a test, e.g. `tests/example.js`:

   ```js
   const { expect } = require('chai');

   describe('example', function () {
     const { params, logger } = this.ctx.kaukau;

     it('should have a host', () => {
       logger.info('host:', params('host'));
       expect(params('host')).to.be.a('string');
     });
   });
   ```

3. Add parameters to `kaukau-config.json` (`"parameters": [{ "host": "https://example.com" }]`) and run:

   ```bash
   kaukau --config kaukau-config.json
   ```

## CLI

```bash
kaukau [options]
kaukau start [options]      # same as above
kaukau setup [options]      # alias: init
```

### `kaukau setup`

Creates a configuration file if it does not exist (or is empty).

| Option | Description | Default |
|---|---|---|
| `-c, --config <name>` | Configuration file to create (`.json` or `.js`) | `kaukau-config.json` |
| `-f, --file <name>` | File/folder to put in `files` | |

```bash
kaukau setup
kaukau setup --config kaukau-config.js
kaukau setup --config kaukau-config.js --file tests/
```

### `kaukau` / `kaukau start`

| Option | Description |
|---|---|
| `-f, --file <name>` | File/folder to be loaded for execution |
| `--ext <extension>` | File extensions to be loaded (see [`ext`](#configuration)) |
| `-c, --config <name>` | Configuration file (`.json`, `.js`, `.mjs`, `.cjs`) |
| `--parameters <name>` | File or folder containing the parameters (`.json`, `.js`, `.mjs`, `.cjs`) |
| `-r, --require <names>` | Comma separated modules to require before running (e.g. `ts-node/register`) |
| `--logs` / `--no-logs` | Enable/disable kaukau logs |
| `--exit-on-fail` / `--no-exit-on-fail` | Stop after the first set of parameters that has a failing test |
| `--watch <globs...>` | Re-run the tests when these files change |
| `--ignore` | Do not watch files (overrides `--watch`) |
| `--debug` | Debug mode |
| `--directory <name>` | **Deprecated**, use `--file` |
| `-V, --version` / `-h, --help` | Version / help |

Command line options take precedence over the configuration file.

```bash
kaukau --file tests/
kaukau --config kaukau-config.js
kaukau start --config kaukau-config.js --file tests/
kaukau --config kaukau-config.js --parameters parameters/
kaukau --config kaukau-config.js --watch kaukau-config.js "tests/**/*.js"
kaukau --help
```

## Programmatic usage

```js
const { Kaukau } = require('kaukau');
const config = require('./kaukau-config');

const kaukau = new Kaukau(config);

kaukau.run()
  // kaukau events
  .on('done', (totalFailures) => { /* done testing */ })
  // mocha events (https://mochajs.org/api/runner)
  .on('test', (test) => {})
  .on('test end', (test) => {})
  .on('pass', (test) => {})
  .on('fail', (test, err) => {})
  .on('end', () => {});
```

With ESM / TypeScript:

```js
import { Kaukau } from 'kaukau';
```

`run()` returns an event emitter synchronously: attach your listeners right after calling it.

### Events

| Event | Arguments |
|---|---|
| `setting`, `setting tester`, `setting options`, `setting options end`, `setting mocha`, `setting mocha end`, `setting end`, `add file` | an object with `count` (the number of the set of parameters running), `logger` and event specific properties |
| all [Mocha runner events](https://mochajs.org/api/runner) | the Mocha arguments followed by `{ count, logger }`. With [`isolate`](#isolating-sets-of-parameters-isolate), tests, hooks, suites and errors are **read-only copies** |
| `done` | `totalFailures` (number) |

## Configuration

A configuration file is a JSON file, or a `.js`/`.mjs`/`.cjs` module exporting the configuration object (`module.exports = {...}` or `export default {...}`).

| Property | Type | Description | Default |
|---|---|---|---|
| `enableLogs` | `boolean` | Enable/disable kaukau logs | `true` |
| `logLevel` | `string` | `error`, `warn`, `info`, `verbose`, `debug`, `trace`. See [Logger](#logger) | `verbose` |
| `exitOnFail` | `boolean` | Do not execute the next sets of parameters if a set has a failing test | `false` |
| `files` | `string \| string[]` | Files and/or directories to be loaded for execution | `[]` |
| `ext` | `string \| string[]` | File extensions to be loaded when `files` contains directories | `['.js', '.mjs', '.cjs']` |
| `isolate` | `boolean \| object` | Run each set of parameters in its own child process. See [Isolating sets of parameters](#isolating-sets-of-parameters-isolate) | `false` |
| `options` | `object` | [Mocha options](https://mochajs.org/api/mocha) | `{}` |
| `parameters` | `object \| object[]` | Sets of [parameters](#parameters) | `[{}]` |

Strings given to `files` and `ext` can be comma separated (e.g. `".js,.mjs"`).

Example:

```jsonc
{
  /* kaukau options */
  "enableLogs": true,
  "exitOnFail": false,
  "files": [], // e.g.: ["tests/test01.js", "tests/more/"]
  "ext": [".js", ".mjs", ".cjs"],
  "isolate": false,

  /* mocha options */
  "options": {
    "timeout": 10000
  },

  /* sets of parameters */
  "parameters": [
    {
      /* overwrite kaukau options for this set */
      "kaukauOptions": {},
      /* overwrite mocha options for this set */
      "mochaOptions": {},

      /* custom parameters */
      "host": "https://example.com"
    }
  ]
}
```

> The `directory` option and `--directory` flag are **deprecated**: use `files` and `--file`.

### `defineConfig` and `defineParameters`

Helpers (exported from `kaukau/config`) to write typed configuration and parameters files:

```ts
// kaukau-config.ts
import { defineConfig } from 'kaukau/config';

export default defineConfig({
  files: 'tests/',
  parameters: [{ host: 'https://example.com' }],
});
```

```ts
// parameters.ts
import { defineParameters } from 'kaukau/config';

export default defineParameters([{ host: 'https://example.com' }]);
```

## Isolating sets of parameters (`isolate`)

By default, all the sets of `parameters` run in the **same Node.js process**: the test files are loaded again for each set, but modules, globals, `process.env` changes, timers and open handles can leak from one set to the next. Some files are not even re-executed (see [ES modules in `.js` test files](#known-limitation-es-modules-in-js-test-files)).

With `isolate`, **each set runs in its own child process**, so nothing is shared between sets and every test file is executed for every set.

```jsonc
{
  "files": ["tests/"],
  "isolate": true,
  "parameters": [{ "host": "https://a.example.com" }, { "host": "https://b.example.com" }]
}
```

`isolate` is `false` by default. It accepts:

- `true`: one child process per set, started with the same Node.js arguments as the main process.
- an object to customize the child process:

  | Property | Type | Description |
  |---|---|---|
  | `require` | `string \| string[]` | Modules to preload in the child process (`--require`), e.g. `ts-node/register`. Comma separated or array |
  | `execArgv` | `string[]` | Extra Node.js arguments, e.g. `["--max-old-space-size=4096", "--import", "./setup.mjs"]` |

A set can enable or disable it for itself with `kaukauOptions`:

```jsonc
{
  "isolate": false,
  "parameters": [
    { "id": 1 },
    { "id": 2, "kaukauOptions": { "isolate": true } } // only this set runs in a child process
  ]
}
```

The CLI starts the tests the same way, so set `isolate` in your configuration file (`kaukau --config kaukau-config.json`).

### What changes when a set is isolated

- **Same results and output.** Reporters, `this.ctx.kaukau` (`params`, `logger`, `tester`), the `Test n° x` lines, the `ALL DONE` summary, `exitOnFail` and the exit code behave as usual.
- **Listeners get read-only copies.** In `.on('pass' | 'fail' | 'test' | ...)` listeners, tests, hooks and suites are copies of the Mocha objects, not the live ones. You can read `title`, `fullTitle()`, `titlePath()`, `state`, `file`, `duration`, `speed`, `pending`, `parent`, `err` (and `isPending()`, `isFailed()`, `isPassed()`), but you cannot change them or call other Mocha methods. Errors are real `Error` objects that keep their own properties (`code`, `actual`, `expected`, `cause`, ...); values that cannot be copied (functions, circular references) are replaced by a string.
- **Data sent to the child must be plain data.** The set of parameters, `mochaOptions` and the `tester` request defaults are copied to the child process, so they cannot contain functions or class instances. Kaukau stops with an explicit error naming the property (e.g. `"isolate": "parameters.credentials.check" cannot be sent to the child process`). Use module names or paths instead, for example `reporter: "spec"` or `reporter: "./my-reporter.js"`.
- **Changes made to `tester` or in the tests stay in the child.** Only what was set before the tests start (`setting tester` listeners, parameters) is passed on.
- **A child that dies counts as 1 failure.** If a test calls `process.exit()`, crashes or runs out of memory, the error is logged and the set is counted as failed (so `exitOnFail` applies).
- **It costs more.** Each set starts a new Node.js process and loads Mocha and your dependencies again, roughly 0.2 to 0.6 seconds and 50 to 100 MB of extra memory while it runs (the main process stays idle). It is negligible for tests that mostly wait for the network, and noticeable for very fast unit tests. Prefer enabling it only for the sets that need it.

## Helpers (`this.ctx.kaukau`)

In your test files, kaukau adds helpers to the Mocha context: `this.ctx.kaukau` contains `params` (also `parameters`), `logger` (also `log`) and `tester`.

> Use a regular `function` (not an arrow function) for `describe` to access `this`.

### Parameters

Useful to run the same tests with different parameters and options.

If you define several sets of `parameters` in your [configuration](#configuration), the test files are executed once for each set. `params(path)` reads a value from the set currently running (dot notation or array path); `params()` returns the whole set.

```js
describe('test 01', function () {
  const { params } = this.ctx.kaukau;

  /**
   * In the configuration:
   * parameters: [
   *   { host: "test.com", credentials: { email: "test@test.com" } }
   * ]
   */
  const host = params('host'); // "test.com"
  const email = params('credentials.email'); // "test@test.com"
});
```

A set of parameters can overwrite the main configuration with `kaukauOptions` and `mochaOptions`:

- `kaukauOptions` can overwrite `files`, `ext` and `isolate`.
- `mochaOptions` can overwrite any [Mocha option](https://mochajs.org/api/mocha).

Parameters can also be loaded from files with `--parameters <file|folder>` (one set per file, `.json`, `.js`, `.mjs` or `.cjs`).

### Logger

```js
describe('test 02', function () {
  const { logger } = this.ctx.kaukau;

  logger.trace('trace level');
  logger.debug('debug level');
  logger.log('verbose level');
  logger.info('info level');
  logger.warn('warn level');
  logger.error('error level');
  logger.success('success level');
});
```

The log level is set with `logLevel` in the configuration. Kaukau's internal logs use [`@novice1/logger`](https://www.npmjs.com/package/@novice1/logger); with `--debug` (or `DEBUG=kaukau:*`) you also get the `kaukau:*` debug namespaces.

### Tester

A small wrapper around `fetch` with default request options.

```js
// chai@4
const { expect } = require('chai');

describe('test 03', function () {
  const { params, tester } = this.ctx.kaukau;

  // set default options (RequestInit)
  tester.setRequestDefaults({ headers: { accept: 'application/json' } });

  // merge into the default options
  tester.updateRequestDefaults({ redirect: 'follow' });

  // read the default options
  tester.getRequestDefaults();

  it('should be ok', async () => {
    /** @type {Response} */
    const res = await tester.request(params('host'), { method: 'GET' });
    expect(res.status).to.equal(200);
  });
});
```

`tester.sessionId` is a free field to keep a session identifier between tests.

## TypeScript

### Typing `this.ctx.kaukau`

The `this.ctx.kaukau` types are loaded when `kaukau` is imported somewhere in the program. For test files that never import it, either:

- add a declaration file (e.g. `kaukau.d.ts`, covered by your `include`) containing:

  ```ts
  import 'kaukau';
  ```

- or add `kaukau` to `types` in your `tsconfig.json` (when `types` is set, list the other type packages too):

  ```json
  {
    "compilerOptions": {
      "types": ["node", "mocha", "kaukau"]
    }
  }
  ```

This requires `moduleResolution` set to `node16`, `nodenext` or `bundler` in your `tsconfig.json`.

### Running TypeScript tests

Install a TypeScript loader (e.g. `ts-node`) and the type definitions:

```bash
npm install --save-dev ts-node @types/mocha
```

Then require it:

```bash
kaukau --require ts-node/register --file tests/ --ext .test.ts
```

### Exported types

```ts
import { Kaukau, defineConfig, defineParameters } from 'kaukau';
import type {
  KaukauOptions,
  KaukauConfig,
  IParameters,
  BaseOptions,
  IsolateOptions,
  LogLevel,
  Runner,
  KaukauContext,
} from 'kaukau';
```

## Migrating to v6

- Kaukau is written in TypeScript and only uses **named exports**:

  ```diff
  - const Kaukau = require('kaukau');
  + const { Kaukau } = require('kaukau');
  ```

  ```diff
  - import Kaukau from 'kaukau';
  + import { Kaukau } from 'kaukau';
  ```

- `kaukau/config` still exports `defineConfig` and `defineParameters`.
- Node.js `^20.19.0 || >=22.12.0` is required.
- `mocha` (and optionally `@types/mocha`, `@types/node`) must be installed by you (peer dependencies).

## References

- [mocha](https://mochajs.org/)
- [chai](https://www.chaijs.com/api/)
- [@novice1/logger](https://www.npmjs.com/package/@novice1/logger)

## Known limitation: ES modules in `.js` test files

When you define **several sets of `parameters`**, kaukau loads your test files again for each set. This only works if Node re-executes the files.

- **CommonJS files** (`.js`, `.cjs`, `require(...)`) are re-executed for every set.
- **`.mjs` files** are re-executed for every set.
- **`.js` files that use ESM syntax** (`import`/`export`, with or without `"type": "module"` in `package.json`) are executed **only for the first set**. Node loads them through `require(esm)` and caches them, so the next sets silently skip them and their tests do not run.

The simplest fix is to enable [`isolate`](#isolating-sets-of-parameters-isolate): each set then runs in its own process and every file, whatever its syntax, is executed for every set.

If you prefer not to isolate the sets, do not mix ESM syntax into `.js` test files:

```diff
- // tests/example.js
- import { expect } from 'chai';
+ // tests/example.js (CommonJS)
+ const { expect } = require('chai');
```

or rename the file to `.mjs` (and add `.mjs` to `ext` if you load directories):

```diff
- tests/example.js   (with `import`)
+ tests/example.mjs
```

With a single set of parameters this limitation does not apply.