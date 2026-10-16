import { ActionIcon, Box, Card, Divider, Group, SimpleGrid, Text, ThemeIcon, Tooltip, UnstyledButton } from "@mantine/core";
import { SignOutIcon, type Icon } from "@phosphor-icons/react";
import classes from "./AppsGridMenu.module.css";

export interface AppsGridItem<V extends string = string> {
  label: string;
  icon: Icon;
  view: V;
}

interface AppsGridMenuProps<V extends string> {
  /** Páginas principais do perfil. */
  items: AppsGridItem<V>[];
  /** Páginas secundárias (permissões/administração e suporte), depois de um divisor. */
  secondaryItems: AppsGridItem<V>[];
  /** Último segmento: tipo de conta, usuário logado e sair. */
  account: { typeLabel: string; icon: Icon; userName: string; profileView: V };
  currentView: V;
  onSelect: (view: V) => void;
  onLogout: () => void;
}

function Grid<V extends string>({ items, currentView, onSelect }: Pick<AppsGridMenuProps<V>, 'items' | 'currentView' | 'onSelect'>) {
  return (
    <SimpleGrid cols={3} spacing="sm">
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
  );
}

// "Card with application grid" (ui.mantine.dev — ActionsGrid): todas as páginas do perfil em um só menu,
// em três segmentos: páginas principais, secundárias e a conta (tipo, usuário e sair).
// Ícones na cor do texto (a paleta do app reserva cor para status), rótulos de 14px e
// a página atual marcada com borda + semibold.
export function AppsGridMenu<V extends string>({ items, secondaryItems, account, currentView, onSelect, onLogout }: AppsGridMenuProps<V>) {
  const AccountIcon = account.icon;
  const onProfile = currentView === account.profileView;
  return (
    <Card withBorder className={classes.card}>
      <Grid items={items} currentView={currentView} onSelect={onSelect} />
      <Divider my="md" />
      <Grid items={secondaryItems} currentView={currentView} onSelect={onSelect} />
      <Divider my="md" />
      <Group justify="space-between" wrap="nowrap" gap="sm">
        {/* O usuário leva ao Meu Perfil */}
        <UnstyledButton
          onClick={() => onSelect(account.profileView)}
          className={classes.account}
          data-active={onProfile || undefined}
          aria-current={onProfile ? 'page' : undefined}
          aria-label={`Meu Perfil · ${account.typeLabel} · ${account.userName}`}
        >
          <Group gap="sm" wrap="nowrap" miw={0}>
            <ThemeIcon size={36} radius="xl" variant="light" color="neutral" aria-hidden>
              <AccountIcon size={18} />
            </ThemeIcon>
            <Box miw={0}>
              <Text size="xs" c="dimmed" lh={1.3}>{account.typeLabel}</Text>
              <Text size="sm" fw={600} lh={1.3} truncate>{account.userName}</Text>
            </Box>
          </Group>
        </UnstyledButton>
        <Tooltip label="Sair" withArrow>
          <ActionIcon variant="subtle" color="red" size="lg" onClick={onLogout} aria-label="Sair">
            <SignOutIcon size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </Card>
  );
}
