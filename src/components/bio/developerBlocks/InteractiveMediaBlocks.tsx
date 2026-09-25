import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, ExternalLink, ArrowRight, Music, Volume2, Headphones } from "lucide-react";
import type { BlockRecord } from "../../../lib/bioBlocks";
import type { BlockRendererContext, BlockRendererHandlers, BlockRenderMode } from "../blockTypes";

interface DeveloperBlockProps {
  block: BlockRecord;
  mode: BlockRenderMode;
  context: BlockRendererContext;
  handlers: BlockRendererHandlers;
}

/**
 * 12. Before / After Comparison Slider:
 * Interactive split-view slider with draggable divider to compare two images.
 */
export function BeforeAfterSliderBlockView({ block }: DeveloperBlockProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);

  const beforeImage = (block.beforeImage as string) || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600";
  const afterImage = (block.afterImage as string) || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600";
  const beforeLabel = (block.beforeLabel as string) || "Before";
  const afterLabel = (block.afterLabel as string) || "After";
  const caption = (block.caption as string) || block.label || "Dramatic Transformation in 30 Days";

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="w-full max-w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-3">
      {caption && (
        <h4 className="font-display font-bold text-base sm:text-lg text-white text-center">
          {caption}
        </h4>
      )}

      {/* Before / After Canvas */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onClick={(e) => handleMove(e.clientX)}
        className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden select-none cursor-ew-resize border border-slate-700/80 shadow-2xl"
      >
        {/* After Image (Background) */}
        <img
          src={afterImage}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider pointer-events-none z-10">
          {afterLabel}
        </span>

        {/* Before Image (Clipped Overlay) */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none z-10"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="absolute top-0 left-0 h-full object-cover max-w-none"
            style={{ width: containerWidth ? `${containerWidth}px` : "100%" }}
          />
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] font-bold text-white uppercase tracking-wider">
            {beforeLabel}
          </span>
        </div>

        {/* Divider Handle */}
        <div
          className="absolute inset-y-0 w-0.5 bg-white shadow-2xl pointer-events-none z-20"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center font-bold text-xs pointer-events-auto">
            ⇄
          </div>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 text-center">
        ← Drag slider to compare →
      </p>
    </div>
  );
}

/**
 * 13. Portfolio Gallery:
 * Filterable portfolio showcase with category tags.
 */
export function PortfolioGalleryBlockView({ block, mode, handlers }: DeveloperBlockProps) {
  const headline = (block.headline as string) || block.label || "Our Creative Portfolio";
  const categories = Array.isArray(block.categories)
    ? (block.categories as string[])
    : ["All", "Web Design", "Branding", "Mobile Apps"];
  const [activeCategory, setActiveCategory] = useState("All");

  const projects = Array.isArray(block.projects)
    ? (block.projects as any[])
    : [
        {
          id: "p1",
          title: "Fintech Dashboard UI",
          category: "Web Design",
          imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=400",
          linkUrl: "https://keylink360.in"
        },
        {
          id: "p2",
          title: "Coffee Co Brand Identity",
          category: "Branding",
          imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=400",
          linkUrl: "https://keylink360.in"
        },
        {
          id: "p3",
          title: "Fitness Companion iOS App",
          category: "Mobile Apps",
          imageUrl: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?auto=format&fit=crop&q=80&w=400",
          linkUrl: "https://keylink360.in"
        }
      ];

  const filteredProjects =
    activeCategory === "All"
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  const handleProjectClick = (p: any) => {
    if (mode === "preview") {
      handlers.onToast?.(`Opened portfolio project: ${p.title}`);
      return;
    }
    handlers.onExternalLink?.(p.linkUrl || "https://keylink360.in", p.title);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h4 className="font-display font-black text-lg text-white">{headline}</h4>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {filteredProjects.map((p, idx) => (
          <div
            key={p.id || idx}
            onClick={() => handleProjectClick(p)}
            className="group cursor-pointer rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative hover:border-indigo-500/60 transition-all"
          >
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={p.imageUrl}
                alt={p.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <div className="p-3 text-left">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">{p.category}</span>
              <h5 className="font-bold text-xs text-white truncate">{p.title}</h5>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 14. Video Showcase / Playlist:
 * Featured video player with playlist chapters underneath.
 */
export function VideoShowcaseBlockView({ block, mode, handlers }: DeveloperBlockProps) {
  const title = (block.title as string) || block.label || "Masterclass: How to 10X Your Online Conversions";
  const featuredVideoUrl = (block.featuredVideoUrl as string) || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  const playlist = Array.isArray(block.playlist)
    ? (block.playlist as any[])
    : [
        { id: "v1", title: "Lesson 1: The High-Converting Hero Hook", duration: "12:45" },
        { id: "v2", title: "Lesson 2: Irresistible Offer Architecture", duration: "18:20" },
        { id: "v3", title: "Lesson 3: Social Proof & Objection Handling", duration: "15:10" }
      ];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 text-left">
      <h4 className="font-display font-black text-base sm:text-lg text-white">{title}</h4>

      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800">
        <video
          src={featuredVideoUrl}
          controls
          className="w-full h-full object-contain"
        />
      </div>

      <div className="space-y-2 pt-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">
          Video Playlist Chapters
        </span>
        <div className="divide-y divide-slate-800/80">
          {playlist.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => {
                if (mode === "preview") {
                  handlers.onToast?.(`Playing chapter: ${item.title}`);
                }
              }}
              className="py-2.5 flex items-center justify-between gap-3 text-xs text-slate-300 hover:text-white cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-6 w-6 rounded-full bg-slate-800 group-hover:bg-indigo-600 flex items-center justify-center text-[10px] font-bold text-white transition-colors shrink-0">
                  ▶
                </span>
                <span className="font-medium truncate">{item.title}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono shrink-0">{item.duration}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 15. Audio / Podcast Player:
 * Modern audio player with progress bar, artist, episode title, and streaming links.
 */
export function AudioPlayerBlockView({ block, mode, handlers }: DeveloperBlockProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const title = (block.title as string) || block.label || "Ep. 42: Scaling From Zero to 100K Users";
  const podcastName = (block.podcastName as string) || "The Founder's Playbook";
  const artist = (block.artist as string) || "Vignesh & Team KeyLink";
  const coverImage = (block.coverImage as string) || "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=300";

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (mode === "preview") {
      handlers.onToast?.(!isPlaying ? "Playing podcast episode" : "Audio paused");
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center gap-4 text-left">
      <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
        <img
          src={coverImage}
          alt={title}
          className="w-full h-full object-cover"
        />
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 m-auto h-9 w-9 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white translate-x-0.5" />}
        </button>
      </div>

      <div className="flex-1 min-w-0 space-y-1.5 w-full">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wide">
          <Headphones className="h-3 w-3" />
          <span>{podcastName}</span>
        </div>
        <h4 className="font-bold text-sm text-white truncate">{title}</h4>
        <p className="text-[11px] text-slate-400 truncate">{artist}</p>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
          <div className={`h-full bg-indigo-500 rounded-full ${isPlaying ? "w-1/3 animate-pulse" : "w-1/4"}`} />
        </div>
      </div>
    </div>
  );
}
