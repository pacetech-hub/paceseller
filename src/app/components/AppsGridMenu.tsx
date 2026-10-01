import { Button, Card, Group, SimpleGrid, Text, UnstyledButton } from "@mantine/core";
import { SignOutIcon, type Icon } from "@phosphor-icons/react";
import classes from "./AppsGridMenu.module.css";

export interface AppsGridItem<V extends string = string> {
  label: string;
  icon: Icon;
  view: V;
}

interface AppsGridMenuProps<V extends string> {
  title: string;
  items: AppsGridItem<V>[];
  currentView: V;
  onSelect: (view: V) => void;
  onLogout: () => void;
}

// "Card with application grid" (ui.mantine.dev — ActionsGrid): todas as páginas do perfil em um só menu.
// Ícones na cor do texto (a paleta do app reserva cor para status), rótulos de 14px e
// a página atual marcada com borda + semibold.
export function AppsGridMenu<V extends string>({ title, items, currentView, onSelect, onLogout }: AppsGridMenuProps<V>) {
  return (
    <Card withBorder className={classes.card}>
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Text fw={600}>{title}</Text>
        <Button variant="subtle" color="red" leftSection={<SignOutIcon size={16} />} onClick={onLogout}>
          Sair
        </Button>
      </Group>
      <SimpleGrid cols={3} spacing="sm" mt="md">
        {items.map(item => {
          const ItemIcon = item.icon;
          const active = currentView === item.view;
          return (
            <UnstyledButton
              key={item.view}
              className={classes.item}
              data-active={active || undefined}
              aria-current={active ? 'page' : undefined}
              onClick={() => onSelect(item.view)}
            >
              <ItemIcon size={28} />
              <Text size="sm" mt="xs" fw={active ? 600 : 400} lh={1.3}>
                {item.label}
              </Text>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>
    </Card>
  );
}
