// utility
type BuildTuple<N extends number, T extends unknown[] = []> = 
  T["length"] extends N ? T : BuildTuple<N, [...T, unknown]>;

type Add<A extends number, B extends number> = 
  [...BuildTuple<A>, ...BuildTuple<B>]["length"];

type Subtract<A extends number, B extends number> = 
  BuildTuple<A> extends [...BuildTuple<B>, ...infer Remainder] 
    ? Remainder["length"] 
    : never;

type Multiply<A extends number, B extends number, Result extends number = 0> = 
  B extends 1 
    ? Add<A, Result> 
    : Multiply<
        A, 
        Subtract<B, 1>, 
        Add<Result, A> & number
      >;

// factorial
type Factorial<N extends number, Result extends number = 1> = 
  N extends 0 | 1
    ? Result
    : Factorial<
      Subtract<N, 1>,
      Multiply<Result, N> & number
    >;
    
type Fact3 = Factorial<3>; // 6 (3! = 6)
//  ^?
type Fact1 = Factorial<1>;
//  ^?
type Fact6 = Factorial<6>;
//  ^?

// compare
type LTE<A extends number, B extends number> = 
  BuildTuple<A> extends [...BuildTuple<B>, ...infer Diff]
    ? Diff['length'] extends 0 ? true : false 
    : true;
type IsLE = LTE<3, 5>; // true
//  ^?
type IsNotLE = LTE<5, 3>; // false
//  ^?
type IsE = LTE<6, 6>;
//  ^?

// division *
type Division<A extends number, B extends number, Result extends number = 0> = 
  BuildTuple<A> extends [...BuildTuple<B>, ...infer Diff]
    ? Diff['length'] extends 0
      ? Add<Result, 1>
      : Division<Subtract<A, B>, B, Add<Result, 1> & number>
    : Result;

type Div2 = Division<5, 2>;
//  ^?
type Div4 = Division<25, 6>;
//  ^?
type Div1 = Division<3, 3>;
//  ^?
type Div0 = Division<4, 5>;
//  ^?
