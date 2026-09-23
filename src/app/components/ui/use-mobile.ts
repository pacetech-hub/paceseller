import { useMantineTheme } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

// "Mobile" = abaixo do breakpoint `sm` do tema Mantine (48em / 768px).
export function useIsMobile() {
  const theme = useMantineTheme();
  return !!useMediaQuery(`(max-width: calc(${theme.breakpoints.sm} - 1px))`);
}
