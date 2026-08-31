# TaskFlow CLI

Interactive task manager with persistent state and colored output.

## Features

- Add, edit, complete, cancel, delete tasks
- Priority levels: low, medium, high, urgent
- Tag-based filtering
- Search across title, description, and tags
- Statistics dashboard
- JSON export
- Persistent storage (~/.taskflow.json)
- Colored terminal output

## Build

```bash
npm install
npm run build
```

## Usage

```bash
# Add tasks
taskflow add "Fix login bug" -d "Auth token not refreshing" -p high -t auth
taskflow add "Write docs" -p low -t docs

# List tasks
taskflow list
taskflow list -s todo -p high -v

# Mark progress
taskflow progress abc12345
taskflow done abc12345

# Edit
taskflow edit abc12345 -t "Fixed login bug" -p urgent

# Search
taskflow search login

# Statistics
taskflow stats

# Export
taskflow export > tasks.json
```

## License

MIT
