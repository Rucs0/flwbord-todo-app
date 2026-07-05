import { useState } from "react";
import type { Status, Task } from "./types";
import Board from "./components/Board";
import AddTaskModal from "./components/AddTaskModal";
import useLocalStorage from "./hooks/useLocalStorage";

// Seed data — only used the very first time the app runs on a given
// browser. Once useLocalStorage has written a value under this key, that
// stored value takes over on every later load, seed data included.
const SAMPLE_TASKS: Task[] = [
  {
    id: "1",
    title: "Design database schema",
    description: "Draft the ERD for core entities",
    status: "todo",
  },
  {
    id: "2",
    title: "Set up CI pipeline",
    description: "",
    status: "todo",
  },
  {
    id: "3",
    title: "Build login form",
    description: "Email + password validation",
    status: "in-progress",
  },
  {
    id: "4",
    title: "Write project README",
    description: "",
    status: "done",
  },
];

function App() {
  // Tasks live in App because Board, every Column, every TaskCard, and the
  // modal all need to read or mutate the same list — lifting it here avoids
  // each column keeping its own out-of-sync copy. useLocalStorage swaps in
  // for useState here with no other code changes, since it returns the
  // same [value, setValue] shape — every setTasks call below already
  // persists automatically.
  const [tasks, setTasks] = useLocalStorage<Task[]>("flowboard-tasks", SAMPLE_TASKS);

  // Whether the "add task" modal is showing. Pure UI state — it doesn't
  // describe a task, just what's currently rendered — so it stays local
  // to App rather than living in the task list.
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleAddTask(title: string, description: string) {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      status: "todo",
      color: "default",
    };
    setTasks((prev) => [...prev, newTask]);
    setIsModalOpen(false);
  }

  // Generic partial update — reused for title/description edits now, and
  // for status changes once Stage 3 wires up drag-and-drop.
  function handleUpdateTask(id: string, updates: Partial<Omit<Task, "id">>) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task)),
    );
  }

  function handleDeleteTask(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }

  // Drag-and-drop reordering: moves `taskId` into `status`, positioned
  // relative to `target` (another task's id + whether to land before or
  // after it), or appended to the column's end if `target` is null.
  //
  // We anchor on the target's *id* rather than a numeric index because the
  // dragged task is still present (at its old position) in whatever index
  // the Column last measured — removing it before inserting would shift
  // every index after it by one. Re-finding the anchor by id in the
  // already-filtered `rest` array sidesteps that off-by-one entirely.
  function handleMoveTask(
    taskId: string,
    status: Status,
    target: { taskId: string; position: "before" | "after" } | null,
  ) {
    setTasks((prev) => {
      const taskToMove = prev.find((task) => task.id === taskId);
      if (!taskToMove) return prev;

      const rest = prev.filter((task) => task.id !== taskId);
      const movedTask: Task = { ...taskToMove, status };

      if (target === null || target.taskId === taskId) {
        // No specific card targeted — append after the last task already
        // in this column (or at the very end if the column is empty).
        const lastIndexInColumn = rest.reduce(
          (last, task, index) => (task.status === status ? index : last),
          -1,
        );
        const insertAt = lastIndexInColumn + 1;
        return [
          ...rest.slice(0, insertAt),
          movedTask,
          ...rest.slice(insertAt),
        ];
      }

      const targetIndex = rest.findIndex((task) => task.id === target.taskId);
      if (targetIndex === -1) return [...rest, movedTask];

      const insertAt = target.position === "before" ? targetIndex : targetIndex + 1;
      return [...rest.slice(0, insertAt), movedTask, ...rest.slice(insertAt)];
    });
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
        <h1 className="text-xl font-bold text-slate-800">FlowBoard</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 sm:px-4"
        >
          + Add Task
        </button>
      </header>
      <Board
        tasks={tasks}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onMoveTask={handleMoveTask}
      />
      {isModalOpen && (
        <AddTaskModal
          onAdd={handleAddTask}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
