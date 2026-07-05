import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { DropTarget, Status } from "../types";

// Below this many CSS pixels of movement, a pointer-down-then-up is treated
// as a tap (so card buttons keep working) rather than a drag.
const DRAG_THRESHOLD_PX = 8;

export interface DragState {
  taskId: string;
  pointerX: number;
  pointerY: number;
  overStatus: Status | null;
  dropTarget: DropTarget;
}

interface HitTestResult {
  overStatus: Status | null;
  dropTarget: DropTarget;
}

// Columns and cards mark themselves with data-column-status / data-task-id;
// elementFromPoint + closest() finds them without any ref bookkeeping.
function hitTest(
  clientX: number,
  clientY: number,
  draggedTaskId: string,
): HitTestResult {
  const element = document.elementFromPoint(clientX, clientY);

  const columnElement = element?.closest<HTMLElement>("[data-column-status]");
  const overStatus =
    (columnElement?.dataset.columnStatus as Status | undefined) ?? null;

  const cardElement = element?.closest<HTMLElement>("[data-task-id]");
  const cardTaskId = cardElement?.dataset.taskId;
  let dropTarget: DropTarget = null;
  if (cardElement && cardTaskId && cardTaskId !== draggedTaskId) {
    const rect = cardElement.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    dropTarget = {
      taskId: cardTaskId,
      position: clientY < midpoint ? "before" : "after",
    };
  }

  return { overStatus, dropTarget };
}

// On mobile, columns are full-width swipeable panels (see Column.tsx) — only
// the current one, plus a peek of the next, is ever on screen. Without
// this, dragging into a column you can't fully see would be the only way
// to reach it, so instead the board scrolls that column into view for you
// the moment the drag crosses into it.
function scrollColumnIntoView(status: Status) {
  const columnElement = document.querySelector<HTMLElement>(
    `[data-column-status="${status}"]`,
  );
  columnElement?.scrollIntoView({
    behavior: "smooth",
    inline: "center",
    block: "nearest",
  });
}

// Custom drag-and-drop built on the Pointer Events API instead of native
// HTML5 drag-and-drop — HTML5 DnD never fires from a touchscreen, so it
// can't move a card on a phone at all. Pointer events unify mouse, touch,
// and pen under one API, which is what lets one implementation serve both.
function useDragAndDrop(
  onMoveTask: (taskId: string, status: Status, target: DropTarget) => void,
) {
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Everything the long-lived window listeners need to read lives in this
  // ref, not in `dragState` — reading React state from a closure captured
  // at pointerdown time would only ever see that render's stale value.
  const pendingRef = useRef<{
    taskId: string;
    pointerId: number;
    startX: number;
    startY: number;
    dragStarted: boolean;
    lastOverStatus: Status | null;
  } | null>(null);

  function handlePointerMove(event: PointerEvent) {
    const pending = pendingRef.current;
    if (!pending || event.pointerId !== pending.pointerId) return;

    if (!pending.dragStarted) {
      const dx = event.clientX - pending.startX;
      const dy = event.clientY - pending.startY;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      pending.dragStarted = true;
      setDragState({
        taskId: pending.taskId,
        pointerX: event.clientX,
        pointerY: event.clientY,
        overStatus: null,
        dropTarget: null,
      });
      return;
    }

    const { overStatus, dropTarget } = hitTest(
      event.clientX,
      event.clientY,
      pending.taskId,
    );

    if (overStatus && overStatus !== pending.lastOverStatus) {
      pending.lastOverStatus = overStatus;
      scrollColumnIntoView(overStatus);
    }

    setDragState({
      taskId: pending.taskId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      overStatus,
      dropTarget,
    });
  }

  function endDrag(event: PointerEvent, commit: boolean) {
    const pending = pendingRef.current;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);
    window.removeEventListener("pointercancel", handlePointerCancel);
    pendingRef.current = null;

    if (commit && pending?.dragStarted) {
      const { overStatus, dropTarget } = hitTest(
        event.clientX,
        event.clientY,
        pending.taskId,
      );
      if (overStatus) onMoveTask(pending.taskId, overStatus, dropTarget);
    }
    setDragState(null);
  }

  function handlePointerUp(event: PointerEvent) {
    endDrag(event, true);
  }

  function handlePointerCancel(event: PointerEvent) {
    endDrag(event, false);
  }

  function handlePointerDown(
    taskId: string,
    event: ReactPointerEvent<HTMLElement>,
  ) {
    if (event.button !== 0) return; // ignore right-click etc.

    pendingRef.current = {
      taskId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragStarted: false,
      lastOverStatus: null,
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerCancel);
  }

  return { dragState, handlePointerDown };
}

export default useDragAndDrop;
