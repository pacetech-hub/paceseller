import { ActionIcon, Box, Button, Drawer, Group, Paper, Progress, Stack, Text, Title, Tooltip } from "@mantine/core";
import { ArrowRightIcon, PlusIcon, StorefrontIcon, XIcon } from "@phosphor-icons/react";
import { formatCurrency } from "../data/mockData";
import { CART_PARAMS, cartPairs, cartValue, lineValue, pairsOf, productById, resolveTargetCart, useCartStore } from "../data/cartStore";
import { cartMarginPct, drawerSuggestions, mixFitPct, pairsText, productDisplayName, useRadar } from "../data/radar";
import { useShop } from "../lib/shop";
import { Eyebrow, ProductThumb } from "./CartParts";
import { TargetCartPicker } from "./SizeGrade";

// Gaveta "Seu pedido" do representante: o carrinho de destino da loja em atendimento, a partir do
// catálogo ou de qualquer página de compra — para onde vão os produtos, grade mínima, mix ideal,
// frete e sugestões para completar. Os "+" abrem a grade, nunca adicionam direto (FR-407).

interface RepCartDrawerProps {
  opened: boolean;
  onClose: () => void;
  storeName: string | null;
  onChooseStore: () => void;
  onViewCarts: () => void;
}

export function RepCartDrawer({ opened, onClose, storeName, onChooseStore, onViewCarts }: RepCartDrawerProps) {
  useCartStore(); // re-renderiza quando o "trocar" muda o destino ou o carrinho muda
  const radar = useRadar();
  const { role, clientId, openGrade, openCart } = useShop();
  const cart = clientId ? resolveTargetCart(clientId, role) : null;
  const lines = cart?.lines ?? [];
  const pairs = cart ? cartPairs(cart) : 0;
  const value = cart ? cartValue(cart) : 0;
  const margin = cartMarginPct(lines);
  const mixFit = mixFitPct(lines);
  const missing = Math.max(0, CART_PARAMS.minOrderPairs - pairs);
  const minReached = missing === 0 || !!cart?.exception;
  const shippingGap = CART_PARAMS.freeShippingFrom - value;
  const suggestions = clientId ? drawerSuggestions(cart, radar) : [];

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={400}
      withCloseButton={false}
      padding={0}
      styles={{ body: { height: '100%', display: 'flex', flexDirection: 'column' } }}
      aria-label="Seu pedido"
    >
      {/* Cabeçalho: o pedido em números */}
      <Group justify="space-between" align="flex-start" wrap="nowrap" px="lg" pt="lg" pb="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Box miw={0}>
          <Eyebrow truncate>{storeName ? `Pedido de ${storeName}` : 'Seu pedido'}</Eyebrow>
          <Title order={2} fz={26} mt={4}>{lines.length} {lines.length === 1 ? 'item' : 'itens'}</Title>
          <Text size="sm" ff="monospace" c="dimmed" mt={2}>
            {formatCurrency(value)}{margin !== null ? ` · margem ${margin}%` : ''}
          </Text>
        </Box>
        <ActionIcon variant="default" radius="xl" size="lg" onClick={onClose} aria-label="Fechar">
          <XIcon size={16} />
        </ActionIcon>
      </Group>

      {!clientId ? (
        <Stack gap="sm" px="lg" py="xl" align="center" flex={1}>
          <StorefrontIcon size={32} color="var(--mantine-color-dimmed)" />
          <Text fw={600} ta="center">Escolha a loja que você está atendendo</Text>
          <Text size="sm" c="dimmed" ta="center">O pedido, a grade mínima e as sugestões são sempre de uma loja.</Text>
          <Button variant="default" onClick={() => { onClose(); onChooseStore(); }}>Escolher loja</Button>
        </Stack>
      ) : (
        <Stack gap="md" px="lg" py="md" flex={1} style={{ overflowY: 'auto' }}>
          {/* Destino, grade mínima e mix */}
          <Stack gap="xs">
            <TargetCartPicker cart={cart} clientId={clientId} />
            <Box>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Grade mínima do pedido</Text>
                <Text size="sm" fw={600} ff="monospace" c={minReached ? 'teal.7' : 'red.7'}>{pairs}/{CART_PARAMS.minOrderPairs} pares</Text>
              </Group>
              <Progress mt={6} size="sm" value={Math.min(100, (pairs / CART_PARAMS.minOrderPairs) * 100)} color={minReached ? 'teal' : 'red'} aria-label="Progresso da grade mínima" />
              {!minReached && <Text size="xs" c="red.7" mt={6}>Faltam {missing} pares pra fechar o pedido</Text>}
            </Box>
            {mixFit !== null && (
              <Box>
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Mix ideal pro perfil da loja</Text>
                  <Text size="sm" ff="monospace" c="dimmed">{mixFit}%</Text>
                </Group>
                <Progress mt={6} size="sm" value={mixFit} color="brand" aria-label="Aderência ao mix ideal" />
              </Box>
            )}
          </Stack>

          {/* Itens já no carrinho de destino */}
          {lines.length > 0 && (
            <Stack gap="xs">
              {lines.map(l => {
                const p = productById(l.productId);
                if (!p) return null;
                return (
                  <Paper key={l.productId} withBorder p="sm" bg="var(--mantine-color-default-hover)">
                    <Group gap="sm" wrap="nowrap">
                      <ProductThumb src={p.image} alt={p.name} size={40} />
                      <Box miw={0} flex={1}>
                        <Text size="sm" fw={600} truncate>{productDisplayName(p)}</Text>
                        <Text size="xs" ff="monospace" c="dimmed">{pairsText(pairsOf(l.sizes))} · {formatCurrency(lineValue(l))}</Text>
                      </Box>
                      {cart && (
                        <Button size="compact-xs" variant="subtle" onClick={() => openGrade({ productId: l.productId, mode: 'edit', cartId: cart.id, initial: l.sizes })}>
                          Grade
                        </Button>
                      )}
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          )}

          <Paper withBorder px="md" py="sm">
            <Text size="sm">
              {shippingGap > 0
                ? <>A loja está a <Text span fw={600} inherit>{formatCurrency(shippingGap)}</Text> de ganhar frete grátis</>
                : <>Frete grátis neste pedido (a partir de {formatCurrency(CART_PARAMS.freeShippingFrom)})</>}
            </Text>
          </Paper>

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
                      <Tooltip label="Escolher numeração">
                        <ActionIcon variant="default" radius="xl" onClick={() => openGrade({ productId: product.id, cartId: cart?.id })} aria-label={`Adicionar ${productDisplayName(product)} pela grade`}>
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
      )}

      {clientId && (
        <Stack gap="xs" px="lg" py="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
          <Button fullWidth size="lg" disabled={!cart} onClick={() => cart && openCart(cart.id)} rightSection={<ArrowRightIcon size={16} />}>
            Ver carrinho
          </Button>
          <Button fullWidth variant="subtle" onClick={() => { onClose(); onViewCarts(); }}>Todos os carrinhos da loja</Button>
        </Stack>
      )}
    </Drawer>
  );
}
