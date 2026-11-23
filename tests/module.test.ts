import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "../src/lexer/tokenizer.ts";
import { Parser } from "../src/parser/parser.ts";
import { createGlobalEnv, evaluate } from "../src/runtime/mod.ts";
import { ModuleLoader } from "../src/runtime/module-loader.ts";
import { RuntimeValue } from "../src/runtime/value.ts";
import { Result } from "../src/types/result.ts";
import type { NumberValue } from "@runtime";

async function run(code: string, file_path: string): Promise<RuntimeValue> {
  const tokenizer = new Tokenizer(code);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const env = createGlobalEnv();
  const module_loader = new ModuleLoader();
  module_loader.current_file = file_path;
  const result: Result<RuntimeValue> = await evaluate(ast, env, module_loader);
  if (!result.ok) throw new Error(result.error);
  return result.value;
}

async function runExpectError(code: string, file_path: string): Promise<string> {
  try {
    await run(code, file_path);
    throw new Error("Expected error but code executed successfully");
  } catch (error) {
    return (error as Error).message;
  }
}

Deno.test("Module - use with alias", async () => {
  const code = `
    use "./math.ax" as math
    result = math.add(5, 3)
  `;
  const result = await run(code, `${Deno.cwd()}/tests/modules/main.ax`);
  assertEquals((result as NumberValue).value, 8);
});

Deno.test("Module - use with exposing", async () => {
  const code = `
    use "./math.ax" exposing { add, multiply }
    sum = add(10, 20)
    product = multiply(4, 5)
    result = add(sum, product)
  `;
  const result = await run(code, `${Deno.cwd()}/tests/modules/main.ax`);
  assertEquals((result as NumberValue).value, 50);
});

Deno.test("Module - export const", async () => {
  const code = `
    use "./math.ax" as math
    result = math.PI
  `;
  const result = await run(code, `${Deno.cwd()}/tests/modules/main.ax`);
  assertEquals((result as NumberValue).value, 3.14159);
});

Deno.test("Module - nested imports", async () => {
  const code = `
    use "./calculator.ax" exposing { calculate_sum }
    result = calculate_sum(1, 2, 3)
  `;
  const result = await run(code, `${Deno.cwd()}/tests/modules/main.ax`);
  assertEquals((result as NumberValue).value, 6);
});

Deno.test("Module - multiple imports", async () => {
  const code = `
    use "./math.ax" exposing { add }
    use "./utils.ax" exposing { greet }
    name = "World"
    greeting = greet(name)
    number = add(5, 10)
  `;
  const result = await run(code, `${Deno.cwd()}/tests/modules/main.ax`);
  assertEquals((result as NumberValue).value, 15);
});

Deno.test("Module - module not found", async () => {
  const code = `
    use "./nonexistent.ax" as mod
  `;
  const error = await runExpectError(code, `${Deno.cwd()}/tests/modules/main.ax`);
  assertEquals(error.includes("Module not found"), true);
});

Deno.test("Module - export undefined variable fails", async () => {
  const code = `
    export foo = bar
  `;
  const error = await runExpectError(code, `${Deno.cwd()}/tests/modules/main.ax`);
  assertEquals(error.includes("not defined"), true);
});

Deno.test("Module - exposing non-exported name fails", async () => {
  const code = `
    use "./math.ax" exposing { nonexistent }
  `;
  const error = await runExpectError(code, `${Deno.cwd()}/tests/modules/main.ax`);
  assertEquals(error.includes("does not export"), true);
});

Deno.test("Module - caching works (same module loaded twice)", async () => {
  const code = `
    use "./math.ax" as math1
    use "./math.ax" as math2
    result = math1.add(math2.PI, 1)
  `;
  const result = await run(code, `${Deno.cwd()}/tests/modules/main.ax`);
  assertEquals(Math.floor((result as NumberValue).value), 4);
});

Deno.test("Module - circular dependency detected", async () => {
  const code = `
    use "./circular_a.ax" exposing { a_func }
  `;
  const error = await runExpectError(code, `${Deno.cwd()}/tests/modules/main.ax`);
  assertEquals(error.includes("Circular dependency"), true);
});
