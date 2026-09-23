import { toast } from "@/lib/toast";
import { Anchor, Badge, Box, Button, Center, Group, Paper, Stack, Text, UnstyledButton } from "@mantine/core";
import { ChevronLeft, Download, ArrowRight, Package2 } from "lucide-react";
import { products, clients, formatCurrency, type Order, type Product } from "../data/mockData";
import { statusColors, statusIcon, statusSupportText, orderProductNames } from "./OrderHistory";
import classes from "./OrderDetailPage.module.css";

type View = 'history' | 'boletos';

type Profile = 'admin' | 'rep' | 'lojista';

interface OrderDetailPageProps {
  order: Order | null;
  onNavigate: (view: View) => void;
  profile: Profile;
}

// cor Mantine do badge de status do cliente
const clientStatusColors: Record<string, string> = {
  'ativo': 'teal',
  'inativo': 'red',
};

// deterministic line-item breakdown per order — quantities sum to order.items
const orderLineItems: Record<string, Array<{ productId: string; quantity: number }>> = {
  'PED-2026-0412': [{ productId: 'P001', quantity: 70 }, { productId: 'P005', quantity: 54 }],
  'PED-2026-0411': [{ productId: 'P003', quantity: 40 }, { productId: 'P004', quantity: 46 }],
  'PED-2026-0410': [{ productId: 'P002', quantity: 90 }, { productId: 'P006', quantity: 78 }],
  'PED-2026-0409': [{ productId: 'P007', quantity: 72 }],
  'PED-2026-0408': [{ productId: 'P008', quantity: 48 }],
  'PED-2026-0407': [{ productId: 'P001', quantity: 120 }, { productId: 'P002', quantity: 90 }],
  'PED-2026-0406': [{ productId: 'P005', quantity: 108 }],
  'PED-2026-0405': [{ productId: 'P006', quantity: 64 }],
};

function getOrderLineItems(order: Order): Array<{ product: Product; quantity: number }> {
  const entries = orderLineItems[order.id];
  if (!entries) return [];
  return entries
    .map(entry => {
      const product = products.find(p => p.id === entry.productId);
      return product ? { product, quantity: entry.quantity } : null;
    })
    .filter((v): v is { product: Product; quantity: number } => v !== null);
}

const sectionLabel = {
  c: 'dimmed',
  mb: 'sm',
  size: '0.7rem',
  fw: 600,
  tt: 'uppercase' as const,
  lts: '0.04em',
};

const pillBadge = {
  variant: 'light' as const,
  radius: 'xl' as const,
  tt: 'none' as const,
  h: 'auto',
  px: 8,
  py: 2,
  fz: '0.7rem',
  fw: 600,
};

export function OrderDetailPage({ order, onNavigate, profile }: OrderDetailPageProps) {
  if (!order) {
    return (
      <Box p="lg" maw={1000} mx="auto" w="100%">
        <Paper withBorder radius="lg" py={64} ta="center">
          <Stack gap={0} align="center" justify="center">
            <Package2 size={40} color="var(--mantine-color-gray-4)" style={{ marginBottom: 12 }} />
            <Text fw={600}>Nenhum pedido selecionado</Text>
            <Button
              onClick={() => onNavigate('history')}
              mt="sm"
              variant="default"
              size="xs"
              px="sm"
              fz="0.78rem"
              fw={500}
              leftSection={<ChevronLeft size={14} />}
              styles={{ section: { marginInlineEnd: 6 } }}
            >
              Voltar para Pedidos
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  const StatusIcon = statusIcon[order.status];
  const support = statusSupportText(order);
  const productName = orderProductNames[order.id] ?? order.collection;
  const lineItems = getOrderLineItems(order);
  const client = clients.find(c => c.id === order.clientId);

  return (
    <Stack gap={20} p="lg" maw={1000} mx="auto" w="100%">
      <Box>
        <UnstyledButton onClick={() => onNavigate('history')} className={classes.backLink}>
          <ChevronLeft size={16} /> Voltar para Pedidos
        </UnstyledButton>
      </Box>

      {/* Cliente — admin/rep only */}
      {profile !== 'lojista' && client && (
        <Paper withBorder radius="lg" p="md">
          <Text {...sectionLabel}>
            Cliente
          </Text>
          <Group gap={8} mb={6}>
            <Text size="0.95rem" fw={700}>{client.name}</Text>
            <Badge {...pillBadge} color={clientStatusColors[client.status]}>
              {client.status}
            </Badge>
            {client.inadimplente && (
              <Badge {...pillBadge} color="yellow">
                inadimplente
              </Badge>
            )}
          </Group>
          <Text c="dimmed" mb={2} size="0.8rem">{client.cnpj}</Text>
          <Text c="dimmed" size="0.8rem">{client.city} / {client.state}</Text>
        </Paper>
      )}

      {/* Produtos */}
      <Paper withBorder radius="lg" p="md">
        <Text {...sectionLabel}>
          Produtos
        </Text>
        <Stack gap="sm">
          {lineItems.length > 0 ? (
            lineItems.map(({ product, quantity }) => (
              <Group key={product.id} gap="sm" wrap="nowrap">
                <img
                  src={product.image}
                  alt={product.name}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--mantine-radius-md)',
                    objectFit: 'cover',
                    border: '1px solid var(--mantine-color-gray-3)',
                    flexShrink: 0,
                  }}
                />
                <Box miw={0} flex={1}>
                  <Text truncate size="0.85rem" fw={600}>{product.name}</Text>
                  <Text c="dimmed" size="0.72rem">Ref. {product.reference}</Text>
                </Box>
                <Text size="0.85rem" fw={600} style={{ flexShrink: 0 }}>{quantity} pares</Text>
              </Group>
            ))
          ) : (
            <Group gap="sm" wrap="nowrap">
              <Center
                w={48}
                h={48}
                bg="gray.1"
                style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-gray-3)', flexShrink: 0 }}
              >
                <Package2 size={20} color="var(--mantine-color-dimmed)" />
              </Center>
              <Box miw={0} flex={1}>
                <Text truncate size="0.85rem" fw={600}>{productName}</Text>
                <Text c="dimmed" size="0.72rem">{order.collection}</Text>
              </Box>
              <Text size="0.85rem" fw={600} style={{ flexShrink: 0 }}>{order.items} pares</Text>
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Detalhes do pedido */}
      <Paper withBorder radius="lg" p="md">
        <Text {...sectionLabel}>
          Detalhes do pedido
        </Text>
        <div className={classes.details}>
          {/* column 1: status + order id/name */}
          <Box miw={0}>
            <Group gap={8} mb={4}>
              <Badge
                {...pillBadge}
                color={statusColors[order.status]}
                leftSection={<StatusIcon size={12} />}
                styles={{ section: { marginInlineEnd: 4 } }}
                style={{ flexShrink: 0 }}
              >
                {order.status}
              </Badge>
              <Text span c="dimmed" size="0.72rem" style={{ flexShrink: 0 }}>{support}</Text>
            </Group>
            <Text size="0.85rem" fw={600}>
              <Text span inherit style={{ fontVariantNumeric: 'tabular-nums' }}>{order.id}</Text> — {productName}
            </Text>
            <Text c="dimmed" mt={2} size="0.72rem">Representante: {order.rep}</Text>
          </Box>

          {/* column 2: value + payment + link to Pagamentos e Boletos */}
          <div className={classes.divided}>
            <Text size="1.05rem" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(order.total)}</Text>
            <Text c="dimmed" mb={6} size="0.8rem">{order.paymentCondition}</Text>
            {profile !== 'rep' && (
              <Anchor
                component="button"
                onClick={() => onNavigate('boletos')}
                c="gray.9"
                underline="hover"
                fz="0.78rem"
                fw={600}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Ver em Pagamentos e Boletos <ArrowRight size={14} />
              </Anchor>
            )}
          </div>

          {/* column 3: NF de compra */}
          <div className={classes.divided}>
            <Text {...sectionLabel} mb={6} size="0.68rem">
              NF de compra
            </Text>
            {order.status === 'faturado' || order.status === 'entregue' ? (
              <Button
                onClick={() => toast.success('Nota fiscal baixada')}
                variant="default"
                size="xs"
                px="sm"
                fz="0.78rem"
                fw={500}
                leftSection={<Download size={14} />}
                styles={{ section: { marginInlineEnd: 6 } }}
              >
                Baixar NF
              </Button>
            ) : (
              <Text c="dimmed" size="0.8rem">NF indisponível</Text>
            )}
          </div>
        </div>
      </Paper>
    </Stack>
  );
}
