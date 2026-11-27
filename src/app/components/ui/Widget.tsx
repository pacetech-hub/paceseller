import type { ReactNode } from "react";
import { Badge, Box, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon, MinusIcon, type Icon } from "@phosphor-icons/react";

// Widgets do Radar (representante e lojista): mesma moldura em todos — título curto,
// corpo e link no rodapé. O título já nomeia o conteúdo, então não leva ícone.

export const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

// ---------------------------------------------------------------------------
// Widget: moldura comum (título + ação), corpo e rodapé
// ---------------------------------------------------------------------------
export function Widget({ title, subtitle, action, footer, children }: {
  /** Mantido por compatibilidade; o título não mostra ícone. */
  icon?: Icon; title: string; subtitle?: string; action?: ReactNode; footer?: ReactNode; children: ReactNode;
}) {
  return (
    <Paper withBorder p="lg" h="100%">
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
          <Box miw={0}>
            {/* quebra em vez de cortar: no celular os indicadores ficam em duas colunas estreitas */}
            <Text size="sm" fw={600} lineClamp={2}>{title}</Text>
            {subtitle && <Text size="xs" c="dimmed">{subtitle}</Text>}
          </Box>
          {action}
        </Group>
        {children}
        {footer && <Box mt="auto">{footer}</Box>}
      </Stack>
    </Paper>
  );
}

export function WidgetLink({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button variant="transparent" color="brand" px={0} fw={600} rightSection={<ArrowRightIcon size={18} />} onClick={onClick} disabled={disabled}>
      {label}
    </Button>
  );
}

/** Variação contra o ano anterior em pílula: ícone + texto (nunca só a cor). */
export function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) return <Badge variant="light" color="gray" size="md">sem base</Badge>;
  const flat = value === 0;
  const up = value > 0;
  const DeltaIcon = flat ? MinusIcon : up ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <Badge
      variant="light"
      color={flat ? 'gray' : up ? 'teal' : 'red'}
      size="md"
      leftSection={<DeltaIcon size={12} weight="bold" aria-hidden />}
      aria-label={`${pct(value)} sobre o ano anterior`}
    >
      {pct(value)}
    </Badge>
  );
}

