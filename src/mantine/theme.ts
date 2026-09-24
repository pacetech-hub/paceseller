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

const RADIUS = "0.5rem";

// Controles grandes também no desktop: campos e botões com 42px de altura e fonte de 16px.
const CONTROL_SIZE = "md";

const inputDefaults = {
  // Sem asterisco vermelho: campos opcionais são indicados por "(opcional)" no rótulo.
  withAsterisk: false,
  radius: "md",
  variant: "default",
  size: CONTROL_SIZE,
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
  // Um único arredondamento (8px) para botões, campos, cartões e modais: valores parecidos
  // mas diferentes (6/8/12/16px) quebram o "caminho previsível" do olhar.
  defaultRadius: "md",
  radius: {
    xs: RADIUS,
    sm: RADIUS,
    md: RADIUS,
    lg: RADIUS,
    xl: RADIUS,
  },
  // Base de 16px e poucos tamanhos: 14 (apoio/metadados), 16 (texto, campos e ações),
  // 20 (títulos de seção) e 28 (título de página / números de destaque).
  // xs é igual a sm para que nenhum texto interno do Mantine fique abaixo de 14px.
  fontSizes: {
    xs: "0.875rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.25rem",
    xl: "1.75rem",
  },
  headings: {
    fontFamily: "Roboto, system-ui, sans-serif",
    fontWeight: "700",
    sizes: {
      h1: { fontSize: "1.75rem", lineHeight: "1.3" },
      h2: { fontSize: "1.25rem", lineHeight: "1.35" },
      h3: { fontSize: "1.25rem", lineHeight: "1.35" },
      h4: { fontSize: "1rem", lineHeight: "1.5" },
      h5: { fontSize: "1rem", lineHeight: "1.5" },
      h6: { fontSize: "1rem", lineHeight: "1.5" },
    },
  },
  components: {
    Button: {
      defaultProps: { size: CONTROL_SIZE },
      styles: { label: { fontWeight: SEMIBOLD } },
    },
    // Botões só com ícone: mesma altura dos campos (42px) e cantos iguais aos demais botões.
    ActionIcon: { defaultProps: { size: "input-md", radius: "md" } },
    CloseButton: { defaultProps: { size: "xl", radius: "md" } },
    SegmentedControl: { defaultProps: { size: CONTROL_SIZE, radius: "md" }, styles: { label: { fontWeight: SEMIBOLD } } },
    Chip: { defaultProps: { size: CONTROL_SIZE, radius: "md" } },
    Checkbox: { defaultProps: { size: CONTROL_SIZE, radius: "sm" } },
    Radio: { defaultProps: { size: CONTROL_SIZE } },
    Switch: { defaultProps: { size: CONTROL_SIZE } },
    Pagination: { defaultProps: { size: CONTROL_SIZE, radius: "md" } },
    // Etiquetas de status: texto de 14px, sem caixa alta, mesmo arredondamento dos botões.
    Badge: { defaultProps: { size: "lg", radius: "md", tt: "none" } },
    InputWrapper: { defaultProps: { withAsterisk: false }, styles: inputStyles },
    Input: { defaultProps: { radius: "md", variant: "default", size: CONTROL_SIZE } },
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
    Stepper: { styles: { stepLabel: { fontWeight: SEMIBOLD } } },
    Menu: { styles: { label: { fontWeight: SEMIBOLD } } },
    Combobox: { styles: { groupLabel: { fontWeight: SEMIBOLD } } },
    Notification: { styles: { title: { fontWeight: SEMIBOLD } } },
    Timeline: { styles: { itemTitle: { fontWeight: SEMIBOLD } } },
    Tabs: { styles: { tab: { fontWeight: SEMIBOLD } } },
  },
});
