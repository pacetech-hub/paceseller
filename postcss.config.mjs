import postcssPresetMantine from 'postcss-preset-mantine'
import postcssSimpleVars from 'postcss-simple-vars'

// Configuração recomendada pelo Mantine: habilita rem(), light-dark(), @mixin hover etc. nos CSS modules.
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
