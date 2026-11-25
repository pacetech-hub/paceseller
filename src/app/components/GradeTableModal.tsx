import { useEffect, useMemo, useState } from "react";
import { Box, Button, Divider, Group, Modal, NumberInput, Stack, Table, Text, Title } from "@mantine/core";
import type { Product } from "../data/mockData";
import { pairsOf } from "../data/cartStore";
import { curveLabel, pairsText, productDisplayName, splitBySizeCurve, storeSku, suggestedGrade, useRadar } from "../data/radar";
import { useSmallerThan } from "../lib/responsive";
import { Eyebrow } from "./CartParts";

// Grade por numeração em tabela compacta (uma linha de numerações, uma de pares). Usada pela
// gaveta de edição do pedido: edita o rascunho da gaveta, que só vai para o carrinho ao salvar.

type Sizes = Record<string, number>;

/** Texto de apoio acima da tabela: o giro da loja e o que cada botão faz. */
function hintFor(product: Product, suggestion: ReturnType<typeof suggestedGrade>): string {
  const sku = storeSku(product.id);
  const curve = curveLabel(splitBySizeCurve(product, 1).curve);
  const giro = sku && sku.dailySales > 0
    ? `${sku.dailySales >= 1 ? 'Alto giro' : 'Giro moderado'} — ${sku.dailySales.toLocaleString('pt-BR')} par/dia nos últimos 30 dias. `
    : '';
  if (suggestion) {
    return `${giro}Sugerimos ${pairsText(suggestion.qty)}. "Preencher sugestão" aplica esse número, ou digite outro total ao lado e clique "Distribuir" (usa a ${curve}).`;
  }
  return `${giro}Digite o total de pares e clique "Distribuir" para dividir pela ${curve}, ou preencha cada numeração.`;
}

/** Uma grade: total + distribuir/sugestão, tabela de numerações e soma. */
export function GradeTableEditor({ product, value, onChange, showName = false }: {
  product: Product;
  value: Sizes;
  onChange: (v: Sizes) => void;
  showName?: boolean;
}) {
  const radar = useRadar();
  const suggestion = useMemo(() => suggestedGrade(product, radar), [product, radar]);
  const [totalInput, setTotalInput] = useState<number | string>('');
  const sizes = Object.keys(product.grades).sort((a, b) => Number(a) - Number(b));
  const total = pairsOf(value);

  const setSize = (s: string, v: number) => {
    const max = product.grades[s];
    onChange({ ...value, [s]: Math.max(0, Math.min(max, Math.floor(v || 0))) });
  };

  return (
    <Stack gap="sm">
      {showName && <Text fw={600}>{productDisplayName(product)}</Text>}
      <Group gap="xs" wrap="wrap" align="center">
        <Eyebrow mr="auto">Grade por numeração</Eyebrow>
        <NumberInput
          value={totalInput}
          onChange={setTotalInput}
          min={0}
          w={88}
          size="sm"
          hideControls
          placeholder={String(total)}
          aria-label={`Total de pares de ${product.name}`}
        />
        <Button size="sm" variant="light" color="blue" ff="monospace" disabled={!Number(totalInput)} onClick={() => onChange(splitBySizeCurve(product, Number(totalInput)).sizes)}>
          Distribuir
        </Button>
        {suggestion && (
          <Button size="sm" variant="light" color="blue" ff="monospace" onClick={() => { onChange(suggestion.sizes); setTotalInput(suggestion.qty); }}>
            Preencher sugestão
          </Button>
        )}
      </Group>
      <Text size="xs" c="dimmed">{hintFor(product, suggestion)}</Text>

      <Table.ScrollContainer minWidth={sizes.length * 44}>
        <Table withTableBorder withColumnBorders layout="fixed" verticalSpacing={0} horizontalSpacing={0}>
          <Table.Thead bg="var(--mantine-color-default-hover)">
            <Table.Tr>
              {sizes.map(s => {
                const soldOut = product.grades[s] === 0;
                return (
                  <Table.Th key={s} ta="center" py={8} title={soldOut ? 'Esgotado' : `${product.grades[s]} disponíveis`}>
                    <Text size="xs" fw={600} ff="monospace" c={soldOut ? 'dimmed' : undefined} td={soldOut ? 'line-through' : undefined}>{s}</Text>
                  </Table.Th>
                );
              })}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr>
              {sizes.map(s => {
                const soldOut = product.grades[s] === 0;
                return (
                  <Table.Td key={s} p={0}>
                    <NumberInput
                      value={value[s] ?? 0}
                      onChange={v => setSize(s, Number(v))}
                      min={0}
                      max={product.grades[s]}
                      disabled={soldOut}
                      hideControls
                      variant="unstyled"
                      size="sm"
                      aria-label={`Pares no Nº ${s}${soldOut ? ' (esgotado)' : ''}`}
                      styles={{ input: { border: 0, background: 'transparent', textAlign: 'center', fontFamily: 'var(--ps-font-family-body)', fontVariantNumeric: 'tabular-nums', color: (value[s] ?? 0) === 0 ? 'var(--mantine-color-dimmed)' : undefined } }}
                    />
                  </Table.Td>
                );
              })}
            </Table.Tr>
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
      <Text size="xs" c="dimmed"><Text span fw={700} c="var(--mantine-color-text)" inherit>{total}</Text> pares selecionados · numeração riscada está esgotada</Text>
    </Stack>
  );
}

export interface GradeTableItem {
  product: Product;
  sizes: Sizes;
}

/** Modal com uma ou mais grades; devolve as grades editadas ao salvar. */
export function GradeTableModal({ opened, items, title, onClose, onSave, saveLabel = 'Salvar grade' }: {
  opened: boolean;
  items: GradeTableItem[];
  title?: string;
  onClose: () => void;
  onSave: (next: Record<string, Sizes>) => void;
  saveLabel?: string;
}) {
  const fullScreen = useSmallerThan('sm');
  const [draft, setDraft] = useState<Record<string, Sizes>>({});

  useEffect(() => {
    if (opened) setDraft(Object.fromEntries(items.map(i => [i.product.id, { ...i.sizes }])));
    // abre sempre com as grades recebidas
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const single = items.length === 1;
  const heading = title ?? (single ? `Editar grade — ${productDisplayName(items[0].product)}` : 'Editar grades');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="40rem"
      fullScreen={fullScreen}
      title={<Title order={3} fz="lg">{heading}</Title>}
      styles={{ header: { borderBottom: '1px solid var(--mantine-color-default-border)' }, body: { padding: 0 } }}
    >
      <Stack gap="lg" p="lg">
        {items.map((i, idx) => (
          <Box key={i.product.id}>
            {idx > 0 && <Divider mb="lg" />}
            <GradeTableEditor
              product={i.product}
              value={draft[i.product.id] ?? {}}
              onChange={v => setDraft(d => ({ ...d, [i.product.id]: v }))}
              showName={!single}
            />
          </Box>
        ))}
      </Stack>
      <Group grow gap="sm" p="lg" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Button variant="default" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => { onSave(draft); onClose(); }}>{saveLabel}</Button>
      </Group>
    </Modal>
  );
}
