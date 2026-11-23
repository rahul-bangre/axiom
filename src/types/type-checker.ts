import { type NumberValue, RuntimeValue, ValueType } from "@runtime";
import { ok, Result, typeError } from "./result.ts";
import { AxiomType, parseType, typeToString } from "./types.ts";

/* infer the axiom type from a runtime value */
export function inferType(value: RuntimeValue): AxiomType {
  switch (value.type) {
    case ValueType.NUMBER: {
      const num = (value as NumberValue).value;
      return Number.isInteger(num) ? AxiomType.INT : AxiomType.FLOAT;
    }
    case ValueType.STRING:
      return AxiomType.STRING;
    case ValueType.BOOLEAN:
      return AxiomType.BOOL;
    case ValueType.NULL:
      return AxiomType.NULL;
    case ValueType.ARRAY:
      return AxiomType.ARRAY;
    case ValueType.OBJECT:
      return AxiomType.OBJECT;
    case ValueType.FUNCTION:
    case ValueType.NATIVE_FUNCTION:
      return AxiomType.FUNCTION;
    default:
      return AxiomType.ANY;
  }
}

/* check if a runtime value matches an expected type annotation */
export function checkType(
  value: RuntimeValue,
  type_annotation: string,
  context: string,
): Result<void> {
  const expected_type = parseType(type_annotation);
  const actual_type = inferType(value);

  if (expected_type === AxiomType.ANY) {
    return ok(undefined);
  }

  if (!typesMatch(actual_type, expected_type)) {
    return typeError(
      `Type mismatch in ${context}: expected ${typeToString(expected_type)}, got ${
        typeToString(actual_type)
      }`,
    );
  }

  return ok(undefined);
}

/* check if two types are compatible */
function typesMatch(actual: AxiomType, expected: AxiomType): boolean {
  if (expected === AxiomType.ANY || actual === AxiomType.ANY) {
    return true;
  }

  if (actual === expected) {
    return true;
  }

  // allow int to be used as float
  if (expected === AxiomType.FLOAT && actual === AxiomType.INT) {
    return true;
  }

  return false;
}

/* validate function return type */
export function checkReturnType(
  return_value: RuntimeValue,
  expected_type: string | undefined,
  function_name: string,
): Result<void> {
  if (!expected_type) {
    return ok(undefined);
  }

  if (expected_type.toLowerCase() === "void") {
    if (return_value.type !== ValueType.NULL) {
      return typeError(
        `Function '${function_name}' with void return type cannot return a value`,
      );
    }
    return ok(undefined);
  }

  if (expected_type.startsWith("async ")) {
    const inner_type = expected_type.substring(6);
    return checkType(return_value, inner_type, `return statement of function '${function_name}'`);
  }

  return checkType(return_value, expected_type, `return statement of function '${function_name}'`);
}

/* validate function parameter types */
export function checkParameterTypes(
  args: RuntimeValue[],
  params: Array<{ name: string; type_annotation?: string }>,
  function_name: string,
): Result<void> {
  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    if (param.type_annotation) {
      const check_result = checkType(
        args[i],
        param.type_annotation,
        `parameter '${param.name}' of function '${function_name}'`,
      );
      if (!check_result.ok) return check_result;
    }
  }
  return ok(undefined);
}
