import * as AST from "../parser/ast.ts";
import { TypeInfo } from "./types.ts";

export class TypeChecker {
  private type_env: Map<string, TypeInfo>;

  constructor() {
    this.type_env = new Map();
  }

  check(node: AST.ASTNode): TypeInfo {
    // TODO: Implement type checker
    throw new Error("Not implemented");
  }
}
