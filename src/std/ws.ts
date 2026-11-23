import { ok, Result, runtimeError } from "../types/result.ts";
import {
  FunctionValue,
  NativeFunctionValue,
  NullValue,
  RuntimeValue,
  StringValue,
  ValueType,
  WebSocketConnectionValue,
} from "../runtime/value.ts";
import { Environment } from "../runtime/environment.ts";
import { evaluate } from "../runtime/evaluator.ts";

const ws_connect: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "connect",
  return_type: "async WebSocketConnection",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.STRING) {
      return runtimeError("WsError: connect() requires 1 string argument (url)");
    }

    const url = (args[0] as StringValue).value;

    try {
      const socket = new WebSocket(url);

      const connection: WebSocketConnectionValue = {
        type: ValueType.WEBSOCKET_CONNECTION,
        socket,
        url,
        isServer: false,
        messageQueue: [],
        resolvers: [],
        closed: false,
      };

      await new Promise<void>((resolve, reject) => {
        socket.onopen = () => resolve();
        socket.onerror = (error) => reject(new Error(`Connection failed: ${error}`));
      });

      socket.onmessage = (event) => {
        const message = event.data;

        if (connection.resolvers.length > 0) {
          const resolver = connection.resolvers.shift()!;
          resolver(message);
        } else {
          connection.messageQueue.push(message);
        }
      };

      socket.onclose = () => {
        connection.closed = true;
      };

      return ok(connection);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`WsError: Failed to connect: ${err.message}`);
    }
  },
};

const ws_send: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "send",
  return_type: "async null",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (
      args.length !== 2 ||
      args[0].type !== ValueType.WEBSOCKET_CONNECTION ||
      args[1].type !== ValueType.STRING
    ) {
      return runtimeError("WsError: send() requires (WebSocketConnection, string)");
    }

    const connection = args[0] as WebSocketConnectionValue;
    const message = (args[1] as StringValue).value;

    if (connection.closed) {
      return runtimeError("WsError: Cannot send message on closed connection");
    }

    try {
      connection.socket.send(message);
      return ok({ type: ValueType.NULL } as NullValue);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`WsError: Failed to send message: ${err.message}`);
    }
  },
};

const ws_recv: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "recv",
  return_type: "async string",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.WEBSOCKET_CONNECTION) {
      return runtimeError("WsError: recv() requires 1 WebSocketConnection argument");
    }

    const connection = args[0] as WebSocketConnectionValue;

    if (connection.closed) {
      return runtimeError("WsError: Cannot receive message on closed connection");
    }

    if (connection.messageQueue.length > 0) {
      const message = connection.messageQueue.shift()!;
      return ok({ type: ValueType.STRING, value: message } as StringValue);
    }

    return new Promise<Result<RuntimeValue>>((resolve) => {
      connection.resolvers.push((message: string) => {
        resolve(ok({ type: ValueType.STRING, value: message } as StringValue));
      });
    });
  },
};

const ws_close: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "close",
  return_type: "async null",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1 || args[0].type !== ValueType.WEBSOCKET_CONNECTION) {
      return runtimeError("WsError: close() requires 1 WebSocketConnection argument");
    }

    const connection = args[0] as WebSocketConnectionValue;

    try {
      if (!connection.closed) {
        connection.socket.close();
        connection.closed = true;
      }
      return ok({ type: ValueType.NULL } as NullValue);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`WsError: Failed to close connection: ${err.message}`);
    }
  },
};

const ws_server: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "server",
  return_type: "async null",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (
      args.length !== 2 ||
      args[0].type !== ValueType.NUMBER ||
      args[1].type !== ValueType.FUNCTION
    ) {
      return runtimeError("WsError: server() requires (number, function)");
    }

    const port = (args[0] as any).value;
    const handler_fn = args[1] as FunctionValue;

    if (handler_fn.params.length !== 1) {
      return runtimeError("WsError: Handler function must take exactly 1 parameter (connection)");
    }

    try {
      const handler = (req: Request): Response => {
        const upgrade = req.headers.get("upgrade") || "";

        if (upgrade.toLowerCase() !== "websocket") {
          return new Response("Expected WebSocket upgrade", { status: 426 });
        }

        const { socket, response } = Deno.upgradeWebSocket(req);

        const connection: WebSocketConnectionValue = {
          type: ValueType.WEBSOCKET_CONNECTION,
          socket,
          url: req.url,
          isServer: true,
          messageQueue: [],
          resolvers: [],
          closed: false,
        };

        socket.onopen = async () => {
          const handler_env = handler_fn.closure.extend();
          handler_env.define(handler_fn.params[0], connection);

          const result = await evaluate(handler_fn.body, handler_env);
          if (!result.ok) {
            console.error("Handler error:", result.error);
          }
        };

        socket.onmessage = (event) => {
          const message = event.data;

          if (connection.resolvers.length > 0) {
            const resolver = connection.resolvers.shift()!;
            resolver(message);
          } else {
            connection.messageQueue.push(message);
          }
        };

        socket.onclose = () => {
          connection.closed = true;
        };

        return response;
      };

      await Deno.serve({ port, handler }).finished;

      return ok({ type: ValueType.NULL } as NullValue);
    } catch (error) {
      const err = error as Error;
      return runtimeError(`WsError: Failed to start server: ${err.message}`);
    }
  },
};

export const ws_namespace: Record<string, RuntimeValue> = {
  connect: ws_connect,
  send: ws_send,
  recv: ws_recv,
  close: ws_close,
  server: ws_server,
};
