export enum ASTNodeType {
  PROGRAM,

  NUMBER_LITERAL,
  STRING_LITERAL,
  BOOLEAN_LITERAL,
  NULL_LITERAL,
  ARRAY_LITERAL,
  OBJECT_LITERAL,

  IDENTIFIER,

  BINARY_EXPR,
  UNARY_EXPR,
  CALL_EXPR,
  MEMBER_EXPR,
  LAMBDA_EXPR,
  TERNARY_EXPR,
  AWAIT_EXPR,
  MATCH_EXPR,

  CONST_DECLARATION,
  FUNC_DECLARATION,

  IF_STATEMENT,
  RETURN_STATEMENT,
  BLOCK_STATEMENT,

  EXPRESSION_STATEMENT,
}

export interface ASTNode {
  type: ASTNodeType;
}

export interface Program extends ASTNode {
  type: ASTNodeType.PROGRAM;
  body: BlockStatement;
}

export interface NumberLiteral extends ASTNode {
  type: ASTNodeType.NUMBER_LITERAL;
  value: number;
}

export interface StringLiteral extends ASTNode {
  type: ASTNodeType.STRING_LITERAL;
  value: string;
}

export interface BooleanLiteral extends ASTNode {
  type: ASTNodeType.BOOLEAN_LITERAL;
  value: boolean;
}

export interface NullLiteral extends ASTNode {
  type: ASTNodeType.NULL_LITERAL;
}

export interface ArrayLiteral extends ASTNode {
  type: ASTNodeType.ARRAY_LITERAL;
  elements: Expression[];
}

export interface ObjectLiteral extends ASTNode {
  type: ASTNodeType.OBJECT_LITERAL;
  properties: Array<{ key: string; value: Expression }>;
}

export interface LambdaExpr extends ASTNode {
  type: ASTNodeType.LAMBDA_EXPR;
  params: Array<{ name: string; type_annotation?: string }>;
  return_type?: string;
  body: Expression | BlockStatement;
  is_expression_body: boolean;
}

export interface TernaryExpr extends ASTNode {
  type: ASTNodeType.TERNARY_EXPR;
  condition: Expression;
  true_expr: Expression;
  false_expr: Expression;
}

export interface Identifier extends ASTNode {
  type: ASTNodeType.IDENTIFIER;
  name: string;
}

export interface BinaryExpr extends ASTNode {
  type: ASTNodeType.BINARY_EXPR;
  left: Expression;
  operator: string;
  right: Expression;
}

export interface UnaryExpr extends ASTNode {
  type: ASTNodeType.UNARY_EXPR;
  operator: string;
  operand: Expression;
}

export interface CallExpr extends ASTNode {
  type: ASTNodeType.CALL_EXPR;
  callee: Expression;
  args: Expression[];
}

export interface MemberExpr extends ASTNode {
  type: ASTNodeType.MEMBER_EXPR;
  object: Expression;
  property: Expression;
  computed: boolean;
}

export interface AwaitExpr extends ASTNode {
  type: ASTNodeType.AWAIT_EXPR;
  argument: Expression;
}

export interface MatchCase {
  pattern: Expression | "default";
  body: Expression;
}

export interface MatchExpr extends ASTNode {
  type: ASTNodeType.MATCH_EXPR;
  value: Expression;
  cases: MatchCase[];
}

export interface ConstDeclaration extends ASTNode {
  type: ASTNodeType.CONST_DECLARATION;
  identifier: string;
  type_annotation?: string;
  value: Expression;
}

export interface FuncDeclaration extends ASTNode {
  type: ASTNodeType.FUNC_DECLARATION;
  name: string;
  params: Array<{
    name: string;
    type_annotation?: string;
  }>;
  return_type?: string;
  body: BlockStatement;
}

export interface IfStatement extends ASTNode {
  type: ASTNodeType.IF_STATEMENT;
  condition: Expression;
  body: BlockStatement;
}

export interface ReturnStatement extends ASTNode {
  type: ASTNodeType.RETURN_STATEMENT;
  value?: Expression;
}

export interface BlockStatement extends ASTNode {
  type: ASTNodeType.BLOCK_STATEMENT;
  body: Statement[];
}

export interface ExpressionStatement extends ASTNode {
  type: ASTNodeType.EXPRESSION_STATEMENT;
  expression: Expression;
}

export type Expression =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | NullLiteral
  | ArrayLiteral
  | ObjectLiteral
  | LambdaExpr
  | TernaryExpr
  | Identifier
  | BinaryExpr
  | UnaryExpr
  | CallExpr
  | MemberExpr
  | AwaitExpr
  | MatchExpr;

export type Statement =
  | ConstDeclaration
  | FuncDeclaration
  | IfStatement
  | ReturnStatement
  | BlockStatement
  | ExpressionStatement;
