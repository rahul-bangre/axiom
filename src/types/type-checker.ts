import { RuntimeValue, ValueType } from "@runtime";
import { AxiomType, parseType, typeToString } from "./types.ts";

export class TypeCheckError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TypeCheckError";
  }
}

/* infer the axiom type from a runtime value */
export function inferType(value: RuntimeValue): AxiomType {
  switch (value.type) {
    case ValueType.NUMBER: {
      const num = (value as any).value;
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
): void {
  const expected_type = parseType(type_annotation);
  const actual_type = inferType(value);

  if (expected_type === AxiomType.ANY) {
    return;
  }

  if (!typesMatch(actual_type, expected_type)) {
    throw new TypeCheckError(
      `Type mismatch in ${context}: expected ${typeToString(expected_type)}, got ${
        typeToString(actual_type)
      }`,
    );
  }
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
): void {
  if (!expected_type) {
    return;
  }

  // void type means function should not return a value (only null)
  if (expected_type.toLowerCase() === "void") {
    if (return_value.type !== ValueType.NULL) {
      throw new TypeCheckError(
        `Function '${function_name}' with void return type cannot return a value`,
      );
    }
    return;
  }

  checkType(return_value, expected_type, `return statement of function '${function_name}'`);
}

/* validate function parameter types */
export function checkParameterTypes(
  args: RuntimeValue[],
  params: Array<{ name: string; type_annotation?: string }>,
  function_name: string,
): void {
  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    if (param.type_annotation) {
      checkType(
        args[i],
        param.type_annotation,
        `parameter '${param.name}' of function '${function_name}'`,
      );
    }
  }
}
