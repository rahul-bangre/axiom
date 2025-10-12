import { Token, TokenType } from "@lexer";
import * as AST from "./ast.ts";
import { LexerError } from "@runtime";

class ParserError extends Error {
  line: number;
  column: number;

  constructor(message: string, token: Token) {
    super(`${message} at line ${token.line}, column ${token.column}`);
    this.name = "ParserError";
    this.line = token.line;
    this.column = token.column;
  }
}

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): AST.Program {
    const statements: AST.Statement[] = [];

    while (!this.isAtEnd()) {
      statements.push(this.statement());
    }

    return {
      type: AST.ASTNodeType.PROGRAM,
      body: {
        type: AST.ASTNodeType.BLOCK_STATEMENT,
        body: statements,
      },
    };
  }

  private statement(): AST.Statement {
    if (this.match(TokenType.FN)) {
      return this.funcDeclaration();
    }

    if (this.match(TokenType.IF)) {
      return this.ifStatement();
    }

    if (this.match(TokenType.RETURN)) {
      return this.returnStatement();
    }

    if (this.check(TokenType.IDENTIFIER)) {
      const next = this.peekAhead(1);
      if (next && (next.type === TokenType.ASSIGN || next.type === TokenType.COLON)) {
        return this.constDeclaration();
      }
    }

    return this.expressionStatement();
  }

  private constDeclaration(): AST.ConstDeclaration {
    const identifier = this.consume(TokenType.IDENTIFIER, "Expected variable name").value;

    let type_annotation: string | undefined;
    if (this.match(TokenType.COLON)) {
      type_annotation = this.consume(TokenType.IDENTIFIER, "Expected type name").value;
    }

    this.consume(TokenType.ASSIGN, "Expected '=' in variable declaration");
    const value = this.expression();

    return {
      type: AST.ASTNodeType.CONST_DECLARATION,
      identifier,
      type_annotation,
      value,
    };
  }

  private funcDeclaration(): AST.FuncDeclaration {
    const name = this.consume(TokenType.IDENTIFIER, "Expected function name").value;

    this.consume(TokenType.LPAREN, "Expected '(' after function name");

    const params: Array<{ name: string; type_annotation?: string }> = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        const param_name = this.consume(TokenType.IDENTIFIER, "Expected parameter name").value;
        let type_annotation: string | undefined;

        if (this.match(TokenType.COLON)) {
          type_annotation = this.consume(TokenType.IDENTIFIER, "Expected type name").value;
        }

        params.push({ name: param_name, type_annotation });
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RPAREN, "Expected ')' after parameters");

    let return_type: string | undefined;
    if (this.match(TokenType.COLON)) {
      return_type = this.consume(TokenType.IDENTIFIER, "Expected return type").value;
    }

    this.consume(TokenType.LBRACE, "Expected '{' before function body");

    const body = this.blockStatement();

    return {
      type: AST.ASTNodeType.FUNC_DECLARATION,
      name,
      params,
      return_type,
      body,
    };
  }

  private ifStatement(): AST.IfStatement {
    this.consume(TokenType.LPAREN, "Expected '(' after 'if'");
    const condition = this.expression();
    this.consume(TokenType.RPAREN, "Expected ')' after condition");

    this.consume(TokenType.LBRACE, "Expected '{' after condition");
    const body = this.blockStatement();

    return {
      type: AST.ASTNodeType.IF_STATEMENT,
      condition,
      body,
    };
  }

  private returnStatement(): AST.ReturnStatement {
    let value: AST.Expression | undefined;

    if (!this.isAtEnd() && !this.check(TokenType.RBRACE)) {
      value = this.expression();
    }

    return {
      type: AST.ASTNodeType.RETURN_STATEMENT,
      value,
    };
  }

  private blockStatement(): AST.BlockStatement {
    const statements: AST.Statement[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      statements.push(this.statement());
    }

    this.consume(TokenType.RBRACE, "Expected '}' after block");

    return {
      type: AST.ASTNodeType.BLOCK_STATEMENT,
      body: statements,
    };
  }

  private expressionStatement(): AST.ExpressionStatement {
    const expression = this.expression();

    return {
      type: AST.ASTNodeType.EXPRESSION_STATEMENT,
      expression,
    };
  }

  private expression(): AST.Expression {
    return this.lambda();
  }

  private lambda(): AST.Expression {
    if (this.check(TokenType.IDENTIFIER)) {
      const next_pos = this.current + 1;
      if (next_pos < this.tokens.length && this.tokens[next_pos].type === TokenType.ARROW) {
        const param_name = this.advance().value;
        this.consume(TokenType.ARROW, "Expected '=>'");
        return this.lambdaBody([{ name: param_name }]);
      }
    }

    if (this.check(TokenType.LPAREN)) {
      const paren_pos = this.current;
      this.advance();

      if (!this.check(TokenType.IDENTIFIER) && !this.check(TokenType.RPAREN)) {
        this.current = paren_pos;
        return this.ternary();
      }

      const params: Array<{ name: string; type_annotation?: string }> = [];

      if (!this.check(TokenType.RPAREN)) {
        do {
          if (!this.check(TokenType.IDENTIFIER)) {
            this.current = paren_pos;
            return this.ternary();
          }

          const param_name = this.advance().value;
          let type_annotation: string | undefined;

          if (this.match(TokenType.COLON)) {
            type_annotation = this.consume(TokenType.IDENTIFIER, "Expected type name").value;
          }

          params.push({ name: param_name, type_annotation });
        } while (this.match(TokenType.COMMA));
      }

      if (!this.check(TokenType.RPAREN)) {
        this.current = paren_pos;
        return this.ternary();
      }

      this.advance();

      let return_type: string | undefined;
      if (this.match(TokenType.COLON)) {
        return_type = this.consume(TokenType.IDENTIFIER, "Expected return type").value;
      }

      if (this.match(TokenType.ARROW)) {
        return this.lambdaBody(params, return_type);
      }

      this.current = paren_pos;
    }

    return this.ternary();
  }

  private lambdaBody(
    params: Array<{ name: string; type_annotation?: string }>,
    return_type?: string,
  ): AST.LambdaExpr {
    if (this.match(TokenType.LBRACE)) {
      const body = this.blockStatement();
      return {
        type: AST.ASTNodeType.LAMBDA_EXPR,
        params,
        return_type,
        body,
        is_expression_body: false,
      };
    }

    const body_expr = this.lambda();
    return {
      type: AST.ASTNodeType.LAMBDA_EXPR,
      params,
      return_type,
      body: body_expr,
      is_expression_body: true,
    };
  }

  private ternary(): AST.Expression {
    const condition = this.logicalOr();

    if (this.match(TokenType.QUESTION)) {
      const true_expr = this.ternary();
      this.consume(TokenType.COLON, "Expected ':' after true expression in ternary");
      const false_expr = this.ternary();

      return {
        type: AST.ASTNodeType.TERNARY_EXPR,
        condition,
        true_expr,
        false_expr,
      };
    }

    return condition;
  }

  private logicalOr(): AST.Expression {
    let left = this.logicalAnd();

    while (this.match(TokenType.OR)) {
      const operator = this.previous().value;
      const right = this.logicalAnd();
      left = {
        type: AST.ASTNodeType.BINARY_EXPR,
        left,
        operator,
        right,
      };
    }

    return left;
  }

  private logicalAnd(): AST.Expression {
    let left = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous().value;
      const right = this.equality();
      left = {
        type: AST.ASTNodeType.BINARY_EXPR,
        left,
        operator,
        right,
      };
    }

    return left;
  }

  private equality(): AST.Expression {
    let left = this.comparison();

    while (this.match(TokenType.EQUALS, TokenType.NOT_EQUALS)) {
      const operator = this.previous().value;
      const right = this.comparison();
      left = {
        type: AST.ASTNodeType.BINARY_EXPR,
        left,
        operator,
        right,
      };
    }

    return left;
  }

  private comparison(): AST.Expression {
    let left = this.term();

    while (
      this.match(
        TokenType.LESS_THAN,
        TokenType.GREATER_THAN,
        TokenType.LESS_EQUALS,
        TokenType.GREATER_EQUALS,
      )
    ) {
      const operator = this.previous().value;
      const right = this.term();
      left = {
        type: AST.ASTNodeType.BINARY_EXPR,
        left,
        operator,
        right,
      };
    }

    return left;
  }

  private term(): AST.Expression {
    let left = this.factor();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous().value;
      const right = this.factor();
      left = {
        type: AST.ASTNodeType.BINARY_EXPR,
        left,
        operator,
        right,
      };
    }

    return left;
  }

  private factor(): AST.Expression {
    let left = this.unary();

    while (this.match(TokenType.MULTIPLY, TokenType.DIVIDE, TokenType.MODULO)) {
      const operator = this.previous().value;
      const right = this.unary();
      left = {
        type: AST.ASTNodeType.BINARY_EXPR,
        left,
        operator,
        right,
      };
    }

    return left;
  }

  private unary(): AST.Expression {
    if (this.match(TokenType.NOT, TokenType.MINUS, TokenType.TYPEOF)) {
      const operator = this.previous().value;
      const operand = this.unary();
      return {
        type: AST.ASTNodeType.UNARY_EXPR,
        operator,
        operand,
      };
    }

    return this.call();
  }

  private call(): AST.Expression {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LPAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(TokenType.DOT)) {
        const property: AST.Identifier = {
          type: AST.ASTNodeType.IDENTIFIER,
          name: this.consume(TokenType.IDENTIFIER, "Expected property name").value,
        };
        expr = {
          type: AST.ASTNodeType.MEMBER_EXPR,
          object: expr,
          property,
          computed: false,
        };
      } else if (this.match(TokenType.LBRACKET)) {
        const property = this.expression();
        this.consume(TokenType.RBRACKET, "Expected ']' after computed member expression");
        expr = {
          type: AST.ASTNodeType.MEMBER_EXPR,
          object: expr,
          property,
          computed: true,
        };
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: AST.Expression): AST.CallExpr {
    const args: AST.Expression[] = [];

    if (!this.check(TokenType.RPAREN)) {
      do {
        args.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RPAREN, "Expected ')' after arguments");

    return {
      type: AST.ASTNodeType.CALL_EXPR,
      callee,
      args,
    };
  }

  private member(): AST.Expression {
    return this.call();
  }

  private primary(): AST.Expression {
    if (this.match(TokenType.TRUE)) {
      return { type: AST.ASTNodeType.BOOLEAN_LITERAL, value: true };
    }

    if (this.match(TokenType.FALSE)) {
      return { type: AST.ASTNodeType.BOOLEAN_LITERAL, value: false };
    }

    if (this.match(TokenType.NULL)) {
      return { type: AST.ASTNodeType.NULL_LITERAL };
    }

    if (this.match(TokenType.NUMBER)) {
      return {
        type: AST.ASTNodeType.NUMBER_LITERAL,
        value: parseFloat(this.previous().value),
      };
    }

    if (this.match(TokenType.STRING)) {
      return {
        type: AST.ASTNodeType.STRING_LITERAL,
        value: this.previous().value,
      };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return {
        type: AST.ASTNodeType.IDENTIFIER,
        name: this.previous().value,
      };
    }

    if (this.match(TokenType.LBRACKET)) {
      return this.arrayLiteral();
    }

    if (this.match(TokenType.LBRACE)) {
      return this.objectLiteral();
    }

    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }

    throw new ParserError(`Unexpected token: ${this.peek().value}`, this.peek());
  }

  private arrayLiteral(): AST.ArrayLiteral {
    const elements: AST.Expression[] = [];

    if (!this.check(TokenType.RBRACKET)) {
      do {
        elements.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RBRACKET, "Expected ']' after array elements");

    return {
      type: AST.ASTNodeType.ARRAY_LITERAL,
      elements,
    };
  }

  private objectLiteral(): AST.ObjectLiteral {
    const properties: Array<{ key: string; value: AST.Expression }> = [];

    if (!this.check(TokenType.RBRACE)) {
      do {
        const key = this.consume(TokenType.IDENTIFIER, "Expected property name").value;
        this.consume(TokenType.COLON, "Expected ':' after property name");
        const value = this.expression();
        properties.push({ key, value });
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RBRACE, "Expected '}' after object properties");

    return {
      type: AST.ASTNodeType.OBJECT_LITERAL,
      properties,
    };
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private peekAhead(offset: number): Token | undefined {
    const index = this.current + offset;
    if (index >= this.tokens.length) return undefined;
    return this.tokens[index];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new ParserError(message, this.peek());
  }
}

export { ParserError };
