# FlowBoard

A lightweight kanban board for tracking tasks across three stages — **To Do**, **In Progress**, and **Done**. Built as a small, dependency-light React app: no backend, no account, no build step beyond Vite. Everything you add is saved to your browser's `localStorage`, so your board is right where you left it next time you open the page.

## Features

- **Drag and drop** — grab a card and drop it into another column, or reorder it within its own column, with mouse or touch alike. A thin indicator line shows exactly where it'll land.
- **Add, edit, delete tasks** — each task has a title and an optional description; edit either in place on the card.
- **Color-coded cards** — tag a card with one of seven colors to group or highlight it at a glance.
- **Dark mode** — toggle it from the header; it's remembered on your next visit.
- **Mobile-friendly** — columns become swipeable full-width panels on narrow screens, and dragging works with touch.
- **Persistent by default** — tasks are saved to `localStorage` automatically; refreshing or closing the tab doesn't lose your board.
- **No setup required** — no server, database, or sign-in. Clone it, run it, start adding tasks.

## Getting started

Requires [Node.js](https://nodejs.org/).

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Type-check the project and build for production |
| `npm run lint` | Run ESLint over the codebase |
| `npm run preview` | Preview the production build locally |

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for dev server and bundling
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- Custom drag-and-drop built on the Pointer Events API — no external DnD library, and works with touch as well as mouse

## How it works

All tasks live in a single array of `{ id, title, description, status, color }` objects, held in the top-level `App` component and mirrored to `localStorage` on every change. Dragging a card is tracked via pointer events and translated into a status/position update on that array — there's no separate library or global store managing the board state.

See [`CLAUDE.md`](./CLAUDE.md) for a deeper look at the project's architecture.
