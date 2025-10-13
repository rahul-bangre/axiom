import { RuntimeValue } from "./value.ts";
import { ok, referenceError, Result } from "../types/result.ts";

export class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeValue>;
  private exports: Map<string, RuntimeValue>;

  constructor(parent?: Environment) {
    this.parent = parent;
    this.variables = new Map();
    this.exports = new Map();
  }

  /* define a new variable in the current scope.
     since axiom is immutable, once defined, a variable cannot be redefined in the same scope. */
  define(name: string, value: RuntimeValue): Result<RuntimeValue> {
    if (this.variables.has(name)) {
      return referenceError(`Variable '${name}' is already defined in this scope`);
    }
    this.variables.set(name, value);
    return ok(value);
  }

  /* look up a variable in the current scope or parent scopes. */
  get(name: string): Result<RuntimeValue> {
    if (this.variables.has(name)) {
      return ok(this.variables.get(name)!);
    }

    if (this.parent) {
      return this.parent.get(name);
    }

    return referenceError(`Variable '${name}' is not defined`);
  }

  /* check if a variable exists in the current scope (not parent scopes). */
  hasLocal(name: string): boolean {
    return this.variables.has(name);
  }

  /* check if a variable exists in the current scope or any parent scope. */
  has(name: string): boolean {
    if (this.variables.has(name)) {
      return true;
    }
    return this.parent ? this.parent.has(name) : false;
  }

  /* create a new child environment with this environment as the parent.
     useful for function scopes, block scopes, etc. */
  extend(): Environment {
    return new Environment(this);
  }

  /* mark a variable as exported from this module. */
  markExport(name: string): Result<void> {
    if (!this.variables.has(name)) {
      return referenceError(`Cannot export undefined variable '${name}'`);
    }
    this.exports.set(name, this.variables.get(name)!);
    return ok(undefined as void);
  }

  /* get all exported values from this module. */
  getExports(): Map<string, RuntimeValue> {
    return new Map(this.exports);
  }
}
