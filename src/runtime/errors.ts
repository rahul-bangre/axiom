export class LexerError extends Error {
  line: number;
  column: number;

  constructor(message: string, line: number, column: number) {
    super(`${message} at line ${line}, column ${column}`);
    this.name = "LexerError";
    this.line = line;
    this.column = column;
  }
}

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
