import { useMantineTheme, type MantineBreakpoint } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

/**
 * true quando a viewport está abaixo do breakpoint informado do tema
 * (mesmo critério de `hiddenFrom` / `@mixin smaller-than`).
 * Use só quando uma prop precisa mudar em JS (ex.: `fullScreen` de Modal);
 * para layout, prefira style props responsivas (`p={{ base: 'sm', md: 'lg' }}`),
 * `SimpleGrid cols={{ ... }}`, `hiddenFrom`/`visibleFrom` ou os mixins de CSS.
 */
export function useSmallerThan(breakpoint: MantineBreakpoint = "sm") {
  const theme = useMantineTheme();
  // 48em -> 47.99375em, igual ao que o Mantine gera para hiddenFrom
  const max = `${parseFloat(theme.breakpoints[breakpoint]) - 0.1 / 16}em`;
  return useMediaQuery(`(max-width: ${max})`, false, {
    getInitialValueInEffect: false,
  }) ?? false;
}
