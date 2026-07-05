import { useEffect, useState } from "react";
import type { DropTarget, Status, Task } from "./types";
import Board from "./components/Board";
import AddTaskModal from "./components/AddTaskModal";
import DragPreview from "./components/DragPreview";
import useLocalStorage from "./hooks/useLocalStorage";
import useDragAndDrop from "./hooks/useDragAndDrop";

type Theme = "light" | "dark";

// Mirrors the inline script in index.html, which already set the "dark"
// class on <html> before this module ever ran (to avoid a flash of the
// wrong theme) — this just figures out what that script decided, so
// useLocalStorage's initial value agrees with the DOM instead of fighting it.
function getInitialTheme(): Theme {
  const stored = window.localStorage.getItem("flowboard-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

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
  const [tasks, setTasks] = useLocalStorage<Task[]>(
    "flowboard-tasks",
    SAMPLE_TASKS,
  );

  // Whether the "add task" modal is showing. Pure UI state — it doesn't
  // describe a task, just what's currently rendered — so it stays local
  // to App rather than living in the task list.
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [theme, setTheme] = useLocalStorage<Theme>(
    "flowboard-theme",
    getInitialTheme(),
  );

  // The "dark" class is what every dark: utility in the app keys off of
  // (see the @custom-variant override in index.css) — useLocalStorage only
  // persists the value, so this effect is what actually applies it to the DOM.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

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
  function handleMoveTask(taskId: string, status: Status, target: DropTarget) {
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
        return [...rest.slice(0, insertAt), movedTask, ...rest.slice(insertAt)];
      }

      const targetIndex = rest.findIndex((task) => task.id === target.taskId);
      if (targetIndex === -1) return [...rest, movedTask];

      const insertAt =
        target.position === "before" ? targetIndex : targetIndex + 1;
      return [...rest.slice(0, insertAt), movedTask, ...rest.slice(insertAt)];
    });
  }

  const { dragState, handlePointerDown } = useDragAndDrop(handleMoveTask);
  const draggedTask = dragState
    ? tasks.find((task) => task.id === dragState.taskId)
    : undefined;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-800 sm:px-6">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          FlwBord
        </h1>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
            className="rounded-sm p-1 text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:text-slate-200"
          >
            {theme === "dark" ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                />
              </svg>
            )}
          </button>
          <a
            href="https://github.com/Rucs0/flowboard-todo-app"
            target="_blank"
            rel="noreferrer"
            aria-label="View source on GitHub"
            className="rounded-sm p-1 text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <svg className="h-5 w-5 fill-current" aria-hidden="true">
              <use href="/icons.svg#github-icon" />
            </svg>
          </a>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 sm:px-4"
          >
            + Add Task
          </button>
        </div>
      </header>
      <Board
        tasks={tasks}
        dragState={dragState}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onCardPointerDown={handlePointerDown}
      />
      {isModalOpen && (
        <AddTaskModal
          onAdd={handleAddTask}
          onClose={() => setIsModalOpen(false)}
        />
      )}
      {dragState && draggedTask && (
        <DragPreview
          task={draggedTask}
          x={dragState.pointerX}
          y={dragState.pointerY}
        />
      )}
    </div>
  );
}

export default App;
