import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate, RuntimeValue } from "@runtime";
import { Result } from "../src/types/result.ts";

async function run(source_code: string): Promise<Result<RuntimeValue>> {
  const tokenizer = new Tokenizer(source_code);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast_node = parser.parse();
  const global_env = createGlobalEnv();
  return await evaluate(ast_node, global_env);
}

Deno.test("Type checker - Variable with correct int type", async () => {
  const eval_result = await run("x: int = 42");
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).value, 42);
});

Deno.test("Type checker - Variable with correct string type", async () => {
  const eval_result = await run('name: string = "axiom"');
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).value, "axiom");
});

Deno.test("Type checker - Variable with correct bool type", async () => {
  const eval_result = await run("flag: bool = true");
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).value, true);
});

Deno.test("Type checker - Variable type mismatch - int", async () => {
  const eval_result = await run('x: int = "not a number"');
  assertEquals(eval_result.ok, false);
  if (!eval_result.ok) {
    assertEquals(eval_result.error.includes("TypeError"), true);
    assertEquals(eval_result.error.includes("int"), true);
  }
});

Deno.test("Type checker - Variable type mismatch - string", async () => {
  const eval_result = await run("name: string = 42");
  assertEquals(eval_result.ok, false);
  if (!eval_result.ok) {
    assertEquals(eval_result.error.includes("TypeError"), true);
    assertEquals(eval_result.error.includes("string"), true);
  }
});

Deno.test("Type checker - Variable type mismatch - bool", async () => {
  const eval_result = await run("flag: bool = 0");
  assertEquals(eval_result.ok, false);
  if (!eval_result.ok) {
    assertEquals(eval_result.error.includes("TypeError"), true);
  }
});

Deno.test("Type checker - Float accepts int", async () => {
  const eval_result = await run("x: float = 42");
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).value, 42);
});

Deno.test("Type checker - Float accepts float", async () => {
  const eval_result = await run("x: float = 3.14");
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).value, 3.14);
});

Deno.test("Type checker - Function return type correct", async () => {
  const eval_result = await run(`
    fn getNumber(): int {
      return 42
    }
    getNumber()
  `);
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).value, 42);
});

Deno.test("Type checker - Function return type mismatch", async () => {
  const eval_result = await run(`
    fn getName(): int {
      return "not a number"
    }
    getName()
  `);
  assertEquals(eval_result.ok, false);
  if (!eval_result.ok) {
    assertEquals(eval_result.error.includes("TypeError"), true);
    assertEquals(eval_result.error.includes("int"), true);
  }
});

Deno.test("Type checker - Function parameter type correct", async () => {
  const eval_result = await run(`
    fn double(x: int): int {
      return x * 2
    }
    double(21)
  `);
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).value, 42);
});

Deno.test("Type checker - Function parameter type mismatch", async () => {
  const eval_result = await run(`
    fn greet(name: string) {
      return name
    }
    greet(42)
  `);
  assertEquals(eval_result.ok, false);
  if (!eval_result.ok) {
    assertEquals(eval_result.error.includes("TypeError"), true);
    assertEquals(eval_result.error.includes("string"), true);
  }
});

Deno.test("Type checker - Multiple parameters with types", async () => {
  const eval_result = await run(`
    fn add(a: int, b: int): int {
      return a + b
    }
    add(10, 32)
  `);
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).value, 42);
});

Deno.test("Type checker - Multiple parameters type mismatch", async () => {
  const eval_result = await run(`
    fn add(a: int, b: int): int {
      return a + b
    }
    add(10, "not a number")
  `);
  assertEquals(eval_result.ok, false);
  if (!eval_result.ok) {
    assertEquals(eval_result.error.includes("TypeError"), true);
    assertEquals(eval_result.error.includes("int"), true);
  }
});

Deno.test("Type checker - Array type", async () => {
  const eval_result = await run("arr: array = [1, 2, 3]");
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).elements.length, 3);
});

Deno.test("Type checker - Object type", async () => {
  const eval_result = await run('user: object = {name: "rahul"}');
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) {
    assertEquals((eval_result.value as any).properties.get("name").value, "rahul");
  }
});

Deno.test("Type checker - Without type annotation works", async () => {
  const eval_result = await run(`
    x = 42
    y = "hello"
    z = true
    x + 10
  `);
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).value, 52);
});

Deno.test("Type checker - Mixed typed and untyped", async () => {
  const eval_result = await run(`
    x = 10
    y: int = 32
    x + y
  `);
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).value, 42);
});

Deno.test("Type checker - Null value without type", async () => {
  const eval_result = await run("x = null");
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).type, 3);
});

Deno.test("Type checker - Function type", async () => {
  const eval_result = await run(`
    fn test() {
      return 42
    }
    f: function = test
    f()
  `);
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).value, 42);
});

Deno.test("Type checker - Void return inferred for typed params", async () => {
  const eval_result = await run(`
    fn test(a: int) {
      return a
    }
    test(5)
  `);
  assertEquals(eval_result.ok, false);
  if (!eval_result.ok) {
    assertEquals(eval_result.error.includes("void return type cannot return a value"), true);
  }
});

Deno.test("Type checker - Void return with no return statement OK", async () => {
  const eval_result = await run(`
    fn test(a: int) {
      print(a)
    }
    test(5)
  `);
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).type, 3);
});

Deno.test("Type checker - Void return with explicit return (no value) OK", async () => {
  const eval_result = await run(`
    fn test(a: int) {
      if (a < 0) {
        return
      }
      print(a)
    }
    test(5)
  `);
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).type, 3);
});

Deno.test("Type checker - Untyped params can return without annotation", async () => {
  const eval_result = await run(`
    fn test(a) {
      return a + 5
    }
    test(10)
  `);
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).value, 15);
});

Deno.test("Type checker - Explicit return type overrides void", async () => {
  const eval_result = await run(`
    fn test(a: int): int {
      return a * 2
    }
    test(21)
  `);
  assertEquals(eval_result.ok, true);
  if (eval_result.ok) assertEquals((eval_result.value as any).value, 42);
});

Deno.test("Type checker - Explicit void return type", async () => {
  const eval_result = await run(`
    fn test(a: int): void {
      return a
    }
    test(5)
  `);
  assertEquals(eval_result.ok, false);
  if (!eval_result.ok) {
    assertEquals(eval_result.error.includes("void return type cannot return a value"), true);
  }
});
