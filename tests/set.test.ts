import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import {
  BooleanValue,
  createGlobalEnv,
  evaluate,
  NumberValue,
  RuntimeValue,
  StringValue,
  ValueType,
} from "@runtime";

async function run(source: string): Promise<RuntimeValue> {
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const global_env = createGlobalEnv();
  const result = await evaluate(ast, global_env);

  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.value;
}

async function runExpectError(source: string): Promise<string> {
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const global_env = createGlobalEnv();
  const result = await evaluate(ast, global_env);

  if (result.ok) {
    throw new Error("Expected error but got success");
  }

  return result.error;
}

Deno.test("Set - create empty set", async () => {
  const result = await run(`
    s = set()
    typeof(s)
  `);

  assertEquals(result.type, ValueType.STRING);
  assertEquals((result as StringValue).value, "object");
});

Deno.test("Set - create from array", async () => {
  const result = await run(`
    s = set([1, 2, 3])
    s.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 3);
});

Deno.test("Set - add removes duplicates", async () => {
  const result = await run(`
    s = set([1, 2, 3])
    s2 = s.add(2)
    s2.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 3);
});

Deno.test("Set - add new element", async () => {
  const result = await run(`
    s = set([1, 2, 3])
    s2 = s.add(4)
    s2.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 4);
});

Deno.test("Set - original unchanged after add", async () => {
  const result = await run(`
    s = set([1, 2, 3])
    s2 = s.add(4)
    s.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 3);
});

Deno.test("Set - has returns true for existing element", async () => {
  const result = await run(`
    s = set([1, 2, 3])
    s.has(2)
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals((result as BooleanValue).value, true);
});

Deno.test("Set - has returns false for missing element", async () => {
  const result = await run(`
    s = set([1, 2, 3])
    s.has(4)
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals((result as BooleanValue).value, false);
});

Deno.test("Set - delete removes element", async () => {
  const result = await run(`
    s = set([1, 2, 3])
    s2 = s.delete(2)
    s2.has(2)
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals((result as BooleanValue).value, false);
});

Deno.test("Set - delete updates size", async () => {
  const result = await run(`
    s = set([1, 2, 3])
    s2 = s.delete(2)
    s2.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 2);
});

Deno.test("Set - original unchanged after delete", async () => {
  const result = await run(`
    s = set([1, 2, 3])
    s2 = s.delete(2)
    s.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 3);
});

Deno.test("Set - union combines sets", async () => {
  const result = await run(`
    s1 = set([1, 2, 3])
    s2 = set([3, 4, 5])
    s3 = s1.union(s2)
    s3.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 5);
});

Deno.test("Set - intersection finds common elements", async () => {
  const result = await run(`
    s1 = set([1, 2, 3])
    s2 = set([2, 3, 4])
    s3 = s1.intersection(s2)
    s3.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 2);
});

Deno.test("Set - intersection has correct elements", async () => {
  const result = await run(`
    s1 = set([1, 2, 3])
    s2 = set([2, 3, 4])
    s3 = s1.intersection(s2)
    has2 = s3.has(2)
    has3 = s3.has(3)
    has1 = s3.has(1)
    has2 && has3 && !has1
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals((result as BooleanValue).value, true);
});

Deno.test("Set - difference removes elements", async () => {
  const result = await run(`
    s1 = set([1, 2, 3])
    s2 = set([2, 3, 4])
    s3 = s1.difference(s2)
    s3.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 1);
});

Deno.test("Set - difference has correct element", async () => {
  const result = await run(`
    s1 = set([1, 2, 3])
    s2 = set([2, 3, 4])
    s3 = s1.difference(s2)
    s3.has(1)
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals((result as BooleanValue).value, true);
});

Deno.test("Set - works with strings", async () => {
  const result = await run(`
    s = set(["apple", "banana", "cherry"])
    s.has("banana")
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals((result as BooleanValue).value, true);
});

Deno.test("Set - works with mixed types", async () => {
  const result = await run(`
    s = set([1, "hello", true])
    size = s.size()
    has_num = s.has(1)
    has_str = s.has("hello")
    has_bool = s.has(true)
    size == 3 && has_num && has_str && has_bool
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals((result as BooleanValue).value, true);
});

Deno.test("Set - toArray returns array", async () => {
  const result = await run(`
    s = set([1, 2, 3])
    arr = s.toArray()
    len(arr)
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 3);
});

Deno.test("Set - chaining operations", async () => {
  const result = await run(`
    s = set([1, 2, 3])
    s2 = s.add(4).add(5).delete(1)
    s2.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 4);
});

Deno.test("Set - empty set size is 0", async () => {
  const result = await run(`
    s = set()
    s.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 0);
});

Deno.test("Set - add() requires exactly 1 argument", async () => {
  const error = await runExpectError(`
    s = set([1, 2, 3])
    s.add()
  `);

  assertEquals(error.includes("expects exactly 1 argument"), true);
});

Deno.test("Set - has() requires exactly 1 argument", async () => {
  const error = await runExpectError(`
    s = set([1, 2, 3])
    s.has()
  `);

  assertEquals(error.includes("expects exactly 1 argument"), true);
});

Deno.test("Set - delete() requires exactly 1 argument", async () => {
  const error = await runExpectError(`
    s = set([1, 2, 3])
    s.delete()
  `);

  assertEquals(error.includes("expects exactly 1 argument"), true);
});

Deno.test("Set - union() requires exactly 1 argument", async () => {
  const error = await runExpectError(`
    s = set([1, 2, 3])
    s.union()
  `);

  assertEquals(error.includes("expects exactly 1 argument"), true);
});

Deno.test("Set - large set performance", async () => {
  const result = await run(`
    fn createLargeset(n) {
      fn helper(i, s) {
        if (i > n) {
          return s
        }
        return helper(i + 1, s.add(i))
      }
      return helper(1, set())
    }
    
    large = createLargeset(100)
    large.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 100);
});
