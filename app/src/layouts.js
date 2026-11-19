// Layout definitions for Neon Coast Cover Studio.
// Each layout is a list of panels in normalised coordinates (fractions of the
// cover width and height) that tile the cover without gaps. The renderer
// scales them to whatever export size is chosen.

export const LAYOUTS = [
  {
    id: 'mosaic', name: 'Cover Mosaic 3x3',
    panels: [
      { x: 0, y: 0, w: 0.36, h: 0.44 }, { x: 0.36, y: 0, w: 0.32, h: 0.28 }, { x: 0.68, y: 0, w: 0.32, h: 0.44 },
      { x: 0.36, y: 0.28, w: 0.32, h: 0.30 }, { x: 0, y: 0.44, w: 0.36, h: 0.32 }, { x: 0.68, y: 0.44, w: 0.32, h: 0.32 },
      { x: 0.36, y: 0.58, w: 0.32, h: 0.42 }, { x: 0, y: 0.76, w: 0.36, h: 0.24 }, { x: 0.68, y: 0.76, w: 0.32, h: 0.24 },
    ],
  },
  {
    id: 'hero-strip', name: 'Hero + Strip',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.68 },
      { x: 0, y: 0.68, w: 0.34, h: 0.32 }, { x: 0.34, y: 0.68, w: 0.33, h: 0.32 }, { x: 0.67, y: 0.68, w: 0.33, h: 0.32 },
    ],
  },
  {
    id: 'hero-three', name: 'Hero and Three',
    panels: [
      { x: 0, y: 0, w: 0.62, h: 1 },
      { x: 0.62, y: 0, w: 0.38, h: 0.34 }, { x: 0.62, y: 0.34, w: 0.38, h: 0.33 }, { x: 0.62, y: 0.67, w: 0.38, h: 0.33 },
    ],
  },
  {
    id: 'full-bleed', name: 'Full Bleed',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
  {
    id: 'duo', name: 'Duo Split',
    panels: [{ x: 0, y: 0, w: 0.5, h: 1 }, { x: 0.5, y: 0, w: 0.5, h: 1 }],
  },
  {
    id: 'magazine', name: 'Magazine Portrait',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.58 },
      { x: 0, y: 0.58, w: 0.5, h: 0.42 }, { x: 0.5, y: 0.58, w: 0.5, h: 0.42 },
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}
