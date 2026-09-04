# Gradient Stack

Gradient Stack is a visual playground for creating, saving, and sharing animated gradient backgrounds. It powers the gallery and editor experience you see at https://gradient.magill.dev, where every gradient animation is stored locally, rendered live, and built on a set of reusable UI components.

## Key Concepts

- **Project Gallery** – Displays saved animations and curated templates with live thumbnails generated from gradient layers. Users can search, delete, and open projects, or branch from a template.
- **Editor Canvas** – Offers a layer-based timeline and preview that compiles gradient layers into CSS, including keyframes-driven motion, radial gradients, and color stops that blend and animate.
- **Storage Layer** – Persists gradient projects to browser storage with utilities in `lib/project-storage.ts`, letting you iterate without losing state between sessions.
- **Utility Library** – `lib/gradient-compiler.ts` converts gradient layer definitions into CSS, while helper hooks/components keep inputs, sliders, and previews consistent across the experience.

## Getting Started

```bash
pnpm install
pnpm dev
```

The editor lives under `app/editor/[id]/page.tsx`, while `app/page.tsx` renders the gallery.

### Local Flow

1. Open the gallery (`/`) to view saved projects and templates.
2. Create a new stack to launch the editor canvas with a blank gradient.
3. Work with custom sliders, keyframes, and exports—changes are saved automatically (debounced) and reflected in the gallery.
4. Templates live in `lib/templates.ts` and provide quick visual starting points, including `template-random`, which produces a fresh gradient every time it's opened. Opening any template forks it into a new saved project first, so edits never touch the original preset.

## Development Notes

- `components/project-gallery.tsx` handles the gallery layout, project filtering, and the `ProjectCard` wrapper that renders thumbnails and delete controls.
- `lib/gradient-compiler.ts` is responsible for generating `background`/`background-position` shorthand and `@keyframes` CSS from structured gradient/layer data.
- `hooks/use-project-editor.ts` owns all editor state (loading, autosave, layer and keyframe CRUD); `app/editor/[id]/page.tsx` is layout only.
- To avoid hydration issues, client-only randomness is managed with hooks inside `ProjectCard`, while deterministic templates use precompiled CSS strings.
- UI primitives live inside `components/ui/`, encompassing buttons, dialogs, forms, and cards styled with Tailwind.
- See `docs/ARCHITECTURE.md` for the full file layout, data flow, and design-token reference.

## Testing & Preview

The project currently relies on manual testing inside the Next.js dev server. Run `pnpm dev` and visit `http://localhost:3000` to interact with the gallery and editor. Pay attention to browser console warnings for hydration errors—these are addressed in the gallery component.

## Deployment

The public preview is available at https://gradient.magill.dev. Deployment configuration lives outside this repository (Vercel project settings).

## Directory Highlights

- `components/` – Composable UI for the gallery, editor controls, and modal dialogs.
- `lib/` – Gradient compilation, project persistence, template presets, and shared utility functions.
- `hooks/` – Editor state orchestration and animation playback/interpolation.
- `app/` – Next.js routing structure with `layout.tsx`, the gallery homepage, and editor detail routes.

## Contributing

- Keep UI logic in `components/` and delegate stateful behavior to hooks or `lib` utilities.
- When adding gradients, update `lib/gradient-types.ts` and ensure the compiler can derive CSS for new layer types.
- Document complex layout decisions inside the `docs/` folder, which covers architecture, slider behavior, and animation state.

## Useful Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Starts Next.js in dev mode with Fast Refresh. |
| `pnpm build` | Type-checks and builds for production. |
| `pnpm start` | Serves a production build. |
| `pnpm test` | Not implemented; use manual testing and UI exploration. |

Feel free to reach out via the repository issues if you want to brainstorm new gradient effects or improve animation exports.
