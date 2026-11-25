import { useState } from "react";
import { Stack, Group, Box, Paper, Text, Collapse, Anchor, UnstyledButton } from "@mantine/core";
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react";
import { formatCurrency } from "../data/mockData";
import { lineValue, pairsOf, productById, removeLine, type Cart } from "../data/cartStore";
import { productDisplayName } from "../data/radar";
import { useShop } from "../lib/shop";
import { ProductThumb, sizeRange } from "./CartParts";

// Linha do pedido, usada pelas páginas do carrinho do lojista e do representante: produto,
// quantidade e faixa de numeração (abre a grade por número), valor e, quando editável, as ações.

export function LineItem({ cart, productId, sizes, editable }: {
  cart: Cart; productId: string; sizes: Record<string, number>; editable: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { openGrade, role } = useShop();
  const p = productById(productId);
  if (!p) return null;
  const n = pairsOf(sizes);
  const value = lineValue({ productId, sizes });
  return (
    <Paper withBorder px="md" py="sm">
      <Group align="flex-start" gap="sm" wrap="nowrap">
        <ProductThumb src={p.image} alt={p.name} size={44} />
        <Box miw={0} flex={1}>
          <Text fw={600} size="sm">{productDisplayName(p)}</Text>
          <UnstyledButton onClick={() => setOpen(o => !o)} mt={2} aria-expanded={open} aria-label={`${open ? 'Ocultar' : 'Ver'} numeração de ${p.name}`}>
            <Group gap={4} wrap="nowrap">
              <Text fz={12} ff="monospace" c="dimmed">qtd {n} · grade {sizeRange(sizes)}</Text>
              {open ? <CaretUpIcon size={12} /> : <CaretDownIcon size={12} />}
            </Group>
          </UnstyledButton>
        </Box>
        <Stack gap={2} align="flex-end" flex="none">
          <Text className="mono" size="sm" fw={600}>{formatCurrency(value)}</Text>
          {editable && (
            <Group gap="sm">
              <Anchor component="button" type="button" size="xs" onClick={() => openGrade({ productId, mode: 'edit', cartId: cart.id, initial: sizes })}>
                Editar grade
              </Anchor>
              <Anchor component="button" type="button" size="xs" c="red.7" onClick={() => removeLine(cart.id, productId, role)} aria-label={`Remover ${p.name} do carrinho`}>
                Remover
              </Anchor>
            </Group>
          )}
        </Stack>
      </Group>
      <Collapse in={open}>
        <Group gap="xs" mt="sm">
          {Object.entries(sizes).sort(([x], [y]) => Number(x) - Number(y)).map(([sz, q]) => (
            <Paper key={sz} withBorder px="xs" py={2} bg="var(--mantine-color-default-hover)">
              <Text size="xs"><Text span c="dimmed" inherit>Nº {sz}</Text> · <Text span fw={600} className="mono" inherit>{q}</Text></Text>
            </Paper>
          ))}
        </Group>
      </Collapse>
    </Paper>
  );
}
