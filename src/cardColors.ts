import type { CardColor } from "./types";

export const CARD_COLOR_OPTIONS: CardColor[] = [
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
export const CARD_COLOR_STYLES: Record<
  CardColor,
  { card: string; swatch: string }
> = {
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
