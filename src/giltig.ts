type HasOwn = <Value extends NonNullable<unknown>, Key extends PropertyKey>(
  value: Value,
  key: Key,
) => value is Value & Record<Key, unknown>;

const hasOwn: HasOwn =
  (Object.hasOwn as HasOwn) ??
  Object.prototype.hasOwnProperty.call.bind(Object.prototype.hasOwnProperty);

const RAW_PREDICATES = new WeakMap<object, TypePredicate<any>>();

declare const OPTIONAL_TAG: unique symbol;

export interface TypePredicate<in out Type> {
  (value: unknown): value is Type;
  [OPTIONAL_TAG]?: false;
}

export interface OptionalTypePredicate<in out Type> {
  (value: unknown): value is Type | undefined;
  [OPTIONAL_TAG]?: true;
}

export const isString: TypePredicate<string> = (
  value: unknown,
): value is string => typeof value === "string";

export const isNumber: TypePredicate<number> = (
  value: unknown,
): value is number => typeof value === "number";

export const isBigInt: TypePredicate<bigint> = (
  value: unknown,
): value is bigint => typeof value === "bigint";

export const isSymbol: TypePredicate<symbol> = (
  value: unknown,
): value is symbol => typeof value === "symbol";

export const isBoolean: TypePredicate<boolean> = (
  value: unknown,
): value is boolean => typeof value === "boolean";

export const isUndefined: TypePredicate<undefined> = (
  value: unknown,
): value is undefined => value === undefined;

export const isNull: TypePredicate<null> = (value: unknown): value is null =>
  value === null;

export const isUnknown: TypePredicate<unknown> = (
  // @ts-ignore - not used, but we need it
  value: unknown,
): value is unknown => true;

export const isArray: TypePredicate<unknown[]> = Array.isArray;

export const isObject: TypePredicate<object> = (
  value: unknown,
): value is object => typeof value === "object" && value !== null;

export function isReadonlyOf<Type extends object>(
  predicate: TypePredicate<Type>,
): TypePredicate<Readonly<Type>> {
  return predicate;
}

export function is<const Constant>(
  constant: Constant,
): TypePredicate<Constant> {
  return (value: unknown): value is Constant => Object.is(value, constant);
}

export function isInstanceOf<Type>(
  constructor: abstract new (...args: readonly any[]) => Type,
): TypePredicate<Type> {
  return (value: unknown): value is Type => value instanceof constructor;
}

export type InferType<Predicate extends (value: unknown) => value is any> =
  Predicate extends (value: unknown) => value is infer Type ? Type : never;

type HasExactOptionalPropertyTypes = Required<{
  a?: string | undefined;
}>["a"] extends string
  ? false
  : true;

type MaybeOptional<Type> = HasExactOptionalPropertyTypes extends true
  ? Type
  : Type | undefined;

export function isStrictlyOptionalOf<Type>(
  predicate: TypePredicate<MaybeOptional<Type>>,
): OptionalTypePredicate<MaybeOptional<Type>> {
  const optionalPredicate = (value: unknown): value is Type | undefined =>
    value === undefined || predicate(value);
  RAW_PREDICATES.set(optionalPredicate, predicate);
  return optionalPredicate;
}

export function isOptionalOf<Type>(
  predicate: TypePredicate<Type>,
): OptionalTypePredicate<Type | undefined> {
  return isStrictlyOptionalOf(isAnyOf(isUndefined, predicate));
}

type TuplePredicates<in out Types extends readonly unknown[]> = {
  readonly [Index in keyof Types]: TypePredicate<Types[Index]>;
};

type Union<Types extends readonly unknown[]> = Types[number];

export function isAnyOf<Types extends readonly unknown[]>(
  ...predicates: TuplePredicates<Types>
): TypePredicate<Union<Types>> {
  return (value: unknown): value is Union<Types> => {
    for (const predicate of predicates) {
      if (predicate(value)) {
        return true;
      }
    }

    return false;
  };
}

type Intersection<
  Types extends readonly unknown[],
  Acc = unknown,
> = Types extends readonly [...infer Start, infer End]
  ? Intersection<Start, End & Acc>
  : Types extends readonly []
  ? Acc
  : Types[number];

export function isAllOf<Types extends readonly unknown[]>(
  ...predicates: TuplePredicates<Types>
): TypePredicate<Intersection<Types>> {
  return (value: unknown): value is Intersection<Types> => {
    for (const predicate of predicates) {
      if (!predicate(value)) {
        return false;
      }
    }

    return true;
  };
}

export function isTupleOf<Types extends readonly unknown[]>(
  ...tuplePredicates: TuplePredicates<Types>
): TypePredicate<Types> {
  return (value: unknown): value is Types => {
    if (!isArray(value) || value.length !== tuplePredicates.length) {
      return false;
    }

    for (let i = 0; i < tuplePredicates.length; i += 1) {
      if (!tuplePredicates[i]!(value[i])) {
        return false;
      }
    }

    return true;
  };
}

export function isArrayOf<Type>(
  itemPredicate: TypePredicate<Type>,
): TypePredicate<Type[]> {
  return (value: unknown): value is Type[] => {
    if (!isArray(value)) {
      return false;
    }

    for (const item of value) {
      if (!itemPredicate(item)) {
        return false;
      }
    }

    return true;
  };
}

export type ObjectOf<Type> = object & Record<string | number, Type>;

export function isObjectOf<Type>(
  valuePredicate: TypePredicate<Type>,
): TypePredicate<ObjectOf<Type>> {
  return (value: unknown): value is ObjectOf<Type> => {
    if (!isObject(value)) {
      return false;
    }

    for (const key in value) {
      if (!hasOwn(value, key) || !valuePredicate(value[key])) {
        return false;
      }
    }

    return true;
  };
}

type Flatten<Type> = Type extends unknown
  ? { [Prop in keyof Type]: Type[Prop] }
  : never;

interface ShapePredicatesLoose {
  readonly [key: string]: (value: unknown) => any;
}

// prettier-ignore
type InferTypeFromShape<Shape extends ShapePredicatesLoose> = Flatten<
  {
    -readonly [Prop in keyof Shape as Shape[Prop] extends OptionalTypePredicate<any> ? never : Prop]-?: Shape[Prop] extends TypePredicate<infer T> ? T : never;
  } & {
    -readonly [Prop in keyof Shape as Shape[Prop] extends OptionalTypePredicate<any> ? Prop : never]+?: Shape[Prop] extends OptionalTypePredicate<infer T> ? T : never;
  }
>;

export type ShapePredicates<in out Type extends object> = {
  readonly [Prop in keyof Type]-?: Pick<Type, never> extends Pick<Type, Prop>
    ? OptionalTypePredicate<
        HasExactOptionalPropertyTypes extends true
          ? Required<Type>[Prop]
          : Type[Prop]
      >
    : TypePredicate<Required<Type>[Prop]>;
};

export function isShapeOf<const Shape extends ShapePredicatesLoose>(
  shapePredicates: Shape,
): TypePredicate<InferTypeFromShape<Shape>>;

export function isShapeOf<Type extends object>(
  shapePredicates: ShapePredicates<Type>,
): TypePredicate<Type>;

export function isShapeOf<Type extends object>(
  shapePredicates: ShapePredicates<Type>,
): TypePredicate<Type> {
  const fieldPredicates = Object.entries<TypePredicate<any>>(
    // @ts-expect-error
    shapePredicates,
  ).map(([key, predicate]): ((value: NonNullable<unknown>) => boolean) => {
    const rawPredicate = RAW_PREDICATES.get(predicate);
    if (rawPredicate !== undefined) {
      return (value) => !hasOwn(value, key) || rawPredicate(value[key]);
    } else {
      return (value) => hasOwn(value, key) && predicate(value[key]);
    }
  });

  return (value: unknown): value is Type => {
    if (value === undefined || value === null) {
      return false;
    }

    for (const fieldPredicate of fieldPredicates) {
      if (!fieldPredicate(value)) {
        return false;
      }
    }

    return true;
  };
}
