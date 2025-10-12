import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { ASTNodeType, Parser, ParserError } from "@parser";

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

  const expr_stmt = ast.body.body[0] as any;
  assertEquals(expr_stmt.expression.type, ASTNodeType.NUMBER_LITERAL);
  assertEquals(expr_stmt.expression.value, 42);
});

Deno.test("Parser - String literal", () => {
  const ast = parse('"hello"');

  const expr_stmt = ast.body.body[0] as any;
  assertEquals(expr_stmt.expression.type, ASTNodeType.STRING_LITERAL);
  assertEquals(expr_stmt.expression.value, "hello");
});

Deno.test("Parser - Boolean literals", () => {
  const ast = parse("true");
  const expr_stmt = ast.body.body[0] as any;
  assertEquals(expr_stmt.expression.type, ASTNodeType.BOOLEAN_LITERAL);
  assertEquals(expr_stmt.expression.value, true);

  const ast2 = parse("false");
  const expr_stmt2 = ast2.body.body[0] as any;
  assertEquals(expr_stmt2.expression.value, false);
});

Deno.test("Parser - Null literal", () => {
  const ast = parse("null");
  const expr_stmt = ast.body.body[0] as any;
  assertEquals(expr_stmt.expression.type, ASTNodeType.NULL_LITERAL);
});

Deno.test("Parser - Identifier", () => {
  const ast = parse("user_name");
  const expr_stmt = ast.body.body[0] as any;
  assertEquals(expr_stmt.expression.type, ASTNodeType.IDENTIFIER);
  assertEquals(expr_stmt.expression.name, "user_name");
});

Deno.test("Parser - Binary expression - addition", () => {
  const ast = parse("2 + 3");
  const expr_stmt = ast.body.body[0] as any;
  const expr = expr_stmt.expression;

  assertEquals(expr.type, ASTNodeType.BINARY_EXPR);
  assertEquals(expr.operator, "+");
  assertEquals(expr.left.value, 2);
  assertEquals(expr.right.value, 3);
});

Deno.test("Parser - Binary expression - complex", () => {
  const ast = parse("2 + 3 * 4");
  const expr_stmt = ast.body.body[0] as any;
  const expr = expr_stmt.expression;

  assertEquals(expr.type, ASTNodeType.BINARY_EXPR);
  assertEquals(expr.operator, "+");
  assertEquals(expr.left.value, 2);
  assertEquals(expr.right.operator, "*");
  assertEquals(expr.right.left.value, 3);
  assertEquals(expr.right.right.value, 4);
});

Deno.test("Parser - Operator precedence", () => {
  const ast = parse("2 * 3 + 4");
  const expr_stmt = ast.body.body[0] as any;
  const expr = expr_stmt.expression;

  assertEquals(expr.operator, "+");
  assertEquals(expr.left.operator, "*");
});

Deno.test("Parser - Comparison operators", () => {
  const ast = parse("x == 5");
  const expr_stmt = ast.body.body[0] as any;
  assertEquals(expr_stmt.expression.operator, "==");

  const ast2 = parse("x < 10");
  const expr_stmt2 = ast2.body.body[0] as any;
  assertEquals(expr_stmt2.expression.operator, "<");
});

Deno.test("Parser - Logical operators", () => {
  const ast = parse("true && false");
  const expr_stmt = ast.body.body[0] as any;
  assertEquals(expr_stmt.expression.operator, "&&");

  const ast2 = parse("x || y");
  const expr_stmt2 = ast2.body.body[0] as any;
  assertEquals(expr_stmt2.expression.operator, "||");
});

Deno.test("Parser - Unary expression", () => {
  const ast = parse("-42");
  const expr_stmt = ast.body.body[0] as any;
  const expr = expr_stmt.expression;

  assertEquals(expr.type, ASTNodeType.UNARY_EXPR);
  assertEquals(expr.operator, "-");
  assertEquals(expr.operand.value, 42);

  const ast2 = parse("!flag");
  const expr_stmt2 = ast2.body.body[0] as any;
  assertEquals(expr_stmt2.expression.operator, "!");
});

Deno.test("Parser - Const declaration without type", () => {
  const ast = parse("x = 5");

  assertEquals(ast.body.body[0].type, ASTNodeType.CONST_DECLARATION);
  const decl = ast.body.body[0] as any;
  assertEquals(decl.identifier, "x");
  assertEquals(decl.type_annotation, undefined);
  assertEquals(decl.value.value, 5);
});

Deno.test("Parser - Const declaration with type", () => {
  const ast = parse("user_age: int = 25");

  const decl = ast.body.body[0] as any;
  assertEquals(decl.type, ASTNodeType.CONST_DECLARATION);
  assertEquals(decl.identifier, "user_age");
  assertEquals(decl.type_annotation, "int");
  assertEquals(decl.value.value, 25);
});

Deno.test("Parser - Function declaration", () => {
  const ast = parse("fn add(a, b) { return a + b }");

  assertEquals(ast.body.body[0].type, ASTNodeType.FUNC_DECLARATION);
  const func = ast.body.body[0] as any;
  assertEquals(func.name, "add");
  assertEquals(func.params.length, 2);
  assertEquals(func.params[0].name, "a");
  assertEquals(func.params[1].name, "b");
  assertEquals(func.body.type, ASTNodeType.BLOCK_STATEMENT);
});

Deno.test("Parser - Function with typed parameters", () => {
  const ast = parse("fn add(a: int, b: int): int { return a + b }");

  const func = ast.body.body[0] as any;
  assertEquals(func.params[0].type_annotation, "int");
  assertEquals(func.params[1].type_annotation, "int");
  assertEquals(func.return_type, "int");
});

Deno.test("Parser - If statement", () => {
  const ast = parse("if (x > 5) { return true }");

  assertEquals(ast.body.body[0].type, ASTNodeType.IF_STATEMENT);
  const if_stmt = ast.body.body[0] as any;
  assertEquals(if_stmt.condition.type, ASTNodeType.BINARY_EXPR);
  assertEquals(if_stmt.body.type, ASTNodeType.BLOCK_STATEMENT);
});

Deno.test("Parser - Return statement with value", () => {
  const ast = parse("fn test() { return 42 }");
  const func = ast.body.body[0] as any;
  const return_stmt = func.body.body[0];

  assertEquals(return_stmt.type, ASTNodeType.RETURN_STATEMENT);
  assertEquals(return_stmt.value.value, 42);
});

Deno.test("Parser - Return statement without value", () => {
  const ast = parse("fn test() { return }");
  const func = ast.body.body[0] as any;
  const return_stmt = func.body.body[0];

  assertEquals(return_stmt.type, ASTNodeType.RETURN_STATEMENT);
  assertEquals(return_stmt.value, undefined);
});

Deno.test("Parser - Array literal", () => {
  const ast = parse("[1, 2, 3]");
  const expr_stmt = ast.body.body[0] as any;
  const arr = expr_stmt.expression;

  assertEquals(arr.type, ASTNodeType.ARRAY_LITERAL);
  assertEquals(arr.elements.length, 3);
  assertEquals(arr.elements[0].value, 1);
  assertEquals(arr.elements[1].value, 2);
  assertEquals(arr.elements[2].value, 3);
});

Deno.test("Parser - Empty array", () => {
  const ast = parse("[]");
  const expr_stmt = ast.body.body[0] as any;
  assertEquals(expr_stmt.expression.elements.length, 0);
});

Deno.test("Parser - Object literal", () => {
  const ast = parse('{name: "rahul", age: 21}');
  const expr_stmt = ast.body.body[0] as any;
  const obj = expr_stmt.expression;

  assertEquals(obj.type, ASTNodeType.OBJECT_LITERAL);
  assertEquals(obj.properties.length, 2);
  assertEquals(obj.properties[0].key, "name");
  assertEquals(obj.properties[0].value.value, "rahul");
  assertEquals(obj.properties[1].key, "age");
  assertEquals(obj.properties[1].value.value, 21);
});

Deno.test("Parser - Empty object", () => {
  const ast = parse("{}");
  const expr_stmt = ast.body.body[0] as any;
  assertEquals(expr_stmt.expression.properties.length, 0);
});

Deno.test("Parser - Function call", () => {
  const ast = parse("add(2, 3)");
  const expr_stmt = ast.body.body[0] as any;
  const call = expr_stmt.expression;

  assertEquals(call.type, ASTNodeType.CALL_EXPR);
  assertEquals(call.callee.name, "add");
  assertEquals(call.args.length, 2);
  assertEquals(call.args[0].value, 2);
  assertEquals(call.args[1].value, 3);
});

Deno.test("Parser - Function call with no arguments", () => {
  const ast = parse("hello()");
  const expr_stmt = ast.body.body[0] as any;
  assertEquals(expr_stmt.expression.args.length, 0);
});

Deno.test("Parser - Member expression - dot notation", () => {
  const ast = parse("user.name");
  const expr_stmt = ast.body.body[0] as any;
  const member = expr_stmt.expression;

  assertEquals(member.type, ASTNodeType.MEMBER_EXPR);
  assertEquals(member.object.name, "user");
  assertEquals(member.property.name, "name");
  assertEquals(member.computed, false);
});

Deno.test("Parser - Member expression - bracket notation", () => {
  const ast = parse("arr[0]");
  const expr_stmt = ast.body.body[0] as any;
  const member = expr_stmt.expression;

  assertEquals(member.type, ASTNodeType.MEMBER_EXPR);
  assertEquals(member.object.name, "arr");
  assertEquals(member.property.value, 0);
  assertEquals(member.computed, true);
});

Deno.test("Parser - Nested member access", () => {
  const ast = parse("user.address.city");
  const expr_stmt = ast.body.body[0] as any;
  const member = expr_stmt.expression;

  assertEquals(member.property.name, "city");
  assertEquals(member.object.property.name, "address");
});

Deno.test("Parser - Grouped expression", () => {
  const ast = parse("(2 + 3) * 4");
  const expr_stmt = ast.body.body[0] as any;
  const expr = expr_stmt.expression;

  assertEquals(expr.operator, "*");
  assertEquals(expr.left.operator, "+");
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

  const expr_stmt = ast.body.body[0] as any;
  assertEquals(expr_stmt.expression.type, ASTNodeType.TERNARY_EXPR);
  assertEquals(expr_stmt.expression.condition.type, ASTNodeType.BINARY_EXPR);
  assertEquals(expr_stmt.expression.true_expr.type, ASTNodeType.NUMBER_LITERAL);
  assertEquals(expr_stmt.expression.true_expr.value, 1);
  assertEquals(expr_stmt.expression.false_expr.type, ASTNodeType.UNARY_EXPR);
});

Deno.test("Parser - Ternary expression - nested", () => {
  const ast = parse("x > 0 ? 1 : y > 0 ? 2 : 3");

  const expr_stmt = ast.body.body[0] as any;
  assertEquals(expr_stmt.expression.type, ASTNodeType.TERNARY_EXPR);
  assertEquals(expr_stmt.expression.true_expr.value, 1);
  assertEquals(expr_stmt.expression.false_expr.type, ASTNodeType.TERNARY_EXPR);
  assertEquals(expr_stmt.expression.false_expr.true_expr.value, 2);
  assertEquals(expr_stmt.expression.false_expr.false_expr.value, 3);
});

Deno.test("Parser - Ternary expression - with function call", () => {
  const ast = parse("isValid() ? doThis() : doThat()");

  const expr_stmt = ast.body.body[0] as any;
  assertEquals(expr_stmt.expression.type, ASTNodeType.TERNARY_EXPR);
  assertEquals(expr_stmt.expression.condition.type, ASTNodeType.CALL_EXPR);
  assertEquals(expr_stmt.expression.true_expr.type, ASTNodeType.CALL_EXPR);
  assertEquals(expr_stmt.expression.false_expr.type, ASTNodeType.CALL_EXPR);
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
