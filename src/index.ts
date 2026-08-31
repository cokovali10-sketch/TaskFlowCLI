#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { createTask } from "./models";
import { Storage } from "./storage";
import { formatTaskList, formatTask, formatStats, formatSuccess, formatError, formatInfo } from "./format";

const program = new Command();
const storage = new Storage();

program
  .name("taskflow")
  .description("TaskFlow CLI — Interactive task manager")
  .version("1.0.0");

program
  .command("add <title>")
  .description("Add a new task")
  .option("-d, --description <desc>", "Task description")
  .option("-p, --priority <level>", "Priority: low, medium, high, urgent", "medium")
  .option("-t, --tag <tags...>", "Tags")
  .action((title: string, opts: any) => {
    const task = createTask(title, opts.description || "", opts.priority);
    if (opts.tag) task.tags = opts.tag;
    storage.add(task);
    console.log(formatSuccess(`Task created: ${task.id.slice(0, 8)}`));
    console.log(formatTask(task, true));
  });

program
  .command("list")
  .description("List all tasks")
  .option("-s, --status <status>", "Filter by status")
  .option("-p, --priority <priority>", "Filter by priority")
  .option("-t, --tag <tag>", "Filter by tag")
  .option("-v, --verbose", "Show details")
  .action((opts: any) => {
    let tasks = storage.getAll();
    if (opts.status) tasks = tasks.filter((t) => t.status === opts.status);
    if (opts.priority) tasks = tasks.filter((t) => t.priority === opts.priority);
    if (opts.tag) tasks = tasks.filter((t) => t.tags.includes(opts.tag));
    console.log(chalk.bold("\n  TaskFlow Tasks"));
    console.log(formatTaskList(tasks, opts.verbose));
  });

program
  .command("done <id>")
  .description("Mark task as done")
  .action((id: string) => {
    const task = storage.update(id, { status: "done" });
    if (task) {
      console.log(formatSuccess(`Task completed: ${task.title}`));
    } else {
      console.log(formatError("Task not found"));
    }
  });

program
  .command("progress <id>")
  .description("Mark task as in progress")
  .action((id: string) => {
    const task = storage.update(id, { status: "in_progress" });
    if (task) {
      console.log(formatSuccess(`Task in progress: ${task.title}`));
    } else {
      console.log(formatError("Task not found"));
    }
  });

program
  .command("cancel <id>")
  .description("Cancel a task")
  .action((id: string) => {
    const task = storage.update(id, { status: "cancelled" });
    if (task) {
      console.log(formatSuccess(`Task cancelled: ${task.title}`));
    } else {
      console.log(formatError("Task not found"));
    }
  });

program
  .command("edit <id>")
  .description("Edit a task")
  .option("-t, --title <title>", "New title")
  .option("-d, --description <desc>", "New description")
  .option("-p, --priority <level>", "New priority")
  .action((id: string, opts: any) => {
    const updates: any = {};
    if (opts.title) updates.title = opts.title;
    if (opts.description) updates.description = opts.description;
    if (opts.priority) updates.priority = opts.priority;
    const task = storage.update(id, updates);
    if (task) {
      console.log(formatSuccess("Task updated"));
      console.log(formatTask(task, true));
    } else {
      console.log(formatError("Task not found"));
    }
  });

program
  .command("rm <id>")
  .description("Delete a task")
  .action((id: string) => {
    if (storage.remove(id)) {
      console.log(formatSuccess("Task deleted"));
    } else {
      console.log(formatError("Task not found"));
    }
  });

program
  .command("search <query>")
  .description("Search tasks")
  .action((query: string) => {
    const tasks = storage.search(query);
    console.log(chalk.bold(`\n  Search: "${query}"`));
    console.log(formatTaskList(tasks));
  });

program
  .command("stats")
  .description("Show task statistics")
  .action(() => {
    console.log(formatStats(storage.stats()));
  });

program
  .command("export")
  .description("Export tasks as JSON")
  .action(() => {
    console.log(JSON.stringify(storage.getAll(), null, 2));
  });

program.parse();
