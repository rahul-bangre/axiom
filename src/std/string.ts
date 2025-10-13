import { ArrayValue, NumberValue, RuntimeValue, StringValue, ValueType } from "@runtime";
import { ok, Result, runtimeError, typeError } from "../types/result.ts";

type CallFunction = (callee: RuntimeValue, args: RuntimeValue[]) => Promise<Result<RuntimeValue>>;

export function createStringMethods(
  _callFunction: CallFunction,
): Record<string, (str: StringValue, ...args: RuntimeValue[]) => Promise<Result<RuntimeValue>>> {
  return {
    split: async (str_val, delimiter_val?) => {
      const str = str_val.value;

      if (!delimiter_val) {
        return ok({
          type: ValueType.ARRAY,
          elements: str.split("").map((
            char,
          ) => ({ type: ValueType.STRING, value: char } as StringValue)),
        } as ArrayValue);
      }

      if (delimiter_val.type !== ValueType.STRING) {
        return typeError(`split() delimiter must be a string, got ${delimiter_val.type}`);
      }

      const delimiter = (delimiter_val as StringValue).value;
      const parts = str.split(delimiter);

      return ok({
        type: ValueType.ARRAY,
        elements: parts.map((part) => ({ type: ValueType.STRING, value: part } as StringValue)),
      } as ArrayValue);
    },

    trim: async (str_val) => {
      return ok({ type: ValueType.STRING, value: str_val.value.trim() } as StringValue);
    },

    trimStart: async (str_val) => {
      return ok({ type: ValueType.STRING, value: str_val.value.trimStart() } as StringValue);
    },

    trimEnd: async (str_val) => {
      return ok({ type: ValueType.STRING, value: str_val.value.trimEnd() } as StringValue);
    },

    toUpperCase: async (str_val) => {
      return ok({ type: ValueType.STRING, value: str_val.value.toUpperCase() } as StringValue);
    },

    toLowerCase: async (str_val) => {
      return ok({ type: ValueType.STRING, value: str_val.value.toLowerCase() } as StringValue);
    },

    replace: async (str_val, search_val, replace_val) => {
      if (search_val.type !== ValueType.STRING) {
        return typeError(`replace() search argument must be a string, got ${search_val.type}`);
      }
      if (replace_val.type !== ValueType.STRING) {
        return typeError(`replace() replacement must be a string, got ${replace_val.type}`);
      }

      const str = str_val.value;
      const search = (search_val as StringValue).value;
      const replacement = (replace_val as StringValue).value;

      return ok({
        type: ValueType.STRING,
        value: str.replace(search, replacement),
      } as StringValue);
    },

    replaceAll: async (str_val, search_val, replace_val) => {
      if (search_val.type !== ValueType.STRING) {
        return typeError(`replaceAll() search argument must be a string, got ${search_val.type}`);
      }
      if (replace_val.type !== ValueType.STRING) {
        return typeError(`replaceAll() replacement must be a string, got ${replace_val.type}`);
      }

      const str = str_val.value;
      const search = (search_val as StringValue).value;
      const replacement = (replace_val as StringValue).value;

      return ok({
        type: ValueType.STRING,
        value: str.replaceAll(search, replacement),
      } as StringValue);
    },

    startsWith: async (str_val, prefix_val) => {
      if (prefix_val.type !== ValueType.STRING) {
        return typeError(`startsWith() argument must be a string, got ${prefix_val.type}`);
      }

      const str = str_val.value;
      const prefix = (prefix_val as StringValue).value;

      return ok({
        type: ValueType.BOOLEAN,
        value: str.startsWith(prefix),
      });
    },

    endsWith: async (str_val, suffix_val) => {
      if (suffix_val.type !== ValueType.STRING) {
        return typeError(`endsWith() argument must be a string, got ${suffix_val.type}`);
      }

      const str = str_val.value;
      const suffix = (suffix_val as StringValue).value;

      return ok({
        type: ValueType.BOOLEAN,
        value: str.endsWith(suffix),
      });
    },

    includes: async (str_val, search_val) => {
      if (search_val.type !== ValueType.STRING) {
        return typeError(`includes() argument must be a string, got ${search_val.type}`);
      }

      const str = str_val.value;
      const search = (search_val as StringValue).value;

      return ok({
        type: ValueType.BOOLEAN,
        value: str.includes(search),
      });
    },

    indexOf: async (str_val, search_val) => {
      if (search_val.type !== ValueType.STRING) {
        return typeError(`indexOf() argument must be a string, got ${search_val.type}`);
      }

      const str = str_val.value;
      const search = (search_val as StringValue).value;

      return ok({
        type: ValueType.NUMBER,
        value: str.indexOf(search),
      } as NumberValue);
    },

    lastIndexOf: async (str_val, search_val) => {
      if (search_val.type !== ValueType.STRING) {
        return typeError(`lastIndexOf() argument must be a string, got ${search_val.type}`);
      }

      const str = str_val.value;
      const search = (search_val as StringValue).value;

      return ok({
        type: ValueType.NUMBER,
        value: str.lastIndexOf(search),
      } as NumberValue);
    },

    substring: async (str_val, start_val, end_val?) => {
      if (start_val.type !== ValueType.NUMBER) {
        return typeError(`substring() start must be a number, got ${start_val.type}`);
      }

      const str = str_val.value;
      const start = Math.floor((start_val as NumberValue).value);

      if (!end_val) {
        return ok({ type: ValueType.STRING, value: str.substring(start) } as StringValue);
      }

      if (end_val.type !== ValueType.NUMBER) {
        return typeError(`substring() end must be a number, got ${end_val.type}`);
      }

      const end = Math.floor((end_val as NumberValue).value);

      return ok({ type: ValueType.STRING, value: str.substring(start, end) } as StringValue);
    },

    charAt: async (str_val, index_val) => {
      if (index_val.type !== ValueType.NUMBER) {
        return typeError(`charAt() index must be a number, got ${index_val.type}`);
      }

      const str = str_val.value;
      const index = Math.floor((index_val as NumberValue).value);

      if (index < 0 || index >= str.length) {
        return runtimeError(`String index out of bounds: ${index}`);
      }

      return ok({ type: ValueType.STRING, value: str.charAt(index) } as StringValue);
    },

    repeat: async (str_val, count_val) => {
      if (count_val.type !== ValueType.NUMBER) {
        return typeError(`repeat() count must be a number, got ${count_val.type}`);
      }

      const count = Math.floor((count_val as NumberValue).value);

      if (count < 0) {
        return runtimeError(`repeat() count must be non-negative, got ${count}`);
      }

      return ok({
        type: ValueType.STRING,
        value: str_val.value.repeat(count),
      } as StringValue);
    },

    padStart: async (str_val, length_val, pad_val?) => {
      if (length_val.type !== ValueType.NUMBER) {
        return typeError(`padStart() length must be a number, got ${length_val.type}`);
      }

      const target_length = Math.floor((length_val as NumberValue).value);
      const pad_string = pad_val && pad_val.type === ValueType.STRING
        ? (pad_val as StringValue).value
        : " ";

      return ok({
        type: ValueType.STRING,
        value: str_val.value.padStart(target_length, pad_string),
      } as StringValue);
    },

    padEnd: async (str_val, length_val, pad_val?) => {
      if (length_val.type !== ValueType.NUMBER) {
        return typeError(`padEnd() length must be a number, got ${length_val.type}`);
      }

      const target_length = Math.floor((length_val as NumberValue).value);
      const pad_string = pad_val && pad_val.type === ValueType.STRING
        ? (pad_val as StringValue).value
        : " ";

      return ok({
        type: ValueType.STRING,
        value: str_val.value.padEnd(target_length, pad_string),
      } as StringValue);
    },
  };
}
