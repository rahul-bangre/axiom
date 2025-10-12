# Axiom Language Support for VS Code

Syntax highlighting and language support for the Axiom programming language.

## Features

- **Syntax Highlighting**: Full syntax highlighting for Axiom (`.ax`) files
- **Auto-completion**: Bracket and quote auto-closing
- **Comments**: Support for `//` line comments and `/* */` block comments
- **Code Folding**: Fold functions and blocks

## Syntax Highlighting

The extension provides highlighting for:

- **Keywords**: `fn`, `return`, `if`, `type`, `typeof`
- **Types**: `int`, `float`, `string`, `bool`, `null`, `void`, `array`, `object`, `function`
- **Constants**: `true`, `false`, `null`
- **Numbers**: Integers, floats, and hex literals
- **Strings**: Single and double quoted strings with escape sequences
- **Comments**: Line (`//`) and block (`/* */`) comments
- **Operators**: Arithmetic (`+`, `-`, `*`, `/`, `%`), comparison (`==`, `!=`, `<`, `>`, `<=`,
  `>=`), logical (`&&`, `||`, `!`), ternary (`?`, `:`), and arrow (`=>`)
- **Functions**: Function declarations and calls

## Installation

### From Source

1. Clone the repository or copy the `vscode-axiom` folder
2. Copy the folder to your VS Code extensions directory:
   - **macOS/Linux**: `~/.vscode/extensions/`
   - **Windows**: `%USERPROFILE%\.vscode\extensions\`
3. Reload VS Code
4. Open any `.ax` file to see syntax highlighting

### Manual Installation

1. Open VS Code
2. Press `Cmd+Shift+P` (macOS) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Extensions: Install from VSIX"
4. Select the `.vsix` file if you have one

## Building from Source

If you want to package the extension:

```bash
npm install -g vsce
cd vscode-axiom
vsce package
```

This will create a `.vsix` file you can install or share.

## Language Examples

```axiom
// function declaration
fn factorial(n: int): int {
  if (n <= 1) {
    return 1
  }
  return n * factorial(n - 1)
}

// lambda expressions
double = x => x * 2
add = (x, y) => x + y

// ternary expressions
result = x > 0 ? "positive" : "negative"

// typeof operator
type_name = typeof 42  // "number"

// array operations
nums = [1, 2, 3, 4, 5]
doubled = nums.map(x => x * 2)

// immutable by default
x = 10
// x = 20  // Error: cannot reassign
```

## About Axiom

Axiom is a minimal, typed, functional programming language with:

- Immutability by default
- Expression-based syntax
- Strong static typing with inference
- Lambda expressions
- Functional array methods
- No loops (recursion only)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT

## Links

- [Axiom Repository](https://github.com/yourusername/axiom)
- [Language Documentation](https://github.com/yourusername/axiom/blob/main/README.md)
