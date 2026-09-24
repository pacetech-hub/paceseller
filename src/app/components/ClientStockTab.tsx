import { useEffect, useMemo, useState } from "react";
import { Select, Paper, Group, Text, ThemeIcon, Box, Stack, type ComboboxItem, type OptionsFilter } from "@mantine/core";
import { MagnifyingGlassIcon, StorefrontIcon, MapPinIcon } from "@phosphor-icons/react";
import { clients as allClients, type Client } from "../data/mockData";
import { generateClientStock, type StockItem } from "../data/stockData";
import { StockTable } from "./StockTable";

interface ClientStockTabProps {
  /** Rep só enxerga os dados, sem controles de edição. */
  readOnly?: boolean;
  /** Restringe a busca a um subconjunto de clientes (ex.: carteira do representante). */
  scopeClients?: Client[];
}

// Busca tanto pelo nome (label) quanto pelo código do cliente (value).
const filterByNameOrId: OptionsFilter = ({ options, search }) => {
  const t = search.trim().toLowerCase();
  if (!t) return options;
  return (options as ComboboxItem[]).filter(o => o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t));
};

export function ClientStockTab({ readOnly = false, scopeClients }: ClientStockTabProps) {
  const pool = scopeClients ?? allClients;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<StockItem[]>([]);

  const selected = useMemo(() => pool.find(c => c.id === selectedId) ?? null, [pool, selectedId]);
  const options = useMemo(() => pool.map(c => ({ value: c.id, label: c.name })), [pool]);

  useEffect(() => {
    if (selected) setItems(generateClientStock(selected));
  }, [selected]);

  const updateStock = (sku: string, stock: number) => {
    setItems(prev => prev.map(it => it.sku === sku ? { ...it, stock, updatedAt: new Date().toISOString().slice(0, 10) } : it));
  };

  return (
    <Stack gap="md">
      <Select
        maw={448}
        searchable
        clearable
        value={selectedId}
        onChange={setSelectedId}
        data={options}
        filter={filterByNameOrId}
        limit={8}
        placeholder="Buscar cliente por nome ou código..."
        nothingFoundMessage="Nenhum cliente encontrado."
        leftSection={<MagnifyingGlassIcon size={14} />}
        renderOption={({ option }) => (
          <Group gap="xs" wrap="nowrap" w="100%">
            <StorefrontIcon size={14} color="var(--mantine-color-dimmed)" />
            <Text size="0.82rem" truncate flex={1}>{option.label}</Text>
            <Text c="dimmed" size="0.7rem" className="mono">{option.value}</Text>
          </Group>
        )}
      />

      {!selected && (
        <Paper withBorder radius="lg" py={64}>
          <Stack align="center" gap="sm">
            <StorefrontIcon size={40} opacity={0.3} />
            <Text c="dimmed" size="0.88rem">Busque um cliente acima para ver o estoque reportado por ele.</Text>
          </Stack>
        </Paper>
      )}

      {selected && (
        <>
          <Paper withBorder radius="lg" p="md">
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon size={40} radius="md" variant="light">
                <StorefrontIcon size={16} />
              </ThemeIcon>
              <Box miw={0}>
                <Text size="0.92rem" fw={700} truncate>{selected.name}</Text>
                <Group gap={6} c="dimmed" wrap="nowrap">
                  <MapPinIcon size={12} />
                  <Text size="0.75rem" c="dimmed">{selected.city} · {selected.state} · Rep: {selected.rep}</Text>
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
