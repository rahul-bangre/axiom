import * as AST from "@parser";
import { createArrayMethods } from "@std";
import { createStringMethods } from "../std/string.ts";
import { checkParameterTypes, checkReturnType, checkType } from "@types";
import { ok, Result, runtimeError, typeError } from "../types/result.ts";
import { Environment } from "./environment.ts";
import {
  ArrayValue,
  AsyncValue,
  BooleanValue,
  FunctionValue,
  makeAsyncValue,
  NativeFunctionValue,
  NullValue,
  NumberValue,
  ObjectValue,
  RuntimeValue,
  StringValue,
  ValueType,
} from "./value.ts";

export async function evaluate(node: AST.ASTNode, env: Environment): Promise<Result<RuntimeValue>> {
  switch (node.type) {
    case AST.ASTNodeType.PROGRAM:
      return await evaluateProgram(node as AST.Program, env);

    case AST.ASTNodeType.BLOCK_STATEMENT:
      return await evaluateBlockStatement(node as AST.BlockStatement, env);

    case AST.ASTNodeType.EXPRESSION_STATEMENT:
      return await evaluate((node as AST.ExpressionStatement).expression, env);

    case AST.ASTNodeType.NUMBER_LITERAL:
      return ok(
        { type: ValueType.NUMBER, value: (node as AST.NumberLiteral).value } as NumberValue,
      );

    case AST.ASTNodeType.STRING_LITERAL:
      return ok(
        { type: ValueType.STRING, value: (node as AST.StringLiteral).value } as StringValue,
      );

    case AST.ASTNodeType.BOOLEAN_LITERAL:
      return ok({
        type: ValueType.BOOLEAN,
        value: (node as AST.BooleanLiteral).value,
      } as BooleanValue);

    case AST.ASTNodeType.NULL_LITERAL:
      return ok({ type: ValueType.NULL } as NullValue);

    case AST.ASTNodeType.ARRAY_LITERAL:
      return await evaluateArrayLiteral(node as AST.ArrayLiteral, env);

    case AST.ASTNodeType.OBJECT_LITERAL:
      return await evaluateObjectLiteral(node as AST.ObjectLiteral, env);

    case AST.ASTNodeType.LAMBDA_EXPR:
      return evaluateLambda(node as AST.LambdaExpr, env);

    case AST.ASTNodeType.TERNARY_EXPR:
      return await evaluateTernaryExpr(node as AST.TernaryExpr, env);

    case AST.ASTNodeType.IDENTIFIER:
      return evaluateIdentifier(node as AST.Identifier, env);

    case AST.ASTNodeType.BINARY_EXPR:
      return await evaluateBinaryExpr(node as AST.BinaryExpr, env);

    case AST.ASTNodeType.UNARY_EXPR:
      return await evaluateUnaryExpr(node as AST.UnaryExpr, env);

    case AST.ASTNodeType.CALL_EXPR:
      return await evaluateCallExpr(node as AST.CallExpr, env);

    case AST.ASTNodeType.MEMBER_EXPR:
      return await evaluateMemberExpr(node as AST.MemberExpr, env);

    case AST.ASTNodeType.AWAIT_EXPR:
      return await evaluateAwaitExpr(node as AST.AwaitExpr, env);

    case AST.ASTNodeType.CONST_DECLARATION:
      return await evaluateConstDeclaration(node as AST.ConstDeclaration, env);

    case AST.ASTNodeType.FUNC_DECLARATION:
      return evaluateFuncDeclaration(node as AST.FuncDeclaration, env);

    case AST.ASTNodeType.IF_STATEMENT:
      return await evaluateIfStatement(node as AST.IfStatement, env);

    case AST.ASTNodeType.RETURN_STATEMENT:
      return await evaluateReturnStatement(node as AST.ReturnStatement, env);

    default:
      return runtimeError(`Unhandled AST node type: ${node.type}`);
  }
}

async function evaluateProgram(
  program: AST.Program,
  env: Environment,
): Promise<Result<RuntimeValue>> {
  return await evaluateBlockStatement(program.body, env);
}

async function evaluateBlockStatement(
  block: AST.BlockStatement,
  env: Environment,
): Promise<Result<RuntimeValue>> {
  let result: RuntimeValue = { type: ValueType.NULL } as NullValue;

  for (const statement of block.body) {
    const stmt_result = await evaluate(statement, env);
    if (!stmt_result.ok) return stmt_result;

    result = stmt_result.value;

    if (result.type === ValueType.NULL && (result as any).isReturn) {
      return ok(result);
    }
  }

  return ok(result);
}

async function evaluateArrayLiteral(
  node: AST.ArrayLiteral,
  env: Environment,
): Promise<Result<RuntimeValue>> {
  const elements: RuntimeValue[] = [];

  for (const elem of node.elements) {
    const elem_result = await evaluate(elem, env);
    if (!elem_result.ok) return elem_result;
    elements.push(elem_result.value);
  }

  return ok({ type: ValueType.ARRAY, elements });
}

async function evaluateObjectLiteral(
  node: AST.ObjectLiteral,
  env: Environment,
): Promise<Result<RuntimeValue>> {
  const properties = new Map<string, RuntimeValue>();

  for (const prop of node.properties) {
    const value_result = await evaluate(prop.value, env);
    if (!value_result.ok) return value_result;
    properties.set(prop.key, value_result.value);
  }

  return ok({ type: ValueType.OBJECT, properties });
}

function evaluateIdentifier(node: AST.Identifier, env: Environment): Result<RuntimeValue> {
  return env.get(node.name);
}

async function evaluateBinaryExpr(
  node: AST.BinaryExpr,
  env: Environment,
): Promise<Result<RuntimeValue>> {
  const left_result = await evaluate(node.left, env);
  if (!left_result.ok) return left_result;

  const right_result = await evaluate(node.right, env);
  if (!right_result.ok) return right_result;

  const left_val = left_result.value;
  const right_val = right_result.value;

  if (["+", "-", "*", "/", "%"].includes(node.operator)) {
    return evaluateArithmetic(left_val, right_val, node.operator);
  }

  if (["==", "!=", "<", ">", "<=", ">="].includes(node.operator)) {
    return evaluateComparison(left_val, right_val, node.operator);
  }

  if (node.operator === "&&" || node.operator === "||") {
    return evaluateLogical(left_val, right_val, node.operator);
  }

  return runtimeError(`Unknown binary operator: ${node.operator}`);
}

function evaluateArithmetic(
  left_val: RuntimeValue,
  right_val: RuntimeValue,
  operator: string,
): Result<RuntimeValue> {
  if (
    operator === "+" && (left_val.type === ValueType.STRING || right_val.type === ValueType.STRING)
  ) {
    const left_str = left_val.type === ValueType.STRING
      ? (left_val as StringValue).value
      : String((left_val as NumberValue).value);
    const right_str = right_val.type === ValueType.STRING
      ? (right_val as StringValue).value
      : String((right_val as NumberValue).value);
    return ok({ type: ValueType.STRING, value: left_str + right_str } as StringValue);
  }

  if (left_val.type !== ValueType.NUMBER || right_val.type !== ValueType.NUMBER) {
    return typeError(
      `Arithmetic operators require numbers, got ${left_val.type} and ${right_val.type}`,
    );
  }

  const left_num = (left_val as NumberValue).value;
  const right_num = (right_val as NumberValue).value;

  switch (operator) {
    case "+":
      return ok({ type: ValueType.NUMBER, value: left_num + right_num } as NumberValue);
    case "-":
      return ok({ type: ValueType.NUMBER, value: left_num - right_num } as NumberValue);
    case "*":
      return ok({ type: ValueType.NUMBER, value: left_num * right_num } as NumberValue);
    case "/":
      if (right_num === 0) return runtimeError("Division by zero");
      return ok({ type: ValueType.NUMBER, value: left_num / right_num } as NumberValue);
    case "%":
      return ok({ type: ValueType.NUMBER, value: left_num % right_num } as NumberValue);
    default:
      return runtimeError(`Unknown arithmetic operator: ${operator}`);
  }
}

function evaluateComparison(
  left_val: RuntimeValue,
  right_val: RuntimeValue,
  operator: string,
): Result<RuntimeValue> {
  if (operator === "==") {
    return ok({ type: ValueType.BOOLEAN, value: areValuesEqual(left_val, right_val) });
  }
  if (operator === "!=") {
    return ok({ type: ValueType.BOOLEAN, value: !areValuesEqual(left_val, right_val) });
  }

  if (left_val.type !== ValueType.NUMBER || right_val.type !== ValueType.NUMBER) {
    return typeError(
      `Comparison operators require numbers, got ${left_val.type} and ${right_val.type}`,
    );
  }

  const left_num = (left_val as NumberValue).value;
  const right_num = (right_val as NumberValue).value;

  switch (operator) {
    case "<":
      return ok({ type: ValueType.BOOLEAN, value: left_num < right_num });
    case ">":
      return ok({ type: ValueType.BOOLEAN, value: left_num > right_num });
    case "<=":
      return ok({ type: ValueType.BOOLEAN, value: left_num <= right_num });
    case ">=":
      return ok({ type: ValueType.BOOLEAN, value: left_num >= right_num });
    default:
      return runtimeError(`Unknown comparison operator: ${operator}`);
  }
}

function areValuesEqual(left_val: RuntimeValue, right_val: RuntimeValue): boolean {
  if (left_val.type !== right_val.type) return false;

  switch (left_val.type) {
    case ValueType.NUMBER:
      return (left_val as NumberValue).value === (right_val as NumberValue).value;
    case ValueType.STRING:
      return (left_val as StringValue).value === (right_val as StringValue).value;
    case ValueType.BOOLEAN:
      return (left_val as BooleanValue).value === (right_val as BooleanValue).value;
    case ValueType.NULL:
      return true;
    default:
      return left_val === right_val;
  }
}

function evaluateLogical(
  left_val: RuntimeValue,
  right_val: RuntimeValue,
  operator: string,
): Result<RuntimeValue> {
  const left_truthy = isTruthy(left_val);

  if (operator === "&&") {
    return ok({ type: ValueType.BOOLEAN, value: left_truthy && isTruthy(right_val) });
  }
  if (operator === "||") {
    return ok({ type: ValueType.BOOLEAN, value: left_truthy || isTruthy(right_val) });
  }

  return runtimeError(`Unknown logical operator: ${operator}`);
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

async function callFunction(
  callee: RuntimeValue,
  args: RuntimeValue[],
  env: Environment,
): Promise<Result<RuntimeValue>> {
  if (callee.type !== ValueType.FUNCTION && callee.type !== ValueType.NATIVE_FUNCTION) {
    return typeError(`Cannot call non-function value of type ${callee.type}`);
  }

  if (callee.type === ValueType.NATIVE_FUNCTION) {
    return await (callee as NativeFunctionValue).call(args);
  }

  const func = callee as FunctionValue;

  if (args.length !== func.params.length) {
    return runtimeError(
      `Function '${func.name}' expects ${func.params.length} arguments, got ${args.length}`,
    );
  }

  const param_check = checkParameterTypes(args, func.param_info, func.name);
  if (!param_check.ok) return param_check;

  const func_env = func.closure.extend();

  for (let i = 0; i < func.params.length; i++) {
    const define_result = func_env.define(func.params[i], args[i]);
    if (!define_result.ok) return define_result;
  }

  const result = await evaluateBlockStatement(func.body, func_env);
  if (!result.ok) return result;

  if ((result.value as any).isReturn) {
    const return_val = (result.value as any).returnValue || { type: ValueType.NULL };

    const has_typed_params = func.param_info.some((p) => p.type_annotation !== undefined);
    const inferred_return_type = func.return_type || (has_typed_params ? "void" : undefined);

    if (inferred_return_type) {
      const type_check = checkReturnType(return_val, inferred_return_type, func.name);
      if (!type_check.ok) return type_check;
    }

    if (func.return_type && func.return_type.startsWith("async")) {
      return ok(makeAsyncValue(Promise.resolve(return_val)));
    }

    return ok(return_val);
  }

  return result;
}

async function evaluateUnaryExpr(
  node: AST.UnaryExpr,
  env: Environment,
): Promise<Result<RuntimeValue>> {
  const operand_result = await evaluate(node.operand, env);
  if (!operand_result.ok) return operand_result;

  const operand_val = operand_result.value;

  if (node.operator === "-") {
    if (operand_val.type !== ValueType.NUMBER) {
      return typeError(`Unary minus requires a number, got ${operand_val.type}`);
    }
    return ok(
      { type: ValueType.NUMBER, value: -(operand_val as NumberValue).value } as NumberValue,
    );
  }

  if (node.operator === "!") {
    return ok({ type: ValueType.BOOLEAN, value: !isTruthy(operand_val) } as BooleanValue);
  }

  if (node.operator === "typeof") {
    let type_name: string;
    switch (operand_val.type) {
      case ValueType.NUMBER:
        type_name = "number";
        break;
      case ValueType.STRING:
        type_name = "string";
        break;
      case ValueType.BOOLEAN:
        type_name = "boolean";
        break;
      case ValueType.NULL:
        type_name = "null";
        break;
      case ValueType.ARRAY:
        type_name = "array";
        break;
      case ValueType.OBJECT:
        type_name = "object";
        break;
      case ValueType.FUNCTION:
      case ValueType.NATIVE_FUNCTION:
        type_name = "function";
        break;
      case ValueType.ASYNC:
        type_name = "async";
        break;
      default:
        type_name = "unknown";
    }
    return ok({ type: ValueType.STRING, value: type_name } as StringValue);
  }

  return runtimeError(`Unknown unary operator: ${node.operator}`);
}

async function evaluateCallExpr(
  node: AST.CallExpr,
  env: Environment,
): Promise<Result<RuntimeValue>> {
  const callee_result = await evaluate(node.callee, env);
  if (!callee_result.ok) return callee_result;

  const args_list: RuntimeValue[] = [];
  for (const arg of node.args) {
    const arg_result = await evaluate(arg, env);
    if (!arg_result.ok) return arg_result;
    args_list.push(arg_result.value);
  }

  return await callFunction(callee_result.value, args_list, env);
}

async function evaluateMemberExpr(
  node: AST.MemberExpr,
  env: Environment,
): Promise<Result<RuntimeValue>> {
  const object_result = await evaluate(node.object, env);
  if (!object_result.ok) return object_result;

  const object_val = object_result.value;

  if (node.computed) {
    if (object_val.type !== ValueType.ARRAY) {
      return typeError(`Cannot use bracket notation on non-array type ${object_val.type}`);
    }

    const index_result = await evaluate(node.property, env);
    if (!index_result.ok) return index_result;

    const index_val = index_result.value;
    if (index_val.type !== ValueType.NUMBER) {
      return typeError(`Array index must be a number, got ${index_val.type}`);
    }

    const array_val = object_val as ArrayValue;
    const idx = (index_val as NumberValue).value;

    if (idx < 0 || idx >= array_val.elements.length) {
      return runtimeError(`Array index out of bounds: ${idx}`);
    }

    return ok(array_val.elements[Math.floor(idx)]);
  }

  const property_name = (node.property as AST.Identifier).name;

  if (object_val.type === ValueType.ARRAY) {
    const array_val = object_val as ArrayValue;
    const call_fn_with_env = (callee: RuntimeValue, args: RuntimeValue[]) =>
      callFunction(callee, args, env);
    const array_methods = createArrayMethods(call_fn_with_env, isTruthy);

    if (property_name in array_methods) {
      return ok({
        type: ValueType.NATIVE_FUNCTION,
        name: property_name,
        call: (args: RuntimeValue[]) => array_methods[property_name](array_val, ...args),
      } as NativeFunctionValue);
    }

    return runtimeError(`Array has no method '${property_name}'`);
  }

  if (object_val.type === ValueType.STRING) {
    const string_val = object_val as StringValue;
    const call_fn_with_env = (callee: RuntimeValue, args: RuntimeValue[]) =>
      callFunction(callee, args, env);
    const string_methods = createStringMethods(call_fn_with_env);

    if (property_name in string_methods) {
      return ok({
        type: ValueType.NATIVE_FUNCTION,
        name: property_name,
        call: (args: RuntimeValue[]) => string_methods[property_name](string_val, ...args),
      } as NativeFunctionValue);
    }

    return runtimeError(`String has no method '${property_name}'`);
  }

  if (object_val.type !== ValueType.OBJECT) {
    return typeError(`Cannot access property on non-object type ${object_val.type}`);
  }

  const obj_val = object_val as ObjectValue;

  if (!obj_val.properties.has(property_name)) {
    return runtimeError(`Property '${property_name}' does not exist on object`);
  }

  return ok(obj_val.properties.get(property_name)!);
}

async function evaluateConstDeclaration(
  node: AST.ConstDeclaration,
  env: Environment,
): Promise<Result<RuntimeValue>> {
  const value_result = await evaluate(node.value, env);
  if (!value_result.ok) return value_result;

  const value = value_result.value;

  if (node.type_annotation) {
    const type_check = checkType(value, node.type_annotation, `variable '${node.identifier}'`);
    if (!type_check.ok) return type_check;
  }

  return env.define(node.identifier, value);
}

function evaluateFuncDeclaration(
  node: AST.FuncDeclaration,
  env: Environment,
): Result<RuntimeValue> {
  const func_val: FunctionValue = {
    type: ValueType.FUNCTION,
    name: node.name,
    params: node.params.map((p) => p.name),
    param_info: node.params,
    return_type: node.return_type,
    body: node.body,
    closure: env,
  };

  return env.define(node.name, func_val);
}

function evaluateLambda(node: AST.LambdaExpr, env: Environment): Result<RuntimeValue> {
  const body_as_block: AST.BlockStatement = node.is_expression_body
    ? {
      type: AST.ASTNodeType.BLOCK_STATEMENT,
      body: [{
        type: AST.ASTNodeType.RETURN_STATEMENT,
        value: node.body as AST.Expression,
      }],
    }
    : node.body as AST.BlockStatement;

  const func_val: FunctionValue = {
    type: ValueType.FUNCTION,
    name: "<lambda>",
    params: node.params.map((p) => p.name),
    param_info: node.params,
    return_type: node.return_type,
    body: body_as_block,
    closure: env,
  };

  return ok(func_val);
}

async function evaluateTernaryExpr(
  node: AST.TernaryExpr,
  env: Environment,
): Promise<Result<RuntimeValue>> {
  const condition_result = await evaluate(node.condition, env);
  if (!condition_result.ok) return condition_result;

  if (isTruthy(condition_result.value)) {
    return await evaluate(node.true_expr, env);
  }

  return await evaluate(node.false_expr, env);
}

async function evaluateIfStatement(
  node: AST.IfStatement,
  env: Environment,
): Promise<Result<RuntimeValue>> {
  const condition_result = await evaluate(node.condition, env);
  if (!condition_result.ok) return condition_result;

  if (isTruthy(condition_result.value)) {
    return await evaluateBlockStatement(node.body, env);
  }

  return ok({ type: ValueType.NULL } as NullValue);
}

async function evaluateReturnStatement(
  node: AST.ReturnStatement,
  env: Environment,
): Promise<Result<RuntimeValue>> {
  let return_val: RuntimeValue = { type: ValueType.NULL };

  if (node.value) {
    const value_result = await evaluate(node.value, env);
    if (!value_result.ok) return value_result;
    return_val = value_result.value;
  }

  return ok({
    type: ValueType.NULL,
    isReturn: true,
    returnValue: return_val,
  } as any);
}

async function evaluateAwaitExpr(
  node: AST.AwaitExpr,
  env: Environment,
): Promise<Result<RuntimeValue>> {
  const arg_result = await evaluate(node.argument, env);
  if (!arg_result.ok) return arg_result;

  const value = arg_result.value;

  if (value.type !== ValueType.ASYNC) {
    return runtimeError(`Cannot await non-async value of type ${value.type}`);
  }

  const async_val = value as AsyncValue;
  const resolved = await async_val.promise;

  return ok(resolved);
}
