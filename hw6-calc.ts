// utils
type ReplaceAll<Str, Pattern, NewValue> = Str extends `${infer Left}${Pattern &
  string}${infer Right}`
  ? `${Left}${NewValue & string}${ReplaceAll<Right, Pattern, NewValue>}`
  : Str;

type Pop<T> = T extends [...infer R, unknown] ? R : never
type Push<T extends unknown[], V> = [...T, V]

type RemoveLast<T, S> = T extends `${infer F}${S & string}` ? F : never

type FindCloseBracket<Str, Acum extends string = '', Stack extends unknown[] = ['(']> = 
  Stack['length'] extends 0 ? {
    left: RemoveLast<Acum, ')'>,
    right: Str,
  }
  : Str extends `${infer Letter}${infer Rest}`
    ? Letter extends '(' 
      ? FindCloseBracket<Rest, `${Acum}${Letter}`, Push<Stack, '('>>
      : Letter extends ')' 
        ? FindCloseBracket<Rest, `${Acum}${Letter}`, Pop<Stack>>
        : FindCloseBracket<Rest, `${Acum}${Letter}`, Stack> 
  : never;

// math
type BuildTuple<N extends number, T extends unknown[] = []> = 
  T["length"] extends N ? T : BuildTuple<N, [...T, unknown]>;

type Add<A, B> =
  A extends number
    ? B extends number
      ? [...BuildTuple<A>, ...BuildTuple<B>]["length"]
      : never
    : never;

type Subtract<A, B> =
  A extends number
    ? B extends number
      ? BuildTuple<A> extends [...BuildTuple<B>, ...infer Remainder]
        ? Remainder["length"] : never
      : never
    : never;

type Multiply<A, B, Result = A> =
  A extends number 
    ? B extends 1 ? Result : B extends 0
      ? 0
      : Multiply<
          A, 
          Subtract<B, 1>, 
          Add<Result, A> & number
        >
    : never;

type Mod<A, B, Result = A> =
  A extends number
    ? B extends number
      ? BuildTuple<A> extends [...BuildTuple<B>, ...infer Remainder]
        ? Mod<Remainder['length'], B, Remainder['length']>
        : Result
      : never
    : never;

type Division<A, B, Result = 0> =
  A extends number
    ? B extends number
      ? BuildTuple<A> extends [...BuildTuple<B>, ...infer Remainder]
        ? Division<Remainder['length'], B, Add<Result, 1> & number>
        : Result
      : never
    : never;

type Pow<A, B, Result = 1> =
  A extends number 
    ? B extends 0
      ? Result : B extends number
        ? Pow<A, Subtract<B & number, 1>, Multiply<A & number, Result> & number>
        : never
      :never;

// calculator
type CalcStr<Str> = 
  Str extends `${infer Left}(${infer Rest}` ?
    FindCloseBracket<Rest> extends {left: infer Inner extends string, right: infer Right extends string} 
      ? CalcStr<`${Left}${CalcStr<Inner>}${Right}`>
      : never
    : Str extends `${infer Left}-${infer Right}` ? Subtract<CalcStr<Left>, CalcStr<Right>>
    : Str extends `${infer Left}+${infer Right}` ? Add<CalcStr<Left>, CalcStr<Right>>
    : Str extends `${infer Left}%${infer Right}` ? Mod<CalcStr<Left>, CalcStr<Right>>
    : Str extends `${infer Left}/${infer Right}` ? Division<CalcStr<Left>, CalcStr<Right>>
    : Str extends `${infer Left}**${infer Right}` ? Pow<CalcStr<Left>, CalcStr<Right>>
    : Str extends `${infer Left}*${infer Right}` ? Multiply<CalcStr<Left>, CalcStr<Right>>
    : Str extends `${infer V extends number}` ? V
  : never;

type Calc<T> = CalcStr<ReplaceAll<T, ' ', ''>>;

type E = `(5 - 3) * (((2 ** 4) % 6) / 2)`;
type Res = Calc<
  //   ^?
  E
>;
