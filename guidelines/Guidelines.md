# Design system: Mantine theme is the source of truth

* `src/mantine/theme.ts` is the single source of truth for colors. Change a color there, never in a component.
* Build UI with Mantine components (`@mantine/core`, `@mantine/dates`, `@mantine/notifications`, `@mantine/charts`, `@mantine/form`, `@mantine/hooks`).
* In components, take colors only from the theme:
  * color props: `color="neutral"`, `c="dimmed"`, `bg="gray.0"`, `variant="light"`
  * Mantine CSS variables: `var(--mantine-color-body)`, `var(--mantine-color-text)`, `var(--mantine-color-dimmed)`, `var(--mantine-color-default-border)`, `var(--mantine-primary-color-filled)`, `var(--mantine-color-blue-6)`
  * `useMantineTheme()` with `alpha()` / `theme.colors.*` when a computed value is needed (gradients, transparency)
* Do not use Tailwind color classes (`bg-*`, `text-*`, `border-*`, `from-*`, `ring-*` with a color), the CSS variables in `src/styles/theme.css` (`--primary`, `--muted-foreground`, `--surface`, `--border`, ...), or hard-coded hex/rgb/oklch values in components.
* Tailwind is still fine for layout (flex, grid, spacing, sizing, responsive visibility).
* Icons come from `@phosphor-icons/react`.
* Breakpoints are Mantine's defaults: xs 36em (576px), sm 48em (768px), md 62em (992px), lg 75em (1200px), xl 88em (1408px). Tailwind's `xs:`/`sm:`/`md:`/`lg:`/`xl:` are set to the same values in `src/styles/tailwind.css` (there is no `2xl:`), so they match Mantine's `visibleFrom`/`hiddenFrom` and responsive props. In JS, read `theme.breakpoints` with `useMediaQuery` from `@mantine/hooks`; never hard-code pixel breakpoints.

<!--

System Guidelines

Use this file to provide the AI with rules and guidelines you want it to follow.
This template outlines a few examples of things you can add. You can add your own sections and format it to suit your needs

TIP: More context isn't always better. It can confuse the LLM. Try and add the most important rules you need

# General guidelines

Any general rules you want the AI to follow.
For example:

* Only use absolute positioning when necessary. Opt for responsive and well structured layouts that use flexbox and grid by default
* Refactor code as you go to keep code clean
* Keep file sizes small and put helper functions and components in their own files.

--------------

# Design system guidelines
Rules for how the AI should make generations look like your company's design system

Additionally, if you select a design system to use in the prompt box, you can reference
your design system's components, tokens, variables and components.
For example:

* Use a base font-size of 14px
* Date formats should always be in the format “Jun 10”
* The bottom toolbar should only ever have a maximum of 4 items
* Never use the floating action button with the bottom toolbar
* Chips should always come in sets of 3 or more
* Don't use a dropdown if there are 2 or fewer options

You can also create sub sections and add more specific details
For example:


## Button
The Button component is a fundamental interactive element in our design system, designed to trigger actions or navigate
users through the application. It provides visual feedback and clear affordances to enhance user experience.

### Usage
Buttons should be used for important actions that users need to take, such as form submissions, confirming choices,
or initiating processes. They communicate interactivity and should have clear, action-oriented labels.

### Variants
* Primary Button
  * Purpose : Used for the main action in a section or page
  * Visual Style : Bold, filled with the primary brand color
  * Usage : One primary button per section to guide users toward the most important action
* Secondary Button
  * Purpose : Used for alternative or supporting actions
  * Visual Style : Outlined with the primary color, transparent background
  * Usage : Can appear alongside a primary button for less important actions
* Tertiary Button
  * Purpose : Used for the least important actions
  * Visual Style : Text-only with no border, using primary color
  * Usage : For actions that should be available but not emphasized
-->
