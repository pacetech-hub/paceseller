# Pace Seller

React + Vite app built with [Mantine UI](https://mantine.dev) 7.

Design source: https://www.figma.com/design/77ZGd4r6Utjar8JhtnccZG/Execute-Action

## Running the code

Run `bun install` to install the dependencies.

Run `bun run dev` to start the development server.

Run `bun run build` to create a production build.

## Product docs

- Radar and shopping-journey spec: `src/imports/pasted_text/radar-spec.md`
- Retail Performance Platform proposal and how it maps to this app: `docs/retail-performance-platform/README.md`

## Design tokens

Visual values (colors, type, spacing, radius, shadows, focus ring) come from the Figma export in
`design-tokens/design-tokens.tokens.json`. After updating that file, run `bun run tokens` to regenerate:

- `src/mantine/tokens.ts`: used by the Mantine theme (`src/mantine/theme.ts`)
- `src/styles/tokens.css`: the same scales as CSS variables (`--ps-color-brand-500`, `--ps-spacing-xl`, `--ps-shadow-sm`…) for CSS modules

The brand color is the token **zinc** family (`BRAND_FAMILY` in `scripts/build-tokens.mjs`); it replaces the export's blue `brand` family.
