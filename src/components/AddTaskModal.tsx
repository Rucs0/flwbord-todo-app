import { useState } from "react";
import type { FormEvent } from "react";

interface AddTaskModalProps {
  onAdd: (title: string, description: string) => void;
  onClose: () => void;
}

// Controlled inputs (title/description) need local state to hold what's
// being typed before the form is submitted — that's UI-local, not app data.
function AddTaskModal({ onAdd, onClose }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return; // title required
    onAdd(trimmedTitle, description.trim());
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 p-4 animate-[fade-in_150ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg animate-[scale-in_150ms_ease-out]"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Add Task
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-slate-600">
            Title
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Fix login bug"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <label className="text-sm font-medium text-slate-600">
            Description{" "}
            <span className="font-normal text-slate-400">(optional)</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="Add more detail..."
              className="mt-1 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTaskModal;
