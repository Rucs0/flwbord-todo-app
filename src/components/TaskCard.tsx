import { useState } from "react";
import type { DragEvent } from "react";
import type { CardColor, Task } from "../types";

interface TaskCardProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Omit<Task, "id">>) => void;
  onDelete: (id: string) => void;
}

const CARD_COLOR_OPTIONS: CardColor[] = [
  "default",
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
];

// Full literal class names (not built from a template string) so
// Tailwind's build-time scanner can find and generate them — same reason
// Column.tsx's ACCENT_STYLES is written this way.
const CARD_COLOR_STYLES: Record<CardColor, { card: string; swatch: string }> = {
  default: {
    card: "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800",
    swatch:
      "border border-slate-300 bg-white dark:border-slate-500 dark:bg-slate-800",
  },
  red: {
    card: "border-red-300 bg-red-100 dark:border-red-700 dark:bg-red-900/50",
    swatch: "bg-red-500",
  },
  orange: {
    card: "border-orange-300 bg-orange-100 dark:border-orange-700 dark:bg-orange-900/50",
    swatch: "bg-orange-500",
  },
  yellow: {
    card: "border-yellow-300 bg-yellow-100 dark:border-yellow-700 dark:bg-yellow-900/50",
    swatch: "bg-yellow-500",
  },
  green: {
    card: "border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/50",
    swatch: "bg-green-500",
  },
  blue: {
    card: "border-blue-300 bg-blue-100 dark:border-blue-700 dark:bg-blue-900/50",
    swatch: "bg-blue-500",
  },
  purple: {
    card: "border-purple-300 bg-purple-100 dark:border-purple-700 dark:bg-purple-900/50",
    swatch: "bg-purple-500",
  },
};

// A 1x1 transparent gif, used to blank out the browser's built-in drag
// ghost. Created once at module scope rather than per-render/per-drag,
// since it never changes.
const EMPTY_DRAG_IMAGE = new Image();
EMPTY_DRAG_IMAGE.src =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAIBTAA7";

function movePreview(preview: HTMLElement, x: number, y: number) {
  preview.style.transform = `translate(${x - preview.offsetWidth / 2}px, ${y - 20}px)`;
}

// Tracks the floating drag preview at module scope instead of inside the
// component (as a ref or state). Only one drag can be active anywhere in
// the app at a time, and — as the bug this fixes demonstrated — tying its
// lifetime to a specific TaskCard instance is fragile: dropping a card
// onto a *different* column changes its status, which makes React unmount
// this exact card (it's now rendered by a different Column) before the
// browser gets a chance to fire "dragend" on it. dragend never fires on a
// node that's already been removed from the document, so per-instance
// cleanup silently never runs. A module-level reference doesn't care
// whether any particular component is still mounted.
let activePreview: HTMLElement | null = null;

function removeActivePreview() {
  if (activePreview) {
    document.body.removeChild(activePreview);
    activePreview = null;
  }
}

function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  // Whether this card shows its edit form instead of static text. Local to
  // this card — no sibling component needs to know one card is mid-edit.
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);

  // Purely visual (dims the card while it's being dragged) — the actual
  // status change happens in the Column's onDrop, not here.
  const [isDragging, setIsDragging] = useState(false);

  // Whether the color swatch row is showing. Local UI state, same as
  // isEditing — no other component needs to know a card's picker is open.
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const cardColor = task.color ?? "default";

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    // The dragged task's id is the only thing a Column needs to know which
    // task to update on drop — native DnD passes data through dataTransfer,
    // not React props, since drag source and drop target aren't related.
    event.dataTransfer.setData("text/plain", task.id);
    event.dataTransfer.effectAllowed = "move";
    setIsDragging(true);

    // Even with a custom setDragImage, the browser composites its own
    // ghost with its own alpha blending — the card's rounded corners and
    // edges don't survive that blending evenly, so the sides end up more
    // transparent than the middle no matter what we hand it. Blanking the
    // native ghost out and drawing our own fixed-position clone instead
    // means the "drag preview" is just an ordinary DOM element with a flat
    // CSS opacity — no browser drag-image compositing involved at all.
    event.dataTransfer.setDragImage(EMPTY_DRAG_IMAGE, 0, 0);

    const card = event.currentTarget;
    const preview = card.cloneNode(true) as HTMLElement;
    preview.style.width = `${card.offsetWidth}px`;
    preview.style.position = "fixed";
    preview.style.top = "0px";
    preview.style.left = "0px";
    preview.style.margin = "0";
    preview.style.boxShadow = "none";
    preview.style.opacity = "0.6";
    preview.style.pointerEvents = "none";
    preview.style.zIndex = "50";
    movePreview(preview, event.clientX, event.clientY);
    document.body.appendChild(preview);
    activePreview = preview;

    // A capture-phase listener runs *before* the Column's onDrop (a
    // bubble-phase handler) does — so it fires, and cleans up the
    // preview, before the status-change state update (and the unmount
    // that can follow it) happens. "once" removes the listener itself
    // right after it fires, so they don't pile up across drags.
    document.addEventListener("drop", removeActivePreview, {
      capture: true,
      once: true,
    });
  }

  function handleDrag(event: DragEvent<HTMLDivElement>) {
    // Fires continuously with the live cursor position while dragging.
    // Browsers report (0, 0) for the final "drag" event right before
    // dragend fires — ignore that one so the preview doesn't jump there.
    if (event.clientX === 0 && event.clientY === 0) return;
    if (activePreview) movePreview(activePreview, event.clientX, event.clientY);
  }

  function handleDragEnd() {
    setIsDragging(false);
    // Covers the "dropped outside any column" case: no "drop" event fires
    // at all there, but dragend still fires here since nothing caused
    // this card to unmount, so this is a safe second cleanup path.
    document.removeEventListener("drop", removeActivePreview, {
      capture: true,
    });
    removeActivePreview();
  }

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
      draggable
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className={`cursor-grab rounded-md border p-3 transition-colors active:cursor-grabbing ${
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
            className="rounded-sm hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 dark:hover:text-slate-300"
            aria-label="Change card color"
          >
            🎨
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-sm hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 dark:hover:text-slate-300"
            aria-label="Edit task"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="rounded-sm hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 dark:hover:text-red-400"
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
              className={`h-5 w-5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 ${CARD_COLOR_STYLES[color].swatch} ${
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
