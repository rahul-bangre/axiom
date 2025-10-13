# Axiom

A minimal, typed, functional language built on immutable truth.

## Features

- 🔒 **Immutable by default** - all bindings are constants
- 🎯 **Functional-first** - functions, closures, lambdas, recursion
- 📝 **Type annotations** - optional runtime type checking
- ⚡ **Clean syntax** - no semicolons, minimal keywords
- 🚀 **Fast execution** - built with Deno + TypeScript
- 🔄 **Async/Await** - asynchronous computations as values
- ✨ **Rich standard library** - arrays, strings, sets, maps, schema validation, HTTP client
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

### Optional Chaining

```axiom
// Safely access properties that might not exist
user = { name: "Alice", profile: { age: 25 } }
name = user?.name          // "Alice"
email = user?.email        // null (no error)

// Deep nesting
age = user?.profile?.age   // 25
city = user?.profile?.city // null

// Works with null values
empty = null
result = empty?.field      // null (no error)

// Computed access
data = [1, 2, 3]
value = data?.[1]          // 2
missing = data?.[10]       // null (no error)

// Real-world usage
fn get_header(req) {
  return req?.headers?.authorization
}

auth = get_header(null)  // null instead of error
```

### Nullish Coalescing

```axiom
// Return right side only if left is null
name = user?.name ?? "Guest"      // Defaults to "Guest" if null
port = config?.port ?? 8080        // Defaults to 8080

// Different from || - only checks null, not falsy
count = 0 ?? 10                    // 0 (zero is not null)
enabled = false ?? true            // false (false is not null)
text = "" ?? "default"             // "" (empty string is not null)

// Multiple fallbacks
value = primary ?? secondary ?? default_value

// Combining with optional chaining
display = user?.profile?.name ?? user?.username ?? "Anonymous"
port = config?.server?.port ?? config?.defaultPort ?? 3000

// In functions
fn get_config(env) {
  host = env?.database?.host ?? "localhost"
  port = env?.database?.port ?? 5432
  return host + ":" + port
}

// With ternary
permission = (role?.name ?? "guest") == "admin" ? "full" : "limited"
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

### HTTP Client

```axiom
// GET request
result = await http.fetch("https://api.example.com/users/1")

if (!result.ok) {
  print("Network error:", result.error)
  return null
}

response = result.value
print("Status:", response.status)

// Parse JSON response
json_result = await response.json()
if (json_result.ok) {
  user = json_result.value
  print("User name:", user.name)
}

// POST with JSON body
post_data = {title: "Hello", body: "World", userId: 1}
post_result = await http.fetch("https://api.example.com/posts", {
  method: "POST",
  body: json.stringify(post_data)
})

// HTTP errors are part of the response
if (response.status >= 400) {
  print("HTTP error:", response.status)
}
```

### HTTP Server

Build REST APIs with declarative routing, middleware, and path parameters.

> **Note:** HTTP server requires Deno runtime and only works via CLI (`deno run --allow-net`), not
> in the browser playground.

```axiom
// Define handlers
fn get_users(req) {
  users = [{id: 1, name: "Alice"}, {id: 2, name: "Bob"}]
  return {
    status: 200,
    headers: {"Content-Type": "application/json"},
    body: json.stringify(users)
  }
}

fn get_user_by_id(req) {
  id = req.params.id
  return {
    status: 200,
    body: "User ID: " + id
  }
}

// Middleware
fn logger(req) {
  print("[" + req.method + "]", req.path)
  return req
}

fn auth(req) {
  token = req.headers.authorization
  if (token == null) {
    return {
      status: 401,
      body: json.stringify({error: "Unauthorized"})
    }
  }
  return req
}

// Configure server
config = {
  middleware: [logger],
  routes: [
    http.get("/users", get_users),
    http.get("/users/:id", get_user_by_id),
    http.post("/users", [auth, create_user])
  ]
}

// Start server (blocking)
http.server(8000, config)
```

**Features:**

- ✅ Path parameters (`:id`, `:slug`)
- ✅ Query string parsing (`req.query`)
- ✅ Global middleware (runs for all routes)
- ✅ Per-route middleware (e.g., auth)
- ✅ Request object: `{method, path, body, headers, params, query}`
- ✅ Middleware can transform request or return early response

### File System (std:fs)

> **Note:** File I/O requires Deno runtime and only works via CLI
> (`deno run --allow-read --allow-write`), not in the browser playground.

Read, write, and manipulate files using the imported `fs` module.

```axiom
use "std:fs" as fs

// Reading files
content = await fs.read("data.txt")
lines = await fs.readLines("config.txt")
data = await fs.readJson("users.json")

// Writing files
await fs.write("output.txt", "Hello, Axiom!")
await fs.append("log.txt", "New entry\n")
await fs.writeJson("data.json", user_obj, 2)

// File operations
exists = await fs.exists("data.txt")
await fs.delete("temp.txt")

// Safe file operations
exists_check = await fs.exists("data.txt")
content = exists_check ? await fs.read("data.txt") : null

// Processing files
log_lines = await fs.readLines("app.log")
fn count_errors(lines_arr, i, count) {
  if (i >= len(lines_arr)) {
    return count
  }
  line = lines_arr[i]
  new_count = line.includes("ERROR") ? count + 1 : count
  return count_errors(lines_arr, i + 1, new_count)
}
error_count = count_errors(log_lines, 0, 0)
print("Found", error_count, "errors")
```

**Available Functions:**

- `fs.read(path)` - Read file as string, returns `Result<string>`
- `fs.write(path, content)` - Write string to file, returns `Result<null>`
- `fs.append(path, content)` - Append to file, returns `Result<null>`
- `fs.exists(path)` - Check if file exists, returns `Result<bool>`
- `fs.delete(path)` - Delete file, returns `Result<null>`
- `fs.readLines(path)` - Read file as array of lines, returns `Result<array>`
- `fs.readJson(path)` - Read and parse JSON file, returns `Result<object>`
- `fs.writeJson(path, data, indent?)` - Write object as JSON, returns `Result<null>`

## Built-in Functions

### Core Functions

- `print(...values)` - print values to stdout
- `len(array | string)` - get length
- `typeof value` - get runtime type

### Operators

- `?.` - optional chaining (safe property access, returns `null` if not found)
- `??` - nullish coalescing (default value for `null`, doesn't treat `0`/`false`/`""` as null)
- `?:` - ternary operator (conditional expression)

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

### Set

Efficient immutable set data structure (O(1) lookups with HAMT):

- `set()` - create empty set
- `set([...])` - create from array
- `.add(value)` - returns new set with value added
- `.delete(value)` - returns new set with value removed
- `.has(value)` - check if value exists (returns boolean)
- `.size()` - get number of elements
- `.union(other_set)` - combine two sets
- `.intersection(other_set)` - common elements
- `.difference(other_set)` - elements in first but not second
- `.toArray()` - convert to array

```axiom
tags = set(["javascript", "python", "rust"])
tags2 = tags.add("go")         // [javascript, python, rust, go]
has_rust = tags2.has("rust")   // true
```

### Map

Efficient immutable key-value map (O(1) lookups with HAMT):

- `map()` - create empty map
- `map({...})` - create from object
- `.set(key, value)` - returns new map with key-value pair
- `.get(key)` - get value for key (returns null if missing)
- `.delete(key)` - returns new map with key removed
- `.has(key)` - check if key exists (returns boolean)
- `.size()` - get number of entries
- `.keys()` - array of all keys
- `.values()` - array of all values
- `.entries()` - array of [key, value] pairs

```axiom
cache = map({user_1: "Alice", user_2: "Bob"})
cache2 = cache.set("user_3", "Carol")
user = cache2.get("user_1")    // "Alice"
```

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

### HTTP Client

- `http.fetch(url, options?)` - perform HTTP request

**Options:**

- `method` (string) - HTTP method (GET, POST, PUT, DELETE, PATCH). Defaults to "GET"
- `headers` (object) - request headers
- `body` (string) - request body

Returns `async Result<Response>` where:

- `Response` contains: `status` (int), `headers` (object), `body` (string), `json()` (async
  function)
- Network errors are captured in `Result.error`
- HTTP status codes (like 404) are part of the successful `Response`

### HTTP Server

- `http.get(path, handler | [handlers])` - define GET route
- `http.post(path, handler | [handlers])` - define POST route
- `http.put(path, handler | [handlers])` - define PUT route
- `http.patch(path, handler | [handlers])` - define PATCH route
- `http.delete(path, handler | [handlers])` - define DELETE route
- `http.server(port, config)` - start HTTP server (blocking)

**Config:**

- `middleware` - array of global middleware functions
- `routes` - array of route definitions (from `http.get`, `http.post`, etc.)

**Request object:**

- `method` - HTTP method string
- `path` - request path
- `body` - request body string
- `headers` - request headers object
- `params` - path parameters object (`:id` → `req.params.id`)
- `query` - query parameters object (`?foo=bar` → `req.query.foo`)

**Response object:**

- `status` - HTTP status code (defaults to 200)
- `headers` - response headers object (optional)
- `body` - response body string

## Development

```bash
# run tests (417 tests)
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
│   ├── std/            # standard library (array, string, set, map, schema, json, http)
│   ├── types/          # type checker & Result<T>
│   └── cli.ts          # CLI entrypoint
├── tests/              # test suites (417 tests)
├── examples/           # example programs
├── playground/         # web-based interactive playground
├── axiom-vscode/       # VSCode syntax highlighting extension
└── deno.json           # deno configuration
```

## Examples

See the `examples/` directory:

- `leetcode.ax` - LeetCode problem solutions
- `async-demo.ax` - async/await demonstration
- `http-demo.ax` - HTTP client with full CRUD operations
- `set-demo.ax` - Set data structure with use cases
- `map-demo.ax` - Map data structure with use cases
- `match-demo.ax` - pattern matching examples
- `modules/` - module system demonstration
- `graph-algorithms/` - graph traversal and pathfinding algorithms

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
- [x] Persistent data structures (Set, Map with HAMT)
- [x] Schema validation
- [x] Async/await
- [x] Web playground
- [x] VSCode extension
- [x] Module system
- [x] HTTP client
- [x] HTTP server (REST API)
- [x] Optional chaining (`?.`)
- [x] Nullish coalescing (`??`)
- [ ] REPL
- [ ] File I/O

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
