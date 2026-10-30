declare module 'mocha/lib/stats-collector.js' {
  import type { EventEmitter } from 'node:events';

  // mocha >= 11 exposes `createStatsCollector` as a named export, but @types/mocha still declares a single `export =`
  export function createStatsCollector(runner: EventEmitter): void;
}