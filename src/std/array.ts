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

type CallFunction = (callee: RuntimeValue, args: RuntimeValue[]) => Result<RuntimeValue>;
type IsTruthy = (value: RuntimeValue) => boolean;

export function createArrayMethods(
  callFunction: CallFunction,
  isTruthy: IsTruthy,
): Record<string, (arr: ArrayValue, ...args: RuntimeValue[]) => Result<RuntimeValue>> {
  return {
    push: (arr_val, elem_val) => {
      return ok({
        type: ValueType.ARRAY,
        elements: [...arr_val.elements, elem_val],
      } as ArrayValue);
    },
    pop: (arr_val) => {
      if (arr_val.elements.length === 0) {
        return runtimeError("pop() called on empty array");
      }
      return ok({
        type: ValueType.ARRAY,
        elements: arr_val.elements.slice(0, -1),
      } as ArrayValue);
    },
    first: (arr_val) => {
      if (arr_val.elements.length === 0) {
        return runtimeError("first() called on empty array");
      }
      return ok(arr_val.elements[0]);
    },
    last: (arr_val) => {
      if (arr_val.elements.length === 0) {
        return runtimeError("last() called on empty array");
      }
      return ok(arr_val.elements[arr_val.elements.length - 1]);
    },
    slice: (arr_val, start_val, end_val?) => {
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
    concat: (arr_val, other_val) => {
      if (other_val.type !== ValueType.ARRAY) {
        return typeError(`concat() requires an array, got ${other_val.type}`);
      }
      return ok({
        type: ValueType.ARRAY,
        elements: [...arr_val.elements, ...(other_val as ArrayValue).elements],
      } as ArrayValue);
    },
    map: (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`map() requires a function, got ${fn_val.type}`);
      }
      const mapped_elements: RuntimeValue[] = [];
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = callFunction(fn_val, [arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
        mapped_elements.push(call_result.value);
      }
      return ok({
        type: ValueType.ARRAY,
        elements: mapped_elements,
      } as ArrayValue);
    },
    filter: (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`filter() requires a function, got ${fn_val.type}`);
      }
      const filtered_elements: RuntimeValue[] = [];
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = callFunction(fn_val, [arr_val.elements[i]]);
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
    reduce: (arr_val, fn_val, initial_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`reduce() requires a function, got ${fn_val.type}`);
      }
      if (!initial_val) {
        return runtimeError("reduce() requires an initial value");
      }
      let accumulator_val = initial_val;
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = callFunction(fn_val, [accumulator_val, arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
        accumulator_val = call_result.value;
      }
      return ok(accumulator_val);
    },
    forEach: (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`forEach() requires a function, got ${fn_val.type}`);
      }
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = callFunction(fn_val, [arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
      }
      return ok({ type: ValueType.NULL } as NullValue);
    },
    find: (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`find() requires a function, got ${fn_val.type}`);
      }
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = callFunction(fn_val, [arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
        if (isTruthy(call_result.value)) {
          return ok(arr_val.elements[i]);
        }
      }
      return ok({ type: ValueType.NULL } as NullValue);
    },
    findIndex: (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`findIndex() requires a function, got ${fn_val.type}`);
      }
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = callFunction(fn_val, [arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
        if (isTruthy(call_result.value)) {
          return ok({ type: ValueType.NUMBER, value: i } as NumberValue);
        }
      }
      return ok({ type: ValueType.NUMBER, value: -1 } as NumberValue);
    },
    some: (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`some() requires a function, got ${fn_val.type}`);
      }
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = callFunction(fn_val, [arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
        if (isTruthy(call_result.value)) {
          return ok({ type: ValueType.BOOLEAN, value: true } as BooleanValue);
        }
      }
      return ok({ type: ValueType.BOOLEAN, value: false } as BooleanValue);
    },
    every: (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`every() requires a function, got ${fn_val.type}`);
      }
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = callFunction(fn_val, [arr_val.elements[i]]);
        if (!call_result.ok) return call_result;
        if (!isTruthy(call_result.value)) {
          return ok({ type: ValueType.BOOLEAN, value: false } as BooleanValue);
        }
      }
      return ok({ type: ValueType.BOOLEAN, value: true } as BooleanValue);
    },
    flatMap: (arr_val, fn_val) => {
      if (fn_val.type !== ValueType.FUNCTION && fn_val.type !== ValueType.NATIVE_FUNCTION) {
        return typeError(`flatMap() requires a function, got ${fn_val.type}`);
      }
      const flattened_elements: RuntimeValue[] = [];
      for (let i = 0; i < arr_val.elements.length; i++) {
        const call_result = callFunction(fn_val, [arr_val.elements[i]]);
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
    join: (arr_val, separator_val?) => {
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
    reverse: (arr_val) => {
      return ok({
        type: ValueType.ARRAY,
        elements: [...arr_val.elements].reverse(),
      } as ArrayValue);
    },
  };
}
