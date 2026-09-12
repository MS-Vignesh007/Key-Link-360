import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut, RotateCw, RefreshCw, Check, Move } from "lucide-react";

interface ImageCropModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

const VIEWPORT_SIZE = 300; // Size of the crop square/circle in px
const OUTPUT_SIZE = 512; // Final resolution of cropped avatar image

export default function ImageCropModal({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete
}: ImageCropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0
  });

  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset states when a new image is loaded
  useEffect(() => {
    if (!isOpen || !imageSrc) return;
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
    setImageLoaded(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);
    };
  }, [isOpen, imageSrc]);

  // Handle Drag / Pan with Pointer Events
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - offset.x,
      y: e.clientY - offset.y
    });
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      if (containerRef.current && containerRef.current.hasPointerCapture(e.pointerId)) {
        containerRef.current.releasePointerCapture(e.pointerId);
      }
    }
  };

  // Zoom with Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(1, prev + delta), 3.5));
  };

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset position and zoom
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  };

  // Generate the cropped image via HTML Canvas
  const handleApplyCrop = useCallback(() => {
    if (!imageRef.current || !imageLoaded) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const img = imageRef.current;
    const { width: nw, height: nh } = imageDimensions;

    // Base fitting scale to cover the viewport
    const baseScale = Math.max(VIEWPORT_SIZE / nw, VIEWPORT_SIZE / nh);
    const finalScale = baseScale * zoom;

    // Center coordinates
    ctx.save();
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);

    // Scale canvas ratio
    const scaleRatio = OUTPUT_SIZE / VIEWPORT_SIZE;
    ctx.scale(scaleRatio, scaleRatio);

    // Apply translation from user pan
    ctx.translate(offset.x, offset.y);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Draw the image centered
    const drawW = nw * finalScale;
    const drawH = nh * finalScale;
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Export as high quality JPEG
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    onCropComplete(dataUrl);
    onClose();
  }, [imageLoaded, imageDimensions, zoom, rotation, offset, onCropComplete, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-modal-title"
        className="key-modal-panel max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[var(--key-border)] bg-[var(--key-surface-strong)] text-[var(--key-text)] rounded-3xl"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--key-border)]">
          <div>
            <h3 id="crop-modal-title" className="font-display font-black text-lg text-[var(--key-text)]">
              Crop & Adjust Photo
            </h3>
            <p className="text-xs text-[var(--key-muted)] mt-0.5">
              Drag to position your face in the circle, then zoom or rotate as needed.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--key-muted)] hover:text-[var(--key-text)] p-1.5 rounded-xl hover:bg-[var(--key-surface-hover)] transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Cropping Canvas Viewport */}
        <div className="my-5 flex flex-col items-center justify-center">
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            style={{ width: `${VIEWPORT_SIZE}px`, height: `${VIEWPORT_SIZE}px` }}
            className="relative overflow-hidden rounded-2xl bg-slate-950 border border-[var(--key-border)] cursor-grab active:cursor-grabbing select-none shadow-inner touch-none"
          >
            {/* The Image being transformed */}
            {imageSrc && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                style={{
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                  maxWidth: "none",
                  maxHeight: "none",
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width:
                    imageDimensions.width && imageDimensions.height
                      ? imageDimensions.width >= imageDimensions.height
                        ? "auto"
                        : `${VIEWPORT_SIZE}px`
                      : "100%",
                  height:
                    imageDimensions.width && imageDimensions.height
                      ? imageDimensions.height > imageDimensions.width
                        ? "auto"
                        : `${VIEWPORT_SIZE}px`
                      : "100%"
                }}
                className="pointer-events-none transition-transform duration-75 ease-out"
              />
            )}

            {/* Circular Crop Mask Overlay (Dark outside, transparent circle inside) */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: "0 0 0 9999px rgba(10, 14, 26, 0.72)",
                borderRadius: "50%",
                border: "2px solid rgba(99, 102, 241, 0.8)"
              }}
            />

            {/* Move Hint */}
            <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-2 py-1 flex items-center gap-1 text-[10px] font-medium text-white/90 pointer-events-none">
              <Move className="h-3 w-3 text-indigo-400" />
              <span>Drag to move</span>
            </div>
          </div>
        </div>

        {/* Controls: Zoom & Rotate & Reset */}
        <div className="space-y-4 px-2">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.15))}
              className="text-[var(--key-muted)] hover:text-[var(--key-text)] p-1.5 rounded-lg hover:bg-[var(--key-surface-hover)] transition-colors"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.02"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 bg-[var(--key-surface)] rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-[var(--key-border)]"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.15))}
              className="text-[var(--key-muted)] hover:text-[var(--key-text)] p-1.5 rounded-lg hover:bg-[var(--key-surface-hover)] transition-colors"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--key-border)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="px-3 py-1.5 rounded-xl border border-[var(--key-border)] bg-[var(--key-surface)] hover:bg-[var(--key-surface-hover)] text-[var(--key-text)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Rotate 90 degrees"
              >
                <RotateCw className="h-3.5 w-3.5 text-indigo-500" />
                <span>Rotate</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-xl border border-[var(--key-border)] bg-[var(--key-surface)] hover:bg-[var(--key-surface-hover)] text-[var(--key-muted)] hover:text-[var(--key-text)] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Reset adjustments"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-[var(--key-muted)] hover:text-[var(--key-text)] hover:bg-[var(--key-surface-hover)] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Apply Photo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}