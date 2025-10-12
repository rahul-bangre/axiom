export enum ValueType {
  NUMBER,
  STRING,
  BOOLEAN,
  NULL,
  ARRAY,
  OBJECT,
  FUNCTION,
  NATIVE_FUNCTION,
}

export interface RuntimeValue {
  type: ValueType;
}
