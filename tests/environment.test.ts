import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  BooleanValue,
  Environment,
  NumberValue,
  ReferenceError,
  RuntimeValue,
  StringValue,
  ValueType,
} from "@runtime";

// helper to create test values
function makeNumber(value: number): NumberValue {
  return { type: ValueType.NUMBER, value };
}

function makeString(value: string): StringValue {
  return { type: ValueType.STRING, value };
}

function makeBoolean(value: boolean): BooleanValue {
  return { type: ValueType.BOOLEAN, value };
}

Deno.test("Environment - Define and get variable", () => {
  const env = new Environment();
  const value = makeNumber(42);

  env.define("x", value);
  const result = env.get("x");

  assertEquals(result, value);
});

Deno.test("Environment - Get undefined variable throws ReferenceError", () => {
  const env = new Environment();

  assertThrows(
    () => {
      env.get("undefined_var");
    },
    ReferenceError,
    "Variable 'undefined_var' is not defined",
  );
});

Deno.test("Environment - Cannot redefine variable in same scope", () => {
  const env = new Environment();

  env.define("x", makeNumber(1));

  assertThrows(
    () => {
      env.define("x", makeNumber(2));
    },
    ReferenceError,
    "Variable 'x' is already defined in this scope",
  );
});

Deno.test("Environment - Child scope inherits from parent", () => {
  const parent = new Environment();
  parent.define("x", makeNumber(42));

  const child = new Environment(parent);
  const result = child.get("x");

  assertEquals(result.type, ValueType.NUMBER);
  assertEquals((result as any).value, 42);
});

Deno.test("Environment - Child scope can shadow parent variable", () => {
  const parent = new Environment();
  parent.define("x", makeNumber(42));

  const child = new Environment(parent);
  child.define("x", makeNumber(100));

  assertEquals((child.get("x") as any).value, 100);
  assertEquals((parent.get("x") as any).value, 42);
});

Deno.test("Environment - Extend creates child environment", () => {
  const parent = new Environment();
  parent.define("parent_var", makeString("parent"));

  const child = parent.extend();
  child.define("child_var", makeString("child"));

  assertEquals((child.get("parent_var") as any).value, "parent");
  assertEquals((child.get("child_var") as any).value, "child");

  assertThrows(() => {
    parent.get("child_var");
  }, ReferenceError);
});

Deno.test("Environment - Deep nesting works correctly", () => {
  const level1 = new Environment();
  level1.define("a", makeNumber(1));

  const level2 = level1.extend();
  level2.define("b", makeNumber(2));

  const level3 = level2.extend();
  level3.define("c", makeNumber(3));

  assertEquals((level3.get("a") as any).value, 1);
  assertEquals((level3.get("b") as any).value, 2);
  assertEquals((level3.get("c") as any).value, 3);
});

Deno.test("Environment - hasLocal checks only current scope", () => {
  const parent = new Environment();
  parent.define("parent_var", makeNumber(1));

  const child = parent.extend();
  child.define("child_var", makeNumber(2));

  assertEquals(child.hasLocal("child_var"), true);
  assertEquals(child.hasLocal("parent_var"), false);
});

Deno.test("Environment - has checks current and parent scopes", () => {
  const parent = new Environment();
  parent.define("parent_var", makeNumber(1));

  const child = parent.extend();
  child.define("child_var", makeNumber(2));

  assertEquals(child.has("child_var"), true);
  assertEquals(child.has("parent_var"), true);
  assertEquals(child.has("nonexistent"), false);
});

Deno.test("Environment - Multiple children don't interfere", () => {
  const parent = new Environment();
  parent.define("shared", makeNumber(0));

  const child1 = parent.extend();
  child1.define("x", makeNumber(1));

  const child2 = parent.extend();
  child2.define("y", makeNumber(2));

  assertEquals((child1.get("shared") as any).value, 0);
  assertEquals((child1.get("x") as any).value, 1);
  assertThrows(() => child1.get("y"), ReferenceError);

  assertEquals((child2.get("shared") as any).value, 0);
  assertEquals((child2.get("y") as any).value, 2);
  assertThrows(() => child2.get("x"), ReferenceError);
});

Deno.test("Environment - Can store different value types", () => {
  const env = new Environment();

  env.define("num", makeNumber(42));
  env.define("str", makeString("hello"));
  env.define("bool", makeBoolean(true));
  env.define("null_val", { type: ValueType.NULL });

  assertEquals((env.get("num") as any).value, 42);
  assertEquals((env.get("str") as any).value, "hello");
  assertEquals((env.get("bool") as any).value, true);
  assertEquals(env.get("null_val").type, ValueType.NULL);
});

Deno.test("Environment - snake_case variable names", () => {
  const env = new Environment();

  env.define("user_name", makeString("rahul"));
  env.define("user_age", makeNumber(21));
  env.define("is_active", makeBoolean(true));

  assertEquals((env.get("user_name") as any).value, "rahul");
  assertEquals((env.get("user_age") as any).value, 21);
  assertEquals((env.get("is_active") as any).value, true);
});
