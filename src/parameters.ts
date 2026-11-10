import DeepPropertyAccess from 'deep-property-access';

export class Parameters {
  #parametersBag: unknown[] = [{}];
  #count: number | undefined;
  #currentParameters: unknown = {};

  constructor(params?: unknown) {
    if (params && typeof params === 'object' && !Array.isArray(params)) {
      params = [params];
    }
    if (Array.isArray(params) && params.length) {
      this.#parametersBag = params;
    }
  }

  // arrow functions so they can be used detached (e.g. `params('id')`)
  all = (): unknown[] => {
    return this.#parametersBag;
  };

  size = (): number => {
    return this.#parametersBag.length;
  };

  next = (): number | undefined => {
    if (typeof this.#count === 'undefined') {
      this.#count = 0;
    } else {
      this.#count++;
    }
    if (this.#count >= this.#parametersBag.length) {
      this.#currentParameters = {};
      return undefined;
    }
    this.#currentParameters = this.#parametersBag[this.#count] || {};
    return this.#count + 1;
  };

  get = (path?: string | string[] | null): unknown => {
    if (typeof path === 'string' || Array.isArray(path)) {
      return DeepPropertyAccess(this.#currentParameters, path);
    } else if (typeof path === 'undefined' || path === null) {
      return this.#currentParameters;
    }
    return undefined;
  };
}
