/** Bright purple palette for bio page link buttons (matches app accent). */
export const BIO_LINK = {
  bg: "#7c3aed",
  bgBright: "linear-gradient(135deg, #818cf8 0%, #7c3aed 50%, #a855f7 100%)",
  bgHover: "#6d28d9",
  text: "#FFFFFF",
  arrowOnPurple: "#ede9fe",
  arrowOnLight: "#7c3aed",
  focus: "#8b5cf6",
  softBg: "#ede9fe",
  softBorder: "#ddd6fe",
  softText: "#7c3aed",
  rsvp: "#7c3aed",
  rsvpHover: "#6d28d9",
} as const;

export function getLinkButtonStyle(block: { bgColor?: string; textColor?: string }) {
  const bg = block.bgColor?.toUpperCase();
  const usesBrightPurple = !bg || bg === "#FFFFFF" || bg === BIO_LINK.bg.toUpperCase();
  if (block.bgColor && !usesBrightPurple) {
    return {
      backgroundColor: block.bgColor,
      color: block.textColor || "#0F172A",
    };
  }
  return {
    background: BIO_LINK.bgBright,
    color: block.textColor || BIO_LINK.text,
  };
}

export function getLinkArrowColor(block: { bgColor?: string; textColor?: string }) {
  if (block.textColor) return block.textColor;
  const bg = block.bgColor?.toUpperCase();
  if (!bg || bg === "#FFFFFF") return BIO_LINK.arrowOnLight;
  return BIO_LINK.arrowOnPurple;
}

export function isDefaultBrightLink(block: { bgColor?: string }) {
  const bg = block.bgColor?.toUpperCase();
  return !bg || bg === "#FFFFFF" || bg === BIO_LINK.bg.toUpperCase();
}
