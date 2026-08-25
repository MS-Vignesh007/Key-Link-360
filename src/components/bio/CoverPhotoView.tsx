import type { BioCoverPhotoSettings } from "../../types";
import {
  getCoverContainerStyle,
  getCoverHeightClass,
  getCoverImageStyle,
  getCoverInnerStyle,
  getCoverBandHeightPx,
  normalizeCoverSettings
} from "../../lib/bioCoverPhoto";

interface CoverPhotoViewProps {
  src: string;
  alt?: string;
  settings?: Partial<BioCoverPhotoSettings> | null;
  variant?: "editor" | "preview";
  className?: string;
  showFade?: boolean;
  loading?: "eager" | "lazy";
}

export default function CoverPhotoView({
  src,
  alt = "Cover",
  settings,
  variant = "preview",
  className = "",
  showFade = true,
  loading = "eager"
}: CoverPhotoViewProps) {
  const normalized = normalizeCoverSettings(settings);
  const heightClass = normalized.customHeight ? "" : getCoverHeightClass(normalized.height, variant);
  const bandHeightPx = normalized.customHeight || getCoverBandHeightPx(normalized, variant);

  return (
    <div
      className={`key-cover-photo ${heightClass} ${className}`.trim()}
      style={{
        ...getCoverContainerStyle(normalized),
        ...(bandHeightPx ? { height: `${bandHeightPx}px` } : {})
      }}
    >
      <div className="key-cover-photo__inner" style={getCoverInnerStyle(normalized)}>
        <img
          src={src}
          alt={alt}
          style={getCoverImageStyle(normalized)}
          referrerPolicy="no-referrer"
          loading={loading}
          decoding="async"
          fetchPriority={loading === "eager" ? "high" : "auto"}
        />
      </div>
      {showFade && <div className="key-phone-preview__cover-fade" />}
    </div>
  );
}
