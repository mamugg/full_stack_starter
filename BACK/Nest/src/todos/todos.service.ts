import { Injectable } from '@nestjs/common';
import { Todo } from './entities/todo.entity';

/**
 * In-memory storage (no database): data is lost on restart. Keeps the focus
 * on the routing/auth/DI pattern rather than ORM plumbing — see the README
 * for how to swap this for a real persistence layer (Prisma/TypeORM).
 */
@Injectable()
export class TodosService {
  private readonly items = new Map<number, Todo>();
  private nextId = 0;

  constructor() {
    this.create("Configurer les variables d'environnement");
    this.create('Ajouter les premiers tests');
  }

  findAll(): Todo[] {
    return [...this.items.values()].sort((a, b) => a.id - b.id);
  }

  findOne(id: number): Todo | undefined {
    return this.items.get(id);
  }

  create(title: string): Todo {
    const todo: Todo = { id: ++this.nextId, title, isDone: false, createdAt: new Date().toISOString() };
    this.items.set(todo.id, todo);
    return todo;
  }

  update(id: number, title: string, isDone: boolean): boolean {
    const existing = this.items.get(id);
    if (!existing) {
      return false;
    }

    existing.title = title;
    existing.isDone = isDone;
    return true;
  }

  remove(id: number): boolean {
    return this.items.delete(id);
  }
}
