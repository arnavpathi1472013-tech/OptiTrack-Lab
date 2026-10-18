# OptiTrack Lab — deployment & test guide
Files: index.html, style.css, app.js, sw.js, manifest.webmanifest, icons/ (icon.svg, icon-192.png, icon-512.png). No external requests.

## Deploy (HTTPS static host)
Service workers/installation need HTTPS or localhost; `file://` will not work.
1. Netlify Drop / Cloudflare Pages / GitHub Pages: upload the `optitrack-lab` folder contents (index.html at the root).
2. Open the https:// URL on the phone in Chrome. Local test: `python3 -m http.server 8000` then http://localhost:8000.
3. After editing any file, change `V='optitrack-v1'` in sw.js (e.g. v2) so old caches are replaced.

## Install on Android Chrome
Open the URL while online → ⋮ menu → "Install app" / "Add to Home screen" → open from the home screen. Wait until the badge says **OFFLINE READY ✓** (it checks every asset is in the cache).

## Offline test checklist
1. Open once online; badge shows OFFLINE READY ✓ (reload once if it says RELOAD ONCE).
2. Turn on airplane mode (Wi-Fi and data off).
3. Fully close the app, reopen from the home icon.
4. Confirm it loads, Demo: Sample Path draws, CSV/PNG export work.
5. Repeat after a phone restart.

## Physical mouse test checklist
1. Connect a USB-C OTG adapter and wired mouse (a Bluetooth mouse also works if paired).
2. A mouse pointer should appear on the phone; open the installed app.
3. Tap Start Tracking, then move the mouse over the graph.
4. Confirm "Mouse input detected" and badge LIVE, with X/Y and ΔX/ΔY changing.
5. No events? Try Chrome instead of the installed app, another cable/adapter, or use DEMO MODE. Support depends on phone, Android version, browser and adapter; it is not guaranteed.

## What it can and cannot measure
Can: browser-reported pointer positions, their changes (ΔX, ΔY), direction, calculated path length in graph units (pixels).
Cannot: the optical sensor's surface images, internal DSP data, raw counts/CPI, or physical distance. Cursor movement is processed by the OS (acceleration, scaling) before the browser sees it. Demo data is simulated and always labelled DEMO.
