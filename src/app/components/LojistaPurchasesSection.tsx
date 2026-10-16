import { useMemo, useState } from "react";
import { Grid, Stack } from "@mantine/core";
import { CurrencyCircleDollarIcon, FootprintsIcon, ReceiptIcon, ShoppingBagIcon, ShoppingCartIcon } from "@phosphor-icons/react";
import { useMockLoading } from "../lib/useMockLoading";
import { ChartSkeleton, KpiSkeleton } from "./ui/Skeletons";
import { ThemeHeader } from "./ui/ThemeHeader";
import { KpiWidget, PeriodCaption, PeriodControl, SalesTrendWidget, int, reais } from "./SalesWidgets";
import { getScopeSummary, type SalesPeriod } from "../data/repSales";

// Seção do Radar do lojista com as compras da loja no período, no mesmo formato e com o
// mesmo filtro de período dos Radars da indústria e do representante.
export function LojistaPurchasesSection({ clientId }: { clientId: string }) {
  const [period, setPeriod] = useState<SalesPeriod>('mes');
  const loading = useMockLoading();
  const s = useMemo(() => getScopeSummary({ kind: 'client', clientId }, period), [clientId, period]);

  return (
    <Stack gap="md">
      <ThemeHeader
        icon={ShoppingCartIcon}
        title="Compras no período"
        description="O que a sua loja comprou, comparado com o mesmo período do ano anterior"
        action={<PeriodControl value={period} onChange={setPeriod} />}
      />
      <PeriodCaption summary={s} />

      {loading ? (
        <Stack gap="md">
          <KpiSkeleton count={4} cols={{ base: 2, md: 4 }} />
          <ChartSkeleton height={300} />
        </Stack>
      ) : (
        <Grid gutter="md">
          {([
            { icon: CurrencyCircleDollarIcon, label: 'Compras', metric: 'value', format: reais },
            { icon: ShoppingBagIcon, label: 'Pedidos', metric: 'orders', format: int },
            { icon: ReceiptIcon, label: 'Ticket médio', metric: 'ticket', format: reais },
            { icon: FootprintsIcon, label: 'Pares', metric: 'pairs', format: int },
          ] as const).map(k => (
            <Grid.Col key={k.metric} span={{ base: 6, md: 3 }}>
              <KpiWidget {...k} summary={s} />
            </Grid.Col>
          ))}
          <Grid.Col span={12}>
            <SalesTrendWidget summary={s} title="Compras vs. ano anterior" />
          </Grid.Col>
        </Grid>
      )}
    </Stack>
  );
}
