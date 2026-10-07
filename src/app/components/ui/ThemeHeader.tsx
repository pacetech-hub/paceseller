import type { ReactNode } from "react";
import { Badge, Box, Group, Text, ThemeIcon, Title } from "@mantine/core";
import type { Icon } from "@phosphor-icons/react";

/** Cabeçalho de um tema do Radar (ícone, título, contagem opcional, descrição e ação à direita). */
export function ThemeHeader({ icon: HeaderIcon, title, description, count, action }: {
  icon: Icon; title: string; description: string; count?: number; action?: ReactNode;
}) {
  return (
    <Group justify="space-between" align="flex-end" gap="sm">
      <Group gap="sm" wrap="nowrap" align="flex-start">
        <ThemeIcon size={32} radius="md" variant="light" color="neutral" aria-hidden>
          <HeaderIcon size={18} />
        </ThemeIcon>
        <Box>
          <Group gap="xs">
            <Title order={2} fz="lg">{title}</Title>
            {count !== undefined && (
              <Badge size="sm" circle variant="filled" color={count > 0 ? 'neutral' : 'gray'}>{count}</Badge>
            )}
          </Group>
          <Text size="sm" c="dimmed">{description}</Text>
        </Box>
      </Group>
      {action}
    </Group>
  );
}
