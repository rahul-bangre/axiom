import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate, RuntimeValue, ValueType } from "@runtime";
import { Result } from "../src/types/result.ts";

interface TestResult {
  ok: boolean;
  output: string[];
  error?: string;
}

async function runProgram(source_code: string): Promise<TestResult> {
  const output: string[] = [];
  const original_print = console.log;
  console.log = (...args: unknown[]) => {
    output.push(args.map(String).join(" "));
  };

  try {
    const tokenizer = new Tokenizer(source_code);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    const ast_node = parser.parse();
    const global_env = await createGlobalEnv();
    const result = await evaluate(ast_node, global_env);

    console.log = original_print;

    if (!result.ok) {
      return { ok: false, output, error: result.error };
    }

    return { ok: true, output };
  } catch (e) {
    console.log = original_print;
    return { ok: false, output, error: String(e) };
  }
}

Deno.test("Optional chaining - property access on null returns null", async () => {
  const code = `
    user = null
    name = user?.name
    print(name)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["null"]);
});

Deno.test("Optional chaining - property access on object returns value", async () => {
  const code = `
    user = { name: "Alice", age: 25 }
    name = user?.name
    print(name)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["Alice"]);
});

Deno.test("Optional chaining - nested property access", async () => {
  const code = `
    user = { profile: { name: "Bob" } }
    name = user?.profile?.name
    print(name)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["Bob"]);
});

Deno.test("Optional chaining - nested property access with null", async () => {
  const code = `
    user = { profile: null }
    name = user?.profile?.name
    print(name)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["null"]);
});

Deno.test("Optional chaining - non-existent property returns null", async () => {
  const code = `
    user = { name: "Charlie" }
    email = user?.email
    print(email)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["null"]);
});

Deno.test("Optional chaining - computed access on array", async () => {
  const code = `
    data = [1, 2, 3]
    value = data?.[1]
    print(value)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["2"]);
});

Deno.test("Optional chaining - computed access on null returns null", async () => {
  const code = `
    data = null
    value = data?.[0]
    print(value)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["null"]);
});

Deno.test("Optional chaining - computed access out of bounds returns null", async () => {
  const code = `
    data = [1, 2, 3]
    value = data?.[10]
    print(value)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["null"]);
});

Deno.test("Optional chaining - array method property on null returns null", async () => {
  const code = `
    data = null
    method = data?.map
    print(method)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["null"]);
});

Deno.test("Optional chaining - array method on array works", async () => {
  const code = `
    data = [1, 2, 3]
    result = data?.map((x) => x * 2)
    print(result)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["[2, 4, 6]"]);
});

Deno.test("Optional chaining - string method property on null returns null", async () => {
  const code = `
    text = null
    method = text?.toUpperCase
    print(method)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["null"]);
});

Deno.test("Optional chaining - string method on string works", async () => {
  const code = `
    text = "hello"
    upper = text?.toUpperCase()
    print(upper)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["HELLO"]);
});

Deno.test("Optional chaining - mixed with regular property access", async () => {
  const code = `
    data = { users: [{ name: "Alice" }, { name: "Bob" }] }
    first_name = data.users?.[0]?.name
    print(first_name)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["Alice"]);
});

Deno.test("Optional chaining - in conditional", async () => {
  const code = `
    user = null
    result = user?.name == null ? "no name" : user?.name
    print(result)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["no name"]);
});

Deno.test("Optional chaining - with function return", async () => {
  const code = `
    fn get_user() {
      return null
    }
    
    name = get_user()?.name
    print(name)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["null"]);
});

Deno.test("Optional chaining - deep nesting", async () => {
  const code = `
    data = { a: { b: { c: { d: { e: 42 } } } } }
    value = data?.a?.b?.c?.d?.e
    print(value)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["42"]);
});

Deno.test("Optional chaining - deep nesting with null in middle", async () => {
  const code = `
    data = { a: { b: null } }
    value = data?.a?.b?.c?.d?.e
    print(value)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["null"]);
});

Deno.test("Optional chaining - in function call argument", async () => {
  const code = `
    fn greet(name) {
      if (name == null) {
        print("Hello, guest")
      }
      if (name != null) {
        print("Hello, " + name)
      }
    }
    
    user = null
    greet(user?.name)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["Hello, guest"]);
});

Deno.test("Optional chaining - with object literal", async () => {
  const code = `
    user = null
    config = { username: user?.name, active: true }
    print(config.username)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(result.output, ["null"]);
});
