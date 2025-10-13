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

async function runFile(file_path: string): Promise<void> {
  try {
    const source_code = await Deno.readTextFile(file_path);

    const tokenizer = new Tokenizer(source_code);
    const tokens = tokenizer.tokenize();

    const parser = new Parser(tokens);
    const ast_node = parser.parse();

    const global_env = createGlobalEnv();
    const eval_result = await evaluate(ast_node, global_env);

    if (!eval_result.ok) {
      console.error(`Error: ${eval_result.error}`);
      Deno.exit(1);
    }

    const result_val = eval_result.value;
    if (result_val.type !== ValueType.NULL || (result_val as any).isReturn) {
      console.log(printValue(result_val));
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error(`Error: File '${file_path}' not found`);
      Deno.exit(1);
    }

    const err_obj = error as Error;
    console.error(`Error: ${err_obj.message}`);
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
  const cli_args = Deno.args;

  if (cli_args.length === 0) {
    showHelp();
    Deno.exit(1);
  }

  const command_arg = cli_args[0];

  if (command_arg === "--help" || command_arg === "-h") {
    showHelp();
    return;
  }

  if (command_arg === "--version" || command_arg === "-v") {
    showVersion();
    return;
  }

  await runFile(command_arg);
}

if (import.meta.main) {
  main();
}
