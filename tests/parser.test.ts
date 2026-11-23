import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { ASTNodeType, Parser, ParserError } from "@parser";
import type {
  ArrayLiteral,
  BinaryExpr,
  BooleanLiteral,
  CallExpr,
  ConstDeclaration,
  ExpressionStatement,
  FuncDeclaration,
  Identifier,
  IfStatement,
  MemberExpr,
  NumberLiteral,
  ObjectLiteral,
  ReturnStatement,
  StringLiteral,
  TernaryExpr,
  UnaryExpr,
} from "@parser";

function parse(source: string) {
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  return parser.parse();
}

Deno.test("Parser - Number literal", () => {
  const ast = parse("42");

  assertEquals(ast.type, ASTNodeType.PROGRAM);
  assertEquals(ast.body.body.length, 1);
  assertEquals(ast.body.body[0].type, ASTNodeType.EXPRESSION_STATEMENT);

  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  assertEquals(expr_stmt.expression.type, ASTNodeType.NUMBER_LITERAL);
  assertEquals((expr_stmt.expression as NumberLiteral).value, 42);
});

Deno.test("Parser - String literal", () => {
  const ast = parse('"hello"');

  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  assertEquals(expr_stmt.expression.type, ASTNodeType.STRING_LITERAL);
  assertEquals((expr_stmt.expression as StringLiteral).value, "hello");
});

Deno.test("Parser - Boolean literals", () => {
  const ast = parse("true");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  assertEquals(expr_stmt.expression.type, ASTNodeType.BOOLEAN_LITERAL);
  assertEquals((expr_stmt.expression as BooleanLiteral).value, true);

  const ast2 = parse("false");
  const expr_stmt2 = ast2.body.body[0] as ExpressionStatement;
  assertEquals((expr_stmt2.expression as BooleanLiteral).value, false);
});

Deno.test("Parser - Null literal", () => {
  const ast = parse("null");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  assertEquals(expr_stmt.expression.type, ASTNodeType.NULL_LITERAL);
});

Deno.test("Parser - Identifier", () => {
  const ast = parse("user_name");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  assertEquals(expr_stmt.expression.type, ASTNodeType.IDENTIFIER);
  assertEquals((expr_stmt.expression as Identifier).name, "user_name");
});

Deno.test("Parser - Binary expression - addition", () => {
  const ast = parse("2 + 3");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const expr = expr_stmt.expression as BinaryExpr;

  assertEquals(expr.type, ASTNodeType.BINARY_EXPR);
  assertEquals(expr.operator, "+");
  assertEquals((expr.left as NumberLiteral).value, 2);
  assertEquals((expr.right as NumberLiteral).value, 3);
});

Deno.test("Parser - Binary expression - complex", () => {
  const ast = parse("2 + 3 * 4");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const expr = expr_stmt.expression as BinaryExpr;
  const right = expr.right as BinaryExpr;

  assertEquals(expr.type, ASTNodeType.BINARY_EXPR);
  assertEquals(expr.operator, "+");
  assertEquals((expr.left as NumberLiteral).value, 2);
  assertEquals(right.operator, "*");
  assertEquals((right.left as NumberLiteral).value, 3);
  assertEquals((right.right as NumberLiteral).value, 4);
});

Deno.test("Parser - Operator precedence", () => {
  const ast = parse("2 * 3 + 4");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const expr = expr_stmt.expression as BinaryExpr;

  assertEquals(expr.operator, "+");
  assertEquals((expr.left as BinaryExpr).operator, "*");
});

Deno.test("Parser - Comparison operators", () => {
  const ast = parse("x == 5");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  assertEquals((expr_stmt.expression as BinaryExpr).operator, "==");

  const ast2 = parse("x < 10");
  const expr_stmt2 = ast2.body.body[0] as ExpressionStatement;
  assertEquals((expr_stmt2.expression as BinaryExpr).operator, "<");
});

Deno.test("Parser - Logical operators", () => {
  const ast = parse("true && false");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  assertEquals((expr_stmt.expression as BinaryExpr).operator, "&&");

  const ast2 = parse("x || y");
  const expr_stmt2 = ast2.body.body[0] as ExpressionStatement;
  assertEquals((expr_stmt2.expression as BinaryExpr).operator, "||");
});

Deno.test("Parser - Unary expression", () => {
  const ast = parse("-42");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const expr = expr_stmt.expression as UnaryExpr;

  assertEquals(expr.type, ASTNodeType.UNARY_EXPR);
  assertEquals(expr.operator, "-");
  assertEquals((expr.operand as NumberLiteral).value, 42);

  const ast2 = parse("!flag");
  const expr_stmt2 = ast2.body.body[0] as ExpressionStatement;
  assertEquals((expr_stmt2.expression as UnaryExpr).operator, "!");
});

Deno.test("Parser - Typeof expression", () => {
  const ast = parse("typeof x");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const expr = expr_stmt.expression as UnaryExpr;

  assertEquals(expr.type, ASTNodeType.UNARY_EXPR);
  assertEquals(expr.operator, "typeof");
  assertEquals(expr.operand.type, ASTNodeType.IDENTIFIER);
  assertEquals((expr.operand as Identifier).name, "x");
});

Deno.test("Parser - Const declaration without type", () => {
  const ast = parse("x = 5");

  assertEquals(ast.body.body[0].type, ASTNodeType.CONST_DECLARATION);
  const decl = ast.body.body[0] as ConstDeclaration;
  assertEquals(decl.identifier, "x");
  assertEquals(decl.type_annotation, undefined);
  assertEquals((decl.value as NumberLiteral).value, 5);
});

Deno.test("Parser - Const declaration with type", () => {
  const ast = parse("user_age: int = 25");

  const decl = ast.body.body[0] as ConstDeclaration;
  assertEquals(decl.type, ASTNodeType.CONST_DECLARATION);
  assertEquals(decl.identifier, "user_age");
  assertEquals(decl.type_annotation, "int");
  assertEquals((decl.value as NumberLiteral).value, 25);
});

Deno.test("Parser - Function declaration", () => {
  const ast = parse("fn add(a, b) { return a + b }");

  assertEquals(ast.body.body[0].type, ASTNodeType.FUNC_DECLARATION);
  const func = ast.body.body[0] as FuncDeclaration;
  assertEquals(func.name, "add");
  assertEquals(func.params.length, 2);
  assertEquals(func.params[0].name, "a");
  assertEquals(func.params[1].name, "b");
  assertEquals(func.body.type, ASTNodeType.BLOCK_STATEMENT);
});

Deno.test("Parser - Function with typed parameters", () => {
  const ast = parse("fn add(a: int, b: int): int { return a + b }");

  const func = ast.body.body[0] as FuncDeclaration;
  assertEquals(func.params[0].type_annotation, "int");
  assertEquals(func.params[1].type_annotation, "int");
  assertEquals(func.return_type, "int");
});

Deno.test("Parser - If statement", () => {
  const ast = parse("if (x > 5) { return true }");

  assertEquals(ast.body.body[0].type, ASTNodeType.IF_STATEMENT);
  const if_stmt = ast.body.body[0] as IfStatement;
  assertEquals(if_stmt.condition.type, ASTNodeType.BINARY_EXPR);
  assertEquals(if_stmt.body.type, ASTNodeType.BLOCK_STATEMENT);
});

Deno.test("Parser - Return statement with value", () => {
  const ast = parse("fn test() { return 42 }");
  const func = ast.body.body[0] as FuncDeclaration;
  const return_stmt = func.body.body[0] as ReturnStatement;

  assertEquals(return_stmt.type, ASTNodeType.RETURN_STATEMENT);
  assertEquals((return_stmt.value as NumberLiteral).value, 42);
});

Deno.test("Parser - Return statement without value", () => {
  const ast = parse("fn test() { return }");
  const func = ast.body.body[0] as FuncDeclaration;
  const return_stmt = func.body.body[0] as ReturnStatement;

  assertEquals(return_stmt.type, ASTNodeType.RETURN_STATEMENT);
  assertEquals(return_stmt.value, undefined);
});

Deno.test("Parser - Array literal", () => {
  const ast = parse("[1, 2, 3]");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const arr = expr_stmt.expression as ArrayLiteral;

  assertEquals(arr.type, ASTNodeType.ARRAY_LITERAL);
  assertEquals(arr.elements.length, 3);
  assertEquals((arr.elements[0] as NumberLiteral).value, 1);
  assertEquals((arr.elements[1] as NumberLiteral).value, 2);
  assertEquals((arr.elements[2] as NumberLiteral).value, 3);
});

Deno.test("Parser - Empty array", () => {
  const ast = parse("[]");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  assertEquals((expr_stmt.expression as ArrayLiteral).elements.length, 0);
});

Deno.test("Parser - Object literal", () => {
  const ast = parse('{name: "rahul", age: 21}');
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const obj = expr_stmt.expression as ObjectLiteral;

  assertEquals(obj.type, ASTNodeType.OBJECT_LITERAL);
  assertEquals(obj.properties.length, 2);
  assertEquals(obj.properties[0].key, "name");
  assertEquals((obj.properties[0].value as StringLiteral).value, "rahul");
  assertEquals(obj.properties[1].key, "age");
  assertEquals((obj.properties[1].value as NumberLiteral).value, 21);
});

Deno.test("Parser - Empty object", () => {
  const ast = parse("{}");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  assertEquals((expr_stmt.expression as ObjectLiteral).properties.length, 0);
});

Deno.test("Parser - Function call", () => {
  const ast = parse("add(2, 3)");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const call = expr_stmt.expression as CallExpr;

  assertEquals(call.type, ASTNodeType.CALL_EXPR);
  assertEquals((call.callee as Identifier).name, "add");
  assertEquals(call.args.length, 2);
  assertEquals((call.args[0] as NumberLiteral).value, 2);
  assertEquals((call.args[1] as NumberLiteral).value, 3);
});

Deno.test("Parser - Function call with no arguments", () => {
  const ast = parse("hello()");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  assertEquals((expr_stmt.expression as CallExpr).args.length, 0);
});

Deno.test("Parser - Member expression - dot notation", () => {
  const ast = parse("user.name");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const member = expr_stmt.expression as MemberExpr;

  assertEquals(member.type, ASTNodeType.MEMBER_EXPR);
  assertEquals((member.object as Identifier).name, "user");
  assertEquals((member.property as Identifier).name, "name");
  assertEquals(member.computed, false);
});

Deno.test("Parser - Member expression - bracket notation", () => {
  const ast = parse("arr[0]");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const member = expr_stmt.expression as MemberExpr;

  assertEquals(member.type, ASTNodeType.MEMBER_EXPR);
  assertEquals((member.object as Identifier).name, "arr");
  assertEquals((member.property as NumberLiteral).value, 0);
  assertEquals(member.computed, true);
});

Deno.test("Parser - Nested member access", () => {
  const ast = parse("user.address.city");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const member = expr_stmt.expression as MemberExpr;

  assertEquals((member.property as Identifier).name, "city");
  assertEquals(((member.object as MemberExpr).property as Identifier).name, "address");
});

Deno.test("Parser - Grouped expression", () => {
  const ast = parse("(2 + 3) * 4");
  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const expr = expr_stmt.expression as BinaryExpr;

  assertEquals(expr.operator, "*");
  assertEquals((expr.left as BinaryExpr).operator, "+");
});

Deno.test("Parser - Multiple statements", () => {
  const ast = parse(`
    x = 5
    y = 10
    result = x + y
  `);

  assertEquals(ast.body.body.length, 3);
});

Deno.test("Parser - Complex program", () => {
  const ast = parse(`
    fn factorial(n: int): int {
      if (n <= 1) {
        return 1
      }
      return n * factorial(n - 1)
    }
    
    result = factorial(5)
  `);

  assertEquals(ast.body.body.length, 2);
  assertEquals(ast.body.body[0].type, ASTNodeType.FUNC_DECLARATION);
  assertEquals(ast.body.body[1].type, ASTNodeType.CONST_DECLARATION);
});

Deno.test("Parser - Ternary expression - basic", () => {
  const ast = parse("x > 0 ? 1 : -1");

  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const ternary = expr_stmt.expression as TernaryExpr;
  assertEquals(ternary.type, ASTNodeType.TERNARY_EXPR);
  assertEquals(ternary.condition.type, ASTNodeType.BINARY_EXPR);
  assertEquals(ternary.true_expr.type, ASTNodeType.NUMBER_LITERAL);
  assertEquals((ternary.true_expr as NumberLiteral).value, 1);
  assertEquals(ternary.false_expr.type, ASTNodeType.UNARY_EXPR);
});

Deno.test("Parser - Ternary expression - nested", () => {
  const ast = parse("x > 0 ? 1 : y > 0 ? 2 : 3");

  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const ternary = expr_stmt.expression as TernaryExpr;
  const nested = ternary.false_expr as TernaryExpr;
  assertEquals(ternary.type, ASTNodeType.TERNARY_EXPR);
  assertEquals((ternary.true_expr as NumberLiteral).value, 1);
  assertEquals(nested.type, ASTNodeType.TERNARY_EXPR);
  assertEquals((nested.true_expr as NumberLiteral).value, 2);
  assertEquals((nested.false_expr as NumberLiteral).value, 3);
});

Deno.test("Parser - Ternary expression - with function call", () => {
  const ast = parse("isValid() ? doThis() : doThat()");

  const expr_stmt = ast.body.body[0] as ExpressionStatement;
  const ternary = expr_stmt.expression as TernaryExpr;
  assertEquals(ternary.type, ASTNodeType.TERNARY_EXPR);
  assertEquals(ternary.condition.type, ASTNodeType.CALL_EXPR);
  assertEquals(ternary.true_expr.type, ASTNodeType.CALL_EXPR);
  assertEquals(ternary.false_expr.type, ASTNodeType.CALL_EXPR);
});

Deno.test("Parser - ParserError for unexpected token", () => {
  assertThrows(
    () => {
      parse("fn");
    },
    ParserError,
    "Expected function name",
  );
});

Deno.test("Parser - ParserError for missing closing brace", () => {
  assertThrows(
    () => {
      parse("fn test() {");
    },
    ParserError,
    "Expected '}'",
  );
});

Deno.test("Parser - ParserError for missing parenthesis", () => {
  assertThrows(
    () => {
      parse("fn test { }");
    },
    ParserError,
    "Expected '('",
  );
});
