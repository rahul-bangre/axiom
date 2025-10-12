# Axiom Programming Language

A minimal, typed, functional language built on immutable truth.

## Philosophy

- **Minimal and elegant syntax** — avoids unnecessary keywords and symbols
- **Functional-first, immutable by default** — no reassignment of variables
- **Strong, static typing with type inference**
- **Explicit returns required in functions**
- **No `else` keyword** — prefer early returns or ternaries
- **Purely expression-based where possible**
- **All lowercase identifiers**
- **Variables and types use `snake_case`**
- **Functions use `camelCase`**

## Installation

Make sure you have [Deno](https://deno.land/) installed on your system.

```bash
# Clone the repository
git clone <your-repo-url>
cd axiom

# Run the REPL
make repl

# Run a file
make run ARGS=examples/hello-world.ax

# Run tests
make test

# Type check
make check
```

## Language Syntax

### Variables

Variables are immutable by default (no reassignment):

```axiom
x = 42
pi = 3.14159
name = "axiom"

user_age: int = 25
```

### Functions

Functions use `fn` keyword and `camelCase` naming:

```axiom
fn add(a: int, b: int): int {
  return a + b
}

result = add(5, 3)
print(result)
```

### Control Flow

Only `if` statements are supported (no `else` — use early returns):

```axiom
fn checkNumber(n: int): string {
  if (n < 0) {
    return "negative"
  }
  if (n == 0) {
    return "zero"
  }
  return "positive"
}
```

### Arrays

```axiom
numbers = [1, 2, 3, 4, 5]
first = numbers[0]
```

### Objects

```axiom
user = {name: "rahul", age: 21}
user_name = user.name
```

### Operators

**Arithmetic**: `+`, `-`, `*`, `/`, `%`

**Comparison**: `==`, `!=`, `<`, `>`, `<=`, `>=`

**Logical**: `&&`, `||`, `!`

## Built-in Functions

### I/O Functions

- `print(...args)` - Print values to console

### Math Functions

- `abs(n)` - Absolute value
- `sqrt(n)` - Square root
- `pow(base, exp)` - Power
- `floor(n)` - Floor
- `ceil(n)` - Ceiling
- `round(n)` - Round
- `min(...args)` - Minimum value
- `max(...args)` - Maximum value
- `random()` - Random number [0, 1)

### Array Functions

- `len(arr)` - Get length of array or string
- `push(arr, val)` - Add element to array
- `pop(arr)` - Remove last element
- `first(arr)` - Get first element
- `last(arr)` - Get last element

## Examples

### Hello World

```axiom
print("Hello, World!")
```

### Factorial

```axiom
fn factorial(n: int): int {
  if (n <= 1) {
    return 1
  }
  return n * factorial(n - 1)
}

print("Factorial of 5:", factorial(5))
```

### Fibonacci

```axiom
fn fibonacci(n: int): int {
  if (n <= 1) {
    return n
  }
  return fibonacci(n - 1) + fibonacci(n - 2)
}

i = 0
print("fib(", i, ") =", fibonacci(i))
```

## Project Structure

```
axiom/
├── src/
│   ├── lexer/          # Tokenization
│   ├── parser/         # AST generation
│   ├── interpreter/    # Code execution
│   ├── types/          # Type system
│   ├── runtime/        # Runtime values
│   ├── std/            # Standard library
│   ├── repl/           # Interactive REPL
│   └── main.ts         # CLI entry point
├── tests/              # Test suite
├── examples/           # Example programs
├── Makefile            # Build commands
└── deno.json           # Deno configuration
```

## Development

```bash
# Run tests
make test

# Type check
make check

# Format code
make format

# Run REPL
make repl

# Run a file
make run ARGS=examples/hello-world.ax
```

## Makefile Commands

- `make check` - Type check all TypeScript files
- `make test` - Run test suite
- `make format` - Format code with deno fmt
- `make run ARGS=<file>` - Run an Axiom file
- `make repl` - Start interactive REPL
- `make clean` - Clean temporary files

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Roadmap

- [x] Basic lexer and parser
- [x] Variable declarations (immutable)
- [x] Function declarations
- [x] If statements (no else)
- [x] Type annotations
- [x] Arrays and objects
- [ ] Lambda functions
- [ ] Type checking
- [ ] Standard library expansion
- [ ] Module system
- [ ] Pattern matching
- [ ] Compilation to bytecode
