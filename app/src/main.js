// Neon Coast Cover Studio: editor wiring.
// Holds the photo library and one crop state per panel, re-renders the live
// preview on every change, handles drag-pan and wheel-zoom on the canvas,
// and exports a full-size PNG rendered fresh at the chosen post size.

import { LAYOUTS, layoutById } from './layouts.js';
import { GRADES, renderCover } from './render.js';
import { SAMPLES, parseShotQuery, parseSize, orderedSampleIds, markShotReady } from './shots.js';

const canvas = document.getElementById('cover');
const els = {
  file: document.getElementById('fileInput'), drop: document.getElementById('drop'),
  thumbs: document.getElementById('thumbs'), layout: document.getElementById('layoutSel'),
  grade: document.getElementById('gradeSel'), panelPhoto: document.getElementById('panelPhotoSel'),
  zoom: document.getElementById('zoom'), sat: document.getElementById('sat'), con: document.getElementById('con'),
  grain: document.getElementById('grain'), vignette: document.getElementById('vignette'),
  title: document.getElementById('titleInput'), subtitle: document.getElementById('subtitleInput'),
  caption: document.getElementById('captionInput'), badge: document.getElementById('badgeInput'),
  titleSize: document.getElementById('titleSize'), heat: document.getElementById('heatSel'),
  size: document.getElementById('sizeSel'), status: document.getElementById('status'),
  panelHint: document.getElementById('panelHint'),
};

const photos = []; // { id, label, img, url }
let panels = []; // per layout panel: { photoId, panX, panY, zoom }
let selectedPanel = 0;
let isShotCover = false;

export function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function photoById(id) { return photos.find((p) => p.id === id) || photos[0]; }

function ensurePanels() {
  const layout = layoutById(els.layout.value);
  while (panels.length < layout.panels.length) {
    const idx = panels.length;
    const lead = photos[idx % Math.max(1, photos.length)];
    panels.push({ photoId: lead ? lead.id : null, panX: 0, panY: 0, zoom: 1 });
  }
  if (selectedPanel >= layout.panels.length) selectedPanel = 0;
}

function currentView(highlight) {
  ensurePanels();
  const layout = layoutById(els.layout.value);
  return {
    layout,
    panels: layout.panels.map((_, i) => {
      const st = panels[i];
      const photo = st.photoId ? photoById(st.photoId) : photos[0];
      return { img: photo ? photo.img : null, panX: st.panX, panY: st.panY, zoom: st.zoom };
    }),
    grade: els.grade.value,
    saturation: Number(els.sat.value), contrast: Number(els.con.value),
    grain: els.grain.checked, vignette: els.vignette.checked,
    title: els.title.value, subtitle: els.subtitle.value, caption: els.caption.value,
    badge: els.badge.value, heat: Number(els.heat.value), titleScale: Number(els.titleSize.value),
    highlight: highlight ? selectedPanel : -1,
  };
}

function redraw() {
  renderCover(canvas, currentView(!isShotCover));
  els.panelHint.textContent = `Panel ${selectedPanel + 1} selected — drag to pan, scroll to zoom.`;
  syncPanelControls();
}

function syncPanelControls() {
  ensurePanels();
  const st = panels[selectedPanel];
  if (!st) return;
  els.panelPhoto.innerHTML = '';
  photos.forEach((p) => {
    const opt = document.createElement('option');
    opt.value = p.id; opt.textContent = p.label;
    if (p.id === st.photoId) opt.selected = true;
    els.panelPhoto.appendChild(opt);
  });
  els.zoom.value = String(st.zoom || 1);
  [...els.thumbs.children].forEach((btn, i) => btn.classList.toggle('active', photos[i] && photos[i].id === st.photoId));
}

function addPhoto(id, label, img, url) {
  photos.push({ id, label, img, url });
  const btn = document.createElement('button');
  btn.type = 'button'; btn.title = label;
  const thumb = document.createElement('img');
  thumb.src = url; thumb.alt = label;
  btn.appendChild(thumb);
  btn.addEventListener('click', () => {
    ensurePanels();
    panels[selectedPanel].photoId = id;
    redraw();
  });
  els.thumbs.appendChild(btn);
}

async function addFiles(fileList) {
  for (const file of fileList) {
    const url = URL.createObjectURL(file);
    const img = await loadImageFromUrl(url);
    addPhoto(`upload-${Date.now()}-${photos.length}`, file.name.slice(0, 18), img, url);
  }
  ensurePanels();
  // Spread fresh uploads across panels when there are several.
  redraw();
}

function fillSelect(select, items) {
  items.forEach((item) => {
    const opt = document.createElement('option');
    opt.value = item.id; opt.textContent = item.name || item.label;
    select.appendChild(opt);
  });
}

async function exportPng() {
  const [w, h] = parseSize(els.size.value, 1080, 1080);
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  renderCover(off, { ...currentView(false) });
  off.toBlob((blob) => {
    if (!blob) { els.status.textContent = 'Export failed in this browser.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    els.status.textContent = `Saved neon-coast-cover-${w}x${h}.png`;
    window.__lastExportBytes = blob.size;
  }, 'image/png');
}
// Exposed for automated checks of the export path.
window.__exportPng = exportPng;
window.__coverCanvas = canvas;

function panelAtEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const fx = (event.clientX - rect.left) / rect.width;
  const fy = (event.clientY - rect.top) / rect.height;
  const layout = layoutById(els.layout.value);
  const idx = layout.panels.findIndex((p) => fx >= p.x && fx < p.x + p.w && fy >= p.y && fy < p.y + p.h);
  return { idx: idx < 0 ? selectedPanel : idx, fx, fy };
}

function wireEditor() {
  els.file.addEventListener('change', () => { addFiles(els.file.files); });
  ['dragover', 'dragenter'].forEach((t) => els.drop.addEventListener(t, (e) => { e.preventDefault(); els.drop.classList.add('dragging'); }));
  ['dragleave', 'drop'].forEach((t) => els.drop.addEventListener(t, (e) => { e.preventDefault(); els.drop.classList.remove('dragging'); }));
  els.drop.addEventListener('drop', (e) => { if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
  [els.layout, els.grade].forEach((el) => el.addEventListener('change', redraw));
  [els.sat, els.con, els.titleSize].forEach((el) => el.addEventListener('input', redraw));
  [els.grain, els.vignette].forEach((el) => el.addEventListener('change', redraw));
  [els.title, els.subtitle, els.caption, els.badge, els.heat].forEach((el) => el.addEventListener('input', redraw));
  els.heat.addEventListener('change', redraw);
  els.panelPhoto.addEventListener('change', () => { panels[selectedPanel].photoId = els.panelPhoto.value; redraw(); });
  els.zoom.addEventListener('input', () => { panels[selectedPanel].zoom = Number(els.zoom.value); redraw(); });
  els.size.addEventListener('change', () => {
    const [w, h] = parseSize(els.size.value, 1080, 1080);
    canvas.width = w; canvas.height = h; redraw();
  });
  document.getElementById('exportBtn').addEventListener('click', exportPng);

  let dragging = null;
  canvas.addEventListener('pointerdown', (e) => {
    const { idx } = panelAtEvent(e);
    selectedPanel = idx;
    dragging = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const layout = layoutById(els.layout.value);
    const p = layout.panels[selectedPanel];
    panels[selectedPanel].panX += (e.clientX - dragging.x) / (rect.width * p.w);
    panels[selectedPanel].panY += (e.clientY - dragging.y) / (rect.height * p.h);
    dragging = { x: e.clientX, y: e.clientY };
    redraw();
  });
  canvas.addEventListener('pointerup', () => { dragging = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const st = panels[selectedPanel];
    st.zoom = Math.min(3, Math.max(1, (st.zoom || 1) * (e.deltaY < 0 ? 1.07 : 0.93)));
    redraw();
  }, { passive: false });
}

async function init() {
  fillSelect(els.layout, LAYOUTS);
  fillSelect(els.grade, GRADES);
  const shot = parseShotQuery(location.search);
  if (shot.shot) {
    els.layout.value = shot.layout;
    els.grade.value = shot.grade;
    els.caption.value = shot.caption;
  }
  const order = orderedSampleIds(shot.photo);
  for (const id of order) {
    const sample = SAMPLES.find((s) => s.id === id);
    const url = `samples/${id}.jpg`;
    const img = await loadImageFromUrl(url);
    addPhoto(id, sample.label, img, url);
  }
  // Default fill: cycle the samples through the panels.
  panels = layoutById(els.layout.value).panels.map((_, i) => ({
    photoId: photos[i % photos.length].id, panX: 0, panY: 0, zoom: 1,
  }));
  wireEditor();
  try {
    await Promise.all([
      document.fonts.load('100px Anton'), document.fonts.load('60px Pacifico'),
    ]);
    await document.fonts.ready;
  } catch { /* fall back to local heavy fonts */ }

  if (shot.shot === 'cover') {
    isShotCover = true;
    document.body.classList.add('shot-cover');
    const [w, h] = parseSize(shot.size, 1080, 1080);
    canvas.width = w; canvas.height = h;
    els.size.value = `${w}x${h}`;
    redraw();
    markShotReady();
  } else if (shot.shot === 'editor') {
    document.body.classList.add('shot-editor');
    redraw();
    markShotReady();
  } else {
    redraw();
  }
}

init();
