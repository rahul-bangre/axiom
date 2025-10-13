import { ok, Result, runtimeError, typeError } from "../types/result.ts";
import type {
  BooleanValue,
  NativeFunctionValue,
  NumberValue,
  ObjectValue,
  RuntimeValue,
  StringValue,
} from "../runtime/value.ts";
import { ValueType } from "../runtime/value.ts";
import { jsToRuntimeValue } from "./json.ts";

function createResultObject(ok_value: boolean, value?: RuntimeValue, error?: string): ObjectValue {
  const properties = new Map<string, RuntimeValue>();
  properties.set("ok", { type: ValueType.BOOLEAN, value: ok_value } as BooleanValue);

  if (ok_value && value) {
    properties.set("value", value);
  } else if (!ok_value && error) {
    properties.set("error", { type: ValueType.STRING, value: error } as StringValue);
  }

  return {
    type: ValueType.OBJECT,
    properties,
  };
}

function createJsonMethod(body: string): NativeFunctionValue {
  return {
    type: ValueType.NATIVE_FUNCTION,
    name: "json",
    return_type: "async object",
    call: async (): Promise<Result<RuntimeValue>> => {
      try {
        const parsed = JSON.parse(body);
        const runtime_value = jsToRuntimeValue(parsed);
        return ok(createResultObject(true, runtime_value));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return ok(createResultObject(false, undefined, `Failed to parse JSON: ${message}`));
      }
    },
  };
}

function headersToObject(headers: Headers): ObjectValue {
  const properties = new Map<string, RuntimeValue>();
  for (const [key, value] of headers.entries()) {
    properties.set(key, { type: ValueType.STRING, value } as StringValue);
  }
  return {
    type: ValueType.OBJECT,
    properties,
  };
}

function createResponseObject(
  status: number,
  headers: Headers,
  body: string,
): ObjectValue {
  const properties = new Map<string, RuntimeValue>();
  properties.set("status", { type: ValueType.NUMBER, value: status } as NumberValue);
  properties.set("headers", headersToObject(headers));
  properties.set("body", { type: ValueType.STRING, value: body } as StringValue);
  properties.set("json", createJsonMethod(body));

  return {
    type: ValueType.OBJECT,
    properties,
  };
}

function extractRequestOptions(
  options_value?: RuntimeValue,
): { headers?: Record<string, string>; body?: string } | null {
  if (!options_value) {
    return {};
  }

  if (options_value.type !== ValueType.OBJECT) {
    return null;
  }

  const options_obj = options_value as ObjectValue;
  const result: { headers?: Record<string, string>; body?: string } = {};

  const headers_val = options_obj.properties.get("headers");
  if (headers_val) {
    if (headers_val.type !== ValueType.OBJECT) {
      return null;
    }
    const headers_obj = headers_val as ObjectValue;
    result.headers = {};
    for (const [key, val] of headers_obj.properties.entries()) {
      if (val.type !== ValueType.STRING) {
        return null;
      }
      result.headers[key] = (val as StringValue).value;
    }
  }

  const body_val = options_obj.properties.get("body");
  if (body_val) {
    if (body_val.type !== ValueType.STRING) {
      return null;
    }
    result.body = (body_val as StringValue).value;
  }

  return result;
}

async function httpRequest(
  url: string,
  method: string,
  options?: RuntimeValue,
): Promise<Result<RuntimeValue>> {
  const request_options = extractRequestOptions(options);
  if (request_options === null) {
    const error_msg =
      `${method} options must be an object with optional 'headers' (object) and 'body' (string)`;
    return ok(createResultObject(false, undefined, error_msg));
  }

  try {
    const fetch_options: RequestInit = {
      method,
      headers: request_options.headers,
      body: request_options.body,
    };

    const response = await fetch(url, fetch_options);
    const body = await response.text();

    const response_obj = createResponseObject(response.status, response.headers, body);
    return ok(createResultObject(true, response_obj));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return ok(createResultObject(false, undefined, `Network error: ${message}`));
  }
}

const http_get: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "get",
  return_type: "async object",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("http.get() expects exactly 1 argument (url)");
    }

    const url_arg = args[0];
    if (url_arg.type !== ValueType.STRING) {
      return typeError("http.get() requires a string URL");
    }

    const url = (url_arg as StringValue).value;
    return await httpRequest(url, "GET");
  },
};

const http_post: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "post",
  return_type: "async object",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length < 1 || args.length > 2) {
      return runtimeError("http.post() expects 1-2 arguments (url, options?)");
    }

    const url_arg = args[0];
    if (url_arg.type !== ValueType.STRING) {
      return typeError("http.post() requires a string URL");
    }

    const url = (url_arg as StringValue).value;
    const options = args.length === 2 ? args[1] : undefined;

    return await httpRequest(url, "POST", options);
  },
};

const http_put: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "put",
  return_type: "async object",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length < 1 || args.length > 2) {
      return runtimeError("http.put() expects 1-2 arguments (url, options?)");
    }

    const url_arg = args[0];
    if (url_arg.type !== ValueType.STRING) {
      return typeError("http.put() requires a string URL");
    }

    const url = (url_arg as StringValue).value;
    const options = args.length === 2 ? args[1] : undefined;

    return await httpRequest(url, "PUT", options);
  },
};

const http_delete: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "delete",
  return_type: "async object",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length !== 1) {
      return runtimeError("http.delete() expects exactly 1 argument (url)");
    }

    const url_arg = args[0];
    if (url_arg.type !== ValueType.STRING) {
      return typeError("http.delete() requires a string URL");
    }

    const url = (url_arg as StringValue).value;
    return await httpRequest(url, "DELETE");
  },
};

const http_patch: NativeFunctionValue = {
  type: ValueType.NATIVE_FUNCTION,
  name: "patch",
  return_type: "async object",
  call: async (args: RuntimeValue[]): Promise<Result<RuntimeValue>> => {
    if (args.length < 1 || args.length > 2) {
      return runtimeError("http.patch() expects 1-2 arguments (url, options?)");
    }

    const url_arg = args[0];
    if (url_arg.type !== ValueType.STRING) {
      return typeError("http.patch() requires a string URL");
    }

    const url = (url_arg as StringValue).value;
    const options = args.length === 2 ? args[1] : undefined;

    return await httpRequest(url, "PATCH", options);
  },
};

export function createHttpNamespace(): ObjectValue {
  return {
    type: ValueType.OBJECT,
    properties: new Map([
      ["get", http_get],
      ["post", http_post],
      ["put", http_put],
      ["delete", http_delete],
      ["patch", http_patch],
    ]),
  };
}
