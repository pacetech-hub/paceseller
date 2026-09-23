import {
  createTheme,
  DEFAULT_THEME,
  Modal,
  Notification,
  type MantineColorsTuple,
} from "@mantine/core";

// Escala neutra (preto/cinza): o app usa preto como cor de ação principal
// em vez de uma cor de marca saturada.
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

// Cores semânticas: use estes nomes nas páginas (color="success", c="danger.6", ...)
// em vez de escolher verde/amarelo/vermelho diretamente.
const { teal, yellow, red } = DEFAULT_THEME.colors;

export const mantineTheme = createTheme({
  primaryColor: "neutral",
  primaryShade: 9,
  colors: {
    neutral,
    success: teal,
    warning: yellow,
    danger: red,
  },
  fontFamily: "Roboto, system-ui, sans-serif",
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
  // Breakpoints: defaults do Mantine (xs 36em, sm 48em, md 62em, lg 75em, xl 88em).
  other: {
    // Ordem das séries nos gráficos (@mantine/charts): series[i].color = chartColors[i]
    chartColors: ["blue.6", "orange.6", "teal.6", "violet.6", "red.6"],
  },
  components: {
    Modal: Modal.extend({
      defaultProps: { centered: true, radius: "lg" },
      styles: { title: { fontWeight: 600 } },
    }),
    Notification: Notification.extend({
      defaultProps: { radius: "md", withBorder: true },
    }),
  },
});
