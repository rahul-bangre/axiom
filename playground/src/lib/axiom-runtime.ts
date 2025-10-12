// Browser-compatible Axiom runtime wrapper
import { Tokenizer } from "@axiom/lexer/tokenizer.ts";
import { Parser } from "@axiom/parser/parser.ts";
import { evaluate } from "@axiom/runtime/evaluator.ts";
import { createGlobalEnv } from "@axiom/runtime/builtins.ts";
import { ValueType } from "@axiom/runtime/value.ts";

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number;
}

export function runAxiomCode(code: string): ExecutionResult {
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
    const result = evaluate(ast, globalEnv);

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
