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

type SaveResult<T> =
  | { success: true; data: T }
  | { success: false; error: ZodError };

type BaseSchema<Type extends string = string, T = unknown> = {
  type: Type;
  safeParse: (value: unknown) => SaveResult<T>;
  optional: () => OptionalSchema<T>;
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
type StringSchema = BaseSchema<"string", string>;
type ObjectSchema<T> = BaseSchema<"object", T>;
type LiteralSchema<T> = BaseSchema<"literal", T>;
type UnionSchema<T extends BaseSchema[]> = BaseSchema<
  "union",
  {
    [K in keyof T]: Infer<T[K]>;
  }[number]
>;

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
      __value: undefined as never,
    };

    return stringSchema;
  },
  number: (params?: { min?: number; max?: number }) => {
    const numberSchema: NumberSchema = {
      type: "number",
      safeParse: (unknownValue) => {
        if (typeof unknownValue === "number") {
          let issues: ZodIssue[] = [];

          if (
            numberSchema.params.max &&
            unknownValue > numberSchema.params.max
          ) {
            issues.push({
              code: "number_max",
              message: `Value should be less then ${numberSchema.params.max}`,
              path: "",
            });
          }

          if (
            numberSchema.params.min &&
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
      __value: undefined as never,
    };

    return numberSchema;
  },
  object: <T extends Record<string, BaseSchema>>(schemasObject: T) => {
    const objectSchema: ObjectSchema<ObjectSchemasToValues<T>> = {
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
      __value: undefined as never,
    };

    return objectSchema;
  },
};

const RoleSchema = z.union([z.literal("user"), z.literal("admin")]);
type Role = Infer<typeof RoleSchema>;

const User = z.object({
  role: z.literal("user"),
  username: z.string().optional(),
  value: z.number().min(1).max(10),
  obj: z.object({
    key: z.string().optional(),
  }),
});

const Admin = z.object({
  role: z.literal("admin"),
  username: z.string().optional(),
  value: z.number().min(1).max(10),
});

const AnyUser = z.union([User, Admin])

const strSchema = z.string();

const res2 = strSchema.safeParse(1);

type Str = Infer<typeof strSchema>;

type User = Infer<typeof User>;

const res = AnyUser.safeParse({ role: "user", value: 2,  });

console.log(res);
if (res.success) {
  if(res.data.role === 'user'){
    res.data.obj.key
  }
} else {
  res.error.issues.forEach((e) => {
    e.code;
    e.message;
    e.path;
  });
}

console.log("=============================");
console.log("=============================");

