import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { Environment, evaluate, RuntimeError, TypeError, ValueType } from "@runtime";

function run(source: string): any {
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const env = new Environment();
  return evaluate(ast, env);
}

Deno.test("Evaluator - Number literal", () => {
  const result = run("42");
  assertEquals(result.type, ValueType.NUMBER);
  assertEquals(result.value, 42);
});

Deno.test("Evaluator - String literal", () => {
  const result = run('"hello"');
  assertEquals(result.type, ValueType.STRING);
  assertEquals(result.value, "hello");
});

Deno.test("Evaluator - Boolean literals", () => {
  const result1 = run("true");
  assertEquals(result1.type, ValueType.BOOLEAN);
  assertEquals(result1.value, true);

  const result2 = run("false");
  assertEquals(result2.value, false);
});

Deno.test("Evaluator - Null literal", () => {
  const result = run("null");
  assertEquals(result.type, ValueType.NULL);
});

Deno.test("Evaluator - Arithmetic - addition", () => {
  const result = run("2 + 3");
  assertEquals(result.value, 5);
});

Deno.test("Evaluator - Arithmetic - subtraction", () => {
  const result = run("10 - 4");
  assertEquals(result.value, 6);
});

Deno.test("Evaluator - Arithmetic - multiplication", () => {
  const result = run("3 * 4");
  assertEquals(result.value, 12);
});

Deno.test("Evaluator - Arithmetic - division", () => {
  const result = run("15 / 3");
  assertEquals(result.value, 5);
});

Deno.test("Evaluator - Arithmetic - modulo", () => {
  const result = run("10 % 3");
  assertEquals(result.value, 1);
});

Deno.test("Evaluator - Arithmetic - operator precedence", () => {
  const result = run("2 + 3 * 4");
  assertEquals(result.value, 14);

  const result2 = run("(2 + 3) * 4");
  assertEquals(result2.value, 20);
});

Deno.test("Evaluator - Arithmetic - division by zero", () => {
  assertThrows(
    () => run("5 / 0"),
    RuntimeError,
    "Division by zero",
  );
});

Deno.test("Evaluator - Comparison - equality", () => {
  assertEquals(run("5 == 5").value, true);
  assertEquals(run("5 == 3").value, false);
  assertEquals(run("5 != 3").value, true);
  assertEquals(run("5 != 5").value, false);
});

Deno.test("Evaluator - Comparison - ordering", () => {
  assertEquals(run("3 < 5").value, true);
  assertEquals(run("5 < 3").value, false);
  assertEquals(run("5 > 3").value, true);
  assertEquals(run("3 > 5").value, false);
  assertEquals(run("5 <= 5").value, true);
  assertEquals(run("5 >= 5").value, true);
});

Deno.test("Evaluator - Logical - AND", () => {
  assertEquals(run("true && true").value, true);
  assertEquals(run("true && false").value, false);
  assertEquals(run("false && true").value, false);
  assertEquals(run("false && false").value, false);
});

Deno.test("Evaluator - Logical - OR", () => {
  assertEquals(run("true || true").value, true);
  assertEquals(run("true || false").value, true);
  assertEquals(run("false || true").value, true);
  assertEquals(run("false || false").value, false);
});

Deno.test("Evaluator - Unary - negation", () => {
  assertEquals(run("-5").value, -5);
  assertEquals(run("-(-3)").value, 3);
});

Deno.test("Evaluator - Unary - logical NOT", () => {
  assertEquals(run("!true").value, false);
  assertEquals(run("!false").value, true);
  assertEquals(run("!!true").value, true);
});

Deno.test("Evaluator - Variable declaration and lookup", () => {
  const result = run(`
    x = 5
    x
  `);
  assertEquals(result.value, 5);
});

Deno.test("Evaluator - Multiple variable declarations", () => {
  const result = run(`
    x = 5
    y = 10
    x + y
  `);
  assertEquals(result.value, 15);
});

Deno.test("Evaluator - Variable with type annotation", () => {
  const result = run(`
    count: int = 42
    count
  `);
  assertEquals(result.value, 42);
});

Deno.test("Evaluator - Function declaration and call", () => {
  const result = run(`
    fn add(a, b) {
      return a + b
    }
    add(2, 3)
  `);
  assertEquals(result.value, 5);
});

Deno.test("Evaluator - Function with no parameters", () => {
  const result = run(`
    fn getAnswer() {
      return 42
    }
    getAnswer()
  `);
  assertEquals(result.value, 42);
});

Deno.test("Evaluator - Function with closure", () => {
  const result = run(`
    x = 10
    fn addX(n) {
      return n + x
    }
    addX(5)
  `);
  assertEquals(result.value, 15);
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
  assertEquals(result.value, 120);
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
  assertEquals(result.value, 42);
});

Deno.test("Evaluator - If statement - false condition", () => {
  const result = run(`
    x = 10
    if (false) {
      x = 42
    }
    x
  `);
  assertEquals(result.value, 10);
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
  assertEquals(result.value, 5);
});

Deno.test("Evaluator - Array literal", () => {
  const result = run("[1, 2, 3]");
  assertEquals(result.type, ValueType.ARRAY);
  assertEquals(result.elements.length, 3);
  assertEquals(result.elements[0].value, 1);
  assertEquals(result.elements[1].value, 2);
  assertEquals(result.elements[2].value, 3);
});

Deno.test("Evaluator - Empty array", () => {
  const result = run("[]");
  assertEquals(result.type, ValueType.ARRAY);
  assertEquals(result.elements.length, 0);
});

Deno.test("Evaluator - Array with expressions", () => {
  const result = run("[1 + 1, 2 * 3, 10 - 5]");
  assertEquals(result.elements[0].value, 2);
  assertEquals(result.elements[1].value, 6);
  assertEquals(result.elements[2].value, 5);
});

Deno.test("Evaluator - Array indexing", () => {
  const result = run(`
    arr = [10, 20, 30]
    arr[1]
  `);
  assertEquals(result.value, 20);
});

Deno.test("Evaluator - Array index out of bounds", () => {
  assertThrows(
    () => run("arr = [1, 2, 3]\narr[10]"),
    RuntimeError,
    "Array index out of bounds",
  );
});

Deno.test("Evaluator - Object literal", () => {
  const result = run('{name: "rahul", age: 21}');
  assertEquals(result.type, ValueType.OBJECT);
  assertEquals(result.properties.get("name").value, "rahul");
  assertEquals(result.properties.get("age").value, 21);
});

Deno.test("Evaluator - Empty object", () => {
  const result = run("{}");
  assertEquals(result.type, ValueType.OBJECT);
  assertEquals(result.properties.size, 0);
});

Deno.test("Evaluator - Object property access", () => {
  const result = run(`
    user = {name: "rahul", age: 21}
    user.name
  `);
  assertEquals(result.value, "rahul");
});

Deno.test("Evaluator - Object with computed values", () => {
  const result = run(`
    x = 5
    obj = {a: x + 1, b: x * 2}
    obj.a + obj.b
  `);
  assertEquals(result.value, 16); // (5+1) + (5*2) = 6 + 10 = 16
});

Deno.test("Evaluator - Return statement without value", () => {
  const result = run(`
    fn test() {
      return
    }
    test()
  `);
  assertEquals(result.type, ValueType.NULL);
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
  assertEquals(result.value, 13);
});

Deno.test("Evaluator - String concatenation with number", () => {
  const result = run('"hello" + 5');
  assertEquals(result.value, "hello5");
});

Deno.test("Evaluator - Type error - arithmetic on non-numbers", () => {
  assertThrows(
    () => run('"hello" - 5'),
    TypeError,
    "Arithmetic operators require numbers",
  );
});

Deno.test("Evaluator - Type error - calling non-function", () => {
  assertThrows(
    () => run("x = 5\nx()"),
    TypeError,
    "Cannot call non-function value",
  );
});

Deno.test("Evaluator - Runtime error - wrong number of arguments", () => {
  assertThrows(
    () => run("fn test(a, b) { return a + b }\ntest(1)"),
    RuntimeError,
    "expects 2 arguments, got 1",
  );
});

Deno.test("Evaluator - Truthiness", () => {
  assertEquals(run("fn test() { if (1) { return 1 } return 0 } test()").value, 1);
  assertEquals(run("fn test() { if (0) { return 1 } return 0 } test()").value, 0);
  assertEquals(run('fn test() { if ("") { return 1 } return 0 } test()').value, 0);
  assertEquals(run('fn test() { if ("hello") { return 1 } return 0 } test()').value, 1);
  assertEquals(run("fn test() { if (null) { return 1 } return 0 } test()").value, 0);
});
