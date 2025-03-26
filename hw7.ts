type ZodIssue = {
  code: string;
  message: string;
  path: string;
};

class ZodError extends Error {
  constructor(public issues: ZodIssue[]) {
    super();
  }
}

type Infer<T extends BaseSchema> = T["__value"];

type Merge<
  T extends Record<string, BaseSchema>,
  E extends Record<string, BaseSchema>
> = {
  [K in keyof (T & E)]: K extends keyof E
   ? E[K]
   : T[K & keyof T]
};

type SaveResult<T> =
  | { success: true; data: T }
  | { success: false; error: ZodError };

type BaseSchema<Type extends string = string, T = unknown> = {
  type: Type;
  safeParse: (value: unknown) => SaveResult<T>;
  optional: () => OptionalSchema<T>;
  transform: <E>(callback: (value: T) => E) => TransformSchema<E>;
  array: () => ArraySchema<T>;
  __value: T;
};

type OptionalSchema<T> = BaseSchema<"optional", T | undefined>;
type NumberSchema = BaseSchema<"number", number> & {
  params: {
    min?: number;
    max?: number;
  };
  min: (min: number) => NumberSchema;
  max: (max: number) => NumberSchema;
};
type StringSchema = BaseSchema<"string", string> & {
  trim: () => TrimSchema;
};
type TrimSchema = BaseSchema<"trim", string>;
type ObjectSchema<T extends Record<string, BaseSchema>> = BaseSchema<"object", T> & {
  extends: <E extends Record<string, BaseSchema>>(value: E) =>
    ObjectSchema<Simplify<Merge<T, E>>>;
};
type LiteralSchema<T> = BaseSchema<"literal", T>;
type UnionSchema<T extends BaseSchema[]> = BaseSchema<
  "union",
  {
    [K in keyof T]: Infer<T[K]>;
  }[number]
>;
type TransformSchema<T> = BaseSchema<"transform", T>;
type ArraySchema<T> = BaseSchema<"array", T[]>;

type Simplify<T> = { [K in keyof T]: T[K] } & {};

type ObjectSchemasToValues<T extends Record<string, BaseSchema>> = Simplify<
  {
    [K in keyof T as T[K] extends { type: "optional" } ? K : never]?: Infer<
      T[K]
    >;
  } & {
    [K in keyof T as T[K] extends { type: "optional" } ? never : K]: Infer<
      T[K]
    >;
  }
>;

const successResult = <T,>(data: T) => ({
  success: true as const,
  data,
});

const errorResult = (error: ZodError) => ({
  success: false as const,
  error,
});

function merge<
  T extends Record<string, BaseSchema>,
  E extends Record<string, BaseSchema>,
  U extends Record<string, BaseSchema>,
>(objSchema: T, extendSchema: E) {
  const keys = [
    ...new Set([
      ...Object.keys(objSchema),
      ...Object.keys(extendSchema)
    ])
  ];

  return keys.reduce(
    (schema, key) => {
      const item = key in extendSchema 
        ? { [key]: extendSchema[key] }
        : { [key]: objSchema[key] };
      return { ...schema, ...item };
    }, 
    {} as U
  );
}

const z = {
  union: <T extends BaseSchema[]>(schemasTuple: T) => {
    const unionSchema: UnionSchema<T> = {
      type: "union",
      safeParse: (unknownValue) => {
        const issues: ZodIssue[] = [];

        for (const schema of schemasTuple) {
          const res = schema.safeParse(unknownValue);
          if (res.success) {
            return res;
          } else {
            issues.push(...res.error.issues);
          }
        }
        return errorResult(new ZodError(issues));
      },
      optional: () => z.optional(unionSchema),
      transform: <E,>(callback: (value: Infer<UnionSchema<T>>) => E) => {
        return z.transform(unionSchema, callback);
      },
      array: () => {
        return z.array(unionSchema);
      },
      __value: undefined as never,
    };
    return unionSchema;
  },
  literal: <const T,>(value: T) => {
    const literalSchema: LiteralSchema<T> = {
      type: "literal",
      safeParse: (unknownValue) => {
        if (unknownValue === value) {
          return successResult(unknownValue as T);
        }
        return errorResult(
          new ZodError([
            {
              path: "",
              code: "literal_error",
              message: `Value should be ${value}`,
            },
          ]),
        );
      },
      optional: () => z.optional(literalSchema),
      transform: <E,>(callback: (value: T) => E) => {
        return z.transform(literalSchema, callback);
      },
      array: () => {
        return z.array(literalSchema);
      },
      __value: undefined as never,
    };
    return literalSchema;
  },
  optional: <T extends BaseSchema>(schema: T) => {
    const optionalSchema: OptionalSchema<Infer<T>> = {
      type: "optional",
      safeParse: (unknownValue) => {
        if (unknownValue === undefined) {
          return successResult(unknownValue);
        }
        return schema.safeParse(unknownValue);
      },
      optional: () => z.optional(optionalSchema),
      transform: <E,>(callback: (value: Infer<T> | undefined) => E) => {
        return z.transform(schema, callback);
      },
      array: () => {
        return z.array(optionalSchema);
      },
      __value: undefined as never,
    };
    return optionalSchema;
  },
  string: () => {
    const stringSchema: StringSchema = {
      type: "string",
      safeParse: (unknownValue) => {
        if (typeof unknownValue === "string") {
          return successResult(unknownValue);
        }
        return errorResult(
          new ZodError([
            {
              code: "not-string",
              message: "Value should be string",
              path: "",
            },
          ]),
        );
      },
      optional: () => z.optional(stringSchema),
      transform: <E,>(callback: (value: string) => E) => {
        return z.transform(stringSchema, callback);
      },
      array: () => {
        return z.array(stringSchema);
      },
      trim: () => {
        return z.trim(stringSchema);
      },
      __value: undefined as never,
    };

    return stringSchema;
  },
  trim: (schema: StringSchema) => {
    const trimSchema: TrimSchema = {
      type: "trim",
      safeParse: (unknownValue) => {
        const result = schema.safeParse(unknownValue);
        if (result.success) {
          const trimStr = result.data.trim();
          return successResult(trimStr);
        }
        return errorResult(result.error);
      },
      optional: () => z.optional(trimSchema),
      transform: <E,>(callback: (value: string) => E) => {
        return z.transform(trimSchema, callback);
      },
      array: () => {
        return z.array(trimSchema);
      },
      __value: undefined as never,
    };

    return trimSchema;
  },
  number: (params?: { min?: number; max?: number }) => {
    const numberSchema: NumberSchema = {
      type: "number",
      safeParse: (unknownValue) => {
        if (typeof unknownValue === "number") {
          let issues: ZodIssue[] = [];
          if (
            numberSchema.params.max !== undefined &&
            unknownValue > numberSchema.params.max
          ) {
            issues.push({
              code: "number_max",
              message: `Value should be less then ${numberSchema.params.max}`,
              path: "",
            });
          }

          if (
            numberSchema.params.min !== undefined &&
            unknownValue < numberSchema.params.min
          ) {
            issues.push({
              code: "number_min",
              message: `Value should be more then ${numberSchema.params.min}`,
              path: "",
            });
          }
          if (issues.length === 0) {
            return successResult(unknownValue);
          }
          return errorResult(new ZodError(issues));
        }

        return errorResult(
          new ZodError([
            {
              code: "not-number",
              message: "Value should be number",
              path: "",
            },
          ]),
        );
      },
      optional: () => z.optional(numberSchema),
      max: (max: number) =>
        z.number({
          ...params,
          max,
        }),
      min: (min: number) =>
        z.number({
          ...params,
          min,
        }),
      params: params ?? {},
      transform: <E,>(callback: (value: number) => E) => {
        return z.transform(numberSchema, callback);
      },
      array: () => {
        return z.array(numberSchema);
      },
      __value: undefined as never,
    };

    return numberSchema;
  },
  object: <T extends Record<string, BaseSchema>>(schemasObject: T) => {
    const objectSchema: ObjectSchema<T> = {
      type: "object",
      safeParse: (unknownValue) => {
        if (typeof unknownValue !== "object" || unknownValue === null) {
          return errorResult(
            new ZodError([
              {
                code: "not-object",
                message: "Value should be object",
                path: "",
              },
            ]),
          );
        }

        const schemasEntires = Object.entries(schemasObject);

        const data: Record<string, unknown> = {};
        const issues: ZodIssue[] = [];

        for (const [key, schema] of schemasEntires) {
          const objectValue = unknownValue[key as never];

          // handle optional fields
          if (!(key in unknownValue)) {
            if (schema.type === "optional") {
              continue;
            } else {
              issues.push({
                code: "required",
                message: `${key} is required`,
                path: `/${key}`,
              });
              continue;
            }
          }

          const result = schema.safeParse(objectValue);

          if (result.success) {
            data[key] = result.data;
          } else {
            issues.push(
              ...result.error.issues.map((i) => ({
                ...i,
                path: `/${key}${i.path}`,
              })),
            );
          }
        }

        if (issues.length === 0) {
          return successResult(data as never);
        } else {
          return errorResult(new ZodError(issues));
        }
      },
      optional: () => z.optional(objectSchema),
      transform: <E,>(callback: (value: T) => E) => {
        return z.transform(objectSchema, callback);
      },
      array: () => {
        return z.array(objectSchema);
      },
      extends: (extendSchemasObject) => {
        return z.object(merge(schemasObject, extendSchemasObject));
      },
      __value: undefined as never,
    };

    return objectSchema;
  },
  transform: <T extends BaseSchema, E>(schema: T, callback: (value: Infer<T>) => E) => {
    const transformSchema: TransformSchema<E> = {
      type: 'transform',
      safeParse: (unknownValue) => {
        const result = schema.safeParse(unknownValue);
        if (result.success) {
          const value = callback(result.data);
          return successResult(value);
        } else {
          return errorResult(
            result.error
          );
        }
      },
      optional: () => z.optional(transformSchema),
      transform: <V,>(callback: (value: E) => V) => {
        return z.transform(transformSchema, callback);
      },
      array: () => {
        return z.array(transformSchema);
      },
      __value: undefined as never,
    };

    return transformSchema;
  },
  array: <T extends BaseSchema>(schema: T) => {
    const arraySchema: ArraySchema<Infer<T>> = {
      type: 'array',
      safeParse: (unknownValue) => {
        const result = schema.safeParse(unknownValue);
        if (result.success)
          return successResult([result.data]);
        else return errorResult(result.error);
      },
      optional: () => z.optional(arraySchema),
      transform: <E,>(callback: (value: Infer<ArraySchema<Infer<T>>>) => E) => {
        return z.transform(arraySchema, callback);
      },
      array: () => {
        return z.array(arraySchema);
      },
      __value: undefined as never,
    };

    return arraySchema;
  }
};

const strLength = z.string().transform(v => z.number({min: 8}).safeParse(v.length));
const res1 = strLength.safeParse('less');
console.log(res1);

const num = z.number({min: 1}).array().transform(v => v.map(i => i * 2));
const res2 = num.safeParse(1);
console.log(res2);

const trimStr = z.string().trim();
const res3 = trimStr.safeParse('  hello world  !   ');
console.log(res3);

const objValue = z.object({
  id: z.number(),
  name: z.string(),
  order: z.number(),
}).extends({ 
  order: z.string().optional(),
  age: z.number()
});
const res4 = objValue.safeParse({ id: 1, name: 'Bob', age: 25 });
console.log(res4);
