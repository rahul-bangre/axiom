export class RuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeError";
  }
}

export class TypeError extends RuntimeError {
  constructor(message: string) {
    super(message);
    this.name = "TypeError";
  }
}

export class ReferenceError extends RuntimeError {
  constructor(message: string) {
    super(message);
    this.name = "ReferenceError";
  }
}
