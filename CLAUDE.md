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

**Component tree:** `App` → `Board` → `Column` → `TaskCard`, plus `AddTaskModal` rendered conditionally by `App`.

- **`App.tsx`** owns the single source of truth: the `Task[]` array (via `useLocalStorage`, key `"flowboard-tasks"`) and the add-task modal's open/closed state. All mutations (`handleAddTask`, `handleUpdateTask`, `handleDeleteTask`, `handleMoveTask`) live here and are passed down as callbacks — child components never touch the task array directly.
- **`Board.tsx`** is stateless: it defines the three fixed columns (`todo` / `in-progress` / `done`) and filters `tasks` into each `Column`.
- **`Column.tsx`** owns the drag-over UI state (`isOver`, `dropTarget`) and implements the native HTML5 Drag-and-Drop handlers. Reordering logic is index-based: `handleCardDragOver` computes whether the pointer is above/below a card's vertical midpoint to decide `before`/`after`, which becomes the `target` passed to `onMoveTask`.
- **`TaskCard.tsx`** implements the drag *source* side and a custom drag preview (the native browser drag ghost is suppressed via a transparent `dataTransfer.setDragImage`, and a cloned DOM node is manually positioned as a `position: fixed` element instead — see the file's comments for why this exists and why the preview's lifetime is tracked at module scope rather than per-instance state). It also owns its own inline edit mode and its color-swatch picker.
- **`useLocalStorage.ts`** is a drop-in replacement for `useState` (same `[value, setValue]` return shape) that lazily reads from and syncs to `localStorage`, silently falling back to the caller's default on read/write errors.
- **`types.ts`** defines the two closed unions the whole app is built around: `Status` (`"todo" | "in-progress" | "done"`) and `CardColor`. `Task.color` is optional for backward compatibility with tasks persisted before the color feature existed — readers fall back to `"default"`.

**Reordering model:** `handleMoveTask(taskId, status, target)` in `App.tsx` removes the dragged task from the array, then re-inserts it either at a position anchored to `target.taskId` (before/after) or appended to the end of its new column if `target` is `null`. It intentionally anchors on the target task's *id*, not a numeric index, since the dragged task's old index would otherwise throw off insertion math after it's filtered out.

**Tailwind class names are always spelled out literally** (see `ACCENT_STYLES` in `Column.tsx` and `CARD_COLOR_STYLES` in `TaskCard.tsx`) rather than built from template strings, because Tailwind's JIT scanner only picks up class names it can find verbatim in source.
