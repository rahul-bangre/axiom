import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate } from "@runtime";

function run(source: string): any {
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const env = createGlobalEnv();
  return evaluate(ast, env);
}

Deno.test("Array - push adds element to end", () => {
  const result = run("[1, 2].push(3)");
  assertEquals(result.elements.length, 3);
  assertEquals(result.elements[2].value, 3);
});

Deno.test("Array - push returns new array", () => {
  const result = run(`
    a = [1, 2]
    b = a.push(3)
    len(a)
  `);
  assertEquals(result.value, 2);
});

Deno.test("Array - pop removes last element", () => {
  const result = run("[1, 2, 3].pop()");
  assertEquals(result.elements.length, 2);
  assertEquals(result.elements[1].value, 2);
});

Deno.test("Array - pop on empty array throws", () => {
  assertThrows(() => run("[].pop()"), Error, "pop() called on empty array");
});

Deno.test("Array - first returns first element", () => {
  const result = run("[10, 20, 30].first()");
  assertEquals(result.value, 10);
});

Deno.test("Array - first on empty array throws", () => {
  assertThrows(() => run("[].first()"), Error, "first() called on empty array");
});

Deno.test("Array - last returns last element", () => {
  const result = run("[10, 20, 30].last()");
  assertEquals(result.value, 30);
});

Deno.test("Array - last on empty array throws", () => {
  assertThrows(() => run("[].last()"), Error, "last() called on empty array");
});

Deno.test("Array - slice extracts subarray", () => {
  const result = run("[1, 2, 3, 4, 5].slice(1, 4)");
  assertEquals(result.elements.length, 3);
  assertEquals(result.elements[0].value, 2);
  assertEquals(result.elements[2].value, 4);
});

Deno.test("Array - slice with only start", () => {
  const result = run("[1, 2, 3, 4, 5].slice(2)");
  assertEquals(result.elements.length, 3);
  assertEquals(result.elements[0].value, 3);
});

Deno.test("Array - concat combines arrays", () => {
  const result = run("[1, 2].concat([3, 4])");
  assertEquals(result.elements.length, 4);
  assertEquals(result.elements[0].value, 1);
  assertEquals(result.elements[3].value, 4);
});

Deno.test("Array - concat with empty array", () => {
  const result = run("[1, 2].concat([])");
  assertEquals(result.elements.length, 2);
});

Deno.test("Array - chaining operations", () => {
  const result = run("[].push(1).push(2).push(3)");
  assertEquals(result.elements.length, 3);
  assertEquals(result.elements[0].value, 1);
  assertEquals(result.elements[2].value, 3);
});

Deno.test("Array - immutability preserved", () => {
  const result = run(`
    original = [1, 2, 3]
    modified = original.push(4)
    len(original)
  `);
  assertEquals(result.value, 3);
});

Deno.test("Array - method on non-array throws", () => {
  assertThrows(
    () => run('"not array".push(1)'),
    Error,
    "Cannot access property on non-object type",
  );
});

Deno.test("Array - slice non-number index", () => {
  assertThrows(() => run('[1, 2, 3].slice("a")'), Error, "start index must be a number");
});

Deno.test("Array - complex chaining", () => {
  const result = run("[1, 2, 3].push(4).pop().concat([5, 6])");
  assertEquals(result.elements.length, 5);
  assertEquals(result.elements[0].value, 1);
  assertEquals(result.elements[4].value, 6);
});

// Functional methods tests

Deno.test("Array - map transforms elements", () => {
  const result = run(`
    fn double(x) { return x * 2 }
    [1, 2, 3].map(double)
  `);
  assertEquals(result.elements.length, 3);
  assertEquals(result.elements[0].value, 2);
  assertEquals(result.elements[1].value, 4);
  assertEquals(result.elements[2].value, 6);
});

Deno.test("Array - map with closure", () => {
  const result = run(`
    multiplier = 10
    fn multiply_by_const(x) { return x * multiplier }
    [1, 2, 3].map(multiply_by_const)
  `);
  assertEquals(result.elements[0].value, 10);
  assertEquals(result.elements[1].value, 20);
  assertEquals(result.elements[2].value, 30);
});

Deno.test("Array - filter selects elements", () => {
  const result = run(`
    fn greater_than_two(x) { return x > 2 }
    [1, 2, 3, 4, 5].filter(greater_than_two)
  `);
  assertEquals(result.elements.length, 3);
  assertEquals(result.elements[0].value, 3);
  assertEquals(result.elements[1].value, 4);
  assertEquals(result.elements[2].value, 5);
});

Deno.test("Array - filter with even numbers", () => {
  const result = run(`
    fn is_even(x) { return x % 2 == 0 }
    [1, 2, 3, 4, 5, 6].filter(is_even)
  `);
  assertEquals(result.elements.length, 3);
  assertEquals(result.elements[0].value, 2);
  assertEquals(result.elements[1].value, 4);
  assertEquals(result.elements[2].value, 6);
});

Deno.test("Array - reduce accumulates values", () => {
  const result = run(`
    fn add(acc, x) { return acc + x }
    [1, 2, 3, 4].reduce(add, 0)
  `);
  assertEquals(result.value, 10);
});

Deno.test("Array - reduce with multiplication", () => {
  const result = run(`
    fn multiply(acc, x) { return acc * x }
    [2, 3, 4].reduce(multiply, 1)
  `);
  assertEquals(result.value, 24);
});

Deno.test("Array - reduce builds array", () => {
  const result = run(`
    fn push_double(acc, x) { return acc.push(x * 2) }
    [1, 2, 3].reduce(push_double, [])
  `);
  assertEquals(result.elements.length, 3);
  assertEquals(result.elements[0].value, 2);
  assertEquals(result.elements[2].value, 6);
});

Deno.test("Array - forEach executes side effects", () => {
  const result = run(`
    [1, 2, 3].forEach(print)
  `);
  assertEquals(result.type, 3);
});

Deno.test("Array - find returns first match", () => {
  const result = run(`
    fn greater_than_three(x) { return x > 3 }
    [1, 2, 3, 4, 5].find(greater_than_three)
  `);
  assertEquals(result.value, 4);
});

Deno.test("Array - find returns null if not found", () => {
  const result = run(`
    fn greater_than_ten(x) { return x > 10 }
    [1, 2, 3].find(greater_than_ten)
  `);
  assertEquals(result.type, 3);
});

Deno.test("Array - findIndex returns index of first match", () => {
  const result = run(`
    fn greater_than_three(x) { return x > 3 }
    [1, 2, 3, 4, 5].findIndex(greater_than_three)
  `);
  assertEquals(result.value, 3);
});

Deno.test("Array - findIndex returns -1 if not found", () => {
  const result = run(`
    fn greater_than_ten(x) { return x > 10 }
    [1, 2, 3].findIndex(greater_than_ten)
  `);
  assertEquals(result.value, -1);
});

Deno.test("Array - some returns true if any match", () => {
  const result = run(`
    fn greater_than_three(x) { return x > 3 }
    [1, 2, 3, 4].some(greater_than_three)
  `);
  assertEquals(result.value, true);
});

Deno.test("Array - some returns false if none match", () => {
  const result = run(`
    fn greater_than_ten(x) { return x > 10 }
    [1, 2, 3].some(greater_than_ten)
  `);
  assertEquals(result.value, false);
});

Deno.test("Array - every returns true if all match", () => {
  const result = run(`
    fn is_even(x) { return x % 2 == 0 }
    [2, 4, 6, 8].every(is_even)
  `);
  assertEquals(result.value, true);
});

Deno.test("Array - every returns false if any don't match", () => {
  const result = run(`
    fn is_even(x) { return x % 2 == 0 }
    [2, 3, 4, 6].every(is_even)
  `);
  assertEquals(result.value, false);
});

Deno.test("Array - flatMap flattens and maps", () => {
  const result = run(`
    fn duplicate(x) { return [x, x * 2] }
    [1, 2, 3].flatMap(duplicate)
  `);
  assertEquals(result.elements.length, 6);
  assertEquals(result.elements[0].value, 1);
  assertEquals(result.elements[1].value, 2);
  assertEquals(result.elements[2].value, 2);
  assertEquals(result.elements[3].value, 4);
});

Deno.test("Array - flatMap with conditional arrays", () => {
  const result = run(`
    fn maybe_double(x) { 
      if (x % 2 == 0) {
        return [x, x]
      }
      return [x]
    }
    [1, 2, 3, 4].flatMap(maybe_double)
  `);
  assertEquals(result.elements.length, 6);
  assertEquals(result.elements[0].value, 1);
  assertEquals(result.elements[1].value, 2);
  assertEquals(result.elements[2].value, 2);
});

Deno.test("Array - chaining functional methods", () => {
  const result = run(`
    fn is_even(x) { return x % 2 == 0 }
    fn square(x) { return x * x }
    fn add(acc, x) { return acc + x }
    [1, 2, 3, 4, 5]
      .filter(is_even)
      .map(square)
      .reduce(add, 0)
  `);
  assertEquals(result.value, 20);
});

Deno.test("Array - map requires function", () => {
  assertThrows(() => run("[1, 2, 3].map(5)"), Error, "map() requires a function");
});

Deno.test("Array - filter requires function", () => {
  assertThrows(() => run("[1, 2, 3].filter(5)"), Error, "filter() requires a function");
});

Deno.test("Array - reduce requires initial value", () => {
  assertThrows(
    () =>
      run(`
      fn add(a, x) { return a + x }
      [1, 2, 3].reduce(add)
    `),
    Error,
    "reduce() requires an initial value",
  );
});
