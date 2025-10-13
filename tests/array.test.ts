import {
  assertEquals,
  assertRejects,
  assertThrows,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate, ValueType } from "@runtime";
import type { ArrayValue, BooleanValue, NumberValue, RuntimeValue } from "@runtime";

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

Deno.test("Array - push adds element to end", async () => {
  const result = await run("[1, 2].push(3)") as ArrayValue;
  assertEquals(result.elements.length, 3);
  assertEquals((result.elements[2] as NumberValue).value, 3);
});

Deno.test("Array - push returns new array", async () => {
  const result = await run(`
    a = [1, 2]
    b = a.push(3)
    len(a)
  `) as NumberValue;
  assertEquals(result.value, 2);
});

Deno.test("Array - pop removes last element", async () => {
  const result = await run("[1, 2, 3].pop()") as ArrayValue;
  assertEquals(result.elements.length, 2);
  assertEquals((result.elements[1] as NumberValue).value, 2);
});

Deno.test("Array - pop on empty array throws", async () => {
  await assertRejects(async () => await run("[].pop()"), Error, "pop() called on empty array");
});

Deno.test("Array - first returns first element", async () => {
  const result = await run("[10, 20, 30].first()") as NumberValue;
  assertEquals(result.value, 10);
});

Deno.test("Array - first on empty array throws", async () => {
  await assertRejects(async () => await run("[].first()"), Error, "first() called on empty array");
});

Deno.test("Array - last returns last element", async () => {
  const result = await run("[10, 20, 30].last()") as NumberValue;
  assertEquals(result.value, 30);
});

Deno.test("Array - last on empty array throws", async () => {
  await assertRejects(async () => await run("[].last()"), Error, "last() called on empty array");
});

Deno.test("Array - slice extracts subarray", async () => {
  const result = await run("[1, 2, 3, 4, 5].slice(1, 4)") as ArrayValue;
  assertEquals(result.elements.length, 3);
  assertEquals((result.elements[0] as NumberValue).value, 2);
  assertEquals((result.elements[2] as NumberValue).value, 4);
});

Deno.test("Array - slice with only start", async () => {
  const result = await run("[1, 2, 3, 4, 5].slice(2)") as ArrayValue;
  assertEquals(result.elements.length, 3);
  assertEquals((result.elements[0] as NumberValue).value, 3);
});

Deno.test("Array - concat combines arrays", async () => {
  const result = await run("[1, 2].concat([3, 4])") as ArrayValue;
  assertEquals(result.elements.length, 4);
  assertEquals((result.elements[0] as NumberValue).value, 1);
  assertEquals((result.elements[3] as NumberValue).value, 4);
});

Deno.test("Array - concat with empty array", async () => {
  const result = await run("[1, 2].concat([])") as ArrayValue;
  assertEquals(result.elements.length, 2);
});

Deno.test("Array - chaining operations", async () => {
  const result = await run("[].push(1).push(2).push(3)") as ArrayValue;
  assertEquals(result.elements.length, 3);
  assertEquals((result.elements[0] as NumberValue).value, 1);
  assertEquals((result.elements[2] as NumberValue).value, 3);
});

Deno.test("Array - immutability preserved", async () => {
  const result = await run(`
    original = [1, 2, 3]
    modified = original.push(4)
    len(original)
  `) as NumberValue;
  assertEquals(result.value, 3);
});

Deno.test("Array - method on non-array throws", async () => {
  await assertRejects(
    async () => await run('"not array".push(1)'),
    Error,
    "String has no method 'push'",
  );
});

Deno.test("Array - slice non-number index", async () => {
  await assertRejects(
    async () => await run('[1, 2, 3].slice("a")'),
    Error,
    "start index must be a number",
  );
});

Deno.test("Array - complex chaining", async () => {
  const result = await run("[1, 2, 3].push(4).pop().concat([5, 6])") as ArrayValue;
  assertEquals(result.elements.length, 5);
  assertEquals((result.elements[0] as NumberValue).value, 1);
  assertEquals((result.elements[4] as NumberValue).value, 6);
});

// Functional methods tests

Deno.test("Array - map transforms elements", async () => {
  const result = await run(`
    fn double(x) { return x * 2 }
    [1, 2, 3].map(double)
  `) as ArrayValue;
  assertEquals(result.elements.length, 3);
  assertEquals((result.elements[0] as NumberValue).value, 2);
  assertEquals((result.elements[1] as NumberValue).value, 4);
  assertEquals((result.elements[2] as NumberValue).value, 6);
});

Deno.test("Array - map with closure", async () => {
  const result = await run(`
    multiplier = 10
    fn multiply_by_const(x) { return x * multiplier }
    [1, 2, 3].map(multiply_by_const)
  `) as ArrayValue;
  assertEquals((result.elements[0] as NumberValue).value, 10);
  assertEquals((result.elements[1] as NumberValue).value, 20);
  assertEquals((result.elements[2] as NumberValue).value, 30);
});

Deno.test("Array - filter selects elements", async () => {
  const result = await run(`
    fn greater_than_two(x) { return x > 2 }
    [1, 2, 3, 4, 5].filter(greater_than_two)
  `) as ArrayValue;
  assertEquals(result.elements.length, 3);
  assertEquals((result.elements[0] as NumberValue).value, 3);
  assertEquals((result.elements[1] as NumberValue).value, 4);
  assertEquals((result.elements[2] as NumberValue).value, 5);
});

Deno.test("Array - filter with even numbers", async () => {
  const result = await run(`
    fn is_even(x) { return x % 2 == 0 }
    [1, 2, 3, 4, 5, 6].filter(is_even)
  `) as ArrayValue;
  assertEquals(result.elements.length, 3);
  assertEquals((result.elements[0] as NumberValue).value, 2);
  assertEquals((result.elements[1] as NumberValue).value, 4);
  assertEquals((result.elements[2] as NumberValue).value, 6);
});

Deno.test("Array - reduce accumulates values", async () => {
  const result = await run(`
    fn add(acc, x) { return acc + x }
    [1, 2, 3, 4].reduce(add, 0)
  `) as NumberValue;
  assertEquals(result.value, 10);
});

Deno.test("Array - reduce with multiplication", async () => {
  const result = await run(`
    fn multiply(acc, x) { return acc * x }
    [2, 3, 4].reduce(multiply, 1)
  `) as NumberValue;
  assertEquals(result.value, 24);
});

Deno.test("Array - reduce builds array", async () => {
  const result = await run(`
    fn push_double(acc, x) { return acc.push(x * 2) }
    [1, 2, 3].reduce(push_double, [])
  `) as ArrayValue;
  assertEquals(result.elements.length, 3);
  assertEquals((result.elements[0] as NumberValue).value, 2);
  assertEquals((result.elements[2] as NumberValue).value, 6);
});

Deno.test("Array - forEach executes side effects", async () => {
  const result = await run(`
    [1, 2, 3].forEach(print)
  `);
  assertEquals(result.type, ValueType.NULL);
});

Deno.test("Array - find returns first match", async () => {
  const result = await run(`
    fn greater_than_three(x) { return x > 3 }
    [1, 2, 3, 4, 5].find(greater_than_three)
  `) as NumberValue;
  assertEquals(result.value, 4);
});

Deno.test("Array - find returns null if not found", async () => {
  const result = await run(`
    fn greater_than_ten(x) { return x > 10 }
    [1, 2, 3].find(greater_than_ten)
  `);
  assertEquals(result.type, ValueType.NULL);
});

Deno.test("Array - findIndex returns index of first match", async () => {
  const result = await run(`
    fn greater_than_three(x) { return x > 3 }
    [1, 2, 3, 4, 5].findIndex(greater_than_three)
  `) as NumberValue;
  assertEquals(result.value, 3);
});

Deno.test("Array - findIndex returns -1 if not found", async () => {
  const result = await run(`
    fn greater_than_ten(x) { return x > 10 }
    [1, 2, 3].findIndex(greater_than_ten)
  `) as NumberValue;
  assertEquals(result.value, -1);
});

Deno.test("Array - some returns true if any match", async () => {
  const result = await run(`
    fn greater_than_three(x) { return x > 3 }
    [1, 2, 3, 4].some(greater_than_three)
  `) as BooleanValue;
  assertEquals(result.value, true);
});

Deno.test("Array - some returns false if none match", async () => {
  const result = await run(`
    fn greater_than_ten(x) { return x > 10 }
    [1, 2, 3].some(greater_than_ten)
  `) as BooleanValue;
  assertEquals(result.value, false);
});

Deno.test("Array - every returns true if all match", async () => {
  const result = await run(`
    fn is_even(x) { return x % 2 == 0 }
    [2, 4, 6, 8].every(is_even)
  `) as BooleanValue;
  assertEquals(result.value, true);
});

Deno.test("Array - every returns false if any don't match", async () => {
  const result = await run(`
    fn is_even(x) { return x % 2 == 0 }
    [2, 3, 4, 6].every(is_even)
  `) as BooleanValue;
  assertEquals(result.value, false);
});

Deno.test("Array - flatMap flattens and maps", async () => {
  const result = await run(`
    fn duplicate(x) { return [x, x * 2] }
    [1, 2, 3].flatMap(duplicate)
  `) as ArrayValue;
  assertEquals(result.elements.length, 6);
  assertEquals((result.elements[0] as NumberValue).value, 1);
  assertEquals((result.elements[1] as NumberValue).value, 2);
  assertEquals((result.elements[2] as NumberValue).value, 2);
  assertEquals((result.elements[3] as NumberValue).value, 4);
});

Deno.test("Array - flatMap with conditional arrays", async () => {
  const result = await run(`
    fn maybe_double(x) { 
      if (x % 2 == 0) {
        return [x, x]
      }
      return [x]
    }
    [1, 2, 3, 4].flatMap(maybe_double)
  `) as ArrayValue;
  assertEquals(result.elements.length, 6);
  assertEquals((result.elements[0] as NumberValue).value, 1);
  assertEquals((result.elements[1] as NumberValue).value, 2);
  assertEquals((result.elements[2] as NumberValue).value, 2);
});

Deno.test("Array - chaining functional methods", async () => {
  const result = await run(`
    fn is_even(x) { return x % 2 == 0 }
    fn square(x) { return x * x }
    fn add(acc, x) { return acc + x }
    [1, 2, 3, 4, 5]
      .filter(is_even)
      .map(square)
      .reduce(add, 0)
  `) as NumberValue;
  assertEquals(result.value, 20);
});

Deno.test("Array - map requires function", async () => {
  await assertRejects(
    async () => await run("[1, 2, 3].map(5)"),
    Error,
    "map() requires a function",
  );
});

Deno.test("Array - filter requires function", async () => {
  await assertRejects(
    async () => await run("[1, 2, 3].filter(5)"),
    Error,
    "filter() requires a function",
  );
});

Deno.test("Array - reduce requires initial value", async () => {
  await assertRejects(
    async () =>
      await run(`
      fn add(a, x) { return a + x }
      [1, 2, 3].reduce(add)
    `),
    Error,
    "reduce() requires an initial value",
  );
});
