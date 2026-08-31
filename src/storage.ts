import * as fs from "fs";
import * as path from "path";
import { Task, TaskStore, serializeStore, deserializeStore } from "./models";

const DEFAULT_PATH = path.join(process.env.HOME || process.env.USERPROFILE || ".", ".taskflow.json");

export class Storage {
  private filePath: string;
  private store: TaskStore;

  constructor(filePath?: string) {
    this.filePath = filePath || DEFAULT_PATH;
    this.store = this.load();
  }

  private load(): TaskStore {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, "utf-8");
        return deserializeStore(data);
      }
    } catch {}
    return { tasks: [], lastUpdated: new Date().toISOString() };
  }

  private save(): void {
    this.store.lastUpdated = new Date().toISOString();
    fs.writeFileSync(this.filePath, serializeStore(this.store), "utf-8");
  }

  getAll(): Task[] {
    return this.store.tasks;
  }

  getById(id: string): Task | undefined {
    return this.store.tasks.find((t) => t.id === id || t.id.startsWith(id));
  }

  add(task: Task): void {
    this.store.tasks.push(task);
    this.save();
  }

  update(id: string, updates: Partial<Omit<Task, "id" | "created">>): Task | null {
    const idx = this.store.tasks.findIndex((t) => t.id === id || t.id.startsWith(id));
    if (idx === -1) return null;
    const { updateTask } = require("./models");
    this.store.tasks[idx] = updateTask(this.store.tasks[idx], updates);
    this.save();
    return this.store.tasks[idx];
  }

  remove(id: string): boolean {
    const idx = this.store.tasks.findIndex((t) => t.id === id || t.id.startsWith(id));
    if (idx === -1) return false;
    this.store.tasks.splice(idx, 1);
    this.save();
    return true;
  }

  search(query: string): Task[] {
    const q = query.toLowerCase();
    return this.store.tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  }

  filter(opts: { status?: string; priority?: string; tag?: string }): Task[] {
    return this.store.tasks.filter((t) => {
      if (opts.status && t.status !== opts.status) return false;
      if (opts.priority && t.priority !== opts.priority) return false;
      if (opts.tag && !t.tags.includes(opts.tag)) return false;
      return true;
    });
  }

  stats(): { total: number; byStatus: Record<string, number>; byPriority: Record<string, number> } {
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    for (const t of this.store.tasks) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    }
    return { total: this.store.tasks.length, byStatus, byPriority };
  }

  getFilePath(): string {
    return this.filePath;
  }
}
