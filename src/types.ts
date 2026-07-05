export type Status = "todo" | "in-progress" | "done";

export type CardColor =
  | "default"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  // Optional (rather than defaulted at creation) because tasks already
  // saved to localStorage before this field existed won't have it —
  // readers fall back to "default" rather than requiring a migration.
  color?: CardColor;
}
