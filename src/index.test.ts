import { isArrayOf, isBoolean, isNumber, isObjectOf, isString, isSymbol, isTupleOf, isInstanceOf } from '.';

test('isString', () => {
  expect(isString('hello world')).toBe(true);

  expect(isString(5)).toBe(false);
  expect(isString(undefined)).toBe(false);
  expect(isString(null)).toBe(false);
});

test('isNumber', () => {
  expect(isNumber(10)).toBe(true);
  expect(isNumber(Infinity)).toBe(true);
  expect(isNumber(NaN)).toBe(true);
  expect(isNumber(Number.MAX_VALUE)).toBe(true);

  expect(isNumber('what')).toBe(false);
  expect(isNumber(undefined)).toBe(false);
  expect(isNumber({})).toBe(false);
  expect(isNumber(null)).toBe(false);
});

test('isSymbol', () => {
  expect(isSymbol(Symbol())).toBe(true);
  expect(isSymbol(Symbol.for('hello'))).toBe(true);
  expect(isSymbol(Symbol.iterator)).toBe(true);

  expect(isSymbol('what')).toBe(false);
  expect(isSymbol(undefined)).toBe(false);
  expect(isSymbol({})).toBe(false);
  expect(isSymbol(null)).toBe(false);
});

test('isArrayOf', () => {
  const predicate = isArrayOf(isString);

  expect(predicate([])).toBe(true);
  expect(predicate(['hello'])).toBe(true);
  expect(predicate(['hello', 'world'])).toBe(true);

  expect(predicate(null)).toBe(false);
  expect(predicate([23])).toBe(false);
  expect(predicate(['hello', 3])).toBe(false);
});

test('isTupleOf', () => {
  const predicate = isTupleOf(isString, isNumber, isBoolean);

  expect(predicate(['hello', 42, true])).toBe(true);
  expect(predicate(['world', 32, false])).toBe(true);

  expect(predicate(null)).toBe(false);
  expect(predicate([23])).toBe(false);
  expect(predicate(['hello', 3, true, '222'])).toBe(false);
});

test('isObjectOf', () => {
  const predicate = isObjectOf({
    string: isString,
    number: isNumber,
    boolean: isBoolean,
  });

  expect(predicate({ string: 'hello', number: 42, boolean: true })).toBe(true);

  expect(predicate(['hello', 3, true, '222'])).toBe(false);
  expect(predicate(null)).toBe(false);
  expect(predicate({})).toBe(false);
});

test('isInstanceOf', () => {
  class Butt {}
  const predicate = isInstanceOf(Butt);
  expect(predicate(new Butt())).toBe(true);
});
