import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate, RuntimeValue, ValueType } from "@runtime";
import { ModuleLoader } from "../src/runtime/module-loader.ts";

async function run(source: string): Promise<RuntimeValue> {
  const tokenizer = new Tokenizer(source);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const global_env = createGlobalEnv();
  const module_loader = new ModuleLoader();
  const result = await evaluate(ast, global_env, module_loader);

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
  const module_loader = new ModuleLoader();
  const result = await evaluate(ast, global_env, module_loader);

  if (result.ok) {
    throw new Error("Expected error but got success");
  }

  return result.error;
}

Deno.test("WS - can import std:ws module", async () => {
  const result = await run(`
    use "std:ws" as ws
    typeof ws.connect
  `);

  assertEquals(result.type, ValueType.STRING);
  assertEquals((result as any).value, "function");
});

Deno.test("WS - connect requires string URL", async () => {
  const error = await runExpectError(`
    use "std:ws" as ws
    result = await ws.connect(123)
  `);

  assertEquals(error.includes("connect() requires 1 string argument"), true);
});

Deno.test("WS - send requires connection and string", async () => {
  const error = await runExpectError(`
    use "std:ws" as ws
    result = await ws.send("not-a-connection", "message")
  `);

  assertEquals(error.includes("send() requires (WebSocketConnection, string)"), true);
});

Deno.test("WS - recv requires connection", async () => {
  const error = await runExpectError(`
    use "std:ws" as ws
    result = await ws.recv("not-a-connection")
  `);

  assertEquals(error.includes("recv() requires 1 WebSocketConnection argument"), true);
});

Deno.test("WS - close requires connection", async () => {
  const error = await runExpectError(`
    use "std:ws" as ws
    result = await ws.close("not-a-connection")
  `);

  assertEquals(error.includes("close() requires 1 WebSocketConnection argument"), true);
});

Deno.test("WS - server requires port and handler function", async () => {
  const error = await runExpectError(`
    use "std:ws" as ws
    result = await ws.server("not-a-number", null)
  `);

  assertEquals(error.includes("server() requires (number, function)"), true);
});

// Local echo server. echo.websocket.org sends a "Request served by ..." banner
// before echoing, so it cannot be used to check a send/recv round trip.
async function withEchoServer(body: (url: string) => Promise<void>): Promise<void> {
  const closed: Promise<void>[] = [];
  const server = Deno.serve({ port: 0, hostname: "127.0.0.1", onListen: () => {} }, (req) => {
    const { socket, response } = Deno.upgradeWebSocket(req);
    socket.onmessage = (event) => socket.send(event.data);
    closed.push(new Promise((resolve) => socket.addEventListener("close", () => resolve())));
    return response;
  });

  try {
    await body(`ws://127.0.0.1:${server.addr.port}`);
  } finally {
    await Promise.all(closed);
    await server.shutdown();
  }
}

Deno.test("WS - connect to echo server", async () => {
  await withEchoServer(async (url) => {
    const result = await run(`
      use "std:ws" as ws

      fn main(): async string {
        conn = await ws.connect("${url}")
        await ws.send(conn, "Hello WebSocket")
        response = await ws.recv(conn)
        await ws.close(conn)
        return response
      }

      await main()
    `);

    assertEquals(result.type, ValueType.STRING);
    assertEquals((result as any).value, "Hello WebSocket");
  });
});

Deno.test("WS - typeof connection is websocket", async () => {
  const result = await run(`
    use "std:ws" as ws
    
    fn main(): async string {
      conn = await ws.connect("wss://echo.websocket.org")
      result = typeof conn
      await ws.close(conn)
      return result
    }
    
    await main()
  `);

  assertEquals(result.type, ValueType.STRING);
  assertEquals((result as any).value, "websocket");
});

Deno.test("WS - invalid URL returns error", async () => {
  const error = await runExpectError(`
    use "std:ws" as ws
    
    fn main(): async void {
      conn = await ws.connect("invalid-url")
      return null
    }
    
    await main()
  `);

  assertEquals(error.includes("Failed to connect"), true);
});

Deno.test("WS - cannot send on closed connection", async () => {
  const error = await runExpectError(`
    use "std:ws" as ws
    
    fn main(): async void {
      conn = await ws.connect("wss://echo.websocket.org")
      await ws.close(conn)
      await ws.send(conn, "This should fail")
      return null
    }
    
    await main()
  `);

  assertEquals(error.includes("Cannot send message on closed connection"), true);
});

Deno.test("WS - cannot recv on closed connection", async () => {
  const error = await runExpectError(`
    use "std:ws" as ws
    
    fn main(): async void {
      conn = await ws.connect("wss://echo.websocket.org")
      await ws.close(conn)
      msg = await ws.recv(conn)
      return null
    }
    
    await main()
  `);

  assertEquals(error.includes("Cannot receive message on closed connection"), true);
});
