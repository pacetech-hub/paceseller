import { ActionIcon, Box, Button, Group, Paper, Progress, Text } from "@mantine/core";
import { ArrowRightIcon, StorefrontIcon, XIcon } from "@phosphor-icons/react";
import { ONBOARDING_STEPS, hideOnboardingBanner, resumeOnboarding, useOnboarding } from "../data/onboarding";

/** Aviso no topo do Radar quando o lojista pulou a configuração da loja. */
export function OnboardingBanner() {
  const ob = useOnboarding();
  if (ob.status !== 'pulado' || ob.bannerHidden) return null;
  const total = ONBOARDING_STEPS.length;
  const done = Math.min(ob.completed, total);
  const left = total - done;
  const missing = left === 1 ? 'Falta conectar o estoque' : `Faltam ${left} etapas`;

  return (
    <Paper withBorder p="md" role="region" aria-label="Configuração da loja">
      <Group gap="md" wrap="nowrap" align="center">
        <Box visibleFrom="xs" style={{ flex: 'none' }}>
          <StorefrontIcon size={28} aria-hidden />
        </Box>
        <Box flex={1} miw={0}>
          <Text fw={600}>Conclua a configuração da loja</Text>
          <Text size="sm" c="dimmed">{missing} · o Radar recomenda com mais precisão</Text>
          <Group gap="sm" mt={8} wrap="nowrap" maw={260}>
            <Progress value={(done / total) * 100} size="sm" flex={1} color="brand" aria-label={`${done} de ${total} etapas`} />
            <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>{done} de {total}</Text>
          </Group>
        </Box>
        <Group gap={4} wrap="nowrap" style={{ flex: 'none' }}>
          <Button rightSection={<ArrowRightIcon size={16} />} onClick={resumeOnboarding}>Concluir</Button>
          <ActionIcon variant="subtle" color="gray" size="lg" onClick={hideOnboardingBanner} aria-label="Fechar aviso">
            <XIcon size={18} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  );
}
