import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import {
  createGlobalEnv,
  evaluate,
  NumberValue,
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

// ==================== Basic Match Tests ====================

Deno.test("Match - basic number matching", async () => {
  const result = await run(`
    match(1,
      0 -> "zero",
      1 -> "one",
      2 -> "two",
      default -> "other"
    )
  `) as StringValue;

  assertEquals(result.value, "one");
});

Deno.test("Match - matches first case", async () => {
  const result = await run(`
    match(0,
      0 -> "zero",
      1 -> "one",
      default -> "other"
    )
  `) as StringValue;

  assertEquals(result.value, "zero");
});

Deno.test("Match - uses default case", async () => {
  const result = await run(`
    match(999,
      0 -> "zero",
      1 -> "one",
      default -> "not found"
    )
  `) as StringValue;

  assertEquals(result.value, "not found");
});

Deno.test("Match - string matching", async () => {
  const result = await run(`
    match("hello",
      "hi" -> "greeting1",
      "hello" -> "greeting2",
      "bye" -> "farewell",
      default -> "unknown"
    )
  `) as StringValue;

  assertEquals(result.value, "greeting2");
});

Deno.test("Match - boolean matching", async () => {
  const result = await run(`
    match(true,
      false -> "no",
      true -> "yes",
      default -> "maybe"
    )
  `) as StringValue;

  assertEquals(result.value, "yes");
});

Deno.test("Match - null matching", async () => {
  const result = await run(`
    match(null,
      0 -> "zero",
      null -> "nothing",
      default -> "something"
    )
  `) as StringValue;

  assertEquals(result.value, "nothing");
});

// ==================== Match with Variables ====================

Deno.test("Match - with variable", async () => {
  const result = await run(`
    status = 404
    match(status,
      200 -> "OK",
      404 -> "Not Found",
      500 -> "Error",
      default -> "Unknown"
    )
  `) as StringValue;

  assertEquals(result.value, "Not Found");
});

Deno.test("Match - with expression", async () => {
  const result = await run(`
    x = 5
    match(x * 2,
      5 -> "five",
      10 -> "ten",
      15 -> "fifteen",
      default -> "other"
    )
  `) as StringValue;

  assertEquals(result.value, "ten");
});

// ==================== Match Expressions as Results ====================

Deno.test("Match - can be assigned to variable", async () => {
  const result = await run(`
    x = 2
    msg = match(x,
      1 -> "one",
      2 -> "two",
      default -> "many"
    )
    msg
  `) as StringValue;

  assertEquals(result.value, "two");
});

Deno.test("Match - can be used in expression", async () => {
  const result = await run(`
    n = 1
    "Value is: " + match(n,
      0 -> "zero",
      1 -> "one",
      default -> "many"
    )
  `) as StringValue;

  assertEquals(result.value, "Value is: one");
});

Deno.test("Match - can be used in function call", async () => {
  const result = await run(`
    fn double(x) {
      return x * 2
    }
    
    n = 5
    double(match(n,
      0 -> 0,
      5 -> 10,
      default -> 1
    ))
  `) as NumberValue;

  assertEquals(result.value, 20);
});

// ==================== Edge Cases ====================

Deno.test("Match - default only", async () => {
  const result = await run(`
    match(999,
      default -> "always"
    )
  `) as StringValue;

  assertEquals(result.value, "always");
});

Deno.test("Match - first matching case wins", async () => {
  const result = await run(`
    match(1,
      1 -> "first",
      1 -> "second",
      default -> "default"
    )
  `) as StringValue;

  assertEquals(result.value, "first");
});

Deno.test("Match - default can be anywhere", async () => {
  const result = await run(`
    match(999,
      1 -> "one",
      default -> "fallback",
      2 -> "two"
    )
  `) as StringValue;

  assertEquals(result.value, "fallback");
});

// ==================== Error Cases ====================

Deno.test("Match - error when no match and no default", async () => {
  const error = await runExpectError(`
    match(999,
      1 -> "one",
      2 -> "two"
    )
  `);

  assertEquals(error.includes("MatchError"), true);
  assertEquals(error.includes("no pattern matched"), true);
});

// ==================== Complex Patterns ====================

Deno.test("Match - with nested match", async () => {
  const result = await run(`
    x = 1
    y = 2
    match(x,
      1 -> match(y,
        1 -> "one-one",
        2 -> "one-two",
        default -> "one-other"
      ),
      2 -> "two",
      default -> "other"
    )
  `) as StringValue;

  assertEquals(result.value, "one-two");
});

Deno.test("Match - with function call in pattern", async () => {
  const result = await run(`
    fn getValue() {
      return 5
    }
    
    match(5,
      getValue() -> "matched",
      default -> "not matched"
    )
  `) as StringValue;

  assertEquals(result.value, "matched");
});

Deno.test("Match - returns different types", async () => {
  const result1 = await run(`
    match(1,
      0 -> 0,
      1 -> "one",
      default -> null
    )
  `) as StringValue;

  assertEquals(result1.type, ValueType.STRING);
  assertEquals(result1.value, "one");

  const result2 = await run(`
    match(0,
      0 -> 42,
      1 -> "one",
      default -> null
    )
  `) as NumberValue;

  assertEquals(result2.type, ValueType.NUMBER);
  assertEquals(result2.value, 42);
});
