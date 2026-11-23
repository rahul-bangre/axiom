import { ok, Result, runtimeError, typeError } from "../types/result.ts";
import type {
  ArrayValue,
  BooleanValue,
  NativeFunctionValue,
  NumberValue,
  ObjectValue,
  RuntimeValue,
} from "../runtime/value.ts";
import { syncCall, ValueType } from "../runtime/value.ts";
import { HAMT, hamtFromHandle, hamtHandle } from "./hamt.ts";

const DUMMY_VALUE: RuntimeValue = { type: ValueType.NULL };

class AxiomSet {
  constructor(private readonly hamt: HAMT) {}

  static empty(): AxiomSet {
    return new AxiomSet(HAMT.empty());
  }

  static fromArray(elements: RuntimeValue[]): AxiomSet {
    let hamt = HAMT.empty();
    for (const element of elements) {
      hamt = hamt.set(element, DUMMY_VALUE);
    }
    return new AxiomSet(hamt);
  }

  add(value: RuntimeValue): AxiomSet {
    return new AxiomSet(this.hamt.set(value, DUMMY_VALUE));
  }

  delete(value: RuntimeValue): AxiomSet {
    return new AxiomSet(this.hamt.delete(value));
  }

  has(value: RuntimeValue): boolean {
    return this.hamt.has(value);
  }

  size(): number {
    return this.hamt.size;
  }

  toArray(): RuntimeValue[] {
    return Array.from(this.hamt.keys());
  }

  union(other: AxiomSet): AxiomSet {
    let result = this.hamt;
    for (const key of other.hamt.keys()) {
      result = result.set(key, DUMMY_VALUE);
    }
    return new AxiomSet(result);
  }

  intersection(other: AxiomSet): AxiomSet {
    let result = HAMT.empty();
    for (const key of this.hamt.keys()) {
      if (other.has(key)) {
        result = result.set(key, DUMMY_VALUE);
      }
    }
    return new AxiomSet(result);
  }

  difference(other: AxiomSet): AxiomSet {
    let result = this.hamt;
    for (const key of other.hamt.keys()) {
      result = result.delete(key);
    }
    return new AxiomSet(result);
  }

  toRuntimeValue(): ObjectValue {
    const add_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "add",
      call: syncCall((args: RuntimeValue[]): Result<RuntimeValue> => {
        if (args.length !== 1) {
          return runtimeError("Set.add() expects exactly 1 argument");
        }
        return ok(this.add(args[0]).toRuntimeValue());
      }),
    };

    const delete_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "delete",
      call: syncCall((args: RuntimeValue[]): Result<RuntimeValue> => {
        if (args.length !== 1) {
          return runtimeError("Set.delete() expects exactly 1 argument");
        }
        return ok(this.delete(args[0]).toRuntimeValue());
      }),
    };

    const has_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "has",
      call: syncCall((args: RuntimeValue[]): Result<RuntimeValue> => {
        if (args.length !== 1) {
          return runtimeError("Set.has() expects exactly 1 argument");
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

    const union_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "union",
      call: syncCall((args: RuntimeValue[]): Result<RuntimeValue> => {
        if (args.length !== 1) {
          return runtimeError("Set.union() expects exactly 1 argument");
        }
        if (args[0].type !== ValueType.OBJECT) {
          return typeError("Set.union() requires a Set argument");
        }
        const other_set_obj = args[0] as ObjectValue;
        const other_hamt_prop = other_set_obj.properties.get("__hamt__");
        if (!other_hamt_prop) {
          return typeError("Set.union() requires a Set argument");
        }
        const other_set = new AxiomSet(hamtFromHandle(other_hamt_prop));
        return ok(this.union(other_set).toRuntimeValue());
      }),
    };

    const intersection_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "intersection",
      call: syncCall((args: RuntimeValue[]): Result<RuntimeValue> => {
        if (args.length !== 1) {
          return runtimeError("Set.intersection() expects exactly 1 argument");
        }
        if (args[0].type !== ValueType.OBJECT) {
          return typeError("Set.intersection() requires a Set argument");
        }
        const other_set_obj = args[0] as ObjectValue;
        const other_hamt_prop = other_set_obj.properties.get("__hamt__");
        if (!other_hamt_prop) {
          return typeError("Set.intersection() requires a Set argument");
        }
        const other_set = new AxiomSet(hamtFromHandle(other_hamt_prop));
        return ok(this.intersection(other_set).toRuntimeValue());
      }),
    };

    const difference_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "difference",
      call: syncCall((args: RuntimeValue[]): Result<RuntimeValue> => {
        if (args.length !== 1) {
          return runtimeError("Set.difference() expects exactly 1 argument");
        }
        if (args[0].type !== ValueType.OBJECT) {
          return typeError("Set.difference() requires a Set argument");
        }
        const other_set_obj = args[0] as ObjectValue;
        const other_hamt_prop = other_set_obj.properties.get("__hamt__");
        if (!other_hamt_prop) {
          return typeError("Set.difference() requires a Set argument");
        }
        const other_set = new AxiomSet(hamtFromHandle(other_hamt_prop));
        return ok(this.difference(other_set).toRuntimeValue());
      }),
    };

    const to_array_method: NativeFunctionValue = {
      type: ValueType.NATIVE_FUNCTION,
      name: "toArray",
      call: syncCall((): Result<RuntimeValue> => {
        return ok({
          type: ValueType.ARRAY,
          elements: this.toArray(),
        } as ArrayValue);
      }),
    };

    const properties = new Map<string, RuntimeValue>();
    properties.set("add", add_method);
    properties.set("delete", delete_method);
    properties.set("has", has_method);
    properties.set("size", size_method);
    properties.set("union", union_method);
    properties.set("intersection", intersection_method);
    properties.set("difference", difference_method);
    properties.set("toArray", to_array_method);
    properties.set("__hamt__", hamtHandle(this.hamt));

    return {
      type: ValueType.OBJECT,
      properties,
    };
  }
}

export const set_constructor: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "Set",
  call: syncCall((args: RuntimeValue[]): Result<RuntimeValue> => {
    if (args.length === 0) {
      return ok(AxiomSet.empty().toRuntimeValue());
    }

    if (args.length !== 1) {
      return runtimeError("Set() expects 0 or 1 argument");
    }

    const arg = args[0];
    if (arg.type !== ValueType.ARRAY) {
      return typeError("Set() requires an array argument");
    }

    const array = arg as ArrayValue;
    return ok(AxiomSet.fromArray(array.elements).toRuntimeValue());
  }),
};
