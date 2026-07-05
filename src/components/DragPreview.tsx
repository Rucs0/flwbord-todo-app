import type { Task } from "../types";
import { CARD_COLOR_STYLES } from "../cardColors";

interface DragPreviewProps {
  task: Task;
  x: number;
  y: number;
}

// Renders a simplified floating copy of the dragged card, following the
// pointer. Earlier this cloned the real card's DOM node so native HTML5
// drag-and-drop could hand it to the browser as a custom drag image — now
// that dragging is driven entirely by our own pointer-event state, this can
// just be an ordinary bit of state-driven JSX instead of a manually
// cloned/positioned/cleaned-up DOM node.
function DragPreview({ task, x, y }: DragPreviewProps) {
  const cardColor = task.color ?? "default";

  return (
    <div
      className={`pointer-events-none fixed z-50 w-56 rounded-md border p-3 opacity-80 shadow-lg ${CARD_COLOR_STYLES[cardColor].card}`}
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
    >
      <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">
        {task.title}
      </h3>
      {task.description && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {task.description}
        </p>
      )}
    </div>
  );
}

export default DragPreview;
