import * as AST from "@parser";
import { createArrayMethods } from "@std";
import { checkParameterTypes, checkReturnType, checkType } from "@types";
import { Environment } from "./environment.ts";
import { RuntimeError, TypeError } from "./errors.ts";
import {
  ArrayValue,
  BooleanValue,
  FunctionValue,
  NativeFunctionValue,
  NullValue,
  NumberValue,
  ObjectValue,
  RuntimeValue,
  StringValue,
  ValueType,
} from "./value.ts";

export function evaluate(node: AST.ASTNode, env: Environment): RuntimeValue {
  switch (node.type) {
    case AST.ASTNodeType.PROGRAM:
      return evaluateProgram(node as AST.Program, env);

    case AST.ASTNodeType.BLOCK_STATEMENT:
      return evaluateBlockStatement(node as AST.BlockStatement, env);

    case AST.ASTNodeType.EXPRESSION_STATEMENT:
      return evaluate((node as AST.ExpressionStatement).expression, env);

    case AST.ASTNodeType.NUMBER_LITERAL:
      return { type: ValueType.NUMBER, value: (node as AST.NumberLiteral).value } as NumberValue;

    case AST.ASTNodeType.STRING_LITERAL:
      return { type: ValueType.STRING, value: (node as AST.StringLiteral).value } as StringValue;

    case AST.ASTNodeType.BOOLEAN_LITERAL:
      return {
        type: ValueType.BOOLEAN,
        value: (node as AST.BooleanLiteral).value,
      } as BooleanValue;

    case AST.ASTNodeType.NULL_LITERAL:
      return { type: ValueType.NULL } as NullValue;

    case AST.ASTNodeType.ARRAY_LITERAL:
      return evaluateArrayLiteral(node as AST.ArrayLiteral, env);

    case AST.ASTNodeType.OBJECT_LITERAL:
      return evaluateObjectLiteral(node as AST.ObjectLiteral, env);

    case AST.ASTNodeType.LAMBDA_EXPR:
      return evaluateLambda(node as AST.LambdaExpr, env);

    case AST.ASTNodeType.IDENTIFIER:
      return evaluateIdentifier(node as AST.Identifier, env);

    case AST.ASTNodeType.BINARY_EXPR:
      return evaluateBinaryExpr(node as AST.BinaryExpr, env);

    case AST.ASTNodeType.UNARY_EXPR:
      return evaluateUnaryExpr(node as AST.UnaryExpr, env);

    case AST.ASTNodeType.CALL_EXPR:
      return evaluateCallExpr(node as AST.CallExpr, env);

    case AST.ASTNodeType.MEMBER_EXPR:
      return evaluateMemberExpr(node as AST.MemberExpr, env);

    case AST.ASTNodeType.CONST_DECLARATION:
      return evaluateConstDeclaration(node as AST.ConstDeclaration, env);

    case AST.ASTNodeType.FUNC_DECLARATION:
      return evaluateFuncDeclaration(node as AST.FuncDeclaration, env);

    case AST.ASTNodeType.IF_STATEMENT:
      return evaluateIfStatement(node as AST.IfStatement, env);

    case AST.ASTNodeType.RETURN_STATEMENT:
      return evaluateReturnStatement(node as AST.ReturnStatement, env);

    default:
      throw new RuntimeError(`Unhandled AST node type: ${node.type}`);
  }
}

function evaluateProgram(program: AST.Program, env: Environment): RuntimeValue {
  return evaluateBlockStatement(program.body, env);
}

function evaluateBlockStatement(block: AST.BlockStatement, env: Environment): RuntimeValue {
  let result: RuntimeValue = { type: ValueType.NULL } as NullValue;

  for (const statement of block.body) {
    result = evaluate(statement, env);

    if (result.type === ValueType.NULL && (result as any).isReturn) {
      return result;
    }
  }

  return result;
}

function evaluateArrayLiteral(node: AST.ArrayLiteral, env: Environment): ArrayValue {
  const elements = node.elements.map((elem) => evaluate(elem, env));
  return { type: ValueType.ARRAY, elements };
}

function evaluateObjectLiteral(node: AST.ObjectLiteral, env: Environment): ObjectValue {
  const properties = new Map<string, RuntimeValue>();

  for (const prop of node.properties) {
    const value = evaluate(prop.value, env);
    properties.set(prop.key, value);
  }

  return { type: ValueType.OBJECT, properties };
}

function evaluateIdentifier(node: AST.Identifier, env: Environment): RuntimeValue {
  return env.get(node.name);
}

function evaluateBinaryExpr(node: AST.BinaryExpr, env: Environment): RuntimeValue {
  const left = evaluate(node.left, env);
  const right = evaluate(node.right, env);

  if (["+", "-", "*", "/", "%"].includes(node.operator)) {
    return evaluateArithmetic(left, right, node.operator);
  }

  if (["==", "!=", "<", ">", "<=", ">="].includes(node.operator)) {
    return evaluateComparison(left, right, node.operator);
  }

  if (node.operator === "&&" || node.operator === "||") {
    return evaluateLogical(left, right, node.operator);
  }

  throw new RuntimeError(`Unknown binary operator: ${node.operator}`);
}

function evaluateArithmetic(
  left: RuntimeValue,
  right: RuntimeValue,
  operator: string,
): RuntimeValue {
  if (operator === "+" && (left.type === ValueType.STRING || right.type === ValueType.STRING)) {
    const left_str = left.type === ValueType.STRING
      ? (left as StringValue).value
      : String((left as NumberValue).value);
    const right_str = right.type === ValueType.STRING
      ? (right as StringValue).value
      : String((right as NumberValue).value);
    return { type: ValueType.STRING, value: left_str + right_str } as StringValue;
  }

  if (left.type !== ValueType.NUMBER || right.type !== ValueType.NUMBER) {
    throw new TypeError(`Arithmetic operators require numbers, got ${left.type} and ${right.type}`);
  }

  const left_val = (left as NumberValue).value;
  const right_val = (right as NumberValue).value;

  switch (operator) {
    case "+":
      return { type: ValueType.NUMBER, value: left_val + right_val } as NumberValue;
    case "-":
      return { type: ValueType.NUMBER, value: left_val - right_val } as NumberValue;
    case "*":
      return { type: ValueType.NUMBER, value: left_val * right_val } as NumberValue;
    case "/":
      if (right_val === 0) throw new RuntimeError("Division by zero");
      return { type: ValueType.NUMBER, value: left_val / right_val } as NumberValue;
    case "%":
      return { type: ValueType.NUMBER, value: left_val % right_val } as NumberValue;
    default:
      throw new RuntimeError(`Unknown arithmetic operator: ${operator}`);
  }
}

function evaluateComparison(
  left: RuntimeValue,
  right: RuntimeValue,
  operator: string,
): BooleanValue {
  if (operator === "==") {
    return { type: ValueType.BOOLEAN, value: areValuesEqual(left, right) };
  }
  if (operator === "!=") {
    return { type: ValueType.BOOLEAN, value: !areValuesEqual(left, right) };
  }

  if (left.type !== ValueType.NUMBER || right.type !== ValueType.NUMBER) {
    throw new TypeError(`Comparison operators require numbers, got ${left.type} and ${right.type}`);
  }

  const left_val = (left as NumberValue).value;
  const right_val = (right as NumberValue).value;

  switch (operator) {
    case "<":
      return { type: ValueType.BOOLEAN, value: left_val < right_val };
    case ">":
      return { type: ValueType.BOOLEAN, value: left_val > right_val };
    case "<=":
      return { type: ValueType.BOOLEAN, value: left_val <= right_val };
    case ">=":
      return { type: ValueType.BOOLEAN, value: left_val >= right_val };
    default:
      throw new RuntimeError(`Unknown comparison operator: ${operator}`);
  }
}

function areValuesEqual(left: RuntimeValue, right: RuntimeValue): boolean {
  if (left.type !== right.type) return false;

  switch (left.type) {
    case ValueType.NUMBER:
      return (left as NumberValue).value === (right as NumberValue).value;
    case ValueType.STRING:
      return (left as StringValue).value === (right as StringValue).value;
    case ValueType.BOOLEAN:
      return (left as BooleanValue).value === (right as BooleanValue).value;
    case ValueType.NULL:
      return true;
    default:
      return left === right;
  }
}

function evaluateLogical(
  left: RuntimeValue,
  right: RuntimeValue,
  operator: string,
): BooleanValue {
  const left_truthy = isTruthy(left);

  if (operator === "&&") {
    return { type: ValueType.BOOLEAN, value: left_truthy && isTruthy(right) };
  }
  if (operator === "||") {
    return { type: ValueType.BOOLEAN, value: left_truthy || isTruthy(right) };
  }

  throw new RuntimeError(`Unknown logical operator: ${operator}`);
}

function isTruthy(value: RuntimeValue): boolean {
  if (value.type === ValueType.BOOLEAN) {
    return (value as BooleanValue).value;
  }
  if (value.type === ValueType.NULL) {
    return false;
  }
  if (value.type === ValueType.NUMBER) {
    return (value as NumberValue).value !== 0;
  }
  if (value.type === ValueType.STRING) {
    return (value as StringValue).value !== "";
  }
  return true;
}

function callFunction(
  callee: RuntimeValue,
  args: RuntimeValue[],
  env: Environment,
): RuntimeValue {
  if (callee.type !== ValueType.FUNCTION && callee.type !== ValueType.NATIVE_FUNCTION) {
    throw new TypeError(`Cannot call non-function value of type ${callee.type}`);
  }

  if (callee.type === ValueType.NATIVE_FUNCTION) {
    return (callee as NativeFunctionValue).call(args);
  }

  const func = callee as FunctionValue;

  if (args.length !== func.params.length) {
    throw new RuntimeError(
      `Function '${func.name}' expects ${func.params.length} arguments, got ${args.length}`,
    );
  }

  checkParameterTypes(args, func.param_info, func.name);

  const func_env = func.closure.extend();

  for (let i = 0; i < func.params.length; i++) {
    func_env.define(func.params[i], args[i]);
  }

  const result = evaluateBlockStatement(func.body, func_env);

  if ((result as any).isReturn) {
    const return_value = (result as any).returnValue || { type: ValueType.NULL };

    const has_typed_params = func.param_info.some((p) => p.type_annotation !== undefined);
    const inferred_return_type = func.return_type || (has_typed_params ? "void" : undefined);

    if (inferred_return_type) {
      checkReturnType(return_value, inferred_return_type, func.name);
    }

    return return_value;
  }

  return result;
}

function evaluateUnaryExpr(node: AST.UnaryExpr, env: Environment): RuntimeValue {
  const operand = evaluate(node.operand, env);

  if (node.operator === "-") {
    if (operand.type !== ValueType.NUMBER) {
      throw new TypeError(`Unary minus requires a number, got ${operand.type}`);
    }
    return { type: ValueType.NUMBER, value: -(operand as NumberValue).value } as NumberValue;
  }

  if (node.operator === "!") {
    return { type: ValueType.BOOLEAN, value: !isTruthy(operand) } as BooleanValue;
  }

  throw new RuntimeError(`Unknown unary operator: ${node.operator}`);
}

function evaluateCallExpr(node: AST.CallExpr, env: Environment): RuntimeValue {
  const callee = evaluate(node.callee, env);
  const args = node.args.map((arg) => evaluate(arg, env));
  return callFunction(callee, args, env);
}

function evaluateMemberExpr(node: AST.MemberExpr, env: Environment): RuntimeValue {
  const object = evaluate(node.object, env);

  if (node.computed) {
    if (object.type !== ValueType.ARRAY) {
      throw new TypeError(`Cannot use bracket notation on non-array type ${object.type}`);
    }

    const index = evaluate(node.property, env);
    if (index.type !== ValueType.NUMBER) {
      throw new TypeError(`Array index must be a number, got ${index.type}`);
    }

    const array = object as ArrayValue;
    const idx = (index as NumberValue).value;

    if (idx < 0 || idx >= array.elements.length) {
      throw new RuntimeError(`Array index out of bounds: ${idx}`);
    }

    return array.elements[Math.floor(idx)];
  }

  const property_name = (node.property as AST.Identifier).name;

  if (object.type === ValueType.ARRAY) {
    const array = object as ArrayValue;
    const call_fn_with_env = (callee: RuntimeValue, args: RuntimeValue[]) =>
      callFunction(callee, args, env);
    const array_methods = createArrayMethods(call_fn_with_env, isTruthy);

    if (property_name in array_methods) {
      return {
        type: ValueType.NATIVE_FUNCTION,
        name: property_name,
        call: (args: RuntimeValue[]) => array_methods[property_name](array, ...args),
      } as NativeFunctionValue;
    }

    throw new RuntimeError(`Array has no method '${property_name}'`);
  }

  if (object.type !== ValueType.OBJECT) {
    throw new TypeError(`Cannot access property on non-object type ${object.type}`);
  }

  const obj = object as ObjectValue;

  if (!obj.properties.has(property_name)) {
    throw new RuntimeError(`Property '${property_name}' does not exist on object`);
  }

  return obj.properties.get(property_name)!;
}

function evaluateConstDeclaration(node: AST.ConstDeclaration, env: Environment): RuntimeValue {
  const value = evaluate(node.value, env);

  if (node.type_annotation) {
    checkType(value, node.type_annotation, `variable '${node.identifier}'`);
  }

  return env.define(node.identifier, value);
}

function evaluateFuncDeclaration(node: AST.FuncDeclaration, env: Environment): RuntimeValue {
  const func: FunctionValue = {
    type: ValueType.FUNCTION,
    name: node.name,
    params: node.params.map((p) => p.name),
    param_info: node.params,
    return_type: node.return_type,
    body: node.body,
    closure: env,
  };

  return env.define(node.name, func);
}

function evaluateLambda(node: AST.LambdaExpr, env: Environment): RuntimeValue {
  const body_as_block: AST.BlockStatement = node.is_expression_body
    ? {
      type: AST.ASTNodeType.BLOCK_STATEMENT,
      body: [{
        type: AST.ASTNodeType.RETURN_STATEMENT,
        value: node.body as AST.Expression,
      }],
    }
    : node.body as AST.BlockStatement;

  const func: FunctionValue = {
    type: ValueType.FUNCTION,
    name: "<lambda>",
    params: node.params.map((p) => p.name),
    param_info: node.params,
    return_type: node.return_type,
    body: body_as_block,
    closure: env,
  };

  return func;
}

function evaluateIfStatement(node: AST.IfStatement, env: Environment): RuntimeValue {
  const condition = evaluate(node.condition, env);

  if (isTruthy(condition)) {
    return evaluateBlockStatement(node.body, env);
  }

  return { type: ValueType.NULL } as NullValue;
}

function evaluateReturnStatement(node: AST.ReturnStatement, env: Environment): RuntimeValue {
  const return_value = node.value ? evaluate(node.value, env) : { type: ValueType.NULL };

  return {
    type: ValueType.NULL,
    isReturn: true,
    returnValue: return_value,
  } as any;
}
