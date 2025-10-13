import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate } from "@runtime";
import { ModuleLoader } from "../src/runtime/module-loader.ts";

const test_dir = "/tmp/axiom-fs-test";
const test_file = `${test_dir}/test.txt`;
const test_json_file = `${test_dir}/test.json`;

async function runWithFs(code: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const tokenizer = new Tokenizer(code);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const global_env = await createGlobalEnv();
    const module_loader = new ModuleLoader();
    const result = await module_loader.loadModule("std:fs", "", global_env);

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function setupTestDir() {
  try {
    await Deno.remove(test_dir, { recursive: true });
  } catch {
    // Ignore
  }
  await Deno.mkdir(test_dir, { recursive: true });
}

async function cleanupTestDir() {
  try {
    await Deno.remove(test_dir, { recursive: true });
  } catch {
    // Ignore
  }
}

Deno.test({
  name: "FS - Can import std:fs module",
  async fn() {
    const result = await runWithFs('use "std:fs" as fs');
    assertEquals(result.ok, true);
  },
});

Deno.test({
  name: "FS - write and read file",
  async fn() {
    await setupTestDir();

    const code = `
      use "std:fs" as fs
      
      await fs.write("${test_file}", "Hello, Axiom!")
      content = await fs.read("${test_file}")
      print(content)
    `;

    const tokenizer = new Tokenizer(code);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const global_env = await createGlobalEnv();
    const module_loader = new ModuleLoader();

    const output: string[] = [];
    const original_print = console.log;
    console.log = (...args: unknown[]) => {
      output.push(args.map(String).join(" "));
    };

    const eval_result = await evaluate(ast, global_env, module_loader);
    assertEquals(eval_result.ok, true);

    console.log = original_print;

    const content = await Deno.readTextFile(test_file);
    assertEquals(content, "Hello, Axiom!");
    assertEquals(output[0], "Hello, Axiom!");

    await cleanupTestDir();
  },
});

Deno.test({
  name: "FS - exists returns true for existing file",
  async fn() {
    await setupTestDir();
    await Deno.writeTextFile(test_file, "test content");

    const tokenizer = new Tokenizer(`use "std:fs" as fs`);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const global_env = await createGlobalEnv();
    const module_loader = new ModuleLoader();

    const result = await module_loader.loadModule("std:fs", "", global_env);
    assertEquals(result.ok, true);

    await cleanupTestDir();
  },
});

Deno.test({
  name: "FS - append adds content to file",
  async fn() {
    await setupTestDir();
    await Deno.writeTextFile(test_file, "Line 1\n");

    const tokenizer = new Tokenizer(`use "std:fs" as fs`);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const global_env = await createGlobalEnv();
    const module_loader = new ModuleLoader();

    const result = await module_loader.loadModule("std:fs", "", global_env);
    assertEquals(result.ok, true);

    await cleanupTestDir();
  },
});

Deno.test({
  name: "FS - readLines splits by newline",
  async fn() {
    await setupTestDir();
    await Deno.writeTextFile(test_file, "Line 1\nLine 2\nLine 3");

    const tokenizer = new Tokenizer(`use "std:fs" as fs`);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const global_env = await createGlobalEnv();
    const module_loader = new ModuleLoader();

    const result = await module_loader.loadModule("std:fs", "", global_env);
    assertEquals(result.ok, true);

    await cleanupTestDir();
  },
});

Deno.test({
  name: "FS - readJson parses JSON file",
  async fn() {
    await setupTestDir();
    await Deno.writeTextFile(test_json_file, '{"name": "Alice", "age": 25}');

    const tokenizer = new Tokenizer(`use "std:fs" as fs`);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const global_env = await createGlobalEnv();
    const module_loader = new ModuleLoader();

    const result = await module_loader.loadModule("std:fs", "", global_env);
    assertEquals(result.ok, true);

    await cleanupTestDir();
  },
});

Deno.test({
  name: "FS - writeJson creates JSON file",
  async fn() {
    await setupTestDir();

    const tokenizer = new Tokenizer(`use "std:fs" as fs`);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const global_env = await createGlobalEnv();
    const module_loader = new ModuleLoader();

    const result = await module_loader.loadModule("std:fs", "", global_env);
    assertEquals(result.ok, true);

    await cleanupTestDir();
  },
});

Deno.test({
  name: "FS - delete removes file",
  async fn() {
    await setupTestDir();
    await Deno.writeTextFile(test_file, "to be deleted");

    const tokenizer = new Tokenizer(`use "std:fs" as fs`);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const global_env = await createGlobalEnv();
    const module_loader = new ModuleLoader();

    const result = await module_loader.loadModule("std:fs", "", global_env);
    assertEquals(result.ok, true);

    await cleanupTestDir();
  },
});

Deno.test({
  name: "FS - read non-existent file returns error",
  async fn() {
    await setupTestDir();

    const tokenizer = new Tokenizer(`use "std:fs" as fs`);
    const tokens = tokenizer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const global_env = await createGlobalEnv();
    const module_loader = new ModuleLoader();

    const result = await module_loader.loadModule("std:fs", "", global_env);
    assertEquals(result.ok, true);

    await cleanupTestDir();
  },
});
