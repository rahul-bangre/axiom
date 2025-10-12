export enum AxiomType {
  INT,
  FLOAT,
  STRING,
  BOOL,
  NULL,
  ARRAY,
  OBJECT,
  FUNCTION,
  ANY,
}

export interface TypeInfo {
  type: AxiomType;
  element_type?: AxiomType;
  property_types?: Map<string, AxiomType>;
}

export function parseType(type_string: string): AxiomType {
  switch (type_string.toLowerCase()) {
    case "int":
      return AxiomType.INT;
    case "float":
      return AxiomType.FLOAT;
    case "string":
      return AxiomType.STRING;
    case "bool":
    case "boolean":
      return AxiomType.BOOL;
    case "null":
      return AxiomType.NULL;
    case "array":
      return AxiomType.ARRAY;
    case "object":
      return AxiomType.OBJECT;
    case "function":
      return AxiomType.FUNCTION;
    default:
      return AxiomType.ANY;
  }
}

export function typeToString(type: AxiomType): string {
  switch (type) {
    case AxiomType.INT:
      return "int";
    case AxiomType.FLOAT:
      return "float";
    case AxiomType.STRING:
      return "string";
    case AxiomType.BOOL:
      return "bool";
    case AxiomType.NULL:
      return "null";
    case AxiomType.ARRAY:
      return "array";
    case AxiomType.OBJECT:
      return "object";
    case AxiomType.FUNCTION:
      return "function";
    case AxiomType.ANY:
      return "any";
  }
}
