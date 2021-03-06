export type TypePredicate<T> = (value: unknown) => value is T;

export type PredicatedType<Predicate extends TypePredicate<unknown>> = Predicate extends TypePredicate<infer T>
  ? T
  : never;

type Primitive = string | number | boolean | null | undefined | symbol | bigint;

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

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function isObject(value: unknown): value is object {
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

export function isEither<T extends readonly unknown[]>(
  ...predicates: { readonly [K in keyof T]: TypePredicate<T[K]> }
) {
  return (value: unknown): value is T[number] => predicates.some(applyEither, value);
}

export function isOptional<T>(predicate: TypePredicate<T>) {
  return isEither(isUndefined, predicate);
}

function applyTuple<T>(this: unknown[], predicate: TypePredicate<T>, index: number) {
  return predicate(this[index]);
}

export function isTupleOf<T extends unknown[]>(...predicates: { readonly [K in keyof T]: TypePredicate<T[K]> }) {
  return (value: unknown): value is T =>
    Array.isArray(value) && value.length === predicates.length && predicates.every(applyTuple, value);
}

export function isArrayOf<T>(valuesPredicate: TypePredicate<T>) {
  return (value: unknown): value is T[] => Array.isArray(value) && value.every(valuesPredicate);
}

export function isObjectOf<T>(keysPredicate: TypePredicate<T>) {
  return (value: unknown): value is Record<keyof any, T> =>
    isObject(value) && Object.values(value).every(keysPredicate);
}

function applyObject<T extends object>(this: T, [key, predicate]: [keyof T, TypePredicate<keyof T>]) {
  return predicate(this[key]);
}

export function isShapeOf<T extends object>(shape: { readonly [K in keyof T]-?: TypePredicate<T[K]> }) {
  const entries: readonly [keyof T, TypePredicate<keyof T>][] = Object.entries(shape) as any;
  return (value: unknown): value is T => isObject(value) && entries.every(applyObject, value);
}

export function isInstanceOf<T extends new (...args: any) => any>(constructor: T) {
  return (value: unknown): value is InstanceType<T> => value instanceof constructor;
}
