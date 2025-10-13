import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { Environment, evaluate } from "@runtime";
import type { RuntimeValue } from "@runtime";
import { ok, runtimeError } from "@types";
import type { Result } from "@types";
import type { VirtualFS } from "./virtual-fs";

export interface ModuleExports {
  exports: Map<string, RuntimeValue>;
  path: string;
}

export class BrowserModuleLoader {
  private module_cache: Map<string, ModuleExports> = new Map();
  private loading_stack: Set<string> = new Set();
  public current_file: string = "";
  private virtual_fs: VirtualFS;

  constructor(virtual_fs: VirtualFS) {
    this.virtual_fs = virtual_fs;
  }

  async loadModule(
    import_path: string,
    base_path: string,
    global_env: Environment,
  ): Promise<Result<ModuleExports>> {
    const resolved_path = this.resolvePath(import_path, base_path);
    const previous_file = this.current_file;
    this.current_file = resolved_path;

    if (this.module_cache.has(resolved_path)) {
      this.current_file = previous_file;
      return ok(this.module_cache.get(resolved_path)!);
    }

    if (this.loading_stack.has(resolved_path)) {
      this.current_file = previous_file;
      return runtimeError(`Circular dependency detected: ${resolved_path}`);
    }

    this.loading_stack.add(resolved_path);

    try {
      const source_code = this.virtual_fs.readFile(resolved_path);
      if (source_code === null) {
        this.loading_stack.delete(resolved_path);
        this.current_file = previous_file;
        return runtimeError(`Module not found: ${resolved_path}`);
      }

      const tokenizer = new Tokenizer(source_code);
      const tokens = tokenizer.tokenize();

      const parser = new Parser(tokens);
      const ast = parser.parse();

      const module_env = global_env.extend();

      const eval_result = await evaluate(ast, module_env, this);
      if (!eval_result.ok) {
        this.loading_stack.delete(resolved_path);
        this.current_file = previous_file;
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

      const err_obj = error as Error;
      return runtimeError(`Failed to load module '${resolved_path}': ${err_obj.message}`);
    }
  }

  resolvePath(import_path: string, base_path: string): string {
    if (import_path.startsWith("/")) {
      return import_path;
    }

    if (!base_path) {
      return import_path.startsWith("./") ? import_path.slice(2) : import_path;
    }

    const base_dir = base_path.substring(0, base_path.lastIndexOf("/"));
    if (!base_dir) {
      return import_path.startsWith("./") ? import_path.slice(2) : import_path;
    }

    const resolved = `${base_dir}/${
      import_path.startsWith("./") ? import_path.slice(2) : import_path
    }`;
    return this.normalizePath(resolved);
  }

  private normalizePath(path: string): string {
    const parts = path.split("/");
    const result: string[] = [];

    for (const part of parts) {
      if (part === "." || part === "") {
        continue;
      }
      if (part === "..") {
        if (result.length > 0) {
          result.pop();
        }
      } else {
        result.push(part);
      }
    }

    return result.join("/");
  }
}
