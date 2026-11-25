import { useEffect, useMemo, useState } from "react";
import { ActionIcon, Anchor, Box, Button, Drawer, Group, Paper, Progress, Stack, Text, Title, Tooltip } from "@mantine/core";
import { MinusIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { formatCurrency } from "../data/mockData";
import { CART_PARAMS, lineValue, pairsOf, productById, replaceLines, type Cart, type CartLine } from "../data/cartStore";
import { cartMarginPct, drawerSuggestions, mixFitPct, pairsText, productDisplayName, suggestedGrade, useRadar } from "../data/radar";
import { toast } from "../lib/toast";
import { useShop } from "../lib/shop";
import { Eyebrow, ProductThumb, resizeGrade } from "./CartParts";
import { GradeTableModal, type GradeTableItem } from "./GradeTableModal";

// Gaveta "Seu pedido": edita o pedido inteiro num rascunho local — quantidades, grades por
// numeração, remover e completar o mix — e só grava no carrinho em "Salvar alterações".

export function CartEditDrawer({ cart, opened, onClose }: { cart: Cart; opened: boolean; onClose: () => void }) {
  const radar = useRadar();
  const { role } = useShop();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [gradeItems, setGradeItems] = useState<GradeTableItem[] | null>(null);

  useEffect(() => {
    if (opened) setLines(cart.lines.map(l => ({ ...l, sizes: { ...l.sizes } })));
    // abre sempre com o estado salvo do carrinho
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened]);

  const pairs = lines.reduce((a, l) => a + pairsOf(l.sizes), 0);
  const value = lines.reduce((a, l) => a + lineValue(l), 0);
  const margin = cartMarginPct(lines);
  const mixFit = mixFitPct(lines);
  const minReached = pairs >= CART_PARAMS.minOrderPairs || !!cart.exception;
  const shippingGap = CART_PARAMS.freeShippingFrom - value;
  const suggestions = useMemo(() => drawerSuggestions({ ...cart, lines }, radar), [cart, lines, radar]);
  const dirty = JSON.stringify(lines) !== JSON.stringify(cart.lines);

  const setSizes = (productId: string, sizes: Record<string, number>) =>
    setLines(ls => (ls.some(l => l.productId === productId)
      ? ls.map(l => (l.productId === productId ? { ...l, sizes } : l))
      : [...ls, { productId, sizes }]));
  const step = (l: CartLine, delta: number) => {
    const p = productById(l.productId);
    if (!p) return;
    const next = resizeGrade(p, l.sizes, pairsOf(l.sizes) + delta);
    if (pairsOf(next) === pairsOf(l.sizes) && delta > 0) {
      toast.error('Sem disponibilidade', `Não há mais pares disponíveis de ${productDisplayName(p)} nesta grade.`);
      return;
    }
    setSizes(l.productId, next);
  };
  const remove = (productId: string) => setLines(ls => ls.filter(l => l.productId !== productId));
  const openGrades = (items: CartLine[]) =>
    setGradeItems(items.flatMap(l => { const p = productById(l.productId); return p ? [{ product: p, sizes: l.sizes }] : []; }));
  const save = () => {
    replaceLines(cart.id, lines, role);
    toast.success('Pedido atualizado', `${cart.cartName}: ${pairsText(pairs)} · ${formatCurrency(value)}.`);
    onClose();
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={400}
      withCloseButton={false}
      padding={0}
      styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column' } }}
      aria-label={`Editar pedido ${cart.cartName}`}
    >
      {/* Cabeçalho: o pedido em números */}
      <Group justify="space-between" align="flex-start" wrap="nowrap" px="lg" pt="lg" pb="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Box>
          <Eyebrow>{role === 'rep' ? `Pedido de ${cart.clientName}` : 'Seu pedido'}</Eyebrow>
          <Title order={2} fz={26} mt={4}>{pairsText(pairs)}</Title>
          <Text size="sm" ff="monospace" c="dimmed" mt={2}>{formatCurrency(value)}{margin !== null ? ` · margem ${margin}%` : ''}</Text>
        </Box>
        <ActionIcon variant="default" radius="xl" size="lg" onClick={onClose} aria-label="Fechar">
          <XIcon size={16} />
        </ActionIcon>
      </Group>

      <Stack gap="md" px="lg" py="md" flex={1} style={{ overflowY: 'auto' }}>
        {/* Contexto da edição, grade mínima e mix */}
        <Stack gap="xs">
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm" c="dimmed" truncate>Editando <Text span fw={600} c="var(--mantine-color-text)" inherit>Pedido</Text> · {cart.cartName}</Text>
            <Anchor component="button" type="button" size="sm" fw={600} c="red.7" onClick={onClose} flex="none">Cancelar edição</Anchor>
          </Group>
          <Box>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Grade mínima do pedido</Text>
              <Text size="sm" fw={700} ff="monospace" c={minReached ? 'teal.7' : 'yellow.8'}>{pairs}/{CART_PARAMS.minOrderPairs} pares</Text>
            </Group>
            <Progress mt={6} size="sm" value={Math.min(100, (pairs / CART_PARAMS.minOrderPairs) * 100)} color={minReached ? 'teal' : 'yellow'} aria-label="Progresso da grade mínima" />
          </Box>
          {mixFit !== null && (
            <Box>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">{role === 'rep' ? 'Mix ideal pro perfil da loja' : 'Mix ideal pro seu perfil'}</Text>
                <Text size="sm" ff="monospace" c="dimmed">{mixFit}%</Text>
              </Group>
              <Progress mt={6} size="sm" value={mixFit} color="brand" aria-label="Aderência ao mix ideal" />
            </Box>
          )}
          {lines.length > 1 && (
            <Anchor component="button" type="button" size="sm" fw={600} ta="right" onClick={() => openGrades(lines)}>Editar grades de todos</Anchor>
          )}
        </Stack>

        {/* Itens do pedido */}
        {lines.length === 0 ? (
          <Paper withBorder p="md"><Text size="sm" c="dimmed">Nenhum item no pedido. Use as sugestões abaixo ou o Catálogo.</Text></Paper>
        ) : (
          <Stack gap="xs">
            {lines.map(l => {
              const p = productById(l.productId);
              if (!p) return null;
              const n = pairsOf(l.sizes);
              return (
                <Paper key={l.productId} withBorder p="sm" bg="var(--mantine-color-default-hover)">
                  <Group gap="sm" wrap="nowrap" align="center">
                    <ProductThumb src={p.image} alt={p.name} size={44} />
                    <Box miw={0} flex={1}>
                      <Text size="sm" fw={600} truncate>{productDisplayName(p)}</Text>
                      <Text size="xs" ff="monospace" c="dimmed">{formatCurrency(lineValue(l))}</Text>
                      <Anchor component="button" type="button" size="xs" fw={600} ff="monospace" ta="left" onClick={() => openGrades([l])}>Definir grade por numeração</Anchor>
                    </Box>
                    <Group gap={6} wrap="nowrap" flex="none">
                      <ActionIcon variant="default" size="sm" onClick={() => step(l, -1)} disabled={n <= 1} aria-label={`Menos um par de ${p.name}`}><MinusIcon size={12} /></ActionIcon>
                      <Text size="sm" ff="monospace" w={28} ta="center" aria-live="polite">{n}</Text>
                      <ActionIcon variant="default" size="sm" onClick={() => step(l, 1)} aria-label={`Mais um par de ${p.name}`}><PlusIcon size={12} /></ActionIcon>
                      <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => remove(l.productId)} aria-label={`Remover ${p.name} do pedido`}><XIcon size={14} /></ActionIcon>
                    </Group>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        )}

        {lines.length > 0 && (
          <Paper withBorder px="md" py="sm">
            <Text size="sm">
              {shippingGap > 0
                ? <>{role === 'rep' ? 'A loja está a' : 'Você está a'} <Text span fw={700} inherit>{formatCurrency(shippingGap)}</Text> de ganhar frete grátis</>
                : <>Frete grátis neste pedido (a partir de {formatCurrency(CART_PARAMS.freeShippingFrom)})</>}
            </Text>
          </Paper>
        )}

        {suggestions.length > 0 && (
          <Box>
            <Eyebrow mb="xs">Sugestões pra completar o mix</Eyebrow>
            <Stack gap="xs">
              {suggestions.map(({ product, reason }) => (
                <Paper key={product.id} withBorder p="sm">
                  <Group gap="sm" wrap="nowrap">
                    <ProductThumb src={product.image} alt="" size={44} />
                    <Box flex={1} miw={0}>
                      <Text size="sm" fw={600} truncate>{productDisplayName(product)}</Text>
                      <Text size="xs" c="dimmed" lineClamp={2}>{reason}</Text>
                    </Box>
                    {/* "+" abre a grade preenchida, nunca adiciona direto (FR-407) */}
                    <Tooltip label="Escolher numeração">
                      <ActionIcon
                        variant="default"
                        radius="xl"
                        onClick={() => setGradeItems([{ product, sizes: suggestedGrade(product, radar)?.sizes ?? {} }])}
                        aria-label={`Adicionar ${productDisplayName(product)} pela grade`}
                      >
                        <PlusIcon size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>

      <Box px="lg" py="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Button fullWidth size="lg" disabled={!dirty} onClick={save}>Salvar alterações</Button>
      </Box>

      <GradeTableModal
        opened={!!gradeItems}
        items={gradeItems ?? []}
        onClose={() => setGradeItems(null)}
        onSave={next => Object.entries(next).forEach(([id, sizes]) => (pairsOf(sizes) > 0 ? setSizes(id, sizes) : remove(id)))}
      />
    </Drawer>
  );
}
