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
  ValueType,
} from "@runtime";
import { Result } from "../src/types/result.ts";

async function run(source_code: string): Promise<Result<RuntimeValue>> {
  const tokenizer = new Tokenizer(source_code);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast_node = parser.parse();
  const global_env = await createGlobalEnv();
  return await evaluate(ast_node, global_env);
}

Deno.test("Nullish coalescing - null returns right side", async () => {
  const result = await run("x = null ?? 42");
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.NUMBER);
    assertEquals((result.value as NumberValue).value, 42);
  }
});

Deno.test("Nullish coalescing - non-null returns left side", async () => {
  const result = await run("x = 10 ?? 42");
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.NUMBER);
    assertEquals((result.value as NumberValue).value, 10);
  }
});

Deno.test("Nullish coalescing - zero is not nullish", async () => {
  const result = await run("x = 0 ?? 42");
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.NUMBER);
    assertEquals((result.value as NumberValue).value, 0);
  }
});

Deno.test("Nullish coalescing - false is not nullish", async () => {
  const result = await run("x = false ?? true");
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.BOOLEAN);
    assertEquals((result.value as BooleanValue).value, false);
  }
});

Deno.test("Nullish coalescing - empty string is not nullish", async () => {
  const result = await run('x = "" ?? "default"');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.STRING);
    assertEquals((result.value as StringValue).value, "");
  }
});

Deno.test("Nullish coalescing - string value", async () => {
  const result = await run('x = "hello" ?? "default"');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.STRING);
    assertEquals((result.value as StringValue).value, "hello");
  }
});

Deno.test("Nullish coalescing - chaining multiple", async () => {
  const result = await run("x = null ?? null ?? 42");
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.NUMBER);
    assertEquals((result.value as NumberValue).value, 42);
  }
});

Deno.test("Nullish coalescing - chaining stops at first non-null", async () => {
  const result = await run("x = null ?? 10 ?? 42");
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.NUMBER);
    assertEquals((result.value as NumberValue).value, 10);
  }
});

Deno.test("Nullish coalescing - with variables", async () => {
  const result = await run(`
    a = null
    b = 100
    x = a ?? b
    x
  `);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.NUMBER);
    assertEquals((result.value as NumberValue).value, 100);
  }
});

Deno.test("Nullish coalescing - with function calls", async () => {
  const result = await run(`
    fn get_value() {
      return null
    }
    fn get_default() {
      return 42
    }
    x = get_value() ?? get_default()
    x
  `);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.NUMBER);
    assertEquals((result.value as NumberValue).value, 42);
  }
});

Deno.test("Nullish coalescing - with expressions", async () => {
  const result = await run("x = (1 + 2) ?? (3 + 4)");
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.NUMBER);
    assertEquals((result.value as NumberValue).value, 3);
  }
});

Deno.test("Nullish coalescing - with array", async () => {
  const result = await run("x = [1, 2, 3] ?? []");
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.ARRAY);
    assertEquals((result.value as ArrayValue).elements.length, 3);
  }
});

Deno.test("Nullish coalescing - with object", async () => {
  const result = await run('x = {name: "Alice"} ?? {name: "Bob"}');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.OBJECT);
    const obj = result.value as ObjectValue;
    assertEquals((obj.properties.get("name") as StringValue).value, "Alice");
  }
});

Deno.test("Nullish coalescing - null object returns default", async () => {
  const result = await run('x = null ?? {name: "Bob"}');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.OBJECT);
    const obj = result.value as ObjectValue;
    assertEquals((obj.properties.get("name") as StringValue).value, "Bob");
  }
});

Deno.test("Nullish coalescing - combined with optional chaining", async () => {
  const result = await run(`
    user = null
    name = user?.name ?? "guest"
    name
  `);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.STRING);
    assertEquals((result.value as StringValue).value, "guest");
  }
});

Deno.test("Nullish coalescing - optional chaining with existing value", async () => {
  const result = await run(`
    user = {name: "Alice"}
    name = user?.name ?? "guest"
    name
  `);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.STRING);
    assertEquals((result.value as StringValue).value, "Alice");
  }
});

Deno.test("Nullish coalescing - nested optional chaining", async () => {
  const result = await run(`
    data = {user: null}
    name = data?.user?.name ?? "unknown"
    name
  `);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.STRING);
    assertEquals((result.value as StringValue).value, "unknown");
  }
});

Deno.test("Nullish coalescing - in ternary", async () => {
  const result = await run("x = true ? (null ?? 10) : 20");
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.NUMBER);
    assertEquals((result.value as NumberValue).value, 10);
  }
});

Deno.test("Nullish coalescing - with comparison", async () => {
  const result = await run(`
    value = null ?? 5
    result = value > 3
    result
  `);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.BOOLEAN);
    assertEquals((result.value as BooleanValue).value, true);
  }
});

Deno.test("Nullish coalescing - short-circuit evaluation", async () => {
  const result = await run(`
    fn side_effect() {
      print("Called!")
      return 42
    }
    x = 10 ?? side_effect()
    x
  `);
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.NUMBER);
    assertEquals((result.value as NumberValue).value, 10);
  }
});

Deno.test("Nullish coalescing - with logical operators", async () => {
  const result = await run("x = (null ?? 5) > 3 && true");
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.BOOLEAN);
    assertEquals((result.value as BooleanValue).value, true);
  }
});
