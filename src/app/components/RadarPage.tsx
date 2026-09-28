import { Stack, Paper, Text, ThemeIcon } from "@mantine/core";
import { CrosshairIcon } from "@phosphor-icons/react";

type Profile = 'admin' | 'rep' | 'lojista';

interface RadarPageProps {
  profile: Profile;
}

// Radar: espaço propositivo com ações para reposição de produtos e garantia
// de estoque (armazém x lojista). Conteúdo será estruturado na próxima etapa.
export function RadarPage({ profile }: RadarPageProps) {
  return (
    <Stack p="lg" gap="md" data-profile={profile}>
      <Paper withBorder radius="md" p="xl">
        <Stack align="center" gap="xs" py="xl">
          <ThemeIcon size={48} radius="xl" variant="light">
            <CrosshairIcon size={24} />
          </ThemeIcon>
          <Text fw={600}>Radar</Text>
          <Text size="sm" c="dimmed" ta="center" maw={420}>
            Em breve: ações recomendadas para reposição de produtos e cobertura de estoque.
          </Text>
        </Stack>
      </Paper>
    </Stack>
  );
}
