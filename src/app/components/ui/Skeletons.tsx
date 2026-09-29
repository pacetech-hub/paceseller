import { Group, Paper, SimpleGrid, Skeleton, Stack, type SimpleGridProps } from "@mantine/core";

// Skeletons com o mesmo formato do conteúdo final (lista, tabela, cartões, indicadores),
// para a pessoa já prever onde cada informação vai aparecer enquanto os dados carregam.

/** Linhas de lista: avatar/ícone + título + linha de apoio. */
export function ListSkeleton({ rows = 6, withAvatar = true }: { rows?: number; withAvatar?: boolean }) {
  return (
    <Paper withBorder aria-busy="true" aria-label="Carregando lista">
      {Array.from({ length: rows }).map((_, i) => (
        <Group key={i} p="md" gap="md" wrap="nowrap" style={{ borderTop: i ? '1px solid var(--mantine-color-default-border)' : undefined }}>
          {withAvatar && <Skeleton height={40} width={40} circle />}
          <Stack gap={8} flex={1}>
            <Skeleton height={16} width="45%" />
            <Skeleton height={12} width="70%" />
          </Stack>
        </Group>
      ))}
    </Paper>
  );
}

/** Tabela: cabeçalho + linhas com a mesma quantidade de colunas. */
export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <Paper withBorder p="md" aria-busy="true" aria-label="Carregando tabela">
      <Stack gap="md">
        <Group gap="md" wrap="nowrap">
          {Array.from({ length: cols }).map((_, c) => <Skeleton key={c} height={14} flex={1} />)}
        </Group>
        {Array.from({ length: rows }).map((_, r) => (
          <Group key={r} gap="md" wrap="nowrap">
            {Array.from({ length: cols }).map((_, c) => <Skeleton key={c} height={16} flex={1} />)}
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}

/** Grade de cartões (produtos, campanhas): imagem + título + duas linhas. */
export function CardGridSkeleton({ count = 6, cols = { base: 2, sm: 3 }, imageRatio = 1 }: {
  count?: number; cols?: SimpleGridProps['cols']; imageRatio?: number;
}) {
  return (
    <SimpleGrid cols={cols} spacing="md" aria-busy="true" aria-label="Carregando itens">
      {Array.from({ length: count }).map((_, i) => (
        <Paper key={i} withBorder p="md">
          <Skeleton style={{ aspectRatio: String(imageRatio) }} mb="md" />
          <Skeleton height={16} width="70%" mb={8} />
          <Skeleton height={12} width="40%" mb={8} />
          <Skeleton height={20} width="50%" />
        </Paper>
      ))}
    </SimpleGrid>
  );
}

/** Indicadores (KPIs): rótulo + número grande. */
export function KpiSkeleton({ count = 4, cols = { base: 2, lg: 4 } }: { count?: number; cols?: SimpleGridProps['cols'] }) {
  return (
    <SimpleGrid cols={cols} spacing="md" aria-busy="true" aria-label="Carregando indicadores">
      {Array.from({ length: count }).map((_, i) => (
        <Paper key={i} withBorder p="md">
          <Skeleton height={12} width="60%" mb="sm" />
          <Skeleton height={28} width="45%" />
        </Paper>
      ))}
    </SimpleGrid>
  );
}

/** Bloco de gráfico. */
export function ChartSkeleton({ height = 260 }: { height?: number }) {
  return (
    <Paper withBorder p="md" aria-busy="true" aria-label="Carregando gráfico">
      <Skeleton height={16} width="30%" mb="md" />
      <Skeleton height={height} />
    </Paper>
  );
}
