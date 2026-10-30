import { fork } from 'node:child_process';
import path from 'node:path';
import type { KaukauLogger } from '../ctx/logger.js';
import type { KaukauEmitter } from '../events.js';
import type { ResolvedIsolateOptions } from '../options.js';
import type { PreparedSet } from '../prepared-set.js';
import type { ChildToParentMessage, RunMessage } from './protocol.js';
import { assertCloneable, deserializeValue, type SerializedError } from './serialize.js';

export interface RunInChildContext {
  emitter: KaukauEmitter;
  logger: KaukauLogger;
  logLevel?: RunMessage['loggerOptions']['logLevel'];
  enableLogs?: boolean;
}

// time given to a child that sent its result to exit by itself, before it is killed
const EXIT_GRACE_MS = 5000;

let cachedChildPath: string | undefined;

function getChildPath(): string {
  return (cachedChildPath ??= path.join(import.meta.dirname, 'child.js'));
}

function buildRunMessage(prepared: PreparedSet, context: RunInChildContext): RunMessage {
  const message: RunMessage = {
    type: 'run',
    count: prepared.count,
    paramsSet: prepared.params(),
    tester: {
      requestInit: prepared.tester.getRequestDefaults(),
      sessionId: prepared.tester.sessionId,
    },
    mochaOptions: prepared.mochaOptions,
    files: prepared.files,
    loggerOptions: {
      enableLogs: context.enableLogs,
      logLevel: context.logLevel,
      printRunEvents: true,
    },
  };

  assertCloneable('parameters', message.paramsSet);
  assertCloneable('mochaOptions', message.mochaOptions);
  assertCloneable('tester request defaults', message.tester.requestInit);

  return message;
}

function describeError(error: SerializedError): string {
  return error.stack || `${error.name}: ${error.message}`;
}

/**
 * Runs the set in a new Node.js process.
 * The Mocha runner events of the child are emitted on `context.emitter`, as they are for a set run in the current process.
 * @returns the number of failures (a child that dies without a result counts as 1 failure)
 */
export async function runInChild(
  prepared: PreparedSet,
  isolate: ResolvedIsolateOptions,
  context: RunInChildContext
): Promise<number> {
  const { emitter, logger } = context;
  const runMessage = buildRunMessage(prepared, context);

  const execArgv = [
    ...process.execArgv,
    ...isolate.require.flatMap((mod) => ['--require', mod]),
    ...isolate.execArgv,
  ];

  // the child prints the "Test n°" lines itself, in order with the output of the tests
  const printedRunEvents = logger.isPrintingRunEvents();
  logger.setPrintRunEvents(false);

  try {
    return await new Promise<number>((resolve) => {
      const child = fork(getChildPath(), [], {
        serialization: 'advanced',
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
        execArgv,
        env: process.env,
        cwd: process.cwd(),
      });

      let failures: number | undefined;
      let childError: SerializedError | undefined;
      let exited = false;
      let disconnected = false;
      let exitInfo = '';
      let killTimer: NodeJS.Timeout | undefined;
      let done = false;

      const finish = (): void => {
        if (done) {
          return;
        }
        done = true;
        clearTimeout(killTimer);
        if (childError) {
          logger.error(`Test n° ${prepared.count} failed to run in a child process:`, describeError(childError));
          resolve(1);
        } else if (typeof failures === 'number') {
          resolve(failures);
        } else {
          logger.error(`Test n° ${prepared.count}: the child process ended without a result (${exitInfo})`);
          resolve(1);
        }
      };

      // 'disconnect' comes after the last message was received
      const finishWhenDrained = (): void => {
        if (exited && disconnected) {
          finish();
        }
      };

      child.on('message', (message: ChildToParentMessage) => {
        switch (message.type) {
          case 'ready':
            child.send(runMessage);
            break;
          case 'event':
            emitter.emit(message.name, ...message.args.map(deserializeValue), {
              count: prepared.count,
              logger,
            });
            break;
          case 'result':
            failures = message.failures;
            // the child exits by itself, this is only a safety net
            killTimer = setTimeout(() => child.kill(), EXIT_GRACE_MS);
            break;
          case 'error':
            childError = message.error;
            break;
        }
      });

      child.on('error', (err) => {
        exitInfo = `${err}`;
        finish();
      });

      child.on('exit', (code, signal) => {
        exited = true;
        exitInfo = signal ? `signal ${signal}` : `exit code ${code}`;
        finishWhenDrained();
      });

      child.on('disconnect', () => {
        disconnected = true;
        finishWhenDrained();
      });
    });
  } finally {
    logger.setPrintRunEvents(printedRunEvents);
  }
}
