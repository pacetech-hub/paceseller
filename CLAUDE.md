# Pace Seller

React + Vite app (`npm run dev`, `npm run build`). Pages live in `src/app/components/`, screen switching in `src/app/App.tsx`.

## UI rules

Follow `guidelines/Guidelines.md`. In short: the Mantine theme in `src/mantine/theme.ts` is the source of truth for colors. Use Mantine components and theme colors (color props, `--mantine-*` variables, `useMantineTheme()`), not Tailwind color classes, `src/styles/theme.css` variables or hard-coded color values. Tailwind is for layout only. Icons come from `@phosphor-icons/react`. Breakpoints are Mantine's defaults (xs 576, sm 768, md 992, lg 1200, xl 1408 px); Tailwind's `sm:`/`md:`/`lg:`… use the same values (`src/styles/tailwind.css`), and JS reads `theme.breakpoints`.
