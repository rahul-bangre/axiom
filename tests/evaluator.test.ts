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

async function runRaw(source_code: string): Promise<Result<RuntimeValue>> {
  const tokenizer = new Tokenizer(source_code);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast_node = parser.parse();
  const global_env = createGlobalEnv();
  return await evaluate(ast_node, global_env);
}

async function run(source_code: string): Promise<RuntimeValue> {
  const eval_result = await runRaw(source_code);
  if (!eval_result.ok) {
    throw new Error(eval_result.error);
  }
  return eval_result.value;
}

async function runExpectError(source_code: string): Promise<string> {
  const eval_result = await runRaw(source_code);
  if (eval_result.ok) {
    throw new Error("Expected error but got success");
  }
  return eval_result.error;
}

Deno.test("Evaluator - Number literal", async () => {
  const result_val = await run("42");
  assertEquals(result_val.type, ValueType.NUMBER);
  assertEquals((result_val as NumberValue).value, 42);
});

Deno.test("Evaluator - String literal", async () => {
  const result_val = await run('"hello"');
  assertEquals(result_val.type, ValueType.STRING);
  assertEquals((result_val as StringValue).value, "hello");
});

Deno.test("Evaluator - Boolean literals", async () => {
  const result1 = await run("true");
  assertEquals(result1.type, ValueType.BOOLEAN);
  assertEquals((result1 as BooleanValue).value, true);

  const result2 = await run("false");
  assertEquals((result2 as BooleanValue).value, false);
});

Deno.test("Evaluator - Null literal", async () => {
  const result_val = await run("null");
  assertEquals(result_val.type, ValueType.NULL);
});

Deno.test("Evaluator - Arithmetic - addition", async () => {
  const result_val = await run("2 + 3");
  assertEquals((result_val as NumberValue).value, 5);
});

Deno.test("Evaluator - Arithmetic - subtraction", async () => {
  const result_val = await run("10 - 4");
  assertEquals((result_val as NumberValue).value, 6);
});

Deno.test("Evaluator - Arithmetic - multiplication", async () => {
  const result = await run("3 * 4");
  assertEquals((result as NumberValue).value, 12);
});

Deno.test("Evaluator - Arithmetic - division", async () => {
  const result = await run("15 / 3");
  assertEquals((result as NumberValue).value, 5);
});

Deno.test("Evaluator - Arithmetic - modulo", async () => {
  const result = await run("10 % 3");
  assertEquals((result as NumberValue).value, 1);
});

Deno.test("Evaluator - Arithmetic - operator precedence", async () => {
  const result = await run("2 + 3 * 4");
  assertEquals((result as NumberValue).value, 14);

  const result2 = await run("(2 + 3) * 4");
  assertEquals((result2 as NumberValue).value, 20);
});

Deno.test("Evaluator - Arithmetic - division by zero", async () => {
  const error_msg = await runExpectError("5 / 0");
  assertEquals(error_msg.includes("Division by zero"), true);
});

Deno.test("Evaluator - Comparison - equality", async () => {
  assertEquals((await run("5 == 5") as BooleanValue).value, true);
  assertEquals((await run("5 == 3") as BooleanValue).value, false);
  assertEquals((await run("5 != 3") as BooleanValue).value, true);
  assertEquals((await run("5 != 5") as BooleanValue).value, false);
});

Deno.test("Evaluator - Comparison - ordering", async () => {
  assertEquals((await run("3 < 5") as BooleanValue).value, true);
  assertEquals((await run("5 < 3") as BooleanValue).value, false);
  assertEquals((await run("5 > 3") as BooleanValue).value, true);
  assertEquals((await run("3 > 5") as BooleanValue).value, false);
  assertEquals((await run("5 <= 5") as BooleanValue).value, true);
  assertEquals((await run("5 >= 5") as BooleanValue).value, true);
});

Deno.test("Evaluator - Logical - AND", async () => {
  assertEquals((await run("true && true") as BooleanValue).value, true);
  assertEquals((await run("true && false") as BooleanValue).value, false);
  assertEquals((await run("false && true") as BooleanValue).value, false);
  assertEquals((await run("false && false") as BooleanValue).value, false);
});

Deno.test("Evaluator - Logical - OR", async () => {
  assertEquals((await run("true || true") as BooleanValue).value, true);
  assertEquals((await run("true || false") as BooleanValue).value, true);
  assertEquals((await run("false || true") as BooleanValue).value, true);
  assertEquals((await run("false || false") as BooleanValue).value, false);
});

Deno.test("Evaluator - Unary - negation", async () => {
  assertEquals((await run("-5") as NumberValue).value, -5);
  assertEquals((await run("-(-3)") as NumberValue).value, 3);
});

Deno.test("Evaluator - Unary - logical NOT", async () => {
  assertEquals((await run("!true") as BooleanValue).value, false);
  assertEquals((await run("!false") as BooleanValue).value, true);
  assertEquals((await run("!!true") as BooleanValue).value, true);
});

Deno.test("Evaluator - Typeof - number", async () => {
  assertEquals((await run("typeof 42") as StringValue).value, "number");
  assertEquals((await run("typeof 3.14") as StringValue).value, "number");
  assertEquals((await run("x = 5\ntypeof x") as StringValue).value, "number");
});

Deno.test("Evaluator - Typeof - string", async () => {
  assertEquals((await run('typeof "hello"') as StringValue).value, "string");
  assertEquals((await run("s = 'test'\ntypeof s") as StringValue).value, "string");
});

Deno.test("Evaluator - Typeof - boolean", async () => {
  assertEquals((await run("typeof true") as StringValue).value, "boolean");
  assertEquals((await run("typeof false") as StringValue).value, "boolean");
});

Deno.test("Evaluator - Typeof - null", async () => {
  assertEquals((await run("typeof null") as StringValue).value, "null");
});

Deno.test("Evaluator - Typeof - array", async () => {
  assertEquals((await run("typeof [1, 2, 3]") as StringValue).value, "array");
  assertEquals((await run("arr = []\ntypeof arr") as StringValue).value, "array");
});

Deno.test("Evaluator - Typeof - object", async () => {
  assertEquals((await run("typeof {x: 1, y: 2}") as StringValue).value, "object");
  assertEquals((await run("obj = {}\ntypeof obj") as StringValue).value, "object");
});

Deno.test("Evaluator - Typeof - function", async () => {
  assertEquals((await run("fn test() { return 1 }\ntypeof test") as StringValue).value, "function");
  assertEquals((await run("lambda = x => x * 2\ntypeof lambda") as StringValue).value, "function");
});

Deno.test("Evaluator - Typeof - with expressions", async () => {
  assertEquals((await run("typeof (5 + 3)") as StringValue).value, "number");
  assertEquals((await run("typeof (true && false)") as StringValue).value, "boolean");
  assertEquals((await run('typeof ("hello" + " world")') as StringValue).value, "string");
});

Deno.test("Evaluator - Variable declaration and lookup", async () => {
  const result = await run(`
    x = 5
    x
  `);
  assertEquals((result as NumberValue).value, 5);
});

Deno.test("Evaluator - Multiple variable declarations", async () => {
  const result = await run(`
    x = 5
    y = 10
    x + y
  `);
  assertEquals((result as NumberValue).value, 15);
});

Deno.test("Evaluator - Variable with type annotation", async () => {
  const result = await run(`
    count: int = 42
    count
  `);
  assertEquals((result as NumberValue).value, 42);
});

Deno.test("Evaluator - Function declaration and call", async () => {
  const result = await run(`
    fn add(a, b) {
      return a + b
    }
    add(2, 3)
  `);
  assertEquals((result as NumberValue).value, 5);
});

Deno.test("Evaluator - Function with no parameters", async () => {
  const result = await run(`
    fn getAnswer() {
      return 42
    }
    getAnswer()
  `);
  assertEquals((result as NumberValue).value, 42);
});

Deno.test("Evaluator - Function with closure", async () => {
  const result = await run(`
    x = 10
    fn addX(n) {
      return n + x
    }
    addX(5)
  `);
  assertEquals((result as NumberValue).value, 15);
});

Deno.test("Evaluator - Recursive function", async () => {
  const result = await run(`
    fn factorial(n) {
      if (n <= 1) {
        return 1
      }
      return n * factorial(n - 1)
    }
    factorial(5)
  `);
  assertEquals((result as NumberValue).value, 120);
});

Deno.test("Evaluator - If statement - true condition", async () => {
  const result = await run(`
    fn test() {
      x = 0
      if (true) {
        return 42
      }
      return x
    }
    test()
  `);
  assertEquals((result as NumberValue).value, 42);
});

Deno.test("Evaluator - If statement - false condition", async () => {
  const result = await run(`
    x = 10
    if (false) {
      x = 42
    }
    x
  `);
  assertEquals((result as NumberValue).value, 10);
});

Deno.test("Evaluator - If statement with comparison", async () => {
  const result = await run(`
    fn absolute(n) {
      if (n < 0) {
        return -n
      }
      return n
    }
    absolute(-5)
  `);
  assertEquals((result as NumberValue).value, 5);
});

Deno.test("Evaluator - Array literal", async () => {
  const result = await run("[1, 2, 3]");
  assertEquals(result.type, ValueType.ARRAY);
  assertEquals((result as ArrayValue).elements.length, 3);
  assertEquals(((result as ArrayValue).elements[0] as NumberValue).value, 1);
  assertEquals(((result as ArrayValue).elements[1] as NumberValue).value, 2);
  assertEquals(((result as ArrayValue).elements[2] as NumberValue).value, 3);
});

Deno.test("Evaluator - Empty array", async () => {
  const result = await run("[]");
  assertEquals(result.type, ValueType.ARRAY);
  assertEquals((result as ArrayValue).elements.length, 0);
});

Deno.test("Evaluator - Array with expressions", async () => {
  const result = await run("[1 + 1, 2 * 3, 10 - 5]");
  assertEquals(((result as ArrayValue).elements[0] as NumberValue).value, 2);
  assertEquals(((result as ArrayValue).elements[1] as NumberValue).value, 6);
  assertEquals(((result as ArrayValue).elements[2] as NumberValue).value, 5);
});

Deno.test("Evaluator - Array indexing", async () => {
  const result = await run(`
    arr = [10, 20, 30]
    arr[1]
  `);
  assertEquals((result as NumberValue).value, 20);
});

Deno.test("Evaluator - Array index out of bounds", async () => {
  const error_msg = await runExpectError("arr = [1, 2, 3]\narr[10]");
  assertEquals(error_msg.includes("Array index out of bounds"), true);
});

Deno.test("Evaluator - Object literal", async () => {
  const result = await run('{name: "rahul", age: 21}');
  assertEquals(result.type, ValueType.OBJECT);
  assertEquals(((result as ObjectValue).properties.get("name") as StringValue).value, "rahul");
  assertEquals(((result as ObjectValue).properties.get("age") as NumberValue).value, 21);
});

Deno.test("Evaluator - Empty object", async () => {
  const result = await run("{}");
  assertEquals(result.type, ValueType.OBJECT);
  assertEquals((result as ObjectValue).properties.size, 0);
});

Deno.test("Evaluator - Object property access", async () => {
  const result = await run(`
    user = {name: "rahul", age: 21}
    user.name
  `);
  assertEquals((result as StringValue).value, "rahul");
});

Deno.test("Evaluator - Object with computed values", async () => {
  const result = await run(`
    x = 5
    obj = {a: x + 1, b: x * 2}
    obj.a + obj.b
  `);
  assertEquals((result as NumberValue).value, 16); // (5+1) + (5*2) = 6 + 10 = 16
});

Deno.test("Evaluator - Return statement without value", async () => {
  const result = await run(`
    fn test() {
      return
    }
    test()
  `);
  assertEquals(result.type, ValueType.NULL);
});

Deno.test("Evaluator - Complex program", async () => {
  const result = await run(`
    fn fibonacci(n) {
      if (n <= 1) {
        return n
      }
      return fibonacci(n - 1) + fibonacci(n - 2)
    }
    
    result = fibonacci(7)
    result
  `);
  assertEquals((result as NumberValue).value, 13);
});

Deno.test("Evaluator - String concatenation with number", async () => {
  const result = await run('"hello" + 5');
  assertEquals((result as StringValue).value, "hello5");
});

Deno.test("Evaluator - Type error - arithmetic on non-numbers", async () => {
  const error_msg = await runExpectError('"hello" - 5');
  assertEquals(error_msg.includes("TypeError"), true);
  assertEquals(error_msg.includes("Arithmetic operators require numbers"), true);
});

Deno.test("Evaluator - Type error - calling non-function", async () => {
  const error_msg = await runExpectError("x = 5\nx()");
  assertEquals(error_msg.includes("TypeError"), true);
  assertEquals(error_msg.includes("Cannot call non-function"), true);
});

Deno.test("Evaluator - Runtime error - wrong number of arguments", async () => {
  const error_msg = await runExpectError("fn test(a, b) { return a + b }\ntest(1)");
  assertEquals(error_msg.includes("RuntimeError"), true);
  assertEquals(error_msg.includes("expects 2 arguments, got 1"), true);
});

Deno.test("Evaluator - Truthiness", async () => {
  assertEquals(
    (await run("fn test() { if (1) { return 1 } return 0 } test()") as NumberValue).value,
    1,
  );
  assertEquals(
    (await run("fn test() { if (0) { return 1 } return 0 } test()") as NumberValue).value,
    0,
  );
  assertEquals(
    (await run('fn test() { if ("") { return 1 } return 0 } test()') as NumberValue).value,
    0,
  );
  assertEquals(
    (await run('fn test() { if ("hello") { return 1 } return 0 } test()') as NumberValue).value,
    1,
  );
  assertEquals(
    (await run("fn test() { if (null) { return 1 } return 0 } test()") as NumberValue).value,
    0,
  );
});

Deno.test("Evaluator - Ternary expression - basic", async () => {
  assertEquals((await run("5 > 3 ? 100 : 200") as NumberValue).value, 100);
  assertEquals((await run("2 > 5 ? 100 : 200") as NumberValue).value, 200);
});

Deno.test("Evaluator - Ternary expression - with variables", async () => {
  assertEquals((await run("x = 10\nx > 5 ? x * 2 : x / 2") as NumberValue).value, 20);
  assertEquals((await run("x = 3\nx > 5 ? x * 2 : x / 2") as NumberValue).value, 1.5);
});

Deno.test("Evaluator - Ternary expression - nested", async () => {
  assertEquals((await run("x = 15\nx > 10 ? 1 : x > 5 ? 2 : 3") as NumberValue).value, 1);
  assertEquals((await run("x = 7\nx > 10 ? 1 : x > 5 ? 2 : 3") as NumberValue).value, 2);
  assertEquals((await run("x = 3\nx > 10 ? 1 : x > 5 ? 2 : 3") as NumberValue).value, 3);
});

Deno.test("Evaluator - Ternary expression - with strings", async () => {
  assertEquals(
    (await run('age = 18\nage >= 18 ? "adult" : "minor"') as StringValue).value,
    "adult",
  );
  assertEquals(
    (await run('age = 15\nage >= 18 ? "adult" : "minor"') as StringValue).value,
    "minor",
  );
});

Deno.test("Evaluator - Ternary expression - with function calls", async () => {
  assertEquals(
    (await run("fn double(x) { return x * 2 }\ntrue ? double(5) : double(10)") as NumberValue)
      .value,
    10,
  );
  assertEquals(
    (await run("fn double(x) { return x * 2 }\nfalse ? double(5) : double(10)") as NumberValue)
      .value,
    20,
  );
});

Deno.test("Evaluator - Ternary expression - short-circuit evaluation", async () => {
  const result = await run(`
    fn error() { return 1 / 0 }
    fn safe() { return 42 }
    true ? safe() : error()
  `);
  assertEquals((result as NumberValue).value, 42);
});
