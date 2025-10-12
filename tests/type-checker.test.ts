import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate } from "@runtime";
import { TypeCheckError } from "@types";

function run(source: string): any {
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const env = createGlobalEnv();
  return evaluate(ast, env);
}

Deno.test("Type checker - Variable with correct int type", () => {
  const result = run("x: int = 42");
  assertEquals(result.value, 42);
});

Deno.test("Type checker - Variable with correct string type", () => {
  const result = run('name: string = "axiom"');
  assertEquals(result.value, "axiom");
});

Deno.test("Type checker - Variable with correct bool type", () => {
  const result = run("flag: bool = true");
  assertEquals(result.value, true);
});

Deno.test("Type checker - Variable type mismatch - int", () => {
  assertThrows(
    () => run('x: int = "not a number"'),
    TypeCheckError,
    "expected int, got string",
  );
});

Deno.test("Type checker - Variable type mismatch - string", () => {
  assertThrows(
    () => run("name: string = 42"),
    TypeCheckError,
    "expected string, got int",
  );
});

Deno.test("Type checker - Variable type mismatch - bool", () => {
  assertThrows(
    () => run("flag: bool = 0"),
    TypeCheckError,
    "expected bool, got int",
  );
});

Deno.test("Type checker - Float accepts int", () => {
  const result = run("x: float = 42");
  assertEquals(result.value, 42);
});

Deno.test("Type checker - Float accepts float", () => {
  const result = run("x: float = 3.14");
  assertEquals(result.value, 3.14);
});

Deno.test("Type checker - Function return type correct", () => {
  const result = run(`
    fn getNumber(): int {
      return 42
    }
    getNumber()
  `);
  assertEquals(result.value, 42);
});

Deno.test("Type checker - Function return type mismatch", () => {
  assertThrows(
    () =>
      run(`
      fn getName(): int {
        return "not a number"
      }
      getName()
    `),
    TypeCheckError,
    "expected int, got string",
  );
});

Deno.test("Type checker - Function parameter type correct", () => {
  const result = run(`
    fn double(x: int): int {
      return x * 2
    }
    double(21)
  `);
  assertEquals(result.value, 42);
});

Deno.test("Type checker - Function parameter type mismatch", () => {
  assertThrows(
    () =>
      run(`
      fn greet(name: string) {
        return name
      }
      greet(42)
    `),
    TypeCheckError,
    "expected string, got int",
  );
});

Deno.test("Type checker - Multiple parameters with types", () => {
  const result = run(`
    fn add(a: int, b: int): int {
      return a + b
    }
    add(10, 32)
  `);
  assertEquals(result.value, 42);
});

Deno.test("Type checker - Multiple parameters type mismatch", () => {
  assertThrows(
    () =>
      run(`
      fn add(a: int, b: int): int {
        return a + b
      }
      add(10, "not a number")
    `),
    TypeCheckError,
    "expected int, got string",
  );
});

Deno.test("Type checker - Array type", () => {
  const result = run("arr: array = [1, 2, 3]");
  assertEquals(result.elements.length, 3);
});

Deno.test("Type checker - Object type", () => {
  const result = run('user: object = {name: "rahul"}');
  assertEquals(result.properties.get("name").value, "rahul");
});

Deno.test("Type checker - Without type annotation works", () => {
  const result = run(`
    x = 42
    y = "hello"
    z = true
    x + 10
  `);
  assertEquals(result.value, 52);
});

Deno.test("Type checker - Mixed typed and untyped", () => {
  const result = run(`
    x = 10
    y: int = 32
    x + y
  `);
  assertEquals(result.value, 42);
});

Deno.test("Type checker - Null value without type", () => {
  const result = run("x = null");
  assertEquals(result.type, 3); // ValueType.NULL
});

Deno.test("Type checker - Function type", () => {
  const result = run(`
    fn test() {
      return 42
    }
    f: function = test
    f()
  `);
  assertEquals(result.value, 42);
});

Deno.test("Type checker - Void return inferred for typed params", () => {
  assertThrows(
    () =>
      run(`
      fn test(a: int) {
        return a
      }
      test(5)
    `),
    TypeCheckError,
    "with void return type cannot return a value",
  );
});

Deno.test("Type checker - Void return with no return statement OK", () => {
  const result = run(`
    fn test(a: int) {
      print(a)
    }
    test(5)
  `);
  assertEquals(result.type, 3);
});

Deno.test("Type checker - Void return with explicit return (no value) OK", () => {
  const result = run(`
    fn test(a: int) {
      if (a < 0) {
        return
      }
      print(a)
    }
    test(5)
  `);
  assertEquals(result.type, 3);
});

Deno.test("Type checker - Untyped params can return without annotation", () => {
  const result = run(`
    fn test(a) {
      return a + 5
    }
    test(10)
  `);
  assertEquals(result.value, 15);
});

Deno.test("Type checker - Explicit return type overrides void", () => {
  const result = run(`
    fn test(a: int): int {
      return a * 2
    }
    test(21)
  `);
  assertEquals(result.value, 42);
});

Deno.test("Type checker - Explicit void return type", () => {
  assertThrows(
    () =>
      run(`
      fn test(a: int): void {
        return a
      }
      test(5)
    `),
    TypeCheckError,
    "with void return type cannot return a value",
  );
});
