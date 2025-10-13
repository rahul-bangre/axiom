import { ok, Result, runtimeError, typeError } from "../types/result.ts";
import type {
  ArrayValue,
  BooleanValue,
  NativeFunctionValue,
  NullValue,
  NumberValue,
  ObjectValue,
  RuntimeValue,
  StringValue,
} from "../runtime/value.ts";
import { ValueType } from "../runtime/value.ts";

function runtimeValueToJS(value: RuntimeValue): any {
  switch (value.type) {
    case ValueType.NUMBER:
      return (value as NumberValue).value;
    case ValueType.STRING:
      return (value as StringValue).value;
    case ValueType.BOOLEAN:
      return (value as BooleanValue).value;
    case ValueType.NULL:
      return null;
    case ValueType.ARRAY:
      return (value as ArrayValue).elements.map(runtimeValueToJS);
    case ValueType.OBJECT: {
      const obj: Record<string, any> = {};
      const entries = Array.from((value as ObjectValue).properties.entries());
      for (const [key, val] of entries) {
        obj[key] = runtimeValueToJS(val);
      }
      return obj;
    }
    case ValueType.FUNCTION:
    case ValueType.NATIVE_FUNCTION:
      throw new Error("Cannot convert function to JSON");
    default:
      throw new Error(`Unknown value type: ${value.type}`);
  }
}

export function jsToRuntimeValue(value: any): RuntimeValue {
  if (value === null || value === undefined) {
    return { type: ValueType.NULL } as NullValue;
  }

  if (typeof value === "number") {
    return { type: ValueType.NUMBER, value } as NumberValue;
  }

  if (typeof value === "string") {
    return { type: ValueType.STRING, value } as StringValue;
  }

  if (typeof value === "boolean") {
    return { type: ValueType.BOOLEAN, value } as BooleanValue;
  }

  if (Array.isArray(value)) {
    return {
      type: ValueType.ARRAY,
      elements: value.map(jsToRuntimeValue),
    } as ArrayValue;
  }

  if (typeof value === "object") {
    const properties = new Map<string, RuntimeValue>();
    for (const [key, val] of Object.entries(value)) {
      properties.set(key, jsToRuntimeValue(val));
    }
    return { type: ValueType.OBJECT, properties } as ObjectValue;
  }

  throw new Error(`Cannot convert JS value to RuntimeValue: ${typeof value}`);
}

export const json_parse: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "parse",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("json.parse() expects exactly 1 argument");
    }

    const arg = args[0];
    if (arg.type !== ValueType.STRING) {
      return typeError("json.parse() requires a string argument");
    }

    const json_string = (arg as StringValue).value;

    try {
      const parsed = JSON.parse(json_string);
      const runtime_value = jsToRuntimeValue(parsed);
      return ok(runtime_value);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return runtimeError(`json.parse() failed: ${message}`);
    }
  },
};

export const json_stringify: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "stringify",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("json.stringify() expects exactly 1 argument");
    }

    const arg = args[0];

    try {
      const js_value = runtimeValueToJS(arg);
      const json_string = JSON.stringify(js_value);
      return ok({ type: ValueType.STRING, value: json_string } as StringValue);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return runtimeError(`json.stringify() failed: ${message}`);
    }
  },
};
