import { useState } from "react";
import { ActionIcon, Anchor, Box, Group, Indicator, Popover, ScrollArea, Stack, Text, ThemeIcon, Tooltip, UnstyledButton } from "@mantine/core";
import {
  BellIcon, ChatCircleIcon, CheckCircleIcon, CurrencyCircleDollarIcon, PackageIcon, ShoppingCartIcon, TruckIcon, WarningIcon,
  type Icon,
} from "@phosphor-icons/react";
import type { View } from "./Sidebar";
import classes from "./interactive.module.css";

// Notificações do sino: lista mock por perfil até existir o serviço de notificações.
// O número no sino é o de não lidas; clicar abre a página relacionada e marca como lida.

type Profile = 'admin' | 'rep' | 'lojista';

interface Notification {
  id: string;
  icon: Icon;
  color: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  view?: View;
}

const MOCK: Record<Profile, Notification[]> = {
  rep: [
    { id: 'r1', icon: ShoppingCartIcon, color: 'yellow', title: 'Pedido esperando suas condições', body: 'Calçadão Paulista LTDA enviou "Flow XL Natal" — 36 pares', time: 'há 12 min', read: false, view: 'carts' },
    { id: 'r2', icon: ChatCircleIcon, color: 'blue', title: 'Nova mensagem de Juliana Rocha', body: '"Fechado, pode deixar assim. Só confirma o prazo de entrega."', time: 'há 40 min', read: false, view: 'carts' },
    { id: 'r3', icon: WarningIcon, color: 'red', title: 'Título vencido na carteira', body: 'Shoestore Norte está com boleto em aberto há 12 dias', time: 'há 2h', read: false, view: 'clients' },
    { id: 'r4', icon: CheckCircleIcon, color: 'teal', title: 'Pagamento confirmado', body: 'Pedido Hertz de Calçadão Paulista virou o pedido PED-2026-0512', time: 'ontem', read: true, view: 'history' },
    { id: 'r5', icon: PackageIcon, color: 'gray', title: 'Lançamento disponível', body: 'Tênis Tesla Fusion Black Red já pode ser oferecido à carteira', time: 'há 2 dias', read: true, view: 'catalog' },
  ],
  lojista: [
    { id: 'l1', icon: ShoppingCartIcon, color: 'yellow', title: 'Marcos sugeriu um pedido', body: '"Coil Verão" — 44 pares esperando sua revisão', time: 'há 20 min', read: false, view: 'radar' },
    { id: 'l2', icon: CheckCircleIcon, color: 'teal', title: 'Condições confirmadas', body: '"Pedido Hertz" está liberado para pagamento', time: 'há 1h', read: false, view: 'radar' },
    { id: 'l3', icon: CurrencyCircleDollarIcon, color: 'red', title: 'Boleto vence amanhã', body: 'Parcela 2/3 do pedido PED-2026-0412 — R$ 3.513,33', time: 'há 3h', read: false, view: 'boletos' },
    { id: 'l4', icon: TruckIcon, color: 'blue', title: 'Pedido saiu para entrega', body: 'PED-2026-0398 chega em até 2 dias úteis', time: 'ontem', read: true, view: 'history' },
    { id: 'l5', icon: ChatCircleIcon, color: 'gray', title: 'Nova mensagem de Marcos', body: '"Se fechar até sexta, consigo manter a condição 30/60/90."', time: 'há 2 dias', read: true, view: 'radar' },
  ],
  admin: [
    { id: 'a1', icon: ShoppingCartIcon, color: 'yellow', title: '4 pedidos em análise', body: 'Somam R$ 41.200,00 — o mais antigo há 3 dias', time: 'há 15 min', read: false, view: 'history' },
    { id: 'a2', icon: WarningIcon, color: 'red', title: 'Estoque crítico', body: 'Tênis Tesla Coil Branco: numerações 38–40 abaixo de 30 pares', time: 'há 1h', read: false, view: 'industry-stock' },
    { id: 'a3', icon: CurrencyCircleDollarIcon, color: 'red', title: '2 clientes inadimplentes', body: 'Shoestore Norte e Sapatinho de Ouro BH com títulos vencidos', time: 'há 4h', read: false, view: 'boletos' },
    { id: 'a4', icon: CheckCircleIcon, color: 'teal', title: 'Meta semanal atingida', body: 'Fernanda Lima fechou 112% da meta da semana', time: 'ontem', read: true, view: 'radar' },
    { id: 'a5', icon: PackageIcon, color: 'gray', title: 'Ficha técnica atualizada', body: 'Medidas da linha Flow XL revisadas pelo produto', time: 'há 3 dias', read: true, view: 'ficha-tecnica' },
  ],
};

export function NotificationsMenu({ profile, onNavigate }: { profile: Profile; onNavigate: (view: View) => void }) {
  const [items, setItems] = useState<Notification[]>(() => MOCK[profile]);
  const [opened, setOpened] = useState(false);
  const unread = items.filter(n => !n.read).length;

  const open = (n: Notification) => {
    setItems(list => list.map(x => (x.id === n.id ? { ...x, read: true } : x)));
    setOpened(false);
    if (n.view) onNavigate(n.view);
  };

  return (
    <Popover opened={opened} onChange={setOpened} position="bottom-end" offset={8} shadow="md" width={380} withinPortal>
      <Popover.Target>
        <Indicator label={unread} disabled={unread === 0} size={16} color="red" offset={4}>
          <Tooltip label="Ver Notificações" withArrow disabled={opened}>
            <ActionIcon variant="subtle" color="brand" size="lg" onClick={() => setOpened(o => !o)} aria-label={`Ver Notificações · ${unread} não lidas`} aria-expanded={opened}>
              <BellIcon size={18} />
            </ActionIcon>
          </Tooltip>
        </Indicator>
      </Popover.Target>
      <Popover.Dropdown p={0}>
        <Group justify="space-between" wrap="nowrap" gap="xs" px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
          <Text fw={600} size="sm" truncate>Notificações{unread > 0 ? ` · ${unread} não lidas` : ''}</Text>
          {unread > 0 && (
            <Anchor component="button" type="button" size="xs" fw={600} flex="none" onClick={() => setItems(list => list.map(x => ({ ...x, read: true })))}>
              Marcar todas como lidas
            </Anchor>
          )}
        </Group>
        <ScrollArea.Autosize mah={420}>
          <Stack gap={0}>
            {items.map(n => (
              <UnstyledButton
                key={n.id}
                onClick={() => open(n)}
                className={classes.hoverable}
                px="md"
                py="sm"
                bg={n.read ? undefined : 'var(--mantine-color-blue-light)'}
                style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
              >
                <Group gap="sm" wrap="nowrap" align="flex-start">
                  <ThemeIcon size={32} radius="xl" variant="light" color={n.color} style={{ flex: 'none' }} aria-hidden>
                    <n.icon size={16} />
                  </ThemeIcon>
                  <Box miw={0} flex={1}>
                    <Group justify="space-between" gap="xs" wrap="nowrap">
                      <Text size="sm" fw={n.read ? 500 : 700} truncate>{n.title}</Text>
                      <Text size="xs" c="dimmed" flex="none">{n.time}</Text>
                    </Group>
                    <Text size="xs" c="dimmed" lineClamp={2}>{n.body}</Text>
                  </Box>
                  {!n.read && <Box w={8} h={8} mt={6} bg="blue.6" style={{ borderRadius: '50%', flex: 'none' }} aria-label="Não lida" />}
                </Group>
              </UnstyledButton>
            ))}
          </Stack>
        </ScrollArea.Autosize>
      </Popover.Dropdown>
    </Popover>
  );
}
