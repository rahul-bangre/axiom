import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate, ValueType } from "@runtime";
import type {
  ArrayValue,
  BooleanValue,
  NumberValue,
  ObjectValue,
  RuntimeValue,
  StringValue,
} from "@runtime";

async function run(source: string): Promise<RuntimeValue> {
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const env = createGlobalEnv();
  const result = await evaluate(ast, env);
  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.value;
}

Deno.test("JSON - parse number", async () => {
  const result = await run('json.parse("42")') as NumberValue;
  assertEquals(result.type, ValueType.NUMBER);
  assertEquals(result.value, 42);
});

Deno.test("JSON - parse string", async () => {
  const result = await run(`json.parse('"hello"')`) as StringValue;
  assertEquals(result.type, ValueType.STRING);
  assertEquals(result.value, "hello");
});

Deno.test("JSON - parse boolean true", async () => {
  const result = await run('json.parse("true")') as BooleanValue;
  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals(result.value, true);
});

Deno.test("JSON - parse boolean false", async () => {
  const result = await run('json.parse("false")') as BooleanValue;
  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals(result.value, false);
});

Deno.test("JSON - parse null", async () => {
  const result = await run('json.parse("null")');
  assertEquals(result.type, ValueType.NULL);
});

Deno.test("JSON - parse array", async () => {
  const result = await run('json.parse("[1, 2, 3]")') as ArrayValue;
  assertEquals(result.type, ValueType.ARRAY);
  assertEquals(result.elements.length, 3);
  assertEquals((result.elements[0] as NumberValue).value, 1);
  assertEquals((result.elements[1] as NumberValue).value, 2);
  assertEquals((result.elements[2] as NumberValue).value, 3);
});

Deno.test("JSON - parse empty array", async () => {
  const result = await run('json.parse("[]")') as ArrayValue;
  assertEquals(result.type, ValueType.ARRAY);
  assertEquals(result.elements.length, 0);
});

Deno.test("JSON - parse object", async () => {
  const result = await run(`json.parse('{"name":"Alice","age":30}')`) as ObjectValue;
  assertEquals(result.type, ValueType.OBJECT);
  const name = result.properties.get("name") as StringValue;
  const age = result.properties.get("age") as NumberValue;
  assertEquals(name.value, "Alice");
  assertEquals(age.value, 30);
});

Deno.test("JSON - parse empty object", async () => {
  const result = await run('json.parse("{}")') as ObjectValue;
  assertEquals(result.type, ValueType.OBJECT);
  assertEquals(result.properties.size, 0);
});

Deno.test("JSON - parse nested object", async () => {
  const result = await run(`json.parse('{"user":{"name":"Bob"}}')`) as ObjectValue;
  assertEquals(result.type, ValueType.OBJECT);
  const user = result.properties.get("user") as ObjectValue;
  assertEquals(user.type, ValueType.OBJECT);
  const name = user.properties.get("name") as StringValue;
  assertEquals(name.value, "Bob");
});

Deno.test("JSON - parse array of objects", async () => {
  const result = await run(`json.parse('[{"id":1},{"id":2}]')`) as ArrayValue;
  assertEquals(result.type, ValueType.ARRAY);
  assertEquals(result.elements.length, 2);
  const obj1 = result.elements[0] as ObjectValue;
  const obj2 = result.elements[1] as ObjectValue;
  assertEquals((obj1.properties.get("id") as NumberValue).value, 1);
  assertEquals((obj2.properties.get("id") as NumberValue).value, 2);
});

Deno.test("JSON - parse invalid JSON throws", async () => {
  await assertRejects(async () => await run('json.parse("invalid")'), Error, "json.parse() failed");
});

Deno.test("JSON - parse non-string throws", async () => {
  await assertRejects(
    async () => await run("json.parse(42)"),
    Error,
    "json.parse() requires a string argument",
  );
});

Deno.test("JSON - stringify number", async () => {
  const result = await run("json.stringify(42)") as StringValue;
  assertEquals(result.type, ValueType.STRING);
  assertEquals(result.value, "42");
});

Deno.test("JSON - stringify string", async () => {
  const result = await run('json.stringify("hello")') as StringValue;
  assertEquals(result.type, ValueType.STRING);
  assertEquals(result.value, '"hello"');
});

Deno.test("JSON - stringify boolean", async () => {
  const result = await run("json.stringify(true)") as StringValue;
  assertEquals(result.type, ValueType.STRING);
  assertEquals(result.value, "true");
});

Deno.test("JSON - stringify null", async () => {
  const result = await run("json.stringify(null)") as StringValue;
  assertEquals(result.type, ValueType.STRING);
  assertEquals(result.value, "null");
});

Deno.test("JSON - stringify array", async () => {
  const result = await run("json.stringify([1, 2, 3])") as StringValue;
  assertEquals(result.type, ValueType.STRING);
  assertEquals(result.value, "[1,2,3]");
});

Deno.test("JSON - stringify empty array", async () => {
  const result = await run("json.stringify([])") as StringValue;
  assertEquals(result.type, ValueType.STRING);
  assertEquals(result.value, "[]");
});

Deno.test("JSON - stringify object", async () => {
  const result = await run('json.stringify({name: "Alice", age: 30})') as StringValue;
  assertEquals(result.type, ValueType.STRING);
  assertEquals(result.value, '{"name":"Alice","age":30}');
});

Deno.test("JSON - stringify empty object", async () => {
  const result = await run("json.stringify({})") as StringValue;
  assertEquals(result.type, ValueType.STRING);
  assertEquals(result.value, "{}");
});

Deno.test("JSON - stringify nested object", async () => {
  const result = await run('json.stringify({user: {name: "Bob"}})') as StringValue;
  assertEquals(result.type, ValueType.STRING);
  assertEquals(result.value, '{"user":{"name":"Bob"}}');
});

Deno.test("JSON - round trip object", async () => {
  const result = await run(`
    original = {name: "Alice", age: 30, active: true}
    json_str = json.stringify(original)
    parsed = json.parse(json_str)
    parsed
  `) as ObjectValue;
  assertEquals(result.type, ValueType.OBJECT);
  assertEquals((result.properties.get("name") as StringValue).value, "Alice");
  assertEquals((result.properties.get("age") as NumberValue).value, 30);
  assertEquals((result.properties.get("active") as BooleanValue).value, true);
});

Deno.test("JSON - round trip array", async () => {
  const result = await run(`
    original = [1, 2, 3, 4, 5]
    json_str = json.stringify(original)
    parsed = json.parse(json_str)
    parsed
  `) as ArrayValue;
  assertEquals(result.type, ValueType.ARRAY);
  assertEquals(result.elements.length, 5);
  assertEquals((result.elements[0] as NumberValue).value, 1);
  assertEquals((result.elements[4] as NumberValue).value, 5);
});

Deno.test("JSON - round trip complex structure", async () => {
  const result = await run(`
    original = {
      users: [
        {name: "Alice", age: 30},
        {name: "Bob", age: 25}
      ],
      count: 2
    }
    json_str = json.stringify(original)
    parsed = json.parse(json_str)
    parsed
  `) as ObjectValue;
  assertEquals(result.type, ValueType.OBJECT);
  const users = result.properties.get("users") as ArrayValue;
  assertEquals(users.elements.length, 2);
  const alice = users.elements[0] as ObjectValue;
  assertEquals((alice.properties.get("name") as StringValue).value, "Alice");
  assertEquals((result.properties.get("count") as NumberValue).value, 2);
});
