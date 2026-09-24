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
    <div className="space-y-3 font-sans select-none w-full">
      {/* Header & Quick Search */}
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Structure Tree
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-indigo-300 font-bold">
            {blocks.length}
          </span>
        </div>
      </div>

      {/* Filter Input */}
      {blocks.length > 3 && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search placed blocks..."
            className="w-full pl-8.5 pr-3 py-1.5 bg-white/[0.04] border border-white/[0.08] focus:border-indigo-500/60 focus:bg-white/[0.07] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none transition-colors"
          />
        </div>
      )}

      {/* DOM Hierarchy List */}
      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto no-scrollbar pr-0.5">
        {filteredBlocks.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
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
                className={`group flex items-center justify-between px-2.5 py-2 rounded-xl border transition-all cursor-pointer backdrop-blur-md min-w-0 ${
                  isSelected
                    ? "border-indigo-500/70 bg-indigo-600/20 text-white shadow-md shadow-indigo-500/15 ring-1 ring-indigo-500/30"
                    : isHidden
                      ? "opacity-40 border-dashed border-white/10 bg-white/[0.015] hover:opacity-75"
                      : "border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-indigo-500/40 text-slate-200 shadow-2xs"
                }`}
              >
                {/* Left: Icon, Tag & Title */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                  <div className="w-7 h-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 text-slate-300 group-hover:text-indigo-300 transition-colors">
                    {getBlockIcon ? (
                      getBlockIcon(block.type)
                    ) : (
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono font-bold uppercase text-indigo-400 tracking-wider truncate">
                        {block.type}
                      </span>
                      {isLocked && (
                        <span className="text-[8px] font-bold px-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                          LOCK
                        </span>
                      )}
                      {isHidden && (
                        <span className="text-[8px] font-bold px-1 rounded bg-white/10 border border-white/15 text-slate-400">
                          HIDE
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                      {block.label || block.type}
                    </p>
                  </div>
                </div>

                {/* Right: Quick Action Icons */}
                <div
                  className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 ml-1.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={isFirst || isLocked}
                    onClick={() => onMoveUp(index)}
                    title="Move up"
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-colors cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={isLast || isLocked}
                    onClick={() => onMoveDown(index)}
                    title="Move down"
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Visibility Eye */}
                  <button
                    type="button"
                    onClick={() => onToggleHidden(block.id)}
                    title={isHidden ? "Show block" : "Hide block"}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {isHidden ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  {/* Lock Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleLock(block.id)}
                    title={isLocked ? "Unlock block" : "Lock block"}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    {isLocked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>

                  {/* Duplicate */}
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => onDuplicate(block.id)}
                    title="Duplicate block"
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-20 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => onDelete(block.id)}
                    title={isLocked ? "Unlock before deleting" : "Delete block"}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 disabled:opacity-20 transition-colors cursor-pointer"
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
