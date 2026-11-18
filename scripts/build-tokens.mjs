/**
 * Gera os tokens do app a partir do export do Figma (plugin "Design Tokens", Lukas Oppermann).
 *
 *   Fonte:  design-tokens/design-tokens.tokens.json
 *   Saídas: src/mantine/tokens.ts   → valores tipados, usados por src/mantine/theme.ts
 *           src/styles/tokens.css   → as mesmas escalas como variáveis CSS (--ps-*) para CSS modules
 *
 * Rode `bun run tokens` sempre que o JSON for atualizado. Não edite as saídas à mão.
 *
 * A cor de marca é a família BRAND_FAMILY (zinc), não a "brand" azul do export.
 *
 * Observação: os tokens semânticos de "1. color modes" apontam para uma coleção `_primitives`
 * que não vem no export (e só o modo escuro foi exportado), então eles não são gerados aqui.
 * Espaçamentos e larguras que referenciam `_primitives` são resolvidos pelo valor em px que
 * o próprio nome da referência traz, ex. "{_primitives.spacing.8 (32px)}" → 32.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const src = JSON.parse(readFileSync(resolve(root, 'design-tokens/design-tokens.tokens.json'), 'utf8'))

// Família de cor usada como marca deste projeto. A família "brand" do export (azul #0e69f2)
// é substituída por ela em todas as saídas, inclusive nos anéis de foco.
const BRAND_FAMILY = 'zinc'

const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

// "#0e69f2ff" → "#0e69f2"; mantém o alfa só quando não é opaco.
const hex = (v) => {
  const s = String(v).toLowerCase()
  return s.length === 9 && s.endsWith('ff') ? s.slice(0, 7) : s
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const px = (v) => {
  if (typeof v === 'number') return v
  const m = String(v).match(/\(([\d.,]+)px\)/)
  if (!m) throw new Error(`Valor sem px: ${v}`)
  return Number(m[1].replace(/,/g, ''))
}
const rem = (n) => `${+(n / 16).toFixed(4)}rem`

// ---------- Cores: todas as famílias com a escala completa 50–950 ----------
const palettes = {}
for (const [name, family] of Object.entries(src.color)) {
  if (!SHADES.every((s) => family[s]?.value)) continue
  palettes[slug(name)] = Object.fromEntries(SHADES.map((s) => [s, hex(family[s].value)]))
}
const exportedBrand = palettes.brand
palettes.brand = { ...palettes[BRAND_FAMILY] }
// hex do export → hex equivalente na família da marca (ex.: brand-500 → zinc-500)
const brandSwap = Object.fromEntries(SHADES.map((s) => [exportedBrand[s], palettes.brand[s]]))
const base = { white: hex(src.color.base.white.value), black: hex(src.color.base.black.value) }

// ---------- Espaçamento, raio, larguras, containers ----------
const spacing = Object.fromEntries(
  Object.entries(src['3. spacing']).map(([k, t]) => [k.replace(/^spacing-/, ''), px(t.value)]),
)
const radius = Object.fromEntries(
  Object.entries(src['2. radius']).map(([k, t]) => [k.replace(/^radius-/, ''), px(t.value)]),
)
const widths = Object.fromEntries(
  Object.entries(src['4. widths']).map(([k, t]) => [k.replace(/^width-/, ''), px(t.value)]),
)
const containers = Object.fromEntries(
  Object.entries(src['5. containers']).map(([k, t]) => [k.replace(/^container-/, ''), px(t.value)]),
)

// ---------- Tipografia ----------
const typo = src['6. typography']
const fontFamily = {
  display: typo['font family']['font-family-display'].value,
  body: typo['font family']['font-family-body'].value,
}
const fontSize = Object.fromEntries(Object.entries(typo['font size']).map(([k, t]) => [k, t.value]))
const lineHeight = Object.fromEntries(Object.entries(typo['line height']).map(([k, t]) => [k, t.value]))
// letter-spacing por tamanho (só os displays grandes têm valor diferente de 0)
const letterSpacing = {}
for (const [name, styles] of Object.entries(src.font)) {
  const v = styles.regular?.value
  if (v) letterSpacing[slug(name)] = v.letterSpacing
}

// ---------- Sombras e anel de foco ----------
const layer = (l) => {
  const inset = l.shadowType === 'innerShadow' ? 'inset ' : ''
  const color = brandSwap[hex(l.color)] ?? hex(l.color)
  return `${inset}${l.offsetX}px ${l.offsetY}px ${l.radius}px ${l.spread}px ${color}`
}
const effect = (node) =>
  node.value
    ? layer(node.value)
    : Object.keys(node)
        .filter((k) => /^\d+$/.test(k))
        // O Figma lista os efeitos de baixo para cima; no CSS a primeira sombra fica por cima.
        .sort((a, b) => b - a)
        .map((k) => layer(node[k].value))
        .join(', ')
const shadows = {}
for (const [k, node] of Object.entries(src.effect.shadows)) {
  if (k.startsWith('shadow-')) shadows[k.replace(/^shadow-/, '')] = effect(node)
}
const focusRings = {}
for (const [k, node] of Object.entries(src.effect['focus rings'])) focusRings[k] = effect(node)

const tokens = { base, palettes, spacing, radius, widths, containers, fontFamily, fontSize, lineHeight, letterSpacing, shadows, focusRings }

// ---------- src/mantine/tokens.ts ----------
const header = '// Gerado por scripts/build-tokens.mjs a partir de design-tokens/design-tokens.tokens.json.\n// Não edite à mão: rode `bun run tokens`.\n'
writeFileSync(resolve(root, 'src/mantine/tokens.ts'), `${header}\nexport const tokens = ${JSON.stringify(tokens, null, 2)} as const;\n`)

// ---------- src/styles/tokens.css ----------
const lines = []
const v = (name, value) => lines.push(`  --ps-${name}: ${value};`)
v('color-white', base.white)
v('color-black', base.black)
for (const [p, scale] of Object.entries(palettes)) for (const [s, c] of Object.entries(scale)) v(`color-${p}-${s}`, c)
lines.push('')
for (const [k, n] of Object.entries(spacing)) v(`spacing-${k}`, rem(n))
lines.push('')
for (const [k, n] of Object.entries(radius)) v(`radius-${k}`, n >= 9999 ? '9999px' : rem(n))
lines.push('')
v('font-family-display', `'${fontFamily.display}', system-ui, sans-serif`)
v('font-family-body', `'${fontFamily.body}', system-ui, sans-serif`)
for (const [k, n] of Object.entries(fontSize)) v(`font-size-${k}`, rem(n))
for (const [k, n] of Object.entries(lineHeight)) v(`line-height-${k}`, rem(n))
lines.push('')
for (const [k, s] of Object.entries(shadows)) v(`shadow-${k}`, s)
for (const [k, s] of Object.entries(focusRings)) v(k, s)
lines.push('')
for (const [k, n] of Object.entries(widths)) v(`width-${k}`, rem(n))
for (const [k, n] of Object.entries(containers)) v(`container-${k}`, rem(n))

writeFileSync(
  resolve(root, 'src/styles/tokens.css'),
  `/*\n * Gerado por scripts/build-tokens.mjs a partir de design-tokens/design-tokens.tokens.json.\n * Não edite à mão: rode \`bun run tokens\`.\n */\n:root {\n${lines.join('\n')}\n}\n`,
)

console.log(`tokens: ${Object.keys(palettes).length} paletas, ${Object.keys(spacing).length} espaçamentos, ${Object.keys(shadows).length} sombras`)
