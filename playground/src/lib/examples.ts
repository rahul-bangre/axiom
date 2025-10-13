export interface Example {
  name: string;
  code?: string;
  files?: Record<string, string>;
}

export const examples: Example[] = [
  {
    name: "Blank",
    code: `// welcome to axiom!\n`,
  },
  {
    name: "Hello World",
    code: `// welcome to axiom!
print("Hello, World!")

name = "Axiom"
print("Language:", name)`,
  },
  {
    name: "Factorial (Recursion)",
    code: `// factorial using recursion
fn factorial(n) {
  if (n <= 1) {
    return 1
  }
  return n * factorial(n - 1)
}

print("factorial(5) =", factorial(5))
print("factorial(10) =", factorial(10))`,
  },
  {
    name: "Array Methods",
    code: `// functional array operations
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

doubled = numbers.map((n) => n * 2)
print("Doubled:", doubled)

evens = numbers.filter((n) => n % 2 == 0)
print("Evens:", evens)

sum = numbers.reduce((acc, n) => acc + n, 0)
print("Sum:", sum)

first_large = numbers.find((n) => n > 5)
print("First > 5:", first_large)`,
  },
  {
    name: "Lambda Functions",
    code: `// lambda expressions and closures
add = (a, b) => a + b
print("add(5, 3) =", add(5, 3))

// closure example
fn makeMultiplier(factor) {
  return (n) => n * factor
}

times3 = makeMultiplier(3)
times5 = makeMultiplier(5)

print("times3(7) =", times3(7))
print("times5(7) =", times5(7))

// currying
curry = (x) => (y) => x + y
add10 = curry(10)
print("add10(5) =", add10(5))`,
  },
  {
    name: "String Methods",
    code: `// string manipulation
text = "  Hello World From Axiom  "

print("Original:", text)
print("Trimmed:", text.trim())
print("Uppercase:", text.toUpperCase())
print("Lowercase:", text.toLowerCase())

words = "hello,world,axiom".split(",")
print("Split:", words)

joined = words.join(" - ")
print("Joined:", joined)

replaced = "hello hello".replaceAll("hello", "hi")
print("Replaced:", replaced)`,
  },
  {
    name: "Schema Validation",
    code: `// runtime schema validation
UserSchema = schema.object({
  name: schema.string().min(3),
  age: schema.number().min(18),
  email: schema.string()
})

user = {
  name: "Alice",
  age: 25,
  email: "alice@example.com"
}

validated = UserSchema.parse(user)
print("Valid user:", validated.name)

// schema extension
AdminUser = UserSchema.extend({
  role: schema.string(),
  permissions: schema.array(schema.string())
})

admin = {
  name: "Bob",
  age: 30,
  email: "bob@example.com",
  role: "admin",
  permissions: ["read", "write", "delete"]
}

validated_admin = AdminUser.parse(admin)
print("Admin role:", validated_admin.role)`,
  },
  {
    name: "Two Sum Problem",
    code: `// leetcode: two sum
fn twoSum(nums, target) {
  fn helper(i) {
    if (i >= len(nums)) {
      return null
    }
    
    current = nums[i]
    remaining = target - current
    
    rest = nums.slice(i + 1, len(nums))
    found_index = rest.findIndex((n) => n == remaining)
    
    if (found_index != -1) {
      return [i, i + 1 + found_index]
    }
    
    return helper(i + 1)
  }
  
  return helper(0)
}

result = twoSum([2, 7, 11, 15], 9)
print("Indices:", result)
print("Values:", result[0], "+", result[1], "= 9")`,
  },
  {
    name: "FizzBuzz",
    code: `// classic fizzbuzz with pattern matching
fn fizzbuzz(n) {
  fn helper(i) {
    if (i > n) {
      return null
    }
    
    div_by_3 = i % 3 == 0
    div_by_5 = i % 5 == 0
    
    output = match(true,
      div_by_3 && div_by_5 -> "fizzbuzz",
      div_by_3 -> "fizz",
      div_by_5 -> "buzz",
      default -> i
    )
    
    print(output)
    return helper(i + 1)
  }
  
  return helper(1)
}

fizzbuzz(20)`,
  },
  {
    name: "Module System",
    files: {
      "main.ax": `// importing from other modules
use "./math.ax" exposing { add, multiply }
use "./utils.ax" as utils

print("=== Module System Demo ===")

x = 5
y = 10

sum = add(x, y)
product = multiply(x, y)

print("add(5, 10) =", sum)
print("multiply(5, 10) =", product)

greeting = utils.greet("Axiom")
print(greeting)

doubled = utils.double(sum)
print("double(sum) =", doubled)`,
      "math.ax": `// math utility functions
export fn add(a, b) {
  return a + b
}

export fn multiply(a, b) {
  return a * b
}

export fn power(base, exp) {
  if (exp == 0) {
    return 1
  }
  return base * power(base, exp - 1)
}`,
      "utils.ax": `// general utility functions
use "./math.ax" exposing { multiply }

export fn greet(name) {
  return "Hello, " + name + "!"
}

export fn double(n) {
  return multiply(n, 2)
}

export fn triple(n) {
  return multiply(n, 3)
}`,
    },
  },
];
