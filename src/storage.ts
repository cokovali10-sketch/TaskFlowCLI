import * as fs from "fs";
import * as path from "path";
import { Task, TaskStore, serializeStore, deserializeStore, taskToCSV, PRIORITIES, STATUSES } from "./models";

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

  addBatch(tasks: Task[]): number {
    let count = 0;
    for (const task of tasks) {
      if (this.store.tasks.some((t) => t.id === task.id)) continue;
      this.store.tasks.push(task);
      count++;
    }
    this.save();
    return count;
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

  searchRegex(pattern: string): Task[] {
    try {
      const re = new RegExp(pattern, "i");
      return this.store.tasks.filter(
        (t) =>
          re.test(t.title) ||
          re.test(t.description) ||
          t.tags.some((tag) => re.test(tag))
      );
    } catch {
      return [];
    }
  }

  filter(opts: { status?: string; priority?: string; tag?: string }): Task[] {
    return this.store.tasks.filter((t) => {
      if (opts.status && t.status !== opts.status) return false;
      if (opts.priority && t.priority !== opts.priority) return false;
      if (opts.tag && !t.tags.includes(opts.tag)) return false;
      return true;
    });
  }

  sort(tasks: Task[], field: string, order: "asc" | "desc" = "asc"): Task[] {
    const sorted = [...tasks];
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (field) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "priority": {
          const ai = PRIORITIES.indexOf(a.priority);
          const bi = PRIORITIES.indexOf(b.priority);
          cmp = ai - bi;
          break;
        }
        case "status": {
          cmp = STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
          break;
        }
        case "created":
          cmp = new Date(a.created).getTime() - new Date(b.created).getTime();
          break;
        case "updated":
          cmp = new Date(a.updated).getTime() - new Date(b.updated).getTime();
          break;
        default:
          cmp = 0;
      }
      return order === "desc" ? -cmp : cmp;
    });
    return sorted;
  }

  stats(): {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    byTag: Record<string, number>;
    oldestTask: string | null;
    newestTask: string | null;
    completionRate: number;
  } {
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byTag: Record<string, number> = {};
    let oldestTask: string | null = null;
    let newestTask: string | null = null;

    for (const t of this.store.tasks) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      for (const tag of t.tags) {
        byTag[tag] = (byTag[tag] || 0) + 1;
      }
      if (!oldestTask || new Date(t.created) < new Date(oldestTask)) oldestTask = t.created;
      if (!newestTask || new Date(t.created) > new Date(newestTask)) newestTask = t.created;
    }

    const total = this.store.tasks.length;
    const doneCount = byStatus["done"] || 0;

    return {
      total,
      byStatus,
      byPriority,
      byTag,
      oldestTask,
      newestTask,
      completionRate: total > 0 ? Math.round((doneCount / total) * 100) : 0,
    };
  }

  exportJSON(): string {
    return JSON.stringify(this.store.tasks, null, 2);
  }

  exportCSV(): string {
    const header = "id,title,description,priority,status,tags,created,updated,completedAt";
    const rows = this.store.tasks.map(taskToCSV);
    return [header, ...rows].join("\n");
  }

  importJSON(json: string): number {
    const data = deserializeStore(json);
    return this.addBatch(data.tasks);
  }

  importCSV(csv: string): number {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return 0;

    const tasks: Task[] = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].match(/(".*?"|[^,]+)/g);
      if (!parts || parts.length < 9) continue;
      const unquote = (s: string) => s.replace(/^"|"$/g, "").replace(/""/g, '"');
      const task: Task = {
        id: parts[0],
        title: unquote(parts[1]),
        description: unquote(parts[2]),
        priority: (PRIORITIES.includes(parts[3] as any) ? parts[3] : "medium") as any,
        status: (STATUSES.includes(parts[4] as any) ? parts[4] : "todo") as any,
        tags: unquote(parts[5]).split(";").filter(Boolean),
        created: parts[6],
        updated: parts[7],
        completedAt: parts[8] || undefined,
      };
      tasks.push(task);
    }
    return this.addBatch(tasks);
  }

  getFilePath(): string {
    return this.filePath;
  }
}
