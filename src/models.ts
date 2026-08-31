import { v4 as uuidv4 } from "uuid";

export type Priority = "low" | "medium" | "high" | "urgent";
export type Status = "todo" | "in_progress" | "done" | "cancelled";

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
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    title,
    description,
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

export function serializeStore(store: TaskStore): string {
  return JSON.stringify(store, null, 2);
}

export function deserializeStore(json: string): TaskStore {
  try {
    const data = JSON.parse(json);
    return {
      tasks: data.tasks || [],
      lastUpdated: data.lastUpdated || new Date().toISOString(),
    };
  } catch {
    return { tasks: [], lastUpdated: new Date().toISOString() };
  }
}
