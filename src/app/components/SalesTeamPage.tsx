import { useState } from "react";
import { Stack, Group, Button, SegmentedControl, Paper, Text, Title } from "@mantine/core";
import { CaretLeftIcon, UsersIcon } from "@phosphor-icons/react";
import { useMockLoading } from "../lib/useMockLoading";
import { ListSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
import { PERIOD_OPTIONS, scaleValue, brl, type Period, type SalesEntity } from "./SalesIndicatorsSection";

interface SalesTeamPageProps {
  scope: 'network' | 'own';
  entities: SalesEntity[];
  onBack: () => void;
}

export function SalesTeamPage({ scope, entities, onBack }: SalesTeamPageProps) {
  const [period, setPeriod] = useState<Period>('dia');
  const loading = useMockLoading();

  const ranked = entities
    .map(e => ({ ...e, value: scaleValue(e.monthlySales, period) }))
    .sort((a, b) => b.value - a.value);

  return (
    <Stack gap="xl" maw={1400} mx="auto" p={{ base: 'md', sm: 'lg' }}>
      {/* Link de voltar: margem negativa só para alinhar o texto ao conteúdo */}
      <Button onClick={onBack} variant="subtle" color="neutral" leftSection={<CaretLeftIcon size={16} />} ml={-12} style={{ alignSelf: 'flex-start' }}>
        Voltar para Indicadores
      </Button>

      <Group justify="space-between" wrap="wrap" gap="sm">
        <Title order={1}>
          {scope === 'network' ? 'Representantes e prepostos' : 'Meu time'}
        </Title>
        <SegmentedControl
          value={period}
          onChange={v => setPeriod(v as Period)}
          color="neutral"
          data={PERIOD_OPTIONS.map(opt => ({ value: opt.id, label: opt.label }))}
        />
      </Group>

      {/* Enquanto carrega, skeleton do ranking; título e período continuam visíveis */}
      {loading ? <ListSkeleton rows={6} withAvatar={false} /> : ranked.length === 0 ? (
        // Estado vazio: explica o motivo e oferece a saída (título e período continuam visíveis)
        <EmptyState
          icon={UsersIcon}
          title="Nenhum vendedor com vendas registradas"
          description="Ainda não há representantes ou prepostos com vendas neste período. Escolha outro período acima ou volte para os indicadores."
          action={{ label: 'Voltar para Indicadores', onClick: onBack, forward: false }}
        />
      ) : (
      <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
        <Stack gap="sm">
          {ranked.map((e, i) => (
            <Group key={e.id} gap="sm" wrap="nowrap">
              <Text c="dimmed" fw={600} size="sm" ta="right" w={24} flex="none">{i + 1}</Text>
              <Stack gap={0} miw={0} flex={1}>
                <Text fw={600} truncate>{e.name}</Text>
                <Text c="dimmed" size="sm" truncate>
                  {e.role === 'representante' ? 'Representante' : `Preposto de ${e.parentRep}`}
                </Text>
              </Stack>
              <Text fw={700} flex="none" className="mono">{brl(e.value)}</Text>
            </Group>
          ))}
        </Stack>
      </Paper>
      )}
    </Stack>
  );
}
