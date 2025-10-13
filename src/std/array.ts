import {
  ArrayValue,
  BooleanValue,
  NullValue,
  NumberValue,
  RuntimeValue,
  StringValue,
  ValueType,
} from "@runtime";
import { ok, Result, runtimeError, typeError } from "../types/result.ts";

type CallFunction = (callee: RuntimeValue, args: RuntimeValue[]) => Promise<Result<RuntimeValue>>;
type IsTruthy = (value: RuntimeValue) => boolean;

export function createArrayMethods(
  callFunction: CallFunction,
  isTruthy: IsTruthy,
): Record<string, (arr: ArrayValue, ...args: RuntimeValue[]) => Promise<Result<RuntimeValue>>> {
  return {
    push: async (arr_val, elem_val) => {
      return ok({
        type: ValueType.ARRAY,
        elements: [...arr_val.elements, elem_val],
      } as ArrayValue);
    },
    pop: async (arr_val) => {
      if (arr_val.elements.length === 0) {
        return runtimeError("pop() called on empty array");
      }
      return ok({
        type: ValueType.ARRAY,
        elements: arr_val.elements.slice(0, -1),
      } as ArrayValue);
    },
    first: async (arr_val) => {
      if (arr_val.elements.length === 0) {
        return runtimeError("first() called on empty array");
      }
      return ok(arr_val.elements[0]);
    },
    last: async (arr_val) => {
      if (arr_val.elements.length === 0) {
        return runtimeError("last() called on empty array");
      }
      return ok(arr_val.elements[arr_val.elements.length - 1]);
    },
    slice: async (arr_val, start_val, end_val?) => {
      if (start_val.type !== ValueType.NUMBER) {
        return typeError(`slice() start index must be a number, got ${start_val.type}`);
      }
      const start_idx = Math.floor((start_val as NumberValue).value);
      let end_idx = arr_val.elements.length;
      if (end_val) {
        if (end_val.type !== ValueType.NUMBER) {
          return typeError(`slice() end index must be a number, got ${end_val.type}`);
        }
        end_idx = Math.floor((end_val as NumberValue).value);
      }
      return ok({
        type: ValueType.ARRAY,
        elements: arr_val.elements.slice(start_idx, end_idx),
      } as ArrayValue);
    },
    concat: async (arr_val, other_val) => {
      if (other_val.type !== ValueType.ARRAY) {
        return typeError(`concat() requires an array, got ${other_val.type}`);
      }
      return ok({
        type: ValueType.ARRAY,
        elements: [...arr_val.elements, ...(other_val as ArrayValue).elements],
      } as ArrayValue);
    },
    map: async (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`map() requires a function, got ${fn_val.type}`);
      }
      const mapped_elements: RuntimeValue[] = [];
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = await callFunction(fn_val, [arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
        mapped_elements.push(call_result.value);
      }
      return ok({
        type: ValueType.ARRAY,
        elements: mapped_elements,
      } as ArrayValue);
    },
    filter: async (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`filter() requires a function, got ${fn_val.type}`);
      }
      const filtered_elements: RuntimeValue[] = [];
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = await callFunction(fn_val, [arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
        if (isTruthy(call_result.value)) {
          filtered_elements.push(arr_val.elements[i]);
        }
      }
      return ok({
        type: ValueType.ARRAY,
        elements: filtered_elements,
      } as ArrayValue);
    },
    reduce: async (arr_val, fn_val, initial_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`reduce() requires a function, got ${fn_val.type}`);
      }
      if (!initial_val) {
        return runtimeError("reduce() requires an initial value");
      }
      let accumulator_val = initial_val;
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = await callFunction(fn_val, [accumulator_val, arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
        accumulator_val = call_result.value;
      }
      return ok(accumulator_val);
    },
    forEach: async (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`forEach() requires a function, got ${fn_val.type}`);
      }
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = await callFunction(fn_val, [arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
      }
      return ok({ type: ValueType.NULL } as NullValue);
    },
    find: async (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`find() requires a function, got ${fn_val.type}`);
      }
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = await callFunction(fn_val, [arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
        if (isTruthy(call_result.value)) {
          return ok(arr_val.elements[i]);
        }
      }
      return ok({ type: ValueType.NULL } as NullValue);
    },
    findIndex: async (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`findIndex() requires a function, got ${fn_val.type}`);
      }
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = await callFunction(fn_val, [arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
        if (isTruthy(call_result.value)) {
          return ok({ type: ValueType.NUMBER, value: i } as NumberValue);
        }
      }
      return ok({ type: ValueType.NUMBER, value: -1 } as NumberValue);
    },
    some: async (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`some() requires a function, got ${fn_val.type}`);
      }
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = await callFunction(fn_val, [arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
        if (isTruthy(call_result.value)) {
          return ok({ type: ValueType.BOOLEAN, value: true } as BooleanValue);
        }
      }
      return ok({ type: ValueType.BOOLEAN, value: false } as BooleanValue);
    },
    every: async (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`every() requires a function, got ${fn_val.type}`);
      }
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = await callFunction(fn_val, [arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
        if (!isTruthy(call_result.value)) {
          return ok({ type: ValueType.BOOLEAN, value: false } as BooleanValue);
        }
      }
      return ok({ type: ValueType.BOOLEAN, value: true } as BooleanValue);
    },
    flatMap: async (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`flatMap() requires a function, got ${fn_val.type}`);
      }
      const flattened_elements: RuntimeValue[] = [];
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = await callFunction(fn_val, [arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
        if (call_result.value.type === ValueType.ARRAY) {
          flattened_elements.push(...(call_result.value as ArrayValue).elements);
        } else {
          flattened_elements.push(call_result.value);
        }
      }
      return ok({
        type: ValueType.ARRAY,
        elements: flattened_elements,
      } as ArrayValue);
    },
    join: async (arr_val, separator_val?) => {
      const separator = separator_val && separator_val.type === ValueType.STRING
        ? (separator_val as StringValue).value
        : ",";

      const string_parts = arr_val.elements.map((elem) => {
        if (elem.type === ValueType.STRING) {
          return (elem as StringValue).value;
        } else if (elem.type === ValueType.NUMBER) {
          return String((elem as NumberValue).value);
        } else if (elem.type === ValueType.BOOLEAN) {
          return String((elem as BooleanValue).value);
        } else if (elem.type === ValueType.NULL) {
          return "null";
        } else {
          return "[object]";
        }
      });

      return ok({
        type: ValueType.STRING,
        value: string_parts.join(separator),
      } as StringValue);
    },
    reverse: async (arr_val) => {
      return ok({
        type: ValueType.ARRAY,
        elements: [...arr_val.elements].reverse(),
      } as ArrayValue);
    },
    sort: async (arr_val) => {
      const sorted = [...arr_val.elements].sort((a, b) => {
        if (a.type === ValueType.NUMBER && b.type === ValueType.NUMBER) {
          return (a as NumberValue).value - (b as NumberValue).value;
        }
        if (a.type === ValueType.STRING && b.type === ValueType.STRING) {
          const str_a = (a as StringValue).value;
          const str_b = (b as StringValue).value;
          return str_a < str_b ? -1 : str_a > str_b ? 1 : 0;
        }
        return 0;
      });

      return ok({
        type: ValueType.ARRAY,
        elements: sorted,
      } as ArrayValue);
    },
  };
}
