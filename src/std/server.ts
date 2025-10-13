import { ok, Result, runtimeError, typeError } from "../types/result.ts";
import {
  ArrayValue,
  FunctionValue,
  NativeFunctionValue,
  NullValue,
  NumberValue,
  ObjectValue,
  RuntimeValue,
  StringValue,
  ValueType,
} from "../runtime/value.ts";
import { Environment } from "../runtime/environment.ts";

type RouteMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RouteConfig {
  type: "route";
  method: RouteMethod;
  path: string;
  handlers: RuntimeValue[];
}

interface MiddlewareConfig {
  type: "middleware";
  handler: RuntimeValue;
}

type ServerConfig = RouteConfig | MiddlewareConfig;

interface PathMatch {
  matches: boolean;
  params: Map<string, string>;
}

function _parsePathPattern(pattern: string): { segments: string[]; paramNames: string[] } {
  const segments = pattern.split("/").filter((s) => s.length > 0);
  const param_names: string[] = [];

  for (const segment of segments) {
    if (segment.startsWith(":")) {
      param_names.push(segment.slice(1));
    }
  }

  return { segments, paramNames: param_names };
}

function matchPath(pattern: string, path: string): PathMatch {
  const pattern_parts = pattern.split("/").filter((s) => s.length > 0);
  const path_parts = path.split("/").filter((s) => s.length > 0);

  if (pattern_parts.length !== path_parts.length) {
    return { matches: false, params: new Map() };
  }

  const params = new Map<string, string>();

  for (let i = 0; i < pattern_parts.length; i++) {
    const pattern_part = pattern_parts[i];
    const path_part = path_parts[i];

    if (pattern_part.startsWith(":")) {
      const param_name = pattern_part.slice(1);
      params.set(param_name, path_part);
    } else if (pattern_part !== path_part) {
      return { matches: false, params: new Map() };
    }
  }

  return { matches: true, params };
}

function parseQueryString(query_string: string): Map<string, string> {
  const params = new Map<string, string>();

  if (!query_string || query_string.length === 0) {
    return params;
  }

  const pairs = query_string.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key) {
      params.set(decodeURIComponent(key), decodeURIComponent(value || ""));
    }
  }

  return params;
}

async function executeMiddlewareChain(
  handlers: RuntimeValue[],
  request: RuntimeValue,
  _env: Environment,
): Promise<Result<RuntimeValue>> {
  let current_request = request;

  for (const handler of handlers) {
    if (handler.type !== ValueType.FUNCTION && handler.type !== ValueType.NATIVE_FUNCTION) {
      return typeError("Middleware must be a function");
    }

    let result: Result<RuntimeValue>;

    if (handler.type === ValueType.FUNCTION) {
      const func = handler as FunctionValue;
      const local_env = new Environment(func.closure);

      if (func.params.length !== 1) {
        return runtimeError(`Handler expects 1 parameter, got ${func.params.length}`);
      }

      local_env.define(func.params[0], current_request);

      const { evaluate } = await import("../runtime/evaluator.ts");
      result = await evaluate(func.body, local_env);
    } else {
      const native_func = handler as NativeFunctionValue;
      result = await native_func.call([current_request]);
    }

    if (!result.ok) {
      return result;
    }

    let return_value = result.value;

    if ((return_value as any).isReturn) {
      return_value = (return_value as any).returnValue || return_value;
    }

    if (return_value.type === ValueType.OBJECT) {
      const obj = return_value as ObjectValue;
      if (obj.properties.has("status")) {
        return ok(return_value);
      }
    }

    current_request = return_value;
  }

  return ok(current_request);
}

export const http_get: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "get",
  call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length < 2) {
      return Promise.resolve(runtimeError("http.get() expects 2 arguments: path and handler(s)"));
    }

    const [path_arg, handler_arg] = args;

    if (path_arg.type !== ValueType.STRING) {
      return Promise.resolve(typeError("http.get() path must be a string"));
    }

    let handlers: RuntimeValue[];

    if (handler_arg.type === ValueType.ARRAY) {
      handlers = (handler_arg as ArrayValue).elements;
    } else if (
      handler_arg.type === ValueType.FUNCTION || handler_arg.type === ValueType.NATIVE_FUNCTION
    ) {
      handlers = [handler_arg];
    } else {
      return Promise.resolve(
        typeError("http.get() handler must be a function or array of functions"),
      );
    }

    const route_config: ObjectValue = {
      type: ValueType.OBJECT,
      properties: new Map([
        ["type", { type: ValueType.STRING, value: "route" } as StringValue],
        ["method", { type: ValueType.STRING, value: "GET" } as StringValue],
        ["path", path_arg],
        ["handlers", { type: ValueType.ARRAY, elements: handlers } as ArrayValue],
      ]),
    };

    return Promise.resolve(ok(route_config));
  },
};

export const http_post: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "post",
  call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length < 2) {
      return Promise.resolve(runtimeError("http.post() expects 2 arguments: path and handler(s)"));
    }

    const [path_arg, handler_arg] = args;

    if (path_arg.type !== ValueType.STRING) {
      return Promise.resolve(typeError("http.post() path must be a string"));
    }

    let handlers: RuntimeValue[];

    if (handler_arg.type === ValueType.ARRAY) {
      handlers = (handler_arg as ArrayValue).elements;
    } else if (
      handler_arg.type === ValueType.FUNCTION || handler_arg.type === ValueType.NATIVE_FUNCTION
    ) {
      handlers = [handler_arg];
    } else {
      return Promise.resolve(
        typeError("http.post() handler must be a function or array of functions"),
      );
    }

    const route_config: ObjectValue = {
      type: ValueType.OBJECT,
      properties: new Map([
        ["type", { type: ValueType.STRING, value: "route" } as StringValue],
        ["method", { type: ValueType.STRING, value: "POST" } as StringValue],
        ["path", path_arg],
        ["handlers", { type: ValueType.ARRAY, elements: handlers } as ArrayValue],
      ]),
    };

    return Promise.resolve(ok(route_config));
  },
};

export const http_put: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "put",
  call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length < 2) {
      return Promise.resolve(runtimeError("http.put() expects 2 arguments: path and handler(s)"));
    }

    const [path_arg, handler_arg] = args;

    if (path_arg.type !== ValueType.STRING) {
      return Promise.resolve(typeError("http.put() path must be a string"));
    }

    let handlers: RuntimeValue[];

    if (handler_arg.type === ValueType.ARRAY) {
      handlers = (handler_arg as ArrayValue).elements;
    } else if (
      handler_arg.type === ValueType.FUNCTION || handler_arg.type === ValueType.NATIVE_FUNCTION
    ) {
      handlers = [handler_arg];
    } else {
      return Promise.resolve(
        typeError("http.put() handler must be a function or array of functions"),
      );
    }

    const route_config: ObjectValue = {
      type: ValueType.OBJECT,
      properties: new Map([
        ["type", { type: ValueType.STRING, value: "route" } as StringValue],
        ["method", { type: ValueType.STRING, value: "PUT" } as StringValue],
        ["path", path_arg],
        ["handlers", { type: ValueType.ARRAY, elements: handlers } as ArrayValue],
      ]),
    };

    return Promise.resolve(ok(route_config));
  },
};

export const http_patch: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "patch",
  call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length < 2) {
      return Promise.resolve(runtimeError("http.patch() expects 2 arguments: path and handler(s)"));
    }

    const [path_arg, handler_arg] = args;

    if (path_arg.type !== ValueType.STRING) {
      return Promise.resolve(typeError("http.patch() path must be a string"));
    }

    let handlers: RuntimeValue[];

    if (handler_arg.type === ValueType.ARRAY) {
      handlers = (handler_arg as ArrayValue).elements;
    } else if (
      handler_arg.type === ValueType.FUNCTION || handler_arg.type === ValueType.NATIVE_FUNCTION
    ) {
      handlers = [handler_arg];
    } else {
      return Promise.resolve(
        typeError("http.patch() handler must be a function or array of functions"),
      );
    }

    const route_config: ObjectValue = {
      type: ValueType.OBJECT,
      properties: new Map([
        ["type", { type: ValueType.STRING, value: "route" } as StringValue],
        ["method", { type: ValueType.STRING, value: "PATCH" } as StringValue],
        ["path", path_arg],
        ["handlers", { type: ValueType.ARRAY, elements: handlers } as ArrayValue],
      ]),
    };

    return Promise.resolve(ok(route_config));
  },
};

export const http_delete: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "delete",
  call: (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length < 2) {
      return Promise.resolve(
        runtimeError("http.delete() expects 2 arguments: path and handler(s)"),
      );
    }

    const [path_arg, handler_arg] = args;

    if (path_arg.type !== ValueType.STRING) {
      return Promise.resolve(typeError("http.delete() path must be a string"));
    }

    let handlers: RuntimeValue[];

    if (handler_arg.type === ValueType.ARRAY) {
      handlers = (handler_arg as ArrayValue).elements;
    } else if (
      handler_arg.type === ValueType.FUNCTION || handler_arg.type === ValueType.NATIVE_FUNCTION
    ) {
      handlers = [handler_arg];
    } else {
      return Promise.resolve(
        typeError("http.delete() handler must be a function or array of functions"),
      );
    }

    const route_config: ObjectValue = {
      type: ValueType.OBJECT,
      properties: new Map([
        ["type", { type: ValueType.STRING, value: "route" } as StringValue],
        ["method", { type: ValueType.STRING, value: "DELETE" } as StringValue],
        ["path", path_arg],
        ["handlers", { type: ValueType.ARRAY, elements: handlers } as ArrayValue],
      ]),
    };

    return Promise.resolve(ok(route_config));
  },
};

export const http_server: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "server",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 2) {
      return runtimeError("http.server() expects 2 arguments: port and config");
    }

    const [port_arg, config_arg] = args;

    if (port_arg.type !== ValueType.NUMBER) {
      return typeError("http.server() port must be a number");
    }

    const port = Math.floor((port_arg as NumberValue).value);

    if (config_arg.type !== ValueType.OBJECT) {
      return typeError("http.server() config must be an object with middleware and routes");
    }

    const config_obj = config_arg as ObjectValue;
    const middleware_val = config_obj.properties.get("middleware");
    const routes_val = config_obj.properties.get("routes");

    if (!middleware_val || middleware_val.type !== ValueType.ARRAY) {
      return typeError("http.server() config.middleware must be an array");
    }

    if (!routes_val || routes_val.type !== ValueType.ARRAY) {
      return typeError("http.server() config.routes must be an array");
    }

    const global_middleware = (middleware_val as ArrayValue).elements;
    const routes = (routes_val as ArrayValue).elements;

    const parsed_routes: RouteConfig[] = [];

    for (const route of routes) {
      if (route.type !== ValueType.OBJECT) {
        return typeError("Each route must be an object");
      }

      const route_obj = route as ObjectValue;
      const type_val = route_obj.properties.get("type");
      const method_val = route_obj.properties.get("method");
      const path_val = route_obj.properties.get("path");
      const handlers_val = route_obj.properties.get("handlers");

      if (
        !type_val || type_val.type !== ValueType.STRING ||
        (type_val as StringValue).value !== "route"
      ) {
        return typeError("Route must have type 'route'");
      }

      if (!method_val || method_val.type !== ValueType.STRING) {
        return typeError("Route must have a method");
      }

      if (!path_val || path_val.type !== ValueType.STRING) {
        return typeError("Route must have a path");
      }

      if (!handlers_val || handlers_val.type !== ValueType.ARRAY) {
        return typeError("Route must have handlers array");
      }

      parsed_routes.push({
        type: "route",
        method: (method_val as StringValue).value as RouteMethod,
        path: (path_val as StringValue).value,
        handlers: (handlers_val as ArrayValue).elements,
      });
    }

    const handler = async (req: Request): Promise<Response> => {
      try {
        const url = new URL(req.url);
        const path = url.pathname;
        const method = req.method as RouteMethod;

        let matching_route: RouteConfig | null = null;
        let path_params = new Map<string, string>();

        for (const route of parsed_routes) {
          if (route.method === method) {
            const match = matchPath(route.path, path);
            if (match.matches) {
              matching_route = route;
              path_params = match.params;
              break;
            }
          }
        }

        if (!matching_route) {
          return new Response(
            JSON.stringify({ error: "Not Found" }),
            { status: 404, headers: { "Content-Type": "application/json" } },
          );
        }

        const body_text = await req.text();
        const query_params = parseQueryString(url.search.slice(1));

        const headers_map = new Map<string, RuntimeValue>();
        req.headers.forEach((value, key) => {
          headers_map.set(key, { type: ValueType.STRING, value } as StringValue);
        });

        const params_map = new Map<string, RuntimeValue>();
        path_params.forEach((value, key) => {
          params_map.set(key, { type: ValueType.STRING, value } as StringValue);
        });

        const query_map = new Map<string, RuntimeValue>();
        query_params.forEach((value, key) => {
          query_map.set(key, { type: ValueType.STRING, value } as StringValue);
        });

        const request_obj: ObjectValue = {
          type: ValueType.OBJECT,
          properties: new Map<string, RuntimeValue>([
            ["method", { type: ValueType.STRING, value: method } as StringValue],
            ["path", { type: ValueType.STRING, value: path } as StringValue],
            ["body", { type: ValueType.STRING, value: body_text } as StringValue],
            ["headers", { type: ValueType.OBJECT, properties: headers_map } as ObjectValue],
            ["params", { type: ValueType.OBJECT, properties: params_map } as ObjectValue],
            ["query", { type: ValueType.OBJECT, properties: query_map } as ObjectValue],
          ]),
        };

        const all_handlers = [...global_middleware, ...matching_route.handlers];
        const env = new Environment();

        const result = await executeMiddlewareChain(all_handlers, request_obj, env);

        if (!result.ok) {
          return new Response(
            JSON.stringify({ error: result.error }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        let response = result.value;

        if ((response as any).isReturn) {
          response = (response as any).returnValue || response;
        }

        if (response.type !== ValueType.OBJECT) {
          return new Response(
            JSON.stringify({ error: "Handler must return an object" }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }

        const response_obj = response as ObjectValue;
        const status_val = response_obj.properties.get("status");
        const body_val = response_obj.properties.get("body");
        const headers_val = response_obj.properties.get("headers");

        const status = status_val && status_val.type === ValueType.NUMBER
          ? Math.floor((status_val as NumberValue).value)
          : 200;

        const body = body_val && body_val.type === ValueType.STRING
          ? (body_val as StringValue).value
          : "";

        const response_headers: Record<string, string> = {};

        if (headers_val && headers_val.type === ValueType.OBJECT) {
          const headers_obj = headers_val as ObjectValue;
          headers_obj.properties.forEach((val, key) => {
            if (val.type === ValueType.STRING) {
              response_headers[key] = (val as StringValue).value;
            }
          });
        }

        return new Response(body, { status, headers: response_headers });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: String(error) }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    };

    console.log(`🚀 Axiom server listening on http://localhost:${port}`);

    await Deno.serve({ port, handler }).finished;

    return ok({ type: ValueType.NULL } as NullValue);
  },
};
