// 1. isEqual
type IsEqual<A, B> =
	(<G>() => G extends A & G | G ? 1 : 2) extends
	(<G>() => G extends B & G | G ? 1 : 2)
		? true
		: false;

type FilterTuple<T, V> = 
  T extends [infer F, ...infer R] 
    ? IsEqual<F, V> extends true
     ? FilterTuple<R, V>
     : [F, ...FilterTuple<R, V>]
    : T;

type R1 = FilterTuple<[1, number, string], number>; // [1, string]
//  ^?
type R2 = FilterTuple<[1, number, string], 1>; // [number, string]
//  ^?

// 2. tuplify union
export type IsNever<T> = [T] extends [never] ? true : false;
type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;

// Хак компилятора
type LastOf<T> =
  UnionToIntersection<T extends unknown ? () => T : never> extends () => (infer R) ? R : never;

type TuplifyUnion<T, L = LastOf<T>> =
  IsNever<T> extends true ? [] 
  : [...TuplifyUnion<Exclude<T, L>>, L];

// cast
type Cast<A, B> = A extends B ? A : B
type Push<A, V> = [...Cast<A, unknown[]>, V];

type ObjectToTuple<T, R = []> = 
  TuplifyUnion<keyof T> extends [infer K extends keyof T, ...unknown[]]
    ? ObjectToTuple<Omit<T, K>, Push<R, [K, T[K]]>>
    : R;

type R3 = ObjectToTuple<{name: string, value: string}>; // [['name', string], ['value', string]]
//  ^?

// 3. OptionalToUndefined
// С помощью утилиты OptionalKeysOf допишите утилиту так что бы опциональные поля изначального объекта стали обязательными полями
// но объединёнными с undefined. Обязательные поля изначального объекта оставьте без изменений

export type OptionalKeysOf<BaseType extends object> = Exclude<{
	[Key in keyof BaseType]: BaseType extends Record<Key, BaseType[Key]>
		? never
		: Key
}[keyof BaseType], undefined>;

type OptionalToUndefined<T extends object> = {
  [K in keyof T | OptionalKeysOf<T>]-?:
    K extends OptionalKeysOf<T>
      ? T[K] | undefined
      : T[K];
};

type R = OptionalToUndefined<{ value: string, name?: string }> // { value: string, name: string | undefined }

// Дополнительное задание со *
// 4. spread
export type RequiredKeysOf<BaseType extends object> = Exclude<{
	[Key in keyof BaseType]: BaseType extends Record<Key, BaseType[Key]>
		? Key
		: never
}[keyof BaseType], undefined>;

export type Simplify<T> = {[KeyType in keyof T]: T[KeyType]} & {};

type Spread<T extends object, U extends object> = Simplify<{
  // only required
  [K in RequiredKeysOf<T> | RequiredKeysOf<U> as K extends OptionalKeysOf<U> ? never : K]:
    K extends RequiredKeysOf<U>
      ? U[K]
      : T[K & keyof T];
} & {
  // optional U | required T
  [K in OptionalKeysOf<U> as K extends RequiredKeysOf<T> ? K : never]:
    T[K & keyof T] | U[K & keyof U];
} & {
  // only optional
  [K in OptionalKeysOf<T> | OptionalKeysOf<U> as K extends RequiredKeysOf<T> | RequiredKeysOf<U> ? never : K]?:
    T[K & keyof T] | U[K & keyof U]; 
}>;

type R4 = Spread<{name: string; key?: string}, {name: number; key: string}>; // { name: number; key: string }
//  ^?
type R5 = Spread<{name: string}, {name?: number }>; // { name: string | number | undefined }
//  ^?
type R6 = Spread<{name?: string; key: string}, {name: number }>; // { name: number; key: string }
//  ^?
type R7 = Spread<{name?: string}, {name?: number }>; // { name?: string | number | undefined }
//  ^?
type R8 = Spread<{name?: string}, {name: number; key?: string }>; // { name: number; key?: string | undefined }
//  ^?
type R9 = Spread<{name: string; app: number}, {name: number; key: string}>;
//  ^?
