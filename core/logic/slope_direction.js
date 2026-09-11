// slope_direction.js
// LonesomeTheBlue slope classification (pure)

export function classifySlope(slope, prevSlope) {
  if (slope > 0) {
    if (slope > prevSlope) return { dir: "up_strong", arrow: "⇑" };
    return { dir: "up_weak", arrow: "⇗" };
  }

  if (slope < 0) {
    if (slope < prevSlope) return { dir: "down_strong", arrow: "⇓" };
    return { dir: "down_weak", arrow: "⇘" };
  }

  return { dir: "flat", arrow: "⇒" }; // No trend
}
