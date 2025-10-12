export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function err<T>(error: string): Result<T> {
  return { ok: false, error };
}

export function runtimeError<T>(message: string): Result<T> {
  return { ok: false, error: `RuntimeError: ${message}` };
}

export function typeError<T>(message: string): Result<T> {
  return { ok: false, error: `TypeError: ${message}` };
}

export function referenceError<T>(message: string): Result<T> {
  return { ok: false, error: `ReferenceError: ${message}` };
}

export function lexerError<T>(message: string, line: number, column: number): Result<T> {
  return { ok: false, error: `LexerError: ${message} at line ${line}, column ${column}` };
}

export function parserError<T>(message: string): Result<T> {
  return { ok: false, error: `ParserError: ${message}` };
}

export function isOk<T>(result: Result<T>): result is { ok: true; value: T } {
  return result.ok === true;
}

export function isErr<T>(result: Result<T>): result is { ok: false; error: string } {
  return result.ok === false;
}

export function unwrap<T>(result: Result<T>): T {
  if (!result.ok) {
    throw new Error(`Unwrap failed: ${result.error}`);
  }
  return result.value;
}

export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

export function map<T, U>(result: Result<T>, fn: (value: T) => U): Result<U> {
  return result.ok ? ok(fn(result.value)) : result;
}

export function flatMap<T, U>(result: Result<T>, fn: (value: T) => Result<U>): Result<U> {
  return result.ok ? fn(result.value) : result;
}

export function mapErr<T>(result: Result<T>, fn: (error: string) => string): Result<T> {
  return result.ok ? result : err(fn(result.error));
}
