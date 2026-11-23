import { ok, runtimeError } from "../types/result.ts";
import { json_parse, json_stringify } from "../std/json.ts";
import { schema_namespace } from "../std/schema.ts";
import { createHttpNamespace } from "../std/http.ts";
import { set_constructor } from "../std/set.ts";
import { map_constructor } from "../std/map.ts";
import { Environment } from "./environment.ts";
import {
  type ArrayValue,
  type BooleanValue,
  type FunctionValue,
  NativeFunctionValue,
  type NumberValue,
  ObjectValue,
  RuntimeValue,
  type StringValue,
  syncCall,
  ValueType,
} from "./value.ts";

function printValue(value: RuntimeValue): string {
  switch (value.type) {
    case ValueType.NUMBER:
      return String((value as NumberValue).value);
    case ValueType.STRING:
      return (value as StringValue).value;
    case ValueType.BOOLEAN:
      return String((value as BooleanValue).value);
    case ValueType.NULL:
      return "null";
    case ValueType.ARRAY: {
      const elements = (value as ArrayValue).elements.map(printValue);
      return `[${elements.join(", ")}]`;
    }
    case ValueType.OBJECT: {
      const entries = Array.from((value as ObjectValue).properties.entries());
      const props = entries.map(([key, val]) => `${key}: ${printValue(val)}`);
      return `{${props.join(", ")}}`;
    }
    case ValueType.FUNCTION:
      return `<function ${(value as FunctionValue).name}>`;
    case ValueType.NATIVE_FUNCTION:
      return `<native function ${(value as NativeFunctionValue).name}>`;
    default:
      return String(value);
  }
}

const print: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "print",
  call: syncCall((args: RuntimeValue[]) => {
    const output_str = args.map(printValue).join(" ");
    console.log(output_str);
    return ok({ type: ValueType.NULL });
  }),
};

const len: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "len",
  call: syncCall((args: RuntimeValue[]) => {
    if (args.length !== 1) {
      return runtimeError("len() expects exactly 1 argument");
    }

    const arg_val = args[0];

    if (arg_val.type === ValueType.STRING) {
      return ok({ type: ValueType.NUMBER, value: (arg_val as StringValue).value.length });
    }

    if (arg_val.type === ValueType.ARRAY) {
      return ok({ type: ValueType.NUMBER, value: (arg_val as ArrayValue).elements.length });
    }

    return runtimeError(`len() requires a string or array, got ${arg_val.type}`);
  }),
};

const abs: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "abs",
  call: syncCall((args: RuntimeValue[]) => {
    if (args.length !== 1) {
      return runtimeError("abs() expects exactly 1 argument");
    }
    if (args[0].type !== ValueType.NUMBER) {
      return runtimeError("abs() requires a number argument");
    }
    const value = (args[0] as NumberValue).value;
    return ok({ type: ValueType.NUMBER, value: Math.abs(value) });
  }),
};

const min: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "min",
  call: syncCall((args: RuntimeValue[]) => {
    if (args.length === 0) {
      return runtimeError("min() requires at least 1 argument");
    }
    for (const arg of args) {
      if (arg.type !== ValueType.NUMBER) {
        return runtimeError("min() requires all arguments to be numbers");
      }
    }
    const values = args.map((arg) => (arg as NumberValue).value);
    return ok({ type: ValueType.NUMBER, value: Math.min(...values) });
  }),
};

const max: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "max",
  call: syncCall((args: RuntimeValue[]) => {
    if (args.length === 0) {
      return runtimeError("max() requires at least 1 argument");
    }
    for (const arg of args) {
      if (arg.type !== ValueType.NUMBER) {
        return runtimeError("max() requires all arguments to be numbers");
      }
    }
    const values = args.map((arg) => (arg as NumberValue).value);
    return ok({ type: ValueType.NUMBER, value: Math.max(...values) });
  }),
};

/* create a global environment with built-in functions */
export function createGlobalEnv(): Environment {
  const global_env = new Environment();

  global_env.define("print", print);
  global_env.define("len", len);
  global_env.define("abs", abs);
  global_env.define("min", min);
  global_env.define("max", max);

  const json_object: ObjectValue = {
    type: ValueType.OBJECT,
    properties: new Map([
      ["parse", json_parse],
      ["stringify", json_stringify],
    ]),
  };
  global_env.define("json", json_object);

  global_env.define("schema", schema_namespace);
  global_env.define("http", createHttpNamespace());
  global_env.define("set", set_constructor);
  global_env.define("map", map_constructor);

  return global_env;
}
