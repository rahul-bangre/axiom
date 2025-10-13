import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate, RuntimeValue, ValueType } from "@runtime";

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

Deno.test("HTTP - http.get returns async result object", async () => {
  const result = await run(`
    result = await http.get("https://jsonplaceholder.typicode.com/users/1")
    result
  `);

  assertEquals(result.type, ValueType.OBJECT);
  const obj = result as any;
  assertEquals(obj.properties.has("ok"), true);
  assertEquals(obj.properties.has("value"), true);
});

Deno.test("HTTP - http.get success has response with status", async () => {
  const result = await run(`
    result = await http.get("https://jsonplaceholder.typicode.com/users/1")
    if (!result.ok) {
      return -1
    }
    result.value.status
  `);

  assertEquals(result.type, ValueType.NUMBER);
  const status = (result as any).value;
  assertEquals(status, 200);
});

Deno.test("HTTP - http.get response has body", async () => {
  const result = await run(`
    result = await http.get("https://jsonplaceholder.typicode.com/users/1")
    if (!result.ok) {
      return "error"
    }
    typeof(result.value.body)
  `);

  assertEquals(result.type, ValueType.STRING);
  assertEquals((result as any).value, "string");
});

Deno.test("HTTP - http.get response has headers", async () => {
  const result = await run(`
    result = await http.get("https://jsonplaceholder.typicode.com/users/1")
    if (!result.ok) {
      return "error"
    }
    typeof(result.value.headers)
  `);

  assertEquals(result.type, ValueType.STRING);
  assertEquals((result as any).value, "object");
});

Deno.test("HTTP - response.json() returns parsed object", async () => {
  const result = await run(`
    result = await http.get("https://jsonplaceholder.typicode.com/users/1")
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
  assertEquals((result as any).value, "Leanne Graham");
});

Deno.test("HTTP - http.post with body", async () => {
  const result = await run(`
    data = {title: "test", body: "content", userId: 1}
    result = await http.post("https://jsonplaceholder.typicode.com/posts", {
      body: json.stringify(data)
    })
    
    if (!result.ok) {
      return -1
    }
    result.value.status
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 201);
});

Deno.test("HTTP - http.put updates resource", async () => {
  const result = await run(`
    data = {id: 1, title: "updated", body: "new content", userId: 1}
    result = await http.put("https://jsonplaceholder.typicode.com/posts/1", {
      body: json.stringify(data)
    })
    
    if (!result.ok) {
      return -1
    }
    result.value.status
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 200);
});

Deno.test("HTTP - http.delete removes resource", async () => {
  const result = await run(`
    result = await http.delete("https://jsonplaceholder.typicode.com/posts/1")
    
    if (!result.ok) {
      return -1
    }
    result.value.status
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 200);
});

Deno.test("HTTP - http.patch updates resource partially", async () => {
  const result = await run(`
    data = {title: "patched"}
    result = await http.patch("https://jsonplaceholder.typicode.com/posts/1", {
      body: json.stringify(data)
    })
    
    if (!result.ok) {
      return -1
    }
    result.value.status
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 200);
});

Deno.test("HTTP - 404 response is success with 404 status", async () => {
  const result = await run(`
    result = await http.get("https://jsonplaceholder.typicode.com/users/999999")
    
    if (!result.ok) {
      return -1
    }
    result.value.status
  `);

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 404);
});

Deno.test("HTTP - invalid URL returns error result", async () => {
  const result = await run(`
    result = await http.get("not-a-valid-url")
    result.ok
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals((result as any).value, false);
});

Deno.test("HTTP - http.get requires string URL", async () => {
  const error = await runExpectError(`
    result = await http.get(123)
  `);

  assertEquals(error.includes("requires a string URL"), true);
});

Deno.test("HTTP - http.post requires string URL", async () => {
  const error = await runExpectError(`
    result = await http.post(true)
  `);

  assertEquals(error.includes("requires a string URL"), true);
});

Deno.test("HTTP - http.get requires exactly 1 argument", async () => {
  const error = await runExpectError(`
    result = await http.get()
  `);

  assertEquals(error.includes("expects exactly 1 argument"), true);
});

Deno.test("HTTP - http.post accepts 1-2 arguments", async () => {
  const result = await run(`
    result = await http.post("https://jsonplaceholder.typicode.com/posts")
    result.ok
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
});

Deno.test("HTTP - response.json() on invalid JSON returns error", async () => {
  const result = await run(`
    result = await http.get("https://jsonplaceholder.typicode.com/")
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
    result = await http.get("https://jsonplaceholder.typicode.com/users/1")
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
  assertEquals((result as any).value, "Gwenborough");
});

Deno.test("HTTP - http object exists in global scope", async () => {
  const result = await run(`typeof(http)`);

  assertEquals(result.type, ValueType.STRING);
  assertEquals((result as any).value, "object");
});

Deno.test("HTTP - http has all CRUD methods", async () => {
  const result = await run(`
    has_get = typeof(http.get) == "function"
    has_post = typeof(http.post) == "function"
    has_put = typeof(http.put) == "function"
    has_delete = typeof(http.delete) == "function"
    has_patch = typeof(http.patch) == "function"
    
    has_get && has_post && has_put && has_delete && has_patch
  `);

  assertEquals(result.type, ValueType.BOOLEAN);
  assertEquals((result as any).value, true);
});
