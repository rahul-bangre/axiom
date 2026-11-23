import { ok, Result, runtimeError, typeError } from "../types/result.ts";
import type {
  ArrayValue,
  BooleanValue,
  NativeFunctionValue,
  NumberValue,
  ObjectValue,
  RuntimeValue,
  StringValue,
} from "../runtime/value.ts";
import { syncCall, ValueType } from "../runtime/value.ts";
import { HAMT, hamtHandle } from "./hamt.ts";

class AxiomMap {
  constructor(private readonly hamt: HAMT) {}

  static empty(): AxiomMap {
    return new AxiomMap(HAMT.empty());
  }

  static fromObject(obj: ObjectValue): AxiomMap {
    let hamt = HAMT.empty();
    for (const [key, value] of obj.properties.entries()) {
      const key_value: StringValue = { type: ValueType.STRING, value: key };
      hamt = hamt.set(key_value, value);
    }
    return new AxiomMap(hamt);
  }

  set(key: RuntimeValue, value: RuntimeValue): AxiomMap {
    return new AxiomMap(this.hamt.set(key, value));
  }

  get(key: RuntimeValue): RuntimeValue | undefined {
    return this.hamt.get(key);
  }

  delete(key: RuntimeValue): AxiomMap {
    return new AxiomMap(this.hamt.delete(key));
  }

  has(key: RuntimeValue): boolean {
    return this.hamt.has(key);
  }

  size(): number {
    return this.hamt.size;
  }

  keys(): RuntimeValue[] {
    return Array.from(this.hamt.keys());
  }

  values(): RuntimeValue[] {
    return Array.from(this.hamt.values());
  }

  entries(): Array<[RuntimeValue, RuntimeValue]> {
    return Array.from(this.hamt.entries());
  }

  toRuntimeValue(): ObjectValue {
    const set_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "set",
      call: syncCall((args: RuntimeValue[]): Result<RuntimeValue> => {
        if (args.length !== 2) {
          return runtimeError("Map.set() expects exactly 2 arguments (key, value)");
        }
        return ok(this.set(args[0], args[1]).toRuntimeValue());
      }),
    };

    const get_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "get",
      call: syncCall((args: RuntimeValue[]): Result<RuntimeValue> => {
        if (args.length !== 1) {
          return runtimeError("Map.get() expects exactly 1 argument");
        }
        const value = this.get(args[0]);
        return ok(value || { type: ValueType.NULL });
      }),
    };

    const delete_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "delete",
      call: syncCall((args: RuntimeValue[]): Result<RuntimeValue> => {
        if (args.length !== 1) {
          return runtimeError("Map.delete() expects exactly 1 argument");
        }
        return ok(this.delete(args[0]).toRuntimeValue());
      }),
    };

    const has_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "has",
      call: syncCall((args: RuntimeValue[]): Result<RuntimeValue> => {
        if (args.length !== 1) {
          return runtimeError("Map.has() expects exactly 1 argument");
        }
        return ok({ type: ValueType.BOOLEAN, value: this.has(args[0]) } as BooleanValue);
      }),
    };

    const size_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "size",
      call: syncCall((): Result<RuntimeValue> => {
        return ok({ type: ValueType.NUMBER, value: this.size() } as NumberValue);
      }),
    };

    const keys_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "keys",
      call: syncCall((): Result<RuntimeValue> => {
        return ok({
          type: ValueType.ARRAY,
          elements: this.keys(),
        } as ArrayValue);
      }),
    };

    const values_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "values",
      call: syncCall((): Result<RuntimeValue> => {
        return ok({
          type: ValueType.ARRAY,
          elements: this.values(),
        } as ArrayValue);
      }),
    };

    const entries_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "entries",
      call: syncCall((): Result<RuntimeValue> => {
        const entries_array = this.entries().map(([key, value]) => ({
          type: ValueType.ARRAY,
          elements: [key, value],
        } as ArrayValue));

        return ok({
          type: ValueType.ARRAY,
          elements: entries_array,
        } as ArrayValue);
      }),
    };

    const properties = new Map<string, RuntimeValue>();
    properties.set("set", set_method);
    properties.set("get", get_method);
    properties.set("delete", delete_method);
    properties.set("has", has_method);
    properties.set("size", size_method);
    properties.set("keys", keys_method);
    properties.set("values", values_method);
    properties.set("entries", entries_method);
    properties.set("__hamt__", hamtHandle(this.hamt));

    return {
      type: ValueType.OBJECT,
      properties,
    };
  }
}

export const map_constructor: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "Map",
  call: syncCall((args: RuntimeValue[]): Result<RuntimeValue> => {
    if (args.length === 0) {
      return ok(AxiomMap.empty().toRuntimeValue());
    }

    if (args.length !== 1) {
      return runtimeError("Map() expects 0 or 1 argument");
    }

    const arg = args[0];
    if (arg.type !== ValueType.OBJECT) {
      return typeError("Map() requires an object argument");
    }

    return ok(AxiomMap.fromObject(arg as ObjectValue).toRuntimeValue());
  }),
};
