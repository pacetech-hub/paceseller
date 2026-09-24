import { useState } from "react";
import { Stack, Group, Button, SegmentedControl, Paper, Text, Title } from "@mantine/core";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { PERIOD_OPTIONS, scaleValue, brl, type Period, type SalesEntity } from "./SalesIndicatorsSection";

interface SalesTeamPageProps {
  scope: 'network' | 'own';
  entities: SalesEntity[];
  onBack: () => void;
}

export function SalesTeamPage({ scope, entities, onBack }: SalesTeamPageProps) {
  const [period, setPeriod] = useState<Period>('dia');

  const ranked = entities
    .map(e => ({ ...e, value: scaleValue(e.monthlySales, period) }))
    .sort((a, b) => b.value - a.value);

  return (
    <Stack gap="lg" maw={1400} mx="auto" p={{ base: 'md', sm: 'lg' }}>
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

      <Paper withBorder radius="md" p={{ base: 'md', sm: 'lg' }}>
        <Stack gap="xs">
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
          {ranked.length === 0 && (
            // Estado vazio: explica o motivo e oferece a saída
            <Stack gap="sm" align="center" py="lg">
              <Text c="dimmed" ta="center">
                Nenhum vendedor com vendas registradas neste período. Escolha outro período acima ou volte para os indicadores.
              </Text>
              <Button onClick={onBack} variant="default" color="neutral">Voltar para Indicadores</Button>
            </Stack>
          )}
        </Stack>
      </Paper>
    </Stack>
  );
}
