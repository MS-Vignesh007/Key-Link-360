import React from "react";
import { BlockDeveloperStyles } from "../types";

/**
 * Computes React inline CSSProperties from developer-grade visual block styles.
 * Mimics Bricks Builder & WordPress FSE CSS generation.
 */
export function computeBlockInlineStyles(
  styles?: BlockDeveloperStyles
): React.CSSProperties {
  if (!styles) return {};

  const css: React.CSSProperties = {};

  // 1. Spacing - Margin
  if (typeof styles.marginTop === "number") css.marginTop = `${styles.marginTop}px`;
  if (typeof styles.marginRight === "number") css.marginRight = `${styles.marginRight}px`;
  if (typeof styles.marginBottom === "number") css.marginBottom = `${styles.marginBottom}px`;
  if (typeof styles.marginLeft === "number") css.marginLeft = `${styles.marginLeft}px`;

  // 1. Spacing - Padding
  if (typeof styles.paddingTop === "number") css.paddingTop = `${styles.paddingTop}px`;
  if (typeof styles.paddingRight === "number") css.paddingRight = `${styles.paddingRight}px`;
  if (typeof styles.paddingBottom === "number") css.paddingBottom = `${styles.paddingBottom}px`;
  if (typeof styles.paddingLeft === "number") css.paddingLeft = `${styles.paddingLeft}px`;

  // 2. Typography
  if (styles.fontFamily && styles.fontFamily !== "inherit") {
    css.fontFamily = styles.fontFamily;
  }
  if (typeof styles.fontSize === "number" && styles.fontSize > 0) {
    css.fontSize = `${styles.fontSize}px`;
  }
  if (styles.fontWeight) {
    css.fontWeight = styles.fontWeight;
  }
  if (typeof styles.lineHeight === "number" && styles.lineHeight > 0) {
    css.lineHeight = styles.lineHeight;
  }
  if (typeof styles.letterSpacing === "number") {
    css.letterSpacing = `${styles.letterSpacing}px`;
  }
  if (styles.textTransform && styles.textTransform !== "none") {
    css.textTransform = styles.textTransform;
  }
  if (styles.textAlign) {
    css.textAlign = styles.textAlign;
  }
  if (styles.textColor) {
    css.color = styles.textColor;
  }

  // 3. Background
  if (styles.bgType === "solid" && styles.bgColor) {
    css.backgroundColor = styles.bgColor;
  } else if (styles.bgType === "gradient") {
    const angle = typeof styles.bgGradientAngle === "number" ? styles.bgGradientAngle : 135;
    const from = styles.bgGradientFrom || "#6366f1";
    const to = styles.bgGradientTo || "#06b6d4";
    css.backgroundImage = `linear-gradient(${angle}deg, ${from}, ${to})`;
  } else if (styles.bgType === "glass") {
    css.backgroundColor = styles.bgColor || "rgba(15, 23, 42, 0.65)";
    const blur = typeof styles.bgBackdropBlur === "number" ? styles.bgBackdropBlur : 12;
    css.backdropFilter = `blur(${blur}px)`;
    css.WebkitBackdropFilter = `blur(${blur}px)`;
  } else if (styles.bgType === "transparent") {
    css.backgroundColor = "transparent";
    css.backgroundImage = "none";
  }

  // 4. Border & Corners
  if (styles.borderStyle && styles.borderStyle !== "none") {
    css.borderStyle = styles.borderStyle;
    css.borderWidth = typeof styles.borderWidth === "number" ? `${styles.borderWidth}px` : "1px";
    css.borderColor = styles.borderColor || "rgba(99, 102, 241, 0.3)";
  }

  // Border Radius (4 corners)
  const tl = typeof styles.borderRadiusTopLeft === "number" ? styles.borderRadiusTopLeft : undefined;
  const tr = typeof styles.borderRadiusTopRight === "number" ? styles.borderRadiusTopRight : undefined;
  const br = typeof styles.borderRadiusBottomRight === "number" ? styles.borderRadiusBottomRight : undefined;
  const bl = typeof styles.borderRadiusBottomLeft === "number" ? styles.borderRadiusBottomLeft : undefined;

  if (tl !== undefined || tr !== undefined || br !== undefined || bl !== undefined) {
    css.borderRadius = `${tl ?? 0}px ${tr ?? 0}px ${br ?? 0}px ${bl ?? 0}px`;
  }

  // 5. Box Shadow
  if (styles.boxShadowPreset && styles.boxShadowPreset !== "none") {
    switch (styles.boxShadowPreset) {
      case "subtle":
        css.boxShadow = "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)";
        break;
      case "soft":
        css.boxShadow = "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)";
        break;
      case "deep":
        css.boxShadow = "0 20px 35px -10px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.2)";
        break;
      case "glow-cyan":
        css.boxShadow = "0 0 25px rgba(6, 182, 212, 0.45), 0 0 50px rgba(6, 182, 212, 0.2)";
        break;
      case "glow-purple":
        css.boxShadow = "0 0 25px rgba(168, 85, 247, 0.45), 0 0 50px rgba(168, 85, 247, 0.2)";
        break;
      case "custom": {
        const x = styles.shadowX ?? 0;
        const y = styles.shadowY ?? 8;
        const blur = styles.shadowBlur ?? 20;
        const spread = styles.shadowSpread ?? 0;
        const color = styles.shadowColor || "rgba(0, 0, 0, 0.25)";
        css.boxShadow = `${x}px ${y}px ${blur}px ${spread}px ${color}`;
        break;
      }
    }
  }

  // 6. Interactive Size & Scale Dimensions
  if (typeof styles.scale === "number" && styles.scale > 0 && styles.scale !== 1) {
    css.transform = `scale(${styles.scale})`;
    css.transformOrigin = "center center";
  } else if (typeof styles.customScale === "number" && styles.customScale > 0 && styles.customScale !== 1) {
    css.transform = `scale(${styles.customScale})`;
    css.transformOrigin = "center center";
  }

  if (typeof styles.minHeight === "number" && styles.minHeight > 0) {
    css.minHeight = `${styles.minHeight}px`;
  }

  return css;
}

/**
 * Returns optional custom class names and aria tags defined by developers.
 */
export function getBlockCustomMeta(styles?: BlockDeveloperStyles): {
  className: string;
  ariaLabel?: string;
} {
  return {
    className: styles?.customCssClass?.trim() || "",
    ariaLabel: styles?.customAriaLabel?.trim() || undefined
  };
}
