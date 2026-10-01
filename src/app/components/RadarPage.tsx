import { useState } from "react";
import { useMockLoading } from "../lib/useMockLoading";
import { KpiSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
import {
  Stack, Paper, Text, Title, ThemeIcon, Tabs, Badge, SimpleGrid, Button, Group, Box,
} from "@mantine/core";
import {
  CrosshairIcon, TrendUpIcon, TrendDownIcon, PackageIcon, WarningIcon, ArrowRightIcon, CheckCircleIcon,
  RocketLaunchIcon, UsersThreeIcon, StorefrontIcon,
  type Icon,
} from "@phosphor-icons/react";

type Profile = 'admin' | 'rep' | 'lojista';
type Period = 'hoje' | '15d' | '30d';
type Tone = 'opportunity' | 'stock' | 'alert' | 'launch' | 'benchmark' | 'lowTurnover';

interface RadarPageProps {
  profile: Profile;
  userName: string;
  onOpenProduct: (productId: string) => void;
  onRestock: (productId: string, quantity: number) => void;
  onOpenOrder: (orderId: string) => void;
  onOpenCatalog: (opts: { line?: string; sortBy?: string }) => void;
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
  // a ação mais importante do período: único botão cheio da grade
}

const PERIODS: { value: Period; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: '15d', label: 'Em 15 dias' },
  { value: '30d', label: 'Nos próximos 30 dias' },
];

// Cada tipo de ação tem uma cor de status; o cartão inteiro usa o fundo claro dessa cor
// (variáveis "-light" do Mantine, que também se ajustam no modo escuro) e uma borda no mesmo tom,
// para o tipo ser reconhecido de relance.
const TONES: Record<Tone, { color: string; base: string; icon: Icon }> = {
  opportunity: { color: 'teal.7', base: 'teal', icon: TrendUpIcon },
  stock: { color: 'yellow.8', base: 'yellow', icon: PackageIcon },
  alert: { color: 'red.7', base: 'red', icon: WarningIcon },
  // lançamento e benchmark são informativos: neutros (azul fica só para links)
  launch: { color: 'neutral.9', base: 'neutral', icon: RocketLaunchIcon },
  benchmark: { color: 'gray.7', base: 'gray', icon: UsersThreeIcon },
  lowTurnover: { color: 'gray.7', base: 'gray', icon: TrendDownIcon },
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
    <Paper
      withBorder
      p="lg"
      h="100%"
      bg={`var(--mantine-color-${tone.base}-light)`}
      style={{ borderColor: `var(--mantine-color-${tone.base}-light-hover)` }}
    >
      <Stack gap="xs" h="100%">
        <Group gap="xs" wrap="nowrap">
          <ThemeIcon variant="light" color={tone.color} size="sm">
            <ToneIcon size={14} />
          </ThemeIcon>
          <Text size="sm" fw={600} c={tone.color}>{action.eyebrow}</Text>
        </Group>
        <Text fz="xl" fw={700} lh={1.1} c={tone.color} className="mono">{action.metric}</Text>
        <Box>
          <Text fw={600}>{action.title}</Text>
          <Text size="sm" c="dimmed" mt={4}>{action.description}</Text>
        </Box>
        {action.suggestion && (
          <Paper p="xs" bg="var(--mantine-color-body)">
            <Text size="sm">{action.suggestion}</Text>
          </Paper>
        )}
        <Group mt="auto" pt="xs">
          {/* Todas as ações do Radar são terciárias (subtle): o destaque fica com a cor do cartão,
              e o botão alinha o texto ao conteúdo (compensa o padding lateral) */}
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

function LojistaRadar({ userName, onOpenProduct, onRestock, onOpenOrder, onOpenCatalog }: Omit<RadarPageProps, 'profile'>) {
  const [period, setPeriod] = useState<Period>('hoje');
  const loading = useMockLoading();

  const actions: RadarAction[] = [
    {
      id: 'demand-fusion',
      period: 'hoje',
      tone: 'opportunity',
      eyebrow: 'Oportunidade · Alta demanda',
      metric: '+34%',
      title: 'Tênis Tesla Fusion Black Red',
      description: 'Vendas na sua região neste mês',
      ctaLabel: 'Ver Produto',
      onAction: () => onOpenProduct('P009'),
    },
    {
      id: 'low-stock-coil',
      period: 'hoje',
      tone: 'stock',
      eyebrow: 'Estoque baixo · 12 dias',
      metric: '32 pares',
      title: 'Linha Coil',
      description: 'Vendendo mais rápido que a reposição atual',
      suggestion: 'Sugestão: repor 32 pares',
      ctaLabel: 'Repor Agora',
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
      ctaLabel: 'Ver Pedido',
      onAction: () => onOpenOrder('4790-1'),
    },
    {
      id: 'low-stock-tg2',
      period: '15d',
      tone: 'stock',
      eyebrow: 'Estoque baixo · 15 dias',
      metric: '60 pares',
      title: 'Tênis Tesla TG II Black Reflect',
      description: 'Sugestão de reposição antes de faltar',
      suggestion: 'Sugestão: repor 60 pares',
      ctaLabel: 'Repor Agora',
      onAction: () => onRestock('P010', 60),
    },
    {
      id: 'launch-fusion-mix',
      period: '15d',
      tone: 'launch',
      eyebrow: 'Lançamento · 12 dias',
      metric: '6 lojas',
      title: 'Linha Fusion',
      description: 'Ainda não chegou no seu mix — lojas parecidas já compram',
      ctaLabel: 'Ver Coleção',
      onAction: () => onOpenCatalog({ line: 'Fusion' }),
    },
    {
      id: 'launch-tg2-low-turnover',
      period: '15d',
      tone: 'launch',
      eyebrow: 'Lançamento · 28 dias',
      metric: 'Giro baixo',
      title: 'Tênis Tesla TG II Black Reflect',
      description: 'Ainda com giro abaixo do esperado desde o lançamento',
      ctaLabel: 'Ver Produto',
      onAction: () => onOpenProduct('P010'),
    },
    {
      id: 'benchmark-coil-black-white',
      period: '15d',
      tone: 'benchmark',
      eyebrow: 'Benchmark',
      metric: '+30%',
      title: 'Lojas parecidas venderam mais',
      description: 'Modelo Coil Black White, mesma faixa de porte',
      ctaLabel: 'Comparar',
      onAction: () => onOpenProduct('P011'),
    },
    {
      id: 'no-turnover-flow-xl',
      period: '30d',
      tone: 'lowTurnover',
      eyebrow: 'Baixo giro',
      metric: 'Sem giro',
      title: 'Tênis Tesla Flow XL Black',
      description: 'Sem giro nos últimos 30 dias — bom candidato pra impulsionar com campanha',
      ctaLabel: 'Ver Produto',
      onAction: () => onOpenProduct('P008'),
    },
    {
      id: 'trending-skus',
      period: '30d',
      tone: 'opportunity',
      eyebrow: 'Produtos em alta',
      metric: '6 SKUs',
      title: 'Vendendo acima da média',
      description: 'Coil Black White, Denim, Hertz All Black Furta Cor e mais 3',
      ctaLabel: 'Ver Produtos em Alta',
      onAction: () => onOpenCatalog({ sortBy: 'mais vendidos' }),
    },
  ];

  const visible = actions.filter(a => a.period === period);

  return (
    <Stack gap="xl">
      {/* cabeçalho (saudação + períodos) mais junto; a grade de ações é outra seção */}
      <Stack gap="md">
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
      </Stack>

      {loading ? (
        <KpiSkeleton count={3} cols={{ base: 1, sm: 2, lg: 3 }} />
      ) : visible.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {visible.map(a => <ActionCard key={a.id} action={a} />)}
        </SimpleGrid>
      ) : (
        <EmptyState
          icon={CheckCircleIcon}
          title="Nenhuma ação sugerida para este período"
          description="Quando houver reposições, oportunidades ou alertas, eles aparecem aqui. Enquanto isso, confira as novidades do catálogo."
          action={{ label: 'Ir para o Catálogo', onClick: () => onOpenCatalog({}) }}
          suggestions={[
            { label: 'Ver mais vendidos', description: 'Produtos com maior giro para repor agora', icon: TrendUpIcon, onClick: () => onOpenCatalog({ sortBy: 'mais vendidos' }) },
            { label: 'Ver lançamentos da linha Fusion', description: 'Ainda fora do seu mix — lojas parecidas já compram', icon: RocketLaunchIcon, onClick: () => onOpenCatalog({ line: 'Fusion' }) },
            ...(period !== 'hoje'
              ? [{ label: 'Ver ações de hoje', description: 'Reposições e alertas que pedem atenção agora', icon: CrosshairIcon, onClick: () => setPeriod('hoje') }]
              : []),
          ]}
        />
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
        <EmptyState
          icon={CrosshairIcon}
          title="Radar em breve para o seu perfil"
          description="Em breve: ações recomendadas para reposição de produtos e cobertura de estoque. Enquanto isso, acompanhe o catálogo."
          action={{ label: 'Ir para o Catálogo', onClick: () => rest.onOpenCatalog({}) }}
          suggestions={[
            { label: 'Ver mais vendidos', description: 'Produtos com maior giro na rede', icon: StorefrontIcon, onClick: () => rest.onOpenCatalog({ sortBy: 'mais vendidos' }) },
          ]}
        />
      )}
    </Box>
  );
}
