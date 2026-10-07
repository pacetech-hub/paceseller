import { useState, type ReactNode } from "react";
import { useMockLoading } from "../lib/useMockLoading";
import { KpiSkeleton } from "./ui/Skeletons";
import { EmptyState } from "./ui/EmptyState";
import { ThemeHeader } from "./ui/ThemeHeader";
import { RepSalesSection } from "./RepSalesSection";
import {
  Stack, Paper, Text, Title, ThemeIcon, Tabs, Badge, SimpleGrid, Button, Group, Box, Menu, ActionIcon, Modal, Radio, Textarea,
} from "@mantine/core";
import {
  CrosshairIcon, TrendUpIcon, TrendDownIcon, PackageIcon, WarningIcon, ArrowRightIcon, CheckCircleIcon,
  RocketLaunchIcon, UsersThreeIcon, StorefrontIcon, DotsThreeVerticalIcon, InfoIcon, ClockIcon, XIcon,
  ShoppingCartIcon, StarIcon, PauseIcon, ReceiptIcon, PhoneCallIcon, CurrencyCircleDollarIcon, HourglassIcon,
  ArrowCounterClockwiseIcon, CalendarCheckIcon, PaperPlaneTiltIcon, HandshakeIcon, ChatCircleDotsIcon,
  type Icon,
} from "@phosphor-icons/react";
import {
  SEVERITY_META, SIGNAL_META, actByText, bucketOf, days, dismissSignal, isCritical, marginLabel, snoozeSignal, undoSignalAction,
  updatedText, useRadar, type Bucket, type CtaTarget, type RadarSignal, type SignalType,
} from "../data/radar";
import { productById } from "../data/cartStore";
import { formatCurrency } from "../data/mockData";
import {
  CONTACT_REASON_META, markContacted, snoozeContact, undoContactAction, useRepRadar,
  type ContactPriority, type ContactReason,
} from "../data/repRadar";
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
  'boleto-a-vencer': ReceiptIcon,
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

// Anatomia do cartão (FR-105), no formato do layout: ícone em bloco, sobretítulo em caixa-alta
// mono (severidade · sinal), métrica principal grande (a situação), assunto, uma linha de contexto,
// sugestão em mono, CTA como link na cor do cartão e, no rodapé, prazo e "Atualizado há".
// Cor pela severidade, nunca pelo tipo; a severidade também vem escrita (não só na cor).
// "highlight" = Destaque da semana (cartão preto); "resolved" = resolvido nas últimas 24 h.
// O mesmo cartão serve ao Radar do lojista (sinais) e ao do representante (cartões temáticos).
type CardVariant = 'default' | 'highlight' | 'resolved';

function RadarCard({
  icon: CardIcon, color, eyebrow, metric, subject, context, suggestion, ctaLabel, onCta, footer, menu,
  variant = 'default', resolvedText = 'Sai do Radar em até 24 h',
}: {
  icon: Icon; color: string; eyebrow: string; metric: string; subject: string; context: string;
  suggestion?: string; ctaLabel: string; onCta: () => void; footer: string;
  /** Itens do menu "Mais opções" (sem menu nos resolvidos). */
  menu?: ReactNode; variant?: CardVariant; resolvedText?: string;
}) {
  const highlight = variant === 'highlight';
  const resolved = variant === 'resolved';
  const base = resolved ? 'gray' : color;
  // texto na cor do status: tom 8 sobre o fundo claro; no destaque, branco sobre preto
  const tone = highlight ? 'white' : resolved ? 'dimmed' : `${color}.8`;
  const muted = highlight ? 'neutral.3' : 'dimmed';

  return (
    <Paper
      withBorder
      p="lg"
      h="100%"
      bg={highlight ? 'neutral.9' : `var(--mantine-color-${base}-light)`}
      // no destaque a borda só aparece no modo escuro, para o cartão preto não sumir no fundo
      style={highlight
        ? { borderColor: 'light-dark(var(--mantine-color-neutral-9), var(--mantine-color-neutral-7))' }
        : { borderColor: `var(--mantine-color-${base}-light-hover)`, opacity: resolved ? 0.8 : 1 }}
    >
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <ThemeIcon
            size={40}
            radius="md"
            variant="filled"
            color={highlight ? 'neutral.7' : base}
            aria-hidden
          >
            <CardIcon size={20} weight={highlight ? 'fill' : 'regular'} />
          </ThemeIcon>
          {!resolved && menu && (
            <Menu position="bottom-end" withinPortal shadow="md">
              <Menu.Target>
                <ActionIcon variant="subtle" color={highlight ? 'gray.0' : 'neutral'} aria-label="Mais opções do aviso" mr={-8}>
                  <DotsThreeVerticalIcon size={20} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>{menu}</Menu.Dropdown>
            </Menu>
          )}
        </Group>

        <Stack gap={6}>
          <Text size="xs" fw={700} tt="uppercase" ff="monospace" lts={0.5} c={highlight ? muted : tone} lineClamp={2}>
            {eyebrow}
          </Text>
          <Text fz={32} fw={700} lh={1.1} c={tone}>{metric}</Text>
        </Stack>

        <Box>
          <Text fw={600} c={highlight ? 'white' : undefined}>{subject}</Text>
          <Text size="sm" c={muted} mt={4}>{context}</Text>
          {suggestion && !resolved && (
            <Text size="sm" fw={700} ff="monospace" mt="sm" c={highlight ? 'white' : undefined}>{suggestion}</Text>
          )}
        </Box>

        <Stack gap={4} mt="auto">
          {resolved ? (
            <Text size="sm" c="dimmed">{resolvedText}</Text>
          ) : (
            <Group>
              {/* CTA como link na cor do cartão; o padding lateral é compensado para alinhar ao texto */}
              <Button
                variant="transparent"
                color={highlight ? 'white' : color}
                c={tone}
                px={0}
                fw={600}
                fz="md"
                rightSection={<ArrowRightIcon size={18} />}
                onClick={onCta}
              >
                {ctaLabel}
              </Button>
            </Group>
          )}
          <Text size="xs" c={muted}>{footer}</Text>
        </Stack>
      </Stack>
    </Paper>
  );
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

function ActionCard({ signal, onCta, onWhy, onDismiss, variant = 'default', marginText }: {
  signal: RadarSignal; onCta: () => void; onWhy?: () => void; onDismiss?: () => void;
  variant?: CardVariant; marginText?: string;
}) {
  const sev = SEVERITY_META[signal.severity];
  const highlight = variant === 'highlight';
  const resolved = variant === 'resolved';
  const eyebrow = highlight
    ? `Destaque da semana · ${SIGNAL_META[signal.type].label}`
    : `${resolved ? 'Resolvido' : sev.label} · ${SIGNAL_META[signal.type].label}`;

  return (
    <RadarCard
      icon={highlight ? StarIcon : SIGNAL_ICON[signal.type]}
      color={sev.color}
      eyebrow={eyebrow}
      metric={signal.metric}
      subject={signal.subject}
      context={marginText ? `${signal.context} · ${marginText}` : signal.context}
      suggestion={signal.suggestion}
      ctaLabel={signal.ctaLabel}
      onCta={onCta}
      variant={variant}
      // prazo em palavras + data de agir (BR-40/42) e atualização dos dados (BR-60)
      footer={`${signal.timeText}${resolved ? '' : ` · ${actByText(signal.actByDays)}`} · ${updatedText(signal.updatedHoursAgo)}`}
      menu={onWhy && onDismiss && (
        // FR-106: por que aparece, adiar e dispensar (com motivo)
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
      )}
    />
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

/** Abas por prazo (Hoje / 15 dias / 30 dias) com contagem; vermelho quando há críticos (BR-52). */
function BucketTabs({ value, onChange, counts, noun = ['pendência', 'pendências'] }: {
  value: Bucket; onChange: (b: Bucket) => void;
  counts: (b: Bucket) => { total: number; critical: number };
  noun?: [string, string];
}) {
  return (
    <Tabs value={value} onChange={(v) => { if (v) onChange(v as Bucket); }} variant="pills">
      <Tabs.List>
        {PERIODS.map(p => {
          const { total, critical } = counts(p.value);
          return (
            <Tabs.Tab
              key={p.value}
              value={p.value}
              rightSection={
                <Badge
                  size="sm"
                  circle
                  color={critical > 0 ? 'red' : total > 0 ? 'neutral' : 'gray'}
                  variant={total > 0 ? 'filled' : 'light'}
                  aria-label={`${total} ${total === 1 ? noun[0] : noun[1]}${critical ? `, ${critical} críticos` : ''}`}
                >
                  {total}
                </Badge>
              }
            >
              {p.label}
            </Tabs.Tab>
          );
        })}
      </Tabs.List>
    </Tabs>
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
        <BucketTabs
          value={period}
          onChange={b => { setPeriod(b); setShowAll(false); }}
          counts={b => { const items = inBucket(b); return { total: items.length, critical: items.filter(isCritical).length }; }}
        />
      </Stack>

      {loading ? (
        <KpiSkeleton count={3} cols={{ base: 1, sm: 2, lg: 3 }} />
      ) : visible.length > 0 ? (
        <Stack gap="md">
          {/* FR-104: severidade, depois data de agir, depois impacto (R$) */}
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {/* FR-107: Destaque da semana — primeiro cartão, em preto */}
            {destaque && (
              <ActionCard
                signal={destaque}
                variant="highlight"
                marginText={destaqueProduct ? marginLabel(destaqueProduct) : undefined}
                onCta={() => onCta(destaque.cta)}
              />
            )}
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
              <ActionCard key={s.id} signal={s} variant="resolved" onCta={() => {}} />
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

const CONTACT_ICON: Record<ContactReason, Icon> = {
  'carrinho-esperando': ShoppingCartIcon,
  cobranca: CurrencyCircleDollarIcon,
  'recompra-atrasada': HourglassIcon,
  'queda-compras': TrendDownIcon,
  reativacao: ArrowCounterClockwiseIcon,
  'sugestao-sem-resposta': PaperPlaneTiltIcon,
  'reposicao-cliente': PackageIcon,
  'pos-venda': HandshakeIcon,
  'recompra-prevista': CalendarCheckIcon,
};

function ContactCard({ contact, onCta, onWhy, resolved }: {
  contact: ContactPriority; onCta: () => void; onWhy?: () => void; resolved?: boolean;
}) {
  const sev = SEVERITY_META[contact.severity];
  const extra = contact.otherReasons.length;
  return (
    <RadarCard
      icon={CONTACT_ICON[contact.reason]}
      color={sev.color}
      eyebrow={`${resolved ? 'Contatado' : sev.label} · ${CONTACT_REASON_META[contact.reason].label}`}
      metric={contact.metric}
      subject={contact.clientName}
      context={extra > 0 ? `${contact.context} · +${extra} ${extra === 1 ? 'motivo' : 'motivos'}` : contact.context}
      suggestion={`${contact.suggestion} · ${contact.channel}`}
      ctaLabel={contact.ctaLabel}
      onCta={onCta}
      variant={resolved ? 'resolved' : 'default'}
      resolvedText="Contato registrado · sai do Radar em até 24 h"
      footer={`${contact.timeText}${resolved ? '' : ` · ${actByText(contact.actByDays).replace('agir', 'contatar')}`} · ${updatedText(contact.updatedHoursAgo)}`}
      menu={onWhy && (
        <>
          <Menu.Item leftSection={<InfoIcon size={16} />} onClick={onWhy}>Por que isso aparece</Menu.Item>
          <Menu.Item
            leftSection={<PhoneCallIcon size={16} />}
            onClick={() => {
              markContacted(contact.id);
              toast.successWithAction('Contato registrado', `${contact.clientName} sai das prioridades.`, { label: 'Desfazer', onClick: () => undoContactAction(contact.id) });
            }}
          >
            Marcar como contatado
          </Menu.Item>
          <Menu.Divider />
          <SnoozeItems
            options={[1, 3, 7]}
            onSnooze={d => {
              snoozeContact(contact.id, d);
              toast.successWithAction('Contato adiado', `Volta às prioridades em ${days(d)}.`, { label: 'Desfazer', onClick: () => undoContactAction(contact.id) });
            }}
          />
        </>
      )}
    />
  );
}

function RepRadar({ userName, onCta }: Omit<RadarPageProps, 'profile'>) {
  const [period, setPeriod] = useState<Bucket>('hoje');
  const [showAll, setShowAll] = useState(false);
  const [why, setWhy] = useState<ContactPriority | null>(null);
  const loading = useMockLoading();
  const radar = useRepRadar(userName);
  const { contacts, urgent } = radar;
  // mesmos baldes do lojista, pela data de contatar
  const inBucket = (b: Bucket) => contacts.filter(c => bucketOf(c.actByDays) === b);
  const visible = inBucket(period);
  const shown = showAll ? visible : visible.slice(0, MAX_CARDS);
  const contacted = radar.contacted.filter(c => (bucketOf(c.actByDays) ?? 'hoje') === period);
  const nextWithItems = PERIODS.find(p => p.value !== period && inBucket(p.value).length > 0);
  const firstName = userName.split(' ')[0];

  return (
    <Stack gap="xl">
      <Box>
        <Title order={1}>{getGreeting()}, {firstName}</Title>
        <Group gap="sm" mt={4} wrap="wrap">
          <Text fw={600} c={urgent > 0 ? 'red.7' : contacts.length > 0 ? 'yellow.8' : 'teal.8'}>
            {urgent > 0
              ? `${urgent} ${urgent === 1 ? 'contato urgente' : 'contatos urgentes'} hoje`
              : contacts.length > 0 ? 'Carteira pede atenção' : 'Carteira em dia'}
          </Text>
          <Text c="dimmed">
            {contacts.length} {contacts.length === 1 ? 'cliente para contatar' : 'clientes para contatar'}
            {radar.impact > 0 && ` · ${formatCurrency(radar.impact)} em jogo`}
          </Text>
        </Group>
      </Box>

      <Stack gap="md">
        <ThemeHeader
          icon={ChatCircleDotsIcon}
          title="Prioridades de contato"
          description="Quem da sua carteira contatar primeiro, por quê e o que oferecer"
          count={contacts.length}
        />
        <BucketTabs
          value={period}
          onChange={b => { setPeriod(b); setShowAll(false); }}
          noun={['contato', 'contatos']}
          counts={b => { const items = inBucket(b); return { total: items.length, critical: items.filter(c => c.severity === 'critico').length }; }}
        />
        {loading ? (
          <KpiSkeleton count={3} cols={{ base: 1, sm: 2, lg: 3 }} />
        ) : visible.length > 0 ? (
          <>
            {/* severidade, depois prazo para contatar, depois o motivo — uma prioridade por cliente */}
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {shown.map(c => (
                <ContactCard key={c.id} contact={c} onCta={() => onCta(c.cta)} onWhy={() => setWhy(c)} />
              ))}
            </SimpleGrid>
            {visible.length > MAX_CARDS && (
              <Button variant="default" onClick={() => setShowAll(v => !v)} mx="auto">
                {showAll ? 'Ver menos' : `Ver todos (${visible.length})`}
              </Button>
            )}
          </>
        ) : (
          <EmptyState
            icon={CheckCircleIcon}
            title={period === 'hoje' ? 'Nenhum contato pra hoje' : 'Nenhum contato neste período'}
            description="Quando um cliente passar do ciclo de compra, tiver carrinho esperando você ou título vencido, ele aparece aqui."
            action={nextWithItems
              ? { label: `Ver ${nextWithItems.label.toLowerCase()} (${inBucket(nextWithItems.value).length})`, onClick: () => setPeriod(nextWithItems.value) }
              : undefined}
          />
        )}
      </Stack>

      {!loading && contacted.length > 0 && (
        <Stack gap="sm">
          <Text fw={600}>Contatados nas últimas 24 h</Text>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {contacted.map(c => (
              <ContactCard key={c.id} contact={c} resolved onCta={() => {}} />
            ))}
          </SimpleGrid>
        </Stack>
      )}

      {/* Tema complementar: vendas, vendedores e pedidos do período vs. ano anterior */}
      <RepSalesSection repName={userName} onCta={onCta} />

      <Modal opened={!!why} onClose={() => setWhy(null)} centered title={<Text fw={600}>Por que isso aparece</Text>}>
        {why && (
          <Stack gap="sm">
            <Text fw={600}>{CONTACT_REASON_META[why.reason].code} · {CONTACT_REASON_META[why.reason].label} · {why.clientName}</Text>
            <Text>{why.why}</Text>
            {why.otherReasons.length > 0 && (
              <Text size="sm">Também: {why.otherReasons.map(r => CONTACT_REASON_META[r].label).join(', ')}</Text>
            )}
            <Text size="sm" c="dimmed">{actByText(why.actByDays).replace('agir', 'contatar')} · {updatedText(why.updatedHoursAgo)}</Text>
          </Stack>
        )}
      </Modal>
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
