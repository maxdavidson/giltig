export type TypePredicate<T> = (value: unknown) => value is T;

type Primitive = string | number | boolean | null | undefined | symbol | bigint;
type UnknownObject = { [_ in keyof any]?: unknown };
type UnknownFunction = (...args: any[]) => unknown;
type UnknownConstructor = new (...args: any[]) => unknown;

// @ts-ignore
export function isUnknown(value: unknown): value is unknown {
  return true;
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isSymbol(value: unknown): value is symbol {
  return typeof value === 'symbol';
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isBigInt(value: unknown): value is bigint {
  return typeof value === 'bigint';
}

export function isFunction(value: unknown): value is UnknownFunction {
  return typeof value === 'function';
}

export function isObject(value: unknown): value is UnknownObject {
  return typeof value === 'object' && value !== null;
}

export function is<T extends Primitive>(something: T): (value: unknown) => value is T;
export function is<T>(something: T): (value: unknown) => value is T;
export function is(something: unknown) {
  return (value: unknown) => Object.is(value, something);
}

function applyEither<T, U>(this: T, fn: (value: T) => U) {
  return fn(this);
}

function applyTuple<T>(this: unknown[], predicate: TypePredicate<T>, index: number) {
  return predicate(this[index]);
}

function applyObject<T>(this: UnknownObject, [key, predicate]: [keyof T, TypePredicate<keyof T>]) {
  return predicate(this[key]);
}

export function isEither<T extends unknown[]>(...predicates: { [K in keyof T]: TypePredicate<T[K]> }) {
  return (value: unknown): value is T[number] => predicates.some(applyEither, value);
}

export function isTupleOf<T extends unknown[]>(...predicates: { [K in keyof T]: TypePredicate<T[K]> }) {
  return (value: unknown): value is T =>
    Array.isArray(value) && value.length === predicates.length && predicates.every(applyTuple, value);
}

export function isArrayOf<T>(predicate: TypePredicate<T>) {
  return (value: unknown): value is T[] => Array.isArray(value) && value.every(predicate);
}

export function isObjectOf<T extends UnknownObject>(shape: { [K in keyof T]: TypePredicate<T[K]> }) {
  const entries: Array<[keyof T, TypePredicate<keyof T>]> = Object.entries(shape) as any;
  return (value: unknown): value is T => isObject(value) && entries.every(applyObject, value);
}

export function isInstanceOf<T extends UnknownConstructor>(constructor: T) {
  return (value: unknown): value is InstanceType<T> => value instanceof constructor;
}
