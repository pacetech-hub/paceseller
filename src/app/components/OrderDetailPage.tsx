import { useState } from "react";
import { Stack, Group, Box, Paper, Text, Title, Button, Anchor, Badge, Image, ThemeIcon, Skeleton, Collapse, Timeline } from "@mantine/core";
import { toast } from "../lib/toast";
import { useMockLoading } from "../lib/useMockLoading";
import { ListSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
import { CaretLeftIcon, CaretDownIcon, DownloadSimpleIcon, ArrowRightIcon, PackageIcon, CheckIcon, XIcon } from "@phosphor-icons/react";
import { products, clients, formatCurrency, formatDate, type Order, type Product } from "../data/mockData";
import { OrderStatusBadge, statusSupportText, orderProductNames, shiftDate } from "./OrderHistory";

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

interface TrackingStep {
  title: string;
  /** Data realizada ou prevista (dias a partir da emissão). */
  day: number;
  detail?: React.ReactNode;
}

/** Transportadora e código de rastreio do pedido (mock até existir integração). */
function shipmentOf(order: Order) {
  const digits = order.id.replace(/\D/g, '').padStart(8, '0').slice(-8);
  return { carrier: 'Jadlog', code: `JD${digits}BR` };
}

/**
 * Etapas do pedido: recebido → aprovado → em produção → faturado e enviado → entregue.
 * As datas seguem as que a lista de Pedidos já mostra (entrega prevista em +10 dias, entregue em +6).
 */
function trackingSteps(order: Order): { steps: TrackingStep[]; current: number } {
  const shipment = shipmentOf(order);
  const delivered = order.status === 'entregue';
  const shipped = order.status === 'faturado' || delivered;
  const steps: TrackingStep[] = [
    { title: 'Pedido recebido', day: 0 },
    { title: 'Aprovado pela indústria', day: 1, detail: order.status === 'em análise' ? 'Em análise: condições e crédito em conferência' : undefined },
    { title: 'Em produção', day: 2, detail: order.status === 'aprovado' ? 'Separação e produção dos pares do pedido' : undefined },
    {
      title: 'Faturado e enviado',
      day: delivered ? 4 : 3,
      detail: shipped ? (
        <>
          Transportadora {shipment.carrier} · rastreio <Text span inherit className="mono" c="var(--mantine-color-text)">{shipment.code}</Text>
        </>
      ) : undefined,
    },
    { title: 'Entregue', day: delivered ? 6 : 10 },
  ];
  // Índice da etapa em andamento; com o pedido entregue, todas estão concluídas
  const current = { 'em análise': 1, aprovado: 2, faturado: 4, entregue: steps.length, cancelado: 1 }[order.status];
  return { steps, current };
}

/** Linha do tempo do pedido, igual para lojista, representante e indústria. */
function OrderTimeline({ order, profile }: { order: Order; profile: Profile }) {
  if (order.status === 'cancelado') {
    return (
      <Timeline active={1} bulletSize={24} lineWidth={2} color="neutral">
        <Timeline.Item bullet={<CheckIcon size={14} weight="bold" />} title="Pedido recebido">
          <Text c="dimmed" size="sm">{formatDate(order.date)}</Text>
        </Timeline.Item>
        <Timeline.Item bullet={<XIcon size={14} weight="bold" />} color="red" title="Cancelado">
          <Text c="dimmed" size="sm">{formatDate(order.date)}</Text>
        </Timeline.Item>
      </Timeline>
    );
  }

  const { steps, current } = trackingSteps(order);
  return (
    <Stack gap="md">
      <Timeline active={Math.min(current, steps.length - 1)} bulletSize={24} lineWidth={2} color="neutral">
        {steps.map((step, i) => {
          const done = i < current;
          const isCurrent = i === current;
          const date = formatDate(shiftDate(order.date, step.day));
          return (
            <Timeline.Item
              key={step.title}
              bullet={done ? <CheckIcon size={14} weight="bold" /> : undefined}
              title={<Text fw={done || isCurrent ? 600 : 400} c={done || isCurrent ? undefined : 'dimmed'}>{step.title}</Text>}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <Text c="dimmed" size="sm">
                {done ? date : `Previsto para ${date}`}
                {isCurrent && ' · em andamento'}
              </Text>
              {step.detail && <Text c="dimmed" size="sm" mt={2}>{step.detail}</Text>}
            </Timeline.Item>
          );
        })}
      </Timeline>
      <Text c="dimmed" size="sm">
        {profile === 'lojista'
          ? `${order.rep} acompanha este pedido com você, em tempo real.`
          : 'O lojista acompanha a mesma linha do tempo, em tempo real.'}
      </Text>
    </Stack>
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
  const [trackingOpen, setTrackingOpen] = useState(false);
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
              {/* Botão terciário: abre a linha do tempo do pedido logo abaixo do status */}
              <Button
                variant="transparent"
                color="neutral"
                px={0}
                ml="xs"
                fw={600}
                onClick={() => setTrackingOpen(o => !o)}
                aria-expanded={trackingOpen}
                aria-controls="order-tracking"
                rightSection={
                  <CaretDownIcon
                    size={16}
                    style={{ transform: trackingOpen ? 'rotate(180deg)' : undefined, transition: 'transform 150ms ease' }}
                  />
                }
              >
                {trackingOpen ? 'Ocultar detalhes' : 'Ver detalhes'}
              </Button>
            </Group>
            <Collapse in={trackingOpen} id="order-tracking">
              <Box pt="md" pl={4}>
                <OrderTimeline order={order} profile={profile} />
              </Box>
            </Collapse>
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
