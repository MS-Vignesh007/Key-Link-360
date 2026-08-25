import React, { useRef, useState } from "react";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import {
  createFormField,
  FORM_FIELD_TYPE_OPTIONS,
  getFormFields,
  type BlockRecord,
  type DynamicFormField
} from "../../lib/bioBlocks";

interface FormFieldsEditorProps {
  block: BlockRecord;
  onChange: (fields: DynamicFormField[]) => void;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("input, textarea, select, button, a, label, [contenteditable='true']")
  );
}

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to) return list;
  if (from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export default function FormFieldsEditor({ block, onChange }: FormFieldsEditorProps) {
  const fields = getFormFields(block);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const didDropRef = useRef(false);

  const updateField = (index: number, patch: Partial<DynamicFormField>) => {
    const next = fields.map((field, i) => (i === index ? { ...field, ...patch } : field));
    onChange(next);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const addField = () => {
    onChange([...fields, createFormField({ label: `Field ${fields.length + 1}` })]);
  };

  const clearDragState = () => {
    dragIndexRef.current = null;
    setDragIndex(null);
    setOverIndex(null);
  };

  const commitReorder = (from: number, to: number) => {
    const next = moveItem(fields, from, to);
    if (next === fields) return false;
    // Compare by id order to avoid no-op reference equality miss
    const same = next.every((field, i) => field.id === fields[i]?.id);
    if (same) return false;
    onChange(next);
    return true;
  };

  const handleDragStart = (event: React.DragEvent, index: number) => {
    if (isInteractiveTarget(event.target)) {
      event.preventDefault();
      return;
    }

    event.stopPropagation();
    didDropRef.current = false;
    dragIndexRef.current = index;
    setDragIndex(index);
    setOverIndex(index);

    event.dataTransfer.effectAllowed = "move";
    // Do NOT use text/plain — parent Page Blocks treats that as a new block type.
    event.dataTransfer.setData("application/x-form-field-index", String(index));
    event.dataTransfer.setData("text/form-field-reorder", "1");
  };

  const handleDragOver = (event: React.DragEvent, index: number) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    if (dragIndexRef.current === null) return;
    if (overIndex !== index) setOverIndex(index);
  };

  const handleDrop = (event: React.DragEvent, targetIndex: number) => {
    event.preventDefault();
    event.stopPropagation();
    didDropRef.current = true;

    const fromRaw =
      dragIndexRef.current ??
      Number.parseInt(event.dataTransfer.getData("application/x-form-field-index") || "", 10);
    const from = Number.isFinite(fromRaw) ? fromRaw : -1;

    if (from >= 0) {
      commitReorder(from, targetIndex);
    }

    clearDragState();
  };

  const handleDragEnd = (event: React.DragEvent) => {
    event.stopPropagation();
    // If drop already committed, state is clear. If cancelled, clear here.
    if (!didDropRef.current && dragIndexRef.current !== null && overIndex !== null) {
      // Fallback: some browsers miss drop — apply last hovered target
      commitReorder(dragIndexRef.current, overIndex);
    }
    clearDragState();
  };

  return (
    <div
      className="space-y-3 pt-1 border-t border-slate-100"
      onDragOver={(e) => {
        // Keep drops inside this editor; block parent accordion reorder.
        if (dragIndexRef.current !== null || e.dataTransfer.types.includes("text/form-field-reorder")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDrop={(e) => {
        if (dragIndexRef.current !== null || e.dataTransfer.types.includes("text/form-field-reorder")) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Form Fields ({fields.length})
        </label>
        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#6366f1] hover:text-[#4f46e5] bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add Field
        </button>
      </div>

      <p className="text-[10px] text-slate-400">
        Drag a field card onto another field to reorder.
      </p>

      {fields.length === 0 ? (
        <p className="text-[11px] text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl px-3 py-3 text-center">
          No fields yet. Click <strong>Add Field</strong> to build your form.
        </p>
      ) : (
        <div className="space-y-2.5">
          {fields.map((field, index) => {
            const isDragging = dragIndex === index;
            const isDropTarget = overIndex === index && dragIndex !== null && dragIndex !== index;

            return (
              <div
                key={field.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`rounded-xl border bg-slate-50/80 p-3 space-y-2.5 transition-all cursor-grab active:cursor-grabbing ${
                  isDragging
                    ? "opacity-40 border-dashed border-[#6366f1] scale-[0.99]"
                    : isDropTarget
                      ? "border-[#6366f1] ring-2 ring-[#6366f1]/25 bg-indigo-50/60"
                      : "border-slate-200 hover:border-indigo-200 hover:shadow-sm"
                }`}
                title="Drag onto another field to reorder"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-slate-400 shrink-0 pointer-events-none" aria-hidden>
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Field {index + 1}
                      {isDropTarget ? " · drop here" : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors"
                    title="Remove field"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Label
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-lg py-1.5 px-2.5 text-xs text-slate-800 cursor-text"
                      placeholder="Field label"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Type
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateField(index, { type: e.target.value as DynamicFormField["type"] })
                      }
                      className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-lg py-1.5 px-2.5 text-xs text-slate-800 cursor-pointer"
                    >
                      {FORM_FIELD_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Placeholder
                  </label>
                  <input
                    type="text"
                    value={field.placeholder}
                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-lg py-1.5 px-2.5 text-xs text-slate-800 cursor-text"
                    placeholder="Hint text inside the input"
                  />
                </div>

                {field.type === "select" && (
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Dropdown options (one per line)
                    </label>
                    <textarea
                      value={field.options}
                      onChange={(e) => updateField(index, { options: e.target.value })}
                      rows={3}
                      className="w-full bg-white border border-slate-200 focus:border-[#6366f1] focus:outline-none rounded-lg py-1.5 px-2.5 text-xs text-slate-800 resize-none cursor-text"
                      placeholder={"Option A\nOption B\nOption C"}
                    />
                  </div>
                )}

                <label className="inline-flex items-center gap-2 text-[11px] text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    className="rounded border-slate-300 accent-[#6366f1]"
                  />
                  Required field
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
