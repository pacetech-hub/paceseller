import { useState } from "react";
import {
  Stack, Paper, Text, Title, ThemeIcon, Tabs, Badge, SimpleGrid, Button, Group, Box,
} from "@mantine/core";
import {
  CrosshairIcon, TrendUpIcon, PackageIcon, WarningIcon, ArrowRightIcon, CheckCircleIcon,
  type Icon,
} from "@phosphor-icons/react";

type Profile = 'admin' | 'rep' | 'lojista';
type Period = 'hoje' | '15d' | '30d';
type Tone = 'opportunity' | 'stock' | 'alert';

interface RadarPageProps {
  profile: Profile;
  userName: string;
  onOpenProduct: (productId: string) => void;
  onRestock: (productId: string, quantity: number) => void;
  onOpenOrder: (orderId: string) => void;
}

interface RadarAction {
  id: string;
  period: Period;
  tone: Tone;
  eyebrow: string;
  metric: string;
  title: string;
  description: string;
  suggestion?: string;
  ctaLabel: string;
  onAction: () => void;
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: '15d', label: 'Em 15 dias' },
  { value: '30d', label: 'Nos próximos 30 dias' },
];

const TONES: Record<Tone, { color: string; icon: Icon }> = {
  opportunity: { color: 'teal.7', icon: TrendUpIcon },
  stock: { color: 'yellow.8', icon: PackageIcon },
  alert: { color: 'red.7', icon: WarningIcon },
};

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function ActionCard({ action }: { action: RadarAction }) {
  const tone = TONES[action.tone];
  const ToneIcon = tone.icon;
  return (
    <Paper withBorder p="lg" h="100%">
      <Stack gap="xs" h="100%">
        <Group gap={8} wrap="nowrap">
          <ThemeIcon variant="light" color={tone.color} size="sm">
            <ToneIcon size={14} />
          </ThemeIcon>
          <Text size="sm" fw={600} c={tone.color}>{action.eyebrow}</Text>
        </Group>
        <Text fz={32} fw={700} lh={1.1} c={tone.color} className="mono">{action.metric}</Text>
        <Box>
          <Text fw={600}>{action.title}</Text>
          <Text size="sm" c="dimmed" mt={2}>{action.description}</Text>
        </Box>
        {action.suggestion && (
          <Paper p="xs" bg="var(--mantine-color-gray-0)">
            <Text size="sm">{action.suggestion}</Text>
          </Paper>
        )}
        <Group mt="auto">
          {/* Botão terciário alinhado ao texto do card (compensa o padding lateral) */}
          <Button
            variant="subtle"
            color="neutral"
            ml="calc(var(--button-padding-x) * -1)"
            rightSection={<ArrowRightIcon size={16} />}
            onClick={action.onAction}
          >
            {action.ctaLabel}
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
}

function LojistaRadar({ userName, onOpenProduct, onRestock, onOpenOrder }: Omit<RadarPageProps, 'profile'>) {
  const [period, setPeriod] = useState<Period>('hoje');

  const actions: RadarAction[] = [
    {
      id: 'demand-fusion',
      period: 'hoje',
      tone: 'opportunity',
      eyebrow: 'Oportunidade · Alta demanda',
      metric: '+34%',
      title: 'Tênis Tesla Fusion Black Red',
      description: 'Vendas na sua região neste mês',
      ctaLabel: 'Ver produto',
      onAction: () => onOpenProduct('P009'),
    },
    {
      id: 'low-stock-coil',
      period: 'hoje',
      tone: 'stock',
      eyebrow: 'Estoque baixo · 12 dias',
      metric: '32 un.',
      title: 'Linha Coil',
      description: 'Vendendo mais rápido que a reposição atual',
      suggestion: 'Sugestão: repor 32 unidades',
      ctaLabel: 'Repor agora',
      onAction: () => onRestock('P002', 32),
    },
    {
      id: 'late-order-4790-1',
      period: 'hoje',
      tone: 'alert',
      eyebrow: 'Alerta',
      metric: '2 dias',
      title: 'Pedido #4790-1 atrasou',
      description: 'Previsão de entrega vencida',
      ctaLabel: 'Ver pedido',
      onAction: () => onOpenOrder('4790-1'),
    },
  ];

  const visible = actions.filter(a => a.period === period);

  return (
    <Stack gap="lg">
      <Title order={1}>{getGreeting()}, {userName}</Title>

      <Tabs value={period} onChange={(v) => v && setPeriod(v as Period)} variant="pills">
        <Tabs.List>
          {PERIODS.map(p => {
            const count = actions.filter(a => a.period === p.value).length;
            return (
              <Tabs.Tab
                key={p.value}
                value={p.value}
                rightSection={
                  <Badge
                    size="sm"
                    circle
                    color={count > 0 ? 'red' : 'gray'}
                    variant={count > 0 ? 'filled' : 'light'}
                    aria-label={`${count} ${count === 1 ? 'ação sugerida' : 'ações sugeridas'}`}
                  >
                    {count}
                  </Badge>
                }
              >
                {p.label}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
      </Tabs>

      {visible.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {visible.map(a => <ActionCard key={a.id} action={a} />)}
        </SimpleGrid>
      ) : (
        <Paper withBorder p="xl">
          <Stack align="center" gap="xs" py="lg">
            <ThemeIcon size={48} radius="xl" variant="light" color="teal">
              <CheckCircleIcon size={24} />
            </ThemeIcon>
            <Text fw={600}>Nenhuma ação sugerida para este período</Text>
            <Text size="sm" c="dimmed" ta="center" maw={420}>
              Quando houver reposições, oportunidades ou alertas, eles aparecem aqui.
            </Text>
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

// Radar: espaço propositivo com ações para reposição de produtos e garantia
// de estoque (armazém x lojista).
export function RadarPage({ profile, ...rest }: RadarPageProps) {
  return (
    <Box p={{ base: 'md', sm: 'lg' }} maw={1200} mx="auto" w="100%">
      {profile === 'lojista' ? (
        <LojistaRadar {...rest} />
      ) : (
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
      )}
    </Box>
  );
}
