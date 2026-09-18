using ApiRest.Api.Models;

namespace ApiRest.Api.Services.Todos;

public interface ITodoService
{
    IEnumerable<TodoItem> GetAll();
    TodoItem? GetById(int id);
    TodoItem Create(string title);
    bool Update(int id, string title, bool isDone);
    bool Delete(int id);
}
