import { ActionIcon, Badge, Box, Button, Drawer, Group, Image, Paper, Progress, Stack, Text, Title, Tooltip } from "@mantine/core";
import { ArrowRightIcon, PlusIcon, ShoppingCartIcon } from "@phosphor-icons/react";
import { formatCurrency } from "../data/mockData";
import {
  CART_PARAMS, cartPairs, cartStatus, cartValue, isOpen, resolveTargetCart, statusColor, statusLabel, useCartStore,
} from "../data/cartStore";
import { cartMarginPct, drawerSuggestions, mixCheck, pairsText, productDisplayName, useRadar } from "../data/radar";
import { useShop } from "../lib/shop";
import { TargetCartPicker } from "./SizeGrade";

// Gaveta do carrinho (M4): visão rápida do carrinho de destino a partir de qualquer tela,
// com os totais reais, a grade mínima e sugestões para completar o mix.
export function CartDrawer({ opened, onClose, onViewCarts }: { opened: boolean; onClose: () => void; onViewCarts: () => void }) {
  const { carts } = useCartStore();
  const radar = useRadar();
  const { role, clientId, openGrade, openCart } = useShop();
  const cart = clientId ? resolveTargetCart(clientId, role) : null;
  const openCount = carts.filter(c => c.clientId === clientId && isOpen(c)).length;
  const pairs = cart ? cartPairs(cart) : 0;
  const value = cart ? cartValue(cart) : 0;
  const margin = cart ? cartMarginPct(cart.lines) : null;
  const hasItems = !!cart && cart.lines.length > 0;
  const mix = cart && hasItems ? mixCheck(cart, radar) : [];
  const suggestions = drawerSuggestions(cart, radar);
  const shippingGap = CART_PARAMS.freeShippingFrom - value;

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={420}
      title={<Group gap="xs"><ShoppingCartIcon size={20} /><Text fw={600}>Carrinho</Text><Text c="dimmed" size="sm">· {openCount} {openCount === 1 ? 'aberto' : 'abertos'}</Text></Group>}
    >
      <Stack gap="md">
        <TargetCartPicker cart={cart} clientId={clientId} />

        {cart ? (
          <Paper withBorder p="md">
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Box miw={0}>
                <Title order={3} fz="lg">{cart.cartName}</Title>
                <Badge mt={4} variant="light" color={statusColor[cartStatus(cart)]}>{statusLabel(cartStatus(cart), cart.rep)}</Badge>
              </Box>
              <Text className="mono" fw={700}>{formatCurrency(value)}</Text>
            </Group>
            {/* Totais reais do carrinho de destino (FR-402); margem some com 0 itens (BR-06) */}
            <Group gap="lg" mt="sm">
              <Box><Text size="sm" c="dimmed">Pares</Text><Text fw={700} className="mono">{pairs}</Text></Box>
              {margin !== null && <Box><Text size="sm" c="dimmed">Margem no PDV sugerido</Text><Text fw={700} className="mono">{margin}%</Text></Box>}
            </Group>
            {/* Grade mínima (FR-404): passado o mínimo a barra fica cheia e o rótulo mostra o real */}
            <Box mt="sm">
              <Group justify="space-between">
                <Text size="sm">Grade mínima</Text>
                <Text size="sm" className="mono">{pairs >= CART_PARAMS.minOrderPairs ? `${pairs} pares · mínimo ${CART_PARAMS.minOrderPairs}` : `${pairs}/${CART_PARAMS.minOrderPairs} pares`}</Text>
              </Group>
              <Progress mt={4} value={Math.min(100, (pairs / CART_PARAMS.minOrderPairs) * 100)} color={pairs >= CART_PARAMS.minOrderPairs ? 'teal' : 'yellow'} aria-label="Progresso da grade mínima" />
            </Box>
            {/* Mix e frete só com itens e com a base escrita (FR-405) */}
            {hasItems && (
              <Stack gap={4} mt="sm">
                {mix.length === 0
                  ? <Text size="sm" c="dimmed">Mix dentro do ideal para o perfil da sua loja.</Text>
                  : mix.map(m => <Text key={m.segment} size="sm" c="yellow.8">{m.segment}: {m.share}% dos pares (ideal pro seu perfil: {m.target}%)</Text>)}
                <Text size="sm" c="dimmed">
                  {shippingGap > 0
                    ? `Faltam ${formatCurrency(shippingGap)} para frete grátis (a partir de ${formatCurrency(CART_PARAMS.freeShippingFrom)} por carrinho)`
                    : `Frete grátis neste carrinho (a partir de ${formatCurrency(CART_PARAMS.freeShippingFrom)})`}
                </Text>
              </Stack>
            )}
          </Paper>
        ) : (
          <Paper withBorder p="md">
            <Text fw={600}>Nenhum carrinho aceitando itens</Text>
            <Text size="sm" c="dimmed">O próximo produto adicionado cria um carrinho novo.</Text>
          </Paper>
        )}

        {suggestions.length > 0 && (
          <Box>
            <Text fw={600} mb="xs">Sugestões do Radar para completar</Text>
            <Stack gap="xs">
              {suggestions.map(({ product, reason }) => (
                <Paper key={product.id} withBorder p="xs">
                  <Group gap="sm" wrap="nowrap">
                    <Image src={product.image} alt="" w={48} h={48} fit="contain" bg="white" radius="sm" />
                    <Box flex={1} miw={0}>
                      <Text size="sm" fw={600} truncate>{productDisplayName(product)}</Text>
                      <Text size="xs" c="dimmed" lineClamp={2}>{reason}</Text>
                    </Box>
                    {/* "+" abre a grade preenchida, nunca adiciona direto (FR-407) */}
                    <Tooltip label="Escolher numeração">
                      <ActionIcon variant="default" onClick={() => openGrade({ productId: product.id })} aria-label={`Adicionar ${productDisplayName(product)} pela grade`}>
                        <PlusIcon size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        <Group grow>
          <Button variant="default" onClick={onViewCarts}>Meus carrinhos</Button>
          <Button disabled={!cart} onClick={() => cart && openCart(cart.id)} rightSection={<ArrowRightIcon size={16} />}>Ver carrinho</Button>
        </Group>
        {cart && pairs > 0 && <Text size="sm" c="dimmed" ta="center">{pairsText(pairs)} · {CART_PARAMS.leadTimeLabel}</Text>}
      </Stack>
    </Drawer>
  );
}
