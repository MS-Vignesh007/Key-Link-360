import React, { useCallback } from "react";

/**
 * Lightweight React mouse-move listener hook for position-aware radial button animations.
 * Sets CSS custom properties --mouse-x and --mouse-y on the button element during hover.
 */
export function usePositionAwareHover() {
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
  }, []);

  return { onMouseMove };
}

export default usePositionAwareHover;
