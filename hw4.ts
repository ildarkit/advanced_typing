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
type R2 = FilterTuple<[1, number, string], 1>; // [number, string]

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

// 3. spread
type Spread<T, U> = ;

type R4 = Spread<{name: string}, {name: number}>; // { name: number }
type R5 = Spread<{name: string}, {name?: number }>; // { name: string | number | undefined }
type R6 = Spread<{name?: string}, {name?: number }>; // { name?: string | number | undefined }

