import { ok, Result, runtimeError } from "../types/result.ts";
import { NativeFunctionValue, NumberValue, RuntimeValue, ValueType } from "../runtime/value.ts";

const math_clamp: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "clamp",
  return_type: "number",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 3) {
      return runtimeError("MathError: clamp() requires exactly 3 arguments (value, min, max)");
    }
    if (
      args[0].type !== ValueType.NUMBER || args[1].type !== ValueType.NUMBER ||
      args[2].type !== ValueType.NUMBER
    ) {
      return runtimeError("MathError: clamp() requires all arguments to be numbers");
    }
    const value = (args[0] as NumberValue).value;
    const min = (args[1] as NumberValue).value;
    const max = (args[2] as NumberValue).value;

    if (min > max) {
      return runtimeError("MathError: clamp() min must be less than or equal to max");
    }

    const clamped = Math.min(Math.max(value, min), max);
    return ok({ type: ValueType.NUMBER, value: clamped } as NumberValue);
  },
};

const math_sqrt: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "sqrt",
  return_type: "number",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("MathError: sqrt() requires exactly 1 argument");
    }
    if (args[0].type !== ValueType.NUMBER) {
      return runtimeError("MathError: sqrt() requires a number argument");
    }
    const value = (args[0] as NumberValue).value;
    if (value < 0) {
      return runtimeError("MathError: sqrt() cannot compute square root of negative number");
    }
    return ok({ type: ValueType.NUMBER, value: Math.sqrt(value) } as NumberValue);
  },
};

const math_pow: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "pow",
  return_type: "number",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 2) {
      return runtimeError("MathError: pow() requires exactly 2 arguments (base, exponent)");
    }
    if (args[0].type !== ValueType.NUMBER || args[1].type !== ValueType.NUMBER) {
      return runtimeError("MathError: pow() requires both arguments to be numbers");
    }
    const base = (args[0] as NumberValue).value;
    const exponent = (args[1] as NumberValue).value;
    return ok({ type: ValueType.NUMBER, value: Math.pow(base, exponent) } as NumberValue);
  },
};

const math_exp: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "exp",
  return_type: "number",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("MathError: exp() requires exactly 1 argument");
    }
    if (args[0].type !== ValueType.NUMBER) {
      return runtimeError("MathError: exp() requires a number argument");
    }
    const value = (args[0] as NumberValue).value;
    return ok({ type: ValueType.NUMBER, value: Math.exp(value) } as NumberValue);
  },
};

const math_log: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "log",
  return_type: "number",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length < 1 || args.length > 2) {
      return runtimeError("MathError: log() requires 1 or 2 arguments (value, base?)");
    }
    if (args[0].type !== ValueType.NUMBER) {
      return runtimeError("MathError: log() requires a number argument");
    }
    const value = (args[0] as NumberValue).value;
    if (value <= 0) {
      return runtimeError("MathError: log() requires a positive number");
    }

    if (args.length === 2) {
      if (args[1].type !== ValueType.NUMBER) {
        return runtimeError("MathError: log() base must be a number");
      }
      const base = (args[1] as NumberValue).value;
      if (base <= 0 || base === 1) {
        return runtimeError("MathError: log() base must be positive and not equal to 1");
      }
      return ok({ type: ValueType.NUMBER, value: Math.log(value) / Math.log(base) } as NumberValue);
    }

    return ok({ type: ValueType.NUMBER, value: Math.log(value) } as NumberValue);
  },
};

const math_sign: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "sign",
  return_type: "number",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("MathError: sign() requires exactly 1 argument");
    }
    if (args[0].type !== ValueType.NUMBER) {
      return runtimeError("MathError: sign() requires a number argument");
    }
    const value = (args[0] as NumberValue).value;
    return ok({ type: ValueType.NUMBER, value: Math.sign(value) } as NumberValue);
  },
};

const math_round: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "round",
  return_type: "number",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("MathError: round() requires exactly 1 argument");
    }
    if (args[0].type !== ValueType.NUMBER) {
      return runtimeError("MathError: round() requires a number argument");
    }
    const value = (args[0] as NumberValue).value;
    return ok({ type: ValueType.NUMBER, value: Math.round(value) } as NumberValue);
  },
};

const math_floor: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "floor",
  return_type: "number",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("MathError: floor() requires exactly 1 argument");
    }
    if (args[0].type !== ValueType.NUMBER) {
      return runtimeError("MathError: floor() requires a number argument");
    }
    const value = (args[0] as NumberValue).value;
    return ok({ type: ValueType.NUMBER, value: Math.floor(value) } as NumberValue);
  },
};

const math_ceil: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "ceil",
  return_type: "number",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("MathError: ceil() requires exactly 1 argument");
    }
    if (args[0].type !== ValueType.NUMBER) {
      return runtimeError("MathError: ceil() requires a number argument");
    }
    const value = (args[0] as NumberValue).value;
    return ok({ type: ValueType.NUMBER, value: Math.ceil(value) } as NumberValue);
  },
};

const math_trunc: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "trunc",
  return_type: "number",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("MathError: trunc() requires exactly 1 argument");
    }
    if (args[0].type !== ValueType.NUMBER) {
      return runtimeError("MathError: trunc() requires a number argument");
    }
    const value = (args[0] as NumberValue).value;
    return ok({ type: ValueType.NUMBER, value: Math.trunc(value) } as NumberValue);
  },
};

const math_random: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "random",
  return_type: "number",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 0) {
      return runtimeError("MathError: random() requires no arguments");
    }
    return ok({ type: ValueType.NUMBER, value: Math.random() } as NumberValue);
  },
};

export const math_namespace: Record<string, RuntimeValue> = {
  pi: { type: ValueType.NUMBER, value: Math.PI } as NumberValue,
  e: { type: ValueType.NUMBER, value: Math.E } as NumberValue,
  infty: { type: ValueType.NUMBER, value: Infinity } as NumberValue,
  clamp: math_clamp,
  sqrt: math_sqrt,
  pow: math_pow,
  exp: math_exp,
  log: math_log,
  sign: math_sign,
  round: math_round,
  floor: math_floor,
  ceil: math_ceil,
  trunc: math_trunc,
  random: math_random,
};
