import React, { useState } from "react";
import {
  Link as LinkIcon,
  Unlink,
  RotateCcw,
  Sparkles,
  Type,
  Box,
  Palette,
  Shield,
  Code,
  Sliders,
  Maximize2
} from "lucide-react";
import { BlockDeveloperStyles } from "../../types";

interface BlockStyleInspectorProps {
  styles?: BlockDeveloperStyles;
  onChange: (updatedStyles: BlockDeveloperStyles) => void;
  blockLabel?: string;
  blockType?: string;
}

const FONT_FAMILIES = [
  { label: "Default / Inherit", value: "inherit" },
  { label: "Inter (Modern Clean)", value: "'Inter', sans-serif" },
  { label: "Plus Jakarta Sans (SaaS)", value: "'Plus Jakarta Sans', sans-serif" },
  { label: "Outfit (Geometric Display)", value: "'Outfit', sans-serif" },
  { label: "Space Grotesk (Tech / Web3)", value: "'Space Grotesk', sans-serif" },
  { label: "Playfair Display (Luxury Serif)", value: "'Playfair Display', serif" },
  { label: "JetBrains Mono (Developer Code)", value: "'JetBrains Mono', monospace" }
];

const QUICK_COLORS = [
  "#ffffff",
  "#f8fafc",
  "#94a3b8",
  "#0f172a",
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#8b5cf6"
];

export default function BlockStyleInspector({
  styles = {},
  onChange,
  blockLabel,
  blockType
}: BlockStyleInspectorProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    "spacing" | "typography" | "background" | "borders" | "shadows" | "custom"
  >("spacing");

  const update = (patch: Partial<BlockDeveloperStyles>) => {
    onChange({ ...styles, ...patch });
  };

  // Spacing link handlers
  const handleMarginChange = (side: "Top" | "Right" | "Bottom" | "Left", val: number) => {
    if (styles.isMarginLinked) {
      update({
        marginTop: val,
        marginRight: val,
        marginBottom: val,
        marginLeft: val
      });
    } else {
      update({ [`margin${side}`]: val });
    }
  };

  const handlePaddingChange = (side: "Top" | "Right" | "Bottom" | "Left", val: number) => {
    if (styles.isPaddingLinked) {
      update({
        paddingTop: val,
        paddingRight: val,
        paddingBottom: val,
        paddingLeft: val
      });
    } else {
      update({ [`padding${side}`]: val });
    }
  };

  const handleRadiusChange = (
    corner: "TopLeft" | "TopRight" | "BottomRight" | "BottomLeft",
    val: number
  ) => {
    if (styles.isRadiusLinked) {
      update({
        borderRadiusTopLeft: val,
        borderRadiusTopRight: val,
        borderRadiusBottomRight: val,
        borderRadiusBottomLeft: val
      });
    } else {
      update({ [`borderRadius${corner}`]: val });
    }
  };

  const resetAllStyles = () => {
    onChange({});
  };

  return (
    <div className="space-y-4 text-xs font-sans select-none">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1 py-1 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 font-mono">
            {blockType || "BLOCK"} · STYLE ENGINE
          </span>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
            {blockLabel || "Selected Block"}
          </p>
        </div>
        <button
          type="button"
          onClick={resetAllStyles}
          title="Reset all custom styles to theme default"
          className="flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-rose-500 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Sub-Tabs Nav: Spacing, Typography, Background, Borders, Shadows, Custom */}
      <div className="grid grid-cols-6 gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
        {[
          { id: "spacing", icon: Box, label: "Box" },
          { id: "typography", icon: Type, label: "Type" },
          { id: "background", icon: Palette, label: "Color" },
          { id: "borders", icon: Shield, label: "Border" },
          { id: "shadows", icon: Sparkles, label: "Glow" },
          { id: "custom", icon: Code, label: "CSS" }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-lg transition-all ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon className="w-3.5 h-3.5 mb-0.5" />
              <span className="text-[9px]">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================= TAB 1: VISUAL BOX MODEL (SPACING) ======================= */}
      {activeSubTab === "spacing" && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-200">
            <span>Visual Box Model</span>
            <span className="text-[10px] text-slate-400 font-mono">Dimensions in PX</span>
          </div>

          {/* Bricks Builder Visual Box Model Diagram */}
          <div className="relative p-3 bg-amber-50/50 dark:bg-amber-950/20 border-2 border-dashed border-amber-300/70 dark:border-amber-700/50 rounded-2xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase text-amber-700 dark:text-amber-400 font-mono">
                MARGIN
              </span>
              <button
                type="button"
                onClick={() => update({ isMarginLinked: !styles.isMarginLinked })}
                className={`p-1 rounded text-[10px] flex items-center gap-1 font-semibold ${
                  styles.isMarginLinked
                    ? "bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title={styles.isMarginLinked ? "Unlink 4 margin sides" : "Link 4 margin sides"}
              >
                {styles.isMarginLinked ? <LinkIcon className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
                <span className="text-[8px]">{styles.isMarginLinked ? "Linked" : "Independent"}</span>
              </button>
            </div>

            {/* Margin Top */}
            <div className="flex justify-center mb-2">
              <input
                type="number"
                value={styles.marginTop ?? ""}
                onChange={(e) => handleMarginChange("Top", parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-14 text-center py-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-md text-[11px] font-mono shadow-sm"
              />
            </div>

            {/* Inner Padding Container */}
            <div className="flex items-center justify-between gap-1">
              {/* Margin Left */}
              <input
                type="number"
                value={styles.marginLeft ?? ""}
                onChange={(e) => handleMarginChange("Left", parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-12 text-center py-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-md text-[11px] font-mono shadow-sm"
              />

              {/* PADDING BOX */}
              <div className="flex-1 p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 border-2 border-emerald-300/80 dark:border-emerald-700/60 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-bold uppercase text-emerald-700 dark:text-emerald-400 font-mono">
                    PADDING
                  </span>
                  <button
                    type="button"
                    onClick={() => update({ isPaddingLinked: !styles.isPaddingLinked })}
                    className={`p-1 rounded text-[10px] flex items-center gap-1 font-semibold ${
                      styles.isPaddingLinked
                        ? "bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                    title={styles.isPaddingLinked ? "Unlink padding" : "Link padding"}
                  >
                    {styles.isPaddingLinked ? <LinkIcon className="w-2.5 h-2.5" /> : <Unlink className="w-2.5 h-2.5" />}
                  </button>
                </div>

                {/* Padding Top */}
                <div className="flex justify-center mb-1">
                  <input
                    type="number"
                    value={styles.paddingTop ?? ""}
                    onChange={(e) => handlePaddingChange("Top", parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    className="w-12 text-center py-0.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded text-[11px] font-mono shadow-sm"
                  />
                </div>

                <div className="flex items-center justify-between gap-1">
                  {/* Padding Left */}
                  <input
                    type="number"
                    value={styles.paddingLeft ?? ""}
                    onChange={(e) => handlePaddingChange("Left", parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    className="w-11 text-center py-0.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded text-[11px] font-mono shadow-sm"
                  />

                  {/* Core Element Center */}
                  <div className="px-2 py-1.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-center font-bold text-[9px] text-indigo-600 dark:text-indigo-400">
                    ELEMENT
                  </div>

                  {/* Padding Right */}
                  <input
                    type="number"
                    value={styles.paddingRight ?? ""}
                    onChange={(e) => handlePaddingChange("Right", parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    className="w-11 text-center py-0.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded text-[11px] font-mono shadow-sm"
                  />
                </div>

                {/* Padding Bottom */}
                <div className="flex justify-center mt-1">
                  <input
                    type="number"
                    value={styles.paddingBottom ?? ""}
                    onChange={(e) => handlePaddingChange("Bottom", parseInt(e.target.value, 10) || 0)}
                    placeholder="0"
                    className="w-12 text-center py-0.5 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded text-[11px] font-mono shadow-sm"
                  />
                </div>
              </div>

              {/* Margin Right */}
              <input
                type="number"
                value={styles.marginRight ?? ""}
                onChange={(e) => handleMarginChange("Right", parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-12 text-center py-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-md text-[11px] font-mono shadow-sm"
              />
            </div>

            {/* Margin Bottom */}
            <div className="flex justify-center mt-2">
              <input
                type="number"
                value={styles.marginBottom ?? ""}
                onChange={(e) => handleMarginChange("Bottom", parseInt(e.target.value, 10) || 0)}
                placeholder="0"
                className="w-14 text-center py-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-md text-[11px] font-mono shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: TYPOGRAPHY ======================= */}
      {activeSubTab === "typography" && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Font Family */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Font Family
            </label>
            <select
              value={styles.fontFamily || "inherit"}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-semibold"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size & Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Font Size
                </label>
                <span className="font-mono text-[10px] text-indigo-500">
                  {styles.fontSize ? `${styles.fontSize}px` : "Auto"}
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="64"
                value={styles.fontSize || 16}
                onChange={(e) => update({ fontSize: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Font Weight
              </label>
              <select
                value={styles.fontWeight || ""}
                onChange={(e) => update({ fontWeight: e.target.value || undefined })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
              >
                <option value="">Default</option>
                <option value="300">300 · Light</option>
                <option value="400">400 · Regular</option>
                <option value="500">500 · Medium</option>
                <option value="600">600 · SemiBold</option>
                <option value="700">700 · Bold</option>
                <option value="800">800 · ExtraBold</option>
                <option value="900">900 · Black</option>
              </select>
            </div>
          </div>

          {/* Line Height & Letter Spacing */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Line Height
                </label>
                <span className="font-mono text-[10px] text-slate-400">
                  {styles.lineHeight ?? "Auto"}
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.8"
                max="3.0"
                value={styles.lineHeight ?? ""}
                onChange={(e) => update({ lineHeight: parseFloat(e.target.value) || undefined })}
                placeholder="1.4"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-3 text-xs font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Letter Spacing
                </label>
                <span className="font-mono text-[10px] text-slate-400">
                  {styles.letterSpacing ? `${styles.letterSpacing}px` : "0"}
                </span>
              </div>
              <input
                type="number"
                step="0.5"
                min="-2"
                max="10"
                value={styles.letterSpacing ?? ""}
                onChange={(e) => update({ letterSpacing: parseFloat(e.target.value) || undefined })}
                placeholder="0"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-1.5 px-3 text-xs font-mono"
              />
            </div>
          </div>

          {/* Text Transform & Alignment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Transform
              </label>
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
                {[
                  { id: "none", label: "—" },
                  { id: "uppercase", label: "AA" },
                  { id: "lowercase", label: "aa" },
                  { id: "capitalize", label: "Aa" }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => update({ textTransform: t.id as any })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      (styles.textTransform || "none") === t.id
                        ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Alignment
              </label>
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
                {[
                  { id: "left", label: "Left" },
                  { id: "center", label: "Center" },
                  { id: "right", label: "Right" }
                ].map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => update({ textAlign: a.id as any })}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      styles.textAlign === a.id
                        ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Text Color */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Text Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styles.textColor || "#ffffff"}
                onChange={(e) => update({ textColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer"
              />
              <input
                type="text"
                value={styles.textColor || ""}
                onChange={(e) => update({ textColor: e.target.value })}
                placeholder="#ffffff or rgba(...)"
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: BACKGROUND & GLASSMORPHISM ======================= */}
      {activeSubTab === "background" && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Background Mode
          </label>
          <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {[
              { id: "default", label: "Default" },
              { id: "solid", label: "Solid" },
              { id: "gradient", label: "Gradient" },
              { id: "glass", label: "Glass" }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => update({ bgType: m.id as any })}
                className={`py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  (styles.bgType || "default") === m.id
                    ? "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Solid Mode */}
          {styles.bgType === "solid" && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Solid Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={styles.bgColor || "#0f172a"}
                  onChange={(e) => update({ bgColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={styles.bgColor || ""}
                  onChange={(e) => update({ bgColor: e.target.value })}
                  placeholder="#0f172a"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-mono"
                />
              </div>
              {/* Quick swatches */}
              <div className="flex items-center gap-1.5 pt-1">
                {QUICK_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => update({ bgColor: c })}
                    style={{ backgroundColor: c }}
                    className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-700 shadow-sm transition-transform hover:scale-110"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Gradient Mode */}
          {styles.bgType === "gradient" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    From Color
                  </label>
                  <input
                    type="color"
                    value={styles.bgGradientFrom || "#6366f1"}
                    onChange={(e) => update({ bgGradientFrom: e.target.value })}
                    className="w-full h-8 rounded-lg border border-slate-200 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    To Color
                  </label>
                  <input
                    type="color"
                    value={styles.bgGradientTo || "#06b6d4"}
                    onChange={(e) => update({ bgGradientTo: e.target.value })}
                    className="w-full h-8 rounded-lg border border-slate-200 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Gradient Angle
                  </label>
                  <span className="font-mono text-[10px] text-indigo-500">
                    {styles.bgGradientAngle ?? 135}°
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={styles.bgGradientAngle ?? 135}
                  onChange={(e) => update({ bgGradientAngle: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          )}

          {/* Glass Mode */}
          {styles.bgType === "glass" && (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Backdrop Blur Intensity
                  </label>
                  <span className="font-mono text-[10px] text-indigo-500">
                    {styles.bgBackdropBlur ?? 12}px
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={styles.bgBackdropBlur ?? 12}
                  onChange={(e) => update({ bgBackdropBlur: parseInt(e.target.value, 10) })}
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Glass Tint Color (Hex / RGBA)
                </label>
                <input
                  type="text"
                  value={styles.bgColor || "rgba(15, 23, 42, 0.65)"}
                  onChange={(e) => update({ bgColor: e.target.value })}
                  placeholder="rgba(15, 23, 42, 0.65)"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-mono"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 4: BORDERS & 4-CORNER RADIUS ======================= */}
      {activeSubTab === "borders" && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Border Style */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Border Style
              </label>
              <select
                value={styles.borderStyle || "none"}
                onChange={(e) => update({ borderStyle: e.target.value as any })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-semibold"
              >
                <option value="none">None</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Border Width
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={styles.borderWidth ?? ""}
                onChange={(e) => update({ borderWidth: parseInt(e.target.value, 10) || 1 })}
                placeholder="1"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-mono"
              />
            </div>
          </div>

          {styles.borderStyle && styles.borderStyle !== "none" && (
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Border Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={styles.borderColor || "#6366f1"}
                  onChange={(e) => update({ borderColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer"
                />
                <input
                  type="text"
                  value={styles.borderColor || ""}
                  onChange={(e) => update({ borderColor: e.target.value })}
                  placeholder="#6366f1 or rgba(...)"
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* 4-Corner Radius */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Border Radius (Corners)
              </span>
              <button
                type="button"
                onClick={() => update({ isRadiusLinked: !styles.isRadiusLinked })}
                className={`p-1 rounded text-[10px] flex items-center gap-1 font-semibold ${
                  styles.isRadiusLinked
                    ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Link all 4 corners"
              >
                {styles.isRadiusLinked ? <LinkIcon className="w-3 h-3" /> : <Unlink className="w-3 h-3" />}
                <span className="text-[9px]">{styles.isRadiusLinked ? "Linked" : "Separate"}</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { id: "TopLeft", label: "TL" },
                { id: "TopRight", label: "TR" },
                { id: "BottomRight", label: "BR" },
                { id: "BottomLeft", label: "BL" }
              ].map((c) => (
                <div key={c.id}>
                  <label className="block text-[8px] font-mono text-slate-400 mb-0.5 text-center">
                    {c.label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={(styles as any)[`borderRadius${c.id}`] ?? ""}
                    onChange={(e) =>
                      handleRadiusChange(c.id as any, parseInt(e.target.value, 10) || 0)
                    }
                    placeholder="0"
                    className="w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-1.5 text-xs font-mono"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 5: SHADOWS & NEON GLOW ======================= */}
      {activeSubTab === "shadows" && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Shadow Presets
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: "none", label: "None" },
              { id: "subtle", label: "Subtle" },
              { id: "soft", label: "Soft Card" },
              { id: "deep", label: "Deep Float" },
              { id: "glow-cyan", label: "Cyan Glow ⚡" },
              { id: "glow-purple", label: "Purple Glow ✨" },
              { id: "custom", label: "Custom ⚙️" }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => update({ boxShadowPreset: p.id as any })}
                className={`py-2 px-1 text-[10px] font-bold rounded-xl border transition-all ${
                  (styles.boxShadowPreset || "none") === p.id
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Shadow Sliders */}
          {styles.boxShadowPreset === "custom" && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 mb-0.5">X Offset ({styles.shadowX ?? 0}px)</label>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={styles.shadowX ?? 0}
                    onChange={(e) => update({ shadowX: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 mb-0.5">Y Offset ({styles.shadowY ?? 8}px)</label>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    value={styles.shadowY ?? 8}
                    onChange={(e) => update({ shadowY: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 mb-0.5">Blur ({styles.shadowBlur ?? 20}px)</label>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={styles.shadowBlur ?? 20}
                    onChange={(e) => update({ shadowBlur: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 mb-0.5">Spread ({styles.shadowSpread ?? 0}px)</label>
                  <input
                    type="range"
                    min="-20"
                    max="40"
                    value={styles.shadowSpread ?? 0}
                    onChange={(e) => update({ shadowSpread: parseInt(e.target.value, 10) })}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Shadow Color
                </label>
                <input
                  type="text"
                  value={styles.shadowColor || "rgba(0, 0, 0, 0.25)"}
                  onChange={(e) => update({ shadowColor: e.target.value })}
                  placeholder="rgba(0, 0, 0, 0.25)"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-mono"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 6: DEVELOPER CUSTOM CSS & ATTRIBUTES ======================= */}
      {activeSubTab === "custom" && (
        <div className="space-y-3 animate-in fade-in duration-150">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Custom CSS Class Name
            </label>
            <input
              type="text"
              value={styles.customCssClass || ""}
              onChange={(e) => update({ customCssClass: e.target.value })}
              placeholder="e.g. my-custom-card-hover"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Applies this class directly to the block wrapper in the HTML DOM.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Aria Accessibility Label
            </label>
            <input
              type="text"
              value={styles.customAriaLabel || ""}
              onChange={(e) => update({ customAriaLabel: e.target.value })}
              placeholder="e.g. Featured Pricing Offer"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Custom Inline CSS (Advanced)
            </label>
            <textarea
              rows={3}
              value={styles.customInlineCss || ""}
              onChange={(e) => update({ customInlineCss: e.target.value })}
              placeholder="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));"
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-mono resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
