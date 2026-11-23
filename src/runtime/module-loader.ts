import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { Environment } from "./environment.ts";
import { RuntimeValue } from "./value.ts";
import { evaluate } from "./evaluator.ts";
import { ok, Result, runtimeError } from "../types/result.ts";
import { dirname, isAbsolute, join, resolve } from "https://deno.land/std@0.208.0/path/mod.ts";

export interface ModuleExports {
  exports: Map<string, RuntimeValue>;
  path: string;
}

export class ModuleLoader {
  private module_cache: Map<string, ModuleExports> = new Map();
  private loading_stack: Set<string> = new Set();
  public current_file: string = "";

  async loadModule(
    import_path: string,
    base_path: string,
    global_env: Environment,
  ): Promise<Result<ModuleExports>> {
    if (import_path.startsWith("std:")) {
      return await this.loadStdModule(import_path);
    }

    const resolved_path = this.resolvePath(import_path, base_path);
    const previous_file = this.current_file;
    this.current_file = resolved_path;

    if (this.module_cache.has(resolved_path)) {
      return ok(this.module_cache.get(resolved_path)!);
    }

    if (this.loading_stack.has(resolved_path)) {
      return runtimeError(`Circular dependency detected: ${resolved_path}`);
    }

    this.loading_stack.add(resolved_path);

    try {
      const source_code = await Deno.readTextFile(resolved_path);

      const tokenizer = new Tokenizer(source_code);
      const tokens = tokenizer.tokenize();

      const parser = new Parser(tokens);
      const ast = parser.parse();

      const module_env = global_env.extend();

      const eval_result = await evaluate(ast, module_env, this);
      if (!eval_result.ok) {
        return eval_result;
      }

      const exports = module_env.getExports();
      const module_exports: ModuleExports = {
        exports,
        path: resolved_path,
      };

      this.module_cache.set(resolved_path, module_exports);
      this.loading_stack.delete(resolved_path);
      this.current_file = previous_file;

      return ok(module_exports);
    } catch (error) {
      this.loading_stack.delete(resolved_path);
      this.current_file = previous_file;

      if (error instanceof Deno.errors.NotFound) {
        return runtimeError(`Module not found: ${resolved_path}`);
      }

      const err_obj = error as Error;
      return runtimeError(`Failed to load module '${resolved_path}': ${err_obj.message}`);
    }
  }

  async loadStdModule(import_path: string): Promise<Result<ModuleExports>> {
    const module_name = import_path.substring(4);

    let namespace: Record<string, RuntimeValue>;

    try {
      switch (module_name) {
        case "fs":
          namespace = (await import("../std/fs.ts")).fs_namespace;
          break;
        case "math":
          namespace = (await import("../std/math.ts")).math_namespace;
          break;
        case "db":
          namespace = (await import("../std/db.ts")).db_namespace;
          break;
        case "ws":
          namespace = (await import("../std/ws.ts")).ws_namespace;
          break;
        default:
          return runtimeError(`Unknown standard library module: ${module_name}`);
      }
    } catch (error) {
      const err = error as Error;
      return runtimeError(
        `Failed to load standard library module '${module_name}': ${err.message}`,
      );
    }

    const exports_map = new Map<string, RuntimeValue>();
    for (const [key, value] of Object.entries(namespace)) {
      exports_map.set(key, value);
    }

    return ok({
      exports: exports_map,
      path: import_path,
    });
  }

  resolvePath(import_path: string, base_path: string): string {
    if (isAbsolute(import_path)) {
      return resolve(import_path);
    }

    const base_dir = dirname(base_path);
    return resolve(join(base_dir, import_path));
  }
}
