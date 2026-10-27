export class Tester {
  #requestInit: RequestInit = {};

  // where to store the session id
  sessionId = '';

  // set request defaults
  setRequestDefaults(options?: RequestInit): void {
    this.#requestInit = options || {};
  }

  // update request defaults
  updateRequestDefaults(options?: RequestInit): void {
    this.#requestInit = options ? { ...this.#requestInit, ...options } : this.#requestInit;
  }

  getRequestDefaults(): RequestInit {
    return { ...this.#requestInit };
  }

  // call request
  request(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    return fetch(input, init ? { ...this.#requestInit, ...init } : this.#requestInit);
  }
}
