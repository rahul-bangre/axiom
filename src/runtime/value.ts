import type { BlockStatement } from "@parser";
import type { Environment } from "./environment.ts";

export enum ValueType {
  NUMBER,
  STRING,
  BOOLEAN,
  NULL,
  ARRAY,
  OBJECT,
  FUNCTION,
  NATIVE_FUNCTION,
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
  call: (args: RuntimeValue[]) => RuntimeValue;
}
