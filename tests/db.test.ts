import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import {
  ArrayValue,
  createGlobalEnv,
  evaluate,
  NumberValue,
  ObjectValue,
  RuntimeValue,
  StringValue,
  ValueType,
} from "@runtime";
import { ModuleLoader } from "../src/runtime/module-loader.ts";

async function runProgram(
  code: string,
): Promise<{ ok: boolean; value?: RuntimeValue; error?: string }> {
  const tokenizer = new Tokenizer(code);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const global_env = await createGlobalEnv();
  const module_loader = new ModuleLoader();

  const result = await evaluate(ast, global_env, module_loader);

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  return { ok: true, value: result.value };
}

Deno.test("DB - can import std:db module", async () => {
  const code = `use "std:db" as db`;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
});

Deno.test("DB - open in-memory database", async () => {
  const code = `
    use "std:db" as db
    store = await db.open(":memory:")
    result = typeof store
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
});

Deno.test("DB - create collection with schema", async () => {
  const code = `
    use "std:db" as db
    
    store = await db.open(":memory:")
    user_schema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    users = db.collection(store, "users", user_schema)
    result = typeof users
  `;
  const result = await runProgram(code);
  if (!result.ok) {
    console.log("Error:", result.error);
  }
  assertEquals(result.ok, true);
});

Deno.test("DB - insert and retrieve row", async () => {
  const code = `
    use "std:db" as db
    
    store = await db.open(":memory:")
    user_schema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    users = db.collection(store, "users", user_schema)
    
    inserted = await db.insert(users, { name: "Alice", age: 25 })
    result = await db.get(users, inserted.id)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(
    ((result.value as ObjectValue).properties.get("name") as StringValue).value,
    "Alice",
  );
  assertEquals(((result.value as ObjectValue).properties.get("age") as NumberValue).value, 25);
});

Deno.test("DB - query with where clause", async () => {
  const code = `
    use "std:db" as db
    
    store = await db.open(":memory:")
    user_schema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    users = db.collection(store, "users", user_schema)
    
    await db.insert(users, { name: "Alice", age: 25 })
    await db.insert(users, { name: "Bob", age: 30 })
    await db.insert(users, { name: "Charlie", age: 20 })
    
    result = await db.select(users).where("age", ">=", 25).all()
  `;
  const result = await runProgram(code);
  if (!result.ok) {
    console.log("Query where error:", result.error);
  }
  assertEquals(result.ok, true);
  assertEquals((result.value as RuntimeValue).type, ValueType.ARRAY);
  assertEquals((result.value as ArrayValue).elements.length, 2);
});

Deno.test("DB - query with orderBy", async () => {
  const code = `
    use "std:db" as db
    
    store = await db.open(":memory:")
    user_schema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    users = db.collection(store, "users", user_schema)
    
    await db.insert(users, { name: "Charlie", age: 20 })
    await db.insert(users, { name: "Alice", age: 25 })
    await db.insert(users, { name: "Bob", age: 30 })
    
    result = await db.select(users).orderBy("age", "asc").all()
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  const arr = (result.value as ArrayValue).elements;
  assertEquals(((arr[0] as ObjectValue).properties.get("age") as NumberValue).value, 20);
  assertEquals(((arr[1] as ObjectValue).properties.get("age") as NumberValue).value, 25);
  assertEquals(((arr[2] as ObjectValue).properties.get("age") as NumberValue).value, 30);
});

Deno.test("DB - query with limit", async () => {
  const code = `
    use "std:db" as db
    
    store = await db.open(":memory:")
    user_schema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    users = db.collection(store, "users", user_schema)
    
    await db.insert(users, { name: "Alice", age: 25 })
    await db.insert(users, { name: "Bob", age: 30 })
    await db.insert(users, { name: "Charlie", age: 20 })
    
    result = await db.select(users).limit(2).all()
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as ArrayValue).elements.length, 2);
});

Deno.test("DB - query first", async () => {
  const code = `
    use "std:db" as db
    
    store = await db.open(":memory:")
    user_schema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    users = db.collection(store, "users", user_schema)
    
    await db.insert(users, { name: "Alice", age: 25 })
    await db.insert(users, { name: "Bob", age: 30 })
    
    result = await db.select(users).where("name", "=", "Bob").first()
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(((result.value as ObjectValue).properties.get("name") as StringValue).value, "Bob");
});

Deno.test("DB - query count", async () => {
  const code = `
    use "std:db" as db
    
    store = await db.open(":memory:")
    user_schema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    users = db.collection(store, "users", user_schema)
    
    await db.insert(users, { name: "Alice", age: 25 })
    await db.insert(users, { name: "Bob", age: 30 })
    await db.insert(users, { name: "Charlie", age: 20 })
    
    result = await db.select(users).where("age", ">", 20).count()
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as NumberValue).value, 2);
});

Deno.test("DB - update rows", async () => {
  const code = `
    use "std:db" as db
    
    store = await db.open(":memory:")
    user_schema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    users = db.collection(store, "users", user_schema)
    
    inserted = await db.insert(users, { name: "Alice", age: 25 })
    await db.update(users).where("id", "=", inserted.id).set({ age: 26 }).execute()
    
    result = await db.get(users, inserted.id)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals(((result.value as ObjectValue).properties.get("age") as NumberValue).value, 26);
});

Deno.test("DB - deleteById", async () => {
  const code = `
    use "std:db" as db
    
    store = await db.open(":memory:")
    user_schema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    users = db.collection(store, "users", user_schema)
    
    inserted = await db.insert(users, { name: "Alice", age: 25 })
    await db.deleteById(users, inserted.id)
    
    result = await db.get(users, inserted.id)
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as RuntimeValue).type, ValueType.NULL);
});

Deno.test("DB - delete with where", async () => {
  const code = `
    use "std:db" as db
    
    store = await db.open(":memory:")
    user_schema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    users = db.collection(store, "users", user_schema)
    
    await db.insert(users, { name: "Alice", age: 25 })
    await db.insert(users, { name: "Bob", age: 30 })
    await db.insert(users, { name: "Charlie", age: 20 })
    
    await db.delete(users).where("age", "<", 25).executeDelete()
    result = await db.select(users).count()
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as NumberValue).value, 2);
});

Deno.test("DB - transaction commit", async () => {
  const code = `
    use "std:db" as db
    
    store = await db.open(":memory:")
    user_schema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    users = db.collection(store, "users", user_schema)
    
    tx = await db.begin(store)
    await db.insert(users, { name: "Alice", age: 25 })
    await db.commit(tx)
    
    result = await db.select(users).count()
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as NumberValue).value, 1);
});

Deno.test("DB - transaction rollback", async () => {
  const code = `
    use "std:db" as db
    
    store = await db.open(":memory:")
    user_schema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    users = db.collection(store, "users", user_schema)
    
    await db.insert(users, { name: "Alice", age: 25 })
    
    tx = await db.begin(store)
    await db.insert(users, { name: "Bob", age: 30 })
    await db.rollback(tx)
    
    result = await db.select(users).count()
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  assertEquals((result.value as NumberValue).value, 1);
});

Deno.test("DB - schema validation on insert", async () => {
  const code = `
    use "std:db" as db
    
    store = await db.open(":memory:")
    user_schema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    users = db.collection(store, "users", user_schema)
    
    result = await db.insert(users, { name: "Alice", age: "not a number" })
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, false);
  assertEquals(result.error?.includes("Expected number"), true);
});

Deno.test("DB - complex query chaining", async () => {
  const code = `
    use "std:db" as db
    
    store = await db.open(":memory:")
    user_schema = schema.object({
      name: schema.string(),
      age: schema.number()
    })
    users = db.collection(store, "users", user_schema)
    
    await db.insert(users, { name: "Alice", age: 25 })
    await db.insert(users, { name: "Bob", age: 30 })
    await db.insert(users, { name: "Charlie", age: 35 })
    await db.insert(users, { name: "David", age: 40 })
    
    result = await db.select(users)
      .where("age", ">=", 30)
      .where("age", "<", 40)
      .orderBy("name", "asc")
      .limit(10)
      .all()
  `;
  const result = await runProgram(code);
  assertEquals(result.ok, true);
  const arr = (result.value as ArrayValue).elements;
  assertEquals(arr.length, 2);
  assertEquals(((arr[0] as ObjectValue).properties.get("name") as StringValue).value, "Bob");
  assertEquals(((arr[1] as ObjectValue).properties.get("name") as StringValue).value, "Charlie");
});
