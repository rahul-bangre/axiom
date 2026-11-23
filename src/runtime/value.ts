import type { BlockStatement } from "@parser";
import type { Environment } from "./environment.ts";
import type { Result } from "../types/result.ts";

export enum ValueType {
  NUMBER,
  STRING,
  BOOLEAN,
  NULL,
  ARRAY,
  OBJECT,
  FUNCTION,
  NATIVE_FUNCTION,
  ASYNC,
  DATABASE,
  COLLECTION,
  QUERY_BUILDER,
  TRANSACTION,
  WEBSOCKET_CONNECTION,
}

export interface RuntimeValue {
  type: ValueType;
}

export interface NumberValue extends RuntimeValue {
  type: ValueType.NUMBER;
  value: number;
}

export interface StringValue extends RuntimeValue {
  type: ValueType.STRING;
  value: string;
}

export interface BooleanValue extends RuntimeValue {
  type: ValueType.BOOLEAN;
  value: boolean;
}

export interface NullValue extends RuntimeValue {
  type: ValueType.NULL;
}

/* Internal signal produced by a `return` statement: a NULL value carrying the returned value. */
export interface ReturnSignal extends RuntimeValue {
  type: ValueType.NULL;
  isReturn: true;
  returnValue: RuntimeValue;
}

export function isReturnSignal(value: RuntimeValue): value is ReturnSignal {
  return Boolean((value as Partial<ReturnSignal>).isReturn);
}

export interface ArrayValue extends RuntimeValue {
  type: ValueType.ARRAY;
  elements: RuntimeValue[];
}

export interface ObjectValue extends RuntimeValue {
  type: ValueType.OBJECT;
  properties: Map<string, RuntimeValue>;
}

export interface FunctionValue extends RuntimeValue {
  type: ValueType.FUNCTION;
  name: string;
  params: string[];
  param_info: Array<{ name: string; type_annotation?: string }>;
  return_type?: string;
  body: BlockStatement;
  closure: Environment;
}

export interface NativeFunctionValue extends RuntimeValue {
  type: ValueType.NATIVE_FUNCTION;
  name: string;
  call: (args: RuntimeValue[]) => Promise<Result<RuntimeValue>>;
  return_type?: string;
}

/**
 * Adapts a synchronous implementation to the Promise-returning native call contract.
 * Behaves exactly like wrapping it in an `async` function: the result is delivered as a
 * resolved promise and a thrown exception becomes a rejected promise.
 */
export function syncCall<A extends unknown[]>(
  fn: (...args: A) => Result<RuntimeValue>,
): (...args: A) => Promise<Result<RuntimeValue>> {
  return (...args) => {
    try {
      return Promise.resolve(fn(...args));
    } catch (error) {
      return Promise.reject(error);
    }
  };
}

export interface AsyncValue extends RuntimeValue {
  type: ValueType.ASYNC;
  promise: Promise<RuntimeValue>;
}

export function makeAsyncValue(promise: Promise<RuntimeValue>): AsyncValue {
  return { type: ValueType.ASYNC, promise };
}

/* A value that can be bound to, or read back from, a SQL statement. */
export type SqlValue = boolean | number | bigint | string | null | undefined | Date | Uint8Array;

/* The subset of the sqlite `DB` API the runtime uses. Declared structurally so this module
   stays free of Deno-only imports (it is shared with the browser playground). */
export interface SqlConnection {
  query(sql: string, params?: SqlValue[]): unknown[][];
  execute(sql: string): void;
  close(force?: boolean): void;
}

export interface DatabaseValue extends RuntimeValue {
  type: ValueType.DATABASE;
  connection: SqlConnection;
  path: string;
}

export interface CollectionValue extends RuntimeValue {
  type: ValueType.COLLECTION;
  database: DatabaseValue;
  tableName: string;
  schema: ObjectValue;
}

export interface QueryBuilderValue extends RuntimeValue {
  type: ValueType.QUERY_BUILDER;
  collection: CollectionValue;
  whereClauses: Array<{ field: string; operator: string; value: RuntimeValue }>;
  orderByClauses: Array<{ field: string; direction: string }>;
  limitValue: number | null;
  offsetValue: number | null;
  /* set by `update(...).set(data)`, read by `execute()` */
  updateData?: ObjectValue;
}

export interface TransactionValue extends RuntimeValue {
  type: ValueType.TRANSACTION;
  database: DatabaseValue;
  active: boolean;
}

export interface WebSocketConnectionValue extends RuntimeValue {
  type: ValueType.WEBSOCKET_CONNECTION;
  socket: WebSocket;
  url: string;
  isServer: boolean;
  messageQueue: string[];
  resolvers: Array<(message: string) => void>;
  closed: boolean;
}
