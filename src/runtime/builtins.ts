import { ok, runtimeError } from "../types/result.ts";
import { json_parse, json_stringify } from "../std/json.ts";
import { schema_namespace } from "../std/schema.ts";
import { createHttpNamespace } from "../std/http.ts";
import { Environment } from "./environment.ts";
import { NativeFunctionValue, ObjectValue, RuntimeValue, ValueType } from "./value.ts";

function printValue(value: RuntimeValue): string {
  switch (value.type) {
    case ValueType.NUMBER:
      return String((value as any).value);
    case ValueType.STRING:
      return (value as any).value;
    case ValueType.BOOLEAN:
      return String((value as any).value);
    case ValueType.NULL:
      return "null";
    case ValueType.ARRAY: {
      const elements = (value as any).elements.map(printValue);
      return `[${elements.join(", ")}]`;
    }
    case ValueType.OBJECT: {
      const entries = Array.from((value as any).properties.entries()) as Array<
        [string, RuntimeValue]
      >;
      const props = entries.map(([key, val]) => `${key}: ${printValue(val)}`);
      return `{${props.join(", ")}}`;
    }
    case ValueType.FUNCTION:
      return `<function ${(value as any).name}>`;
    case ValueType.NATIVE_FUNCTION:
      return `<native function ${(value as any).name}>`;
    default:
      return String(value);
  }
}

const print: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "print",
  call: async (args: RuntimeValue[]) => {
    const output_str = args.map(printValue).join(" ");
    console.log(output_str);
    return ok({ type: ValueType.NULL });
  },
};

const len: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "len",
  call: async (args: RuntimeValue[]) => {
    if (args.length !== 1) {
      return runtimeError("len() expects exactly 1 argument");
    }

    const arg_val = args[0];

    if (arg_val.type === ValueType.STRING) {
      return ok({ type: ValueType.NUMBER, value: (arg_val as any).value.length });
    }

    if (arg_val.type === ValueType.ARRAY) {
      return ok({ type: ValueType.NUMBER, value: (arg_val as any).elements.length });
    }

    return runtimeError(`len() requires a string or array, got ${arg_val.type}`);
  },
};

/* create a global environment with built-in functions */
export function createGlobalEnv(): Environment {
  const global_env = new Environment();

  global_env.define("print", print);
  global_env.define("len", len);

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

  return global_env;
}
