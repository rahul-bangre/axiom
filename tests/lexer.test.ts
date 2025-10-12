import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer, TokenType } from "@lexer";
import { LexerError } from "@runtime";

Deno.test("Tokenizer - Numbers", () => {
  const tokenizer = new Tokenizer("42 3.14 0");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.NUMBER);
  assertEquals(tokens[0].value, "42");
  assertEquals(tokens[1].type, TokenType.NUMBER);
  assertEquals(tokens[1].value, "3.14");
  assertEquals(tokens[2].type, TokenType.NUMBER);
  assertEquals(tokens[2].value, "0");
  assertEquals(tokens[3].type, TokenType.EOF);
});

Deno.test("Tokenizer - Strings with double quotes", () => {
  const tokenizer = new Tokenizer('"hello world"');
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.STRING);
  assertEquals(tokens[0].value, "hello world");
  assertEquals(tokens[1].type, TokenType.EOF);
});

Deno.test("Tokenizer - Strings with single quotes", () => {
  const tokenizer = new Tokenizer("'hello world'");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.STRING);
  assertEquals(tokens[0].value, "hello world");
  assertEquals(tokens[1].type, TokenType.EOF);
});

Deno.test("Tokenizer - Keywords", () => {
  const tokenizer = new Tokenizer("fn return if true false null type");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.FN);
  assertEquals(tokens[1].type, TokenType.RETURN);
  assertEquals(tokens[2].type, TokenType.IF);
  assertEquals(tokens[3].type, TokenType.TRUE);
  assertEquals(tokens[4].type, TokenType.FALSE);
  assertEquals(tokens[5].type, TokenType.NULL);
  assertEquals(tokens[6].type, TokenType.TYPE);
  assertEquals(tokens[7].type, TokenType.EOF);
});

Deno.test("Tokenizer - Identifiers (snake_case)", () => {
  const tokenizer = new Tokenizer("my_var user_name _private");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.IDENTIFIER);
  assertEquals(tokens[0].value, "my_var");
  assertEquals(tokens[1].type, TokenType.IDENTIFIER);
  assertEquals(tokens[1].value, "user_name");
  assertEquals(tokens[2].type, TokenType.IDENTIFIER);
  assertEquals(tokens[2].value, "_private");
  assertEquals(tokens[3].type, TokenType.EOF);
});

Deno.test("Tokenizer - Arithmetic operators", () => {
  const tokenizer = new Tokenizer("+ - * / %");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.PLUS);
  assertEquals(tokens[1].type, TokenType.MINUS);
  assertEquals(tokens[2].type, TokenType.MULTIPLY);
  assertEquals(tokens[3].type, TokenType.DIVIDE);
  assertEquals(tokens[4].type, TokenType.MODULO);
  assertEquals(tokens[5].type, TokenType.EOF);
});

Deno.test("Tokenizer - Assignment and equality", () => {
  const tokenizer = new Tokenizer("= ==");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.ASSIGN);
  assertEquals(tokens[0].value, "=");
  assertEquals(tokens[1].type, TokenType.EQUALS);
  assertEquals(tokens[1].value, "==");
  assertEquals(tokens[2].type, TokenType.EOF);
});

Deno.test("Tokenizer - Comparison operators", () => {
  const tokenizer = new Tokenizer("< > <= >= !=");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.LESS_THAN);
  assertEquals(tokens[1].type, TokenType.GREATER_THAN);
  assertEquals(tokens[2].type, TokenType.LESS_EQUALS);
  assertEquals(tokens[3].type, TokenType.GREATER_EQUALS);
  assertEquals(tokens[4].type, TokenType.NOT_EQUALS);
  assertEquals(tokens[5].type, TokenType.EOF);
});

Deno.test("Tokenizer - Logical operators", () => {
  const tokenizer = new Tokenizer("&& || !");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.AND);
  assertEquals(tokens[0].value, "&&");
  assertEquals(tokens[1].type, TokenType.OR);
  assertEquals(tokens[1].value, "||");
  assertEquals(tokens[2].type, TokenType.NOT);
  assertEquals(tokens[2].value, "!");
  assertEquals(tokens[3].type, TokenType.EOF);
});

Deno.test("Tokenizer - Delimiters", () => {
  const tokenizer = new Tokenizer("( ) { } [ ] , : .");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.LPAREN);
  assertEquals(tokens[1].type, TokenType.RPAREN);
  assertEquals(tokens[2].type, TokenType.LBRACE);
  assertEquals(tokens[3].type, TokenType.RBRACE);
  assertEquals(tokens[4].type, TokenType.LBRACKET);
  assertEquals(tokens[5].type, TokenType.RBRACKET);
  assertEquals(tokens[6].type, TokenType.COMMA);
  assertEquals(tokens[7].type, TokenType.COLON);
  assertEquals(tokens[8].type, TokenType.DOT);
  assertEquals(tokens[9].type, TokenType.EOF);
});

Deno.test("Tokenizer - Line comments", () => {
  const tokenizer = new Tokenizer("x = 5 // this is a comment\ny = 10");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.IDENTIFIER);
  assertEquals(tokens[0].value, "x");
  assertEquals(tokens[1].type, TokenType.ASSIGN);
  assertEquals(tokens[2].type, TokenType.NUMBER);
  assertEquals(tokens[2].value, "5");
  assertEquals(tokens[3].type, TokenType.IDENTIFIER);
  assertEquals(tokens[3].value, "y");
  assertEquals(tokens[4].type, TokenType.ASSIGN);
  assertEquals(tokens[5].type, TokenType.NUMBER);
  assertEquals(tokens[5].value, "10");
  assertEquals(tokens[6].type, TokenType.EOF);
});

Deno.test("Tokenizer - Block comments", () => {
  const tokenizer = new Tokenizer("x = 5 /* this is a\nmulti-line comment */ y = 10");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.IDENTIFIER);
  assertEquals(tokens[0].value, "x");
  assertEquals(tokens[1].type, TokenType.ASSIGN);
  assertEquals(tokens[2].type, TokenType.NUMBER);
  assertEquals(tokens[2].value, "5");
  assertEquals(tokens[3].type, TokenType.IDENTIFIER);
  assertEquals(tokens[3].value, "y");
  assertEquals(tokens[4].type, TokenType.ASSIGN);
  assertEquals(tokens[5].type, TokenType.NUMBER);
  assertEquals(tokens[5].value, "10");
  assertEquals(tokens[6].type, TokenType.EOF);
});

Deno.test("Tokenizer - Variable declaration", () => {
  const tokenizer = new Tokenizer('user_name = "rahul"');
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.IDENTIFIER);
  assertEquals(tokens[0].value, "user_name");
  assertEquals(tokens[1].type, TokenType.ASSIGN);
  assertEquals(tokens[2].type, TokenType.STRING);
  assertEquals(tokens[2].value, "rahul");
  assertEquals(tokens[3].type, TokenType.EOF);
});

Deno.test("Tokenizer - Function declaration", () => {
  const tokenizer = new Tokenizer("fn add(a, b) { return a + b }");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.FN);
  assertEquals(tokens[1].type, TokenType.IDENTIFIER);
  assertEquals(tokens[1].value, "add");
  assertEquals(tokens[2].type, TokenType.LPAREN);
  assertEquals(tokens[3].type, TokenType.IDENTIFIER);
  assertEquals(tokens[3].value, "a");
  assertEquals(tokens[4].type, TokenType.COMMA);
  assertEquals(tokens[5].type, TokenType.IDENTIFIER);
  assertEquals(tokens[5].value, "b");
  assertEquals(tokens[6].type, TokenType.RPAREN);
  assertEquals(tokens[7].type, TokenType.LBRACE);
  assertEquals(tokens[8].type, TokenType.RETURN);
  assertEquals(tokens[9].type, TokenType.IDENTIFIER);
  assertEquals(tokens[9].value, "a");
  assertEquals(tokens[10].type, TokenType.PLUS);
  assertEquals(tokens[11].type, TokenType.IDENTIFIER);
  assertEquals(tokens[11].value, "b");
  assertEquals(tokens[12].type, TokenType.RBRACE);
  assertEquals(tokens[13].type, TokenType.EOF);
});

Deno.test("Tokenizer - If statement", () => {
  const tokenizer = new Tokenizer("if (x == 5) { return true }");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.IF);
  assertEquals(tokens[1].type, TokenType.LPAREN);
  assertEquals(tokens[2].type, TokenType.IDENTIFIER);
  assertEquals(tokens[3].type, TokenType.EQUALS);
  assertEquals(tokens[4].type, TokenType.NUMBER);
  assertEquals(tokens[5].type, TokenType.RPAREN);
  assertEquals(tokens[6].type, TokenType.LBRACE);
  assertEquals(tokens[7].type, TokenType.RETURN);
  assertEquals(tokens[8].type, TokenType.TRUE);
  assertEquals(tokens[9].type, TokenType.RBRACE);
  assertEquals(tokens[10].type, TokenType.EOF);
});

Deno.test("Tokenizer - Array literal", () => {
  const tokenizer = new Tokenizer("[1, 2, 3]");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.LBRACKET);
  assertEquals(tokens[1].type, TokenType.NUMBER);
  assertEquals(tokens[1].value, "1");
  assertEquals(tokens[2].type, TokenType.COMMA);
  assertEquals(tokens[3].type, TokenType.NUMBER);
  assertEquals(tokens[3].value, "2");
  assertEquals(tokens[4].type, TokenType.COMMA);
  assertEquals(tokens[5].type, TokenType.NUMBER);
  assertEquals(tokens[5].value, "3");
  assertEquals(tokens[6].type, TokenType.RBRACKET);
  assertEquals(tokens[7].type, TokenType.EOF);
});

Deno.test("Tokenizer - Object literal", () => {
  const tokenizer = new Tokenizer('{name: "rahul", age: 21}');
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.LBRACE);
  assertEquals(tokens[1].type, TokenType.IDENTIFIER);
  assertEquals(tokens[1].value, "name");
  assertEquals(tokens[2].type, TokenType.COLON);
  assertEquals(tokens[3].type, TokenType.STRING);
  assertEquals(tokens[3].value, "rahul");
  assertEquals(tokens[4].type, TokenType.COMMA);
  assertEquals(tokens[5].type, TokenType.IDENTIFIER);
  assertEquals(tokens[5].value, "age");
  assertEquals(tokens[6].type, TokenType.COLON);
  assertEquals(tokens[7].type, TokenType.NUMBER);
  assertEquals(tokens[7].value, "21");
  assertEquals(tokens[8].type, TokenType.RBRACE);
  assertEquals(tokens[9].type, TokenType.EOF);
});

Deno.test("Tokenizer - Line and column tracking", () => {
  const tokenizer = new Tokenizer("x = 5\ny = 10");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].line, 1);
  assertEquals(tokens[0].column, 1);
  assertEquals(tokens[3].line, 2);
  assertEquals(tokens[3].column, 1);
});

Deno.test("Tokenizer - Whitespace handling", () => {
  const tokenizer = new Tokenizer("  x   =   5  ");
  const tokens = tokenizer.tokenize();

  assertEquals(tokens[0].type, TokenType.IDENTIFIER);
  assertEquals(tokens[1].type, TokenType.ASSIGN);
  assertEquals(tokens[2].type, TokenType.NUMBER);
  assertEquals(tokens[3].type, TokenType.EOF);
  assertEquals(tokens.length, 4);
});

Deno.test("Tokenizer - LexerError for unterminated string", () => {
  const tokenizer = new Tokenizer('"unterminated string');

  assertThrows(
    () => {
      tokenizer.tokenize();
    },
    LexerError,
    "Unterminated string",
  );
});

Deno.test("Tokenizer - LexerError for unexpected character", () => {
  const tokenizer = new Tokenizer("x @ y");

  assertThrows(
    () => {
      tokenizer.tokenize();
    },
    LexerError,
    "Unexpected character",
  );
});

Deno.test("Tokenizer - LexerError includes line and column", () => {
  const tokenizer = new Tokenizer('"unterminated');

  try {
    tokenizer.tokenize();
  } catch (error) {
    if (error instanceof LexerError) {
      assertEquals(error.line, 1);
      assertEquals(typeof error.column, "number");
      assertEquals(error.name, "LexerError");
    }
  }
});
