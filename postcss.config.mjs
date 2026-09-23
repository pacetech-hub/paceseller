import postcssPresetMantine from 'postcss-preset-mantine'
import postcssSimpleVars from 'postcss-simple-vars'

// Configuração recomendada pelo Mantine: habilita rem(), light-dark(), @mixin hover etc. nos CSS modules.
export default {
  plugins: [
    postcssPresetMantine(),
    postcssSimpleVars({
      variables: {
        'mantine-breakpoint-xs': '30em',
        'mantine-breakpoint-sm': '40em',
        'mantine-breakpoint-md': '48em',
        'mantine-breakpoint-lg': '64em',
        'mantine-breakpoint-xl': '80em',
      },
    }),
  ],
}
