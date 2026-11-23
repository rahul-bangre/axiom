import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import {
  ArrayValue,
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

// ==================== Basic Async Tests ====================

Deno.test("Async - function with async return type creates AsyncValue", async () => {
  const result = await run(`
    fn get_value(): async int {
      return 42
    }
    get_value()
  `);

  assertEquals(result.type, ValueType.ASYNC);
});

Deno.test("Async - await resolves AsyncValue to underlying value", async () => {
  const result = await run(`
    fn get_value(): async int {
      return 42
    }
    await get_value()
  `) as NumberValue;

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals(result.value, 42);
});

Deno.test("Async - await on string async", async () => {
  const result = await run(`
    fn get_name(): async string {
      return "Alice"
    }
    await get_name()
  `) as StringValue;

  assertEquals(result.type, ValueType.STRING);
  assertEquals(result.value, "Alice");
});

Deno.test("Async - typeof returns async for AsyncValue", async () => {
  const result = await run(`
    fn get_value(): async int {
      return 10
    }
    val = get_value()
    typeof val
  `) as StringValue;

  assertEquals(result.value, "async");
});

Deno.test("Async - typeof after await returns underlying type", async () => {
  const result = await run(`
    fn get_value(): async int {
      return 10
    }
    val = await get_value()
    typeof val
  `) as StringValue;

  assertEquals(result.value, "number");
});

// ==================== Async Composition Tests ====================

Deno.test("Async - await inside async function", async () => {
  const result = await run(`
    fn inner(): async int {
      return 5
    }
    
    fn outer(): async int {
      x = await inner()
      return x * 2
    }
    
    await outer()
  `) as NumberValue;

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals(result.value, 10);
});

Deno.test("Async - multiple awaits in sequence", async () => {
  const result = await run(`
    fn get_a(): async int {
      return 3
    }
    
    fn get_b(): async int {
      return 7
    }
    
    a = await get_a()
    b = await get_b()
    a + b
  `) as NumberValue;

  assertEquals(result.value, 10);
});

Deno.test("Async - async with array return", async () => {
  const result = await run(`
    fn get_numbers(): async array {
      return [1, 2, 3]
    }
    
    await get_numbers()
  `);

  assertEquals(result.type, ValueType.ARRAY);
  const arr = result as ArrayValue;
  assertEquals(arr.elements.length, 3);
});

Deno.test("Async - async with object return", async () => {
  const result = await run(`
    fn get_user(): async object {
      return { name: "Bob", age: 30 }
    }
    
    user = await get_user()
    user.name
  `) as StringValue;

  assertEquals(result.value, "Bob");
});

// ==================== Error Cases ====================

Deno.test("Async - await on non-async value throws", async () => {
  const error = await runExpectError(`
    x = 42
    await x
  `);

  assertEquals(error.includes("Cannot await non-async value"), true);
});

Deno.test("Async - await on string throws", async () => {
  const error = await runExpectError(`
    name = "test"
    await name
  `);

  assertEquals(error.includes("Cannot await non-async value"), true);
});

Deno.test("Async - await on array throws", async () => {
  const error = await runExpectError(`
    arr = [1, 2, 3]
    await arr
  `);

  assertEquals(error.includes("Cannot await non-async value"), true);
});

// ==================== Async with Operations ====================

Deno.test("Async - arithmetic with awaited values", async () => {
  const result = await run(`
    fn get_x(): async int {
      return 10
    }
    
    fn get_y(): async int {
      return 5
    }
    
    x = await get_x()
    y = await get_y()
    x + y
  `) as NumberValue;

  assertEquals(result.value, 15);
});

Deno.test("Async - string concatenation with awaited values", async () => {
  const result = await run(`
    fn get_first(): async string {
      return "Hello"
    }
    
    fn get_second(): async string {
      return "World"
    }
    
    a = await get_first()
    b = await get_second()
    a + " " + b
  `) as StringValue;

  assertEquals(result.value, "Hello World");
});

Deno.test("Async - array methods with async", async () => {
  const result = await run(`
    fn get_numbers(): async array {
      return [1, 2, 3, 4, 5]
    }
    
    nums = await get_numbers()
    nums.map((x) => x * 2)
  `);

  const arr = result as ArrayValue;
  assertEquals((arr.elements[0] as NumberValue).value, 2);
  assertEquals((arr.elements[1] as NumberValue).value, 4);
  assertEquals((arr.elements[4] as NumberValue).value, 10);
});

// ==================== Async with Conditionals ====================

Deno.test("Async - await in ternary expression", async () => {
  const result = await run(`
    fn get_value(): async int {
      return 10
    }
    
    x = true ? await get_value() : 0
    x
  `) as NumberValue;

  assertEquals(result.value, 10);
});

Deno.test("Async - async function with conditional return", async () => {
  const result = await run(`
    fn maybe_value(flag: bool): async int {
      if (flag) {
        return 100
      }
      return 0
    }
    
    await maybe_value(true)
  `) as NumberValue;

  assertEquals(result.value, 100);
});

// ==================== Async Variables ====================

Deno.test("Async - store async value in variable", async () => {
  const result = await run(`
    fn get_val(): async int {
      return 99
    }
    
    async_var = get_val()
    resolved = await async_var
    resolved
  `) as NumberValue;

  assertEquals(result.value, 99);
});

Deno.test("Async - pass async value around before awaiting", async () => {
  const result = await run(`
    fn create_async(): async string {
      return "deferred"
    }
    
    fn wrapper() {
      async_val = create_async()
      return async_val
    }
    
    val = wrapper()
    await val
  `) as StringValue;

  assertEquals(result.value, "deferred");
});
