import { Stack, Group, Box, Paper, Text, Button, Badge, Image, ThemeIcon, Grid, Anchor } from "@mantine/core";
import { toast } from "../lib/toast";
import classes from "./OrderDetailPage.module.css";
import { CaretLeftIcon, DownloadSimpleIcon, ArrowRightIcon, PackageIcon } from "@phosphor-icons/react";
import { products, clients, formatCurrency, type Order, type Product } from "../data/mockData";
import { OrderStatusBadge, statusSupportText, orderProductNames } from "./OrderHistory";

type View = 'history' | 'boletos';

type Profile = 'admin' | 'rep' | 'lojista';

interface OrderDetailPageProps {
  order: Order | null;
  onNavigate: (view: View) => void;
  profile: Profile;
}

const clientStatusColors: Record<string, string> = {
  'ativo': 'teal',
  'inativo': 'red',
};

const badgeStyles = { label: { textTransform: 'none' as const } };

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text c="dimmed" size="0.7rem" fw={600} tt="uppercase" mb="sm" style={{ letterSpacing: '0.04em' }}>
      {children}
    </Text>
  );
}

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

export function OrderDetailPage({ order, onNavigate, profile }: OrderDetailPageProps) {
  if (!order) {
    return (
      <Box p="lg" maw={1000} mx="auto" w="100%">
        <Paper withBorder radius="lg" py={64}>
          <Stack align="center" gap={4}>
            <ThemeIcon variant="light" color="neutral" size={48} radius="xl" mb={8}>
              <PackageIcon size={24} />
            </ThemeIcon>
            <Text fw={600}>Nenhum pedido selecionado</Text>
            <Button
              onClick={() => onNavigate('history')}
              variant="default"
              size="xs"
              mt="sm"
              leftSection={<CaretLeftIcon size={14} />}
            >
              Voltar para Pedidos
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  const support = statusSupportText(order);
  const productName = orderProductNames[order.id] ?? order.collection;
  const lineItems = getOrderLineItems(order);
  const client = clients.find(c => c.id === order.clientId);

  return (
    <Stack gap="lg" p="lg" maw={1000} mx="auto" w="100%">
      <Box>
        <Button
          onClick={() => onNavigate('history')}
          variant="subtle"
          color="gray"
          size="compact-sm"
          px={4}
          leftSection={<CaretLeftIcon size={16} />}
        >
          Voltar para Pedidos
        </Button>
      </Box>

      {/* Cliente — admin/rep only */}
      {profile !== 'lojista' && client && (
        <Paper withBorder radius="lg" p="md">
          <SectionTitle>Cliente</SectionTitle>
          <Group gap={8} mb={6}>
            <Text size="0.95rem" fw={700}>{client.name}</Text>
            <Badge size="sm" variant="light" color={clientStatusColors[client.status]} styles={badgeStyles}>
              {client.status}
            </Badge>
            {client.inadimplente && (
              <Badge size="sm" variant="light" color="yellow" styles={badgeStyles}>inadimplente</Badge>
            )}
          </Group>
          <Text c="dimmed" size="0.8rem" mb={2}>{client.cnpj}</Text>
          <Text c="dimmed" size="0.8rem">{client.city} / {client.state}</Text>
        </Paper>
      )}

      {/* Produtos */}
      <Paper withBorder radius="lg" p="md">
        <SectionTitle>Produtos</SectionTitle>
        <Stack gap="sm">
          {lineItems.length > 0 ? (
            lineItems.map(({ product, quantity }) => (
              <Group key={product.id} gap="sm" wrap="nowrap">
                <Image
                  src={product.image}
                  alt={product.name}
                  w={48}
                  h={48}
                  radius="md"
                  fit="cover"
                  style={{ border: '1px solid var(--mantine-color-default-border)', flexShrink: 0 }}
                />
                <Box miw={0} style={{ flex: 1 }}>
                  <Text size="0.85rem" fw={600} truncate>{product.name}</Text>
                  <Text c="dimmed" size="0.72rem">Ref. {product.reference}</Text>
                </Box>
                <Text size="0.85rem" fw={600} style={{ flexShrink: 0 }}>{quantity} pares</Text>
              </Group>
            ))
          ) : (
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon variant="default" size={48} radius="md">
                <PackageIcon size={20} style={{ color: 'var(--mantine-color-dimmed)' }} />
              </ThemeIcon>
              <Box miw={0} style={{ flex: 1 }}>
                <Text size="0.85rem" fw={600} truncate>{productName}</Text>
                <Text c="dimmed" size="0.72rem">{order.collection}</Text>
              </Box>
              <Text size="0.85rem" fw={600} style={{ flexShrink: 0 }}>{order.items} pares</Text>
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Detalhes do pedido */}
      <Paper withBorder radius="lg" p="md">
        <SectionTitle>Detalhes do pedido</SectionTitle>
        {/* colunas na proporção 1.6 / 1 / 1 (8/5/5 de 18) */}
        <Grid columns={18} gutter={{ base: 'md', sm: 'xl' }}>
          {/* column 1: status + order id/name */}
          <Grid.Col span={{ base: 18, sm: 8 }} miw={0}>
            <Group gap={8} mb={4}>
              <OrderStatusBadge status={order.status} />
              <Text c="dimmed" size="0.72rem" style={{ flexShrink: 0 }}>{support}</Text>
            </Group>
            <Text size="0.85rem" fw={600}>
              <Text span inherit className="mono">{order.id}</Text> — {productName}
            </Text>
            <Text c="dimmed" size="0.72rem" mt={2}>Representante: {order.rep}</Text>
          </Grid.Col>

          {/* column 2: value + payment + link to Pagamentos e Boletos */}
          <Grid.Col span={{ base: 18, sm: 5 }} miw={0} className={classes.divided}>
            <Text className="mono" size="1.05rem" fw={700}>{formatCurrency(order.total)}</Text>
            <Text c="dimmed" size="0.8rem" mb={6}>{order.paymentCondition}</Text>
            {profile !== 'rep' && (
              <Anchor component="button" onClick={() => onNavigate('boletos')} c="neutral" size="0.78rem" fw={600}>
                <Group gap={4} component="span">
                  Ver em Pagamentos e Boletos <ArrowRightIcon size={14} />
                </Group>
              </Anchor>
            )}
          </Grid.Col>

          {/* column 3: NF de compra */}
          <Grid.Col span={{ base: 18, sm: 5 }} miw={0} className={classes.divided}>
            <Text c="dimmed" size="0.68rem" fw={600} tt="uppercase" mb={6} style={{ letterSpacing: '0.04em' }}>
              NF de compra
            </Text>
            {order.status === 'faturado' || order.status === 'entregue' ? (
              <Button
                onClick={() => toast.success('Nota fiscal baixada')}
                variant="default"
                size="xs"
                leftSection={<DownloadSimpleIcon size={14} />}
              >
                Baixar NF
              </Button>
            ) : (
              <Text c="dimmed" size="0.8rem">NF indisponível</Text>
            )}
          </Grid.Col>
        </Grid>
      </Paper>
    </Stack>
  );
}
