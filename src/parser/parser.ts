import { Token, TokenType } from "../lexer/tokens.ts";
import * as AST from "./ast.ts";

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): AST.Program {
    // TODO: Implement parser
    return {
      type: AST.ASTNodeType.PROGRAM,
      body: [],
    };
  }
}
