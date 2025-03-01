// 1. keyof operator
type GetStringKeys<T> = string & (keyof T);

type R1 = GetStringKeys<{ 0: number, name: string, value: number  }>; // "name" | "value"

// 2. index access
type GetIdType<T extends { id: string | number }> = T["id" & keyof T];

type R2 = GetIdType<{ id: string, name: string }>; // string
type R3 = GetIdType<{ id: number }>; // number

// @ts-expect-error
type R4 = GetIdType<{ }>;

type ExtractValueFromKey<T extends { key: string }> = T[T["key"] & keyof T];

type R5 = ExtractValueFromKey<{ key: "value"; value: number }>; // number
type R6 = ExtractValueFromKey<{
  key: "value" | "name";
  value: number;
  name: string;
}>; // number | string

type R7 = ExtractValueFromKey<{ key: "value" }>; // never

// @ts-expect-error
type R8 = ExtractValueFromKey<{}>

// 3. type spread operator 
type Unshift<T extends readonly unknown[], U> = [U, ...T]; 

type R = Unshift<[number, string], boolean>; // [boolean, number, string]

// 4. template literal
type Getter<T> = `on${Capitalize<T & string>}`

type R9 = Getter<'create'> // 'onCreate'

// 5. conditional types
// Используйте условный оператор для преодоления ограничений на index accesss
type ExtractValueFromKey2<T> = T extends { key: string; [key: string]: unknown } ? T[T["key"]] : unknown;

type R10 = ExtractValueFromKey2<{ key: "value"; value: number }>; // number
type R11 = ExtractValueFromKey2<{
  key: "value" | "name";
  value: number;
  name: string;
}>; // number | string

type R12 = ExtractValueFromKey2<{ key: "value" }>; // unknown
type R13 = ExtractValueFromKey2<{}> // unknown

// 6. distributive conditional types
type MyExclude<T, U> = T extends U ? never : T;

type Result = MyExclude<'a' | 'b' | 'c', 'a'> // 'b' | 'c'

// задание

type Defined<T> = T extends Object ? T : never;

type Result1 = Defined<number | undefined | null> // number

// 7. infer
type MyParameters<T> = T extends (...args: unknown[]) => infer R ? R : never;
type GreetReturnType = MyParameters<() => string>; // string

type Shift<T> = T extends [unknown, ...infer R] ? R : never;
type Result2 = Shift<[3, 2, 1]> // [2, 1]

type Pop<T> = T extends [... infer R, unknown] ? R : never;
type Result3 = Pop<[3, 2, 1]> // [3, 2]

// 8. mapped types
// задание 1
type NotNull<T> = {
  [K in keyof T]: T[K] extends infer U | null ? U : never;
};

type Res = NotNull<{ value: string | null, arg: string }> // { value: string, arg: string }

// задание 2

type RemoveByValue<T, R> = {
  [K in keyof T as T[K] extends R ? never : K]: T[K];
};

type Res1 = RemoveByValue<{ value: string | null, arg: number }, number> // { value: string | null }

// задание 3

type SafeMerge<T, U> = {
  [K in keyof (T & U)]: K extends keyof (T | U)
   ? U[K] : K extends keyof T
    ? T[K] : K extends keyof U ? U[K] : never;
};

// Если есть общие поля берётся последний
type Res2 = SafeMerge<
  { value: string, common: string },
  { value2: number, common: number }
> // { value: string, value:2 number, common: number }

// 9. recursion
// задание 1
type DeepRequired<T> = {
  [K in keyof T]-?: DeepRequired<T[K]>;
};

type Res3 = DeepRequired<{
    value?: {
        title?: string
    }
}> // { value: { title: string } }

// задание 2

type Flatten<T extends unknown[]> = T extends [infer E, ...infer R]
 ? E extends unknown[]
  ? [...Flatten<E>, ...Flatten<R>]
  : [E, ...Flatten<R>] : T; 

type Res4 = Flatten<[1,2, [1,2, [3]]]> // [1,2,1,2,3]

// задание 3

// перепешите Reverse на хвостовую рекурсию
type Reverse<T extends unknown[], R extends unknown[] = []> =
 T extends [infer F, ...infer L]
 ? Reverse<L, [F, ...R]> : R;
 
type Ten = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
// глубина рекурсии больше 50
type Res5 = Reverse<[...Ten, ...Ten, ...Ten, ...Ten, ...Ten, 1]>

// задание 4

type SafeMergeTuple<T extends unknown[], R extends{} = {}> = T extends [infer F, ...infer L]
 ? SafeMergeTuple<L, SafeMerge<R, F>> : R;

type Res6 = SafeMergeTuple<
  [{ value: string }, { name: string }, { age: number; name: number }]
>; // { value: string, name: number , age: number}
