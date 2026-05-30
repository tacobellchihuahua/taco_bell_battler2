# 🌮 Taco Bell Framework Battler

A Pokémon-style boss-rush webgame where **Gidget the Chihuahua** fights menu-item bosses representing organizational dysfunctions. Defeat them using management frameworks.

## Stack

Pure static site — vanilla HTML5 Canvas + JS, **no build step**.

```
index.html
style.css
game.js
assets/
  map.png
  tilemap.json
  sprites/   (15 PNG files)
```

## Local testing

From this folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. (Or use any static server — `npx serve`, `caddy file-server`, etc. Don't open `index.html` directly via `file://` — the `fetch()` for `tilemap.json` requires HTTP.)

## Deploy to Vercel

Two options:

### Option A — Drag and drop (no CLI)
1. Go to https://vercel.com/new
2. Drag this entire folder into the browser
3. Vercel auto-detects it as a static site. Click **Deploy**. Done.

### Option B — CLI
```bash
npm i -g vercel
vercel        # follow prompts; accept defaults
vercel --prod # promote to production
```

No `vercel.json` needed. No framework preset. Vercel serves `index.html` from the root and all assets from their relative paths.

## Controls

| Key | Action |
|---|---|
| WASD / Arrows | Move (overworld) · Navigate menus (battle) |
| Space / Enter | Confirm / Advance dialog / Start game |
| Esc / Backspace | Back out of submenu |

## Gameplay

- 5 bosses representing real management problems (siloed teams, burned-out veterans, change-resistant leaders, etc.)
- 7 management frameworks unlocked as you defeat bosses. Each has 4 moves at varying damage tiers — including 5-damage "corporate cliché" traps that look authoritative but accomplish nothing.
- **Super-effective** moves (1.5×) when the framework matches a boss's weakness — but only for substantive moves (≥20 dmg), so cliché traps never bonus.
- The final boss (**Crunchwrap Supreme**) is **phased** — each HP threshold rotates the weakness, forcing you to use multiple frameworks in sequence.
- Blackout (Gidget HP=0) respawns at the Lobby with full HP. Boss progress is preserved.

## File reference

- `game.js` — single-file game engine (~1250 lines). State machine: loading → title → overworld → battle → ending.
- `assets/map.png` — 960×704 tilemap render (30 cols × 22 rows × 32px tiles).
- `assets/tilemap.json` — collision grid and encounter tile codes.
- `assets/sprites/*.png` — 32×32 overworld sprites and 64×64 battle sprites, with transparent backgrounds.

## Tech notes

- Uses Google Fonts (Fugaz One / Montserrat / Roboto Mono) — loads from CDN at runtime.
- `image-rendering: pixelated` + `ctx.imageSmoothingEnabled = false` for crisp sprite scaling.
- Browser storage (localStorage etc.) is **not** used — game state lives in memory and resets on reload. Intentional, to keep the artifact portable.
