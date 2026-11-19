# Neon Coast Cover Studio

An offline web app that turns your own photos into multi-panel, GTA-style
cover art — the iconic poster grid with bold caption lettering and a Vice
City sunset / neon grade — and exports it as a PNG ready to share. Built for
the make.fun competition
[gta6-cover-art-01](https://make.fun/bounties/gta6-cover-art-01).

Everything runs locally in the browser: no uploads, no network requests, no
build step. Photos never leave your machine. All branding is invented
("Neon Coast") and all lettering uses free fonts — Anton and Pacifico,
vendored under the SIL Open Font License (see `app/fonts/`).

## Features

- **Photos** — multi-file upload and drag-and-drop, plus four built-in
  sample photos. Click a cover panel, then click a photo (or use the Panel
  photo menu) to assign it to that panel; different panels can hold
  different photos.
- **Per-panel crop & position** — select a panel on the cover, drag to pan,
  zoom with the slider or the mouse wheel, so any photo fits any panel.
- **Six layouts** — 3×3 Cover Mosaic with varied panel spans, Hero + Strip,
  Hero and Three, Full Bleed, Duo Split and Magazine Portrait.
- **Five grades** — Sunset gradient-map, Neon duotone (pink/teal), Golden
  Hour, Vice Pastel and Noir, plus film grain and vignette toggles and
  saturation / contrast sliders.
- **Lettering** — big Anton title with a sunset-gradient fill and heavy
  outline, a Pacifico neon-script subtitle, editable title / subtitle /
  caption / badge fields, a title-size slider, a 1–5 star "heat meter" and
  a badge ribbon (e.g. LAUNCH WEEK).
- **Export** — one click renders the cover at full size on a canvas and
  downloads a PNG at 1080×1080, 1080×1350 or 1920×1080.

## Run it locally

Needs Node.js 22 or later:

```
node serve.ts            # serves app/ at http://localhost:8080
node serve.ts --port 8090
```

Then open the address in a desktop browser, drop in photos, pick a layout
and grade, letter your caption, and hit **Export PNG**.

## How export works

The editor preview and the export share one renderer (`app/src/render.js`).
Export creates a fresh off-screen canvas at exactly the chosen post size,
re-renders the current layout, panel crops, grade and lettering onto it at
full resolution, and saves it with `canvas.toBlob(..., 'image/png')` as
`neon-coast-cover-<W>x<H>.png`.

## Handing it in (make.fun)

`node main.ts` copies `app/` and `screenshots/` to the output directory
(`/output`, or `$MAKEFUN_OUTPUT_DIR`) and writes `dossier.json` with the
vendored `vendor/makefun-app.ts` library, exactly as the competition gate
expects:

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshot scenes for reproducible captures live in `shots.json`, e.g.
`?shot=cover&photo=boulevard&caption=Sunset%20Heist&layout=mosaic&grade=sunset&size=1080x1080`
renders only the finished cover, and `?shot=editor&photo=neon` shows the
editor with that photo loaded.

## Credits

- Entry built for make.fun — competition:
  https://make.fun/bounties/gta6-cover-art-01
- Referral: https://make.fun/r/1c94brae
- Fonts: Anton and Pacifico by their respective authors, SIL Open Font
  License 1.1 (texts in `app/fonts/`).
- Sample photos: two from the competition starter kit (made for make.fun
  with an image model) and two generated for this entry in the same style.

## License

MIT — see `LICENSE`.
