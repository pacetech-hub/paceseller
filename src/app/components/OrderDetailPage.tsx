import { Stack, Group, Box, Paper, Text, Title, Button, Badge, Image, ThemeIcon, Grid } from "@mantine/core";
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
    <Title order={2} mb="sm">
      {children}
    </Title>
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
      <Box p={{ base: 'md', sm: 'lg' }} maw={1000} mx="auto" w="100%">
        <Paper withBorder py={64}>
          <Stack align="center" gap={4}>
            <ThemeIcon variant="light" color="neutral" size={48} mb={8}>
              <PackageIcon size={24} />
            </ThemeIcon>
            <Text fw={600}>Nenhum pedido selecionado</Text>
            <Text c="dimmed" ta="center">Escolha um pedido no histórico para ver produtos, pagamento e nota fiscal.</Text>
            <Button
              onClick={() => onNavigate('history')}
              mt="md"
              leftSection={<CaretLeftIcon size={16} />}
            >
              Voltar para pedidos
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
    <Stack gap="lg" p={{ base: 'md', sm: 'lg' }} maw={1000} mx="auto" w="100%">
      <Box>
        <Button
          onClick={() => onNavigate('history')}
          variant="subtle"
          color="gray"
          ml={-12}
          leftSection={<CaretLeftIcon size={16} />}
        >
          Voltar para pedidos
        </Button>
      </Box>

      {/* Cliente — admin/rep only */}
      {profile !== 'lojista' && client && (
        <Paper withBorder p="md">
          <SectionTitle>Cliente</SectionTitle>
          <Group gap={8} mb={6}>
            <Text fw={700}>{client.name}</Text>
            <Badge variant="light" color={clientStatusColors[client.status]} styles={badgeStyles}>
              {client.status}
            </Badge>
            {client.inadimplente && (
              <Badge variant="light" color="yellow" styles={badgeStyles}>inadimplente</Badge>
            )}
          </Group>
          <Text c="dimmed" size="sm" mb={2}>{client.cnpj}</Text>
          <Text c="dimmed" size="sm">{client.city} / {client.state}</Text>
        </Paper>
      )}

      {/* Produtos */}
      <Paper withBorder p="md">
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
                  fit="cover"
                  bd="1px solid var(--mantine-color-default-border)"
                  flex="none"
                />
                <Box miw={0} flex={1}>
                  <Text fw={600} truncate>{product.name}</Text>
                  <Text c="dimmed" size="sm">Ref. {product.reference}</Text>
                </Box>
                <Text fw={600} flex="none">{quantity} pares</Text>
              </Group>
            ))
          ) : (
            <Group gap="sm" wrap="nowrap">
              <ThemeIcon variant="default" size={48}>
                <PackageIcon size={20} color="var(--mantine-color-dimmed)" />
              </ThemeIcon>
              <Box miw={0} flex={1}>
                <Text fw={600} truncate>{productName}</Text>
                <Text c="dimmed" size="sm">{order.collection}</Text>
              </Box>
              <Text fw={600} flex="none">{order.items} pares</Text>
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Detalhes do pedido */}
      <Paper withBorder p="md">
        <SectionTitle>Detalhes do pedido</SectionTitle>
        {/* colunas na proporção 1.6 / 1 / 1 (8/5/5 de 18) */}
        <Grid columns={18} gutter={{ base: 'md', sm: 'xl' }}>
          {/* column 1: status + order id/name */}
          <Grid.Col span={{ base: 18, sm: 8 }} miw={0}>
            <Group gap={8} mb={4}>
              <OrderStatusBadge status={order.status} />
              <Text c="dimmed" size="sm">{support}</Text>
            </Group>
            <Text fw={600}>
              <Text span inherit className="mono">{order.id}</Text> — {productName}
            </Text>
            <Text c="dimmed" size="sm" mt={2}>Representante: {order.rep}</Text>
          </Grid.Col>

          {/* column 2: value + payment + link to Pagamentos e Boletos */}
          <Grid.Col span={{ base: 18, sm: 5 }} miw={0} className={classes.divided}>
            <Text className="mono" size="xl" fw={700}>{formatCurrency(order.total)}</Text>
            <Text c="dimmed" size="sm" mb={6}>{order.paymentCondition}</Text>
            {profile !== 'rep' && (
              <Button
                onClick={() => onNavigate('boletos')}
                variant="subtle"
                color="neutral"
                ml={-12}
                rightSection={<ArrowRightIcon size={16} />}
              >
                Abrir Pagamentos e Boletos
              </Button>
            )}
          </Grid.Col>

          {/* column 3: NF de compra */}
          <Grid.Col span={{ base: 18, sm: 5 }} miw={0} className={classes.divided}>
            <Text c="dimmed" size="sm" fw={600} mb={6}>
              NF de compra
            </Text>
            {order.status === 'faturado' || order.status === 'entregue' ? (
              <Button
                onClick={() => toast.success('Download da nota fiscal iniciado', 'O PDF vai para a pasta de downloads do navegador')}
                variant="default"
                leftSection={<DownloadSimpleIcon size={16} />}
              >
                Baixar nota fiscal
              </Button>
            ) : (
              <Text c="dimmed" size="sm">A nota fiscal fica disponível aqui quando o pedido for faturado.</Text>
            )}
          </Grid.Col>
        </Grid>
      </Paper>
    </Stack>
  );
}
