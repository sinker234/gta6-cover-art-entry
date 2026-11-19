// Canvas renderer for Neon Coast Cover Studio.
// Draws the panel grid, applies a colour grade per panel and across the whole
// cover, then letters the title block, heat meter, badge and caption.

export const GRADES = [
  { id: 'sunset', name: 'Sunset Gradient' },
  { id: 'neon', name: 'Neon Duotone' },
  { id: 'golden', name: 'Golden Hour' },
  { id: 'vice', name: 'Vice Pastel' },
  { id: 'noir', name: 'Noir' },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

const GRADE_FILTER = {
  sunset: (s, c) => `saturate(${1.25 * s}) contrast(${1.08 * c}) brightness(1.03)`,
  neon: (s, c) => `saturate(${1.5 * s}) contrast(${1.22 * c}) brightness(1.02)`,
  golden: (s, c) => `sepia(0.38) saturate(${1.3 * s}) contrast(${1.05 * c}) brightness(1.07)`,
  vice: (s, c) => `saturate(${0.95 * s}) contrast(${0.94 * c}) brightness(1.12)`,
  noir: (s, c) => `grayscale(1) contrast(${1.3 * c}) brightness(0.98)`,
};

function gradeOverlay(ctx, gradeId, x, y, w, h) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (gradeId === 'sunset') {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(255,176,66,0.20)'); g.addColorStop(0.55, 'rgba(255,94,98,0.22)'); g.addColorStop(1, 'rgba(120,40,160,0.34)');
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'multiply';
    const g2 = ctx.createLinearGradient(x, y + h * 0.4, x, y + h);
    g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(1, 'rgba(80,10,70,0.28)');
    ctx.fillStyle = g2; ctx.fillRect(x, y, w, h);
  } else if (gradeId === 'neon') {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, 'rgba(255,45,150,0.34)'); g.addColorStop(1, 'rgba(0,220,210,0.34)');
    ctx.globalCompositeOperation = 'hard-light'; ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'screen';
    const g2 = ctx.createLinearGradient(x, y, x, y + h);
    g2.addColorStop(0, 'rgba(0,40,80,0.18)'); g2.addColorStop(1, 'rgba(255,0,110,0.16)');
    ctx.fillStyle = g2; ctx.fillRect(x, y, w, h);
  } else if (gradeId === 'golden') {
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,160,40,0.42)'; ctx.fillRect(x, y, w, h);
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,220,160,0.18)'; ctx.fillRect(x, y, w, h);
  } else if (gradeId === 'vice') {
    const g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, 'rgba(140,240,255,0.20)'); g.addColorStop(1, 'rgba(255,170,220,0.26)');
    ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  } else if (gradeId === 'noir') {
    ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(40,40,55,0.22)'; ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

let noiseCanvas = null;
function makeNoise() {
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 180; noiseCanvas.height = 180;
  const nctx = noiseCanvas.getContext('2d');
  const img = nctx.createImageData(180, 180);
  let seed = 42;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const v = 110 + (seed % 145);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  nctx.putImageData(img, 0, 0);
}

function drawPanelPhoto(ctx, panel, state, gradeId, sat, con, W, H) {
  const x = panel.x * W, y = panel.y * H, w = panel.w * W, h = panel.h * H;
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.fillStyle = '#241430'; ctx.fillRect(x, y, w, h);
  const img = state ? state.img : null;
  if (img) {
    const zoom = state.zoom || 1;
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const scale = base * zoom;
    const pw = img.naturalWidth * scale, ph = img.naturalHeight * scale;
    const px = x + (w - pw) / 2 + (state.panX || 0) * w;
    const py = y + (h - ph) / 2 + (state.panY || 0) * h;
    try { ctx.filter = GRADE_FILTER[gradeId](sat, con); } catch { ctx.filter = 'none'; }
    ctx.drawImage(img, px, py, pw, ph);
    ctx.filter = 'none';
  } else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, '#ff9a5a'); g.addColorStop(1, '#7b2d8b');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
  gradeOverlay(ctx, gradeId, x, y, w, h);
}

function drawStar(ctx, cx, cy, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? '#ffd23e' : 'rgba(255,255,255,0.28)';
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = r * 0.12;
  ctx.fill(); ctx.stroke();
}

function fitFont(ctx, text, weight, family, startSize, maxWidth) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (ctx.measureText(text).width > maxWidth && size > 14) {
    size -= 4; ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

export function drawLettering(ctx, opts, W, H) {
  const { title, subtitle, caption, heat, badge, titleScale } = opts;
  const cx = W / 2;
  // Top scrim so lettering reads over any photo.
  const scrim = ctx.createLinearGradient(0, 0, 0, H * 0.34);
  scrim.addColorStop(0, 'rgba(10,4,24,0.55)'); scrim.addColorStop(1, 'rgba(10,4,24,0)');
  ctx.fillStyle = scrim; ctx.fillRect(0, 0, W, H * 0.34);

  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  // Subtitle in neon script above the title.
  if (subtitle.trim()) {
    const sSize = H * 0.052 * titleScale;
    ctx.font = `${sSize}px Pacifico, cursive`;
    ctx.shadowColor = '#ff2d95'; ctx.shadowBlur = sSize * 0.55;
    ctx.fillStyle = '#7df9ff';
    ctx.fillText(subtitle.trim(), cx, H * 0.105);
    ctx.shadowBlur = 0;
  }
  // Main title: sunset gradient fill, heavy outline.
  const titleText = (title.trim() || 'NEON COAST').toUpperCase();
  const tSize = fitFont(ctx, titleText, '', 'Anton, "Arial Black", sans-serif', H * 0.135 * titleScale, W * 0.92);
  ctx.font = `${tSize}px Anton, "Arial Black", sans-serif`;
  const ty = H * 0.105 + tSize * 1.02 + H * 0.045;
  const grad = ctx.createLinearGradient(0, ty - tSize, 0, ty);
  grad.addColorStop(0, '#ffe259'); grad.addColorStop(0.5, '#ff7518'); grad.addColorStop(1, '#ff2d95');
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = tSize * 0.16;
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = tSize * 0.18; ctx.shadowOffsetY = tSize * 0.05;
  ctx.strokeText(titleText, cx, ty);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = grad; ctx.fillText(titleText, cx, ty);
  ctx.strokeStyle = 'rgba(20,5,30,0.85)'; ctx.lineWidth = tSize * 0.03; ctx.strokeText(titleText, cx, ty);

  // Heat meter: five star slots centred under the title, filled up to heat.
  const starR = H * 0.020;
  const rowW = 5 * starR * 2.5;
  for (let i = 0; i < 5; i++) {
    drawStar(ctx, cx - rowW / 2 + starR * 1.25 + i * starR * 2.5, ty + H * 0.048, starR, i < heat);
  }

  // Badge ribbon, top-left, slightly tilted.
  if (badge.trim()) {
    ctx.save();
    ctx.translate(W * 0.115, H * 0.045); ctx.rotate(-0.10);
    ctx.font = `${H * 0.026}px Anton, sans-serif`;
    const bw = ctx.measureText(badge.trim().toUpperCase()).width + W * 0.035;
    const bh = H * 0.048;
    ctx.fillStyle = '#ff2d95'; ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
    ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'middle';
    ctx.fillText(badge.trim().toUpperCase(), 0, 1);
    ctx.restore(); ctx.textBaseline = 'alphabetic';
  }

  // Caption band at the foot.
  if (caption.trim()) {
    const bandH = H * 0.115;
    const band = ctx.createLinearGradient(0, H - bandH, 0, H);
    band.addColorStop(0, 'rgba(12,4,26,0)'); band.addColorStop(0.35, 'rgba(12,4,26,0.82)'); band.addColorStop(1, 'rgba(12,4,26,0.94)');
    ctx.fillStyle = band; ctx.fillRect(0, H - bandH * 1.5, W, bandH * 1.5);
    const cSize = fitFont(ctx, caption.trim().toUpperCase(), '', 'Anton, "Arial Black", sans-serif', H * 0.062, W * 0.9);
    ctx.font = `${cSize}px Anton, "Arial Black", sans-serif`;
    ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,0.9)'; ctx.lineWidth = cSize * 0.22;
    ctx.strokeText(caption.trim().toUpperCase(), cx, H - H * 0.035);
    ctx.fillStyle = '#ffffff'; ctx.fillText(caption.trim().toUpperCase(), cx, H - H * 0.035);
  }
}

export function renderCover(canvas, view) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#180a26'; ctx.fillRect(0, 0, W, H);
  const layout = view.layout;
  layout.panels.forEach((panel, i) => {
    drawPanelPhoto(ctx, panel, view.panels[i], view.grade, view.saturation, view.contrast, W, H);
  });
  // Panel dividers: thick white poster lines with a dark edge.
  const gap = Math.max(4, W * 0.008);
  ctx.fillStyle = '#ffffff';
  layout.panels.forEach((panel) => {
    const x = panel.x * W, y = panel.y * H, w = panel.w * W, h = panel.h * H;
    if (x > 0) ctx.fillRect(x - gap / 2, y, gap, h);
    if (y > 0) ctx.fillRect(x, y - gap / 2, w, gap);
  });
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = gap * 1.6; ctx.strokeRect(0, 0, W, H);

  // Selected panel highlight (editor only).
  if (view.highlight >= 0 && view.panels[view.highlight]) {
    const p = layout.panels[view.highlight];
    ctx.strokeStyle = '#ffd23e'; ctx.lineWidth = Math.max(4, W * 0.007);
    ctx.setLineDash([18, 10]); ctx.strokeRect(p.x * W + 4, p.y * H + 4, p.w * W - 8, p.h * H - 8); ctx.setLineDash([]);
  }

  if (view.vignette) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(8,2,18,0.52)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
  drawLettering(ctx, view, W, H);
  if (view.grain) {
    if (!noiseCanvas) makeNoise();
    ctx.save(); ctx.globalAlpha = 0.10; ctx.globalCompositeOperation = 'overlay';
    const pat = ctx.createPattern(noiseCanvas, 'repeat');
    ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
