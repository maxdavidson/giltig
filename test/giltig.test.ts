import assert from "node:assert/strict";
import test from "node:test";

import {
  is,
  isAllOf,
  isAnyOf,
  isArrayOf,
  isBigInt,
  isBoolean,
  isInstanceOf,
  isNumber,
  isObjectOf,
  isOptionalOf,
  isShapeOf,
  isStrictlyOptionalOf,
  isString,
  isSymbol,
  isTupleOf,
  isUnknown,
  type TypePredicate,
} from "giltig";

await test("is", () => {
  const isFoo = is("foo");
  isFoo satisfies TypePredicate<"foo">;
  assert.ok(isFoo("foo"));
  assert.ok(!isFoo(new String("foo")));
  assert.ok(!isFoo("bar"));

  const isFive = is(5);
  isFive satisfies TypePredicate<5>;
  assert.ok(isFive(5));
  assert.ok(!isFive(new Number(5)));
  assert.ok(!isFive("5"));

  const isNaN = is(NaN);
  assert.ok(isNaN(NaN));
  assert.ok(!isNaN("NaN"));
});

await test("isString", () => {
  assert.ok(isString("hello world"));

  assert.ok(!isString(new String("hello world")));
  assert.ok(!isString(5));
  assert.ok(!isString(undefined));
  assert.ok(!isString(null));
});

await test("isNumber", () => {
  assert.ok(isNumber(10));
  assert.ok(isNumber(Infinity));
  assert.ok(isNumber(NaN));
  assert.ok(isNumber(Number.MAX_VALUE));

  assert.ok(!isNumber("what"));
  assert.ok(!isNumber(undefined));
  assert.ok(!isNumber({}));
  assert.ok(!isNumber(null));
});

await test("isBigInt", () => {
  assert.ok(isBigInt(10n));
  assert.ok(isBigInt(BigInt(10)));
  assert.ok(isBigInt(BigInt("0x101010")));

  assert.ok(!isBigInt("what"));
  assert.ok(!isBigInt(undefined));
  assert.ok(!isBigInt({}));
  assert.ok(!isBigInt(null));
});

await test("isSymbol", () => {
  assert.ok(isSymbol(Symbol()));
  assert.ok(isSymbol(Symbol.for("hello")));
  assert.ok(isSymbol(Symbol.iterator));

  assert.ok(!isSymbol("what"));
  assert.ok(!isSymbol(undefined));
  assert.ok(!isSymbol({}));
  assert.ok(!isSymbol(null));
});

await test("isArrayOf", () => {
  const predicate = isArrayOf(isString);

  assert.ok(predicate([]));
  assert.ok(predicate(["hello"]));
  assert.ok(predicate(["hello", "world"]));

  assert.ok(!predicate(null));
  assert.ok(!predicate([23]));
  assert.ok(!predicate(["hello", 3]));
});

await test("isTupleOf", () => {
  const predicate = isTupleOf(isString, isNumber, isBoolean);

  assert.ok(predicate(["hello", 42, true]));
  assert.ok(predicate(["world", 32, false]));
  assert.ok(predicate(["world", 32, false]));

  assert.ok(!predicate(null));
  assert.ok(!predicate([23]));
  assert.ok(!predicate(["hello", 3, true, "222"]));
});

await test("isObjectOf", () => {
  const predicate = isObjectOf(isString);

  assert.ok(!predicate({ string: "hello", number: 42, boolean: true }));

  assert.ok(!predicate(["hello", 3, true, "222"]));
  assert.ok(!predicate(null));
  assert.ok(predicate({}));
});

await test("isInstanceOf", () => {
  abstract class Animal {}
  class Dog extends Animal {}

  const isAnimal = isInstanceOf(Animal);
  const isDog = isInstanceOf(Dog);
  assert.ok(isAnimal(new Dog()));
  assert.ok(isDog(new Dog()));
});

await test("isShapeOf", async () => {
  const predicate = isShapeOf({
    string: isString,
    number: isNumber,
    boolean: isBoolean,
  });

  assert.ok(predicate({ string: "hello", number: 42, boolean: true }));
  assert.ok(!predicate({ string: null, number: false, boolean: "33" }));

  assert.ok(!predicate(["hello", 3, true, "222"]));
  assert.ok(!predicate(null));
  assert.ok(!predicate({}));
});

await test("isAnyOf", () => {
  const isStringOrNumber = isAnyOf(isString, isNumber);

  assert.ok(isStringOrNumber(42));
  assert.ok(isStringOrNumber("hello"));

  assert.ok(!isStringOrNumber(undefined));
  assert.ok(!isStringOrNumber(73n));
});

await test("isAllOf", () => {
  const isA = isShapeOf({ a: isString });
  const isB = isShapeOf({ b: isString });
  const isAandB = isAllOf(isA, isB);

  assert.ok(isAandB({ a: "hello", b: "world" }));
  assert.ok(isAandB({ a: "hello", b: "world", c: "extra" }));

  assert.ok(!isAandB(undefined));
  assert.ok(!isAandB({}));
  assert.ok(!isAandB({ a: "hello" }));
  assert.ok(!isAandB({ b: "world" }));
});

await test("isOptionalOf", () => {
  interface TestedType {
    string: string;
    number?: number;
    boolean?: boolean | undefined;
  }

  const isTestedType = isShapeOf<TestedType>({
    string: isString,
    number: isStrictlyOptionalOf(isNumber),
    boolean: isOptionalOf(isBoolean),
  }) satisfies TypePredicate<TestedType>;

  isShapeOf<TestedType>({
    string: isString,
    number: isStrictlyOptionalOf(isNumber),
    boolean: isOptionalOf(isBoolean),
  } as const) satisfies TypePredicate<TestedType>;

  isShapeOf({
    string: isString,
    number: isStrictlyOptionalOf(isNumber),
    boolean: isOptionalOf(isBoolean),
  }) satisfies TypePredicate<TestedType>;

  isShapeOf({
    string: isString,
    number: isStrictlyOptionalOf(isNumber),
    boolean: isOptionalOf(isBoolean),
  } as const) satisfies TypePredicate<TestedType>;

  {
    const shape = {
      string: isString,
      number: isStrictlyOptionalOf(isNumber),
      boolean: isOptionalOf(isBoolean),
    };

    isShapeOf(shape) satisfies TypePredicate<TestedType>;
    isShapeOf<TestedType>(shape) satisfies TypePredicate<TestedType>;
  }

  {
    const shape = {
      string: isString,
      number: isStrictlyOptionalOf(isNumber),
      boolean: isOptionalOf(isBoolean),
    } as const;

    isShapeOf(shape) satisfies TypePredicate<TestedType>;
    isShapeOf<TestedType>(shape) satisfies TypePredicate<TestedType>;
  }

  isShapeOf<TestedType>({
    // @ts-expect-error - incorrect type
    string: isUnknown,
    // @ts-expect-error - missing optional
    number: isNumber,
    // @ts-expect-error - incorrect type + missing optional
    boolean: isUnknown,
  });

  isShapeOf<TestedType>({
    // @ts-expect-error - incorrect type
    string: isUnknown,
    // @ts-expect-error - missing optional
    number: isNumber,
    // @ts-expect-error - incorrect type + missing optional
    boolean: isUnknown,
  } as const);

  assert.ok(isTestedType({ string: "hello" }));
  assert.ok(isTestedType({ string: "hello", number: 42 }));
  assert.ok(isTestedType({ string: "hello", number: 42, boolean: true }));
  // optional fields may be undefined if allowed by the predicate
  assert.ok(isTestedType({ string: "hello", number: 42, boolean: undefined }));
  // extra fields are always ok
  assert.ok(
    isTestedType({
      string: "hello",
      number: 42,
      boolean: undefined,
      extra: null,
    }),
  );

  // optional fields must not be undefined (strictly optional)
  assert.ok(!isTestedType({ string: "hello", number: undefined }));
  assert.ok(!isTestedType({ string: "hello", number: "42" }));
});
