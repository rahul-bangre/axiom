import { Tokenizer } from "@lexer";
import { Parser } from "@parser";
import { createGlobalEnv, evaluate, RuntimeValue, ValueType } from "@runtime";

function printValue(value: RuntimeValue): string {
  switch (value.type) {
    case ValueType.NUMBER:
      return String((value as any).value);
    case ValueType.STRING:
      return (value as any).value;
    case ValueType.BOOLEAN:
      return String((value as any).value);
    case ValueType.NULL:
      return "null";
    case ValueType.ARRAY: {
      const elements = (value as any).elements.map(printValue);
      return `[${elements.join(", ")}]`;
    }
    case ValueType.OBJECT: {
      const entries = Array.from((value as any).properties.entries()) as Array<
        [string, RuntimeValue]
      >;
      const props = entries.map(([key, val]) => `${key}: ${printValue(val)}`);
      return `{${props.join(", ")}}`;
    }
    case ValueType.FUNCTION:
      return `<function ${(value as any).name}>`;
    case ValueType.NATIVE_FUNCTION:
      return `<native function ${(value as any).name}>`;
    default:
      return String(value);
  }
}

async function runFile(filepath: string): Promise<void> {
  try {
    const source = await Deno.readTextFile(filepath);

    const tokenizer = new Tokenizer(source);
    const tokens = tokenizer.tokenize();

    const parser = new Parser(tokens);
    const ast = parser.parse();

    const env = createGlobalEnv();
    const result = evaluate(ast, env);

    if (result.type !== ValueType.NULL || (result as any).isReturn) {
      console.log(printValue(result));
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error(`Error: File '${filepath}' not found`);
      Deno.exit(1);
    }

    const err = error as Error;
    console.error(`Error: ${err.message}`);
    Deno.exit(1);
  }
}

function showHelp(): void {
  console.log(`
Axiom - a minimal, typed, functional language

Usage:
  axiom <file>          Run an Axiom source file
  axiom --help          Show this help message
  axiom --version       Show version information

Examples:
  axiom hello.ax
  axiom examples/fibonacci.ax
  `.trim());
}

function showVersion(): void {
  console.log("axiom 0.1.0");
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.length === 0) {
    showHelp();
    Deno.exit(1);
  }

  const command = args[0];

  if (command === "--help" || command === "-h") {
    showHelp();
    return;
  }

  if (command === "--version" || command === "-v") {
    showVersion();
    return;
  }

  await runFile(command);
}

if (import.meta.main) {
  main();
}
