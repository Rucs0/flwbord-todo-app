# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc -b`) and produce a production build
- `npm run lint` — run ESLint over the project
- `npm run preview` — preview the production build locally

There is no test suite configured in this project.

## Architecture

FlowBoard is a single-page kanban board (React 19 + TypeScript + Vite + Tailwind v4, via `@tailwindcss/vite`). All app state lives in `src/App.tsx` and flows down through props — there is no state management library, router, or backend; persistence is `localStorage` only.

**Component tree:** `App` → `Board` → `Column` → `TaskCard`, plus `AddTaskModal` and `DragPreview` rendered conditionally by `App`.

- **`App.tsx`** owns the single source of truth: the `Task[]` array (via `useLocalStorage`, key `"flowboard-tasks"`) and the add-task modal's open/closed state. All mutations (`handleAddTask`, `handleUpdateTask`, `handleDeleteTask`, `handleMoveTask`) live here and are passed down as callbacks — child components never touch the task array directly. It also owns the drag session via `useDragAndDrop`.
- **`Board.tsx`** is stateless: it defines the three fixed columns (`todo` / `in-progress` / `done`), filters `tasks` into each `Column`, and forwards `dragState`/`onCardPointerDown` down unchanged.
- **`Column.tsx`** is now purely presentational for drag purposes — it derives `isOver`/`dropTarget` for itself from the shared `dragState` prop (`dragState?.overStatus === status`) rather than owning that state locally, since a drag can move from one column into a sibling one mid-gesture.
- **`TaskCard.tsx`** starts a drag via `onPointerDown` and renders its own dimmed state from the `isDragging` prop (`dragState?.taskId === task.id`, computed by `Column`). It also owns its own inline edit mode and its color-swatch picker, which stay purely local since no sibling needs to know about them.
- **`useLocalStorage.ts`** is a drop-in replacement for `useState` (same `[value, setValue]` return shape) that lazily reads from and syncs to `localStorage`, silently falling back to the caller's default on read/write errors.
- **`types.ts`** defines the two closed unions the whole app is built around: `Status` (`"todo" | "in-progress" | "done"`) and `CardColor`, plus the shared `DropTarget` type. `Task.color` is optional for backward compatibility with tasks persisted before the color feature existed — readers fall back to `"default"`.
- **`cardColors.ts`** holds `CARD_COLOR_OPTIONS`/`CARD_COLOR_STYLES`, shared between `TaskCard.tsx` and `DragPreview.tsx`. It's a plain module rather than living in `TaskCard.tsx` because `eslint-plugin-react-refresh` forbids a component file from also exporting non-component values.

**Drag-and-drop is custom, built on the Pointer Events API (`useDragAndDrop.ts`), not native HTML5 DnD.** HTML5 `draggable`/`dragstart` never fires from a touchscreen, so it can't support moving a card on a phone at all — Pointer Events unify mouse, touch, and pen under one API, which is what lets a single implementation serve both. Key points if you're touching this code:
- All drag state (`{ taskId, pointerX, pointerY, overStatus, dropTarget }`) lives in one place (the hook, called from `App.tsx`) and flows down as a prop, rather than each `Column` tracking its own drag-over state the way it did under HTML5 DnD — a single global drag has to be able to cross column boundaries.
- Hit-testing uses `document.elementFromPoint(x, y)` plus `data-column-status` / `data-task-id` attributes on `Column`/`TaskCard`'s root elements (`.closest()` from there) — not refs — so no measurement/registration bookkeeping is needed as columns/cards mount and unmount.
- A card only actually starts dragging once the pointer has moved `DRAG_THRESHOLD_PX` (8px) from its `pointerdown` origin; below that, it's treated as a tap so the card's edit/delete/color buttons keep working normally. This threshold state lives in a `ref` inside the hook, not `dragState` — the long-lived `window` pointermove/pointerup listeners are attached once per drag gesture (imperatively, from the `pointerdown` handler) and read/write that ref directly, since reading React state back inside those closures would only ever see the value from the render they were created in.
- `TaskCard`'s draggable surface has `touch-none` (CSS `touch-action: none`) so a touch-drag doesn't get interpreted as a page/column scroll instead — this also means a column can only be scrolled by touching empty space in it, not by touching a card directly.
- `DragPreview.tsx` renders a floating copy of the dragged card at `{pointerX, pointerY}` while a drag is active — ordinary state-driven JSX, not a cloned/manually-positioned DOM node (that was the previous HTML5-DnD-era implementation, needed to blank out the browser's own composited drag ghost).
- Each time `overStatus` changes to a *new* column mid-drag, `scrollColumnIntoView` calls `scrollIntoView({ inline: "center" })` on that column — on mobile, only the current column (plus a peek of the next) is ever on screen, so without this, a column you can't fully see would otherwise be unreachable. The previous value is tracked per-gesture in `pendingRef` (not `dragState`) so this only fires on a genuine change, not every pointermove.

**Reordering model:** `handleMoveTask(taskId, status, target)` in `App.tsx` removes the dragged task from the array, then re-inserts it either at a position anchored to `target.taskId` (before/after) or appended to the end of its new column if `target` is `null`. It intentionally anchors on the target task's *id*, not a numeric index, since the dragged task's old index would otherwise throw off insertion math after it's filtered out.

**Mobile layout:** below the `sm` breakpoint, `Board`'s container scroll-snaps horizontally (`snap-x snap-mandatory`) and each `Column` is `w-[88vw] max-w-xs shrink-0 snap-center`, so a column fills most of the viewport with a peek of the next one — swipe between columns instead of viewing a squeezed 3-up layout. At `sm:` and up this reverts to the original side-by-side `flex-1 min-w-[240px]` layout with snapping disabled.

**Tailwind class names are always spelled out literally** (see `ACCENT_STYLES` in `Column.tsx` and `CARD_COLOR_STYLES` in `cardColors.ts`) rather than built from template strings, because Tailwind's JIT scanner only picks up class names it can find verbatim in source. This includes `dark:` variants — every themed class needs its `dark:` counterpart spelled out alongside it, not derived.

**`public/icons.svg`** holds inline `<symbol>` definitions referenced elsewhere via `<use href="/icons.svg#...">` (e.g. the GitHub link in `App.tsx`'s header). Symbol path colors are hardcoded fills, not `currentColor`, so consumers add Tailwind's `fill-current` class to make them recolorable/theme-aware.
