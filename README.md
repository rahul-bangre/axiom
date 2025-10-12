# Axiom

A minimal, typed, functional language built on immutable truth.

## Features

- 🔒 **Immutable by default** - all bindings are constants
- 🎯 **Functional-first** - functions, closures, recursion
- 📝 **Type annotations** - optional static typing
- ⚡ **Clean syntax** - no semicolons, minimal keywords
- 🚀 **Fast execution** - built with Deno + TypeScript

## Philosophy

- Minimal and elegant syntax
- Purely expression-based where possible
- All lowercase identifiers (snake_case for variables, camelCase for functions)
- No reassignment, no `else` keyword, no loops
- Explicit returns required in functions

## Installation

### Run locally

```bash
deno task run examples/hello-world.ax
```

### Install globally

```bash
deno install -Agf --name=axiom src/cli.ts
```

Then use anywhere:

```bash
axiom examples/fibonacci.ax
```

## Quick Start

```axiom
// hello-world.ax
print("Hello, World!")

name = "Axiom"
print("Welcome to", name)
```

```axiom
// functions with recursion
fn factorial(n) {
  if (n <= 1) {
    return 1
  }
  return n * factorial(n - 1)
}

print("5! =", factorial(5))
```

```axiom
// closures
outer = 10

fn addOuter(x) {
  return x + outer
}

print(addOuter(5))  // 15
```

## Syntax

### Variables (immutable)

```axiom
x = 42
name: string = "rahul"
is_active = true
```

### Functions

```axiom
fn add(a, b) {
  return a + b
}

fn greet(name: string): string {
  return "Hello, " + name
}
```

### Control Flow

```axiom
fn absolute(n) {
  if (n < 0) {
    return -n
  }
  return n
}
```

### Collections

```axiom
// arrays
numbers = [1, 2, 3, 4, 5]
first = numbers[0]
count = len(numbers)

// objects
user = {name: "rahul", age: 21}
username = user.name
```

## Built-in Functions

- `print(...values)` - print values to stdout
- `len(array | string)` - get length

## Development

```bash
# run tests
make test

# type check
make check

# format code
make format

# run a file
deno task run examples/hello-world.ax
```

## Project Structure

```
axiom/
├── src/
│   ├── lexer/          # tokenization
│   ├── parser/         # AST generation
│   ├── runtime/        # evaluation & environment
│   ├── std/            # standard library
│   ├── types/          # type checker
│   └── cli.ts          # CLI entrypoint
├── tests/              # test suites
├── examples/           # example programs
└── deno.json           # deno configuration
```

## Examples

See the `examples/` directory for more:

- `hello-world.ax` - basic syntax
- `fibonacci.ax` - recursive fibonacci
- `factorial.ax` - recursive factorial

## License

MIT
