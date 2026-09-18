using System.Collections.Concurrent;
using ApiRest.Api.Models;

namespace ApiRest.Api.Services.Todos;

/// <summary>
/// Stockage en mémoire (pas de base de données) : les données sont perdues au redémarrage.
/// Illustre le pattern "service + interface" sans la complexité d'un ORM.
/// </summary>
public class TodoService : ITodoService
{
    private readonly ConcurrentDictionary<int, TodoItem> _items = new();
    private int _nextId;

    public TodoService()
    {
        Create("Configurer les variables d'environnement");
        Create("Ajouter les premiers tests");
    }

    public IEnumerable<TodoItem> GetAll() =>
        _items.Values.OrderBy(i => i.Id);

    public TodoItem? GetById(int id) =>
        _items.GetValueOrDefault(id);

    public TodoItem Create(string title)
    {
        var id = Interlocked.Increment(ref _nextId);
        var item = new TodoItem { Id = id, Title = title };
        _items[id] = item;
        return item;
    }

    public bool Update(int id, string title, bool isDone)
    {
        if (!_items.TryGetValue(id, out var existing))
        {
            return false;
        }

        existing.Title = title;
        existing.IsDone = isDone;
        return true;
    }

    public bool Delete(int id) => _items.TryRemove(id, out _);
}
