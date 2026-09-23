# Pace Seller

React + Vite app (`npm run dev`, `npm run build`). Pages live in `src/app/components/`; `src/app/App.tsx` switches screens by role (`admin` = Indústria, `rep` = Representante, `lojista`).

## UI: Mantine only

The project uses **Mantine UI (v7) as the only UI and styling system**. Tailwind, shadcn/Radix and MUI are being removed and must not be used in new or changed code.

- **Components:** `@mantine/core`, `@mantine/dates`, `@mantine/notifications`, `@mantine/charts`, `@mantine/form`, `@mantine/hooks`. Icons: `@phosphor-icons/react`.
- **Theme = source of truth:** `src/mantine/theme.ts` defines colors, fonts, radius, spacing and component defaults. Change a value there, never in a page.
- **Colors:** only from the theme: color props (`color="neutral"`, `c="dimmed"`, `bg="gray.0"`), `var(--mantine-*)` CSS variables, or `useMantineTheme()` + `alpha()`. No hex/rgb/oklch values in components. For status use the semantic theme colors `success`, `warning`, `danger`; for chart series use `theme.other.chartColors`.
- **Typography:** `Title`/`Text` with theme sizes (`size="xs" | "sm" | "md" | ...`), not raw `rem`/`px` font sizes.
- **Layout and spacing:** Mantine layout components (`Stack`, `Group`, `Flex`, `Grid`, `SimpleGrid`, `Container`, `Box`, `AppShell`) and style props (`p`, `m`, `gap`, `w`, `maw`, `display`, ...).
- **Custom styles:** the component's `styles`/`classNames` API or a CSS Module (`*.module.css`) using `var(--mantine-*)` variables.
- **Breakpoints:** Mantine defaults: xs 36em (576px), sm 48em (768px), md 62em (992px), lg 75em (1200px), xl 88em (1408px). Use responsive props (`{ base: 1, md: 3 }`), `visibleFrom`/`hiddenFrom`, and `useMediaQuery` with `theme.breakpoints`. Never hard-code pixel breakpoints.
- **Feedback:** notifications via `notify.success/error/info` from `src/mantine/notify.ts` (wraps `@mantine/notifications`), dialogs via `Modal` (defaults set in the theme), charts via `@mantine/charts`.
- **Do not use:** `className` with Tailwind utilities, `src/styles/*.css` variables (`--primary`, `--muted-foreground`, ...), shadcn components, `sonner`, `recharts` directly, `@radix-ui/*`, `clsx`/`tailwind-merge`/`cva`.

## Migration status

shadcn/Radix and MUI are fully removed. Pages not yet migrated still contain Tailwind classes; Tailwind stays installed only until the migration ends. Plan: (0) cleanup, done → (1) Mantine foundation, done → (2..N) migrate one page per step, including the pages not linked from any screen yet (`SelloutDashboard`, `LojistaHistoryDashboard`, `RuptureAlerts`) → (last) remove Tailwind (`src/styles/tailwind.css`, `theme.css`, `default_shadcn_theme.css`, the Tailwind packages and Vite plugin).
