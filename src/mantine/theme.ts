import { createTheme, type MantineColorsTuple } from "@mantine/core";

// Escala neutra (preto/cinza) equivalente ao --primary do design atual (oklch(0 0 0)),
// já que o app usa preto como cor de ação principal em vez de uma cor de marca saturada.
const neutral: MantineColorsTuple = [
  "#f5f5f5",
  "#e7e7e7",
  "#d1d1d1",
  "#b0b0b0",
  "#888888",
  "#6e6e6e",
  "#4a4a4a",
  "#2e2e2e",
  "#1a1a1a",
  "#000000",
];

export const mantineTheme = createTheme({
  primaryColor: "neutral",
  primaryShade: 9,
  colors: { neutral },
  fontFamily: "Roboto, system-ui, sans-serif",
  // Breakpoints padrão do Mantine, declarados explicitamente.
  breakpoints: {
    xs: "36em",
    sm: "48em",
    md: "62em",
    lg: "75em",
    xl: "88em",
  },
  defaultRadius: "md",
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
  },
  headings: {
    fontFamily: "Roboto, system-ui, sans-serif",
  },
});
