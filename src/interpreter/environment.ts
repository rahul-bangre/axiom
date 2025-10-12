import { RuntimeValue } from "@runtime";

export class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeValue>;

  constructor(parent?: Environment) {
    this.parent = parent;
    this.variables = new Map();
  }

  declare(name: string, value: RuntimeValue): RuntimeValue {
    // TODO: Implement variable declaration
    return value;
  }

  lookup(name: string): RuntimeValue {
    // TODO: Implement variable lookup
    throw new Error("Not implemented");
  }
}
