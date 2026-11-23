import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { BooleanValue, Environment, NumberValue, StringValue, ValueType } from "@runtime";

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
  const test_env = new Environment();
  const test_value = makeNumber(42);

  const define_result = test_env.define("x", test_value);
  assertEquals(define_result.ok, true);

  const get_result = test_env.get("x");
  assertEquals(get_result.ok, true);
  if (get_result.ok) {
    assertEquals(get_result.value, test_value);
  }
});

Deno.test("Environment - Get undefined variable returns error", () => {
  const test_env = new Environment();

  const get_result = test_env.get("undefined_var");
  assertEquals(get_result.ok, false);
  if (!get_result.ok) {
    assertEquals(get_result.error.includes("undefined_var"), true);
    assertEquals(get_result.error.includes("ReferenceError"), true);
  }
});

Deno.test("Environment - Cannot redefine variable in same scope", () => {
  const test_env = new Environment();

  const first_define = test_env.define("x", makeNumber(1));
  assertEquals(first_define.ok, true);

  const second_define = test_env.define("x", makeNumber(2));
  assertEquals(second_define.ok, false);
  if (!second_define.ok) {
    assertEquals(second_define.error.includes("already defined"), true);
  }
});

Deno.test("Environment - Child scope inherits from parent", () => {
  const parent_env = new Environment();
  parent_env.define("x", makeNumber(42));

  const child_env = new Environment(parent_env);
  const get_result = child_env.get("x");

  assertEquals(get_result.ok, true);
  if (get_result.ok) {
    assertEquals(get_result.value.type, ValueType.NUMBER);
    assertEquals((get_result.value as NumberValue).value, 42);
  }
});

Deno.test("Environment - Child scope can shadow parent variable", () => {
  const parent_env = new Environment();
  parent_env.define("x", makeNumber(42));

  const child_env = new Environment(parent_env);
  child_env.define("x", makeNumber(100));

  const child_get = child_env.get("x");
  assertEquals(child_get.ok, true);
  if (child_get.ok) assertEquals((child_get.value as NumberValue).value, 100);

  const parent_get = parent_env.get("x");
  assertEquals(parent_get.ok, true);
  if (parent_get.ok) assertEquals((parent_get.value as NumberValue).value, 42);
});

Deno.test("Environment - Extend creates child environment", () => {
  const parent_env = new Environment();
  parent_env.define("parent_var", makeString("parent"));

  const child_env = parent_env.extend();
  child_env.define("child_var", makeString("child"));

  const parent_get = child_env.get("parent_var");
  assertEquals(parent_get.ok, true);
  if (parent_get.ok) assertEquals((parent_get.value as StringValue).value, "parent");

  const child_get = child_env.get("child_var");
  assertEquals(child_get.ok, true);
  if (child_get.ok) assertEquals((child_get.value as StringValue).value, "child");

  const missing_get = parent_env.get("child_var");
  assertEquals(missing_get.ok, false);
});

Deno.test("Environment - Deep nesting works correctly", () => {
  const level1_env = new Environment();
  level1_env.define("a", makeNumber(1));

  const level2_env = level1_env.extend();
  level2_env.define("b", makeNumber(2));

  const level3_env = level2_env.extend();
  level3_env.define("c", makeNumber(3));

  const get_a = level3_env.get("a");
  assertEquals(get_a.ok && (get_a.value as NumberValue).value, 1);

  const get_b = level3_env.get("b");
  assertEquals(get_b.ok && (get_b.value as NumberValue).value, 2);

  const get_c = level3_env.get("c");
  assertEquals(get_c.ok && (get_c.value as NumberValue).value, 3);
});

Deno.test("Environment - hasLocal checks only current scope", () => {
  const parent_env = new Environment();
  parent_env.define("parent_var", makeNumber(1));

  const child_env = parent_env.extend();
  child_env.define("child_var", makeNumber(2));

  assertEquals(child_env.hasLocal("child_var"), true);
  assertEquals(child_env.hasLocal("parent_var"), false);
});

Deno.test("Environment - has checks current and parent scopes", () => {
  const parent_env = new Environment();
  parent_env.define("parent_var", makeNumber(1));

  const child_env = parent_env.extend();
  child_env.define("child_var", makeNumber(2));

  assertEquals(child_env.has("child_var"), true);
  assertEquals(child_env.has("parent_var"), true);
  assertEquals(child_env.has("nonexistent"), false);
});

Deno.test("Environment - Multiple children don't interfere", () => {
  const parent_env = new Environment();
  parent_env.define("shared", makeNumber(0));

  const child1_env = parent_env.extend();
  child1_env.define("x", makeNumber(1));

  const child2_env = parent_env.extend();
  child2_env.define("y", makeNumber(2));

  const child1_shared = child1_env.get("shared");
  assertEquals(child1_shared.ok && (child1_shared.value as NumberValue).value, 0);

  const child1_x = child1_env.get("x");
  assertEquals(child1_x.ok && (child1_x.value as NumberValue).value, 1);

  const child1_y = child1_env.get("y");
  assertEquals(child1_y.ok, false);

  const child2_shared = child2_env.get("shared");
  assertEquals(child2_shared.ok && (child2_shared.value as NumberValue).value, 0);

  const child2_y = child2_env.get("y");
  assertEquals(child2_y.ok && (child2_y.value as NumberValue).value, 2);

  const child2_x = child2_env.get("x");
  assertEquals(child2_x.ok, false);
});

Deno.test("Environment - Can store different value types", () => {
  const test_env = new Environment();

  test_env.define("num", makeNumber(42));
  test_env.define("str", makeString("hello"));
  test_env.define("bool", makeBoolean(true));
  test_env.define("null_val", { type: ValueType.NULL });

  const get_num = test_env.get("num");
  assertEquals(get_num.ok && (get_num.value as NumberValue).value, 42);

  const get_str = test_env.get("str");
  assertEquals(get_str.ok && (get_str.value as StringValue).value, "hello");

  const get_bool = test_env.get("bool");
  assertEquals(get_bool.ok && (get_bool.value as BooleanValue).value, true);

  const get_null = test_env.get("null_val");
  assertEquals(get_null.ok && get_null.value.type, ValueType.NULL);
});

Deno.test("Environment - snake_case variable names", () => {
  const test_env = new Environment();

  test_env.define("user_name", makeString("rahul"));
  test_env.define("user_age", makeNumber(21));
  test_env.define("is_active", makeBoolean(true));

  const get_name = test_env.get("user_name");
  assertEquals(get_name.ok && (get_name.value as StringValue).value, "rahul");

  const get_age = test_env.get("user_age");
  assertEquals(get_age.ok && (get_age.value as NumberValue).value, 21);

  const get_active = test_env.get("is_active");
  assertEquals(get_active.ok && (get_active.value as BooleanValue).value, true);
});
