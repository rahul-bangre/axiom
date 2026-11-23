import { ok, Result, runtimeError, typeError } from "../types/result.ts";
import type {
  ArrayValue,
  FunctionValue,
  NativeFunctionValue,
  NumberValue,
  ObjectValue,
  RuntimeValue,
  StringValue,
} from "../runtime/value.ts";
import { ValueType } from "../runtime/value.ts";
import { evaluate } from "../runtime/evaluator.ts";
import { Environment } from "../runtime/environment.ts";

interface ValidationRule {
  validate: (value: RuntimeValue) => Result<RuntimeValue>;
}

class SchemaBuilder {
  private rules: ValidationRule[] = [];

  addRule(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  validate(value: RuntimeValue): Promise<Result<RuntimeValue>> {
    for (const rule of this.rules) {
      const result = rule.validate(value);
      if (!result.ok) {
        return Promise.resolve(result);
      }
    }
    return Promise.resolve(ok(value));
  }
}

class StringSchema extends SchemaBuilder {
  constructor() {
    super();
    this.addRule({
      validate: (value: RuntimeValue) => {
        if (value.type !== ValueType.STRING) {
          return typeError("Expected string");
        }
        return ok(value);
      },
    });
  }

  min(length: number): this {
    return this.addRule({
      validate: (value: RuntimeValue) => {
        const str_value = (value as StringValue).value;
        if (str_value.length < length) {
          return runtimeError(`String must be at least ${length} characters`);
        }
        return ok(value);
      },
    });
  }

  max(length: number): this {
    return this.addRule({
      validate: (value: RuntimeValue) => {
        const str_value = (value as StringValue).value;
        if (str_value.length > length) {
          return runtimeError(`String must be at most ${length} characters`);
        }
        return ok(value);
      },
    });
  }
}

class NumberSchema extends SchemaBuilder {
  constructor() {
    super();
    this.addRule({
      validate: (value: RuntimeValue) => {
        if (value.type !== ValueType.NUMBER) {
          return typeError("Expected number");
        }
        return ok(value);
      },
    });
  }

  min(min_value: number): this {
    return this.addRule({
      validate: (value: RuntimeValue) => {
        const num_value = (value as NumberValue).value;
        if (num_value < min_value) {
          return runtimeError(`Number must be at least ${min_value}`);
        }
        return ok(value);
      },
    });
  }

  max(max_value: number): this {
    return this.addRule({
      validate: (value: RuntimeValue) => {
        const num_value = (value as NumberValue).value;
        if (num_value > max_value) {
          return runtimeError(`Number must be at most ${max_value}`);
        }
        return ok(value);
      },
    });
  }
}

class ObjectSchema extends SchemaBuilder {
  private shape: Map<string, SchemaBuilder>;

  constructor(shape: Map<string, SchemaBuilder>) {
    super();
    this.shape = shape;
  }

  override async validate(value: RuntimeValue): Promise<Result<RuntimeValue>> {
    if (value.type !== ValueType.OBJECT) {
      return typeError("Expected object");
    }

    const obj = value as ObjectValue;

    for (const [key, schema] of this.shape.entries()) {
      const prop = obj.properties.get(key);
      if (!prop) {
        if (schema instanceof OptionalSchema) {
          continue;
        }
        return runtimeError(`Missing required property: ${key}`);
      }

      const result = await schema.validate(prop);
      if (!result.ok) {
        return runtimeError(`Invalid property '${key}': ${result.error}`);
      }
    }

    return await super.validate(value);
  }

  extend(additional_shape: Map<string, SchemaBuilder>): ObjectSchema {
    const merged = new Map(this.shape);
    for (const [key, schema] of additional_shape.entries()) {
      merged.set(key, schema);
    }
    return new ObjectSchema(merged);
  }
}

class ArraySchema extends SchemaBuilder {
  private item_schema: SchemaBuilder;

  constructor(item_schema: SchemaBuilder) {
    super();
    this.item_schema = item_schema;
  }

  override async validate(value: RuntimeValue): Promise<Result<RuntimeValue>> {
    if (value.type !== ValueType.ARRAY) {
      return typeError("Expected array");
    }

    const arr_value = value as ArrayValue;

    for (let i = 0; i < arr_value.elements.length; i++) {
      const result = await this.item_schema.validate(arr_value.elements[i]);
      if (!result.ok) {
        return runtimeError(`Invalid array element at index ${i}: ${result.error}`);
      }
    }

    return await super.validate(value);
  }

  min(length: number): this {
    return this.addRule({
      validate: (value: RuntimeValue) => {
        if (value.type !== ValueType.ARRAY) {
          return typeError("Expected array");
        }
        const arr_elements = (value as ArrayValue).elements;
        if (arr_elements.length < length) {
          return runtimeError(`Array must have at least ${length} elements`);
        }
        return ok(value);
      },
    });
  }

  max(length: number): this {
    return this.addRule({
      validate: (value: RuntimeValue) => {
        if (value.type !== ValueType.ARRAY) {
          return typeError("Expected array");
        }
        const arr_elements = (value as ArrayValue).elements;
        if (arr_elements.length > length) {
          return runtimeError(`Array must have at most ${length} elements`);
        }
        return ok(value);
      },
    });
  }
}

class OptionalSchema extends SchemaBuilder {
  private inner_schema: SchemaBuilder;

  constructor(inner_schema: SchemaBuilder) {
    super();
    this.inner_schema = inner_schema;
  }

  override async validate(value: RuntimeValue): Promise<Result<RuntimeValue>> {
    if (value.type === ValueType.NULL) {
      return ok(value);
    }
    return await this.inner_schema.validate(value);
  }
}

class LazySchema extends SchemaBuilder {
  private schema_fn: RuntimeValue;
  private cached_schema?: SchemaBuilder;

  constructor(schema_fn: RuntimeValue) {
    super();
    this.schema_fn = schema_fn;
  }

  override async validate(value: RuntimeValue): Promise<Result<RuntimeValue>> {
    if (!this.cached_schema) {
      if (
        this.schema_fn.type !== ValueType.FUNCTION &&
        this.schema_fn.type !== ValueType.NATIVE_FUNCTION
      ) {
        return runtimeError("schema.lazy() requires a function");
      }

      let result: Result<RuntimeValue>;
      if (this.schema_fn.type === ValueType.NATIVE_FUNCTION) {
        result = await (this.schema_fn as NativeFunctionValue).call([]);
      } else {
        const fn = this.schema_fn as FunctionValue;
        const fn_env = new Environment(fn.closure);
        result = await evaluate(fn.body, fn_env);
      }

      if (!result.ok) {
        return result;
      }

      let schema_obj = result.value;

      if ((schema_obj as unknown as Record<string, unknown>).isReturn) {
        schema_obj =
          (schema_obj as unknown as Record<string, unknown>).returnValue as RuntimeValue ||
          { type: ValueType.NULL };
      }

      if (schema_obj.type !== ValueType.OBJECT) {
        return runtimeError("schema.lazy() function must return a schema");
      }

      this.cached_schema = (schema_obj as unknown as Record<string, unknown>)
        ._builder as SchemaBuilder;
      if (!this.cached_schema) {
        return runtimeError("Invalid schema returned from lazy function");
      }
    }

    return this.cached_schema.validate(value);
  }
}

class AnySchema extends SchemaBuilder {
  override validate(value: RuntimeValue): Promise<Result<RuntimeValue>> {
    return Promise.resolve(ok(value));
  }
}

const schema_string: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "string",
  call: (_args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    const builder = new StringSchema();
    const builder_obj: ObjectValue = {
      type: ValueType.OBJECT,
      properties: new Map([
        ["parse", createParseFunction(builder)],
        ["min", createStringMinFunction(builder)],
        ["max", createStringMaxFunction(builder)],
      ]),
    };
    (builder_obj as unknown as Record<string, unknown>)._builder = builder;
    return Promise.resolve(ok(builder_obj));
  },
};

const schema_number: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "number",
  call: (_args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    const builder = new NumberSchema();
    const builder_obj: ObjectValue = {
      type: ValueType.OBJECT,
      properties: new Map([
        ["parse", createParseFunction(builder)],
        ["min", createNumberMinFunction(builder)],
        ["max", createNumberMaxFunction(builder)],
      ]),
    };
    (builder_obj as unknown as Record<string, unknown>)._builder = builder;
    return Promise.resolve(ok(builder_obj));
  },
};

const schema_boolean: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "boolean",
  call: (_args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    const builder = new SchemaBuilder();
    builder.addRule({
      validate: (value: RuntimeValue) => {
        if (value.type !== ValueType.BOOLEAN) {
          return typeError("Expected boolean");
        }
        return ok(value);
      },
    });
    const builder_obj: ObjectValue = {
      type: ValueType.OBJECT,
      properties: new Map([
        ["parse", createParseFunction(builder)],
      ]),
    };
    (builder_obj as unknown as Record<string, unknown>)._builder = builder;
    return Promise.resolve(ok(builder_obj));
  },
};

const schema_object: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "object",
  call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.OBJECT) {
      return Promise.resolve(runtimeError("schema.object() requires an object argument"));
    }

    const shape_obj = args[0] as ObjectValue;
    const shape = new Map<string, SchemaBuilder>();

    for (const [key, val] of shape_obj.properties.entries()) {
      if (val.type !== ValueType.OBJECT) {
        return Promise.resolve(runtimeError(`Invalid schema for property '${key}'`));
      }
      const schema_obj = val as ObjectValue;
      const builder = (schema_obj as unknown as Record<string, unknown>)._builder as SchemaBuilder;
      if (builder) {
        shape.set(key, builder);
      }
    }

    const builder = new ObjectSchema(shape);
    const builder_obj: ObjectValue = {
      type: ValueType.OBJECT,
      properties: new Map([
        ["parse", createParseFunction(builder)],
        ["extend", createObjectExtendFunction(builder)],
      ]),
    };
    (builder_obj as unknown as Record<string, unknown>)._builder = builder;
    return Promise.resolve(ok(builder_obj));
  },
};

const schema_array: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "array",
  call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return Promise.resolve(runtimeError("schema.array() requires exactly 1 argument"));
    }

    const item_schema_obj = args[0];
    if (item_schema_obj.type !== ValueType.OBJECT) {
      return Promise.resolve(runtimeError("schema.array() requires a schema argument"));
    }

    const builder = (item_schema_obj as unknown as Record<string, unknown>)
      ._builder as SchemaBuilder;
    if (!builder) {
      return Promise.resolve(runtimeError("Invalid schema passed to schema.array()"));
    }

    const array_builder = new ArraySchema(builder);
    const builder_obj: ObjectValue = {
      type: ValueType.OBJECT,
      properties: new Map([
        ["parse", createParseFunction(array_builder)],
        ["min", createArrayMinFunction(array_builder)],
        ["max", createArrayMaxFunction(array_builder)],
      ]),
    };
    (builder_obj as unknown as Record<string, unknown>)._builder = array_builder;
    return Promise.resolve(ok(builder_obj));
  },
};

const schema_optional: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "optional",
  call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return Promise.resolve(runtimeError("schema.optional() requires exactly 1 argument"));
    }

    const inner_schema_obj = args[0];
    if (inner_schema_obj.type !== ValueType.OBJECT) {
      return Promise.resolve(runtimeError("schema.optional() requires a schema argument"));
    }

    const inner_builder = (inner_schema_obj as unknown as Record<string, unknown>)
      ._builder as SchemaBuilder;
    if (!inner_builder) {
      return Promise.resolve(runtimeError("Invalid schema passed to schema.optional()"));
    }

    const optional_builder = new OptionalSchema(inner_builder);
    const builder_obj: ObjectValue = {
      type: ValueType.OBJECT,
      properties: new Map([
        ["parse", createParseFunction(optional_builder)],
      ]),
    };
    (builder_obj as unknown as Record<string, unknown>)._builder = optional_builder;
    return Promise.resolve(ok(builder_obj));
  },
};

const schema_lazy: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "lazy",
  call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return Promise.resolve(runtimeError("schema.lazy() requires exactly 1 argument"));
    }

    const fn = args[0];
    if (fn.type !== ValueType.FUNCTION && fn.type !== ValueType.NATIVE_FUNCTION) {
      return Promise.resolve(runtimeError("schema.lazy() requires a function argument"));
    }

    const lazy_builder = new LazySchema(fn);
    const builder_obj: ObjectValue = {
      type: ValueType.OBJECT,
      properties: new Map([
        ["parse", createParseFunction(lazy_builder)],
      ]),
    };
    (builder_obj as unknown as Record<string, unknown>)._builder = lazy_builder;
    return Promise.resolve(ok(builder_obj));
  },
};

const schema_any: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "any",
  call: (_args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    const builder = new AnySchema();
    const builder_obj: ObjectValue = {
      type: ValueType.OBJECT,
      properties: new Map([
        ["parse", createParseFunction(builder)],
      ]),
    };
    (builder_obj as unknown as Record<string, unknown>)._builder = builder;
    return Promise.resolve(ok(builder_obj));
  },
};

function createParseFunction(builder: SchemaBuilder): NativeFunctionValue {
  return {
    type: ValueType.NATIVE_FUNCTION,
    name: "parse",
    call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
      if (args.length !== 1) {
        return runtimeError("parse() requires exactly 1 argument");
      }
      const result = await builder.validate(args[0]);
      if (!result.ok) {
        return result;
      }
      return ok(result.value);
    },
  };
}

function createStringMinFunction(builder: StringSchema): NativeFunctionValue {
  return {
    type: ValueType.NATIVE_FUNCTION,
    name: "min",
    call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
      if (args.length !== 1 || args[0].type !== ValueType.NUMBER) {
        return Promise.resolve(runtimeError("min() requires a number argument"));
      }
      const length = (args[0] as NumberValue).value;
      builder.min(length);
      const builder_obj: ObjectValue = {
        type: ValueType.OBJECT,
        properties: new Map([
          ["parse", createParseFunction(builder)],
          ["min", createStringMinFunction(builder)],
          ["max", createStringMaxFunction(builder)],
        ]),
      };
      (builder_obj as unknown as Record<string, unknown>)._builder = builder;
      return Promise.resolve(ok(builder_obj));
    },
  };
}

function createStringMaxFunction(builder: StringSchema): NativeFunctionValue {
  return {
    type: ValueType.NATIVE_FUNCTION,
    name: "max",
    call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
      if (args.length !== 1 || args[0].type !== ValueType.NUMBER) {
        return Promise.resolve(runtimeError("max() requires a number argument"));
      }
      const length = (args[0] as NumberValue).value;
      builder.max(length);
      const builder_obj: ObjectValue = {
        type: ValueType.OBJECT,
        properties: new Map([
          ["parse", createParseFunction(builder)],
          ["min", createStringMinFunction(builder)],
          ["max", createStringMaxFunction(builder)],
        ]),
      };
      (builder_obj as unknown as Record<string, unknown>)._builder = builder;
      return Promise.resolve(ok(builder_obj));
    },
  };
}

function createNumberMinFunction(builder: NumberSchema): NativeFunctionValue {
  return {
    type: ValueType.NATIVE_FUNCTION,
    name: "min",
    call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
      if (args.length !== 1 || args[0].type !== ValueType.NUMBER) {
        return Promise.resolve(runtimeError("min() requires a number argument"));
      }
      const min_value = (args[0] as NumberValue).value;
      builder.min(min_value);
      const builder_obj: ObjectValue = {
        type: ValueType.OBJECT,
        properties: new Map([
          ["parse", createParseFunction(builder)],
          ["min", createNumberMinFunction(builder)],
          ["max", createNumberMaxFunction(builder)],
        ]),
      };
      (builder_obj as unknown as Record<string, unknown>)._builder = builder;
      return Promise.resolve(ok(builder_obj));
    },
  };
}

function createNumberMaxFunction(builder: NumberSchema): NativeFunctionValue {
  return {
    type: ValueType.NATIVE_FUNCTION,
    name: "max",
    call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
      if (args.length !== 1 || args[0].type !== ValueType.NUMBER) {
        return Promise.resolve(runtimeError("max() requires a number argument"));
      }
      const max_value = (args[0] as NumberValue).value;
      builder.max(max_value);
      const builder_obj: ObjectValue = {
        type: ValueType.OBJECT,
        properties: new Map([
          ["parse", createParseFunction(builder)],
          ["min", createNumberMinFunction(builder)],
          ["max", createNumberMaxFunction(builder)],
        ]),
      };
      (builder_obj as unknown as Record<string, unknown>)._builder = builder;
      return Promise.resolve(ok(builder_obj));
    },
  };
}

function createArrayMinFunction(builder: ArraySchema): NativeFunctionValue {
  return {
    type: ValueType.NATIVE_FUNCTION,
    name: "min",
    call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
      if (args.length !== 1 || args[0].type !== ValueType.NUMBER) {
        return Promise.resolve(runtimeError("min() requires a number argument"));
      }
      const length = (args[0] as NumberValue).value;
      builder.min(length);
      const builder_obj: ObjectValue = {
        type: ValueType.OBJECT,
        properties: new Map([
          ["parse", createParseFunction(builder)],
          ["min", createArrayMinFunction(builder)],
          ["max", createArrayMaxFunction(builder)],
        ]),
      };
      (builder_obj as unknown as Record<string, unknown>)._builder = builder;
      return Promise.resolve(ok(builder_obj));
    },
  };
}

function createArrayMaxFunction(builder: ArraySchema): NativeFunctionValue {
  return {
    type: ValueType.NATIVE_FUNCTION,
    name: "max",
    call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
      if (args.length !== 1 || args[0].type !== ValueType.NUMBER) {
        return Promise.resolve(runtimeError("max() requires a number argument"));
      }
      const length = (args[0] as NumberValue).value;
      builder.max(length);
      const builder_obj: ObjectValue = {
        type: ValueType.OBJECT,
        properties: new Map([
          ["parse", createParseFunction(builder)],
          ["min", createArrayMinFunction(builder)],
          ["max", createArrayMaxFunction(builder)],
        ]),
      };
      (builder_obj as unknown as Record<string, unknown>)._builder = builder;
      return Promise.resolve(ok(builder_obj));
    },
  };
}

function createObjectExtendFunction(builder: ObjectSchema): NativeFunctionValue {
  return {
    type: ValueType.NATIVE_FUNCTION,
    name: "extend",
    call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
      if (args.length !== 1 || args[0].type !== ValueType.OBJECT) {
        return Promise.resolve(runtimeError("extend() requires an object argument"));
      }

      const extension_obj = args[0] as ObjectValue;
      const additional_shape = new Map<string, SchemaBuilder>();

      for (const [key, val] of extension_obj.properties.entries()) {
        if (val.type !== ValueType.OBJECT) {
          return Promise.resolve(runtimeError(`Invalid schema for property '${key}'`));
        }
        const schema_obj = val as ObjectValue;
        const schema_builder = (schema_obj as unknown as Record<string, unknown>)
          ._builder as SchemaBuilder;
        if (schema_builder) {
          additional_shape.set(key, schema_builder);
        }
      }

      const extended_builder = builder.extend(additional_shape);
      const extended_obj: ObjectValue = {
        type: ValueType.OBJECT,
        properties: new Map([
          ["parse", createParseFunction(extended_builder)],
          ["extend", createObjectExtendFunction(extended_builder)],
        ]),
      };
      (extended_obj as unknown as Record<string, unknown>)._builder = extended_builder;
      return Promise.resolve(ok(extended_obj));
    },
  };
}

export const schema_namespace: ObjectValue = {
  type: ValueType.OBJECT,
  properties: new Map([
    ["string", schema_string],
    ["number", schema_number],
    ["boolean", schema_boolean],
    ["object", schema_object],
    ["array", schema_array],
    ["optional", schema_optional],
    ["lazy", schema_lazy],
    ["any", schema_any],
  ]),
};
