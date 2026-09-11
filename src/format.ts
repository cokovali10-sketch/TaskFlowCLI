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

const STATUS_ICONS: Record<Status, string> = {
  todo: "\u25CB",
  in_progress: "\u25D0",
  done: "\u25CF",
  cancelled: "\u2298",
};

export function formatTask(task: Task, verbose: boolean = false): string {
  const pri = PRIORITY_COLORS[task.priority];
  const status = STATUS_LABELS[task.status];
  const icon = STATUS_ICONS[task.status];
  const id = chalk.gray(task.id.slice(0, 8));
  const title = task.status === "done" ? chalk.strikethrough(task.title) : task.title;

  let line = `  ${id}  ${icon} ${status}  ${pri("[" + task.priority + "]")}  ${title}`;

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

export function formatStats(stats: {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byTag: Record<string, number>;
  oldestTask: string | null;
  newestTask: string | null;
  completionRate: number;
}): string {
  const lines = [
    chalk.bold("\n  Task Statistics"),
    chalk.dim("  " + "\u2500".repeat(40)),
    `  Total:          ${chalk.bold(String(stats.total))}`,
    `  Completion:     ${chalk.bold(stats.completionRate + "%")}`,
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

  if (Object.keys(stats.byTag).length > 0) {
    lines.push("", "  By Tag:");
    for (const [tag, count] of Object.entries(stats.byTag)) {
      lines.push(`    ${chalk.cyan("#" + tag)}: ${count}`);
    }
  }

  if (stats.oldestTask) {
    lines.push("", `  Oldest: ${chalk.dim(new Date(stats.oldestTask).toLocaleDateString())}`);
  }
  if (stats.newestTask) {
    lines.push(`  Newest: ${chalk.dim(new Date(stats.newestTask).toLocaleDateString())}`);
  }

  return lines.join("\n");
}

export function formatSuccess(msg: string): string {
  return chalk.green("  \u2713 " + msg);
}

export function formatError(msg: string): string {
  return chalk.red("  \u2717 " + msg);
}

export function formatInfo(msg: string): string {
  return chalk.cyan("  \u2139 " + msg);
}
