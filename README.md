<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f172a,50:38bdf8,100:a78bfa&height=160&section=header&text=TaskFlowCLI&fontSize=48&fontColor=ffffff&fontAlignY=38&animation=fadeIn" alt="header" />

</div>

# TaskFlow CLI

> A fast, terminal-based task manager built with TypeScript

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://img.shields.io/badge/CI-passing-brightgreen)](#)

---

## Features

- **Full CRUD** -- Create, read, update, delete tasks from the terminal
- **Priority system** -- Four levels: low, medium, high, urgent
- **Status tracking** -- Todo, in-progress, done, cancelled
- **Tag system** -- Organize tasks with custom tags
- **Search** -- Plain text or regex across title, description, and tags
- **Sorting** -- By title, priority, status, or date
- **Import/Export** -- JSON and CSV formats
- **Detailed statistics** -- Completion rates, breakdowns by status/priority/tag
- **Persistent storage** -- Saves to `~/.taskflow.json` automatically
- **Colored output** -- Syntax-highlighted terminal display
- **Partial ID matching** -- Use the first few characters of any task ID

## Installation

```bash
# Clone and build from source
git clone https://github.com/yourname/taskflow-cli.git
cd taskflow-cli
npm install
npm run build

# Link globally (optional)
npm link
```

## CLI Commands

| Command | Description | Example |
|---------|-------------|---------|
| `taskflow add <title>` | Create a new task | `taskflow add "Fix bug" -p high -t auth` |
| `taskflow list` | List all tasks | `taskflow list -s todo -p high -v` |
| `taskflow done <id>` | Mark task as done | `taskflow done a1b2c3d4` |
| `taskflow progress <id>` | Mark as in-progress | `taskflow progress a1b2c3d4` |
| `taskflow cancel <id>` | Cancel a task | `taskflow cancel a1b2c3d4` |
| `taskflow edit <id>` | Edit task fields | `taskflow edit a1b2c3d4 -t "New title"` |
| `taskflow rm <id>` | Delete a task | `taskflow rm a1b2c3d4` |
| `taskflow search <query>` | Search tasks | `taskflow search login -r "^Fix"` |
| `taskflow sort <field>` | Sort tasks | `taskflow sort priority -o desc` |
| `taskflow stats` | View statistics | `taskflow stats` |
| `taskflow export` | Export tasks | `taskflow export -f csv -o tasks.csv` |
| `taskflow import <file>` | Import tasks | `taskflow import backup.json` |

### Options

| Flag | Short | Description |
|------|-------|-------------|
| `--priority` | `-p` | Set priority level |
| `--description` | `-d` | Add description |
| `--tag` | `-t` | Add tags (space-separated) |
| `--status` | `-s` | Filter by status |
| `--verbose` | `-v` | Show full task details |
| `--regex` | `-r` | Use regex in search |
| `--order` | `-o` | Sort order: asc/desc |
| `--format` | `-f` | Export format: json/csv |
| `--output` | `-o` | Output file path |

## Terminal Output

```
  TaskFlow Tasks
  a1b2c3d4  ● DONE  [high]     Fix login bug
         Auth token not refreshing
         #auth #urgent
         created: 1/15/2026, 10:30:00 AM
         completed: 1/16/2026, 2:45:00 PM

  e5f6g7h8  ◐ PROG [medium]   Write documentation
         API docs for v2 endpoints
         #docs #api
         created: 1/14/2026, 9:00:00 AM

  i9j0k1l2  ○ TODO  [low]      Update README
         Add badges and examples
         #docs
         created: 1/13/2026, 3:15:00 PM

  ──────────────────────────────────────────
  Task Statistics
  ──────────────────────────────────────────
  Total:          3
  Completion:     33%

  By Status:
    DONE: 1
    PROG: 1
    TODO: 1

  By Priority:
    high: 1
    medium: 1
    low: 1

  By Tag:
    #docs: 2
    #auth: 1
    #urgent: 1
    #api: 1
```

## Storage Format

TaskFlow stores all data in `~/.taskflow.json` as a JSON file:

```json
{
  "tasks": [
    {
      "id": "a1b2c3d4-e5f6-...",
      "title": "Fix login bug",
      "description": "Auth token not refreshing",
      "priority": "high",
      "status": "done",
      "tags": ["auth", "urgent"],
      "created": "2026-01-15T10:30:00.000Z",
      "updated": "2026-01-16T14:45:00.000Z",
      "completedAt": "2026-01-16T14:45:00.000Z"
    }
  ],
  "lastUpdated": "2026-01-16T14:45:00.000Z"
}
```

## Programmatic API

Use TaskFlow as a library in your own TypeScript/JavaScript projects:

```typescript
import { createTask, updateTask } from "taskflow-cli/dist/models";
import { Storage } from "taskflow-cli/dist/storage";

// Create a task
const task = createTask("My task", "Description", "high");
task.tags = ["work"];

// Use a custom storage path
const storage = new Storage("/path/to/my-tasks.json");
storage.add(task);

// Query tasks
const highPriority = storage.filter({ priority: "high" });
const results = storage.search("login");
const regexResults = storage.searchRegex("^Fix.*bug$");

// Sort
const sorted = storage.sort(storage.getAll(), "priority", "desc");

// Statistics
const stats = storage.stats();
console.log(stats.completionRate); // 75

// Import/Export
const csv = storage.exportCSV();
storage.importJSON(jsonString);
```

## Project Structure

```
taskflow-cli/
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI
├── src/
│   ├── index.ts            # CLI entry point (Commander setup)
│   ├── models.ts           # Task types, create/update/serialize
│   ├── storage.ts          # Storage class (CRUD, search, import/export)
│   ├── format.ts           # Terminal output formatting (chalk)
│   └── test.ts             # Vitest test suite
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type check
npm run lint
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT License. See [LICENSE](LICENSE) for details.
