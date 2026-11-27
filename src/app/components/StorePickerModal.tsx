import { useMemo, useState } from "react";
import { Badge, Box, Group, Modal, ScrollArea, Stack, Text, TextInput, UnstyledButton } from "@mantine/core";
import { CheckIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { clients, type Client } from "../data/mockData";
import { cartPairs, isOpen, useCartStore } from "../data/cartStore";
import classes from "./interactive.module.css";

// "Trocar loja": o representante escolhe a loja que está atendendo. Catálogo, carrinhos e pedidos
// passam a valer para essa loja. Primeiro a carteira do representante; a busca alcança as demais.

interface StorePickerModalProps {
  opened: boolean;
  onClose: () => void;
  repName: string;
  current: Client | null;
  onSelect: (client: Client) => void;
}

export function StorePickerModal({ opened, onClose, repName, current, onSelect }: StorePickerModalProps) {
  const { carts } = useCartStore();
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mine = clients.filter(c => c.rep === repName);
    const pool = q ? clients : mine.length > 0 ? mine : clients;
    return pool
      .filter(c => !q || `${c.name} ${c.city} ${c.state}`.toLowerCase().includes(q))
      .sort((a, b) => Number(b.rep === repName) - Number(a.rep === repName) || a.name.localeCompare(b.name));
  }, [query, repName]);

  const openCartsOf = (id: string) => carts.filter(c => c.clientId === id && isOpen(c));

  return (
    <Modal
      opened={opened}
      onClose={() => { setQuery(''); onClose(); }}
      title={<Text fw={600}>Qual loja você está atendendo?</Text>}
      centered
      size="lg"
    >
      <Stack gap="sm">
        <TextInput
          placeholder="Buscar por nome ou cidade"
          leftSection={<MagnifyingGlassIcon size={16} />}
          value={query}
          onChange={e => setQuery(e.currentTarget.value)}
          aria-label="Buscar loja"
          data-autofocus
        />
        <ScrollArea.Autosize mah={420}>
          <Stack gap={4}>
            {list.length === 0 && <Text size="sm" c="dimmed" ta="center" py="md">Nenhuma loja encontrada.</Text>}
            {list.map(c => {
              const open = openCartsOf(c.id);
              const selected = current?.id === c.id;
              return (
                <UnstyledButton
                  key={c.id}
                  onClick={() => { onSelect(c); setQuery(''); onClose(); }}
                  className={classes.hoverable}
                  px="sm"
                  py="xs"
                  aria-current={selected ? 'true' : undefined}
                  style={{ borderRadius: 'var(--mantine-radius-default)', border: '1px solid var(--mantine-color-default-border)' }}
                >
                  <Group justify="space-between" wrap="nowrap" gap="sm">
                    <Box miw={0}>
                      <Group gap={6} wrap="nowrap">
                        <Text size="sm" fw={600} truncate>{c.name}</Text>
                        {c.inadimplente && <Badge size="xs" variant="light" color="red">Título vencido</Badge>}
                        {c.rep !== repName && <Badge size="xs" variant="outline" color="gray">Fora da carteira</Badge>}
                      </Group>
                      <Text size="xs" c="dimmed">
                        {c.city}, {c.state}
                        {open.length > 0 && ` · ${open.length} ${open.length === 1 ? 'carrinho aberto' : 'carrinhos abertos'} (${open.reduce((a, x) => a + cartPairs(x), 0)} pares)`}
                      </Text>
                    </Box>
                    {selected && <CheckIcon size={16} aria-label="Loja atual" />}
                  </Group>
                </UnstyledButton>
              );
            })}
          </Stack>
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
}
