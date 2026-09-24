/**
 * PostCSS Configuration
 *
 * postcss-preset-mantine habilita os mixins responsivos do Mantine nos CSS modules
 * (`@mixin smaller-than $mantine-breakpoint-sm`, `@mixin larger-than ...`, `@mixin hover`)
 * e a função `rem()`. As variáveis abaixo espelham os breakpoints de src/mantine/theme.ts.
 */
import postcssPresetMantine from 'postcss-preset-mantine'
import postcssSimpleVars from 'postcss-simple-vars'

export default {
  plugins: [
    postcssPresetMantine(),
    postcssSimpleVars({
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    }),
  ],
}
