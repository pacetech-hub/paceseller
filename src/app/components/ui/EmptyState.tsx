import type { ReactNode } from "react";
import { Box, Button, Group, Paper, Stack, Text, ThemeIcon, Title, UnstyledButton } from "@mantine/core";
import { ArrowRightIcon, TrayIcon, type Icon } from "@phosphor-icons/react";
import interactive from "../interactive.module.css";

// Estado vazio que guia a pessoa: nunca uma área em branco. Explica por que não há dados,
// oferece a ação principal para resolver e sugere ações populares para começar agora.
//
//   <EmptyState
//     icon={ShoppingBagIcon}
//     title="Você ainda não fez pedidos"
//     description="Seus pedidos aparecem aqui assim que forem enviados."
//     action={{ label: 'Ir para o Catálogo', onClick: () => onNavigate('catalog') }}
//     suggestions={[{ label: 'Repetir último pedido', description: 'Grade completa do Flow XL', onClick: … }]}
//   />

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  /** Ações que levam adiante ganham seta; ações no lugar (ex.: limpar filtros), não. */
  forward?: boolean;
}

export interface EmptyStateSuggestion {
  label: string;
  description?: string;
  icon?: Icon;
  onClick: () => void;
}

export function EmptyState({
  icon: IconCmp = TrayIcon,
  title,
  description,
  action,
  secondaryAction,
  suggestions,
  withBorder = true,
  children,
}: {
  icon?: Icon;
  title: string;
  description?: ReactNode;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  /** "Ações populares": atalhos que a pessoa pode tomar imediatamente. */
  suggestions?: EmptyStateSuggestion[];
  withBorder?: boolean;
  children?: ReactNode;
}) {
  const content = (
    <Stack gap="lg" align="flex-start">
      <ThemeIcon variant="light" color="neutral" size={48}>
        <IconCmp size={24} />
      </ThemeIcon>
      <Box>
        <Title order={3}>{title}</Title>
        {description && <Text c="dimmed" mt={4}>{description}</Text>}
      </Box>
      {children}
      {(action || secondaryAction) && (
        <Group gap="sm">
          {secondaryAction && (
            <Button variant="default" onClick={secondaryAction.onClick}
              rightSection={secondaryAction.forward ? <ArrowRightIcon size={16} /> : undefined}>
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button onClick={action.onClick}
              rightSection={action.forward !== false ? <ArrowRightIcon size={16} /> : undefined}>
              {action.label}
            </Button>
          )}
        </Group>
      )}
      {suggestions && suggestions.length > 0 && (
        <Box w="100%">
          <Text size="sm" c="dimmed" mb="sm">Ações populares</Text>
          <Stack gap="sm">
            {suggestions.map(s => {
              const SIcon = s.icon;
              return (
                <UnstyledButton key={s.label} onClick={s.onClick} className={interactive.hoverable}
                  p="md" style={{ border: '1px solid var(--mantine-color-default-border)', borderRadius: 'var(--mantine-radius-md)' }}>
                  <Group gap="md" wrap="nowrap" align="flex-start">
                    {SIcon && <Box mt={2}><SIcon size={20} /></Box>}
                    <Box flex={1} miw={0}>
                      <Text fw={600}>{s.label}</Text>
                      {s.description && <Text size="sm" c="dimmed">{s.description}</Text>}
                    </Box>
                    <Box mt={2} c="dimmed"><ArrowRightIcon size={16} /></Box>
                  </Group>
                </UnstyledButton>
              );
            })}
          </Stack>
        </Box>
      )}
    </Stack>
  );
  return withBorder ? <Paper withBorder p={{ base: 'md', sm: 'xl' }}>{content}</Paper> : <Box py="md">{content}</Box>;
}
