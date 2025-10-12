import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate, RuntimeValue, ValueType } from "@runtime";
import { Result } from "../src/types/result.ts";

function runRaw(source_code: string): Result<RuntimeValue> {
  const tokenizer = new Tokenizer(source_code);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast_node = parser.parse();
  const global_env = createGlobalEnv();
  return evaluate(ast_node, global_env);
}

function run(source_code: string): RuntimeValue {
  const eval_result = runRaw(source_code);
  if (!eval_result.ok) {
    throw new Error(eval_result.error);
  }
  return eval_result.value;
}

function runExpectError(source_code: string): string {
  const eval_result = runRaw(source_code);
  if (eval_result.ok) {
    throw new Error("Expected error but got success");
  }
  return eval_result.error;
}

Deno.test("Evaluator - Number literal", () => {
  const result_val = run("42");
  assertEquals((result_val as any).type, ValueType.NUMBER);
  assertEquals((result_val as any).value, 42);
});

Deno.test("Evaluator - String literal", () => {
  const result_val = run('"hello"');
  assertEquals((result_val as any).type, ValueType.STRING);
  assertEquals((result_val as any).value, "hello");
});

Deno.test("Evaluator - Boolean literals", () => {
  const result1 = run("true");
  assertEquals((result1 as any).type, ValueType.BOOLEAN);
  assertEquals((result1 as any).value, true);

  const result2 = run("false");
  assertEquals((result2 as any).value, false);
});

Deno.test("Evaluator - Null literal", () => {
  const result_val = run("null");
  assertEquals((result_val as any).type, ValueType.NULL);
});

Deno.test("Evaluator - Arithmetic - addition", () => {
  const result_val = run("2 + 3");
  assertEquals((result_val as any).value, 5);
});

Deno.test("Evaluator - Arithmetic - subtraction", () => {
  const result_val = run("10 - 4");
  assertEquals((result_val as any).value, 6);
});

Deno.test("Evaluator - Arithmetic - multiplication", () => {
  const result = run("3 * 4");
  assertEquals((result as any).value, 12);
});

Deno.test("Evaluator - Arithmetic - division", () => {
  const result = run("15 / 3");
  assertEquals((result as any).value, 5);
});

Deno.test("Evaluator - Arithmetic - modulo", () => {
  const result = run("10 % 3");
  assertEquals((result as any).value, 1);
});

Deno.test("Evaluator - Arithmetic - operator precedence", () => {
  const result = run("2 + 3 * 4");
  assertEquals((result as any).value, 14);

  const result2 = run("(2 + 3) * 4");
  assertEquals((result2 as any).value, 20);
});

Deno.test("Evaluator - Arithmetic - division by zero", () => {
  const error_msg = runExpectError("5 / 0");
  assertEquals(error_msg.includes("Division by zero"), true);
});

Deno.test("Evaluator - Comparison - equality", () => {
  assertEquals((run("5 == 5") as any).value, true);
  assertEquals((run("5 == 3") as any).value, false);
  assertEquals((run("5 != 3") as any).value, true);
  assertEquals((run("5 != 5") as any).value, false);
});

Deno.test("Evaluator - Comparison - ordering", () => {
  assertEquals((run("3 < 5") as any).value, true);
  assertEquals((run("5 < 3") as any).value, false);
  assertEquals((run("5 > 3") as any).value, true);
  assertEquals((run("3 > 5") as any).value, false);
  assertEquals((run("5 <= 5") as any).value, true);
  assertEquals((run("5 >= 5") as any).value, true);
});

Deno.test("Evaluator - Logical - AND", () => {
  assertEquals((run("true && true") as any).value, true);
  assertEquals((run("true && false") as any).value, false);
  assertEquals((run("false && true") as any).value, false);
  assertEquals((run("false && false") as any).value, false);
});

Deno.test("Evaluator - Logical - OR", () => {
  assertEquals((run("true || true") as any).value, true);
  assertEquals((run("true || false") as any).value, true);
  assertEquals((run("false || true") as any).value, true);
  assertEquals((run("false || false") as any).value, false);
});

Deno.test("Evaluator - Unary - negation", () => {
  assertEquals((run("-5") as any).value, -5);
  assertEquals((run("-(-3)") as any).value, 3);
});

Deno.test("Evaluator - Unary - logical NOT", () => {
  assertEquals((run("!true") as any).value, false);
  assertEquals((run("!false") as any).value, true);
  assertEquals((run("!!true") as any).value, true);
});

Deno.test("Evaluator - Typeof - number", () => {
  assertEquals((run("typeof 42") as any).value, "number");
  assertEquals((run("typeof 3.14") as any).value, "number");
  assertEquals((run("x = 5\ntypeof x") as any).value, "number");
});

Deno.test("Evaluator - Typeof - string", () => {
  assertEquals((run('typeof "hello"') as any).value, "string");
  assertEquals((run("s = 'test'\ntypeof s") as any).value, "string");
});

Deno.test("Evaluator - Typeof - boolean", () => {
  assertEquals((run("typeof true") as any).value, "boolean");
  assertEquals((run("typeof false") as any).value, "boolean");
});

Deno.test("Evaluator - Typeof - null", () => {
  assertEquals((run("typeof null") as any).value, "null");
});

Deno.test("Evaluator - Typeof - array", () => {
  assertEquals((run("typeof [1, 2, 3]") as any).value, "array");
  assertEquals((run("arr = []\ntypeof arr") as any).value, "array");
});

Deno.test("Evaluator - Typeof - object", () => {
  assertEquals((run("typeof {x: 1, y: 2}") as any).value, "object");
  assertEquals((run("obj = {}\ntypeof obj") as any).value, "object");
});

Deno.test("Evaluator - Typeof - function", () => {
  assertEquals((run("fn test() { return 1 }\ntypeof test") as any).value, "function");
  assertEquals((run("lambda = x => x * 2\ntypeof lambda") as any).value, "function");
});

Deno.test("Evaluator - Typeof - with expressions", () => {
  assertEquals((run("typeof (5 + 3)") as any).value, "number");
  assertEquals((run("typeof (true && false)") as any).value, "boolean");
  assertEquals((run('typeof ("hello" + " world")') as any).value, "string");
});

Deno.test("Evaluator - Variable declaration and lookup", () => {
  const result = run(`
    x = 5
    x
  `);
  assertEquals((result as any).value, 5);
});

Deno.test("Evaluator - Multiple variable declarations", () => {
  const result = run(`
    x = 5
    y = 10
    x + y
  `);
  assertEquals((result as any).value, 15);
});

Deno.test("Evaluator - Variable with type annotation", () => {
  const result = run(`
    count: int = 42
    count
  `);
  assertEquals((result as any).value, 42);
});

Deno.test("Evaluator - Function declaration and call", () => {
  const result = run(`
    fn add(a, b) {
      return a + b
    }
    add(2, 3)
  `);
  assertEquals((result as any).value, 5);
});

Deno.test("Evaluator - Function with no parameters", () => {
  const result = run(`
    fn getAnswer() {
      return 42
    }
    getAnswer()
  `);
  assertEquals((result as any).value, 42);
});

Deno.test("Evaluator - Function with closure", () => {
  const result = run(`
    x = 10
    fn addX(n) {
      return n + x
    }
    addX(5)
  `);
  assertEquals((result as any).value, 15);
});

Deno.test("Evaluator - Recursive function", () => {
  const result = run(`
    fn factorial(n) {
      if (n <= 1) {
        return 1
      }
      return n * factorial(n - 1)
    }
    factorial(5)
  `);
  assertEquals((result as any).value, 120);
});

Deno.test("Evaluator - If statement - true condition", () => {
  const result = run(`
    fn test() {
      x = 0
      if (true) {
        return 42
      }
      return x
    }
    test()
  `);
  assertEquals((result as any).value, 42);
});

Deno.test("Evaluator - If statement - false condition", () => {
  const result = run(`
    x = 10
    if (false) {
      x = 42
    }
    x
  `);
  assertEquals((result as any).value, 10);
});

Deno.test("Evaluator - If statement with comparison", () => {
  const result = run(`
    fn absolute(n) {
      if (n < 0) {
        return -n
      }
      return n
    }
    absolute(-5)
  `);
  assertEquals((result as any).value, 5);
});

Deno.test("Evaluator - Array literal", () => {
  const result = run("[1, 2, 3]");
  assertEquals((result as any).type, ValueType.ARRAY);
  assertEquals((result as any).elements.length, 3);
  assertEquals((result as any).elements[0].value, 1);
  assertEquals((result as any).elements[1].value, 2);
  assertEquals((result as any).elements[2].value, 3);
});

Deno.test("Evaluator - Empty array", () => {
  const result = run("[]");
  assertEquals((result as any).type, ValueType.ARRAY);
  assertEquals((result as any).elements.length, 0);
});

Deno.test("Evaluator - Array with expressions", () => {
  const result = run("[1 + 1, 2 * 3, 10 - 5]");
  assertEquals((result as any).elements[0].value, 2);
  assertEquals((result as any).elements[1].value, 6);
  assertEquals((result as any).elements[2].value, 5);
});

Deno.test("Evaluator - Array indexing", () => {
  const result = run(`
    arr = [10, 20, 30]
    arr[1]
  `);
  assertEquals((result as any).value, 20);
});

Deno.test("Evaluator - Array index out of bounds", () => {
  const error_msg = runExpectError("arr = [1, 2, 3]\narr[10]");
  assertEquals(error_msg.includes("Array index out of bounds"), true);
});

Deno.test("Evaluator - Object literal", () => {
  const result = run('{name: "rahul", age: 21}');
  assertEquals((result as any).type, ValueType.OBJECT);
  assertEquals(((result as any).properties.get("name") as any).value, "rahul");
  assertEquals(((result as any).properties.get("age") as any).value, 21);
});

Deno.test("Evaluator - Empty object", () => {
  const result = run("{}");
  assertEquals((result as any).type, ValueType.OBJECT);
  assertEquals((result as any).properties.size, 0);
});

Deno.test("Evaluator - Object property access", () => {
  const result = run(`
    user = {name: "rahul", age: 21}
    user.name
  `);
  assertEquals((result as any).value, "rahul");
});

Deno.test("Evaluator - Object with computed values", () => {
  const result = run(`
    x = 5
    obj = {a: x + 1, b: x * 2}
    obj.a + obj.b
  `);
  assertEquals((result as any).value, 16); // (5+1) + (5*2) = 6 + 10 = 16
});

Deno.test("Evaluator - Return statement without value", () => {
  const result = run(`
    fn test() {
      return
    }
    test()
  `);
  assertEquals((result as any).type, ValueType.NULL);
});

Deno.test("Evaluator - Complex program", () => {
  const result = run(`
    fn fibonacci(n) {
      if (n <= 1) {
        return n
      }
      return fibonacci(n - 1) + fibonacci(n - 2)
    }
    
    result = fibonacci(7)
    result
  `);
  assertEquals((result as any).value, 13);
});

Deno.test("Evaluator - String concatenation with number", () => {
  const result = run('"hello" + 5');
  assertEquals((result as any).value, "hello5");
});

Deno.test("Evaluator - Type error - arithmetic on non-numbers", () => {
  const error_msg = runExpectError('"hello" - 5');
  assertEquals(error_msg.includes("TypeError"), true);
  assertEquals(error_msg.includes("Arithmetic operators require numbers"), true);
});

Deno.test("Evaluator - Type error - calling non-function", () => {
  const error_msg = runExpectError("x = 5\nx()");
  assertEquals(error_msg.includes("TypeError"), true);
  assertEquals(error_msg.includes("Cannot call non-function"), true);
});

Deno.test("Evaluator - Runtime error - wrong number of arguments", () => {
  const error_msg = runExpectError("fn test(a, b) { return a + b }\ntest(1)");
  assertEquals(error_msg.includes("RuntimeError"), true);
  assertEquals(error_msg.includes("expects 2 arguments, got 1"), true);
});

Deno.test("Evaluator - Truthiness", () => {
  assertEquals((run("fn test() { if (1) { return 1 } return 0 } test()") as any).value, 1);
  assertEquals((run("fn test() { if (0) { return 1 } return 0 } test()") as any).value, 0);
  assertEquals((run('fn test() { if ("") { return 1 } return 0 } test()') as any).value, 0);
  assertEquals((run('fn test() { if ("hello") { return 1 } return 0 } test()') as any).value, 1);
  assertEquals((run("fn test() { if (null) { return 1 } return 0 } test()") as any).value, 0);
});

Deno.test("Evaluator - Ternary expression - basic", () => {
  assertEquals((run("5 > 3 ? 100 : 200") as any).value, 100);
  assertEquals((run("2 > 5 ? 100 : 200") as any).value, 200);
});

Deno.test("Evaluator - Ternary expression - with variables", () => {
  assertEquals((run("x = 10\nx > 5 ? x * 2 : x / 2") as any).value, 20);
  assertEquals((run("x = 3\nx > 5 ? x * 2 : x / 2") as any).value, 1.5);
});

Deno.test("Evaluator - Ternary expression - nested", () => {
  assertEquals((run("x = 15\nx > 10 ? 1 : x > 5 ? 2 : 3") as any).value, 1);
  assertEquals((run("x = 7\nx > 10 ? 1 : x > 5 ? 2 : 3") as any).value, 2);
  assertEquals((run("x = 3\nx > 10 ? 1 : x > 5 ? 2 : 3") as any).value, 3);
});

Deno.test("Evaluator - Ternary expression - with strings", () => {
  assertEquals((run('age = 18\nage >= 18 ? "adult" : "minor"') as any).value, "adult");
  assertEquals((run('age = 15\nage >= 18 ? "adult" : "minor"') as any).value, "minor");
});

Deno.test("Evaluator - Ternary expression - with function calls", () => {
  assertEquals(
    (run("fn double(x) { return x * 2 }\ntrue ? double(5) : double(10)") as any).value,
    10,
  );
  assertEquals(
    (run("fn double(x) { return x * 2 }\nfalse ? double(5) : double(10)") as any).value,
    20,
  );
});

Deno.test("Evaluator - Ternary expression - short-circuit evaluation", () => {
  const result = run(`
    fn error() { return 1 / 0 }
    fn safe() { return 42 }
    true ? safe() : error()
  `);
  assertEquals((result as any).value, 42);
});
