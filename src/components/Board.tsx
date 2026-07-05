import type { Status, Task } from "../types";
import Column, { type ColumnAccent } from "./Column";

interface BoardProps {
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Omit<Task, "id">>) => void;
  onDeleteTask: (id: string) => void;
  onMoveTask: (
    taskId: string,
    status: Status,
    target: { taskId: string; position: "before" | "after" } | null,
  ) => void;
}

const COLUMNS: { status: Status; title: string; accent: ColumnAccent }[] = [
  { status: "todo", title: "To Do", accent: "slate" },
  { status: "in-progress", title: "In Progress", accent: "amber" },
  { status: "done", title: "Done", accent: "green" },
];

// Board just filters and lays out columns — no state of its own,
// so it stays a plain function with no hooks.
function Board({ tasks, onUpdateTask, onDeleteTask, onMoveTask }: BoardProps) {
  return (
    <div className="flex h-[calc(100vh-64px)] gap-3 overflow-x-auto bg-slate-100 p-4 dark:bg-slate-900 sm:gap-4 sm:p-6">
      {COLUMNS.map((column) => (
        <Column
          key={column.status}
          title={column.title}
          status={column.status}
          accent={column.accent}
          tasks={tasks.filter((task) => task.status === column.status)}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onMoveTask={onMoveTask}
        />
      ))}
    </div>
  );
}

export default Board;
