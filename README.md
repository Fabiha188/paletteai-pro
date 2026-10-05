# PaletteAI Pro — React Dynamic UI

A responsive React SPA for exploring, generating, and saving color palettes. It uses real external APIs (Colormind AI palette generation, The Color API for naming/schemes), a local Express proxy to handle CORS, reusable components, an admin dashboard, and search/filter functionality.

## Getting started

```bash
npm install
npm run dev
```

## Run the Colormind proxy (optional but recommended)

The proxy avoids CORS issues when calling the Colormind API from the browser.

```bash
# Terminal 1 — start the proxy
npm run start-proxy

# Terminal 2 — start the app
npm run dev
```

## Run tests

```bash
npm test
```

## Project structure

```
src/
  components/   All React components
  context/      AppContext — global state via React Context API
  hooks/        useLocalStorage custom hook
  utils/        API calls, colour helpers, palette export, live palette fetch
  api/          palettes.json (local fallback data)
server/
  proxy.js      Express proxy for Colormind API
tests/
  api.spec.js          API function tests
  colorHelpers.spec.js Colour utility tests
  extraFeatures.spec.js Color blindness + share link tests
```

## Key features

- **Command palette (⌘K / Ctrl+K)** — a Linear/Notion-style quick-actions launcher: jump to any page, generate a palette, toggle theme, or search your saved palettes by name, all from the keyboard
- **Gradient Maker** — build multi-stop linear or radial gradients with a live preview and one-click CSS copy
- **Drag-to-reorder** — reorder colors in a generated palette by dragging swatches in Studio Pro
- **Dashboard analytics + bulk actions** — a live color-distribution chart across all saved palettes, sortable palette list (newest/oldest/name/color count), and multi-select for bulk delete/export
- **Real client-side routing** — React Router powers actual URLs (`/dashboard`, `/studio`, `/explore`, `/pricing`, `/gradient`), so the browser back/forward buttons and page refresh work correctly, plus a proper 404 page for unmatched routes
- **Global state via Context API** — theme, saved palettes, history, and the shared modals live in `AppContext`, so pages pull what they need with `useApp()` instead of a long prop chain from the root
- **Error boundary** — a top-level `ErrorBoundary` catches render errors and shows a recovery screen instead of a blank white page
- **AI palette generation** — live calls to the Colormind API (via proxy, with automatic fallbacks)
- **Universal color search** — paste any hex code and instantly see its real-world name, RGB/HSL, and swatch, powered by a live lookup against The Color API
- **Live "Explore" feed** — palettes are generated in real time from The Color API's colour-scheme endpoint and merged with a local dataset, so the grid always has fresh, genuinely-fetched data even if the network call fails
- **Image color extraction** — upload or drag-and-drop any photo and pull its dominant colors into a palette, entirely client-side (canvas quantization, no API needed)
- **Color blindness simulator** — every color's modal previews how it looks under protanopia, deuteranopia, tritanopia, and achromatopsia
- **Shareable palette links** — copy a URL that encodes a palette; opening it drops the recipient straight into the Studio with those colors loaded
- **Dashboard / admin panel** — saved palettes with stats, rename, delete, clear-all, sorting, bulk select/delete/export, and search/filter
- **Export tools** — copy any saved palette as CSS custom properties, or download it as JSON or a PNG swatch image
- **Accessibility checker** — every color's modal shows WCAG contrast ratios (AA/AAA/Fail) against black and white
- **Form validation** — the contact form validates required fields and email format before submitting
- **Responsive design** — breakpoints down to 480px
- **Light/dark theme**, toast notifications, palette history, local storage persistence

See `REQUIREMENTS.md` for a full mapping of features to the assignment brief.

## Notes

- If the live network calls fail (offline, rate-limited, blocked by network policy), the app gracefully falls back to local bundled data — it never breaks the UI.

