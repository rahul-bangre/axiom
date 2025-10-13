import { ok, Result, runtimeError } from "../types/result.ts";
import type { NativeFunctionValue, RuntimeValue, StringValue } from "../runtime/value.ts";
import { ValueType } from "../runtime/value.ts";
import { jsToRuntimeValue } from "./json.ts";

const fs_read: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "read",
  return_type: "async string",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("fs.read() requires exactly 1 argument (path)");
    }

    const path_arg = args[0];
    if (path_arg.type !== ValueType.STRING) {
      return runtimeError("fs.read() path must be a string");
    }

    const path = (path_arg as StringValue).value;

    try {
      const content = await Deno.readTextFile(path);
      return ok({ type: ValueType.STRING, value: content } as StringValue);
    } catch (error) {
      const error_msg = error instanceof Error ? error.message : String(error);
      return runtimeError(`Failed to read file '${path}': ${error_msg}`);
    }
  },
};

const fs_write: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "write",
  return_type: "async null",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 2) {
      return runtimeError("fs.write() requires exactly 2 arguments (path, content)");
    }

    const path_arg = args[0];
    const content_arg = args[1];

    if (path_arg.type !== ValueType.STRING) {
      return runtimeError("fs.write() path must be a string");
    }

    if (content_arg.type !== ValueType.STRING) {
      return runtimeError("fs.write() content must be a string");
    }

    const path = (path_arg as StringValue).value;
    const content = (content_arg as StringValue).value;

    try {
      await Deno.writeTextFile(path, content);
      return ok({ type: ValueType.NULL });
    } catch (error) {
      const error_msg = error instanceof Error ? error.message : String(error);
      return runtimeError(`Failed to write file '${path}': ${error_msg}`);
    }
  },
};

const fs_exists: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "exists",
  return_type: "async bool",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("fs.exists() requires exactly 1 argument (path)");
    }

    const path_arg = args[0];
    if (path_arg.type !== ValueType.STRING) {
      return runtimeError("fs.exists() path must be a string");
    }

    const path = (path_arg as StringValue).value;

    try {
      await Deno.stat(path);
      return ok({ type: ValueType.BOOLEAN, value: true });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        return ok({ type: ValueType.BOOLEAN, value: false });
      }
      const error_msg = error instanceof Error ? error.message : String(error);
      return runtimeError(`Failed to check if file exists '${path}': ${error_msg}`);
    }
  },
};

const fs_append: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "append",
  return_type: "async null",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 2) {
      return runtimeError("fs.append() requires exactly 2 arguments (path, content)");
    }

    const path_arg = args[0];
    const content_arg = args[1];

    if (path_arg.type !== ValueType.STRING) {
      return runtimeError("fs.append() path must be a string");
    }

    if (content_arg.type !== ValueType.STRING) {
      return runtimeError("fs.append() content must be a string");
    }

    const path = (path_arg as StringValue).value;
    const content = (content_arg as StringValue).value;

    try {
      await Deno.writeTextFile(path, content, { append: true });
      return ok({ type: ValueType.NULL });
    } catch (error) {
      const error_msg = error instanceof Error ? error.message : String(error);
      return runtimeError(`Failed to append to file '${path}': ${error_msg}`);
    }
  },
};

const fs_delete: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "delete",
  return_type: "async null",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("fs.delete() requires exactly 1 argument (path)");
    }

    const path_arg = args[0];
    if (path_arg.type !== ValueType.STRING) {
      return runtimeError("fs.delete() path must be a string");
    }

    const path = (path_arg as StringValue).value;

    try {
      await Deno.remove(path);
      return ok({ type: ValueType.NULL });
    } catch (error) {
      const error_msg = error instanceof Error ? error.message : String(error);
      return runtimeError(`Failed to delete file '${path}': ${error_msg}`);
    }
  },
};

const fs_readLines: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "readLines",
  return_type: "async array",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("fs.readLines() requires exactly 1 argument (path)");
    }

    const path_arg = args[0];
    if (path_arg.type !== ValueType.STRING) {
      return runtimeError("fs.readLines() path must be a string");
    }

    const path = (path_arg as StringValue).value;

    try {
      const content = await Deno.readTextFile(path);
      const lines = content.split("\n");
      const line_values = lines.map((
        line,
      ) => ({ type: ValueType.STRING, value: line } as StringValue));
      return ok({ type: ValueType.ARRAY, elements: line_values });
    } catch (error) {
      const error_msg = error instanceof Error ? error.message : String(error);
      return runtimeError(`Failed to read lines from file '${path}': ${error_msg}`);
    }
  },
};

const fs_readJson: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "readJson",
  return_type: "async object",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("fs.readJson() requires exactly 1 argument (path)");
    }

    const path_arg = args[0];
    if (path_arg.type !== ValueType.STRING) {
      return runtimeError("fs.readJson() path must be a string");
    }

    const path = (path_arg as StringValue).value;

    try {
      const content = await Deno.readTextFile(path);
      const parsed = JSON.parse(content);
      return ok(jsToRuntimeValue(parsed));
    } catch (error) {
      const error_msg = error instanceof Error ? error.message : String(error);
      return runtimeError(`Failed to read JSON from file '${path}': ${error_msg}`);
    }
  },
};

const fs_writeJson: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "writeJson",
  return_type: "async null",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length < 2 || args.length > 3) {
      return runtimeError("fs.writeJson() requires 2-3 arguments (path, data, indent?)");
    }

    const path_arg = args[0];
    const data_arg = args[1];
    const indent_arg = args.length === 3 ? args[2] : null;

    if (path_arg.type !== ValueType.STRING) {
      return runtimeError("fs.writeJson() path must be a string");
    }

    const path = (path_arg as StringValue).value;

    let indent: number | undefined = undefined;
    if (indent_arg && indent_arg.type === ValueType.NUMBER) {
      indent = (indent_arg as any).value;
    }

    try {
      const runtimeToJs = (val: RuntimeValue): any => {
        switch (val.type) {
          case ValueType.NULL:
            return null;
          case ValueType.BOOLEAN:
            return (val as any).value;
          case ValueType.NUMBER:
            return (val as any).value;
          case ValueType.STRING:
            return (val as any).value;
          case ValueType.ARRAY:
            return (val as any).elements.map(runtimeToJs);
          case ValueType.OBJECT: {
            const obj: Record<string, any> = {};
            for (const [key, value] of (val as any).properties) {
              obj[key] = runtimeToJs(value);
            }
            return obj;
          }
          default:
            throw new Error(`Cannot convert type ${val.type} to JSON`);
        }
      };

      const js_value = runtimeToJs(data_arg);
      const json_string = JSON.stringify(js_value, null, indent);
      await Deno.writeTextFile(path, json_string);
      return ok({ type: ValueType.NULL });
    } catch (error) {
      const error_msg = error instanceof Error ? error.message : String(error);
      return runtimeError(`Failed to write JSON to file '${path}': ${error_msg}`);
    }
  },
};

export const fs_namespace = {
  read: fs_read,
  write: fs_write,
  exists: fs_exists,
  append: fs_append,
  delete: fs_delete,
  readLines: fs_readLines,
  readJson: fs_readJson,
  writeJson: fs_writeJson,
};
