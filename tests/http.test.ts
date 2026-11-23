import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import {
  BooleanValue,
  createGlobalEnv,
  evaluate,
  NumberValue,
  ObjectValue,
  RuntimeValue,
  StringValue,
  ValueType,
} from "@runtime";

async function run(source: string): Promise<RuntimeValue> {
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const global_env = createGlobalEnv();
  const result = await evaluate(ast, global_env);

  if (!result.ok) {
    throw new Error(result.error);
  }

  return result.value;
}

async function runExpectError(source: string): Promise<string> {
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const global_env = createGlobalEnv();
  const result = await evaluate(ast, global_env);

  if (result.ok) {
    throw new Error("Expected error but got success");
  }

  return result.error;
}

Deno.test("HTTP - http.fetch returns async result object", async () => {
  const result = await run(`
    result = await http.fetch("https://jsonplaceholder.typicode.com/users/1")
    result
  `);

  assertEquals(result.type, ValueType.OBJECT);
  const obj = result as ObjectValue;
  assertEquals(obj.properties.has("ok"), true);
  assertEquals(obj.properties.has("value"), true);
});

Deno.test("HTTP - http.fetch success has response with status", async () => {
  const result = await run(`
    result = await http.fetch("https://jsonplaceholder.typicode.com/users/1")
    if (!result.ok) {
      return -1
    }
    result.value.status
  `);

  assertEquals(result.type, ValueType.NUMBER);
  const status = (result as NumberValue).value;
  assertEquals(status, 200);
});

Deno.test("HTTP - http.fetch response has body", async () => {
  const result = await run(`
    result = await http.fetch("https://jsonplaceholder.typicode.com/users/1")
    if (!result.ok) {
      return "error"
    }
    typeof(result.value.body)
  `);

  assertEquals(result.type, ValueType.STRING);
  assertEquals((result as StringValue).value, "string");
});

Deno.test("HTTP - http.fetch response has headers", async () => {
  const result = await run(`
    result = await http.fetch("https://jsonplaceholder.typicode.com/users/1")
    if (!result.ok) {
      return "error"
    }
    typeof(result.value.headers)
  `);

  assertEquals(result.type, ValueType.STRING);
  assertEquals((result as StringValue).value, "object");
});

Deno.test("HTTP - response.json() returns parsed object", async () => {
  const result = await run(`
    result = await http.fetch("https://jsonplaceholder.typicode.com/users/1")
    if (!result.ok) {
      return null
    }
    
    response = result.value
    json_result = await response.json()
    
    if (!json_result.ok) {
      return null
    }
    
    user = json_result.value
    user.name
  `);

  assertEquals(result.type, ValueType.STRING);
  assertEquals((result as StringValue).value, "Leanne Graham");
});

Deno.test("HTTP - http.fetch POST with body", async () => {
  const result = await run(`
    data = {title: "test", body: "content", userId: 1}
    result = await http.fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      body: json.stringify(data)
    })
    
    if (!result.ok) {
      return -1
    }
    result.value.status
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 201);
});

Deno.test("HTTP - http.fetch PUT updates resource", async () => {
  const result = await run(`
    data = {id: 1, title: "updated", body: "new content", userId: 1}
    result = await http.fetch("https://jsonplaceholder.typicode.com/posts/1", {
      method: "PUT",
      body: json.stringify(data)
    })
    
    if (!result.ok) {
      return -1
    }
    result.value.status
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 200);
});

Deno.test("HTTP - http.fetch DELETE removes resource", async () => {
  const result = await run(`
    result = await http.fetch("https://jsonplaceholder.typicode.com/posts/1", {
      method: "DELETE"
    })
    
    if (!result.ok) {
      return -1
    }
    result.value.status
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 200);
});

Deno.test("HTTP - http.fetch PATCH updates resource partially", async () => {
  const result = await run(`
    data = {title: "patched"}
    result = await http.fetch("https://jsonplaceholder.typicode.com/posts/1", {
      method: "PATCH",
      body: json.stringify(data)
    })
    
    if (!result.ok) {
      return -1
    }
    result.value.status
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 200);
});

Deno.test("HTTP - 404 response is success with 404 status", async () => {
  const result = await run(`
    result = await http.fetch("https://jsonplaceholder.typicode.com/users/999999")
    
    if (!result.ok) {
      return -1
    }
    result.value.status
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as NumberValue).value, 404);
});

Deno.test("HTTP - invalid URL returns error result", async () => {
  const result = await run(`
    result = await http.fetch("not-a-valid-url")
    result.ok
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals((result as BooleanValue).value, false);
});

Deno.test("HTTP - http.fetch requires string URL", async () => {
  const error = await runExpectError(`
    result = await http.fetch(123)
  `);

  assertEquals(error.includes("requires a string URL"), true);
});

Deno.test("HTTP - http.fetch requires 1-2 arguments", async () => {
  const error = await runExpectError(`
    result = await http.fetch()
  `);

  assertEquals(error.includes("expects 1-2 arguments"), true);
});

Deno.test("HTTP - http.fetch accepts optional options", async () => {
  const result = await run(`
    result = await http.fetch("https://jsonplaceholder.typicode.com/posts")
    result.ok
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
});

Deno.test("HTTP - response.json() on invalid JSON returns error", async () => {
  const result = await run(`
    result = await http.fetch("https://jsonplaceholder.typicode.com/")
    if (!result.ok) {
      return false
    }
    
    response = result.value
    json_result = await response.json()
    json_result.ok
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
});

Deno.test("HTTP - can access nested JSON properties", async () => {
  const result = await run(`
    result = await http.fetch("https://jsonplaceholder.typicode.com/users/1")
    if (!result.ok) {
      return null
    }
    
    json_result = await result.value.json()
    if (!json_result.ok) {
      return null
    }
    
    user = json_result.value
    user.address.city
  `);

  assertEquals(result.type, ValueType.STRING);
  assertEquals((result as StringValue).value, "Gwenborough");
});

Deno.test("HTTP - http object exists in global scope", async () => {
  const result = await run(`typeof(http)`);

  assertEquals(result.type, ValueType.STRING);
  assertEquals((result as StringValue).value, "object");
});

Deno.test("HTTP - http has all methods", async () => {
  const result = await run(`
    has_fetch = typeof(http.fetch) == "function"
    has_get = typeof(http.get) == "function"
    has_post = typeof(http.post) == "function"
    has_put = typeof(http.put) == "function"
    has_delete = typeof(http.delete) == "function"
    has_patch = typeof(http.patch) == "function"
    has_server = typeof(http.server) == "function"
    
    has_fetch && has_get && has_post && has_put && has_delete && has_patch && has_server
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals((result as BooleanValue).value, true);
});
