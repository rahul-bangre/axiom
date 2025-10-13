import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate, RuntimeValue, ValueType } from "@runtime";
import { Result } from "../src/types/result.ts";

async function run(source_code: string): Promise<Result<RuntimeValue>> {
  const tokenizer = new Tokenizer(source_code);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast_node = parser.parse();
  const global_env = createGlobalEnv();
  return await evaluate(ast_node, global_env);
}

// ========== split() ==========

Deno.test("String - split with delimiter", async () => {
  const result = await run('"hello,world".split(",")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.ARRAY);
    const arr = (result.value as any).elements;
    assertEquals(arr.length, 2);
    assertEquals(arr[0].value, "hello");
    assertEquals(arr[1].value, "world");
  }
});

Deno.test("String - split without delimiter (chars)", async () => {
  const result = await run('"abc".split()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.ARRAY);
    const arr = (result.value as any).elements;
    assertEquals(arr.length, 3);
    assertEquals(arr[0].value, "a");
    assertEquals(arr[1].value, "b");
    assertEquals(arr[2].value, "c");
  }
});

Deno.test("String - split with space", async () => {
  const result = await run('"hello world from axiom".split(" ")');
  assertEquals(result.ok, true);
  if (result.ok) {
    const arr = (result.value as any).elements;
    assertEquals(arr.length, 4);
    assertEquals(arr[0].value, "hello");
    assertEquals(arr[3].value, "axiom");
  }
});

// ========== trim() ==========

Deno.test("String - trim", async () => {
  const result = await run('"  hello  ".trim()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hello");
  }
});

Deno.test("String - trimStart", async () => {
  const result = await run('"  hello  ".trimStart()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hello  ");
  }
});

Deno.test("String - trimEnd", async () => {
  const result = await run('"  hello  ".trimEnd()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "  hello");
  }
});

// ========== case conversion ==========

Deno.test("String - toUpperCase", async () => {
  const result = await run('"hello world".toUpperCase()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "HELLO WORLD");
  }
});

Deno.test("String - toLowerCase", async () => {
  const result = await run('"HELLO WORLD".toLowerCase()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hello world");
  }
});

// ========== replace() ==========

Deno.test("String - replace (first occurrence)", async () => {
  const result = await run('"hello hello".replace("hello", "hi")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hi hello");
  }
});

Deno.test("String - replaceAll", async () => {
  const result = await run('"hello hello hello".replaceAll("hello", "hi")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hi hi hi");
  }
});

// ========== startsWith / endsWith / includes ==========

Deno.test("String - startsWith true", async () => {
  const result = await run('"hello world".startsWith("hello")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, true);
  }
});

Deno.test("String - startsWith false", async () => {
  const result = await run('"hello world".startsWith("world")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, false);
  }
});

Deno.test("String - endsWith true", async () => {
  const result = await run('"hello world".endsWith("world")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, true);
  }
});

Deno.test("String - endsWith false", async () => {
  const result = await run('"hello world".endsWith("hello")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, false);
  }
});

Deno.test("String - includes true", async () => {
  const result = await run('"hello world".includes("o w")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, true);
  }
});

Deno.test("String - includes false", async () => {
  const result = await run('"hello world".includes("xyz")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, false);
  }
});

// ========== indexOf / lastIndexOf ==========

Deno.test("String - indexOf found", async () => {
  const result = await run('"hello world".indexOf("world")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, 6);
  }
});

Deno.test("String - indexOf not found", async () => {
  const result = await run('"hello world".indexOf("xyz")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, -1);
  }
});

Deno.test("String - lastIndexOf", async () => {
  const result = await run('"hello hello".lastIndexOf("hello")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, 6);
  }
});

// ========== substring ==========

Deno.test("String - substring with start only", async () => {
  const result = await run('"hello world".substring(6)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "world");
  }
});

Deno.test("String - substring with start and end", async () => {
  const result = await run('"hello world".substring(0, 5)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hello");
  }
});

Deno.test("String - substring middle", async () => {
  const result = await run('"hello world".substring(2, 8)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "llo wo");
  }
});

// ========== charAt ==========

Deno.test("String - charAt valid index", async () => {
  const result = await run('"hello".charAt(0)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "h");
  }
});

Deno.test("String - charAt last character", async () => {
  const result = await run('"hello".charAt(4)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "o");
  }
});

Deno.test("String - charAt out of bounds", async () => {
  const result = await run('"hello".charAt(10)');
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.includes("out of bounds"), true);
  }
});

// ========== repeat ==========

Deno.test("String - repeat", async () => {
  const result = await run('"ha".repeat(3)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hahaha");
  }
});

Deno.test("String - repeat zero times", async () => {
  const result = await run('"hello".repeat(0)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "");
  }
});

Deno.test("String - repeat negative count", async () => {
  const result = await run('"hello".repeat(-1)');
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.includes("non-negative"), true);
  }
});

// ========== padStart / padEnd ==========

Deno.test("String - padStart with default space", async () => {
  const result = await run('"5".padStart(3)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "  5");
  }
});

Deno.test("String - padStart with custom char", async () => {
  const result = await run('"5".padStart(3, "0")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "005");
  }
});

Deno.test("String - padEnd with default space", async () => {
  const result = await run('"5".padEnd(3)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "5  ");
  }
});

Deno.test("String - padEnd with custom char", async () => {
  const result = await run('"5".padEnd(3, "0")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "500");
  }
});

// ========== Combined usage ==========

Deno.test("String - chained methods", async () => {
  const result = await run('"  HELLO WORLD  ".trim().toLowerCase()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hello world");
  }
});

Deno.test("String - split and process", async () => {
  const result = await run(`
    words = "hello,world".split(",")
    words.map((word) => word.toUpperCase())
  `);
  assertEquals(result.ok, true);
  if (result.ok) {
    const arr = (result.value as any).elements;
    assertEquals(arr[0].value, "HELLO");
    assertEquals(arr[1].value, "WORLD");
  }
});

// ========== Array join() ==========

Deno.test("Array - join with default comma", async () => {
  const result = await run('["hello", "world"].join()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hello,world");
  }
});

Deno.test("Array - join with custom separator", async () => {
  const result = await run('["hello", "world"].join(" ")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hello world");
  }
});

Deno.test("Array - join with dash", async () => {
  const result = await run('["2025", "10", "12"].join("-")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "2025-10-12");
  }
});

Deno.test("Array - join mixed types", async () => {
  const result = await run('[1, "hello", true].join(", ")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "1, hello, true");
  }
});

// ========== Error handling ==========

Deno.test("String - replace with non-string search", async () => {
  const result = await run('"hello".replace(5, "x")');
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.includes("TypeError"), true);
  }
});

Deno.test("String - split with non-string delimiter", async () => {
  const result = await run('"hello".split(5)');
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.includes("TypeError"), true);
  }
});

Deno.test("String - substring with non-number start", async () => {
  const result = await run('"hello".substring("x")');
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.includes("TypeError"), true);
  }
});
