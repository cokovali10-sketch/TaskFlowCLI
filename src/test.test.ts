import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { createTask, updateTask, deserializeStore, serializeStore, taskToCSV, Task, TaskStore } from "./models";
import { Storage } from "./storage";

function tmpPath(): string {
  return path.join(os.tmpdir(), `taskflow_test_${Date.now()}_${Math.random().toString(36).slice(2)}.json`);
}

describe("Task Model", () => {
  it("should create a task with default values", () => {
    const task = createTask("Test task");
    expect(task.title).toBe("Test task");
    expect(task.description).toBe("");
    expect(task.priority).toBe("medium");
    expect(task.status).toBe("todo");
    expect(task.tags).toEqual([]);
    expect(task.id).toBeTruthy();
    expect(task.created).toBeTruthy();
    expect(task.updated).toBeTruthy();
  });

  it("should create a task with all fields", () => {
    const task = createTask("Bug fix", "Fix the login issue", "high");
    task.tags = ["auth", "urgent"];
    expect(task.title).toBe("Bug fix");
    expect(task.description).toBe("Fix the login issue");
    expect(task.priority).toBe("high");
    expect(task.tags).toEqual(["auth", "urgent"]);
  });

  it("should reject empty title", () => {
    expect(() => createTask("")).toThrow("Task title cannot be empty");
    expect(() => createTask("   ")).toThrow("Task title cannot be empty");
  });

  it("should reject invalid priority", () => {
    expect(() => createTask("Test", "", "invalid" as any)).toThrow("Invalid priority");
  });

  it("should update task status and set completedAt", () => {
    const task = createTask("Test");
    const done = updateTask(task, { status: "done" });
    expect(done.status).toBe("done");
    expect(done.completedAt).toBeTruthy();
    expect(new Date(done.completedAt!).getTime()).toBeGreaterThan(0);
  });

  it("should update task without changing created timestamp", () => {
    const task = createTask("Test");
    const originalCreated = task.created;
    const updated = updateTask(task, { title: "Updated" });
    expect(updated.title).toBe("Updated");
    expect(updated.created).toBe(originalCreated);
    expect(updated.updated).not.toBe(task.updated);
  });

  it("should trim whitespace from title and description", () => {
    const task = createTask("  Trimmed  ", "  desc  ");
    expect(task.title).toBe("Trimmed");
    expect(task.description).toBe("desc");
  });

  it("should serialize and deserialize store", () => {
    const store: TaskStore = {
      tasks: [createTask("Task A"), createTask("Task B")],
      lastUpdated: new Date().toISOString(),
    };
    const json = serializeStore(store);
    const parsed = deserializeStore(json);
    expect(parsed.tasks.length).toBe(2);
    expect(parsed.tasks[0].title).toBe("Task A");
    expect(parsed.tasks[1].title).toBe("Task B");
  });

  it("should handle corrupted JSON gracefully", () => {
    const parsed = deserializeStore("not valid json {{{");
    expect(parsed.tasks).toEqual([]);
  });

  it("should export task to CSV format", () => {
    const task = createTask("CSV Test", "Description", "high");
    task.tags = ["export"];
    const csv = taskToCSV(task);
    expect(csv).toContain("CSV Test");
    expect(csv).toContain("high");
    expect(csv).toContain("export");
  });
});

describe("Priority Levels", () => {
  it("should support all four priority levels", () => {
    const low = createTask("Low task", "", "low");
    const med = createTask("Medium task", "", "medium");
    const high = createTask("High task", "", "high");
    const urgent = createTask("Urgent task", "", "urgent");
    expect(low.priority).toBe("low");
    expect(med.priority).toBe("medium");
    expect(high.priority).toBe("high");
    expect(urgent.priority).toBe("urgent");
  });
});

describe("Tag System", () => {
  it("should support multiple tags on a task", () => {
    const task = createTask("Tagged task");
    task.tags = ["work", "important", "deadline"];
    expect(task.tags.length).toBe(3);
    expect(task.tags).toContain("work");
    expect(task.tags).toContain("important");
    expect(task.tags).toContain("deadline");
  });

  it("should allow empty tags array", () => {
    const task = createTask("No tags");
    expect(task.tags).toEqual([]);
  });
});

describe("Storage", () => {
  let filePath: string;

  beforeEach(() => {
    filePath = tmpPath();
  });

  afterEach(() => {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });

  it("should start with empty store", () => {
    const storage = new Storage(filePath);
    expect(storage.getAll()).toEqual([]);
  });

  it("should add and retrieve tasks", () => {
    const storage = new Storage(filePath);
    const task = createTask("Test task");
    storage.add(task);
    expect(storage.getAll().length).toBe(1);
    expect(storage.getById(task.id)).toBeDefined();
  });

  it("should update tasks", () => {
    const storage = new Storage(filePath);
    const task = createTask("Update me");
    storage.add(task);
    const updated = storage.update(task.id, { status: "in_progress" });
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("in_progress");
  });

  it("should return null when updating nonexistent task", () => {
    const storage = new Storage(filePath);
    expect(storage.update("nonexistent", { title: "nope" })).toBeNull();
  });

  it("should remove tasks", () => {
    const storage = new Storage(filePath);
    const task = createTask("Delete me");
    storage.add(task);
    expect(storage.remove(task.id)).toBe(true);
    expect(storage.getAll().length).toBe(0);
  });

  it("should return false when removing nonexistent task", () => {
    const storage = new Storage(filePath);
    expect(storage.remove("nonexistent")).toBe(false);
  });

  it("should find tasks by partial ID", () => {
    const storage = new Storage(filePath);
    const task = createTask("Partial ID");
    storage.add(task);
    expect(storage.getById(task.id.slice(0, 8))).toBeDefined();
  });

  it("should search tasks by title", () => {
    const storage = new Storage(filePath);
    storage.add(createTask("Fix login bug"));
    storage.add(createTask("Write docs"));
    storage.add(createTask("Login page redesign"));
    const results = storage.search("login");
    expect(results.length).toBe(2);
  });

  it("should search tasks by description", () => {
    const storage = new Storage(filePath);
    storage.add(createTask("Task A", "React component"));
    storage.add(createTask("Task B", "Vue component"));
    storage.add(createTask("Task C", "Angular component"));
    const results = storage.search("component");
    expect(results.length).toBe(3);
  });

  it("should search tasks by tags", () => {
    const storage = new Storage(filePath);
    const task = createTask("Tagged");
    task.tags = ["frontend"];
    storage.add(task);
    storage.add(createTask("Backend"));
    const results = storage.search("frontend");
    expect(results.length).toBe(1);
  });

  it("should support regex search", () => {
    const storage = new Storage(filePath);
    storage.add(createTask("Fix login"));
    storage.add(createTask("Login page"));
    storage.add(createTask("Logout button"));
    const results = storage.searchRegex("^Login");
    expect(results.length).toBe(1);
    expect(results[0].title).toBe("Login page");
  });

  it("should handle invalid regex gracefully", () => {
    const storage = new Storage(filePath);
    storage.add(createTask("Test"));
    const results = storage.searchRegex("[invalid");
    expect(results).toEqual([]);
  });

  it("should filter by status and priority", () => {
    const storage = new Storage(filePath);
    storage.add(createTask("Task 1", "", "high"));
    storage.add(createTask("Task 2", "", "low"));
    const task3 = createTask("Task 3", "", "high");
    task3.status = "done";
    storage.add(task3);
    expect(storage.filter({ status: "todo" }).length).toBe(2);
    expect(storage.filter({ priority: "high" }).length).toBe(2);
    expect(storage.filter({ status: "done" }).length).toBe(1);
  });

  it("should calculate stats", () => {
    const storage = new Storage(filePath);
    const t1 = createTask("A", "", "high");
    const t2 = createTask("B", "", "low");
    t1.tags = ["work"];
    t2.tags = ["work", "personal"];
    t1.status = "done";
    storage.add(t1);
    storage.add(t2);
    const stats = storage.stats();
    expect(stats.total).toBe(2);
    expect(stats.byStatus["done"]).toBe(1);
    expect(stats.byStatus["todo"]).toBe(1);
    expect(stats.byPriority["high"]).toBe(1);
    expect(stats.byPriority["low"]).toBe(1);
    expect(stats.byTag["work"]).toBe(2);
    expect(stats.byTag["personal"]).toBe(1);
    expect(stats.completionRate).toBe(50);
  });

  it("should calculate completion rate correctly", () => {
    const storage = new Storage(filePath);
    for (let i = 0; i < 4; i++) {
      const task = createTask(`Task ${i}`);
      if (i < 2) task.status = "done";
      storage.add(task);
    }
    const stats = storage.stats();
    expect(stats.completionRate).toBe(50);
  });

  it("should show 100% completion when all done", () => {
    const storage = new Storage(filePath);
    const task = createTask("Done");
    task.status = "done";
    storage.add(task);
    expect(storage.stats().completionRate).toBe(100);
  });

  it("should show 0% completion when empty", () => {
    const storage = new Storage(filePath);
    expect(storage.stats().completionRate).toBe(0);
  });

  it("should export JSON", () => {
    const storage = new Storage(filePath);
    storage.add(createTask("Export test"));
    const json = storage.exportJSON();
    const parsed = JSON.parse(json);
    expect(parsed.length).toBe(1);
    expect(parsed[0].title).toBe("Export test");
  });

  it("should export CSV", () => {
    const storage = new Storage(filePath);
    storage.add(createTask("CSV export"));
    const csv = storage.exportCSV();
    expect(csv).toContain("id,title,description");
    expect(csv).toContain("CSV export");
  });

  it("should import JSON", () => {
    const storage = new Storage(filePath);
    const data = JSON.stringify({
      tasks: [
        createTask("Imported A"),
        createTask("Imported B"),
      ],
      lastUpdated: new Date().toISOString(),
    });
    const count = storage.importJSON(data);
    expect(count).toBe(2);
    expect(storage.getAll().length).toBe(2);
  });

  it("should import CSV", () => {
    const storage = new Storage(filePath);
    const csv = [
      "id,title,description,priority,status,tags,created,updated,completedAt",
      "abc123,CSV Task,Description,high,todo,work;personal,2024-01-01T00:00:00.000Z,2024-01-01T00:00:00.000Z,",
    ].join("\n");
    const count = storage.importCSV(csv);
    expect(count).toBe(1);
    const task = storage.getAll()[0];
    expect(task.title).toBe("CSV Task");
    expect(task.priority).toBe("high");
    expect(task.tags).toEqual(["work", "personal"]);
  });

  it("should skip duplicate IDs on import", () => {
    const storage = new Storage(filePath);
    const task = createTask("Original");
    storage.add(task);
    const data = JSON.stringify({
      tasks: [task],
      lastUpdated: new Date().toISOString(),
    });
    const count = storage.importJSON(data);
    expect(count).toBe(0);
    expect(storage.getAll().length).toBe(1);
  });

  it("should sort by title", () => {
    const storage = new Storage(filePath);
    storage.add(createTask("Charlie"));
    storage.add(createTask("Alpha"));
    storage.add(createTask("Bravo"));
    const sorted = storage.sort(storage.getAll(), "title");
    expect(sorted.map((t) => t.title)).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("should sort by priority descending", () => {
    const storage = new Storage(filePath);
    storage.add(createTask("A", "", "low"));
    storage.add(createTask("B", "", "urgent"));
    storage.add(createTask("C", "", "high"));
    const sorted = storage.sort(storage.getAll(), "priority", "desc");
    expect(sorted[0].priority).toBe("urgent");
    expect(sorted[2].priority).toBe("low");
  });

  it("should add batch and skip duplicates", () => {
    const storage = new Storage(filePath);
    const tasks = [createTask("A"), createTask("B"), createTask("C")];
    storage.addBatch(tasks);
    expect(storage.getAll().length).toBe(3);
    const count = storage.addBatch(tasks);
    expect(count).toBe(0);
    expect(storage.getAll().length).toBe(3);
  });

  it("should persist to disk", () => {
    const s1 = new Storage(filePath);
    s1.add(createTask("Persisted"));
    const s2 = new Storage(filePath);
    expect(s2.getAll().length).toBe(1);
    expect(s2.getAll()[0].title).toBe("Persisted");
  });

  it("should return correct file path", () => {
    const storage = new Storage(filePath);
    expect(storage.getFilePath()).toBe(filePath);
  });
});

describe("Format", () => {
  it("should format task list without errors", async () => {
    const { formatTaskList } = await import("./format");
    const task = createTask("Format test");
    const output = formatTaskList([task]);
    expect(output).toContain("Format test");
  });

  it("should handle empty task list", async () => {
    const { formatTaskList } = await import("./format");
    const output = formatTaskList([]);
    expect(output).toContain("No tasks found");
  });
});
