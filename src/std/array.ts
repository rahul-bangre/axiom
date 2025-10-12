import {
  ArrayValue,
  BooleanValue,
  NullValue,
  NumberValue,
  RuntimeError,
  RuntimeValue,
  TypeError,
  ValueType,
} from "@runtime";

type CallFunction = (callee: RuntimeValue, args: RuntimeValue[]) => RuntimeValue;
type IsTruthy = (value: RuntimeValue) => boolean;

export function createArrayMethods(
  callFunction: CallFunction,
  isTruthy: IsTruthy,
): Record<string, (arr: ArrayValue, ...args: RuntimeValue[]) => RuntimeValue> {
  return {
    push: (arr, elem) => {
      return {
        type: ValueType.ARRAY,
        elements: [...arr.elements, elem],
      } as ArrayValue;
    },
    pop: (arr) => {
      if (arr.elements.length === 0) {
        throw new RuntimeError("pop() called on empty array");
      }
      return {
        type: ValueType.ARRAY,
        elements: arr.elements.slice(0, -1),
      } as ArrayValue;
    },
    first: (arr) => {
      if (arr.elements.length === 0) {
        throw new RuntimeError("first() called on empty array");
      }
      return arr.elements[0];
    },
    last: (arr) => {
      if (arr.elements.length === 0) {
        throw new RuntimeError("last() called on empty array");
      }
      return arr.elements[arr.elements.length - 1];
    },
    slice: (arr, start_val, end_val?) => {
      if (start_val.type !== ValueType.NUMBER) {
        throw new TypeError(`slice() start index must be a number, got ${start_val.type}`);
      }
      const start = Math.floor((start_val as NumberValue).value);
      let end = arr.elements.length;
      if (end_val) {
        if (end_val.type !== ValueType.NUMBER) {
          throw new TypeError(`slice() end index must be a number, got ${end_val.type}`);
        }
        end = Math.floor((end_val as NumberValue).value);
      }
      return {
        type: ValueType.ARRAY,
        elements: arr.elements.slice(start, end),
      } as ArrayValue;
    },
    concat: (arr, other) => {
      if (other.type !== ValueType.ARRAY) {
        throw new TypeError(`concat() requires an array, got ${other.type}`);
      }
      return {
        type: ValueType.ARRAY,
        elements: [...arr.elements, ...(other as ArrayValue).elements],
      } as ArrayValue;
    },
    map: (arr, fn) => {
      if (fn.type !== ValueType.FUNCTION && fn.type !== ValueType.NATIVE_FUNCTION) {
        throw new TypeError(`map() requires a function, got ${fn.type}`);
      }
      const mapped_elements: RuntimeValue[] = [];
      for (let i = 0; i < arr.elements.length; i++) {
        const result = callFunction(fn, [arr.elements[i]]);
        mapped_elements.push(result);
      }
      return {
        type: ValueType.ARRAY,
        elements: mapped_elements,
      } as ArrayValue;
    },
    filter: (arr, fn) => {
      if (fn.type !== ValueType.FUNCTION && fn.type !== ValueType.NATIVE_FUNCTION) {
        throw new TypeError(`filter() requires a function, got ${fn.type}`);
      }
      const filtered_elements: RuntimeValue[] = [];
      for (let i = 0; i < arr.elements.length; i++) {
        const result = callFunction(fn, [arr.elements[i]]);
        if (isTruthy(result)) {
          filtered_elements.push(arr.elements[i]);
        }
      }
      return {
        type: ValueType.ARRAY,
        elements: filtered_elements,
      } as ArrayValue;
    },
    reduce: (arr, fn, initial) => {
      if (fn.type !== ValueType.FUNCTION && fn.type !== ValueType.NATIVE_FUNCTION) {
        throw new TypeError(`reduce() requires a function, got ${fn.type}`);
      }
      if (!initial) {
        throw new RuntimeError("reduce() requires an initial value");
      }
      let accumulator = initial;
      for (let i = 0; i < arr.elements.length; i++) {
        accumulator = callFunction(fn, [accumulator, arr.elements[i]]);
      }
      return accumulator;
    },
    forEach: (arr, fn) => {
      if (fn.type !== ValueType.FUNCTION && fn.type !== ValueType.NATIVE_FUNCTION) {
        throw new TypeError(`forEach() requires a function, got ${fn.type}`);
      }
      for (let i = 0; i < arr.elements.length; i++) {
        callFunction(fn, [arr.elements[i]]);
      }
      return { type: ValueType.NULL } as NullValue;
    },
    find: (arr, fn) => {
      if (fn.type !== ValueType.FUNCTION && fn.type !== ValueType.NATIVE_FUNCTION) {
        throw new TypeError(`find() requires a function, got ${fn.type}`);
      }
      for (let i = 0; i < arr.elements.length; i++) {
        const result = callFunction(fn, [arr.elements[i]]);
        if (isTruthy(result)) {
          return arr.elements[i];
        }
      }
      return { type: ValueType.NULL } as NullValue;
    },
    findIndex: (arr, fn) => {
      if (fn.type !== ValueType.FUNCTION && fn.type !== ValueType.NATIVE_FUNCTION) {
        throw new TypeError(`findIndex() requires a function, got ${fn.type}`);
      }
      for (let i = 0; i < arr.elements.length; i++) {
        const result = callFunction(fn, [arr.elements[i]]);
        if (isTruthy(result)) {
          return { type: ValueType.NUMBER, value: i } as NumberValue;
        }
      }
      return { type: ValueType.NUMBER, value: -1 } as NumberValue;
    },
    some: (arr, fn) => {
      if (fn.type !== ValueType.FUNCTION && fn.type !== ValueType.NATIVE_FUNCTION) {
        throw new TypeError(`some() requires a function, got ${fn.type}`);
      }
      for (let i = 0; i < arr.elements.length; i++) {
        const result = callFunction(fn, [arr.elements[i]]);
        if (isTruthy(result)) {
          return { type: ValueType.BOOLEAN, value: true } as BooleanValue;
        }
      }
      return { type: ValueType.BOOLEAN, value: false } as BooleanValue;
    },
    every: (arr, fn) => {
      if (fn.type !== ValueType.FUNCTION && fn.type !== ValueType.NATIVE_FUNCTION) {
        throw new TypeError(`every() requires a function, got ${fn.type}`);
      }
      for (let i = 0; i < arr.elements.length; i++) {
        const result = callFunction(fn, [arr.elements[i]]);
        if (!isTruthy(result)) {
          return { type: ValueType.BOOLEAN, value: false } as BooleanValue;
        }
      }
      return { type: ValueType.BOOLEAN, value: true } as BooleanValue;
    },
    flatMap: (arr, fn) => {
      if (fn.type !== ValueType.FUNCTION && fn.type !== ValueType.NATIVE_FUNCTION) {
        throw new TypeError(`flatMap() requires a function, got ${fn.type}`);
      }
      const flattened_elements: RuntimeValue[] = [];
      for (let i = 0; i < arr.elements.length; i++) {
        const result = callFunction(fn, [arr.elements[i]]);
        if (result.type === ValueType.ARRAY) {
          flattened_elements.push(...(result as ArrayValue).elements);
        } else {
          flattened_elements.push(result);
        }
      }
      return {
        type: ValueType.ARRAY,
        elements: flattened_elements,
      } as ArrayValue;
    },
  };
}
