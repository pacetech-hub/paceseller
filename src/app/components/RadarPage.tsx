import { useState } from "react";
import { useMockLoading } from "../lib/useMockLoading";
import { KpiSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
import {
  Stack, Paper, Text, Title, ThemeIcon, Tabs, Badge, SimpleGrid, Button, Group, Box, Menu, ActionIcon, Modal, Radio, Textarea,
} from "@mantine/core";
import {
  CrosshairIcon, TrendUpIcon, TrendDownIcon, PackageIcon, WarningIcon, ArrowRightIcon, CheckCircleIcon,
  RocketLaunchIcon, UsersThreeIcon, StorefrontIcon, DotsThreeVerticalIcon, InfoIcon, ClockIcon, XIcon,
  ShoppingCartIcon, StarIcon, PauseIcon,
  type Icon,
} from "@phosphor-icons/react";
import {
  SEVERITY_META, SIGNAL_META, actByText, bucketOf, dismissSignal, isCritical, marginLabel, snoozeSignal, undoSignalAction,
  updatedText, useRadar, type Bucket, type CtaTarget, type RadarSignal, type SignalType,
} from "../data/radar";
import { productById } from "../data/cartStore";
import { toast } from "../lib/toast";

type Profile = 'admin' | 'rep' | 'lojista';

interface RadarPageProps {
  profile: Profile;
  userName: string;
  /** Todo CTA abre o destino com o contexto aplicado (FR-108). */
  onCta: (target: CtaTarget) => void;
}

const PERIODS: { value: Bucket; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: '15d', label: 'Em 15 dias' },
  { value: '30d', label: 'Nos próximos 30 dias' },
];

const MAX_CARDS = 8;

const SIGNAL_ICON: Record<SignalType, Icon> = {
  'pedido-atrasado': WarningIcon,
  'estoque-baixo': PackageIcon,
  'sem-giro': PauseIcon,
  'giro-baixo': TrendDownIcon,
  'alta-demanda': TrendUpIcon,
  'produtos-em-alta': TrendUpIcon,
  'oportunidade-perdida': StorefrontIcon,
  lancamento: RocketLaunchIcon,
  benchmark: UsersThreeIcon,
  fechamento: ShoppingCartIcon,
  'aguardando-voce': ClockIcon,
  'abaixo-ano-passado': TrendDownIcon,
  'mix-desbalanceado': ShoppingCartIcon,
};

const HEALTH = {
  saudavel: { title: 'Sua loja está saudável', color: 'teal.8' },
  atencao: { title: 'Sua loja pede atenção', color: 'yellow.8' },
  'em-risco': { title: 'Sua loja está em risco', color: 'red.7' },
} as const;

const DISMISS_REASONS = ['Já resolvi por fora', 'Não faz sentido pra minha loja', 'Dados errados', 'Outro motivo'];

export function getGreeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

// Anatomia do cartão (FR-105): ícone, sobretítulo (sinal · tempo em palavras), métrica principal
// (a situação), assunto, uma linha de contexto, sugestão opcional, um CTA e "Atualizado há".
// Cor pela severidade, nunca pelo tipo; a severidade também vem escrita (não só na cor).
function ActionCard({ signal, onCta, onWhy, onDismiss, resolved }: {
  signal: RadarSignal; onCta: () => void; onWhy: () => void; onDismiss: () => void; resolved?: boolean;
}) {
  const sev = SEVERITY_META[signal.severity];
  const SignalIcon = SIGNAL_ICON[signal.type];
  const base = resolved ? 'gray' : sev.color;
  const tone = resolved ? 'dimmed' : `${sev.color}.8`;
  return (
    <Paper
      withBorder
      p="lg"
      h="100%"
      bg={`var(--mantine-color-${base}-light)`}
      style={{ borderColor: `var(--mantine-color-${base}-light-hover)`, opacity: resolved ? 0.8 : 1 }}
    >
      <Stack gap="xs" h="100%">
        <Group gap="xs" wrap="nowrap" justify="space-between" align="flex-start">
          <Group gap="xs" wrap="nowrap" miw={0}>
            <ThemeIcon variant="light" color={base} size="sm">
              <SignalIcon size={14} />
            </ThemeIcon>
            <Text size="sm" fw={600} c={tone} lineClamp={2}>{SIGNAL_META[signal.type].label} · {signal.timeText}</Text>
          </Group>
          {!resolved && (
            <Menu position="bottom-end" withinPortal shadow="md">
              <Menu.Target>
                <ActionIcon variant="subtle" color="neutral" size="sm" aria-label="Mais opções do aviso" mt={-4} mr={-8}>
                  <DotsThreeVerticalIcon size={18} />
                </ActionIcon>
              </Menu.Target>
              {/* FR-106: por que aparece, adiar e dispensar (com motivo) */}
              <Menu.Dropdown>
                <Menu.Item leftSection={<InfoIcon size={16} />} onClick={onWhy}>Por que isso aparece</Menu.Item>
                <Menu.Divider />
                <Menu.Label>Adiar</Menu.Label>
                {[7, 15, 30].map(d => (
                  <Menu.Item
                    key={d}
                    leftSection={<ClockIcon size={16} />}
                    onClick={() => {
                      snoozeSignal(signal.id, d);
                      toast.successWithAction('Aviso adiado', `Volta ao Radar em ${d} dias.`, { label: 'Desfazer', onClick: () => undoSignalAction(signal.id) });
                    }}
                  >
                    Adiar {d} dias
                  </Menu.Item>
                ))}
                <Menu.Divider />
                <Menu.Item leftSection={<XIcon size={16} />} onClick={onDismiss}>Dispensar</Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
        <Group gap="xs" align="baseline" wrap="wrap">
          <Text fz="xl" fw={700} lh={1.1} c={tone} className="mono">{signal.metric}</Text>
          <Badge size="sm" variant={resolved ? 'light' : 'filled'} color={base}>{resolved ? 'Resolvido' : sev.label}</Badge>
        </Group>
        <Box>
          <Text fw={600}>{signal.subject}</Text>
          <Text size="sm" c="dimmed" mt={4}>{signal.context}</Text>
        </Box>
        {signal.suggestion && !resolved && (
          <Paper p="xs" bg="var(--mantine-color-body)">
            <Text size="sm">{signal.suggestion}</Text>
          </Paper>
        )}
        <Group mt="auto" pt="xs" justify="space-between" wrap="wrap" gap="xs">
          {resolved ? (
            <Text size="sm" c="dimmed">Sai do Radar em até 24 h</Text>
          ) : (
            <Button
              variant="subtle"
              color="neutral"
              ml="calc(var(--button-padding-x) * -1)"
              rightSection={<ArrowRightIcon size={16} />}
              onClick={onCta}
            >
              {signal.ctaLabel}
            </Button>
          )}
          <Stack gap={0} align="flex-end">
            {!resolved && <Text size="sm" fw={600}>{actByText(signal.actByDays)}</Text>}
            <Text size="xs" c="dimmed">{updatedText(signal.updatedHoursAgo)}</Text>
          </Stack>
        </Group>
      </Stack>
    </Paper>
  );
}

function DismissModal({ signal, onClose }: { signal: RadarSignal | null; onClose: () => void }) {
  const [reason, setReason] = useState(DISMISS_REASONS[0]);
  const [other, setOther] = useState('');
  if (!signal) return null;
  const final = reason === 'Outro motivo' ? other.trim() : reason;
  return (
    <Modal opened onClose={onClose} centered title={<Text fw={600}>Dispensar aviso</Text>}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">{SIGNAL_META[signal.type].label} · {signal.subject}. O motivo ajuda a calibrar as regras do Radar.</Text>
        <Radio.Group value={reason} onChange={setReason} label="Motivo">
          <Stack gap="xs" mt={4}>
            {DISMISS_REASONS.map(r => <Radio key={r} value={r} label={r} />)}
          </Stack>
        </Radio.Group>
        {reason === 'Outro motivo' && (
          <Textarea label="Conte o motivo" value={other} onChange={e => setOther(e.currentTarget.value)} maxLength={200} autosize minRows={2} />
        )}
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button
            disabled={!final}
            onClick={() => {
              dismissSignal(signal.id, final);
              toast.successWithAction('Aviso dispensado', 'Ele não aparece mais no Radar.', { label: 'Desfazer', onClick: () => undoSignalAction(signal.id) });
              onClose();
            }}
          >
            Dispensar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

function LojistaRadar({ userName, onCta }: Omit<RadarPageProps, 'profile'>) {
  const [period, setPeriod] = useState<Bucket>('hoje');
  const [showAll, setShowAll] = useState(false);
  const [why, setWhy] = useState<RadarSignal | null>(null);
  const [dismissing, setDismissing] = useState<RadarSignal | null>(null);
  const loading = useMockLoading();
  const radar = useRadar();

  const inBucket = (b: Bucket) => radar.open.filter(s => bucketOf(s.actByDays) === b);
  const visible = inBucket(period);
  const shown = showAll ? visible : visible.slice(0, MAX_CARDS);
  const resolved = radar.resolved.filter(s => (bucketOf(s.actByDays) ?? 'hoje') === period);
  const health = HEALTH[radar.health];
  const total = radar.open.length;
  // Destaque da semana nunca repete um cartão do balde aberto
  const visibleIds = new Set(visible.map(s => s.id));
  const destaque = radar.destaques.find(s => !visibleIds.has(s.id));
  const destaqueProduct = destaque?.productId ? productById(destaque.productId) : undefined;
  const nextWithItems = PERIODS.find(p => p.value !== period && inBucket(p.value).length > 0);

  return (
    <Stack gap="xl">
      <Stack gap="md">
        {/* FR-101/102: saudação, saúde da loja (pela quantidade de críticos) e total de pendências */}
        <Box>
          <Title order={1}>{getGreeting()}, {userName}</Title>
          <Group gap="sm" mt={4} wrap="wrap">
            <Text fw={600} c={health.color}>{health.title}</Text>
            <Text c="dimmed">
              {total} {total === 1 ? 'pendência' : 'pendências'} · {radar.critical} {radar.critical === 1 ? 'crítica' : 'críticas'}
            </Text>
          </Group>
        </Box>

        {/* FR-103: baldes exclusivos pela data de agir, com contagem (BR-52) */}
        <Tabs value={period} onChange={(v) => { if (v) { setPeriod(v as Bucket); setShowAll(false); } }} variant="pills">
          <Tabs.List>
            {PERIODS.map(p => {
              const items = inBucket(p.value);
              const crit = items.filter(isCritical).length;
              return (
                <Tabs.Tab
                  key={p.value}
                  value={p.value}
                  rightSection={
                    <Badge
                      size="sm"
                      circle
                      color={crit > 0 ? 'red' : items.length > 0 ? 'neutral' : 'gray'}
                      variant={items.length > 0 ? 'filled' : 'light'}
                      aria-label={`${items.length} ${items.length === 1 ? 'pendência' : 'pendências'}${crit ? `, ${crit} críticas` : ''}`}
                    >
                      {items.length}
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

      {/* FR-107: Destaque da semana, compacto, em preto */}
      {destaque && !loading && (
        <Paper p="md" bg="neutral.9" c="white">
          <Group justify="space-between" wrap="wrap" gap="sm">
            <Group gap="sm" wrap="nowrap" miw={0}>
              <ThemeIcon color="white" variant="white" c="neutral.9" size="lg"><StarIcon size={18} weight="fill" /></ThemeIcon>
              <Box miw={0}>
                <Text size="sm" fw={600} c="neutral.2">Destaque da semana · {SIGNAL_META[destaque.type].label}</Text>
                <Text fw={700}>{destaque.subject}</Text>
                <Text size="sm" c="neutral.2">
                  {destaque.context}{destaqueProduct ? ` · ${marginLabel(destaqueProduct)}` : ''}
                </Text>
              </Box>
            </Group>
            <Button variant="white" color="neutral" rightSection={<ArrowRightIcon size={16} />} onClick={() => onCta(destaque.cta)}>
              {destaque.ctaLabel}
            </Button>
          </Group>
        </Paper>
      )}

      {loading ? (
        <KpiSkeleton count={3} cols={{ base: 1, sm: 2, lg: 3 }} />
      ) : visible.length > 0 ? (
        <Stack gap="md">
          {/* FR-104: severidade, depois data de agir, depois impacto (R$) */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {shown.map(s => (
              <ActionCard key={s.id} signal={s} onCta={() => onCta(s.cta)} onWhy={() => setWhy(s)} onDismiss={() => setDismissing(s)} />
            ))}
          </SimpleGrid>
          {visible.length > MAX_CARDS && (
            <Button variant="default" onClick={() => setShowAll(v => !v)} mx="auto">
              {showAll ? 'Ver menos' : `Ver todas (${visible.length})`}
            </Button>
          )}
        </Stack>
      ) : (
        <EmptyState
          icon={CheckCircleIcon}
          title={period === 'hoje' ? 'Nada pra hoje' : 'Nada neste período'}
          description="Quando houver reposições, oportunidades ou alertas com prazo neste período, eles aparecem aqui."
          action={nextWithItems
            ? { label: `Ver ${nextWithItems.label.toLowerCase()} (${inBucket(nextWithItems.value).length})`, onClick: () => setPeriod(nextWithItems.value) }
            : { label: 'Ir para o Catálogo', onClick: () => onCta({ kind: 'catalog' }) }}
        />
      )}

      {/* Resolvidos: ficam 24 h com "Resolvido", depois saem do Radar (BR-50) */}
      {!loading && resolved.length > 0 && (
        <Stack gap="sm">
          <Text fw={600}>Resolvidos nas últimas 24 h</Text>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {resolved.map(s => (
              <ActionCard key={s.id} signal={s} resolved onCta={() => {}} onWhy={() => {}} onDismiss={() => {}} />
            ))}
          </SimpleGrid>
        </Stack>
      )}

      <Modal opened={!!why} onClose={() => setWhy(null)} centered title={<Text fw={600}>Por que isso aparece</Text>}>
        {why && (
          <Stack gap="sm">
            <Text fw={600}>{SIGNAL_META[why.type].code} · {SIGNAL_META[why.type].label} · {why.subject}</Text>
            <Text>{why.why}</Text>
            <Text size="sm" c="dimmed">{actByText(why.actByDays)} · {updatedText(why.updatedHoursAgo)}</Text>
          </Stack>
        )}
      </Modal>
      <DismissModal key={dismissing?.id} signal={dismissing} onClose={() => setDismissing(null)} />
    </Stack>
  );
}

// Radar: motor de decisão da loja — o que precisa de ação, agrupado por quando agir.
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
          action={{ label: 'Ir para o Catálogo', onClick: () => rest.onCta({ kind: 'catalog' }) }}
          suggestions={[
            { label: 'Ver produtos em alta', description: 'Produtos com maior giro na região', icon: StorefrontIcon, onClick: () => rest.onCta({ kind: 'catalog', radarFilter: 'alto-giro' }) },
          ]}
        />
      )}
    </Box>
  );
}
