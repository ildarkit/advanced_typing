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

// 3. spread
export type RequiredKeysOf<BaseType extends object> = Exclude<{
	[Key in keyof BaseType]: BaseType extends Record<Key, BaseType[Key]>
		? Key
		: never
}[keyof BaseType], undefined>;

export type OptionalKeysOf<BaseType extends object> = Exclude<{
	[Key in keyof BaseType]: BaseType extends Record<Key, BaseType[Key]>
		? never
		: Key
}[keyof BaseType], undefined>;

type Spread<T extends object, U extends object> = {
  [K in keyof (T & U)]: RequiredKeysOf<T> extends OptionalKeysOf<U>
    ? T[K & keyof T] | U[K & keyof U]
    : OptionalKeysOf<T> extends RequiredKeysOf<U>
      ? T[K & keyof T] | U[K & keyof U] : T[K & keyof T];
};

type R4 = Spread<{name: string}, {name: number}>; // { name: number }
//  ^?
type R5 = Spread<{name: string}, {name?: number }>; // { name: string | number | undefined }
//  ^?
type R6 = Spread<{name?: string; key: string}, {name: number }>; // { name: string | number | undefined; key: string }
//  ^?
type R7 = Spread<{name?: string}, {name?: number }>; // { name?: string | number | undefined }
//  ^?
type R8 = Spread<{name?: string}, {name: number; key?: string }>; // { name: string | number | undefined; key?: string | undefined }
//  ^?
