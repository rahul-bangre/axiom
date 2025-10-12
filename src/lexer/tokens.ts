export enum TokenType {
  NUMBER,
  STRING,
  IDENTIFIER,

  FN,
  RETURN,
  IF,
  TRUE,
  FALSE,
  NULL,
  TYPE,

  PLUS,
  MINUS,
  MULTIPLY,
  DIVIDE,
  MODULO,

  ASSIGN,
  EQUALS,
  NOT_EQUALS,
  LESS_THAN,
  GREATER_THAN,
  LESS_EQUALS,
  GREATER_EQUALS,

  AND,
  OR,
  NOT,

  LPAREN,
  RPAREN,
  LBRACE,
  RBRACE,
  LBRACKET,
  RBRACKET,

  COMMA,
  COLON,
  DOT,
  ARROW,
  QUESTION,

  EOF,
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export const KEYWORDS: Record<string, TokenType> = {
  fn: TokenType.FN,
  return: TokenType.RETURN,
  if: TokenType.IF,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  null: TokenType.NULL,
  type: TokenType.TYPE,
};
