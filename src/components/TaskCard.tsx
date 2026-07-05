import { useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Task } from "../types";
import { CARD_COLOR_OPTIONS, CARD_COLOR_STYLES } from "../cardColors";

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
  onUpdate: (id: string, updates: Partial<Omit<Task, "id">>) => void;
  onDelete: (id: string) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
}

function TaskCard({
  task,
  isDragging,
  onUpdate,
  onDelete,
  onPointerDown,
}: TaskCardProps) {
  // Whether this card shows its edit form instead of static text. Local to
  // this card — no sibling component needs to know one card is mid-edit.
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);

  // Whether the color swatch row is showing. Local UI state, same as
  // isEditing — no other component needs to know a card's picker is open.
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const cardColor = task.color ?? "default";

  function handleSave() {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return; // title required, same rule as AddTaskModal
    onUpdate(task.id, { title: trimmedTitle, description: description.trim() });
    setIsEditing(false);
  }

  function handleCancel() {
    setTitle(task.title);
    setDescription(task.description);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="rounded-md border border-indigo-300 bg-white p-3 shadow-sm dark:border-indigo-700 dark:bg-slate-800">
        <input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          className="mt-2 w-full resize-none rounded-md border border-slate-300 px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-indigo-900"
        />
        <div className="mt-2 flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="rounded-sm text-xs text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-sm text-xs font-medium text-indigo-600 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-task-id={task.id}
      onPointerDown={onPointerDown}
      className={`touch-none cursor-grab rounded-md border p-3 transition-colors select-none active:cursor-grabbing ${
        isDragging
          ? "border-slate-300 bg-slate-200 dark:border-slate-600 dark:bg-slate-700"
          : `${CARD_COLOR_STYLES[cardColor].card} shadow-sm`
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">
          {task.title}
        </h3>
        <div className="flex shrink-0 gap-1 text-xs text-slate-400 dark:text-slate-500">
          <button
            onClick={() => setIsPickerOpen((open) => !open)}
            className="rounded-sm p-1 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 dark:hover:text-slate-300"
            aria-label="Change card color"
          >
            🎨
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-sm p-1 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 dark:hover:text-slate-300"
            aria-label="Edit task"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="rounded-sm p-1 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 dark:hover:text-red-400"
            aria-label="Delete task"
          >
            ✕
          </button>
        </div>
      </div>
      {isPickerOpen && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {CARD_COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              onClick={() => {
                onUpdate(task.id, { color });
                setIsPickerOpen(false);
              }}
              aria-label={`Set card color to ${color}`}
              className={`h-6 w-6 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 ${CARD_COLOR_STYLES[color].swatch} ${
                cardColor === color
                  ? "ring-2 ring-offset-1 ring-slate-500 dark:ring-slate-300 dark:ring-offset-slate-800"
                  : ""
              }`}
            />
          ))}
        </div>
      )}
      {task.description && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {task.description}
        </p>
      )}
    </div>
  );
}

export default TaskCard;
