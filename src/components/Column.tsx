import { useState } from "react";
import type { DragEvent } from "react";
import type { Status, Task } from "../types";
import TaskCard from "./TaskCard";

export type ColumnAccent = "slate" | "amber" | "green";

// Tailwind's JIT scanner needs full literal class names to appear somewhere
// in the source — a template string like `border-t-${accent}-400` wouldn't
// get picked up, so each accent's classes are spelled out here in full.
const ACCENT_STYLES: Record<
  ColumnAccent,
  { border: string; badge: string; dot: string }
> = {
  slate: {
    border: "border-t-slate-400",
    badge: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    dot: "bg-slate-400",
  },
  amber: {
    border: "border-t-amber-400",
    badge:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    dot: "bg-amber-400",
  },
  green: {
    border: "border-t-green-400",
    badge:
      "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    dot: "bg-green-400",
  },
};

type DropTarget = { taskId: string; position: "before" | "after" } | null;

interface ColumnProps {
  title: string;
  status: Status;
  accent: ColumnAccent;
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Omit<Task, "id">>) => void;
  onDeleteTask: (id: string) => void;
  onMoveTask: (taskId: string, status: Status, target: DropTarget) => void;
}

function Column({
  title,
  status,
  accent,
  tasks,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
}: ColumnProps) {
  // Whether a dragged card is currently over this column at all — purely
  // visual (highlights the whole drop zone).
  const [isOver, setIsOver] = useState(false);

  // Which task the dragged card would land before/after if dropped right
  // now — drives the thin insertion-line indicator. null means "no specific
  // card targeted", i.e. it'll be appended to the end of the column.
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);

  const accentStyles = ACCENT_STYLES[accent];

  function handleColumnDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault(); // required for onDrop to fire at all
    setDropTarget(null);
  }

  function handleDragEnter() {
    setIsOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    // dragleave fires every time the pointer crosses a child element's
    // boundary too, not just when it truly exits the column — only clear
    // state when relatedTarget is outside this column entirely.
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsOver(false);
      setDropTarget(null);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    if (taskId) onMoveTask(taskId, status, dropTarget);
    setIsOver(false);
    setDropTarget(null);
  }

  function handleCardDragOver(taskId: string, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    // Stop this from also bubbling to the column's onDragOver, which would
    // otherwise reset dropTarget to null (append-to-end) right after we set
    // a precise one here.
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    setDropTarget({
      taskId,
      position: event.clientY < midpoint ? "before" : "after",
    });
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragOver={handleColumnDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex h-full min-w-[240px] flex-1 flex-col rounded-lg border border-slate-200 border-t-4 bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800/50 ${accentStyles.border} ${
        isOver
          ? "bg-indigo-50 ring-2 ring-indigo-400 dark:bg-indigo-950/40 dark:ring-indigo-500"
          : ""
      }`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${accentStyles.dot}`} />
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">
            {title}
          </h2>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${accentStyles.badge}`}
        >
          {tasks.length}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-slate-300 dark:text-slate-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-8 w-8"
              aria-hidden="true"
            >
              <rect x="6" y="4" width="12" height="16" rx="2" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"
              />
            </svg>
            <p className="text-sm italic text-slate-400 dark:text-slate-500">
              No tasks yet
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onDragOver={(event) => handleCardDragOver(task.id, event)}
              className="relative"
            >
              {dropTarget?.taskId === task.id &&
                dropTarget.position === "before" && (
                  <div className="absolute -top-1.5 left-0 right-0 h-0.5 rounded bg-indigo-500" />
                )}
              <TaskCard
                task={task}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
              />
              {dropTarget?.taskId === task.id &&
                dropTarget.position === "after" && (
                  <div className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded bg-indigo-500" />
                )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Column;
