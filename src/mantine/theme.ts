import { createTheme, Text } from "@mantine/core";

// Cores: paleta padrão do Mantine, que é o Open Color (https://yeun.github.io/open-color/).
// Não sobrescrevemos `colors` — gray, red, yellow, green, blue etc. vêm direto do Open Color.
// A cor de ação principal do app é quase-preta, então usamos gray.9 (#212529) como primária.
export const mantineTheme = createTheme({
  primaryColor: "gray",
  primaryShade: 9,
  fontFamily: "Roboto, system-ui, sans-serif",
  fontFamilyMonospace: "ui-monospace, SFMono-Regular, Menlo, monospace",
  components: {
    // Com `size` fora da escala do tema (ex.: size="0.8rem") o Mantine usa o próprio valor como
    // line-height (1.0). Mantemos o line-height padrão do app (1.55) nesses casos.
    Text: Text.extend({
      vars: (theme, props) =>
        props.size !== undefined && !(String(props.size) in theme.fontSizes)
          ? { root: { "--text-lh": "var(--mantine-line-height)" } }
          : { root: {} },
    }),
  },
  headings: {
    fontFamily: "Roboto, system-ui, sans-serif",
  },
  // Mesmos pontos de quebra do Tailwind (sm 640, md 768, lg 1024, xl 1280) para manter os layouts responsivos.
  breakpoints: {
    xs: "30em",
    sm: "40em",
    md: "48em",
    lg: "64em",
    xl: "80em",
  },
  defaultRadius: "md",
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
  },
});
