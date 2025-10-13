// Browser-compatible Axiom runtime wrapper
import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate, ValueType } from "@runtime";
import type { VirtualFS } from "./virtual-fs";
import { BrowserModuleLoader } from "./browser-module-loader";

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

export async function runAxiomCode(
  code: string,
  current_file: string = "main.ax",
  virtual_fs?: VirtualFS,
): Promise<ExecutionResult> {
  const startTime = performance.now();
  const logs: string[] = [];

  // Capture console.log output
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args: any[]) => {
    logs.push(args.map((arg) => formatValue(arg)).join(" "));
  };

  console.error = (...args: any[]) => {
    logs.push("Error: " + args.map((arg) => formatValue(arg)).join(" "));
  };

  try {
    // Tokenize
    const tokenizer = new Tokenizer(code);
    const tokens = tokenizer.tokenize();

    // Parse
    const parser = new Parser(tokens);
    const ast = parser.parse();

    // Evaluate
    const globalEnv = createGlobalEnv();
    let module_loader;
    if (virtual_fs) {
      module_loader = new BrowserModuleLoader(virtual_fs);
      module_loader.current_file = current_file;
    }
    const result = await evaluate(ast, globalEnv, module_loader);

    // Restore console
    console.log = originalLog;
    console.error = originalError;

    const executionTime = performance.now() - startTime;

    // Handle Result type
    if (!result.ok) {
      return {
        success: false,
        output: logs.join("\n"),
        error: result.error,
        executionTime,
      };
    }

    // Add final result to output if not null
    const value = result.value;
    if (value.type !== ValueType.NULL && !(value as any).isReturn) {
      logs.push(`=> ${formatRuntimeValue(value)}`);
    }

    return {
      success: true,
      output: logs.join("\n"),
      executionTime,
    };
  } catch (error) {
    // Restore console
    console.log = originalLog;
    console.error = originalError;

    const executionTime = performance.now() - startTime;

    return {
      success: false,
      output: logs.join("\n"),
      error: error instanceof Error ? error.message : String(error),
      executionTime,
    };
  }
}

// Format runtime values for display
function formatRuntimeValue(value: any): string {
  switch (value.type) {
    case ValueType.NUMBER:
      return String(value.value);
    case ValueType.STRING:
      return `"${value.value}"`;
    case ValueType.BOOLEAN:
      return String(value.value);
    case ValueType.NULL:
      return "null";
    case ValueType.ARRAY:
      const elements = value.elements.map(formatRuntimeValue);
      return `[${elements.join(", ")}]`;
    case ValueType.OBJECT:
      const props: string[] = [];
      for (const [key, val] of value.properties.entries()) {
        props.push(`${key}: ${formatRuntimeValue(val)}`);
      }
      return `{${props.join(", ")}}`;
    case ValueType.FUNCTION:
      return `<function ${value.name || "anonymous"}>`;
    case ValueType.NATIVE_FUNCTION:
      return `<native function ${value.name}>`;
    default:
      return String(value);
  }
}

// Format JavaScript values for console output
function formatValue(value: any): string {
  if (typeof value === "object" && value !== null) {
    if (value.type) {
      return formatRuntimeValue(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
