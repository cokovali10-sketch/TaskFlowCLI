import { v4 as uuidv4 } from "uuid";

export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "todo" | "in_progress" | "done" | "cancelled";

export const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
export const STATUSES: Status[] = ["todo", "in_progress", "done", "cancelled"];

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  tags: string[];
  created: string;
  updated: string;
  completedAt?: string;
}

export interface TaskStore {
  tasks: Task[];
  lastUpdated: string;
}

export function createTask(title: string, description: string = "", priority: Priority = "medium"): Task {
  if (!title.trim()) throw new Error("Task title cannot be empty");
  if (!PRIORITIES.includes(priority)) throw new Error(`Invalid priority: ${priority}`);
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    title: title.trim(),
    description: description.trim(),
    priority,
    status: "todo",
    tags: [],
    created: now,
    updated: now,
  };
}

export function updateTask(task: Task, updates: Partial<Omit<Task, "id" | "created">>): Task {
  return {
    ...task,
    ...updates,
    updated: new Date().toISOString(),
    completedAt: updates.status === "done" ? new Date().toISOString() : task.completedAt,
  };
}

export function taskToCSV(task: Task): string {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  return [
    task.id,
    escape(task.title),
    escape(task.description),
    task.priority,
    task.status,
    escape(task.tags.join(";")),
    task.created,
    task.updated,
    task.completedAt || "",
  ].join(",");
}

export function serializeStore(store: TaskStore): string {
  return JSON.stringify(store, null, 2);
}

export function deserializeStore(json: string): TaskStore {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data.tasks)) throw new Error("Invalid store format");
    return {
      tasks: data.tasks.map((t: any) => ({
        id: t.id || uuidv4(),
        title: t.title || "Untitled",
        description: t.description || "",
        priority: PRIORITIES.includes(t.priority) ? t.priority : "medium",
        status: STATUSES.includes(t.status) ? t.status : "todo",
        tags: Array.isArray(t.tags) ? t.tags : [],
        created: t.created || new Date().toISOString(),
        updated: t.updated || new Date().toISOString(),
        completedAt: t.completedAt,
      })),
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    };
  } catch {
    return { tasks: [], lastUpdated: new Date().toISOString() };
  }
}
