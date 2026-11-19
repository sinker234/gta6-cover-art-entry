// Fixed screenshot scenes for Neon Coast Cover Studio.
// ?shot=cover renders only the finished cover, full-viewport, at the size
// named by size=WxH (default 1080x1080), with layout and grade overrides.
// ?shot=editor shows the editor with the named sample loaded into the mosaic.
// The named photo leads the panel fill; the other samples fill later panels
// in order, so a mosaic cover shows several photos at once.

export const SAMPLES = [
  { id: 'boulevard', label: 'Boulevard' },
  { id: 'pier', label: 'Pier' },
  { id: 'neon', label: 'Neon Street' },
  { id: 'convertible', label: 'Convertible' },
];

export function parseShotQuery(search) {
  const q = new URLSearchParams(search);
  return {
    shot: q.get('shot'),
    photo: q.get('photo') || 'boulevard',
    caption: q.get('caption') || 'Sunset Heist',
    layout: q.get('layout') || 'mosaic',
    grade: q.get('grade') || 'sunset',
    size: q.get('size') || '1080x1080',
  };
}

export function parseSize(text, fallbackW, fallbackH) {
  const m = /^(\d+)x(\d+)$/.exec(text || '');
  if (!m) return [fallbackW, fallbackH];
  return [Number(m[1]), Number(m[2])];
}

export function orderedSampleIds(leadId) {
  const ids = SAMPLES.map((s) => s.id);
  const at = ids.indexOf(leadId);
  if (at <= 0) return ids;
  return [...ids.slice(at), ...ids.slice(0, at)];
}

export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
    document.body.dataset.shotReady = 'true';
  }));
}
