export class Todo {
  id!: number;
  title!: string;
  isDone = false;
  createdAt: string = new Date().toISOString();
}
