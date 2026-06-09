export interface ImageFilterDef {
  name: string;
  css: string;
}

export const IMAGE_FILTERS: Record<string, ImageFilterDef> = {
  normal: { name: "Normal", css: "none" },
  noir: { name: "Noir & Blanc", css: "grayscale(100%)" },
  chaleureux: { name: "Chaleureux", css: "sepia(50%) saturate(140%) brightness(110%)" },
  froid: { name: "Froid", css: "hue-rotate(200deg) saturate(80%) brightness(110%)" },
  vintage: { name: "Vintage", css: "sepia(40%) contrast(90%) brightness(90%)" },
  eclat: { name: "Éclat", css: "saturate(150%) contrast(120%) brightness(105%)" },
  dramatique: { name: "Dramatique", css: "contrast(150%) brightness(80%) saturate(110%)" },
  pastel: { name: "Pastel", css: "saturate(70%) brightness(120%) contrast(85%)" },
  lomo: { name: "Lomo", css: "contrast(110%) brightness(105%) saturate(90%) hue-rotate(-10deg)" },
};

export const FILTER_KEYS = Object.keys(IMAGE_FILTERS);
export const DEFAULT_FILTER = "normal";

export function applyFilterToCanvas(
  ctx: CanvasRenderingContext2D,
  filterKey: string,
  drawFn: () => void
) {
  const def = IMAGE_FILTERS[filterKey];
  if (def && def.css !== "none") {
    ctx.filter = def.css;
  }
  drawFn();
  ctx.filter = "none";
}
