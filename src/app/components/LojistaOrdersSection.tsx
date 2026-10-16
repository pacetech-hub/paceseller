import { Badge, Box, Grid, Group, Stack, Text } from "@mantine/core";
import { CheckCircleIcon, ClockIcon, PackageIcon, ReceiptIcon, TruckIcon } from "@phosphor-icons/react";
import { useMockLoading } from "../lib/useMockLoading";
import { KpiSkeleton } from "./ui/Skeletons";
import { ThemeHeader } from "./ui/ThemeHeader";
import { Widget, WidgetLink } from "./ui/Widget";
import { orders } from "../data/mockData";
import { cartValue, repFirstName, useCartStore } from "../data/cartStore";
import { dateInDays, ddmm, lateOrders, upcomingBills, days, type CtaTarget } from "../data/radar";

/** Janela dos boletos mostrados no widget (mesma do aviso S-14). */
const BILLS_WINDOW_DAYS = 7;

const reais = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function BigNumber({ value, color }: { value: string; color?: string }) {
  return (
    // encolhe no celular para caber em duas colunas
    <Text fw={700} lh={1.1} c={color} style={{ fontSize: 'clamp(22px, 5vw, 30px)', whiteSpace: 'nowrap' }}>{value}</Text>
  );
}

// Seção do Radar do lojista com o que está em andamento depois da compra: pedidos em análise,
// aprovados, boletos a vencer e entregas — em widgets, no mesmo formato do Radar do representante.
// Substitui os cartões "Pedido atrasado" e "Boletos a vencer" (os dados são os mesmos do motor).
export function LojistaOrdersSection({ clientId, onCta }: { clientId: string; onCta: (target: CtaTarget) => void }) {
  const loading = useMockLoading();
  const { carts } = useCartStore();
  const mine = carts.filter(c => c.clientId === clientId);
  const myOrders = orders.filter(o => o.clientId === clientId);

  // Em análise: carrinhos enviados esperando o representante + pedidos em análise
  const waitingRep = mine.filter(c => c.stage === 'aguardando-rep');
  const ordersInReview = myOrders.filter(o => o.status === 'em análise');
  const inReview = waitingRep.length + ordersInReview.length;
  const inReviewValue = waitingRep.reduce((a, c) => a + cartValue(c), 0) + ordersInReview.reduce((a, o) => a + o.total, 0);
  const repName = waitingRep[0]?.rep ?? myOrders[0]?.rep;

  // Aprovados: pedidos aprovados + carrinhos aprovados pelo representante aguardando pagamento
  const awaitingPayment = mine.filter(c => c.stage === 'aguardando-pagamento');
  const ordersApproved = myOrders.filter(o => o.status === 'aprovado');
  const approved = awaitingPayment.length + ordersApproved.length;
  const approvedValue = awaitingPayment.reduce((a, c) => a + cartValue(c), 0) + ordersApproved.reduce((a, o) => a + o.total, 0);

  // Pagamentos: boletos que vencem na janela
  const bills = upcomingBills.filter(b => b.dueInDays >= 0 && b.dueInDays <= BILLS_WINDOW_DAYS).sort((a, b) => a.dueInDays - b.dueInDays);
  const billsTotal = bills.reduce((a, b) => a + b.amount, 0);
  const nextBill = bills[0];

  // Entregas: pedidos faturados (a caminho), destacando os atrasados
  const inTransit = myOrders.filter(o => o.status === 'faturado');
  const late = lateOrders;
  const firstLate = late[0];

  return (
    <Stack gap="md">
      <ThemeHeader
        icon={PackageIcon}
        title="Pedidos, pagamentos e entregas"
        description="O que está em andamento depois da compra"
      />
      {loading ? (
        <KpiSkeleton count={4} cols={{ base: 2, md: 4 }} />
      ) : (
        // um widget por linha no celular: textos de apoio e selos não cabem em duas colunas
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, xs: 6, md: 3 }}>
            <Widget
              icon={ClockIcon}
              title="Pedidos em análise"
              footer={
                <WidgetLink
                  label={waitingRep.length > 0 ? 'Ver carrinhos' : 'Ver pedidos'}
                  onClick={() => onCta(waitingRep.length > 0 ? { kind: 'carts' } : { kind: 'orders', status: 'em análise' })}
                  disabled={inReview === 0}
                />
              }
            >
              <Box>
                <BigNumber value={String(inReview)} color={inReview > 0 ? 'yellow.8' : undefined} />
                <Text size="xs" c="dimmed" mt={4}>
                  {inReview === 0 ? 'Nenhum pedido em análise' : `${inReview === 1 ? 'pedido' : 'pedidos'} · ${reais(inReviewValue)}`}
                </Text>
                {waitingRep.length > 0 && repName && (
                  <Text size="xs" mt={6}>Aguardando {repFirstName(repName)} revisar</Text>
                )}
              </Box>
            </Widget>
          </Grid.Col>

          <Grid.Col span={{ base: 12, xs: 6, md: 3 }}>
            <Widget
              icon={CheckCircleIcon}
              title="Pedidos aprovados"
              footer={
                <WidgetLink
                  label={awaitingPayment.length > 0 ? 'Pagar agora' : 'Ver pedidos'}
                  onClick={() => onCta(awaitingPayment.length > 0 ? { kind: 'cart', cartId: awaitingPayment[0].id } : { kind: 'orders', status: 'aprovado' })}
                  disabled={approved === 0}
                />
              }
            >
              <Box>
                <BigNumber value={String(approved)} />
                <Text size="xs" c="dimmed" mt={4}>
                  {approved === 0 ? 'Nenhum pedido aprovado' : `${approved === 1 ? 'pedido' : 'pedidos'} · ${reais(approvedValue)}`}
                </Text>
                {awaitingPayment.length > 0 && (
                  <Badge variant="light" color="teal" mt={6}>{plural(awaitingPayment.length, 'aguarda', 'aguardam')} pagamento</Badge>
                )}
              </Box>
            </Widget>
          </Grid.Col>

          <Grid.Col span={{ base: 12, xs: 6, md: 3 }}>
            <Widget
              icon={ReceiptIcon}
              title="Boletos a vencer"
              footer={<WidgetLink label="Ver boletos" onClick={() => onCta({ kind: 'boletos' })} />}
            >
              <Box>
                <BigNumber value={reais(billsTotal)} color={bills.length > 0 ? 'yellow.8' : undefined} />
                <Text size="xs" c="dimmed" mt={4}>
                  {bills.length === 0 ? `Nenhum boleto nos próximos ${days(BILLS_WINDOW_DAYS)}` : `${plural(bills.length, 'boleto', 'boletos')} nos próximos ${days(BILLS_WINDOW_DAYS)}`}
                </Text>
                {nextBill && (
                  <Text size="xs" mt={6}>
                    Próximo: {reais(nextBill.amount)} em {ddmm(dateInDays(nextBill.dueInDays))}
                    {nextBill.dueInDays === 0 ? ' (hoje)' : ` (em ${days(nextBill.dueInDays)})`}
                  </Text>
                )}
              </Box>
            </Widget>
          </Grid.Col>

          <Grid.Col span={{ base: 12, xs: 6, md: 3 }}>
            <Widget
              icon={TruckIcon}
              title="Entregas"
              footer={
                <WidgetLink
                  label={firstLate ? 'Ver pedido' : 'Ver pedidos'}
                  onClick={() => onCta(firstLate ? { kind: 'order', orderId: firstLate.orderId } : { kind: 'orders', status: 'faturado' })}
                />
              }
            >
              <Box>
                <BigNumber value={String(inTransit.length)} />
                <Text size="xs" c="dimmed" mt={4}>{inTransit.length === 1 ? 'pedido faturado a caminho' : 'pedidos faturados a caminho'}</Text>
                {firstLate && (
                  <Group gap={6} mt={6} wrap="wrap">
                    {/* atraso é crítico: rótulo escrito, não só a cor */}
                    <Badge variant="light" color="red">Crítico · {plural(late.length, 'atrasado', 'atrasados')}</Badge>
                    <Text size="xs" c="red.8">#{firstLate.orderId}: nova previsão {firstLate.newForecast}</Text>
                  </Group>
                )}
              </Box>
            </Widget>
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  );
}
