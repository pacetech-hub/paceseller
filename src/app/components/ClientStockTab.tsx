import { useEffect, useMemo, useState } from "react";
import { Search, Store, MapPin, X } from "lucide-react";
import { Stack, Box, TextInput, UnstyledButton, Paper, Text, Center, Group } from "@mantine/core";
import { clients as allClients, type Client } from "../data/mockData";
import { generateClientStock, type StockItem } from "../data/stockData";
import { StockTable } from "./StockTable";
import classes from "./ClientStockTab.module.css";

interface ClientStockTabProps {
  /** Rep só enxerga os dados, sem controles de edição. */
  readOnly?: boolean;
  /** Restringe a busca a um subconjunto de clientes (ex.: carteira do representante). */
  scopeClients?: Client[];
}

export function ClientStockTab({ readOnly = false, scopeClients }: ClientStockTabProps) {
  const pool = scopeClients ?? allClients;
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  const [items, setItems] = useState<StockItem[]>([]);

  useEffect(() => {
    if (selected) setItems(generateClientStock(selected));
  }, [selected]);

  const matches = useMemo(() => {
    const t = query.trim().toLowerCase();
    if (!t) return [];
    return pool.filter(c => c.name.toLowerCase().includes(t) || c.id.toLowerCase().includes(t)).slice(0, 8);
  }, [query, pool]);

  const updateStock = (sku: string, stock: number) => {
    setItems(prev => prev.map(it => it.sku === sku ? { ...it, stock, updatedAt: new Date().toISOString().slice(0, 10) } : it));
  };

  return (
    <Stack gap="md">
      <Box pos="relative" maw={448}>
        <TextInput
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar cliente por nome ou código..."
          size="md"
          leftSection={<Search size={14} color="var(--mantine-color-dimmed)" />}
          rightSection={selected ? (
            <UnstyledButton onClick={() => { setSelected(null); setQuery(''); }} className={classes.clearBtn}>
              <X size={14} />
            </UnstyledButton>
          ) : undefined}
          styles={{ input: { fontSize: '0.85rem' } }}
        />
        {query && matches.length > 0 && (
          <Paper withBorder radius="md" shadow="lg" pos="absolute" left={0} right={0} mt={4} style={{ zIndex: 10, overflow: 'hidden' }}>
            {matches.map(c => (
              <UnstyledButton
                key={c.id}
                onClick={() => { setSelected(c); setQuery(''); }}
                className={classes.option}
              >
                <Store size={14} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
                <Text span truncate size="0.82rem">{c.name}</Text>
                <Text span c="dimmed" ml="auto" size="0.7rem" style={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{c.id}</Text>
              </UnstyledButton>
            ))}
          </Paper>
        )}
        {query && matches.length === 0 && (
          <Paper withBorder radius="md" pos="absolute" left={0} right={0} mt={4} p="sm" style={{ zIndex: 10 }}>
            <Text c="dimmed" size="0.78rem">Nenhum cliente encontrado.</Text>
          </Paper>
        )}
      </Box>

      {!selected && (
        <Paper withBorder radius="lg" py={64} ta="center">
          <Center mb="sm">
            <Store size={40} color="var(--mantine-color-dimmed)" style={{ opacity: 0.3 }} />
          </Center>
          <Text c="dimmed" size="0.88rem">Busque um cliente acima para ver o estoque reportado por ele.</Text>
        </Paper>
      )}

      {selected && (
        <>
          <Paper withBorder radius="lg" p="md">
            <Group gap="sm" wrap="nowrap">
              <Center w={40} h={40} bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-md)', flexShrink: 0 }}>
                <Store size={16} color="var(--mantine-color-gray-9)" />
              </Center>
              <Box miw={0}>
                <Text truncate size="0.92rem" fw={700}>{selected.name}</Text>
                <Group gap={6} wrap="nowrap" c="dimmed">
                  <MapPin size={12} />
                  <Text span size="0.75rem">{selected.city} · {selected.state} · Rep: {selected.rep}</Text>
                </Group>
              </Box>
            </Group>
          </Paper>

          <StockTable
            items={items}
            onUpdateStock={readOnly ? undefined : updateStock}
            readOnly={readOnly}
          />
        </>
      )}
    </Stack>
  );
}
