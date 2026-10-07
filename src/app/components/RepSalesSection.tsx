import { useMemo, useState } from "react";
import {
  Badge, Box, Button, Divider, Grid, Group, Paper, Progress, ScrollArea, SegmentedControl, SimpleGrid, Stack, Text, Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon, ChartLineUpIcon, MinusIcon } from "@phosphor-icons/react";
import { useMockLoading } from "../lib/useMockLoading";
import interactive from "./interactive.module.css";
import { KpiSkeleton } from "./ui/Skeletons";
import { ThemeHeader } from "./ui/ThemeHeader";
import { OrderStatusBadge, statusColors, statusIcon } from "./OrderHistory";
import { formatCurrency } from "../data/mockData";
import { SALES_PERIODS, deltaPct, getSalesSummary, type SalesPeriod } from "../data/repSales";
import type { CtaTarget } from "../data/radar";

const int = (n: number) => n.toLocaleString('pt-BR');
/** Indicadores em reais inteiros (centavos só nas listas). */
const reais = (n: number) => `R$ ${Math.round(n).toLocaleString('pt-BR')}`;
const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

/** Variação contra o ano anterior: ícone + texto (nunca só a cor). */
function Delta({ value, size = 'sm' }: { value: number | null; size?: 'xs' | 'sm' }) {
  if (value === null) return <Text size={size} c="dimmed">sem base</Text>;
  const up = value > 0;
  const flat = value === 0;
  const DeltaIcon = flat ? MinusIcon : up ? ArrowUpRightIcon : ArrowDownRightIcon;
  return (
    <Group gap={2} wrap="nowrap" c={flat ? 'dimmed' : up ? 'teal.8' : 'red.7'}>
      <DeltaIcon size={14} weight="bold" aria-hidden />
      <Text size={size} fw={600} c="inherit">{pct(value)}</Text>
    </Group>
  );
}

function KpiTile({ label, value, delta, previous }: { label: string; value: string; delta: number | null; previous: string }) {
  return (
    <Paper withBorder p="md">
      <Text size="xs" fw={700} tt="uppercase" ff="monospace" lts={0.5} c="dimmed">{label}</Text>
      {/* encolhe no celular para o valor caber em duas colunas */}
      <Text fw={700} lh={1.2} mt={6} style={{ fontSize: 'clamp(20px, 5vw, 28px)', whiteSpace: 'nowrap' }}>{value}</Text>
      <Group gap={6} mt={6} wrap="wrap">
        <Delta value={delta} />
        <Text size="xs" c="dimmed">vs. {previous}</Text>
      </Group>
    </Paper>
  );
}

// Seção complementar do Radar do representante: vendas, vendedores com mais vendas e pedidos do
// período, sempre comparados com o mesmo período do ano anterior.
export function RepSalesSection({ repName, onCta }: { repName: string; onCta: (target: CtaTarget) => void }) {
  const [period, setPeriod] = useState<SalesPeriod>('mes');
  const loading = useMockLoading();
  const s = useMemo(() => getSalesSummary(repName, period), [repName, period]);
  const prevYear = s.previousLabel;
  const topValue = Math.max(1, ...s.sellers.map(x => x.value));
  const teamValue = s.sellers.reduce((a, x) => a + x.value, 0);
  const cancelled = s.statusCounts.find(x => x.status === 'cancelado')?.count ?? 0;

  return (
    <Stack gap="md">
      <ThemeHeader
        icon={ChartLineUpIcon}
        title="Vendas no período"
        description="Suas vendas e as do seu time, comparadas com o mesmo período do ano anterior"
        action={
          <ScrollArea type="never" maw="100%">
            <SegmentedControl
              value={period}
              onChange={v => setPeriod(v as SalesPeriod)}
              data={SALES_PERIODS}
              aria-label="Período"
            />
          </ScrollArea>
        }
      />
      <Text size="sm" c="dimmed">
        <Text span fw={600} c="var(--mantine-color-text)">{s.label.charAt(0).toUpperCase() + s.label.slice(1)}</Text> · comparado com {prevYear}
      </Text>

      {loading ? (
        <KpiSkeleton count={4} cols={{ base: 2, md: 4 }} />
      ) : (
        <>
          <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
            <KpiTile label="Vendas" value={reais(s.current.value)} delta={deltaPct(s.current.value, s.previous.value)} previous={reais(s.previous.value)} />
            <KpiTile label="Pedidos" value={int(s.current.orders)} delta={deltaPct(s.current.orders, s.previous.orders)} previous={int(s.previous.orders)} />
            <KpiTile label="Ticket médio" value={reais(s.current.ticket)} delta={deltaPct(s.current.ticket, s.previous.ticket)} previous={reais(s.previous.ticket)} />
            <KpiTile label="Pares" value={int(s.current.pairs)} delta={deltaPct(s.current.pairs, s.previous.pairs)} previous={int(s.previous.pairs)} />
          </SimpleGrid>

          <Grid gutter="md">
            {/* Vendedores com mais vendas: barra de um só tom, proporcional ao líder; valor e variação em texto */}
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Paper withBorder p="lg" h="100%">
                <Stack gap="md" h="100%">
                  <Text fw={600}>Vendedores com mais vendas</Text>
                  <Stack gap="md">
                    {s.sellers.map((x, i) => {
                      const share = teamValue > 0 ? Math.round((x.value / teamValue) * 100) : 0;
                      return (
                        <Box key={x.id}>
                          <Group justify="space-between" wrap="nowrap" gap="sm">
                            <Group gap="xs" wrap="nowrap" miw={0}>
                              <Text size="sm" ff="monospace" c="dimmed" w={20}>{i + 1}º</Text>
                              <Text size="sm" fw={600} truncate>{x.name}</Text>
                              <Badge size="xs" variant="light" color="gray">{x.name === repName ? 'Você' : 'Preposto'}</Badge>
                            </Group>
                            <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>{reais(x.value)}</Text>
                          </Group>
                          <Tooltip label={`${x.name}: ${share}% das vendas do time · ${reais(x.value)}`} withArrow>
                            <Progress value={(x.value / topValue) * 100} color="neutral.7" size="sm" radius="xl" mt={6} aria-label={`${share}% das vendas do time`} />
                          </Tooltip>
                          <Group justify="space-between" mt={4} gap="xs">
                            <Text size="xs" c="dimmed">{x.orders} {x.orders === 1 ? 'pedido' : 'pedidos'} · {share}% do time</Text>
                            <Group gap={4} wrap="nowrap">
                              <Delta value={x.delta} size="xs" />
                              <Text size="xs" c="dimmed">vs. {reais(x.previous)}</Text>
                            </Group>
                          </Group>
                        </Box>
                      );
                    })}
                  </Stack>
                  <Group mt="auto">
                    <Button variant="transparent" color="neutral" px={0} fw={600} rightSection={<ArrowRightIcon size={18} />} onClick={() => onCta({ kind: 'sales-team' })}>
                      Ver vendedores
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>

            {/* Pedidos no período: contagem por status (abre Pedidos filtrado) e os mais recentes */}
            <Grid.Col span={{ base: 12, lg: 6 }}>
              <Paper withBorder p="lg" h="100%">
                <Stack gap="md" h="100%">
                  <Group justify="space-between">
                    <Text fw={600}>Pedidos no período</Text>
                    <Text size="sm" c="dimmed">
                      {int(s.current.orders)} {s.current.orders === 1 ? 'válido' : 'válidos'}{cancelled > 0 && ` · ${cancelled} ${cancelled === 1 ? 'cancelado' : 'cancelados'}`}
                    </Text>
                  </Group>
                  <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="xs">
                    {s.statusCounts.map(st => {
                      const StIcon = statusIcon[st.status];
                      return (
                        <UnstyledButton
                          key={st.status}
                          // sem pedidos no status, nada para abrir
                          disabled={st.count === 0}
                          onClick={() => onCta({ kind: 'orders', status: st.status })}
                          aria-label={`${st.count} pedidos ${st.status}, ver em Pedidos`}
                        >
                          <Paper withBorder p="xs" radius="md" className={st.count > 0 ? interactive.hoverable : undefined} opacity={st.count > 0 ? 1 : 0.6}>
                            <Group gap={4} wrap="nowrap" c={`${statusColors[st.status] === 'neutral' ? 'dimmed' : `${statusColors[st.status]}.8`}`}>
                              <StIcon size={14} aria-hidden />
                              <Text size="xs" c="inherit" truncate>{st.status.charAt(0).toUpperCase() + st.status.slice(1)}</Text>
                            </Group>
                            <Text fw={700} fz="lg" mt={2}>{st.count}</Text>
                            <Text size="xs" c="dimmed" truncate>{formatCurrency(st.value)}</Text>
                          </Paper>
                        </UnstyledButton>
                      );
                    })}
                  </SimpleGrid>

                  <Divider />
                  <Stack gap="xs">
                    <Text size="xs" fw={700} tt="uppercase" ff="monospace" lts={0.5} c="dimmed">Mais recentes</Text>
                    {s.recent.length === 0 && <Text size="sm" c="dimmed">Nenhum pedido neste período.</Text>}
                    {s.recent.map(o => (
                      <Group key={o.id} justify="space-between" wrap="nowrap" gap="sm">
                        <Box miw={0}>
                          <Text size="sm" fw={600} truncate>{o.clientName}</Text>
                          <Text size="xs" c="dimmed" ff="monospace">
                            {o.id} · {o.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · {s.sellers.find(x => x.id === o.sellerId)?.name.split(' ')[0]}
                          </Text>
                        </Box>
                        <Group gap="sm" wrap="nowrap">
                          <Text size="sm" fw={600} style={{ whiteSpace: 'nowrap' }}>{formatCurrency(o.value)}</Text>
                          <Box visibleFrom="sm"><OrderStatusBadge status={o.status} /></Box>
                        </Group>
                      </Group>
                    ))}
                  </Stack>
                  <Group mt="auto">
                    <Button variant="transparent" color="neutral" px={0} fw={600} rightSection={<ArrowRightIcon size={18} />} onClick={() => onCta({ kind: 'orders' })}>
                      Ver todos os pedidos
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
        </>
      )}
    </Stack>
  );
}
