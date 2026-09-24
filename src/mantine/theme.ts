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

// Tipografia: apenas três pesos — regular (400), semibold (600) e bold (700).
// O Mantine usa 500 em alguns rótulos internos; aqui eles passam para semibold.
const SEMIBOLD = 600;

// Campos de formulário: retângulo com borda visível e o rótulo próximo do próprio campo
// (o espaço entre campos vem do Stack do formulário, sempre maior que este).
const inputStyles = {
  label: { fontWeight: SEMIBOLD, marginBottom: 6 },
  description: { marginBottom: 6 },
  error: { marginTop: 6 },
};

const inputDefaults = {
  // Sem asterisco vermelho: campos opcionais são indicados por "(opcional)" no rótulo.
  withAsterisk: false,
  radius: "sm",
  variant: "default",
} as const;

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
    fontWeight: "700",
  },
  components: {
    Button: {
      styles: { label: { fontWeight: SEMIBOLD } },
    },
    InputWrapper: { defaultProps: { withAsterisk: false }, styles: inputStyles },
    Input: { defaultProps: { radius: "sm", variant: "default" } },
    TextInput: { defaultProps: inputDefaults, styles: inputStyles },
    PasswordInput: { defaultProps: inputDefaults, styles: inputStyles },
    NumberInput: { defaultProps: inputDefaults, styles: inputStyles },
    Textarea: { defaultProps: inputDefaults, styles: inputStyles },
    Select: { defaultProps: inputDefaults, styles: inputStyles },
    MultiSelect: { defaultProps: inputDefaults, styles: inputStyles },
    Autocomplete: { defaultProps: inputDefaults, styles: inputStyles },
    FileInput: { defaultProps: inputDefaults, styles: inputStyles },
    DateInput: { defaultProps: inputDefaults, styles: inputStyles },
    DatePickerInput: { defaultProps: inputDefaults, styles: inputStyles },
    ColorInput: { defaultProps: inputDefaults, styles: inputStyles },
    // Rótulos internos do Mantine que usariam peso 500
    SegmentedControl: { styles: { label: { fontWeight: SEMIBOLD } } },
    Stepper: { styles: { stepLabel: { fontWeight: SEMIBOLD } } },
    Menu: { styles: { label: { fontWeight: SEMIBOLD } } },
    Combobox: { styles: { groupLabel: { fontWeight: SEMIBOLD } } },
    Notification: { styles: { title: { fontWeight: SEMIBOLD } } },
    Timeline: { styles: { itemTitle: { fontWeight: SEMIBOLD } } },
    Tabs: { styles: { tab: { fontWeight: SEMIBOLD } } },
  },
});
