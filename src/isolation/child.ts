import { EventEmitter } from 'events';
import { KaukauLogger } from '../ctx/logger';
import { Tester } from '../ctx/tester';
import type { KaukauEmitter } from '../events';
import { createStatsCollector, executeInProcess, MOCHA_RUNNER_EVENTS } from '../execute';
import { Parameters } from '../parameters';
import type { PreparedSet } from '../prepared-set';
import type { ChildToParentMessage, ParentToChildMessage, RunMessage } from './protocol';
import { serializeError, serializeValue } from './serialize';

/**
 * Entry point of the child process: runs one set of parameters and reports to the main process.
 * It is started with `child_process.fork` by `runInChild`, never imported.
 */

const send = (message: ChildToParentMessage): Promise<void> =>
  new Promise((resolve, reject) => {
    if (!process.send) {
      reject(new Error('Not running in a child process'));
      return;
    }
    process.send(message, undefined, undefined, (err) => (err ? reject(err) : resolve()));
  });

const flush = (stream: NodeJS.WriteStream): Promise<void> => new Promise((resolve) => stream.write('', () => resolve()));

// like Mocha's `--exit`: leaked handles (timers, sockets) of the tests must not keep the process alive
async function exit(code: number): Promise<never> {
  await Promise.all([flush(process.stdout), flush(process.stderr)]);
  return process.exit(code);
}

async function run(message: RunMessage): Promise<void> {
  const emitter = new EventEmitter() as KaukauEmitter;
  createStatsCollector(emitter);

  const log = new KaukauLogger(emitter, message.loggerOptions);

  const parameters = new Parameters([message.paramsSet]);
  parameters.next();

  const tester = new Tester();
  tester.setRequestDefaults(message.tester.requestInit);
  tester.sessionId = message.tester.sessionId;

  const prepared: PreparedSet = {
    count: message.count,
    params: parameters.get,
    tester,
    kaukauOptions: {},
    mochaOptions: message.mochaOptions,
    files: message.files,
    isolate: null,
  };

  // forward the Mocha runner events, without the kaukau payload (the main process adds its own)
  MOCHA_RUNNER_EVENTS.forEach((name) => {
    emitter.on(name, (...args: unknown[]) => {
      send({ type: 'event', name, args: args.slice(0, -1).map((arg) => serializeValue(arg)) }).catch((err) => {
        process.stderr.write(`kaukau: could not send the event "${name}": ${err}\n`);
      });
    });
  });

  try {
    const failures = await executeInProcess(prepared, { emitter, log });
    await send({ type: 'result', failures });
    await exit(0);
  } catch (err) {
    await send({ type: 'error', error: serializeError(err instanceof Error ? err : new Error(String(err))) }).catch(
      () => undefined
    );
    await exit(1);
  }
}

if (!process.send) {
  throw new Error('kaukau: this module must be started as a child process');
}

// the main process is gone (e.g. killed): do not stay around
process.on('disconnect', () => process.exit(1));

process.on('message', (message: ParentToChildMessage) => {
  if (message && message.type === 'run') {
    void run(message);
  }
});

send({ type: 'ready' }).catch(() => process.exit(1));
