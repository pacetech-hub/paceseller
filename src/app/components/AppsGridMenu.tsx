import { Button, Card, Group, SimpleGrid, Text, UnstyledButton, useMantineTheme } from "@mantine/core";
import { SignOutIcon, type Icon } from "@phosphor-icons/react";
import classes from "./AppsGridMenu.module.css";

export interface AppsGridItem<V extends string = string> {
  label: string;
  icon: Icon;
  view: V;
  /** Cor do tema Mantine para o ícone (ex.: 'blue', 'teal') */
  color: string;
}

interface AppsGridMenuProps<V extends string> {
  title: string;
  items: AppsGridItem<V>[];
  currentView: V;
  onSelect: (view: V) => void;
  onLogout: () => void;
}

// "Card with application grid" (ui.mantine.dev — ActionsGrid): todas as páginas do perfil em um só menu.
export function AppsGridMenu<V extends string>({ title, items, currentView, onSelect, onLogout }: AppsGridMenuProps<V>) {
  const theme = useMantineTheme();

  return (
    <Card withBorder radius="md" className={classes.card}>
      <Group justify="space-between" wrap="nowrap">
        <Text fw={700}>{title}</Text>
        <Button
          variant="subtle"
          color="red"
          size="compact-sm"
          leftSection={<SignOutIcon size={14} />}
          onClick={onLogout}
        >
          Sair
        </Button>
      </Group>
      <SimpleGrid cols={3} spacing="xs" mt="md">
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
              <ItemIcon color={theme.colors[item.color][6]} size={32} />
              <Text size="xs" mt={7} fw={active ? 700 : 500} lh={1.3}>
                {item.label}
              </Text>
            </UnstyledButton>
          );
        })}
      </SimpleGrid>
    </Card>
  );
}
