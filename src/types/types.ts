export enum Type {
  INT,
  FLOAT,
  STRING,
  BOOLEAN,
  NULL,
  ARRAY,
  FUNCTION,
  ANY,
  VOID,
}

export interface TypeInfo {
  type: Type;
}
