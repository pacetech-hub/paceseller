import { createTheme, type MantineColorsTuple } from "@mantine/core";
import { tokens } from "./tokens";

// Todos os valores visuais vêm dos design tokens (design-tokens/design-tokens.tokens.json),
// convertidos por scripts/build-tokens.mjs em ./tokens.ts. Rode `bun run tokens` ao atualizar o JSON.

// O Mantine usa 10 tons por cor; os tokens têm 11 (50–950). Usamos 50–900 → índices 0–9,
// então o índice 5 do Mantine = tom 500 do token, 6 = 600 e assim por diante.
type Palette = keyof typeof tokens.palettes;
const tuple = (name: Palette): MantineColorsTuple => {
  const p = tokens.palettes[name];
  return [p["50"], p["100"], p["200"], p["300"], p["400"], p["500"], p["600"], p["700"], p["800"], p["900"]];
};
const px = (n: number) => `${n / 16}rem`;

// Paleta do app (evita cores que brigam entre si):
// - brand: ações, navegação, seleção e anel de foco — família zinc dos tokens
//   (definida em scripts/build-tokens.mjs, BRAND_FAMILY); o tom 900 (#18181b) é o "preto" das ações;
// - blue: somente links;
// - teal: sucesso / disponível; yellow: atenção / baixo estoque; red: erro / esgotado / excluir.
// Cores de produto (swatches de cor do calçado) são dados, não parte da paleta de interface.
// Todas as famílias dos tokens ficam registradas; as que têm o mesmo nome de uma cor do
// Mantine (gray, red, blue, teal…) substituem a padrão. "grape" do Mantine vira o "purple" dos tokens.
const colors = Object.fromEntries(
  (Object.keys(tokens.palettes) as Palette[]).map((name) => [name, tuple(name)]),
) as Record<Palette, MantineColorsTuple>;

const FONT_FAMILY = `${tokens.fontFamily.body}, system-ui, sans-serif`;
const FONT_FAMILY_DISPLAY = `${tokens.fontFamily.display}, system-ui, sans-serif`;
const fs = tokens.fontSize;
const lh = tokens.lineHeight;

// Tipografia: apenas três pesos — regular (400), semibold (600) e bold (700).
// O Mantine usa 500 em alguns rótulos internos; aqui eles passam para semibold.
const SEMIBOLD = 600;

// Campos de formulário: retângulo com borda visível e o rótulo próximo do próprio campo
// (o espaço entre campos vem do Stack do formulário, sempre maior que este).
// Peso óptico em três níveis: o dado digitado é o mais forte (16px, cor do texto),
// depois o rótulo (14px semibold, cinza escuro) e por último o placeholder (cinza claro).
const inputStyles = {
  label: { fontWeight: SEMIBOLD, marginBottom: 6, fontSize: "var(--mantine-font-size-sm)", color: "var(--mantine-color-gray-8)" },
  // Explicação do campo logo ABAIXO dele (ordem: rótulo, campo, explicação, erro).
  description: { marginTop: 6, fontSize: "var(--mantine-font-size-sm)" },
  error: { marginTop: 6 },
};

// Raio único do app = radius-md dos tokens (8px).
const RADIUS = px(tokens.radius.md);

// Controles grandes também no desktop: campos e botões com 42px de altura e fonte de 16px.
const CONTROL_SIZE = "md";

const inputDefaults = {
  // Sem asterisco vermelho: campos opcionais são indicados por "(opcional)" no rótulo.
  withAsterisk: false,
  radius: "md",
  variant: "default",
  size: CONTROL_SIZE,
  inputWrapperOrder: ["label", "input", "description", "error"],
} as const;

export const mantineTheme = createTheme({
  primaryColor: "brand",
  primaryShade: 9,
  colors: { ...colors, grape: colors.purple },
  white: tokens.base.white,
  black: tokens.base.black,
  fontFamily: FONT_FAMILY,
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
  // (A escala completa dos tokens — 2, 4, 6, 8, 10, 12, 16, 20, 24px — está em --ps-radius-*.)
  defaultRadius: "md",
  // Espaçamento em degraus bem distintos: gaps maiores separam grupos grandes (seções),
  // menores separam itens dentro de um grupo. Cada degrau é um token de espaçamento:
  // xs 8 (spacing-md) · sm 12 (spacing-lg) · md 16 (spacing-xl) · lg 24 (spacing-3xl) · xl 32 (spacing-4xl).
  // A escala completa (2 a 160px) está em --ps-spacing-*.
  spacing: {
    xs: px(tokens.spacing.md),
    sm: px(tokens.spacing.lg),
    md: px(tokens.spacing.xl),
    lg: px(tokens.spacing["3xl"]),
    xl: px(tokens.spacing["4xl"]),
  },
  radius: {
    xs: RADIUS,
    sm: RADIUS,
    md: RADIUS,
    lg: RADIUS,
    xl: RADIUS,
  },
  // Base de 16px e poucos tamanhos, todos da escala dos tokens: 14 (text-sm, apoio/metadados),
  // 16 (text-md, texto, campos e ações), 20 (text-xl, títulos de seção) e
  // 30 (display-sm, título de página / números de destaque).
  // xs é igual a sm para que nenhum texto interno do Mantine fique abaixo de 14px.
  fontSizes: {
    xs: px(fs["text-sm"]),
    sm: px(fs["text-sm"]),
    md: px(fs["text-md"]),
    lg: px(fs["text-xl"]),
    xl: px(fs["display-sm"]),
  },
  // Entrelinhas dos tokens, como proporção do tamanho (20/14, 24/16, 30/20, 38/30).
  lineHeights: {
    xs: String(lh["text-sm"] / fs["text-sm"]),
    sm: String(lh["text-sm"] / fs["text-sm"]),
    md: String(lh["text-md"] / fs["text-md"]),
    lg: String(lh["text-xl"] / fs["text-xl"]),
    xl: String(lh["display-sm"] / fs["display-sm"]),
  },
  shadows: {
    xs: tokens.shadows.xs,
    sm: tokens.shadows.sm,
    md: tokens.shadows.md,
    lg: tokens.shadows.lg,
    xl: tokens.shadows.xl,
  },
  headings: {
    fontFamily: FONT_FAMILY_DISPLAY,
    fontWeight: "700",
    sizes: {
      h1: { fontSize: px(fs["display-sm"]), lineHeight: String(lh["display-sm"] / fs["display-sm"]) },
      h2: { fontSize: px(fs["text-xl"]), lineHeight: String(lh["text-xl"] / fs["text-xl"]) },
      h3: { fontSize: px(fs["text-xl"]), lineHeight: String(lh["text-xl"] / fs["text-xl"]) },
      h4: { fontSize: px(fs["text-md"]), lineHeight: String(lh["text-md"] / fs["text-md"]) },
      h5: { fontSize: px(fs["text-md"]), lineHeight: String(lh["text-md"] / fs["text-md"]) },
      h6: { fontSize: px(fs["text-md"]), lineHeight: String(lh["text-md"] / fs["text-md"]) },
    },
  },
  components: {
    // Links sempre reconhecíveis: azul e sublinhados (nunca parecem texto comum).
    // A marca é cinza (zinc), então o link usa o blue dos tokens para não parecer texto comum.
    Anchor: { defaultProps: { underline: "always", c: "blue.7" } },
    Button: {
      defaultProps: { size: CONTROL_SIZE },
      styles: { label: { fontWeight: SEMIBOLD } },
    },
    // Botões só com ícone: mesma altura dos campos (42px) e cantos iguais aos demais botões.
    ActionIcon: { defaultProps: { size: "input-md", radius: "md" } },
    CloseButton: { defaultProps: { size: "xl", radius: "md" } },
    SegmentedControl: { defaultProps: { size: CONTROL_SIZE, radius: "md" }, styles: { label: { fontWeight: SEMIBOLD } } },
    Chip: { defaultProps: { size: CONTROL_SIZE, radius: "md" } },
    // Checkbox é sempre uma CAIXA: cantos de 4px (bem menores que o raio geral de 8px),
    // para não parecer um radio redondo.
    Checkbox: { defaultProps: { size: CONTROL_SIZE, radius: 4 } },
    CheckboxIndicator: { defaultProps: { radius: 4 } },
    Radio: { defaultProps: { size: CONTROL_SIZE } },
    Switch: { defaultProps: { size: CONTROL_SIZE } },
    Pagination: { defaultProps: { size: CONTROL_SIZE, radius: "md" } },
    // Etiquetas de status: texto de 14px, sem caixa alta, mesmo arredondamento dos botões.
    Badge: { defaultProps: { size: "lg", radius: "md", tt: "none" } },
    InputWrapper: {
      defaultProps: { withAsterisk: false, inputWrapperOrder: ["label", "input", "description", "error"] },
      styles: inputStyles,
    },
    // Tooltips legíveis: texto de 16px, bastante respiro, várias linhas com largura máxima.
    Tooltip: {
      defaultProps: { multiline: true, withArrow: true, arrowSize: 8, openDelay: 150, events: { hover: true, focus: true, touch: true } },
      styles: { tooltip: { fontSize: "var(--mantine-font-size-md)", lineHeight: 1.5, padding: "10px 14px", maxWidth: 320 } },
    },
    Input: { defaultProps: { radius: "md", variant: "default", size: CONTROL_SIZE } },
    TextInput: { defaultProps: inputDefaults, styles: inputStyles },
    // Sempre com o botão de mostrar/ocultar a senha, com nome acessível.
    PasswordInput: {
      defaultProps: { ...inputDefaults, visibilityToggleButtonProps: { "aria-label": "Mostrar ou ocultar senha" } },
      styles: inputStyles,
    },
    NumberInput: { defaultProps: inputDefaults, styles: inputStyles },
    Textarea: { defaultProps: inputDefaults, styles: inputStyles },
    // Listas longas: caixa de filtro no topo (digite para encontrar). Listas de até 5 opções
    // não usam Select (viram SegmentedControl/Radio), então todo Select é pesquisável.
    Select: {
      defaultProps: { ...inputDefaults, searchable: true, nothingFoundMessage: "Nenhuma opção encontrada — confira a grafia" },
      styles: inputStyles,
    },
    MultiSelect: {
      defaultProps: { ...inputDefaults, searchable: true, nothingFoundMessage: "Nenhuma opção encontrada — confira a grafia" },
      styles: inputStyles,
    },
    Autocomplete: { defaultProps: inputDefaults, styles: inputStyles },
    FileInput: { defaultProps: inputDefaults, styles: inputStyles },
    DateInput: { defaultProps: inputDefaults, styles: inputStyles },
    DatePickerInput: { defaultProps: inputDefaults, styles: inputStyles },
    ColorInput: { defaultProps: inputDefaults, styles: inputStyles },
    // Pop-ups: X grande (44px) com bastante área clicável; fecham também com clique fora e Esc.
    Modal: {
      defaultProps: {
        closeOnClickOutside: true,
        closeOnEscape: true,
        closeButtonProps: { size: "xl", iconSize: 24, "aria-label": "Fechar" },
      },
    },
    Drawer: {
      defaultProps: {
        closeOnClickOutside: true,
        closeOnEscape: true,
        closeButtonProps: { size: "xl", iconSize: 24, "aria-label": "Fechar" },
      },
    },
    // Gráficos: o dado é o mais importante — linhas mais grossas (3px).
    LineChart: { defaultProps: { strokeWidth: 3 } },
    AreaChart: { defaultProps: { strokeWidth: 3 } },
    CompositeChart: { defaultProps: { strokeWidth: 3 } },
    // Rótulos internos do Mantine que usariam peso 500
    Stepper: { styles: { stepLabel: { fontWeight: SEMIBOLD } } },
    Menu: { styles: { label: { fontWeight: SEMIBOLD } } },
    Combobox: { styles: { groupLabel: { fontWeight: SEMIBOLD } } },
    Notification: { styles: { title: { fontWeight: SEMIBOLD } } },
    Timeline: { styles: { itemTitle: { fontWeight: SEMIBOLD } } },
    Tabs: { styles: { tab: { fontWeight: SEMIBOLD } } },
  },
});
