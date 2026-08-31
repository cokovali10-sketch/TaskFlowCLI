import { createTask, updateTask, Task } from "./models";
import { Storage } from "./storage";

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function testModels() {
  const task = createTask("Test task", "Description", "high");
  assert(task.title === "Test task", "title mismatch");
  assert(task.priority === "high", "priority mismatch");
  assert(task.status === "todo", "status mismatch");
  assert(task.id.length > 0, "empty id");

  const updated = updateTask(task, { status: "done" });
  assert(updated.status === "done", "status not updated");
  assert(updated.completedAt !== undefined, "completedAt not set");
}

function testStorage() {
  const tmpPath = require("path").join(require("os").tmpdir(), `test_taskflow_${Date.now()}.json`);
  const storage = new Storage(tmpPath);

  const t1 = createTask("Task 1");
  const t2 = createTask("Task 2", "", "high");
  storage.add(t1);
  storage.add(t2);

  assert(storage.getAll().length === 2, "expected 2 tasks");
  assert(storage.getById(t1.id) !== undefined, "task 1 not found");

  const updated = storage.update(t1.id, { status: "done" });
  assert(updated?.status === "done", "update failed");

  assert(storage.remove(t2.id), "remove failed");
  assert(storage.getAll().length === 1, "expected 1 task after remove");

  const results = storage.search("Task");
  assert(results.length === 1, "search failed");

  const stats = storage.stats();
  assert(stats.total === 1, "stats total wrong");

  require("fs").unlinkSync(tmpPath);
}

function testPriority() {
  const low = createTask("Low", "", "low");
  const urgent = createTask("Urgent", "", "urgent");
  assert(low.priority === "low", "low priority");
  assert(urgent.priority === "urgent", "urgent priority");
}

function testTags() {
  const task = createTask("Tagged");
  task.tags = ["work", "important"];
  assert(task.tags.length === 2, "tags count");
  assert(task.tags.includes("work"), "missing work tag");
}

function testUpdateTimestamp() {
  const task = createTask("Timestamp test");
  const before = task.updated;
  const updated = updateTask(task, { title: "Updated" });
  assert(updated.title === "Updated", "title not updated");
  assert(updated.created === task.created, "created should not change");
}

const tests = [testModels, testStorage, testPriority, testTags, testUpdateTimestamp];
let passed = 0;
let failed = 0;

for (const test of tests) {
  try {
    test();
    console.log(`  PASS: ${test.name}`);
    passed++;
  } catch (e: any) {
    console.log(`  FAIL: ${test.name}: ${e.message}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
