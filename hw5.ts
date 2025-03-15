// 1. recursion parsing
// задание 1
type Trim<T extends string, Acc extends string = ''> = T extends ` ${infer Word} ${infer Rest}`
 ? Trim<Rest, `${Acc}${Word}`>
 : T extends `${infer Word} ${infer Rest} `
    ? Trim<Rest, `${Acc}${Acc extends '' ? '' : ' '}${Word}`>
    : T extends ` ${infer Word} ${infer Rest} `
      ? Trim<Rest, `${Acc}${Word}`>
      : T extends `${infer Word} ${infer Rest}`
        ? Trim<Rest, Word extends '' ? Acc : `${Acc}${Acc extends '' ? '' : ' '}${Word}`>
        : T extends `${infer Rest}`
          ? `${Acc}${Rest extends '' ? '' : ' '}${Rest}`
          : never;

type TrimR = Trim<'   Hello world!   '>; // "Hello world!"
//  ^?

// задание 2
type ReplaceAll<
  S extends string,
  From extends string,
  To extends string,
> = S extends `${infer Word} ${infer Rest}`
  ?`${Word extends From ? To : Word} ${ReplaceAll<Rest, From, To>}`
  : S;
  
type R = ReplaceAll<'hello world my hello freand', 'hello', 'dear'>; // "dear world my dear freand"
//  ^?

// задание 4 посимвольный обход

type KebabCase<S extends string, StartPos extends boolean = true> =
  S extends `${infer Letter}${infer Rest}`
    ? Letter extends '-' | Lowercase<Letter>
      ? `${Letter}${KebabCase<Rest, false>}`
      :`${StartPos extends false ? '-' : ''}${Lowercase<Letter>}${KebabCase<Rest, false>}`
    : S;

type FooBarBaz = KebabCase<"FooBarBaz">; // foo-bar-baz
//  ^?
type DoNothing = KebabCase<"do-nothing">; // do-nothing
//  ^?

// задание 5 обход паттерна

type CamelCase<S extends string, StartPos extends boolean = true> = 
  S extends`${infer Word}_${infer Rest}`
    ? `${StartPos extends false ? Capitalize<Lowercase<Word>> : Lowercase<Word>}${CamelCase<Rest, false>}`
    : S extends `${infer Letter}${infer Rest}`
      ? `${Uppercase<Letter>}${Lowercase<Rest>}`
      : S;

type camelCase1 = CamelCase<'hello_world_with_types'>; // helloWorldWithTypes
//  ^?
type camelCase2 = CamelCase<'HELLO_WORLD_WITH_TYPES'>; // helloWorldWithTypes
//  ^?

// задание 6
type CamelCaseObj<T extends object> = {
  [K in keyof T as K extends string ? CamelCase<K> : K]:
    T[K] extends object ? CamelCaseObj<T[K]> : T[K];
};

type camelCaseObj = CamelCaseObj<{ field_value: string, obj_value: { name_value: string } }>;
//  ^?
// { fieldValue: string, objValue: { nameValue: string } }

// ** Добавьте обработку вложенных массиво
type CamelCaseObjArr<T extends object> = T extends [infer First, ...infer Rest]
  ? Rest['length'] extends 0
    ? [First extends object ? CamelCaseObjArr<First> : First]  
    : [
        First extends object ? CamelCaseObjArr<First> : First,
        Rest extends [infer Element] 
          ? Element extends object
            ? CamelCaseObjArr<Element>
            : Element
          : CamelCaseObjArr<Rest>
      ]
  : {
    [K in keyof T as K extends string ? CamelCase<K> : K]:
        T[K] extends object ? CamelCaseObjArr<T[K]> : T[K];
  };

type Obj = {
  field_value: string;
  obj_value: { tupple_value: [string, number]; };
  tupple_value: [ number, { name_value : string }]
};

type camelCaseObjArr = CamelCaseObjArr<Obj>;
//  ^?
type camelCaseObjArr1 = CamelCaseObjArr<number[]>;
//  ^?

// 2. FilterMatch, ParseUrlParams
// задание 7
type FilterMatch<Path, Pattern> = 
    Path extends unknown 
        ? MatchPattern<Path, Pattern>
        : never;

type MatchSegment<PathSegment, PatternSegment> = 
  PathSegment extends PatternSegment ? true : false;

type MatchPattern<Path, Pattern> = 
  Pattern extends `/${infer PatternHead}/${infer PatternRest}`
    ? Path extends `/${infer PathHead}/${infer PathRest}`
      ? MatchSegment<PathHead, PatternHead> extends true
        ? MatchPattern<`/${PathRest}`, `/${PatternRest}`> extends infer PathTail
          ? `/${PathHead}${PathTail & string}`
          : never
        : never
      : never
    : Pattern extends `/:${string}`
      ? Path extends `/${string}/${string}`
        ? never
        : Path
      : never

type R1 = FilterMatch<'/hello', '/:id'>; // /hello
//  ^?
type R2 = FilterMatch<'/posts/1' | '/posts/2' | '/posts/3/create', '/posts/:id'>; // '/posts/1' | '/posts/2'
//  ^?
type R3 = FilterMatch<'/user/1', '/posts/:id'>; // never
//  ^?

type ParseUrlParams<Path> = 
  Path extends `:${infer Param}/${infer Rest}`
    ? Param | ParseUrlParams<Rest>
    : Path extends `${string}/:${infer Param}/${infer Rest}`
      ? Param | ParseUrlParams<Rest>
      : Path extends `${string}/:${infer Param}`
        ? Param
        : Path extends `:${infer Param}`
          ? Param
          : never; 

type R4 = ParseUrlParams<':id'>; // id
//  ^?
type R5 = ParseUrlParams<'posts/:id'>; // id
//  ^?
type R6 = ParseUrlParams<'posts/:id/:user'>; // id | user
//  ^?
