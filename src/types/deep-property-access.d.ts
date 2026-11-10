declare module 'deep-property-access' {
  /**
   * Returns the value at `path` (dot separated string or pre-split array) in `base`, or `undefined`.
   */
  function DeepPropertyAccess(base: unknown, path: string | string[]): unknown;
  export = DeepPropertyAccess;
}
