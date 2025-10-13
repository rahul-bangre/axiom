import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";
import { ok, Result, runtimeError } from "../types/result.ts";
import {
  ArrayValue,
  BooleanValue,
  CollectionValue,
  DatabaseValue,
  NativeFunctionValue,
  NullValue,
  NumberValue,
  ObjectValue,
  QueryBuilderValue,
  RuntimeValue,
  StringValue,
  TransactionValue,
  ValueType,
} from "../runtime/value.ts";

function runtimeValueToJs(value: RuntimeValue): any {
  switch (value.type) {
    case ValueType.NUMBER:
      return (value as NumberValue).value;
    case ValueType.STRING:
      return (value as StringValue).value;
    case ValueType.BOOLEAN:
      return (value as BooleanValue).value ? 1 : 0;
    case ValueType.NULL:
      return null;
    case ValueType.ARRAY: {
      const arr = (value as ArrayValue).elements;
      return JSON.stringify(arr.map(runtimeValueToJs));
    }
    case ValueType.OBJECT: {
      const obj = (value as ObjectValue).properties;
      const result: Record<string, any> = {};
      for (const [key, val] of obj.entries()) {
        result[key] = runtimeValueToJs(val);
      }
      return JSON.stringify(result);
    }
    default:
      return String(value);
  }
}

function jsToRuntimeValue(value: any): RuntimeValue {
  if (value === null || value === undefined) {
    return { type: ValueType.NULL } as NullValue;
  }
  if (typeof value === "number") {
    return { type: ValueType.NUMBER, value } as NumberValue;
  }
  if (typeof value === "string") {
    return { type: ValueType.STRING, value } as StringValue;
  }
  if (typeof value === "boolean") {
    return { type: ValueType.BOOLEAN, value } as BooleanValue;
  }
  if (Array.isArray(value)) {
    return {
      type: ValueType.ARRAY,
      elements: value.map(jsToRuntimeValue),
    } as ArrayValue;
  }
  if (typeof value === "object") {
    const props = new Map<string, RuntimeValue>();
    for (const [key, val] of Object.entries(value)) {
      props.set(key, jsToRuntimeValue(val));
    }
    return { type: ValueType.OBJECT, properties: props } as ObjectValue;
  }
  return { type: ValueType.NULL } as NullValue;
}

function sqlTypeFromSchemaType(schema_type: string): string {
  switch (schema_type) {
    case "string":
      return "text";
    case "number":
      return "real";
    case "boolean":
      return "integer";
    case "object":
    case "array":
      return "text";
    default:
      return "text";
  }
}

function extractSchemaFields(schema: ObjectValue): Array<{ name: string; type: string }> {
  const fields: Array<{ name: string; type: string }> = [];

  const builder = (schema as any)._builder;
  if (!builder || !builder.shape) {
    return fields;
  }

  for (const [field_name, field_schema] of builder.shape.entries()) {
    let type_str = "string";

    if (field_schema.constructor.name === "StringSchema") {
      type_str = "string";
    } else if (field_schema.constructor.name === "NumberSchema") {
      type_str = "number";
    } else if (field_schema.constructor.name === "BooleanSchema") {
      type_str = "boolean";
    } else if (field_schema.constructor.name === "ObjectSchema") {
      type_str = "object";
    } else if (field_schema.constructor.name === "ArraySchema") {
      type_str = "array";
    } else if (field_schema.constructor.name === "OptionalSchema") {
      continue;
    }

    fields.push({ name: field_name, type: type_str });
  }

  return fields;
}

const db_open: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "open",
  return_type: "async Database",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.STRING) {
      return runtimeError("DbError: open() requires 1 string argument (path)");
    }

    const path = (args[0] as StringValue).value;

    try {
      const connection = new DB(path);

      connection.execute("pragma journal_mode = wal");
      connection.execute("pragma foreign_keys = on");

      return ok({
        type: ValueType.DATABASE,
        connection,
        path,
      } as DatabaseValue);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`DbError: Failed to open database: ${err.message}`);
    }
  },
};

const db_close: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "close",
  return_type: "async null",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.DATABASE) {
      return runtimeError("DbError: close() requires 1 Database argument");
    }

    const db = args[0] as DatabaseValue;

    try {
      db.connection.close();
      return ok({ type: ValueType.NULL } as NullValue);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`DbError: Failed to close database: ${err.message}`);
    }
  },
};

const db_collection: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "collection",
  return_type: "Collection",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (
      args.length !== 3 ||
      args[0].type !== ValueType.DATABASE ||
      args[1].type !== ValueType.STRING ||
      args[2].type !== ValueType.OBJECT
    ) {
      return runtimeError("DbError: collection() requires (Database, string, ObjectSchema)");
    }

    const db = args[0] as DatabaseValue;
    const table_name = (args[1] as StringValue).value;
    const schema = args[2] as ObjectValue;

    const fields = extractSchemaFields(schema);

    if (fields.length === 0) {
      return runtimeError("DbError: Schema must have at least one field");
    }

    const field_defs = fields
      .map((f) => `${f.name} ${sqlTypeFromSchemaType(f.type)} not null`)
      .join(", ");

    const create_table_sql = `
      create table if not exists ${table_name} (
        id integer primary key autoincrement,
        ${field_defs}
      )
    `;

    try {
      db.connection.execute(create_table_sql);

      return ok({
        type: ValueType.COLLECTION,
        database: db,
        tableName: table_name,
        schema,
      } as CollectionValue);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`DbError: Failed to create table: ${err.message}`);
    }
  },
};

const db_insert: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "insert",
  return_type: "async object",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (
      args.length !== 2 ||
      args[0].type !== ValueType.COLLECTION ||
      args[1].type !== ValueType.OBJECT
    ) {
      return runtimeError("DbError: insert() requires (Collection, object)");
    }

    const collection = args[0] as CollectionValue;
    const data = args[1] as ObjectValue;

    const parse_fn = collection.schema.properties.get("parse");
    if (!parse_fn || parse_fn.type !== ValueType.NATIVE_FUNCTION) {
      return runtimeError("DbError: Invalid schema");
    }

    const validation_result = await (parse_fn as NativeFunctionValue).call([data]);
    if (!validation_result.ok) {
      return validation_result;
    }

    const validated = validation_result.value as ObjectValue;

    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of validated.properties.entries()) {
      fields.push(key);
      values.push(runtimeValueToJs(value));
    }

    const placeholders = fields.map(() => "?").join(", ");
    const insert_sql = `
      insert into ${collection.tableName} (${fields.join(", ")})
      values (${placeholders})
    `;

    try {
      collection.database.connection.query(insert_sql, values);

      const last_id_result = collection.database.connection.query(
        "select last_insert_rowid() as id",
      );
      const last_id = last_id_result[0][0];

      const select_sql = `select * from ${collection.tableName} where id = ?`;
      const rows = collection.database.connection.query(select_sql, [last_id]);

      if (rows.length === 0) {
        return runtimeError("DbError: Failed to retrieve inserted row");
      }

      const row = rows[0];
      const result_obj = new Map<string, RuntimeValue>();
      const columns = collection.database.connection.query(
        `pragma table_info(${collection.tableName})`,
      );

      for (let i = 0; i < columns.length; i++) {
        const col_name = columns[i][1];
        const col_value = row[i];
        result_obj.set(col_name, jsToRuntimeValue(col_value));
      }

      const result_runtime = { type: ValueType.OBJECT, properties: result_obj } as ObjectValue;

      const parse_result = await (parse_fn as NativeFunctionValue).call([result_runtime]);
      if (!parse_result.ok) {
        return parse_result;
      }

      return ok(parse_result.value);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`DbError: Failed to insert: ${err.message}`);
    }
  },
};

const db_get: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "get",
  return_type: "async object",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (
      args.length !== 2 ||
      args[0].type !== ValueType.COLLECTION ||
      args[1].type !== ValueType.NUMBER
    ) {
      return runtimeError("DbError: get() requires (Collection, number)");
    }

    const collection = args[0] as CollectionValue;
    const id = (args[1] as NumberValue).value;

    const select_sql = `select * from ${collection.tableName} where id = ?`;

    try {
      const rows = collection.database.connection.query(select_sql, [id]);

      if (rows.length === 0) {
        return ok({ type: ValueType.NULL } as NullValue);
      }

      const row = rows[0];
      const result_obj = new Map<string, RuntimeValue>();
      const columns = collection.database.connection.query(
        `pragma table_info(${collection.tableName})`,
      );

      for (let i = 0; i < columns.length; i++) {
        const col_name = columns[i][1];
        const col_value = row[i];
        result_obj.set(col_name, jsToRuntimeValue(col_value));
      }

      const result_runtime = { type: ValueType.OBJECT, properties: result_obj } as ObjectValue;

      const parse_fn = collection.schema.properties.get("parse");
      if (parse_fn && parse_fn.type === ValueType.NATIVE_FUNCTION) {
        const parse_result = await (parse_fn as NativeFunctionValue).call([result_runtime]);
        if (!parse_result.ok) {
          return parse_result;
        }
        return ok(parse_result.value);
      }

      return ok(result_runtime);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`DbError: Failed to get row: ${err.message}`);
    }
  },
};

const db_deleteById: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "deleteById",
  return_type: "async null",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (
      args.length !== 2 ||
      args[0].type !== ValueType.COLLECTION ||
      args[1].type !== ValueType.NUMBER
    ) {
      return runtimeError("DbError: deleteById() requires (Collection, number)");
    }

    const collection = args[0] as CollectionValue;
    const id = (args[1] as NumberValue).value;

    const delete_sql = `delete from ${collection.tableName} where id = ?`;

    try {
      collection.database.connection.query(delete_sql, [id]);
      return ok({ type: ValueType.NULL } as NullValue);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`DbError: Failed to delete row: ${err.message}`);
    }
  },
};

const db_select: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "select",
  return_type: "QueryBuilder",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.COLLECTION) {
      return runtimeError("DbError: select() requires 1 Collection argument");
    }

    const collection = args[0] as CollectionValue;

    return ok({
      type: ValueType.QUERY_BUILDER,
      collection,
      whereClauses: [],
      orderByClauses: [],
      limitValue: null,
      offsetValue: null,
    } as QueryBuilderValue);
  },
};

const query_where: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "where",
  return_type: "QueryBuilder",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (
      args.length !== 4 ||
      args[0].type !== ValueType.QUERY_BUILDER ||
      args[1].type !== ValueType.STRING ||
      args[2].type !== ValueType.STRING
    ) {
      return runtimeError("DbError: where() requires (QueryBuilder, field, operator, value)");
    }

    const builder = args[0] as QueryBuilderValue;
    const field = (args[1] as StringValue).value;
    const operator = (args[2] as StringValue).value;
    const value = args[3];

    const valid_operators = ["=", "!=", ">", ">=", "<", "<=", "like", "in"];
    if (!valid_operators.includes(operator.toLowerCase())) {
      return runtimeError(`DbError: Invalid operator '${operator}'`);
    }

    return ok({
      type: ValueType.QUERY_BUILDER,
      collection: builder.collection,
      whereClauses: [...builder.whereClauses, { field, operator, value }],
      orderByClauses: builder.orderByClauses,
      limitValue: builder.limitValue,
      offsetValue: builder.offsetValue,
    } as QueryBuilderValue);
  },
};

const query_orderBy: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "orderBy",
  return_type: "QueryBuilder",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (
      args.length !== 3 ||
      args[0].type !== ValueType.QUERY_BUILDER ||
      args[1].type !== ValueType.STRING ||
      args[2].type !== ValueType.STRING
    ) {
      return runtimeError("DbError: orderBy() requires (QueryBuilder, field, direction)");
    }

    const builder = args[0] as QueryBuilderValue;
    const field = (args[1] as StringValue).value;
    const direction = (args[2] as StringValue).value.toLowerCase();

    if (direction !== "asc" && direction !== "desc") {
      return runtimeError("DbError: Direction must be 'asc' or 'desc'");
    }

    return ok({
      type: ValueType.QUERY_BUILDER,
      collection: builder.collection,
      whereClauses: builder.whereClauses,
      orderByClauses: [...builder.orderByClauses, { field, direction }],
      limitValue: builder.limitValue,
      offsetValue: builder.offsetValue,
    } as QueryBuilderValue);
  },
};

const query_limit: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "limit",
  return_type: "QueryBuilder",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (
      args.length !== 2 ||
      args[0].type !== ValueType.QUERY_BUILDER ||
      args[1].type !== ValueType.NUMBER
    ) {
      return runtimeError("DbError: limit() requires (QueryBuilder, number)");
    }

    const builder = args[0] as QueryBuilderValue;
    const limit = (args[1] as NumberValue).value;

    return ok({
      type: ValueType.QUERY_BUILDER,
      collection: builder.collection,
      whereClauses: builder.whereClauses,
      orderByClauses: builder.orderByClauses,
      limitValue: limit,
      offsetValue: builder.offsetValue,
    } as QueryBuilderValue);
  },
};

const query_offset: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "offset",
  return_type: "QueryBuilder",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (
      args.length !== 2 ||
      args[0].type !== ValueType.QUERY_BUILDER ||
      args[1].type !== ValueType.NUMBER
    ) {
      return runtimeError("DbError: offset() requires (QueryBuilder, number)");
    }

    const builder = args[0] as QueryBuilderValue;
    const offset = (args[1] as NumberValue).value;

    return ok({
      type: ValueType.QUERY_BUILDER,
      collection: builder.collection,
      whereClauses: builder.whereClauses,
      orderByClauses: builder.orderByClauses,
      limitValue: builder.limitValue,
      offsetValue: offset,
    } as QueryBuilderValue);
  },
};

function buildSelectQuery(builder: QueryBuilderValue): { sql: string; params: any[] } {
  let sql = `select * from ${builder.collection.tableName}`;
  const params: any[] = [];

  if (builder.whereClauses.length > 0) {
    const conditions = builder.whereClauses.map((clause) => {
      params.push(runtimeValueToJs(clause.value));
      return `${clause.field} ${clause.operator} ?`;
    });
    sql += ` where ${conditions.join(" and ")}`;
  }

  if (builder.orderByClauses.length > 0) {
    const orders = builder.orderByClauses.map((o) => `${o.field} ${o.direction}`);
    sql += ` order by ${orders.join(", ")}`;
  }

  if (builder.limitValue !== null) {
    sql += ` limit ${builder.limitValue}`;
  }

  if (builder.offsetValue !== null) {
    sql += ` offset ${builder.offsetValue}`;
  }

  return { sql, params };
}

const query_all: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "all",
  return_type: "async array",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.QUERY_BUILDER) {
      return runtimeError("DbError: all() requires 1 QueryBuilder argument");
    }

    const builder = args[0] as QueryBuilderValue;
    const { sql, params } = buildSelectQuery(builder);

    try {
      const rows = builder.collection.database.connection.query(sql, params);
      const columns = builder.collection.database.connection.query(
        `pragma table_info(${builder.collection.tableName})`,
      );

      const result_array: RuntimeValue[] = [];

      for (const row of rows) {
        const result_obj = new Map<string, RuntimeValue>();
        for (let i = 0; i < columns.length; i++) {
          const col_name = columns[i][1];
          const col_value = row[i];
          result_obj.set(col_name, jsToRuntimeValue(col_value));
        }

        const result_runtime = { type: ValueType.OBJECT, properties: result_obj } as ObjectValue;

        const parse_fn = builder.collection.schema.properties.get("parse");
        if (parse_fn && parse_fn.type === ValueType.NATIVE_FUNCTION) {
          const parse_result = await (parse_fn as NativeFunctionValue).call([result_runtime]);
          if (!parse_result.ok) {
            return parse_result;
          }
          result_array.push(parse_result.value);
        } else {
          result_array.push(result_runtime);
        }
      }

      return ok({ type: ValueType.ARRAY, elements: result_array } as ArrayValue);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`DbError: Failed to execute query: ${err.message}`);
    }
  },
};

const query_first: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "first",
  return_type: "async object",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.QUERY_BUILDER) {
      return runtimeError("DbError: first() requires 1 QueryBuilder argument");
    }

    const builder = args[0] as QueryBuilderValue;
    const limited_builder = {
      ...builder,
      limitValue: 1,
    } as QueryBuilderValue;

    const result = await query_all.call([limited_builder]);
    if (!result.ok) {
      return result;
    }

    const array = result.value as ArrayValue;
    if (array.elements.length === 0) {
      return ok({ type: ValueType.NULL } as NullValue);
    }

    return ok(array.elements[0]);
  },
};

const query_count: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "count",
  return_type: "async number",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.QUERY_BUILDER) {
      return runtimeError("DbError: count() requires 1 QueryBuilder argument");
    }

    const builder = args[0] as QueryBuilderValue;

    let sql = `select count(*) as count from ${builder.collection.tableName}`;
    const params: any[] = [];

    if (builder.whereClauses.length > 0) {
      const conditions = builder.whereClauses.map((clause) => {
        params.push(runtimeValueToJs(clause.value));
        return `${clause.field} ${clause.operator} ?`;
      });
      sql += ` where ${conditions.join(" and ")}`;
    }

    try {
      const rows = builder.collection.database.connection.query(sql, params);
      const count = rows[0][0];
      return ok({ type: ValueType.NUMBER, value: count } as NumberValue);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`DbError: Failed to count: ${err.message}`);
    }
  },
};

const db_update: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "update",
  return_type: "UpdateBuilder",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.COLLECTION) {
      return runtimeError("DbError: update() requires 1 Collection argument");
    }

    const collection = args[0] as CollectionValue;

    return ok({
      type: ValueType.QUERY_BUILDER,
      collection,
      whereClauses: [],
      orderByClauses: [],
      limitValue: null,
      offsetValue: null,
    } as QueryBuilderValue);
  },
};

const update_set: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "set",
  return_type: "UpdateBuilder",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (
      args.length !== 2 ||
      args[0].type !== ValueType.QUERY_BUILDER ||
      args[1].type !== ValueType.OBJECT
    ) {
      return runtimeError("DbError: set() requires (UpdateBuilder, object)");
    }

    const builder = args[0] as QueryBuilderValue;
    const data = args[1] as ObjectValue;

    return ok({
      ...builder,
      updateData: data,
    } as any);
  },
};

const update_execute: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "execute",
  return_type: "async number",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.QUERY_BUILDER) {
      return runtimeError("DbError: execute() requires 1 UpdateBuilder argument");
    }

    const builder: any = args[0];

    if (!builder.updateData) {
      return runtimeError("DbError: Must call set() before execute()");
    }

    const data = builder.updateData as ObjectValue;
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, value] of data.properties.entries()) {
      fields.push(`${key} = ?`);
      values.push(runtimeValueToJs(value));
    }

    let sql = `update ${builder.collection.tableName} set ${fields.join(", ")}`;

    if (builder.whereClauses.length > 0) {
      const conditions = builder.whereClauses.map((clause: any) => {
        values.push(runtimeValueToJs(clause.value));
        return `${clause.field} ${clause.operator} ?`;
      });
      sql += ` where ${conditions.join(" and ")}`;
    }

    try {
      builder.collection.database.connection.query(sql, values);

      const changes_result = builder.collection.database.connection.query(
        "select changes() as changes",
      );
      const changes = changes_result[0][0];

      return ok({ type: ValueType.NUMBER, value: changes } as NumberValue);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`DbError: Failed to update: ${err.message}`);
    }
  },
};

const db_delete: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "delete",
  return_type: "DeleteBuilder",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.COLLECTION) {
      return runtimeError("DbError: delete() requires 1 Collection argument");
    }

    const collection = args[0] as CollectionValue;

    return ok({
      type: ValueType.QUERY_BUILDER,
      collection,
      whereClauses: [],
      orderByClauses: [],
      limitValue: null,
      offsetValue: null,
    } as QueryBuilderValue);
  },
};

const delete_execute: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "executeDelete",
  return_type: "async number",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.QUERY_BUILDER) {
      return runtimeError("DbError: execute() requires 1 DeleteBuilder argument");
    }

    const builder = args[0] as QueryBuilderValue;

    let sql = `delete from ${builder.collection.tableName}`;
    const params: any[] = [];

    if (builder.whereClauses.length > 0) {
      const conditions = builder.whereClauses.map((clause) => {
        params.push(runtimeValueToJs(clause.value));
        return `${clause.field} ${clause.operator} ?`;
      });
      sql += ` where ${conditions.join(" and ")}`;
    }

    try {
      builder.collection.database.connection.query(sql, params);

      const changes_result = builder.collection.database.connection.query(
        "select changes() as changes",
      );
      const changes = changes_result[0][0];

      return ok({ type: ValueType.NUMBER, value: changes } as NumberValue);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`DbError: Failed to delete: ${err.message}`);
    }
  },
};

const db_begin: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "begin",
  return_type: "async Transaction",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.DATABASE) {
      return runtimeError("DbError: begin() requires 1 Database argument");
    }

    const db = args[0] as DatabaseValue;

    try {
      db.connection.query("begin transaction");

      return ok({
        type: ValueType.TRANSACTION,
        database: db,
        active: true,
      } as TransactionValue);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`DbError: Failed to begin transaction: ${err.message}`);
    }
  },
};

const db_commit: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "commit",
  return_type: "async null",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.TRANSACTION) {
      return runtimeError("DbError: commit() requires 1 Transaction argument");
    }

    const tx = args[0] as TransactionValue;

    if (!tx.active) {
      return runtimeError("DbError: Transaction is not active");
    }

    try {
      tx.database.connection.query("commit");
      tx.active = false;

      return ok({ type: ValueType.NULL } as NullValue);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`DbError: Failed to commit transaction: ${err.message}`);
    }
  },
};

const db_rollback: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "rollback",
  return_type: "async null",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.TRANSACTION) {
      return runtimeError("DbError: rollback() requires 1 Transaction argument");
    }

    const tx = args[0] as TransactionValue;

    if (!tx.active) {
      return runtimeError("DbError: Transaction is not active");
    }

    try {
      tx.database.connection.query("rollback");
      tx.active = false;

      return ok({ type: ValueType.NULL } as NullValue);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`DbError: Failed to rollback transaction: ${err.message}`);
    }
  },
};

export const db_namespace: Record<string, RuntimeValue> = {
  open: db_open,
  close: db_close,
  collection: db_collection,
  insert: db_insert,
  get: db_get,
  deleteById: db_deleteById,
  select: db_select,
  update: db_update,
  delete: db_delete,
  where: query_where,
  orderBy: query_orderBy,
  limit: query_limit,
  offset: query_offset,
  set: update_set,
  execute: update_execute,
  executeDelete: delete_execute,
  all: query_all,
  first: query_first,
  count: query_count,
  begin: db_begin,
  commit: db_commit,
  rollback: db_rollback,
};
