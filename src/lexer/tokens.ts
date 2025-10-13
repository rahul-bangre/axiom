export enum TokenType {
  NUMBER,
  STRING,
  IDENTIFIER,

  FN,
  RETURN,
  IF,
  MATCH,
  DEFAULT,
  TRUE,
  FALSE,
  NULL,
  TYPE,
  TYPEOF,
  AWAIT,
  USE,
  AS,
  EXPOSING,
  EXPORT,

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
  THIN_ARROW,
  QUESTION,
  QUESTION_DOT,

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
  match: TokenType.MATCH,
  default: TokenType.DEFAULT,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  null: TokenType.NULL,
  type: TokenType.TYPE,
  typeof: TokenType.TYPEOF,
  await: TokenType.AWAIT,
  use: TokenType.USE,
  as: TokenType.AS,
  exposing: TokenType.EXPOSING,
  export: TokenType.EXPORT,
};
