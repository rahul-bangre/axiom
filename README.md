# Axiom

A minimal, typed, functional language built on immutable truth.

## Features

- 🔒 **Immutable by default** - all bindings are constants
- 🎯 **Functional-first** - functions, closures, lambdas, recursion
- 📝 **Type annotations** - optional runtime type checking
- ⚡ **Clean syntax** - no semicolons, minimal keywords
- 🚀 **Fast execution** - built with Deno + TypeScript
- 🔄 **Async/Await** - asynchronous computations as values
- ✨ **Rich standard library** - array methods, string methods, schema validation
- 🌐 **Web playground** - interactive browser-based editor

## Philosophy

- Minimal and elegant syntax
- Purely expression-based where possible
- snake_case for variables, camelCase for functions
- No reassignment, no `else` keyword, no loops
- Explicit returns required in functions
- Errors as values with `Result<T>` pattern

## Installation

### Run locally

```bash
deno task run examples/async-demo.ax
```

### Install globally

```bash
deno install -Agf --name=axiom src/cli.ts
```

Then use anywhere:

```bash
axiom examples/leetcode.ax
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
// lambdas and array methods
numbers = [1, 2, 3, 4, 5]
doubled = numbers.map((x) => x * 2)
evens = numbers.filter((x) => x % 2 == 0)
sum = numbers.reduce((acc, x) => acc + x, 0)

print("Doubled:", doubled)
print("Evens:", evens)
print("Sum:", sum)
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

// Lambda functions
square = (x) => x * x
add_five = (n) => n + 5
```

### Control Flow

```axiom
// If statements
fn absolute(n) {
  if (n < 0) {
    return -n
  }
  return n
}

// Ternary operator
result = x > 0 ? "positive" : "non-positive"

// Match expressions (pattern matching)
status = 200
message = match(status,
  200 -> "OK",
  404 -> "Not Found",
  500 -> "Server Error",
  default -> "Unknown"
)

// Match with any expression
result = match(x * 2,
  0 -> "zero",
  10 -> "ten",
  default -> "other"
)
```

### Collections

```axiom
// Arrays (immutable)
numbers = [1, 2, 3, 4, 5]
first = numbers[0]
count = len(numbers)

// Array methods
doubled = numbers.map((x) => x * 2)
evens = numbers.filter((x) => x % 2 == 0)
sum = numbers.reduce((acc, x) => acc + x, 0)

// Objects
user = {name: "rahul", age: 21, active: true}
username = user.name
```

### String Operations

```axiom
text = "hello world"

// String methods
upper = text.toUpperCase()           // "HELLO WORLD"
words = text.split(" ")               // ["hello", "world"]
trimmed = "  space  ".trim()          // "space"
replaced = text.replace("world", "axiom")  // "hello axiom"
```

### Async/Await

```axiom
// Functions can return async values
fn fetch_user(id: int): async string {
  return "User_" + id
}

// Await resolves async values
user = await fetch_user(1)
print("User:", user)

// Check types
async_val = fetch_user(2)
print(typeof async_val)  // "async"
print(typeof user)       // "string"
```

### Schema Validation

```axiom
// Define schemas for data validation
user_schema = schema.object({
  name: schema.string().min(1).max(50),
  age: schema.number().min(0).max(120),
  email: schema.string()
})

// Parse and validate
result = user_schema.parse({
  name: "Alice",
  age: 30,
  email: "alice@example.com"
})

// Extend schemas
admin_schema = user_schema.extend({
  role: schema.string(),
  permissions: schema.array(schema.string())
})
```

## Built-in Functions

### Core Functions

- `print(...values)` - print values to stdout
- `len(array | string)` - get length
- `typeof value` - get runtime type

### Array Methods

- `push(item)` - add item to end
- `pop()` - remove last item
- `first()` - get first element
- `last()` - get last element
- `slice(start, end?)` - extract subarray
- `concat(other)` - combine arrays
- `map(fn)` - transform elements
- `filter(fn)` - select elements
- `reduce(fn, initial)` - accumulate value
- `forEach(fn)` - iterate with side effects
- `find(fn)` - find first match
- `findIndex(fn)` - find index of first match
- `some(fn)` - check if any match
- `every(fn)` - check if all match
- `flatMap(fn)` - map and flatten
- `join(separator?)` - join to string
- `reverse()` - reverse array
- `sort()` - sort numerically

### String Methods

- `split(delimiter?)` - split into array
- `trim()` - remove whitespace
- `trimStart()` - remove leading whitespace
- `trimEnd()` - remove trailing whitespace
- `toUpperCase()` - convert to uppercase
- `toLowerCase()` - convert to lowercase
- `replace(search, replace)` - replace first occurrence
- `replaceAll(search, replace)` - replace all occurrences
- `startsWith(prefix)` - check prefix
- `endsWith(suffix)` - check suffix
- `includes(substring)` - check contains
- `indexOf(substring)` - find index
- `lastIndexOf(substring)` - find last index
- `substring(start, end?)` - extract substring
- `charAt(index)` - get character at index
- `repeat(count)` - repeat string
- `padStart(length, char?)` - pad start
- `padEnd(length, char?)` - pad end

### JSON

- `json.parse(string)` - parse JSON string
- `json.stringify(value)` - convert to JSON string

### Schema

- `schema.string()` - string validator
- `schema.number()` - number validator
- `schema.boolean()` - boolean validator
- `schema.array(schema)` - array validator
- `schema.object(shape)` - object validator
- `schema.optional(schema)` - optional field
- `schema.lazy(fn)` - recursive schema
- `schema.any()` - accept any value

## Development

```bash
# run tests (320 tests)
make test

# type check
make check

# format code
make format

# run a file
deno task run examples/async-demo.ax
```

## Project Structure

```
axiom/
├── src/
│   ├── lexer/          # tokenization
│   ├── parser/         # AST generation
│   ├── runtime/        # evaluation & environment
│   ├── std/            # standard library (array, string, schema, json)
│   ├── types/          # type checker & Result<T>
│   ├── repl/           # REPL (coming soon)
│   └── cli.ts          # CLI entrypoint
├── tests/              # test suites (320 tests)
├── examples/           # example programs
├── playground/         # web-based interactive playground
├── axiom-vscode/       # VSCode syntax highlighting extension
└── deno.json           # deno configuration
```

## Examples

See the `examples/` directory:

- `leetcode.ax` - LeetCode problem solutions
- `async-demo.ax` - async/await demonstration
- `match-demo.ax` - pattern matching examples
- `schema-validation.ax` - schema validation examples

## Playground

Try Axiom in your browser! The playground includes:

- Monaco Editor with Axiom syntax highlighting
- Real-time code execution
- Example code snippets
- Dark mode with custom Axiom Nova theme

```bash
cd playground
npm install
npm run dev
```

## VSCode Extension

Syntax highlighting for `.ax` files:

```bash
cd axiom-vscode
vsce package
# Install the generated .vsix file in VSCode
```

## Type System

Axiom supports optional runtime type checking:

```axiom
// Variable types
x: int = 42
name: string = "Alice"
active: bool = true
items: array = [1, 2, 3]
config: object = {debug: true}

// Function parameter and return types
fn add(a: int, b: int): int {
  return a + b
}

// Void return type (inferred for typed params without explicit return type)
fn log_message(msg: string): void {
  print(msg)
}

// Async return types
fn fetch_data(id: int): async string {
  return "Data_" + id
}
```

## Error Handling

Axiom uses errors as values with the `Result<T>` pattern:

```typescript
// Internal Result type
type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };
```

Schema validation returns results that can be checked:

```axiom
user_schema = schema.object({
  name: schema.string()
})

result = user_schema.parse({name: 42})
// Returns Result with ok: false, error: "Expected string"
```

## Roadmap

- [x] Core language features
- [x] Functional programming (lambdas, closures, recursion)
- [x] Array & string standard library
- [x] Schema validation
- [x] Async/await
- [x] Web playground
- [x] VSCode extension
- [ ] REPL
- [ ] Module system
- [ ] File I/O
- [ ] HTTP client

## Philosophy & Design

### Immutability

All data structures are immutable. Array and string methods return new values rather than modifying
in place.

### Explicit Over Implicit

- Functions must use explicit `return` statements
- Type annotations are optional but checked at runtime when provided
- Async functions must be awaited explicitly

### Expression-Based

Most constructs are expressions that return values (ternary, function calls, etc.)

### Minimal Syntax

- No semicolons
- No `else` keyword (use ternary or early returns)
- No traditional loops (use recursion or array methods)
- No classes (use objects and closures)

## License

MIT

---
