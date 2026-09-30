import { useEffect, useMemo, useRef, useState } from "react";
import { Select, Paper, Group, Text, ThemeIcon, Box, Stack, type ComboboxItem, type ComboboxParsedItem, type OptionsFilter } from "@mantine/core";
import { MagnifyingGlassIcon, StorefrontIcon, MapPinIcon } from "@phosphor-icons/react";
import { clients as allClients, type Client } from "../data/mockData";
import { generateClientStock, type StockItem } from "../data/stockData";
import { StockTable } from "./StockTable";
import { EmptyState } from "./ui/EmptyState";

interface ClientStockTabProps {
  /** Rep só enxerga os dados, sem controles de edição. */
  readOnly?: boolean;
  /** Restringe a busca a um subconjunto de clientes (ex.: carteira do representante). */
  scopeClients?: Client[];
}

// Busca tanto pelo nome (label) quanto pelo código do cliente (value); preserva os grupos.
const filterByNameOrId: OptionsFilter = ({ options, search }) => {
  const t = search.trim().toLowerCase();
  if (!t) return options;
  const match = (o: ComboboxItem) => o.label.toLowerCase().includes(t) || o.value.toLowerCase().includes(t);
  return options.flatMap<ComboboxParsedItem>(o =>
    'group' in o
      ? (o.items.some(match) ? [{ ...o, items: o.items.filter(match) }] : [])
      : (match(o) ? [o] : [])
  );
};

// Quantos clientes aparecem em "Mais usados" (os que mais compraram)
const POPULAR_COUNT = 3;

export function ClientStockTab({ readOnly = false, scopeClients }: ClientStockTabProps) {
  const pool = scopeClients ?? allClients;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState<StockItem[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => pool.find(c => c.id === selectedId) ?? null, [pool, selectedId]);
  // "Mais usados": clientes com maior volume de compras (derivado do mock totalPurchased)
  const popularClients = useMemo(
    () => [...pool].sort((a, b) => b.totalPurchased - a.totalPurchased).slice(0, POPULAR_COUNT),
    [pool]
  );
  const options = useMemo(() => {
    const popularIds = new Set(popularClients.map(c => c.id));
    const toOption = (c: Client) => ({ value: c.id, label: c.name });
    // cada cliente aparece uma única vez (Mantine rejeita valores duplicados)
    return [
      { group: 'Mais usados', items: popularClients.map(toOption) },
      { group: 'Todos', items: pool.filter(c => !popularIds.has(c.id)).map(toOption) },
    ];
  }, [pool, popularClients]);

  useEffect(() => {
    if (selected) setItems(generateClientStock(selected));
  }, [selected]);

  const updateStock = (sku: string, stock: number) => {
    setItems(prev => prev.map(it => it.sku === sku ? { ...it, stock, updatedAt: new Date().toISOString().slice(0, 10) } : it));
  };

  return (
    <Stack gap="md">
      <Select
        ref={searchRef}
        maw={448}
        searchable
        clearable
        value={selectedId}
        onChange={setSelectedId}
        data={options}
        filter={filterByNameOrId}
        limit={8}
        placeholder="Buscar por nome ou código do cliente"
        nothingFoundMessage="Nenhum cliente encontrado. Confira o nome ou busque pelo código do cliente."
        leftSection={<MagnifyingGlassIcon size={14} />}
        renderOption={({ option }) => (
          <Group gap="xs" wrap="nowrap" w="100%">
            <StorefrontIcon size={14} color="var(--mantine-color-dimmed)" />
            <Text truncate flex={1}>{option.label}</Text>
            <Text c="dimmed" size="sm" className="mono">{option.value}</Text>
          </Group>
        )}
      />

      {!selected && (
        <EmptyState
          icon={StorefrontIcon}
          title="Nenhum cliente selecionado"
          description="Busque um cliente acima pelo nome ou código para ver o estoque reportado por ele."
          action={{ label: 'Buscar Cliente', onClick: () => searchRef.current?.focus(), forward: false }}
          suggestions={popularClients.map(c => ({
            label: `Ver estoque de ${c.name}`,
            description: `${c.city} · ${c.state}`,
            icon: StorefrontIcon,
            onClick: () => setSelectedId(c.id),
          }))}
        />
      )}

      {selected && (
        <>
          <Paper withBorder p="md">
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon size={40} variant="light">
                <StorefrontIcon size={16} />
              </ThemeIcon>
              <Box miw={0}>
                <Text fw={700} truncate>{selected.name}</Text>
                <Group gap={6} c="dimmed" wrap="nowrap">
                  <MapPinIcon size={12} style={{ flexShrink: 0 }} />
                  <Text size="sm" c="dimmed" truncate>{selected.city} · {selected.state} · Rep: {selected.rep}</Text>
                </Group>
              </Box>
            </Group>
          </Paper>

          {/* key: ao trocar de cliente a tabela remonta e mostra o skeleton enquanto "carrega" */}
          <StockTable
            key={selected.id}
            items={items}
            onUpdateStock={readOnly ? undefined : updateStock}
            readOnly={readOnly}
          />
        </>
      )}
    </Stack>
  );
}
