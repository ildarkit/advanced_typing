// 1. FC
// Напишите аналог React.FC, но который типизирует возвр значение

type FC<Props, Return> = (props: Props) => Return;

const fc: FC<{name: string}, string> = ({name}) => {
    return '1'
};

// 2. Phone
// Сделайте функцию которая не принимает больше 10 символов строку
type BuildTuple<N extends number, T extends unknown[] = []> = 
  T["length"] extends N ? T : BuildTuple<N, [...T, unknown]>;

type Add<T extends number, E extends number> = [...BuildTuple<T>, ...BuildTuple<E>]["length"];

type MaxNumbers<N extends number, Counter = 1> = N extends Counter
  ? Counter
  : Counter | MaxNumbers<N, Add<Counter & number, 1>>;

type MaxNDigits<S extends string, N extends number, Counter extends number = 0> = 
  S extends `${string}${infer Rest}`
    ? MaxNDigits<Rest, N, Add<Counter, 1> & number>
    : Counter extends MaxNumbers<N>
      ? unknown
      : never;

declare function phone<T extends string, N extends 10>(
  num: T & (
    MaxNDigits<T, N> extends never
     ? { __error: `The phone number should not be more than ${N}` }
     : unknown
    )
): void;

// ошибка
// @ts-expect-error
phone('12345678911');

// 3.
// Измените приоритет вывода типов, так что бы typescript показал ошибку в момент присваивания формы,
// а не селекторов (у селекторов выше приоритет)
// Если NoInfer не работает, используйте другой паттерн &#x1f609;

type AdminBuilderProps<T, R> = {
  data: T[],
  onChange: (value: T) => void
  transform: (value: T) => R,
  backTransform: (res: R) => T
  Form: (props: {
    value: R,
    onChange: (value: R) => void
  }) => null 
}

function AdminBuilder<T, R>(priops: AdminBuilderProps<T,R>){

}

function Form({}:{
  value: number,
  onChange: (value: number) => void
}){
  return null
}

AdminBuilder({
  data: ['1', '2', '3'],
  onChange: (v) => {},
  transform: (v) => v,
  backTransform: (v) => v,
  Form,
})

// 4. Builder pipe
// Напишите имплементацию pipe на основе паттерна builder
const res = pipe(1)
    .add(v => String(v))
    .add(v => ({ name: v }))
    .add(v => ({ obj: v. name }))
    .run() // { obj: string }


// 5. 
// Напишите имплементацию pipe на перегрузках
const res = pipe(
    1,
    v => String(v),
    v => ({ name: v }),
    v => ({ obj: v. name })
)


