import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate, RuntimeValue, ValueType } from "@runtime";
import { Result } from "../src/types/result.ts";

function run(source_code: string): Result<RuntimeValue> {
  const tokenizer = new Tokenizer(source_code);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast_node = parser.parse();
  const global_env = createGlobalEnv();
  return evaluate(ast_node, global_env);
}

// ========== split() ==========

Deno.test("String - split with delimiter", () => {
  const result = run('"hello,world".split(",")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.value.type, ValueType.ARRAY);
    const arr = (result.value as any).elements;
    assertEquals(arr.length, 2);
    assertEquals(arr[0].value, "hello");
    assertEquals(arr[1].value, "world");
  }
});

Deno.test("String - split without delimiter (chars)", () => {
  const result = run('"abc".split()');
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

Deno.test("String - split with space", () => {
  const result = run('"hello world from axiom".split(" ")');
  assertEquals(result.ok, true);
  if (result.ok) {
    const arr = (result.value as any).elements;
    assertEquals(arr.length, 4);
    assertEquals(arr[0].value, "hello");
    assertEquals(arr[3].value, "axiom");
  }
});

// ========== trim() ==========

Deno.test("String - trim", () => {
  const result = run('"  hello  ".trim()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hello");
  }
});

Deno.test("String - trimStart", () => {
  const result = run('"  hello  ".trimStart()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hello  ");
  }
});

Deno.test("String - trimEnd", () => {
  const result = run('"  hello  ".trimEnd()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "  hello");
  }
});

// ========== case conversion ==========

Deno.test("String - toUpperCase", () => {
  const result = run('"hello world".toUpperCase()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "HELLO WORLD");
  }
});

Deno.test("String - toLowerCase", () => {
  const result = run('"HELLO WORLD".toLowerCase()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hello world");
  }
});

// ========== replace() ==========

Deno.test("String - replace (first occurrence)", () => {
  const result = run('"hello hello".replace("hello", "hi")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hi hello");
  }
});

Deno.test("String - replaceAll", () => {
  const result = run('"hello hello hello".replaceAll("hello", "hi")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hi hi hi");
  }
});

// ========== startsWith / endsWith / includes ==========

Deno.test("String - startsWith true", () => {
  const result = run('"hello world".startsWith("hello")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, true);
  }
});

Deno.test("String - startsWith false", () => {
  const result = run('"hello world".startsWith("world")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, false);
  }
});

Deno.test("String - endsWith true", () => {
  const result = run('"hello world".endsWith("world")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, true);
  }
});

Deno.test("String - endsWith false", () => {
  const result = run('"hello world".endsWith("hello")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, false);
  }
});

Deno.test("String - includes true", () => {
  const result = run('"hello world".includes("o w")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, true);
  }
});

Deno.test("String - includes false", () => {
  const result = run('"hello world".includes("xyz")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, false);
  }
});

// ========== indexOf / lastIndexOf ==========

Deno.test("String - indexOf found", () => {
  const result = run('"hello world".indexOf("world")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, 6);
  }
});

Deno.test("String - indexOf not found", () => {
  const result = run('"hello world".indexOf("xyz")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, -1);
  }
});

Deno.test("String - lastIndexOf", () => {
  const result = run('"hello hello".lastIndexOf("hello")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, 6);
  }
});

// ========== substring ==========

Deno.test("String - substring with start only", () => {
  const result = run('"hello world".substring(6)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "world");
  }
});

Deno.test("String - substring with start and end", () => {
  const result = run('"hello world".substring(0, 5)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hello");
  }
});

Deno.test("String - substring middle", () => {
  const result = run('"hello world".substring(2, 8)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "llo wo");
  }
});

// ========== charAt ==========

Deno.test("String - charAt valid index", () => {
  const result = run('"hello".charAt(0)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "h");
  }
});

Deno.test("String - charAt last character", () => {
  const result = run('"hello".charAt(4)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "o");
  }
});

Deno.test("String - charAt out of bounds", () => {
  const result = run('"hello".charAt(10)');
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.includes("out of bounds"), true);
  }
});

// ========== repeat ==========

Deno.test("String - repeat", () => {
  const result = run('"ha".repeat(3)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hahaha");
  }
});

Deno.test("String - repeat zero times", () => {
  const result = run('"hello".repeat(0)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "");
  }
});

Deno.test("String - repeat negative count", () => {
  const result = run('"hello".repeat(-1)');
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.includes("non-negative"), true);
  }
});

// ========== padStart / padEnd ==========

Deno.test("String - padStart with default space", () => {
  const result = run('"5".padStart(3)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "  5");
  }
});

Deno.test("String - padStart with custom char", () => {
  const result = run('"5".padStart(3, "0")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "005");
  }
});

Deno.test("String - padEnd with default space", () => {
  const result = run('"5".padEnd(3)');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "5  ");
  }
});

Deno.test("String - padEnd with custom char", () => {
  const result = run('"5".padEnd(3, "0")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "500");
  }
});

// ========== Combined usage ==========

Deno.test("String - chained methods", () => {
  const result = run('"  HELLO WORLD  ".trim().toLowerCase()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hello world");
  }
});

Deno.test("String - split and process", () => {
  const result = run(`
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

Deno.test("Array - join with default comma", () => {
  const result = run('["hello", "world"].join()');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hello,world");
  }
});

Deno.test("Array - join with custom separator", () => {
  const result = run('["hello", "world"].join(" ")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "hello world");
  }
});

Deno.test("Array - join with dash", () => {
  const result = run('["2025", "10", "12"].join("-")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "2025-10-12");
  }
});

Deno.test("Array - join mixed types", () => {
  const result = run('[1, "hello", true].join(", ")');
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals((result.value as any).value, "1, hello, true");
  }
});

// ========== Error handling ==========

Deno.test("String - replace with non-string search", () => {
  const result = run('"hello".replace(5, "x")');
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.includes("TypeError"), true);
  }
});

Deno.test("String - split with non-string delimiter", () => {
  const result = run('"hello".split(5)');
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.includes("TypeError"), true);
  }
});

Deno.test("String - substring with non-number start", () => {
  const result = run('"hello".substring("x")');
  assertEquals(result.ok, false);
  if (!result.ok) {
    assertEquals(result.error.includes("TypeError"), true);
  }
});
