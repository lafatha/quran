# AGENTS.md

## Project Overview

Quran AI -- a mobile-first (390px max-width) Al-Quran daily reading tracker built with
Next.js 14 App Router, TypeScript (strict mode), React 18, Tailwind CSS 3, and Framer Motion.
UI language is Indonesian. All data is mock/static (no backend, no database, no API keys).

## Build / Lint / Test Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint (ESLint with next/core-web-vitals + next/typescript)
npm run lint
```

There is **no test framework** configured. No Jest, Vitest, or other test runner exists.
No `__tests__/` directory or `*.test.*`/`*.spec.*` files are present.

## Project Structure

```
app/                        # Next.js App Router pages (layout.tsx, page.tsx, globals.css)
  fonts/                    # Local Geist font files
  ai-chat/page.tsx          # AI chat interface
  progress/page.tsx         # Progress dashboard with Recharts
  quran/page.tsx            # Surah list browser
  quran/[surahId]/page.tsx  # Surah reader (Arabic + translation)
  settings/page.tsx         # Settings page
  surah/[id]/page.tsx       # Surah detail page
components/                 # Shared React components (PascalCase filenames)
lib/mock-data.ts            # All mock/seed data
public/quran_id.json        # Static Quran data (surah list with verses)
```

## Code Style Guidelines

### Formatting

- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Double quotes everywhere in TypeScript/TSX; single quotes only in CSS
- **Semicolons**: Always
- **Trailing commas**: Yes, on all multi-line constructs (objects, arrays, parameters, imports)
- **No Prettier config** -- follow the existing formatting conventions manually

### Imports

Order imports in a single contiguous block (no blank lines between groups):

1. `"use client"` directive on line 1 (if needed), followed by one blank line
2. Third-party libraries (react, framer-motion, lucide-react, next/\*, recharts)
3. Internal components via `@/components/...`
4. Internal data/utilities via `@/lib/...`

Use `import type` for type-only imports:
```ts
import type { Metadata } from "next";
```

Use the `@/` path alias (configured in tsconfig.json) for all internal imports.

### Components

- **Always use function declarations** with `export default`:
  ```ts
  export default function ComponentName({ prop }: ComponentNameProps) { ... }
  ```
- Never use arrow functions for component definitions
- Arrow functions are used only for inline callbacks and render helpers
- One component per file; filename matches component name in PascalCase

### TypeScript

- **Strict mode is enabled** -- do not use `any`
- Use `interface` (not `type`) for all object shapes and props definitions
- Name props interfaces as `[ComponentName]Props`:
  ```ts
  interface MacroCardProps {
    value: number;
    goal: number;
    label: string;
  }
  ```
- Use generics on hooks: `useState<Surah[]>([])`, `useState<number | null>(null)`
- Use `as const` for literal union values in data: `"completed" as const`
- Use `React.ReactNode` for children props
- Use `Readonly<>` wrapper for root layout children prop

### Naming Conventions

| Element               | Convention   | Example                        |
|-----------------------|-------------|--------------------------------|
| Component files       | PascalCase  | `BottomNav.tsx`                |
| Route directories     | kebab-case  | `ai-chat/`                     |
| Utility/data files    | kebab-case  | `mock-data.ts`                 |
| Dynamic route params  | camelCase   | `[surahId]`                    |
| Components            | PascalCase  | `CircularProgress`             |
| Page components       | PascalCase  | `QuranPage`, `SurahReaderPage` |
| Variables/functions   | camelCase   | `bookmarkedVerse`, `showToast` |
| Interfaces            | PascalCase  | `Surah`, `MacroCardProps`      |
| Custom Tailwind colors| kebab-case  | `flame-orange`, `done-green`   |
| CSS utility classes   | kebab-case  | `hide-scrollbar`, `arabic-text`|

### "use client" Directive

- Place on line 1 of any file using: React hooks, browser APIs, event handlers,
  Framer Motion, or Next.js client hooks (`usePathname`, `useRouter`, `useParams`)
- Omit from pure presentational components with no hooks or interactivity
- Always double-quoted: `"use client";`

### Styling with Tailwind

- Use Tailwind utility classes inline via `className` -- no CSS Modules or styled-components
- Custom theme colors are defined in `tailwind.config.ts` (e.g., `flame-orange`, `done-green`)
- Conditional classes use template literals with ternary expressions:
  ```tsx
  className={`px-3 py-1 rounded-full ${active ? "bg-black text-white" : "text-gray-500"}`}
  ```
- Use inline `style` prop only for truly dynamic values (computed sizes, percentages)
- Common patterns: `bg-white rounded-2xl shadow-sm p-4` for cards, `pb-24` for bottom nav clearance

### Data Fetching

- Static mock data is imported directly from `@/lib/mock-data`
- Client-side fetching uses native `fetch` in `useEffect` with `.then()` promise chains
- Quran data is fetched from `/quran_id.json` (static file in `public/`)
- No server-side data fetching (no server actions, no RSC async components)

### State Management

- Local `useState` only -- no global state management library
- Derived state is computed inline (not stored in separate state variables)
- Loading state: `useState(true)`, set to `false` after data arrives

### Error Handling

- Currently minimal: null checks with early returns, no try/catch, no `.catch()` on fetches
- When adding new code, prefer defensive null checks and user-friendly fallback UI
- Display error states in Indonesian to match the existing UI language

### Comments

- Use `{/* Section Label */}` comments in JSX as visual section separators
- No inline logic comments, no TODO comments, no JSDoc/TSDoc in the existing codebase
- Keep comments minimal and descriptive -- section labels only
