type TodoItem = {
  id: number;
  text: string;
  completed: boolean;
};

type TodoList = [
  {
    id: 1,
    text: "Complete Task",
    completed: false,
  },
  {
    id: 2,
    text: "Watch TV",
    completed: false,
  },
  {
    id: 4,
    text: "Playing footbal",
    completed: false,
  }
];

// add item
type AddItem<TodoList extends TodoItem[], Id extends number, Text extends string> = [
  ...TodoList,
  {
    id: Id,
    text: Text,
    completed: false,
  }
];
type AddTodoItem = AddItem<TodoList, 5, "Reading book">;

// remove item
type RemoveItem<TodoList, Id extends number> = 
  TodoList extends [infer F extends TodoItem, ...infer R extends TodoItem[]]
    ? F["id"] extends Id 
      ? RemoveItem<R, Id>
      : [F, ...RemoveItem<R, Id>]
    : TodoList;
type RemoveTodoItem = RemoveItem<AddTodoItem, 4>;

// update item text
type UpdateText<TodoList, Id extends number, Text extends string> =
  TodoList extends [infer F extends TodoItem, ...infer R extends TodoItem[]]
    ? F["id"] extends Id
      ? [{ [K in keyof F]: K extends 'text' ? Text : F[K] }, ...R]
      : [F, ...UpdateText<R, Id, Text>]
    : TodoList;
type UpdateTodoText = UpdateText<RemoveTodoItem, 2, "Swimming">;

// toggle item
type ToggleCompleted<TodoList, Id extends number> =
  TodoList extends [infer F extends TodoItem, ...infer R extends TodoItem[]]
    ? F["id"] extends Id
      ? [{ [K in keyof F]: K extends 'completed' ? true : F[K] }, ...R]
      : [F, ...ToggleCompleted<R, Id>]
    : TodoList;
type ToggleTodoItem = ToggleCompleted<UpdateTodoText, 1>;

// find item
type FindById<TodoList, Id extends number> = 
  TodoList extends [infer F extends TodoItem, ...infer R extends TodoItem[]]
    ? F["id"] extends Id
      ? F
      : FindById<R, Id>
    : never;
type FindTodoItemNever = FindById<ToggleTodoItem, 10>;
type FindTodoItem = FindById<ToggleTodoItem, 5>;

// filter items
type FilterBy<TodoList, Pattern extends Partial<TodoItem>> =
  TodoList extends [infer F extends TodoItem, ...infer R extends TodoItem[]]
    ? F extends Pattern
      ? [F, ...FilterBy<R, Pattern>]
      : FilterBy<R, Pattern>
    : TodoList;
type FilterUncompletedTodoItems = FilterBy<ToggleTodoItem, { completed: false }>; 
