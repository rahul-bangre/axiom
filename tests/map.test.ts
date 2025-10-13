import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate, RuntimeValue, ValueType } from "@runtime";

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

Deno.test("Map - create empty map", async () => {
  const result = await run(`
    m = map()
    typeof(m)
  `);

  assertEquals(result.type, ValueType.STRING);
  assertEquals((result as any).value, "object");
});

Deno.test("Map - create from object", async () => {
  const result = await run(`
    m = map({alice: 21, bob: 22})
    m.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 2);
});

Deno.test("Map - get returns value", async () => {
  const result = await run(`
    m = map({alice: 21, bob: 22})
    m.get("alice")
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 21);
});

Deno.test("Map - get returns null for missing key", async () => {
  const result = await run(`
    m = map({alice: 21, bob: 22})
    m.get("charlie")
  `);

  assertEquals(result.type, ValueType.NULL);
});

Deno.test("Map - set adds new entry", async () => {
  const result = await run(`
    m = map({alice: 21, bob: 22})
    m2 = m.set("carol", 23)
    m2.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 3);
});

Deno.test("Map - set updates existing entry", async () => {
  const result = await run(`
    m = map({alice: 21, bob: 22})
    m2 = m.set("alice", 30)
    m2.get("alice")
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 30);
});

Deno.test("Map - original unchanged after set", async () => {
  const result = await run(`
    m = map({alice: 21, bob: 22})
    m2 = m.set("carol", 23)
    m.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 2);
});

Deno.test("Map - has returns true for existing key", async () => {
  const result = await run(`
    m = map({alice: 21, bob: 22})
    m.has("alice")
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals((result as any).value, true);
});

Deno.test("Map - has returns false for missing key", async () => {
  const result = await run(`
    m = map({alice: 21, bob: 22})
    m.has("carol")
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals((result as any).value, false);
});

Deno.test("Map - delete removes entry", async () => {
  const result = await run(`
    m = map({alice: 21, bob: 22})
    m2 = m.delete("alice")
    m2.has("alice")
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals((result as any).value, false);
});

Deno.test("Map - delete updates size", async () => {
  const result = await run(`
    m = map({alice: 21, bob: 22})
    m2 = m.delete("alice")
    m2.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 1);
});

Deno.test("Map - original unchanged after delete", async () => {
  const result = await run(`
    m = map({alice: 21, bob: 22})
    m2 = m.delete("alice")
    m.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 2);
});

Deno.test("Map - keys returns array of keys", async () => {
  const result = await run(`
    m = map({alice: 21, bob: 22})
    keys = m.keys()
    len(keys)
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 2);
});

Deno.test("Map - values returns array of values", async () => {
  const result = await run(`
    m = map({alice: 21, bob: 22})
    values = m.values()
    len(values)
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 2);
});

Deno.test("Map - entries returns array of pairs", async () => {
  const result = await run(`
    m = map({alice: 21, bob: 22})
    entries = m.entries()
    len(entries)
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 2);
});

Deno.test("Map - entries has correct structure", async () => {
  const result = await run(`
    m = map({alice: 21})
    entries = m.entries()
    first = entries[0]
    len(first)
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 2);
});

Deno.test("Map - works with number keys", async () => {
  const result = await run(`
    m = map()
    m2 = m.set(1, "one")
    m3 = m2.set(2, "two")
    m3.get(1)
  `);

  assertEquals(result.type, ValueType.STRING);
  assertEquals((result as any).value, "one");
});

Deno.test("Map - chaining operations", async () => {
  const result = await run(`
    m = map({alice: 21})
    m2 = m.set("bob", 22).set("carol", 23).delete("alice")
    m2.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 2);
});

Deno.test("Map - empty map size is 0", async () => {
  const result = await run(`
    m = map()
    m.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 0);
});

Deno.test("Map - get() requires exactly 1 argument", async () => {
  const error = await runExpectError(`
    m = map({alice: 21})
    m.get()
  `);

  assertEquals(error.includes("expects exactly 1 argument"), true);
});

Deno.test("Map - set() requires exactly 2 arguments", async () => {
  const error = await runExpectError(`
    m = map({alice: 21})
    m.set("bob")
  `);

  assertEquals(error.includes("expects exactly 2 arguments"), true);
});

Deno.test("Map - has() requires exactly 1 argument", async () => {
  const error = await runExpectError(`
    m = map({alice: 21})
    m.has()
  `);

  assertEquals(error.includes("expects exactly 1 argument"), true);
});

Deno.test("Map - delete() requires exactly 1 argument", async () => {
  const error = await runExpectError(`
    m = map({alice: 21})
    m.delete()
  `);

  assertEquals(error.includes("expects exactly 1 argument"), true);
});

Deno.test("Map - large map performance", async () => {
  const result = await run(`
    fn createLargemap(n) {
      fn helper(i, m) {
        if (i > n) {
          return m
        }
        return helper(i + 1, m.set(i, i * 2))
      }
      return helper(1, map())
    }
    
    large = createLargemap(100)
    large.size()
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 100);
});

Deno.test("Map - lookup in large map", async () => {
  const result = await run(`
    fn createLargemap(n) {
      fn helper(i, m) {
        if (i > n) {
          return m
        }
        return helper(i + 1, m.set(i, i * 2))
      }
      return helper(1, map())
    }
    
    large = createLargemap(100)
    large.get(50)
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 100);
});
