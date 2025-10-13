import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate } from "@runtime";
import { ModuleLoader } from "../src/runtime/module-loader.ts";
import { ValueType } from "@runtime";

async function runProgram(code: string): Promise<{ ok: boolean; value?: unknown; error?: string }> {
  const tokenizer = new Tokenizer(code);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const global_env = await createGlobalEnv();
  const module_loader = new ModuleLoader();

  const result = await evaluate(ast, global_env, module_loader);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, value: result.value };
}

Deno.test("Math - abs with positive number", async () => {
  const code = `result = abs(5)`;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).type, ValueType.NUMBER);
  assertEquals((result.value as any).value, 5);
});

Deno.test("Math - abs with negative number", async () => {
  const code = `result = abs(-5)`;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 5);
});

Deno.test("Math - abs with zero", async () => {
  const code = `result = abs(0)`;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 0);
});

Deno.test("Math - min with two numbers", async () => {
  const code = `result = min(5, 3)`;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 3);
});

Deno.test("Math - min with multiple numbers", async () => {
  const code = `result = min(5, 3, 8, 1, 9)`;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 1);
});

Deno.test("Math - min with negative numbers", async () => {
  const code = `result = min(-5, -3, -8)`;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, -8);
});

Deno.test("Math - max with two numbers", async () => {
  const code = `result = max(5, 3)`;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 5);
});

Deno.test("Math - max with multiple numbers", async () => {
  const code = `result = max(5, 3, 8, 1, 9)`;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 9);
});

Deno.test("Math - can import std:math module", async () => {
  const code = `use "std:math" as math`;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
});

Deno.test("Math - math.pi constant", async () => {
  const code = `
    use "std:math" as math
    result = math.pi
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).type, ValueType.NUMBER);
  assertEquals(Math.abs((result.value as any).value - Math.PI) < 0.000001, true);
});

Deno.test("Math - math.e constant", async () => {
  const code = `
    use "std:math" as math
    result = math.e
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(Math.abs((result.value as any).value - Math.E) < 0.000001, true);
});

Deno.test("Math - math.infty constant", async () => {
  const code = `
    use "std:math" as math
    result = math.infty
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, Infinity);
});

Deno.test("Math - clamp within range", async () => {
  const code = `
    use "std:math" as math
    result = math.clamp(5, 0, 10)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 5);
});

Deno.test("Math - clamp below min", async () => {
  const code = `
    use "std:math" as math
    result = math.clamp(-5, 0, 10)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 0);
});

Deno.test("Math - clamp above max", async () => {
  const code = `
    use "std:math" as math
    result = math.clamp(15, 0, 10)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 10);
});

Deno.test("Math - sqrt of positive number", async () => {
  const code = `
    use "std:math" as math
    result = math.sqrt(16)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 4);
});

Deno.test("Math - sqrt of zero", async () => {
  const code = `
    use "std:math" as math
    result = math.sqrt(0)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 0);
});

Deno.test("Math - sqrt of negative number returns error", async () => {
  const code = `
    use "std:math" as math
    result = math.sqrt(-4)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, false);
  assertEquals(result.error?.includes("cannot compute square root of negative number"), true);
});

Deno.test("Math - pow basic", async () => {
  const code = `
    use "std:math" as math
    result = math.pow(2, 3)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 8);
});

Deno.test("Math - pow with fractional exponent", async () => {
  const code = `
    use "std:math" as math
    result = math.pow(16, 0.5)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 4);
});

Deno.test("Math - exp", async () => {
  const code = `
    use "std:math" as math
    result = math.exp(1)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(Math.abs((result.value as any).value - Math.E) < 0.000001, true);
});

Deno.test("Math - log natural (base e)", async () => {
  const code = `
    use "std:math" as math
    result = math.log(math.e)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(Math.abs((result.value as any).value - 1) < 0.000001, true);
});

Deno.test("Math - log with custom base", async () => {
  const code = `
    use "std:math" as math
    result = math.log(100, 10)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(Math.abs((result.value as any).value - 2) < 0.000001, true);
});

Deno.test("Math - log of negative returns error", async () => {
  const code = `
    use "std:math" as math
    result = math.log(-5)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, false);
  assertEquals(result.error?.includes("requires a positive number"), true);
});

Deno.test("Math - sign of positive number", async () => {
  const code = `
    use "std:math" as math
    result = math.sign(5)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 1);
});

Deno.test("Math - sign of negative number", async () => {
  const code = `
    use "std:math" as math
    result = math.sign(-5)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, -1);
});

Deno.test("Math - sign of zero", async () => {
  const code = `
    use "std:math" as math
    result = math.sign(0)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 0);
});

Deno.test("Math - round halfway up", async () => {
  const code = `
    use "std:math" as math
    result = math.round(3.5)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 4);
});

Deno.test("Math - round halfway down", async () => {
  const code = `
    use "std:math" as math
    result = math.round(3.4)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 3);
});

Deno.test("Math - floor", async () => {
  const code = `
    use "std:math" as math
    result = math.floor(3.9)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 3);
});

Deno.test("Math - floor negative", async () => {
  const code = `
    use "std:math" as math
    result = math.floor(-3.1)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, -4);
});

Deno.test("Math - ceil", async () => {
  const code = `
    use "std:math" as math
    result = math.ceil(3.1)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 4);
});

Deno.test("Math - ceil negative", async () => {
  const code = `
    use "std:math" as math
    result = math.ceil(-3.9)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, -3);
});

Deno.test("Math - trunc positive", async () => {
  const code = `
    use "std:math" as math
    result = math.trunc(3.9)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 3);
});

Deno.test("Math - trunc negative", async () => {
  const code = `
    use "std:math" as math
    result = math.trunc(-3.9)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, -3);
});

Deno.test("Math - random returns number in range", async () => {
  const code = `
    use "std:math" as math
    result = math.random()
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).type, ValueType.NUMBER);
  const value = (result.value as any).value;
  assertEquals(value >= 0 && value < 1, true);
});

Deno.test("Math - combining operations", async () => {
  const code = `
    use "std:math" as math
    radius = 5
    area = math.pi * math.pow(radius, 2)
    result = math.round(area)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as any).value, 79);
});

Deno.test("Math - abs requires number", async () => {
  const code = `result = abs("hello")`;
  const result = await runProgram(code);
  assertEquals(result.ok, false);
  assertEquals(result.error?.includes("requires a number"), true);
});

Deno.test("Math - min requires at least one argument", async () => {
  const code = `result = min()`;
  const result = await runProgram(code);
  assertEquals(result.ok, false);
  assertEquals(result.error?.includes("requires at least 1 argument"), true);
});

Deno.test("Math - max requires at least one argument", async () => {
  const code = `result = max()`;
  const result = await runProgram(code);
  assertEquals(result.ok, false);
  assertEquals(result.error?.includes("requires at least 1 argument"), true);
});
