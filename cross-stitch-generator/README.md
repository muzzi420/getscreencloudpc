# StitchMade — Custom Cross Stitch Pattern Generator

Self-serve web app: customers type a name/date, pick a template (wedding or
baby announcement), see a live cross-stitch chart preview, and buy a clean
PDF. No backend, no build step — plain HTML/CSS/JS.

## Run it locally

```
cd cross-stitch-generator
python3 -m http.server 8000
```

Open http://localhost:8000

## Deploy

It's a static site — drag the `cross-stitch-generator` folder into Netlify,
or push it to GitHub Pages / Vercel. No build step needed.

## Before you go live: set up Gumroad

1. Create a product on Gumroad (e.g. "Custom Cross Stitch Pattern PDF"),
   price it (default in the app assumes $9).
2. In the product's **Settings**, turn on **"Generate a unique license key
   per sale."** This is what lets the app verify a purchase without a
   backend.
3. Open `config.js` and fill in:
   - `gumroadPermalink` — the part after `gumroad.com/l/` in your product URL.
   - `gumroadProductId` — found in the product edit page URL, or via the
     Gumroad API.
   - `price` — the label shown on the buy button.

## Selling ready-made patterns (Shop section)

The page also has a **Shop Ready-Made Patterns** section for patterns you've
already designed — no personalization, just a straight PDF sale.

1. Create one Gumroad product per pattern.
2. Open `products.js` and replace the placeholder entries with your real
   patterns: name, price, description, and the product's `gumroadPermalink`.
3. Optional: add product photos to an `assets/` folder and set `image` to
   the file path — otherwise the card shows a plain placeholder.

## Custom pet portraits (automated)

Customers upload a photo and get an instant pattern — no manual design work.
The pipeline avoids the usual "confetti" problem (scattered single-stitch
noise) with three steps instead of a naive per-pixel color match:

1. **Progressive canvas downsampling** — repeated halving instead of one
   big scale jump, so the image is properly box-averaged (smoothed) before
   anything is quantized.
2. **K-means clustering** to a small, customer-chosen color count (6–20),
   so colors come from the photo's actual clusters rather than matching
   every pixel independently against the full DMC catalog.
3. **Island cleanup** — any leftover region smaller than ~3 stitches gets
   folded into whichever color surrounds it most, removing the last
   speckle.

Code: `dmcPalette.js` (reference thread colors), `photoConverter.js` (the
pipeline above), `pet.js` (upload UI, controls, wiring into the existing
renderer/PDF/Gumroad-unlock code shared with the rest of the app).

Set up its own Gumroad product the same way as the main one (unique license
keys per sale), then fill in `gumroadPetPermalink`, `gumroadPetProductId`,
and `petPrice` in `config.js`.

There's also a **secondary fallback link** to a Google Form for customers
who want a fully custom hand-designed piece (multiple pets, special layout)
instead of the automated tool — set `customPetFormUrl` in `config.js` the
same way as before.

**Caveat:** the DMC matches are approximate (see below) — for pets with a
lot of fine texture (long/patterned fur), test a few color-count settings
and sizes to see what reads best before relying on this for every order.

## How personalization works

- `motifs.js` — decorative shapes (heart, rings, flower, star, border) are
  generated from math (heart curve, polygon star, etc.), not hand-drawn
  bitmaps, so they stay clean at any size.
- `textRaster.js` — renders the customer's typed text with a real browser
  font onto an offscreen canvas, then samples it down into stitch cells.
  This is what lets any name/date look right without a hand-built pixel
  font.
- `templates.js` — each template declares its grid size, color palette,
  motif placement, and text zones. Add a new template by adding an entry
  here.
- `renderer.js` / `pdfExport.js` — draw the grid to a canvas (with a
  watermark when unpurchased) and export it to a PDF with a DMC-style
  color legend.

## What's still MVP-scoped

- 2 categories (wedding, baby announcement) x 2 template styles each.
  Adding more is just adding entries to `templates.js`.
- The DMC codes in each template's legend (and in `dmcPalette.js` used by
  the pet portrait tool) are representative approximations of ~50 common
  colors, not a precise colour-managed conversion — confirm exact shades
  against a physical DMC card before buying thread in bulk.
- The license-key unlock calls Gumroad's public verify endpoint directly
  from the browser — fine for this MVP, but note it means the product ID
  is visible client-side (normal for Gumroad's license flow).
