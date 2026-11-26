import { useState } from "react";
import { TabCount } from "./ui/TabCount";
import { useMockLoading } from "../lib/useMockLoading";
import { KpiSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
import { RepRadar } from "./RepRadar";
import { LojistaOrdersSection } from "./LojistaOrdersSection";
import { IndustrySalesSection } from "./IndustrySalesSection";
import { LojistaPurchasesSection } from "./LojistaPurchasesSection";
import {
  Stack, Text, Title, Tabs, SimpleGrid, Button, Group, Box, Menu, Modal, Radio, Textarea,
} from "@mantine/core";
import {
  TrendUpIcon, TrendDownIcon, PackageIcon, WarningIcon, CheckCircleIcon,
  RocketLaunchIcon, UsersThreeIcon, StorefrontIcon, InfoIcon, ClockIcon, XIcon,
  ShoppingCartIcon, PauseIcon, ReceiptIcon, TagIcon, CreditCardIcon, TruckIcon, CopyIcon, type Icon,
} from "@phosphor-icons/react";
import {
  NATURE_META, SIGNAL_META, actByText, bucketOf, days, dismissSignal, isCritical, marginLabel, snoozeSignal, undoSignalAction,
  updatedText, useRadar, type Bucket, type CtaTarget, type Nature, type RadarSignal, type SignalType,
} from "../data/radar";
import {
  CorretivoCard, InformativoCard, InformativoSignalCard, NatureBalance, OportunidadeCard, PreventivoCard, ProativoCard, ResolvedRow,
} from "./radar/InsightCards";
import { productById } from "../data/cartStore";
import { toast } from "../lib/toast";

type Profile = 'admin' | 'rep' | 'lojista';

interface RadarPageProps {
  profile: Profile;
  userName: string;
  /** Quem está operando a conta (preposto do representante); só muda a saudação. */
  greetName?: string;
  /** Todo CTA abre o destino com o contexto aplicado (FR-108). */
  onCta: (target: CtaTarget) => void;
}

const PERIODS: { value: Bucket; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: '15d', label: 'Em 15 dias' },
  { value: '30d', label: 'Nos próximos 30 dias' },
];

const MAX_CARDS = 8;
/** Loja do lojista logado (mock até existir autenticação real; mesma do motor do Radar). */
const LOJISTA_CLIENT_ID = 'CLI-001';

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
  'boleto-a-vencer': ReceiptIcon,
  'reajuste-preco': TagIcon,
  'credito-carrinhos': CreditCardIcon,
  'frete-gratis': TruckIcon,
  'produto-duplicado': CopyIcon,
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

/** Adiar (FR-106): mesmas opções nos dois Radares. */
function SnoozeItems({ options, onSnooze }: { options: number[]; onSnooze: (d: number) => void }) {
  return (
    <>
      <Menu.Label>Adiar</Menu.Label>
      {options.map(d => (
        <Menu.Item key={d} leftSection={<ClockIcon size={16} />} onClick={() => onSnooze(d)}>
          Adiar {days(d)}
        </Menu.Item>
      ))}
    </>
  );
}

/** FR-106: por que aparece, adiar e dispensar (com motivo) — o mesmo menu nas cinco naturezas. */
function SignalMenu({ signal, onWhy, onDismiss }: { signal: RadarSignal; onWhy: () => void; onDismiss: () => void }) {
  return (
    <>
      <Menu.Item leftSection={<InfoIcon size={16} />} onClick={onWhy}>Por que isso aparece</Menu.Item>
      <Menu.Divider />
      <SnoozeItems
        options={[7, 15, 30]}
        onSnooze={d => {
          snoozeSignal(signal.id, d);
          toast.successWithAction('Aviso adiado', `Volta ao Radar em ${d} dias.`, { label: 'Desfazer', onClick: () => undoSignalAction(signal.id) });
        }}
      />
      <Menu.Divider />
      <Menu.Item leftSection={<XIcon size={16} />} onClick={onDismiss}>Dispensar</Menu.Item>
    </>
  );
}

/** Escolhe o desenho do cartão pela natureza do insight. */
function InsightCard({ signal, onCta, onWhy, onDismiss }: {
  signal: RadarSignal; onCta: () => void; onWhy: () => void; onDismiss: () => void;
}) {
  const menu = <SignalMenu signal={signal} onWhy={onWhy} onDismiss={onDismiss} />;
  switch (signal.nature) {
    case 'corretivo': return <CorretivoCard signal={signal} icon={SIGNAL_ICON[signal.type]} onCta={onCta} menu={menu} />;
    case 'proativo': return <ProativoCard signal={signal} onCta={onCta} menu={menu} />;
    case 'preventivo': return <PreventivoCard signal={signal} onCta={onCta} menu={menu} />;
    case 'oportunidade': return <OportunidadeCard signal={signal} onCta={onCta} menu={menu} />;
    default: return <InformativoSignalCard signal={signal} onCta={onCta} menu={menu} />;
  }
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

/** Abas por prazo (Hoje / 15 dias / 30 dias) com contagem; vermelho quando há críticos (BR-52). */
function BucketTabs({ value, onChange, counts, noun = ['pendência', 'pendências'] }: {
  value: Bucket; onChange: (b: Bucket) => void;
  counts: (b: Bucket) => { total: number; critical: number };
  noun?: [string, string];
}) {
  return (
    <Tabs value={value} onChange={(v) => { if (v) onChange(v as Bucket); }}>
      <Tabs.List aria-label="Prazo">
        {PERIODS.map(p => {
          const { total, critical } = counts(p.value);
          return (
            <Tabs.Tab
              key={p.value}
              value={p.value}
              rightSection={<TabCount value={total} critical={critical > 0} label={`${total} ${total === 1 ? noun[0] : noun[1]}${critical ? `, ${critical} críticos` : ''}`} />}
            >
              {p.label}
            </Tabs.Tab>
          );
        })}
      </Tabs.List>
    </Tabs>
  );
}

/** Sinais mostrados na seção de widgets "Pedidos, pagamentos e entregas" em vez de cartões. */
const WIDGET_SIGNALS = new Set<SignalType>(['pedido-atrasado', 'boleto-a-vencer']);

function LojistaRadar({ userName, onCta }: Omit<RadarPageProps, 'profile'>) {
  const [period, setPeriod] = useState<Bucket>('hoje');
  const [showAll, setShowAll] = useState(false);
  const [why, setWhy] = useState<RadarSignal | null>(null);
  const [dismissing, setDismissing] = useState<RadarSignal | null>(null);
  const loading = useMockLoading();
  const radar = useRadar();

  // pedidos, pagamentos e entregas aparecem nos widgets abaixo, não como cartões
  const cards = radar.open.filter(s => !WIDGET_SIGNALS.has(s.type));
  const inBucket = (b: Bucket) => cards.filter(s => bucketOf(s.actByDays) === b);
  const visible = inBucket(period);
  const resolved = radar.resolved.filter(s => !WIDGET_SIGNALS.has(s.type) && (bucketOf(s.actByDays) ?? 'hoje') === period);
  const health = HEALTH[radar.health];
  const total = radar.open.length;
  // Destaque da semana nunca repete um cartão do balde aberto
  const visibleIds = new Set(visible.map(s => s.id));
  const destaque = radar.destaques.find(s => !visibleIds.has(s.id));
  const destaqueProduct = destaque?.productId ? productById(destaque.productId) : undefined;
  const nextWithItems = PERIODS.find(p => p.value !== period && inBucket(p.value).length > 0);

  // Cada natureza tem o seu lugar na página: corretivos em faixas no topo; proativos, preventivos
  // e oportunidades na grade, nessa ordem (oportunidade nunca empurra para o lado um corretivo ou
  // preventivo — regra de proteção 05); informativos numa linha silenciosa de contexto.
  const byNature = (n: Nature) => visible.filter(s => s.nature === n);
  const corretivos = byNature('corretivo');
  const grid = [...byNature('proativo'), ...byNature('preventivo'), ...byNature('oportunidade')];
  const informativos = byNature('informativo');
  const shownGrid = showAll ? grid : grid.slice(0, MAX_CARDS);
  const counts = Object.fromEntries(
    (['corretivo', 'proativo', 'preventivo', 'oportunidade', 'informativo'] as Nature[]).map(n => [n, byNature(n).length]),
  ) as Record<Nature, number>;

  const card = (s: RadarSignal) => (
    <InsightCard key={s.id} signal={s} onCta={() => onCta(s.cta)} onWhy={() => setWhy(s)} onDismiss={() => setDismissing(s)} />
  );

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
        <BucketTabs
          value={period}
          onChange={b => { setPeriod(b); setShowAll(false); }}
          counts={b => { const items = inBucket(b); return { total: items.length, critical: items.filter(isCritical).length }; }}
        />
        {!loading && <NatureBalance counts={counts} />}
      </Stack>

      {loading ? (
        <KpiSkeleton count={3} cols={{ base: 1, sm: 2, lg: 3 }} />
      ) : visible.length > 0 ? (
        <Stack gap="lg">
          {/* Corretivo: agora — faixas de largura total, primeiro na página */}
          {corretivos.length > 0 && <Stack gap="sm">{corretivos.map(card)}</Stack>}

          {/* FR-104: dentro de cada natureza, severidade, depois data de agir, depois impacto (R$) */}
          {(grid.length > 0 || destaque) && (
            <Stack gap="md">
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {shownGrid.filter(s => s.nature !== 'oportunidade').map(card)}
                {/* FR-107: Destaque da semana — abre o grupo de oportunidades, em preto */}
                {destaque && (
                  <OportunidadeCard
                    signal={destaque}
                    featured
                    extra={destaqueProduct ? marginLabel(destaqueProduct) : undefined}
                    onCta={() => onCta(destaque.cta)}
                  />
                )}
                {shownGrid.filter(s => s.nature === 'oportunidade').map(card)}
              </SimpleGrid>
              {grid.length > MAX_CARDS && (
                <Button variant="default" onClick={() => setShowAll(v => !v)} mx="auto">
                  {showAll ? 'Ver menos' : `Ver todas (${grid.length})`}
                </Button>
              )}
            </Stack>
          )}

          {/* Informativo: durante — contexto, sem pedir ação */}
          {informativos.length > 0 && (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">{informativos.map(card)}</SimpleGrid>
          )}
        </Stack>
      ) : (
        <EmptyState
          icon={CheckCircleIcon}
          title={period === 'hoje' ? 'Nada urgente hoje' : 'Nada neste período'}
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
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="sm">
            {resolved.map(s => <ResolvedRow key={s.id} signal={s} />)}
          </SimpleGrid>
        </Stack>
      )}

      {/* Sinais vitais: informativos sem prazo, iguais em todas as abas */}
      {!loading && (
        <Stack gap="sm">
          <Box>
            <Title order={2} fz="lg">Sinais vitais da loja</Title>
            <Text size="sm" c="dimmed">Contexto para decidir: vendas, estoque, crédito e o que o Radar já resolveu</Text>
          </Box>
          <SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="md">
            {radar.vitals.map(v => (
              <InformativoCard key={v.id} label={v.label} value={v.value} context={v.context} viz={v.viz} source={v.source} />
            ))}
          </SimpleGrid>
        </Stack>
      )}

      {/* Widgets: pedidos em análise e aprovados, boletos a vencer e entregas */}
      <LojistaOrdersSection clientId={LOJISTA_CLIENT_ID} onCta={onCta} />

      {/* Compras da loja no período, com o filtro Dia/Semana/Mês/Trimestre/Ano */}
      <LojistaPurchasesSection clientId={LOJISTA_CLIENT_ID} />

      <Modal opened={!!why} onClose={() => setWhy(null)} centered title={<Text fw={600}>Por que isso aparece</Text>}>
        {why && (
          <Stack gap="sm">
            <Text fw={600}>{SIGNAL_META[why.type].code} · {SIGNAL_META[why.type].label} · {why.subject}</Text>
            <Text size="sm" c="dimmed">{NATURE_META[why.nature].label}: {NATURE_META[why.nature].promise.toLowerCase()}</Text>
            <Text>{why.why}</Text>
            <Text size="sm" c="dimmed">{actByText(why.actByDays)} · {updatedText(why.updatedHoursAgo)}</Text>
          </Stack>
        )}
      </Modal>
      <DismissModal key={dismissing?.id} signal={dismissing} onClose={() => setDismissing(null)} />
    </Stack>
  );
}

// Radar da indústria: a central de informações da rede, em widgets
function IndustryRadar({ onCta }: Omit<RadarPageProps, 'profile'>) {
  return (
    <Stack gap="xl">
      <Box>
        <Title order={1}>{getGreeting()}</Title>
        <Text c="dimmed" mt={4}>Como está a rede: pedidos, faturamento, vendedores e clientes para contatar</Text>
      </Box>
      <IndustrySalesSection onCta={onCta} />
    </Stack>
  );
}

// Radar: motor de decisão da loja — o que precisa de ação, agrupado por quando agir.
export function RadarPage({ profile, ...rest }: RadarPageProps) {
  return (
    <Box p={{ base: 'md', sm: 'lg' }} maw={1200} mx="auto" w="100%">
      {profile === 'lojista' ? (
        <LojistaRadar {...rest} />
      ) : profile === 'rep' ? (
        <RepRadar {...rest} />
      ) : (
        <IndustryRadar {...rest} />
      )}
    </Box>
  );
}
