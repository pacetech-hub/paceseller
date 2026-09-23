import { createTheme } from "@mantine/core";

// Cores: paleta padrão do Mantine, que é o Open Color (https://yeun.github.io/open-color/).
// Não sobrescrevemos `colors` — gray, red, yellow, green, blue etc. vêm direto do Open Color.
// A cor de ação principal do app é quase-preta, então usamos gray.9 (#212529) como primária.
export const mantineTheme = createTheme({
  primaryColor: "gray",
  primaryShade: 9,
  fontFamily: "Roboto, system-ui, sans-serif",
  fontFamilyMonospace: "ui-monospace, SFMono-Regular, Menlo, monospace",
  headings: {
    fontFamily: "Roboto, system-ui, sans-serif",
  },
  defaultRadius: "md",
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
  },
});
