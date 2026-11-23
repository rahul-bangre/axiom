import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import {
  ArrayValue,
  BooleanValue,
  createGlobalEnv,
  evaluate,
  NumberValue,
  ObjectValue,
  RuntimeValue,
  StringValue,
} from "@runtime";
import { Result } from "../src/types/result.ts";

async function run(source_code: string): Promise<Result<RuntimeValue>> {
  const tokenizer = new Tokenizer(source_code);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast_node = parser.parse();
  const global_env = createGlobalEnv();
  return await evaluate(ast_node, global_env);
}

Deno.test("Schema - string validation passes", async () => {
  const result = await run(`
    s = schema.string()
    s.parse("hello")
  `);
  assertEquals(result.ok, true);
  if (result.ok) assertEquals((result.value as StringValue).value, "hello");
});

Deno.test("Schema - string validation fails on number", async () => {
  const result = await run(`
    s = schema.string()
    s.parse(42)
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("Expected string"), true);
});

Deno.test("Schema - string min length validation", async () => {
  const result = await run(`
    s = schema.string().min(5)
    s.parse("hello")
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - string min length fails", async () => {
  const result = await run(`
    s = schema.string().min(10)
    s.parse("hello")
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("at least 10"), true);
});

Deno.test("Schema - string max length validation", async () => {
  const result = await run(`
    s = schema.string().max(10)
    s.parse("hello")
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - string max length fails", async () => {
  const result = await run(`
    s = schema.string().max(3)
    s.parse("hello")
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("at most 3"), true);
});

Deno.test("Schema - number validation passes", async () => {
  const result = await run(`
    s = schema.number()
    s.parse(42)
  `);
  assertEquals(result.ok, true);
  if (result.ok) assertEquals((result.value as NumberValue).value, 42);
});

Deno.test("Schema - number validation fails on string", async () => {
  const result = await run(`
    s = schema.number()
    s.parse("42")
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("Expected number"), true);
});

Deno.test("Schema - number min validation", async () => {
  const result = await run(`
    s = schema.number().min(0)
    s.parse(42)
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - number min fails", async () => {
  const result = await run(`
    s = schema.number().min(50)
    s.parse(42)
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("at least 50"), true);
});

Deno.test("Schema - number max validation", async () => {
  const result = await run(`
    s = schema.number().max(100)
    s.parse(42)
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - number max fails", async () => {
  const result = await run(`
    s = schema.number().max(10)
    s.parse(42)
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("at most 10"), true);
});

Deno.test("Schema - boolean validation passes", async () => {
  const result = await run(`
    s = schema.boolean()
    s.parse(true)
  `);
  assertEquals(result.ok, true);
  if (result.ok) assertEquals((result.value as BooleanValue).value, true);
});

Deno.test("Schema - boolean validation fails", async () => {
  const result = await run(`
    s = schema.boolean()
    s.parse(1)
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("Expected boolean"), true);
});

Deno.test("Schema - object validation passes", async () => {
  const result = await run(`
    s = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    s.parse({name: "Alice", age: 30})
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - object missing required field", async () => {
  const result = await run(`
    s = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    s.parse({name: "Alice"})
  `);
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.includes("age"), true);
    assertEquals(result.error.includes("required"), true);
  }
});

Deno.test("Schema - object wrong field type", async () => {
  const result = await run(`
    s = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    s.parse({name: "Alice", age: "thirty"})
  `);
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.includes("age"), true);
    assertEquals(result.error.includes("Expected number"), true);
  }
});

Deno.test("Schema - array validation passes", async () => {
  const result = await run(`
    s = schema.array(schema.number())
    s.parse([1, 2, 3])
  `);
  assertEquals(result.ok, true);
  if (result.ok) assertEquals((result.value as ArrayValue).elements.length, 3);
});

Deno.test("Schema - array element validation fails", async () => {
  const result = await run(`
    s = schema.array(schema.number())
    s.parse([1, "two", 3])
  `);
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.includes("index 1"), true);
    assertEquals(result.error.includes("Expected number"), true);
  }
});

Deno.test("Schema - array min length", async () => {
  const result = await run(`
    s = schema.array(schema.number()).min(2)
    s.parse([1, 2, 3])
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - array min length fails", async () => {
  const result = await run(`
    s = schema.array(schema.number()).min(5)
    s.parse([1, 2, 3])
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("at least 5"), true);
});

Deno.test("Schema - array max length", async () => {
  const result = await run(`
    s = schema.array(schema.number()).max(5)
    s.parse([1, 2, 3])
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - array max length fails", async () => {
  const result = await run(`
    s = schema.array(schema.number()).max(2)
    s.parse([1, 2, 3])
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("at most 2"), true);
});

Deno.test("Schema - optional field present", async () => {
  const result = await run(`
    s = schema.object({
      name: schema.string(),
      email: schema.optional(schema.string())
    })
    s.parse({name: "Alice", email: "alice@example.com"})
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - optional field missing", async () => {
  const result = await run(`
    s = schema.object({
      name: schema.string(),
      email: schema.optional(schema.string())
    })
    s.parse({name: "Alice"})
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - optional field wrong type", async () => {
  const result = await run(`
    s = schema.object({
      name: schema.string(),
      email: schema.optional(schema.string())
    })
    s.parse({name: "Alice", email: 123})
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("Expected string"), true);
});

Deno.test("Schema - lazy for self-referencing schema", async () => {
  const result = await run(`
    NodeSchema = schema.object({
      value: schema.number(),
      children: schema.array(schema.lazy(() => NodeSchema))
    })
    
    tree = {
      value: 1,
      children: [
        {value: 2, children: []},
        {value: 3, children: []}
      ]
    }
    
    NodeSchema.parse(tree)
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - lazy deep nesting", async () => {
  const result = await run(`
    NodeSchema = schema.object({
      value: schema.number(),
      child: schema.optional(schema.lazy(() => NodeSchema))
    })
    
    tree = {
      value: 1,
      child: {
        value: 2,
        child: {
          value: 3,
          child: null
        }
      }
    }
    
    NodeSchema.parse(tree)
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - lazy validation fails in nested structure", async () => {
  const result = await run(`
    NodeSchema = schema.object({
      value: schema.number(),
      children: schema.array(schema.lazy(() => NodeSchema))
    })
    
    tree = {
      value: 1,
      children: [
        {value: "invalid", children: []}
      ]
    }
    
    NodeSchema.parse(tree)
  `);
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.includes("value"), true);
    assertEquals(result.error.includes("Expected number"), true);
  }
});

Deno.test("Schema - lazy requires function", async () => {
  const result = await run(`
    s = schema.lazy(42)
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("requires a function"), true);
});

Deno.test("Schema - lazy function must return schema", async () => {
  const result = await run(`
    s = schema.lazy(() => 42)
    s.parse({})
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("must return a schema"), true);
});

Deno.test("Schema - any accepts any value", async () => {
  const result1 = await run(`schema.any().parse(42)`);
  assertEquals(result1.ok, true);

  const result2 = await run(`schema.any().parse("hello")`);
  assertEquals(result2.ok, true);

  const result3 = await run(`schema.any().parse({name: "test"})`);
  assertEquals(result3.ok, true);
});

Deno.test("Schema - nested objects with optional", async () => {
  const result = await run(`
    UserSchema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    
    ProfileSchema = schema.object({
      username: schema.string().min(3),
      user_info: schema.optional(UserSchema)
    })
    
    ProfileSchema.parse({
      username: "alice_dev",
      user_info: {name: "Alice", age: 30}
    })
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - array of objects", async () => {
  const result = await run(`
    UserSchema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    
    UsersSchema = schema.array(UserSchema).min(1).max(10)
    
    users = [
      {name: "Alice", age: 30},
      {name: "Bob", age: 25}
    ]
    
    validated = UsersSchema.parse(users)
    len(validated)
  `);
  assertEquals(result.ok, true);
  if (result.ok) assertEquals((result.value as NumberValue).value, 2);
});

Deno.test("Schema - method chaining", async () => {
  const result = await run(`
    s = schema.string().min(5).max(20)
    s.parse("hello world")
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - method chaining validation fails", async () => {
  const result = await run(`
    s = schema.number().min(10).max(20)
    s.parse(5)
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("at least 10"), true);
});

// ========== extend() tests ==========

Deno.test("Schema - extend basic object", async () => {
  const result = await run(`
    BaseUser = schema.object({
      name: schema.string(),
      email: schema.string()
    })
    
    AdminUser = BaseUser.extend({
      role: schema.string(),
      isAdmin: schema.boolean()
    })
    
    admin = {
      name: "Alice",
      email: "alice@example.com",
      role: "admin",
      isAdmin: true
    }
    
    AdminUser.parse(admin)
  `);
  assertEquals(result.ok, true);
  if (result.ok) {
    const obj = result.value as ObjectValue;
    assertEquals((obj.properties.get("name") as StringValue).value, "Alice");
    assertEquals((obj.properties.get("role") as StringValue).value, "admin");
  }
});

Deno.test("Schema - extend fails on missing base field", async () => {
  const result = await run(`
    BaseUser = schema.object({
      name: schema.string(),
      email: schema.string()
    })
    
    AdminUser = BaseUser.extend({
      role: schema.string()
    })
    
    admin = {
      name: "Alice",
      role: "admin"
    }
    
    AdminUser.parse(admin)
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("email"), true);
});

Deno.test("Schema - extend fails on missing extended field", async () => {
  const result = await run(`
    BaseUser = schema.object({
      name: schema.string()
    })
    
    AdminUser = BaseUser.extend({
      role: schema.string()
    })
    
    admin = {
      name: "Alice"
    }
    
    AdminUser.parse(admin)
  `);
  assertEquals(result.ok, false);
  if (!result.ok) assertEquals(result.error.includes("role"), true);
});

Deno.test("Schema - extend can be chained multiple times", async () => {
  const result = await run(`
    Base = schema.object({
      id: schema.number()
    })
    
    WithName = Base.extend({
      name: schema.string()
    })
    
    WithEmail = WithName.extend({
      email: schema.string()
    })
    
    obj = {
      id: 1,
      name: "Alice",
      email: "alice@example.com"
    }
    
    WithEmail.parse(obj)
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - extend with optional fields", async () => {
  const result = await run(`
    Base = schema.object({
      name: schema.string()
    })
    
    Extended = Base.extend({
      age: schema.optional(schema.number())
    })
    
    obj = {
      name: "Alice"
    }
    
    Extended.parse(obj)
  `);
  assertEquals(result.ok, true);
});

Deno.test("Schema - extend can override parent field", async () => {
  const result = await run(`
    Base = schema.object({
      value: schema.string()
    })
    
    Extended = Base.extend({
      value: schema.number()
    })
    
    obj = {
      value: 42
    }
    
    Extended.parse(obj)
  `);
  assertEquals(result.ok, true);
  if (result.ok) {
    const obj_val = result.value as ObjectValue;
    assertEquals((obj_val.properties.get("value") as NumberValue).value, 42);
  }
});
