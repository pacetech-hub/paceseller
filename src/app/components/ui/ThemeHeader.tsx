import type { ReactNode } from "react";
import { Badge, Box, Group, Text, Title } from "@mantine/core";
import type { Icon } from "@phosphor-icons/react";

/** Cabeçalho de um tema do Radar (título, contagem opcional, descrição e ação à direita). */
export function ThemeHeader({ title, description, count, action }: {
  /** Mantido por compatibilidade; o cabeçalho não mostra ícone. */
  icon?: Icon; title: string; description: string; count?: number; action?: ReactNode;
}) {
  return (
    <Group justify="space-between" align="flex-end" gap="sm">
      <Box>
        <Group gap="xs">
          <Title order={2} fz="lg">{title}</Title>
          {count !== undefined && (
            <Badge size="sm" circle variant="filled" color={count > 0 ? 'brand' : 'gray'}>{count}</Badge>
          )}
        </Group>
        <Text size="sm" c="dimmed">{description}</Text>
      </Box>
      {action}
    </Group>
  );
}
