import { useState } from "react";
import { Stack, Group, Box, Paper, Text, Title, Button, Anchor, Badge, Image, ThemeIcon, Skeleton } from "@mantine/core";
import { toast } from "../lib/toast";
import { useMockLoading } from "../lib/useMockLoading";
import { ListSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
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

// Par rótulo/valor: rótulo discreto acima, valor abaixo, alinhados à esquerda (uma coluna)
function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text c="dimmed" size="sm">{label}</Text>
      <Box mt={4}>{children}</Box>
    </Box>
  );
}

/** Miniatura do produto: skeleton até a imagem carregar; ícone neutro se a imagem falhar. */
function ProductThumb({ src, alt, size = 48 }: { src: string; alt: string; size?: number }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  return (
    <Box
      w={size}
      h={size}
      pos="relative"
      flex="none"
      bd="1px solid var(--mantine-color-default-border)"
      style={{ overflow: 'hidden', borderRadius: 'var(--mantine-radius-default)' }}
    >
      {status === 'loading' && <Skeleton h="100%" style={{ position: 'absolute', inset: 0 }} />}
      {status === 'error' ? (
        <Box h="100%" display="flex" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <PackageIcon size={20} color="var(--mantine-color-dimmed)" />
        </Box>
      ) : (
        <Image
          src={src}
          alt={alt}
          w="100%"
          h="100%"
          fit="cover"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
          style={{ opacity: status === 'loaded' ? 1 : 0 }}
        />
      )}
    </Box>
  );
}

/** Skeleton do bloco "Detalhes do pedido": título + campos empilhados. */
function DetailsSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <Paper withBorder p="md" aria-busy="true" aria-label="Carregando detalhes do pedido">
      <Skeleton height={20} width="35%" mb="md" />
      <Stack gap="md">
        {Array.from({ length: fields }).map((_, i) => (
          <Box key={i}>
            <Skeleton height={12} width="25%" mb="xs" />
            <Skeleton height={16} width="55%" />
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

// deterministic line-item breakdown per order — quantities sum to order.items
const orderLineItems: Record<string, Array<{ productId: string; quantity: number }>> = {
  '4790-1': [{ productId: 'P009', quantity: 48 }],
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
  const loading = useMockLoading();
  if (!order) {
    return (
      <Box p={{ base: 'md', sm: 'lg' }} maw={1000} mx="auto" w="100%">
        <EmptyState
          icon={PackageIcon}
          title="Nenhum pedido selecionado"
          description="Escolha um pedido no histórico para ver produtos, pagamento e nota fiscal."
          action={{ label: 'Ver Histórico de Pedidos', onClick: () => onNavigate('history') }}
        />
      </Box>
    );
  }

  const support = statusSupportText(order);
  const productName = orderProductNames[order.id] ?? order.collection;
  const lineItems = getOrderLineItems(order);
  const client = clients.find(c => c.id === order.clientId);

  return (
    <Stack gap="xl" p={{ base: 'md', sm: 'lg' }} maw={1000} mx="auto" w="100%">
      <Box>
        <Button
          onClick={() => onNavigate('history')}
          variant="subtle"
          color="gray"
          ml={-12}
          leftSection={<CaretLeftIcon size={16} />}
        >
          Voltar para Pedidos
        </Button>
      </Box>

      {loading ? (
        <>
          {profile !== 'lojista' && <DetailsSkeleton fields={2} />}
          <ListSkeleton rows={Math.max(1, lineItems.length)} />
          <DetailsSkeleton />
        </>
      ) : (
      <>
      {/* Cliente — admin/rep only */}
      {profile !== 'lojista' && client && (
        <Paper withBorder p="md">
          <SectionTitle>Cliente</SectionTitle>
          <Group gap="xs" mb="xs">
            <Text fw={700}>{client.name}</Text>
            <Badge variant="light" color={clientStatusColors[client.status]} styles={badgeStyles}>
              {client.status}
            </Badge>
            {client.inadimplente && (
              <Badge variant="light" color="yellow" styles={badgeStyles}>inadimplente</Badge>
            )}
          </Group>
          <Text c="dimmed" size="sm" mb={4}>{client.cnpj}</Text>
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
                <ProductThumb src={product.image} alt={product.name} />
                <Box miw={0} flex={1}>
                  <Text fw={600} truncate>{product.name}</Text>
                  <Text c="dimmed" size="sm">Ref. {product.reference}</Text>
                </Box>
                <Text className="mono" fw={600} flex="none" ta="right">{quantity.toLocaleString('pt-BR')} pares</Text>
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
              <Text className="mono" fw={600} flex="none" ta="right">{order.items.toLocaleString('pt-BR')} pares</Text>
            </Group>
          )}
        </Stack>
      </Paper>

      {/* Detalhes do pedido */}
      <Paper withBorder p="md">
        <SectionTitle>Detalhes do pedido</SectionTitle>
        {/* Uma coluna, rótulo acima do valor: leitura rápida pela borda esquerda */}
        <Stack gap="md">
          <DetailField label="Status">
            <Group gap="xs">
              <OrderStatusBadge status={order.status} />
              <Text c="dimmed" size="sm">{support}</Text>
            </Group>
          </DetailField>
          <DetailField label="Pedido">
            <Text fw={600}>
              <Text span inherit className="mono">{order.id}</Text> — {productName}
            </Text>
          </DetailField>
          <DetailField label="Representante">
            <Text>{order.rep}</Text>
          </DetailField>
          <DetailField label="Valor total">
            <Text className="mono" size="xl" fw={700}>{formatCurrency(order.total)}</Text>
            <Text c="dimmed" size="sm">{order.paymentCondition}</Text>
            {profile !== 'rep' && (
              // Navegação para outra página: link, não botão
              <Anchor
                component="button"
                type="button"
                onClick={() => onNavigate('boletos')}
                display="inline-flex"
                mt="xs"
                style={{ alignItems: 'center', gap: 4 }}
              >
                Abrir Pagamentos e Boletos
                <ArrowRightIcon size={16} />
              </Anchor>
            )}
          </DetailField>
          <DetailField label="NF de compra">
            {order.status === 'faturado' || order.status === 'entregue' ? (
              <Button
                onClick={() => toast.success('Download da nota fiscal iniciado', 'O PDF vai para a pasta de downloads do navegador')}
                variant="default"
                leftSection={<DownloadSimpleIcon size={16} />}
              >
                Baixar Nota Fiscal
              </Button>
            ) : (
              <Text c="dimmed" size="sm">A nota fiscal fica disponível aqui quando o pedido for faturado.</Text>
            )}
          </DetailField>
        </Stack>
      </Paper>
      </>
      )}
    </Stack>
  );
}
