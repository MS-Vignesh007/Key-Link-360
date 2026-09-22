import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Search,
  Layers,
  Sparkles,
  Sliders
} from "lucide-react";
import { BioEditorBlock } from "../../types";

interface BuilderStructureTreeProps {
  blocks: BioEditorBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDuplicate: (blockId: string) => void;
  onDelete: (blockId: string) => void;
  onToggleHidden: (blockId: string) => void;
  onToggleLock: (blockId: string) => void;
  getBlockIcon?: (type: string) => React.ReactNode;
}

export default function BuilderStructureTree({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onToggleHidden,
  onToggleLock,
  getBlockIcon
}: BuilderStructureTreeProps) {
  const [filterText, setFilterText] = useState("");

  const filteredBlocks = blocks.filter((b) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      (b.label || "").toLowerCase().includes(q) ||
      (b.type || "").toLowerCase().includes(q) ||
      (b.value || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-2.5 font-sans select-none">
      {/* Header & Quick Search */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            Structure Tree
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold">
            {blocks.length}
          </span>
        </div>
      </div>

      {/* Filter Input */}
      {blocks.length > 4 && (
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter DOM tree nodes..."
            className="w-full pl-7 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
          />
        </div>
      )}

      {/* DOM Hierarchy List */}
      <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
        {filteredBlocks.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No blocks found in structure tree.
          </div>
        ) : (
          filteredBlocks.map((block, index) => {
            const isSelected = selectedBlockId === block.id;
            const isHidden = Boolean(block.isHidden || block.styles?.isHidden);
            const isLocked = Boolean(block.isLocked || block.styles?.isLocked);
            const isFirst = index === 0;
            const isLast = index === blocks.length - 1;

            return (
              <div
                key={block.id}
                onClick={() => onSelectBlock(block.id)}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 shadow-sm"
                    : isHidden
                      ? "opacity-50 border-dashed border-slate-200 dark:border-slate-800 hover:opacity-80"
                      : "border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-900/80 hover:border-indigo-300"
                }`}
              >
                {/* Left: Icon, Tag & Title */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-300">
                    {getBlockIcon ? (
                      getBlockIcon(block.type)
                    ) : (
                      <Layers className="w-3 h-3 text-indigo-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-bold uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                        {block.type}
                      </span>
                      {isLocked && (
                        <span className="text-[8px] font-bold px-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-600">
                          LOCKED
                        </span>
                      )}
                      {isHidden && (
                        <span className="text-[8px] font-bold px-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                          HIDDEN
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {block.label || block.type}
                    </p>
                  </div>
                </div>

                {/* Right: Quick Action Icons */}
                <div
                  className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={isFirst || isLocked}
                    onClick={() => onMoveUp(index)}
                    title="Move up"
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={isLast || isLocked}
                    onClick={() => onMoveDown(index)}
                    title="Move down"
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Visibility Eye */}
                  <button
                    type="button"
                    onClick={() => onToggleHidden(block.id)}
                    title={isHidden ? "Show block" : "Hide block"}
                    className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                      isHidden ? "text-amber-500" : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  {/* Lock Toggle (Blocks Edit style) */}
                  <button
                    type="button"
                    onClick={() => onToggleLock(block.id)}
                    title={isLocked ? "Unlock component" : "Lock component (prevent accidental changes)"}
                    className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${
                      isLocked ? "text-amber-500" : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => onDuplicate(block.id)}
                    title="Duplicate node"
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => onDelete(block.id)}
                    title={isLocked ? "Unlock before deleting" : "Delete node"}
                    className="p-1 rounded text-slate-400 hover:text-rose-500 disabled:opacity-20 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
