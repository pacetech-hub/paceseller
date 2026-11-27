import { Text } from "@mantine/core";

/** Contagem ao lado do rótulo de uma aba ("HOJE 4"); vermelha quando há itens críticos. */
export function TabCount({ value, critical = false, label }: { value: number; critical?: boolean; label?: string }) {
  return (
    <Text span fz="xs" ff="monospace" fw={600} c={critical ? 'red.7' : 'dimmed'} aria-label={label}>
      {value}
    </Text>
  );
}
