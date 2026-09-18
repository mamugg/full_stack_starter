/** Mirrors `TodoItem` from `ApiRest.Api.Models`. */
export interface Todo {
  readonly id: number;
  readonly title: string;
  readonly isDone: boolean;
  readonly createdAt: string;
}

export interface CreateTodoRequest {
  readonly title: string;
}

export interface UpdateTodoRequest {
  readonly title: string;
  readonly isDone: boolean;
}
