type Simplify<T> = { [K in keyof T]: T[K] } & {};

type DefaultValues<FormData> = Simplify<{
  [K in keyof FormData]?: FormData[K] extends object
    ? DefaultValues<FormData[K]>
    : FormData[K];
}>;

type KeyTypes = string | number;

type UnknownTyple = [unknown, ...unknown[]] | [];

type FormDataToPaths<
  FormData,
  Base extends string = "",
> = FormData extends unknown[]
  ?
    | Exclude<
        {
          [K in keyof FormData]: FormDataToPaths<
            FormData[K],
            `${Base}.${K & KeyTypes}`
          >;
        }[number],
        undefined
      >
    | Base
  : FormData extends object
    ?
      | Exclude<
          {
            [K in keyof FormData]: FormDataToPaths<
              FormData[K],
              `${Base}.${K & KeyTypes}`
            >;
          }[keyof FormData],
          undefined
        >
      | Base
    : Base;

type RemoveLeaderDots<T> = T extends `.${infer Rest}` ? Rest : T;

type FormValueFromPath<FormData, Path> =
  Path extends `${infer Key}.${infer Rest}`
    ? FormValueFromPath<FormData[Key & keyof FormData], Rest>
    : FormData[Path & keyof FormData];

type FormError = {
  message: string;
  type: string;
};

type Merge<T, V> = {
  [K in keyof (T & V)]: V[K & keyof V] | T[K & keyof T];
};

type FormDataToErrors<FormData> = FormData extends UnknownTyple
  ? Merge<
      {
        [K in keyof FormData]?: FormData[K] extends object
          ? FormDataToErrors<FormData[K]>
          : FormError;
      },
      {
        __error?: FormError;
      }
    >
  : FormData extends unknown[]
    ? Merge<Array<FormDataToErrors<FormData[number]>>, { __error?: FormError }>
    : Simplify<
        Merge<
          {
            [K in keyof FormData]?: FormData[K] extends object
              ? FormDataToErrors<FormData[K]>
              : FormError;
          },
          {
            __error?: FormError;
          }
        >
      >;

type PathBuilder<
  FormData,
  Path = RemoveLeaderDots<FormDataToPaths<FormData>>,
> = {
  (): Path;
  <P extends Path>(p: P): P;
  <
    P1 extends Path,
    const P2 extends RemoveLeaderDots<
      FormDataToPaths<FormValueFromPath<FormData, P1>>
    > extends infer R
      ? R
      : never,
  >(
    p1: P1,
    p2: P2,
  ): `${P1 & KeyType}.${P2 & KeyType}`;
  <
    P1 extends Path,
    const P2 extends RemoveLeaderDots<
      FormDataToPaths<FormValueFromPath<FormData, P1>>
    > extends infer R
      ? R
      : never,
    const P3 extends RemoveLeaderDots<
      FormDataToPaths<
        FormValueFromPath<FormData, `${P1 & KeyType}.${P2 & KeyType}`>
      >
    > extends infer R
      ? R
      : never,
  >(
    p1: P1,
    p2: P2,
    p3: P3,
  ): `${P1 & KeyType}.${P2 & KeyType}.${P3 & KeyType}`;
  <
    P1 extends Path,
    const P2 extends RemoveLeaderDots<
      FormDataToPaths<FormValueFromPath<FormData, P1>>
    > extends infer R
      ? R
      : never,
    const P3 extends RemoveLeaderDots<
      FormDataToPaths<
        FormValueFromPath<FormData, `${P1 & KeyType}.${P2 & KeyType}`>
      >
    > extends infer R
      ? R
      : never,
    const P4 extends RemoveLeaderDots<
      FormDataToPaths<
        FormValueFromPath<
          FormData,
          `${P1 & KeyType}.${P2 & KeyType}.${P3 & KeyType}`
        >
      >
    > extends infer R
      ? R
      : never,
  >(
    p1: P1,
    p2: P2,
    p3: P3,
    p4: P4,
  ): `${P1 & KeyType}.${P2 & KeyType}.${P3 & KeyType}.${P4 & KeyType}`;
};

type Watch<FormData, Path = RemoveLeaderDots<FormDataToPaths<FormData>>> = {
  <const P>(
    build: (builder: PathBuilder<FormData, Path>) => P,
  ): FormValueFromPath<FormData, P>;
  <const P extends Path>(path: P): FormValueFromPath<FormData, P>;
  <const PT extends Path[]>(
    paths: PT,
  ): {
    [K in keyof PT]: FormValueFromPath<FormData, PT[K]>;
  };
};

type Control<FormData, Path = RemoveLeaderDots<FormDataToPaths<FormData>>> =
  <P extends Path>(path: P) => FormValueFromPath<FormData, P>;

type Fn = (...args: any[]) => any;

type FormBuilder =
  <T extends Fn, P extends Parameters<T>[0]>(control: T, path: P) => FormBuilder;

type ParentPath = <T extends FormBuilder>(builder: T) => Parameters<T>[1];

type UseFormOptions<FormData> = {
  defaultValues?: DefaultValues<FormData>;
  parent?: ParentPath;
};

type UseFormReturn<FormData, Path = RemoveLeaderDots<FormDataToPaths<FormData>>> = {
  register: <const P extends Path>(path: P) => {};
  watch: Watch<FormData>;
  handleSubmit: (data: FormData) => void;
  setValue: <const P extends Path>(
    path: P,
    value: FormValueFromPath<FormData, P>,
  ) => void;
  setError: <const P extends Path>(path: P, error: FormError) => void;
  formState: {
    errors: FormDataToErrors<FormData>;
  };
  controller: Control<FormData>;
};

type UseForm = <FormData>(
  options: UseFormOptions<FormData>,
) => UseFormReturn<FormData>;

const useForm: UseForm = (options: any): any => {};

type FormValues = {
  name: string;
  value: number;
  inner: {
    name: string;
    value: number;
  };
  arr: {
    name: string;
    obj: {
      name: string;
      value: number;
    };
  }[];
  tuple: [string, number];
};

function MapForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState,
    controller,
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      value: 0,
      inner: {
        name: "",
        value: 0,
      },
      arr: [],
    },
  });

  const form = useForm({
    parent: b => b(controller, 'arr.0'),
  });

  const v = watch(b => b('arr.0', 'obj.name'));
  const [name, value] = watch(["tuple.0", "tuple.1"]);
  setValue("arr.0.name", "name");
  setValue("arr.0.obj.value", 1);

  setError("arr.0.obj", { type: "manual", message: "manual error" });
  const error = formState.errors.arr?.[0]?.obj?.name;

  return (
    <form>
      <input {...register("name")} />
      <input {...register("value")} />
      <input {...register("inner.name")} />
      <input {...register("inner.value")} />
      <input {...register("arr.0.name")} />
      <input {...register("arr.0.obj.name")} />
      <input {...register("arr.0.obj.value")} />
    </form>
  );
}
