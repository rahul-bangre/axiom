import { KEYWORDS, Token, TokenType } from "./tokens.ts";
import { LexerError } from "@runtime";

export class Tokenizer {
  private source: string;
  private pos = 0;
  private line = 1;
  private column = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (!this.isAtEnd()) {
      this.skipWhitespace();
      if (this.isAtEnd()) break;

      const token = this.nextToken();
      if (token) tokens.push(token);
    }

    tokens.push(this.makeToken(TokenType.EOF, ""));
    return tokens;
  }

  private nextToken(): Token | null {
    const char = this.peek();

    if (this.isDigit(char)) {
      return this.number();
    }

    if (char === '"' || char === "'") {
      return this.string();
    }

    if (this.isAlpha(char)) {
      return this.identifier();
    }

    return this.operator();
  }

  private number(): Token {
    const start = this.pos;

    while (this.isDigit(this.peek())) {
      this.advance();
    }

    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      this.advance();
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    return this.makeToken(TokenType.NUMBER, this.source.slice(start, this.pos));
  }

  private string(): Token {
    const quote = this.advance();
    const start = this.pos;

    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === "\n") {
        this.line++;
        this.column = 0;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new LexerError("Unterminated string", this.line, this.column);
    }

    const value = this.source.slice(start, this.pos);
    this.advance();

    return this.makeToken(TokenType.STRING, value);
  }

  private identifier(): Token {
    const start = this.pos;

    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const value = this.source.slice(start, this.pos);
    const type = KEYWORDS[value] ?? TokenType.IDENTIFIER;

    return this.makeToken(type, value);
  }

  private operator(): Token | null {
    const char = this.advance();

    switch (char) {
      case "+":
        return this.makeToken(TokenType.PLUS, char);
      case "-":
        if (this.peek() === ">") {
          this.advance();
          return this.makeToken(TokenType.THIN_ARROW, "->");
        }
        return this.makeToken(TokenType.MINUS, char);
      case "*":
        return this.makeToken(TokenType.MULTIPLY, char);
      case "/":
        if (this.peek() === "/") {
          this.skipLineComment();
          return null;
        }
        if (this.peek() === "*") {
          this.skipBlockComment();
          return null;
        }
        return this.makeToken(TokenType.DIVIDE, char);
      case "%":
        return this.makeToken(TokenType.MODULO, char);
      case "=":
        if (this.peek() === "=") {
          this.advance();
          return this.makeToken(TokenType.EQUALS, "==");
        }
        if (this.peek() === ">") {
          this.advance();
          return this.makeToken(TokenType.ARROW, "=>");
        }
        return this.makeToken(TokenType.ASSIGN, char);
      case "!":
        if (this.peek() === "=") {
          this.advance();
          return this.makeToken(TokenType.NOT_EQUALS, "!=");
        }
        return this.makeToken(TokenType.NOT, char);
      case "<":
        if (this.peek() === "=") {
          this.advance();
          return this.makeToken(TokenType.LESS_EQUALS, "<=");
        }
        return this.makeToken(TokenType.LESS_THAN, char);
      case ">":
        if (this.peek() === "=") {
          this.advance();
          return this.makeToken(TokenType.GREATER_EQUALS, ">=");
        }
        return this.makeToken(TokenType.GREATER_THAN, char);
      case "&":
        if (this.peek() === "&") {
          this.advance();
          return this.makeToken(TokenType.AND, "&&");
        }
        throw new LexerError(`Unexpected character '${char}'`, this.line, this.column);
      case "|":
        if (this.peek() === "|") {
          this.advance();
          return this.makeToken(TokenType.OR, "||");
        }
        throw new LexerError(`Unexpected character '${char}'`, this.line, this.column);
      case "(":
        return this.makeToken(TokenType.LPAREN, char);
      case ")":
        return this.makeToken(TokenType.RPAREN, char);
      case "{":
        return this.makeToken(TokenType.LBRACE, char);
      case "}":
        return this.makeToken(TokenType.RBRACE, char);
      case "[":
        return this.makeToken(TokenType.LBRACKET, char);
      case "]":
        return this.makeToken(TokenType.RBRACKET, char);
      case ",":
        return this.makeToken(TokenType.COMMA, char);
      case ":":
        return this.makeToken(TokenType.COLON, char);
      case ".":
        return this.makeToken(TokenType.DOT, char);
      case "?":
        return this.makeToken(TokenType.QUESTION, char);
      default:
        throw new LexerError(`Unexpected character '${char}'`, this.line, this.column);
    }
  }

  private skipWhitespace(): void {
    while (!this.isAtEnd()) {
      const char = this.peek();
      if (char === " " || char === "\t" || char === "\r") {
        this.advance();
      } else if (char === "\n") {
        this.line++;
        this.column = 0;
        this.advance();
      } else {
        break;
      }
    }
  }

  private skipLineComment(): void {
    while (!this.isAtEnd() && this.peek() !== "\n") {
      this.advance();
    }
  }

  private skipBlockComment(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.peek() === "*" && this.peekNext() === "/") {
        this.advance();
        this.advance();
        break;
      }
      if (this.peek() === "\n") {
        this.line++;
        this.column = 0;
      }
      this.advance();
    }
  }

  private isDigit(char: string): boolean {
    return char >= "0" && char <= "9";
  }

  private isAlpha(char: string): boolean {
    return (char >= "a" && char <= "z") || (char >= "A" && char <= "Z") || char === "_";
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source[this.pos];
  }

  private peekNext(): string {
    if (this.pos + 1 >= this.source.length) return "\0";
    return this.source[this.pos + 1];
  }

  private advance(): string {
    const char = this.source[this.pos];
    this.pos++;
    this.column++;
    return char;
  }

  private isAtEnd(): boolean {
    return this.pos >= this.source.length;
  }

  private makeToken(type: TokenType, value: string): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column - value.length,
    };
  }
}
