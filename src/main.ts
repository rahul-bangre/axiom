function runFile(filename: string): void {
  // TODO: Implement file execution
  console.log(`Running ${filename}...`);
}

function repl(): void {
  console.log("Axiom REPL v0.1.0");
  console.log('Type "exit" to quit\n');

  // TODO: Implement REPL
}

function printUsage(): void {
  console.log("Usage:");
  console.log("  deno run --allow-read src/main.ts [file.ax]  - Run a file");
  console.log("  deno run --allow-read src/main.ts            - Start REPL");
}

if (import.meta.main) {
  const args = Deno.args;

  if (args.length === 0) {
    repl();
  } else if (args.length === 1) {
    if (args[0] === "--help" || args[0] === "-h") {
      printUsage();
    } else {
      runFile(args[0]);
    }
  } else {
    printUsage();
    Deno.exit(1);
  }
}
