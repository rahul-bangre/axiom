export enum ASTNodeType {
  PROGRAM,
  NUMBER_LITERAL,
  STRING_LITERAL,
  BOOLEAN_LITERAL,
  NULL_LITERAL,
  IDENTIFIER,
  BINARY_EXPR,
  UNARY_EXPR,
  ASSIGNMENT_EXPR,
  CALL_EXPR,
  MEMBER_EXPR,
  ARRAY_LITERAL,
  OBJECT_LITERAL,
  VAR_DECLARATION,
  FUNC_DECLARATION,
  IF_STATEMENT,
  RETURN_STATEMENT,
  EXPRESSION_STATEMENT,
  BLOCK_STATEMENT,
}

export interface ASTNode {
  type: ASTNodeType;
}

export interface Program extends ASTNode {
  type: ASTNodeType.PROGRAM;
  body: Statement[];
}

export type Expression = ASTNode;
export type Statement = ASTNode;
