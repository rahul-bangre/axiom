import * as AST from "../parser/ast.ts";
import { Environment } from "./environment.ts";
import { RuntimeValue } from "../runtime/value.ts";

export class Interpreter {
  private global_env: Environment;

  constructor() {
    this.global_env = new Environment();
  }

  evaluate(node: AST.ASTNode, env: Environment = this.global_env): RuntimeValue {
    // TODO: Implement interpreter
    throw new Error("Not implemented");
  }
}
