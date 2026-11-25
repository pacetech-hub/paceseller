import { useEffect, useRef, useState } from "react";
import { ActionIcon, Anchor, Avatar, Badge, Box, Button, Grid, Group, Paper, Stack, Text, TextInput } from "@mantine/core";
import { PaperPlaneRightIcon, ShoppingCartIcon } from "@phosphor-icons/react";
import { formatCurrency } from "../data/mockData";
import { addComment, cartValue, clientContact, getCart, repProfile, useCartStore, type CartContext, type CartCreator } from "../data/cartStore";
import { Eyebrow, initials, timeAgo } from "./CartParts";
import { EmptyState } from "./ui/EmptyState";
import classes from "./CartPage.module.css";

// "Falar com": a conversa do carrinho numa página própria, dos dois lados — o lojista fala com o
// representante e o representante fala com quem compra pela loja. As mensagens são os comentários
// do carrinho (inclusive as edições do representante, que ficam registradas aqui).

type View = 'radar' | 'carts' | 'cart';

export function CartChatPage({ cartContext, onNavigate, viewerRole = 'lojista', actorName }: {
  cartContext: CartContext | null;
  onNavigate: (view: View) => void;
  viewerRole?: CartCreator;
  /** Quem assina as mensagens do representante (titular ou preposto). */
  actorName?: string;
}) {
  useCartStore(); // re-renderiza a cada mensagem nova
  const cart = getCart(cartContext?.id) ?? null;
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const count = cart?.comments.length ?? 0;
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [count]);

  if (!cart) {
    return (
      <Box p={{ base: 'md', sm: 'lg' }} maw={900} mx="auto" w="100%">
        <EmptyState icon={ShoppingCartIcon} title="Nenhum carrinho aberto" description="A conversa é sempre sobre um carrinho. Escolha um na lista de carrinhos." action={{ label: viewerRole === 'rep' ? 'Ir para Carrinhos' : 'Ir para Meus carrinhos', onClick: () => onNavigate('carts') }} />
      </Box>
    );
  }

  const isRep = viewerRole === 'rep';
  // "other" = com quem se fala: o representante (visto pelo lojista) ou o comprador da loja (visto pelo representante)
  const other = isRep ? clientContact(cart.clientId, cart.clientName) : cart.rep;
  const info = repProfile(cart.rep);
  const send = () => {
    if (!text.trim()) return;
    if (isRep) addComment(cart.id, 'rep', actorName ?? cart.rep, text);
    else addComment(cart.id, 'lojista', 'Você', text);
    setText('');
  };

  return (
    <Box p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      <Group gap={8} component="nav" aria-label="Caminho" mb="lg">
        <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('radar')}>Radar</Anchor>
        <Text size="sm" c="dimmed" aria-hidden>/</Text>
        <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('carts')}>{isRep ? cart.clientName : 'Meus carrinhos'}</Anchor>
        <Text size="sm" c="dimmed" aria-hidden>/</Text>
        <Anchor component="button" type="button" size="sm" onClick={() => onNavigate('cart')}>{cart.cartName}</Anchor>
        <Text size="sm" c="dimmed" aria-hidden>/</Text>
        <Text size="sm" fw={600} aria-current="page">Falar com {other}</Text>
      </Group>

      <Grid gutter={{ base: 'lg', lg: 40 }}>
        <Grid.Col span={{ base: 12, lg: 8, xl: 9 }}>
          <Stack gap="md" mih="calc(100dvh - 220px)">
            {/* Quem está do outro lado */}
            <Group gap="sm" wrap="nowrap" pb="md" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
              <Avatar size={44} radius="xl" color="brand" variant="filled">{initials(other)}</Avatar>
              <Box>
                <Text fw={600}>{other}</Text>
                {isRep ? (
                  <Text size="xs" c="dimmed">Compras · {cart.clientName}</Text>
                ) : (
                  <Group gap={6}>
                    <Box w={8} h={8} bg="teal.6" style={{ borderRadius: '50%' }} aria-hidden />
                    <Text size="xs" c="teal.7">Online agora · representante da sua loja</Text>
                  </Group>
                )}
              </Box>
            </Group>

            {/* Sobre qual pedido é a conversa */}
            <Paper withBorder px="md" py="sm">
              <Eyebrow fz={10}>Conversa sobre</Eyebrow>
              <Text size="sm" fw={600}>{cart.cartName} — Pedido · <Text span className="mono" inherit>{formatCurrency(cartValue(cart))}</Text></Text>
            </Paper>

            {/* Mensagens */}
            <Stack gap="sm" flex={1} py="md" role="log" aria-label={`Conversa com ${other}`} aria-live="polite">
              {cart.comments.length === 0 ? (
                <Text size="sm" c="dimmed" ta="center" mt="xl">Nenhuma mensagem ainda — escreva a primeira.</Text>
              ) : cart.comments.map(cm => {
                const mine = cm.author === viewerRole;
                if (cm.kind === 'system') {
                  return <Text key={cm.id} size="xs" c="dimmed" ta="center">{cm.text} · {timeAgo(cm.at)}</Text>;
                }
                return (
                  <Group key={cm.id} justify={mine ? 'flex-end' : 'flex-start'} align="flex-end" gap="xs" wrap="nowrap">
                    {!mine && <Avatar size={28} radius="xl" color="brand" variant="light">{initials(cm.author === 'lojista' && cm.name === 'Você' ? other : cm.name)}</Avatar>}
                    <Box maw="70%">
                      <Paper
                        px="md"
                        py="xs"
                        withBorder={!mine}
                        bg={mine ? 'var(--mantine-color-brand-9)' : 'var(--mantine-color-body)'}
                        c={mine ? 'white' : undefined}
                      >
                        {cm.kind === 'edit' && <Badge size="xs" variant="light" color="yellow" mb={4}>edição no pedido</Badge>}
                        <Text size="sm" inherit style={{ whiteSpace: 'pre-wrap' }}>{cm.text}</Text>
                      </Paper>
                      <Text size="xs" c="dimmed" ta={mine ? 'right' : 'left'} mt={2}>{mine ? 'Você' : (cm.author === 'lojista' && cm.name === 'Você' ? other : cm.name).split(' ')[0]} · {timeAgo(cm.at)}</Text>
                    </Box>
                  </Group>
                );
              })}
              <div ref={endRef} />
            </Stack>

            {/* Escrever */}
            <Group gap="sm" wrap="nowrap" pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
              <TextInput
                flex={1}
                size="lg"
                placeholder={`Escreva uma mensagem para ${other}...`}
                value={text}
                onChange={e => setText(e.currentTarget.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                maxLength={500}
                aria-label="Nova mensagem"
              />
              <ActionIcon size={42} radius="xl" onClick={send} disabled={!text.trim()} aria-label="Enviar mensagem">
                <PaperPlaneRightIcon size={18} />
              </ActionIcon>
            </Group>
          </Stack>
        </Grid.Col>

        {/* Lateral: com quem é a conversa e o atalho de volta ao carrinho */}
        <Grid.Col span={{ base: 12, lg: 4, xl: 3 }}>
          <Stack gap="md" pl={{ lg: 'lg' }} className={classes.cartAside}>
            <Eyebrow>Sobre {other}</Eyebrow>
            <Group gap="sm" wrap="nowrap">
              <Avatar size={36} radius="xl" color="brand" variant="light">{initials(other)}</Avatar>
              <Box>
                <Text fw={600}>{other}</Text>
                <Text size="xs" c="dimmed">{isRep ? `Compras · ${cart.clientName}` : `Representante desde ${info.since}`}</Text>
              </Box>
            </Group>
            <Paper withBorder p="sm">
              <Text size="sm">
                {isRep
                  ? 'Cada mensagem avisa a loja e fica no histórico do carrinho, junto com as suas edições.'
                  : `Responde normalmente em até ${info.responseHours} ${info.responseHours === 1 ? 'hora' : 'horas'} em dias úteis`}
              </Text>
            </Paper>
            <Button variant="default" fullWidth onClick={() => onNavigate('cart')}>Ver carrinho {cart.cartName}</Button>
          </Stack>
        </Grid.Col>
      </Grid>
    </Box>
  );
}
