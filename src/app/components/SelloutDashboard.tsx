import { useState } from "react";
import {
  Stack, Group, Box, Paper, Card, Text, Title, Button, Badge, SimpleGrid, Grid, Table, Progress, Center, ColorSwatch,
} from "@mantine/core";
import classes from "./SelloutDashboard.module.css";
import { BarChart, DonutChart } from "@mantine/charts";
import {
  WarningIcon,
  TrendDownIcon,
  TrendUpIcon,
  LightningIcon,
  ArrowsClockwiseIcon,
  DownloadSimpleIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { toast } from "../lib/toast";
import { useMockLoading } from "../lib/useMockLoading";
import { barDomain } from "../lib/charts";
import { ChartSkeleton, KpiSkeleton, TableSkeleton } from "./ui/Skeletons";
import { CellCard, CellField, CellList } from "./ui/CellView";
import { selloutData, regionData, formatCurrency } from "../data/mockData";

// alertas ordenados por urgência: mais dias parado primeiro
const encalheAlerts = [
  { product: 'Mocassim Couro Trançado', sku: 'TCF-2026-003', stock: 240, diasEstoque: 62, region: 'Sul', action: 'Sugerir Desconto' },
  { product: 'Derby Casual Urban', sku: 'TCF-2026-002', stock: 180, diasEstoque: 54, region: 'Nordeste', action: 'Redistribuir Estoque' },
  { product: 'Sandália Slide Premium', sku: 'TCF-2026-006', stock: 420, diasEstoque: 78, region: 'Centro-Oeste', action: 'Criar Campanha' },
  { product: 'Tênis Vulcanizado', sku: 'TCF-2026-008', stock: 96, diasEstoque: 45, region: 'Norte', action: 'Reposicionar Produto' },
].sort((a, b) => b.diasEstoque - a.diasEstoque);

const stockByLine = [
  { name: 'Premium', sellIn: 580000, sellOut: 520000, giro: 89.6 },
  { name: 'Urban', sellIn: 420000, sellOut: 390000, giro: 92.8 },
  { name: 'Sport', sellIn: 680000, sellOut: 650000, giro: 95.6 },
];

// parte do todo com 2 partes: donut; o rótulo central é calculado dos próprios dados
const pieData = [
  { name: 'Vendido', value: 2860000, color: 'neutral.9' },
  { name: 'Estoque', value: 140000, color: 'gray.3' },
];

const SELL_IN_COLOR = 'neutral.9';
const SELL_OUT_COLOR = 'teal.6';

// tooltip dos gráficos: valor completo em reais, sem centavos (ex.: "R$ 23.818")
const formatChartCurrency = (v: number) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

// eixo em pt-BR: "450 mil"
const formatK = (v: number) => `${Math.round(v / 1000).toLocaleString('pt-BR')} mil`;

const fmtPct = (v: number, digits = 1) => v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }) + '%';

const pieTotal = pieData.reduce((a, b) => a + b.value, 0);
const soldPct = (pieData[0].value / pieTotal) * 100;

const totalSellIn = selloutData.reduce((a, b) => a + b.sellIn, 0);
const totalSellOut = selloutData.reduce((a, b) => a + b.sellOut, 0);

// dias parado: acima de 60 crítico, acima de 45 atenção
const daysColor = (days: number) => (days > 60 ? 'red.6' : days > 45 ? 'yellow.7' : undefined);

// giro por linha (barra e número com a mesma regra): >= 95 ótimo, >= 90 ok, abaixo atenção
const giroBarColor = (giro: number) => (giro >= 95 ? 'teal.6' : giro >= 90 ? 'neutral.9' : 'yellow.6');
const giroTextColor = (giro: number) => (giro >= 95 ? 'teal.7' : giro >= 90 ? undefined : 'yellow.8');

// linhas ordenadas pelo giro, do maior para o menor
const linesByGiro = [...stockByLine].sort((a, b) => b.giro - a.giro);

// a seta segue o sinal do número; a cor diz se é bom (teal): aqui todas as variações são melhoras
// (menos encalhe, giro mais rápido e menos alertas também são bons)
const kpis = [
  { label: 'Taxa de Sell-out', value: '95,3%', sub: 'Coleção Inverno 2026', trend: 'up', trendVal: '+2,1 p.p.', color: 'teal.7' },
  { label: 'Estoque Parado', value: formatCurrency(140000), sub: 'valor em encalhe', trend: 'down', trendVal: '-R$ 28 mil', color: 'teal.7' },
  { label: 'Giro Médio', value: '28 dias', sub: 'da produção à venda', trend: 'down', trendVal: '-3 dias', color: 'teal.7' },
  { label: 'Alertas Ativos', value: '6', sub: 'produtos em encalhe', trend: 'down', trendVal: '-2 na semana', color: 'teal.7' },
] as const;

function ChartTitle({ children }: { children: React.ReactNode }) {
  return <Title order={3}>{children}</Title>;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <Group gap="xs" wrap="nowrap">
      <Paper w={12} h={12} bg={color} />
      <Text c="dimmed" size="sm">{label}</Text>
    </Group>
  );
}

// gera um CSV com os dados do gráfico sell-in × sell-out e dispara o download no navegador
function downloadSelloutCsv(): string {
  const fileName = 'sell-in-x-sell-out-jan-jun-2026.csv';
  const rows = [['Mês', 'Sell-in (R$)', 'Sell-out (R$)'], ...selloutData.map(d => [d.month, String(d.sellIn), String(d.sellOut)])];
  const csv = rows.map(r => r.join(';')).join('\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return fileName;
}

export function SelloutDashboard() {
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [handled, setHandled] = useState<string[]>([]);
  const loading = useMockLoading();

  const exportChartData = () => {
    try {
      const fileName = downloadSelloutCsv();
      toast.success('Download do CSV iniciado', `Procure ${fileName} na pasta de downloads do navegador`);
    } catch {
      toast.error('Não foi possível gerar o CSV', 'Tente novamente; se persistir, recarregue a página');
    }
  };

  // mock: os dados são fixos, então a verificação não encontra alertas novos
  const refreshAlerts = () => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setCheckedAt(time);
    toast.success('Alertas verificados — nenhum encalhe novo', `Os ${encalheAlerts.length} alertas abaixo continuam ativos`);
  };

  // marca só nesta tela que a ação sugerida foi feita (não envia nada a outro sistema)
  const markHandled = (sku: string) => setHandled(prev => [...prev, sku]);

  // ação da linha: botão enquanto pendente, confirmação depois de marcada
  const renderAlertAction = (alert: typeof encalheAlerts[number]) => (
    handled.includes(alert.sku) ? (
      <Group gap="xs" c="teal.7" wrap="nowrap" mih={36}>
        <CheckIcon size={16} />
        <Text size="sm" fw={600} c="inherit">Ação marcada como feita</Text>
      </Group>
    ) : (
      <Button variant="default" size="sm" leftSection={<LightningIcon size={16} />} onClick={() => markHandled(alert.sku)}>
        {alert.action}
      </Button>
    )
  );

  if (loading) {
    // skeleton no formato do painel: KPIs, gráficos e tabela de alertas
    return (
      <Stack gap="xl" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
        <KpiSkeleton count={4} />
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, lg: 8 }}><ChartSkeleton height={200} /></Grid.Col>
          <Grid.Col span={{ base: 12, lg: 4 }}><ChartSkeleton height={200} /></Grid.Col>
        </Grid>
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
          <ChartSkeleton height={200} />
          <ChartSkeleton height={200} />
        </SimpleGrid>
        <TableSkeleton rows={4} cols={6} />
      </Stack>
    );
  }

  return (
    <Stack gap="xl" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {/* KPIs */}
      <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="md">
        {kpis.map(kpi => {
          const TrendIcon = kpi.trend === 'up' ? TrendUpIcon : TrendDownIcon;
          return (
            <Paper key={kpi.label} withBorder p={{ base: 'md', sm: 'lg' }}>
              <Text c="dimmed" size="sm">{kpi.label}</Text>
              <Text className="mono" fw={700} fz={{ base: 'lg', sm: 'xl' }} mt={4}>{kpi.value}</Text>
              <Group gap="xs" mt={4} wrap="nowrap">
                <Group gap={4} c={kpi.color} wrap="nowrap" flex="none">
                  <TrendIcon size={12} />
                  <Text size="sm" fw={600} c={kpi.color}>{kpi.trendVal}</Text>
                </Group>
                <Text c="dimmed" size="sm" truncate>{kpi.sub}</Text>
              </Group>
            </Paper>
          );
        })}
      </SimpleGrid>

      {/* Charts Row 1 */}
      <Grid gutter="md">
        {/* Sell-in x Sell-out trend */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Paper withBorder p={{ base: 'md', sm: 'lg' }} h="100%">
            <Group justify="space-between" mb="md">
              <Box>
                <ChartTitle>Evolução Sell-in × Sell-out</ChartTitle>
                <Text c="dimmed" size="sm" mt={4}>Jan–Jun 2026 · em R$</Text>
              </Box>
              <Button variant="subtle" color="gray" leftSection={<DownloadSimpleIcon size={16} />} onClick={exportChartData}>
                Exportar Dados (CSV)
              </Button>
            </Group>
            <BarChart
              h={200}
              data={selloutData}
              dataKey="month"
              series={[
                { name: 'sellIn', label: 'Sell-in', color: SELL_IN_COLOR },
                { name: 'sellOut', label: 'Sell-out', color: SELL_OUT_COLOR },
              ]}
              gridAxis="y"
              tickLine="none"
              strokeDasharray="3 3"
              valueFormatter={formatChartCurrency}
              yAxisProps={{ tickFormatter: formatK, width: 44, domain: barDomain }}
              barProps={{ radius: [3, 3, 0, 0] }}
              barChartProps={{ barGap: 4 }}
            />
            <Group gap="md" mt="sm">
              {/* legenda com o total do período de cada série */}
              <LegendDot color={SELL_IN_COLOR} label={`Sell-in (faturado) · ${formatChartCurrency(totalSellIn)}`} />
              <LegendDot color={SELL_OUT_COLOR} label={`Sell-out (vendido) · ${formatChartCurrency(totalSellOut)}`} />
            </Group>
          </Paper>
        </Grid.Col>

        {/* Donut giro */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Card withBorder padding="lg" h="100%">
            <Box mb="md">
              <ChartTitle>Giro da Coleção</ChartTitle>
              <Text c="dimmed" size="sm" mt={4}>Vendido × em estoque · em R$</Text>
            </Box>
            <Center flex={1}>
              <Box pos="relative">
                <DonutChart
                  data={pieData}
                  size={160}
                  thickness={24}
                  startAngle={90}
                  endAngle={-270}
                  strokeWidth={0}
                  withTooltip={false}
                />
                <Stack gap={0} align="center" justify="center" pos="absolute" inset={0} className={classes.donutLabel}>
                  <Text fw={700} size="xl" lh={1.1}>{fmtPct(soldPct, 0)}</Text>
                  <Text c="dimmed" size="sm">girado</Text>
                </Stack>
              </Box>
            </Center>
            <Stack gap="xs" mt="md">
              {pieData.map(d => (
                <Group key={d.name} justify="space-between" wrap="nowrap">
                  <Group gap="xs" wrap="nowrap">
                    <ColorSwatch color={`var(--mantine-color-${d.color.replace('.', '-')})`} size={10} withShadow={false} />
                    <Text c="dimmed" size="sm">{d.name}</Text>
                  </Group>
                  <Text className="mono" size="sm" fw={600}>
                    {formatChartCurrency(d.value)} · {fmtPct((d.value / pieTotal) * 100)}
                  </Text>
                </Group>
              ))}
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Performance por linha */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
        <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
          <Box mb="md">
            <ChartTitle>Performance por Linha</ChartTitle>
            <Text c="dimmed" size="sm" mt={4}>Giro = sell-out ÷ sell-in · maior giro primeiro</Text>
          </Box>
          <Stack gap="md">
            {linesByGiro.map(line => (
              <Box key={line.name}>
                <Group justify="space-between" mb="xs" wrap="nowrap">
                  <Text fw={600}>{line.name}</Text>
                  <Text size="sm" fw={700} c={giroTextColor(line.giro)} className="mono">{fmtPct(line.giro)}</Text>
                </Group>
                <Progress value={line.giro} size={8} color={giroBarColor(line.giro)} transitionDuration={800} />
                <Group justify="space-between" mt={4}>
                  <Text c="dimmed" size="sm">Sell-out: {formatChartCurrency(line.sellOut)}</Text>
                  <Text c="dimmed" size="sm">Sell-in: {formatChartCurrency(line.sellIn)}</Text>
                </Group>
              </Box>
            ))}
          </Stack>
        </Paper>

        {/* Regional */}
        <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
          <Box mb="md">
            <ChartTitle>Sell-out por Região</ChartTitle>
            <Text c="dimmed" size="sm" mt={4}>Receita · maior região primeiro · em R$</Text>
          </Box>
          <BarChart
            h={200}
            data={[...regionData].sort((a, b) => b.revenue - a.revenue)}
            dataKey="region"
            orientation="vertical"
            series={[{ name: 'revenue', label: 'Receita', color: SELL_IN_COLOR }]}
            gridAxis="x"
            tickLine="none"
            strokeDasharray="3 3"
            valueFormatter={formatChartCurrency}
            xAxisProps={{ tickFormatter: formatK, domain: barDomain }}
            yAxisProps={{ width: 90 }}
            barProps={{ radius: [0, 3, 3, 0] }}
          />
        </Paper>
      </SimpleGrid>

      {/* Encalhe Alerts */}
      <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
        <Group justify="space-between" mb="md">
          <Box>
            <Group gap="xs">
              <WarningIcon size={20} color="var(--mantine-color-yellow-6)" />
              <ChartTitle>Alertas de Encalhe</ChartTitle>
              <Badge variant="light" color="yellow">
                {encalheAlerts.length} alertas
              </Badge>
            </Group>
            {checkedAt && (
              <Text c="dimmed" size="sm" mt={4}>Verificado às {checkedAt} · nenhum alerta novo</Text>
            )}
          </Box>
          <Button variant="subtle" color="gray" leftSection={<ArrowsClockwiseIcon size={16} />} onClick={refreshAlerts}>
            Atualizar Alertas
          </Button>
        </Group>
        <Table.ScrollContainer minWidth={720} visibleFrom="sm">
          <Table highlightOnHover verticalSpacing="sm" horizontalSpacing={0}>
            <Table.Thead>
              <Table.Tr>
                {/* números e ações à direita; texto, códigos e região à esquerda */}
                {['Produto', 'SKU', 'Estoque (pares)', 'Dias parado', 'Região', 'Ações'].map(col => (
                  <Table.Th key={col} c="dimmed" fw={600} pr="md" fz="sm"
                    ta={['Estoque (pares)', 'Dias parado', 'Ações'].includes(col) ? 'right' : undefined}>{col}</Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {encalheAlerts.map((alert, i) => (
                <Table.Tr key={i}>
                  <Table.Td pr="md"><Text fw={600}>{alert.product}</Text></Table.Td>
                  <Table.Td pr="md"><Text c="dimmed" className="mono" size="sm">{alert.sku}</Text></Table.Td>
                  <Table.Td pr="md" ta="right"><Text className="mono" fw={600}>{alert.stock.toLocaleString('pt-BR')}</Text></Table.Td>
                  <Table.Td pr="md" ta="right">
                    <Text className="mono" fw={600} c={daysColor(alert.diasEstoque)}>{alert.diasEstoque} dias</Text>
                  </Table.Td>
                  <Table.Td pr="md"><Text c="dimmed">{alert.region}</Text></Table.Td>
                  <Table.Td ta="right"><Group justify="flex-end">{renderAlertAction(alert)}</Group></Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
        {/* celular: cada alerta vira um cartão, sem rolagem lateral */}
        <CellList>
          {encalheAlerts.map(alert => (
            <CellCard key={alert.sku} title={alert.product} actions={renderAlertAction(alert)}>
              <CellField label="SKU"><Text className="mono" c="dimmed">{alert.sku}</Text></CellField>
              <CellField label="Estoque (pares)"><Text className="mono" fw={600}>{alert.stock.toLocaleString('pt-BR')}</Text></CellField>
              <CellField label="Dias parado">
                <Text className="mono" fw={600} c={daysColor(alert.diasEstoque)}>{alert.diasEstoque} dias</Text>
              </CellField>
              <CellField label="Região">{alert.region}</CellField>
            </CellCard>
          ))}
        </CellList>
      </Paper>
    </Stack>
  );
}
