import chalk from "chalk";
import { Task, Priority, Status } from "./models";

const PRIORITY_COLORS: Record<Priority, typeof chalk.red> = {
  low: chalk.gray,
  medium: chalk.blue,
  high: chalk.yellow,
  urgent: chalk.red.bold,
};

const STATUS_LABELS: Record<Status, string> = {
  todo: chalk.gray("TODO"),
  in_progress: chalk.cyan("PROG"),
  done: chalk.green("DONE"),
  cancelled: chalk.red("CANC"),
};

export function formatTask(task: Task, verbose: boolean = false): string {
  const pri = PRIORITY_COLORS[task.priority];
  const status = STATUS_LABELS[task.status];
  const id = chalk.gray(task.id.slice(0, 8));
  const title = task.status === "done" ? chalk.strikethrough(task.title) : task.title;

  let line = `  ${id}  ${status}  ${pri("[" + task.priority + "]")}  ${title}`;

  if (verbose) {
    if (task.description) {
      line += `\n         ${chalk.dim(task.description)}`;
    }
    if (task.tags.length) {
      line += `\n         ${task.tags.map((t) => chalk.cyan("#" + t)).join(" ")}`;
    }
    line += `\n         ${chalk.dim("created: " + new Date(task.created).toLocaleString())}`;
    if (task.completedAt) {
      line += `\n         ${chalk.dim("completed: " + new Date(task.completedAt).toLocaleString())}`;
    }
  }

  return line;
}

export function formatTaskList(tasks: Task[], verbose: boolean = false): string {
  if (tasks.length === 0) {
    return chalk.dim("  No tasks found.");
  }
  return tasks.map((t) => formatTask(t, verbose)).join("\n");
}

export function formatStats(stats: { total: number; byStatus: Record<string, number>; byPriority: Record<string, number> }): string {
  const lines = [
    chalk.bold("\n  Task Statistics"),
    chalk.dim("  " + "─".repeat(40)),
    `  Total: ${chalk.bold(String(stats.total))}`,
    "",
    "  By Status:",
  ];
  for (const [status, count] of Object.entries(stats.byStatus)) {
    lines.push(`    ${STATUS_LABELS[status as Status] || status}: ${count}`);
  }
  lines.push("", "  By Priority:");
  for (const [pri, count] of Object.entries(stats.byPriority)) {
    const color = PRIORITY_COLORS[pri as Priority] || chalk.white;
    lines.push(`    ${color(pri)}: ${count}`);
  }
  return lines.join("\n");
}

export function formatSuccess(msg: string): string {
  return chalk.green("  ✓ " + msg);
}

export function formatError(msg: string): string {
  return chalk.red("  ✗ " + msg);
}

export function formatInfo(msg: string): string {
  return chalk.cyan("  ℹ " + msg);
}
