// ==================
// ЗАДАНИЕ! Напишите тип которому assignable ЛЮБОЙ массив (не забудьте про as const)
// Без использования any
// Тест кейсы придумайте, сами)

function getAnyArray<T>(param: readonly T[]) {}

const arr = [1, 2, 3] as const;
getAnyArray(arr);
const words = ["qwerty", "book", "title"];
getAnyArray(words);

// ==================
// ЗАДАНИЕ! Напишите тип которому assignable любой массив длинной больше 1
// Без использования any

function getNotEmptyArray<T>(param: [T, ...T[]]) {}

// @ts-expect-error
getNotEmptyArray([]);
getNotEmptyArray([1]);

// ==================
// ЗАДАНИЕ! Типизируйте функцию так, что бы она могла принять как можно больше безопасных значений
// Без использования any
// Нужны ли тут дженерики?

type OnlyObjectKey<T, R> = {
    [K in keyof T]: T[K] extends R ? R : never;
}[keyof T];

type ObjectName = {
    [key: string]: {
      [key: string]: string;
    }
};

function structureType<T extends Record<string, ObjectName>>(
  value: { arr: readonly OnlyObjectKey<T, ObjectName>[] }
  ): string {
  return value.arr[1].obj.name;
}

const structureType1 = {
  arr: [
    1,
    {
      obj: {
        name: "asd",
        value: "",
      },
    },
    {
      hello: 1,
    },
  ],
  value: 1,
} as const;

//@ts-expect-error
structureType(structureType1);

const structureTypeValid = {
  arr: [
    {
      obj: {
        name: "asd",
        value: "",
      }
    }
  ],
} as const;

structureType(structureTypeValid)

// ==================
// ЗАДАНИЕ! Обновите тип прошлой функции, так что бы можно было добавить несуществующие параметры
// при создании объекта в момент вызова
// см index signature

type OnlyObjectName<T> = {
    [K in keyof T]: T[K] extends Record<string, string> ? T[K] : never;
}[keyof T];

function structureType2(
  value: { arr: OnlyObjectName<any>[], [key: string]: unknown }): string {
  return value.arr[1].obj.name;
}

structureType2({
  arr: [
    1,
    {
      obj: {
        name: "asd",
        value: "",
      },
    },
    {
      hello: 1,
    },
  ],
  value: 1,
});

// ==================
// ЗАДАНИЕ! При пересечении с каким типом всегда будет получаться изначальный тип?

type TestIntersection<T> = T & string;
type ResTestIntersection = TestIntersection<string>; // res should be string

// ==================
// ЗАДАНИЕ! При пересечении с каким типом будет всегда never?

type TestIntersection2<T> = T & never;
type ResTestIntersection2 = TestIntersection2<string>; // res should be never

// ==================
// ЗАДАНИЕ! При объединении с каким типом всегда будет получаться тот же самый тип?

type TestUnion<T> = T | T;
type ResTestUnion = TestUnion<number>; // res should be number

// ==================
// ЗАДАНИЕ! При объединении с каким типом всегда будет получаться unknown
type TestUnion2<T> = T | unknown;
type ResTestUnion2 = TestUnion2<string>; // res should be unknown

// ==================
// ЗАДАНИЕ! Как с помощью пересечения можно отфильтровать все числа

type FilterIntersection<T> = T & ("value" | "b");
type ResFilterIntersection = FilterIntersection<1 | 2 | "value" | "b">; // res should be 'value' | 'b'

// ==================
// ЗАДАНИЕ! Как с помощью пересечения можно достать событие по типу из юниона

type FindEventByIntersection<T, K> = T & { type: K };

type Event1 = { type: "user-created"; data: { name: string } };
type Event2 = { type: "user-deleted"; data: { id: number } };

type ResFindEventByIntersection = FindEventByIntersection<
  Event1 | Event2,
  "user-deleted"
>; // Res should assignable Event2

// ==================
// ЗАДАНИЕ! Напишите такой тип что бы функцию можно было вызвать 3 разными способами
type Params = [{ isOne: true }, number]
  | [{ isTwo: true }, number, number]
  | [{ isThree: true }, number, number, number];

function structureUnion(...params: Params) {}

structureUnion({ isOne: true }, 1);
// @ts-expect-error Здесь ошибка, так как при isOne только один дополнительный аргумент
structureUnion({ isOne: true }, 1, 2);
structureUnion({ isTwo: true }, 1, 2);
structureUnion({ isThree: true }, 1, 2, 3);

// ==================
// ЗАДАНИЕ! Без использования any напишите тип функции, к которому можно присвоить любой callback

function anyCallback(cb: (arg: never, ...args: never[]) => unknown) {}

anyCallback((a: number) => 1);
anyCallback((a: string, b: number) => "str");

// ==================
// ЗАДАНИЕ! Какой тип нужно передать в параметр типа Ref что бы в этот тип был asssignable любой другой реф?

type Ref<T> = { current: T } | ((value: T) => void);

type SuperRef = Ref<any>;

function storeRef(anyRef: SuperRef) {}

const numberRef = {} as Ref<number>;
const stringRef = {} as Ref<string>;

storeRef(numberRef);
storeRef(stringRef);
