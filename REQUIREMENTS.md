# Requirements Mapping — Week 6 Final Project

**Project:** PaletteAI Pro — a React color-palette generator, explorer, and admin dashboard.

| Requirement | How it's met | Where |
|---|---|---|
| React.js project | Built with React 18 + Vite. Functional components, hooks (`useState`, `useEffect`, `useContext`, custom `useLocalStorage`), React Router for navigation. | `src/App.jsx`, `src/main.jsx`, `src/hooks/useLocalStorage.js` |
| Dynamic UI | Live palette generation, animated hero, theme toggle (light/dark), toast notifications, modals that open/close with state, real-time debounced color search, drag-and-drop image upload. | `Hero.jsx`, `PaletteStudio.jsx`, `StudioPro.jsx`, `ColorSearch.jsx`, `ImageExtractor.jsx` |
| API integration | **Three** live external API integrations: (1) Colormind AI palette generator via `fetchAIPalette`, with a dev-proxy → local proxy → direct-call fallback chain; (2) The Color API for real-world color naming (`fetchColorInfo`); (3) The Color API's scheme endpoint for live-generated palettes on the Explore page (`fetchColorScheme`, `fetchPalettes`). All three gracefully fall back to local data if the network call fails. | `src/utils/api.js`, `src/utils/fetchPalettes.js`, `server/proxy.js` |
| Dashboard / Admin panel UI | `Dashboard.jsx` — stat cards (total palettes, total colors, this-week count), full CRUD on saved palettes (rename, delete, clear all), and per-palette export tools. | `src/components/Dashboard.jsx` |
| Responsive design | Mobile-first CSS with breakpoints at 1024px, 900px, 850px, and 480px; flexible grids for palette cards, dashboard stats, and the color-search result card. | `src/App.css` |
| Search / filter functionality | Two distinct search experiences: (1) `SearchBar` filters saved/explored palettes by style name or hex code; (2) `ColorSearch` is a universal live lookup — paste **any** hex code that exists and it fetches that color's real name/RGB/HSL from a live API, whether or not it's part of any stored palette. | `src/components/SearchBar.jsx`, `src/components/ColorSearch.jsx`, `Explore.jsx`, `Dashboard.jsx` |
| Proper component structure | Clear separation: `components/` (presentational + feature components), `context/` (global state), `hooks/` (reusable stateful logic), `utils/` (pure functions: color math, API calls, export helpers), `api/` (bundled fallback data). Components are composed and reused (`ColorSwatch`, `PaletteCard` reused across Explore/Dashboard). | `src/components/`, `src/context/`, `src/hooks/`, `src/utils/` |
| Client-side routing | Real URL-based navigation with React Router (`/`, `/dashboard`, `/studio`, `/explore`, `/pricing`), browser back/forward support, and a dedicated 404 page for unmatched routes. | `src/App.jsx`, `src/components/Navbar.jsx`, `src/components/NotFound.jsx` |
| State management (Context API) | `AppContext` centralizes theme, saved palettes, palette history, and the shared color/name modals, exposed via a `useApp()` hook — avoids threading a dozen props through every page. | `src/context/AppContext.jsx` |
| Error handling | A top-level `ErrorBoundary` class component catches render-time errors app-wide and shows a recovery screen instead of a blank crash. | `src/components/ErrorBoundary.jsx` |
| Form validation | The contact form validates required fields and email format client-side before "submitting". | `src/components/Contact.jsx` |

## Extra features added beyond the brief

- **Command palette (⌘K / Ctrl+K)** — a keyboard-driven quick-actions launcher for navigation, generating palettes, toggling theme, and jumping to any saved palette by name.
- **Gradient Maker** — a full tool for building multi-stop linear/radial gradients with a live preview and one-click CSS copy.
- **Drag-to-reorder palette colors** — native HTML5 drag-and-drop to reorder swatches in a generated palette.
- **Dashboard analytics** — a live color-distribution chart (by hue category) computed from all saved palettes.
- **Bulk actions** — multi-select saved palettes for one-click bulk delete or bulk JSON export.
- **Sortable dashboard** — sort saved palettes by newest, oldest, name, or color count.
- **Image color extraction** — drag-and-drop or upload any photo; a canvas-based colour-quantization algorithm pulls out its dominant colors into a saveable palette, no external API required.
- **Color blindness simulator** — every color's detail modal previews it under protanopia, deuteranopia, tritanopia, and achromatopsia using standard simulation matrices.
- **Shareable palette links** — copy a URL with the palette encoded in the query string; opening that link elsewhere loads the palette straight into the Studio.
- **WCAG accessibility contrast checker** — every color's detail modal shows its contrast ratio against black and white with AA/AAA/Fail badges, computed with the standard WCAG relative-luminance formula.
- **Palette export** — copy any saved palette as CSS custom properties, or download it as JSON or a rendered PNG swatch strip (canvas-based).
- **Resilience by design** — every live API call has a local fallback, so the app keeps working (with slightly less "live" data) even with no internet connection.

## Testing

39 unit tests (Vitest) covering color math, contrast/WCAG calculations, hex validation, color-blindness simulation, share-link encode/decode, and all API integrations (success, failure, and malformed-response cases).

```bash
npm test
```

## Running the project

```bash
npm install
npm run dev            # http://localhost:5173
npm run start-proxy    # optional, in a second terminal — avoids Colormind CORS issues
npm run build           # production build
```
