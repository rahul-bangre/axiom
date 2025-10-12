import { ReferenceError } from "./errors.ts";
import { RuntimeValue } from "./value.ts";

export class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeValue>;

  constructor(parent?: Environment) {
    this.parent = parent;
    this.variables = new Map();
  }

  /* define a new variable in the current scope.
     since axiom is immutable, once defined, a variable cannot be redefined in the same scope. */
  define(name: string, value: RuntimeValue): RuntimeValue {
    if (this.variables.has(name)) {
      throw new ReferenceError(`Variable '${name}' is already defined in this scope`);
    }
    this.variables.set(name, value);
    return value;
  }

  /* look up a variable in the current scope or parent scopes.
     throws ReferenceError if the variable is not found. */
  get(name: string): RuntimeValue {
    if (this.variables.has(name)) {
      return this.variables.get(name)!;
    }

    if (this.parent) {
      return this.parent.get(name);
    }

    throw new ReferenceError(`Variable '${name}' is not defined`);
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
}
