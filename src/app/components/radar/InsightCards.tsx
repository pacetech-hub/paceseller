import type { ReactNode } from "react";
import { ActionIcon, Box, Button, Group, Menu, Paper, Stack, Text, ThemeIcon } from "@mantine/core";
import {
  ArrowRightIcon, ArrowUpRightIcon, CalendarDotsIcon, CheckCircleIcon, DotsThreeVerticalIcon, InfoIcon,
  ShieldWarningIcon, ShoppingCartIcon, StarIcon, StorefrontIcon, WarningOctagonIcon, type Icon,
} from "@phosphor-icons/react";
import {
  NATURE_META, SIGNAL_META, actByText, dateInDays, ddmm, formatImpact, updatedText,
  type InsightViz, type Nature, type RadarSignal, type SignalType,
} from "../../data/radar";
import classes from "./InsightCards.module.css";

// Cinco cartões, um por natureza do insight ("As cinco naturezas de um insight"):
// - Corretivo (agora): faixa de largura total, tempo decorrido e botão cheio — é o único que interrompe.
// - Proativo (antes): calendário com a data de agir e a linha do tempo até o problema.
// - Preventivo (logo antes de agir): borda tracejada de "confira antes" e medidor contra o limite.
// - Oportunidade (a qualquer momento): faixa com o ganho em destaque e a prova (lojas, meta, comparação).
// - Informativo (durante): bloco silencioso, sem cor nem botão, com tendência e fonte do dado.
// A natureza também vem escrita no sobretítulo, com ícone próprio: nunca só pela cor.

export const NATURE_ICON: Record<Nature, Icon> = {
  corretivo: WarningOctagonIcon,
  proativo: CalendarDotsIcon,
  preventivo: ShieldWarningIcon,
  oportunidade: ArrowUpRightIcon,
  informativo: InfoIcon,
};

interface CardProps {
  signal: RadarSignal;
  onCta: () => void;
  /** Itens do menu "Mais opções" (por que aparece, adiar, dispensar). */
  menu?: ReactNode;
}

const footerText = (s: RadarSignal) => `${s.timeText} · ${actByText(s.actByDays)} · ${updatedText(s.updatedHoursAgo)}`;

function NatureTag({ nature, detail, c }: { nature: Nature; detail?: string; c?: string }) {
  const meta = NATURE_META[nature];
  const NIcon = NATURE_ICON[nature];
  return (
    <Text component="span" className={classes.tag} c={c ?? `${meta.color}.8`}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <NIcon size={14} weight="bold" aria-hidden />
        {meta.label}
      </span>
      {detail && <Text span inherit c={c ? undefined : 'dimmed'} fw={600}>· {detail}</Text>}
    </Text>
  );
}

function CardMenu({ menu, light }: { menu?: ReactNode; light?: boolean }) {
  if (!menu) return null;
  return (
    <Menu position="bottom-end" withinPortal shadow="md">
      <Menu.Target>
        <ActionIcon variant="subtle" color={light ? 'gray.0' : 'gray'} aria-label="Mais opções do aviso" mr={-8} mt={-4}>
          <DotsThreeVerticalIcon size={20} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>{menu}</Menu.Dropdown>
    </Menu>
  );
}

const pct = (v: number, max: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;

// ===========================================================================
// Corretivo — "Resolve um problema atual" · Agora
// ===========================================================================
export function CorretivoCard({ signal, onCta, menu, icon: CardIcon }: CardProps & { icon: Icon }) {
  return (
    <Box className={classes.corretivo} role="alert" aria-label={`Corretivo: ${signal.subject}`}>
      <ThemeIcon size={44} radius="md" color="red.7" aria-hidden>
        <CardIcon size={22} weight="bold" />
      </ThemeIcon>

      <Box miw={0}>
        <NatureTag nature="corretivo" detail={SIGNAL_META[signal.type].label} />
        <Text fw={700} fz="lg" mt={2} lineClamp={2}>{signal.subject}</Text>
        <Text size="sm" c="dimmed" lineClamp={2}>{signal.context}</Text>
        {signal.suggestion && <Text size="sm" fw={600} mt={4}>{signal.suggestion}</Text>}
      </Box>

      {/* o tamanho do problema, em tempo ou quantidade */}
      <Box className={classes.corretivoElapsed}>
        <Text fz={26} fw={700} lh={1.1} c="red.8">{signal.metric}</Text>
        <Text size="sm" c="dimmed">{signal.metric === signal.timeText ? updatedText(signal.updatedHoursAgo) : signal.timeText}</Text>
      </Box>

      <Box className={classes.corretivoActions}>
        <Button color="red.7" rightSection={<ArrowRightIcon size={18} />} onClick={onCta}>
          {signal.ctaLabel}
        </Button>
        <CardMenu menu={menu} />
      </Box>
    </Box>
  );
}

// ===========================================================================
// Proativo — "Antecipa uma necessidade" · Antes
// ===========================================================================
const PROATIVO_VERB: Partial<Record<SignalType, string>> = {
  'estoque-baixo': 'Peça até',
  'reajuste-preco': 'Envie até',
  'aguardando-voce': 'Revise até',
  'boleto-a-vencer': 'Pague até',
};

function CalendarTile({ inDays }: { inDays: number }) {
  const d = dateInDays(Math.max(0, inDays));
  return (
    <Box className={classes.calendar} aria-hidden>
      <div className={classes.calendarHead}>{d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</div>
      <div className={classes.calendarDay}>{d.getDate()}</div>
      <div className={classes.calendarMonth}>{d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</div>
    </Box>
  );
}

function Timeline({ viz, actBy }: { viz: Extract<InsightViz, { kind: 'timeline' }>; actBy: number }) {
  const end = Math.max(viz.endDays, 1);
  const act = Math.max(0, Math.min(actBy, end));
  const actPos = pct(act, end);
  return (
    <Box
      className={classes.timeline}
      role="img"
      aria-label={`Hoje, agir em ${act} dias, ${viz.endLabel} em ${viz.endDays} dias`}
    >
      <div className={classes.timelineTrack} />
      <div className={classes.timelineWindow} style={{ left: 0, width: actPos }} />
      <div className={classes.timelineLead} style={{ left: actPos, right: 0 }} />
      <div className={classes.timelineDot} style={{ left: 0 }} />
      <div className={`${classes.timelineDot} ${classes.timelineDotAct}`} style={{ left: actPos }} />
      <div className={`${classes.timelineDot} ${classes.timelineDotEnd}`} style={{ left: '100%' }} />
      {/* a data de agir fica acima da linha; hoje e o fim, abaixo — não se sobrepõem */}
      <span
        className={`${classes.timelineLabel} ${classes.timelineActLabel}`}
        style={act / end > 0.75 ? { right: 0 } : { left: actPos, transform: act > 0 ? 'translateX(-50%)' : undefined }}
      >
        <Text span inherit fw={700} c="blue.8">agir até {ddmm(dateInDays(act))}</Text>
      </span>
      <span className={classes.timelineLabel} style={{ left: 0 }}>Hoje</span>
      <span className={classes.timelineLabel} style={{ right: 0, textAlign: 'right' }}>
        {viz.endLabel} em {viz.endDays} d
      </span>
    </Box>
  );
}

export function ProativoCard({ signal, onCta, menu }: CardProps) {
  const verb = PROATIVO_VERB[signal.type] ?? 'Aja até';
  const when = dateInDays(Math.max(0, signal.actByDays));
  const weekday = when.toLocaleDateString('pt-BR', { weekday: 'long' }).split('-')[0];
  return (
    <Paper withBorder p="lg" h="100%" style={{ borderTop: '3px solid var(--mantine-color-blue-6)' }}>
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <NatureTag nature="proativo" detail={SIGNAL_META[signal.type].label} />
          <CardMenu menu={menu} />
        </Group>

        <Group gap="md" wrap="nowrap" align="center">
          <CalendarTile inDays={signal.actByDays} />
          <Box miw={0}>
            <Text fz={22} fw={700} lh={1.2} c="blue.9">{verb} {weekday}</Text>
            <Text fw={600} mt={2} lineClamp={2}>{signal.subject}</Text>
          </Box>
        </Group>

        {signal.viz?.kind === 'timeline' && <Timeline viz={signal.viz} actBy={signal.actByDays} />}

        <Text size="sm" c="dimmed">{signal.metric} · {signal.context}</Text>
        {signal.suggestion && <Text className={classes.suggestion}>{signal.suggestion}</Text>}

        <Stack gap={6} mt="auto">
          <Group>
            <Button variant="light" color="blue" rightSection={<ArrowRightIcon size={18} />} onClick={onCta}>
              {signal.ctaLabel}
            </Button>
          </Group>
          <Text size="xs" c="dimmed">{signal.timeText} · {updatedText(signal.updatedHoursAgo)}</Text>
        </Stack>
      </Stack>
    </Paper>
  );
}

// ===========================================================================
// Preventivo — "Evita um erro" · Logo antes de agir
// ===========================================================================
function Meter({ viz }: { viz: Extract<InsightViz, { kind: 'meter' }> }) {
  const max = Math.max(viz.value, viz.limit) * 1.12;
  const fillTo = Math.min(viz.value, viz.limit);
  const over = viz.direction === 'above' ? viz.value > viz.limit : viz.value < viz.limit;
  // acima: o excesso passa do limite; abaixo: a falta vai do valor até o limite
  const excess = viz.direction === 'above'
    ? { left: pct(viz.limit, max), width: pct(Math.max(0, viz.value - viz.limit), max) }
    : { left: pct(viz.value, max), width: pct(Math.max(0, viz.limit - viz.value), max) };
  return (
    <Box>
      <Box className={classes.meter} role="img" aria-label={`${viz.valueLabel}; ${viz.limitLabel}`}>
        <div className={classes.meterFill} style={{ width: pct(viz.direction === 'above' ? fillTo : viz.value, max) }} />
        {over && <div className={classes.meterExcess} style={excess} />}
        <div className={classes.meterLimit} style={{ left: pct(viz.limit, max) }} />
      </Box>
      <Group justify="space-between" mt={8} gap="xs" wrap="nowrap">
        <Text size="sm" fw={700}>{viz.valueLabel}</Text>
        <Text size="sm" c="dimmed" ta="right">{viz.limitLabel}</Text>
      </Group>
    </Box>
  );
}

export function PreventivoCard({ signal, onCta, menu }: CardProps) {
  return (
    <Box className={classes.preventivo} p="lg" h="100%">
      <Stack gap="md" h="100%">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <NatureTag nature="preventivo" detail={SIGNAL_META[signal.type].label} c="amber.9" />
          <CardMenu menu={menu} />
        </Group>

        <Box>
          <Text fz={26} fw={700} lh={1.15} c="amber.9">{signal.metric}</Text>
          <Text fw={600} mt={4} lineClamp={2}>{signal.subject}</Text>
          <Text size="sm" c="dimmed" mt={2}>{signal.context}</Text>
        </Box>

        {signal.viz?.kind === 'meter' && <Meter viz={signal.viz} />}
        {signal.viz?.kind === 'list' && (
          <Stack gap={6}>
            {signal.viz.items.map(item => (
              <div key={item} className={classes.checkRow}>
                <ShoppingCartIcon size={16} aria-hidden />
                {item}
              </div>
            ))}
          </Stack>
        )}

        {signal.suggestion && (
          <div className={classes.callout}>
            <ShieldWarningIcon size={18} weight="fill" style={{ flex: 'none', marginTop: 1 }} aria-hidden />
            <span>{signal.suggestion}</span>
          </div>
        )}

        <Stack gap={6} mt="auto">
          <Group>
            {/* pede revisão, não pressa: botão neutro */}
            <Button variant="default" rightSection={<ArrowRightIcon size={18} />} onClick={onCta}>
              {signal.ctaLabel}
            </Button>
          </Group>
          <Text size="xs" c="dimmed">{footerText(signal)}</Text>
        </Stack>
      </Stack>
    </Box>
  );
}

// ===========================================================================
// Oportunidade — "Mostra um ganho potencial" · A qualquer momento
// ===========================================================================
function Peers({ count, of, light }: { count: number; of: number; light?: boolean }) {
  return (
    <Box>
      <div className={classes.peers} role="img" aria-label={`${count} de ${of} lojas parecidas`}>
        {Array.from({ length: of }, (_, i) => (
          <StorefrontIcon
            key={i}
            size={22}
            weight={i < count ? 'fill' : 'regular'}
            color={i < count
              ? (light ? 'var(--mantine-color-green-3)' : 'var(--mantine-color-green-7)')
              : (light ? 'var(--mantine-color-brand-6)' : 'var(--mantine-color-gray-4)')}
          />
        ))}
      </div>
      <Text size="sm" c={light ? 'brand.2' : 'dimmed'} mt={6}>lojas parecidas com a sua</Text>
    </Box>
  );
}

function Goal({ viz, light }: { viz: Extract<InsightViz, { kind: 'goal' }>; light?: boolean }) {
  return (
    <Box>
      <div className={classes.goalTrack} role="img" aria-label={`${viz.currentLabel} de ${viz.goalLabel}`}>
        <div className={classes.goalFill} style={{ width: pct(viz.current, viz.goal) }} />
      </div>
      <Group justify="space-between" mt={6}>
        <Text size="sm" fw={700} c={light ? 'white' : undefined}>{viz.currentLabel}</Text>
        <Text size="sm" c={light ? 'brand.2' : 'dimmed'}>meta {viz.goalLabel}</Text>
      </Group>
    </Box>
  );
}

function CompareBars({ viz, tone }: { viz: Extract<InsightViz, { kind: 'compare' }>; tone: 'green' | 'gray' }) {
  const max = Math.max(viz.a, viz.b);
  const strong = tone === 'green' ? 'var(--mantine-color-green-6)' : 'light-dark(var(--mantine-color-gray-7), var(--mantine-color-gray-3))';
  const weak = 'light-dark(var(--mantine-color-gray-3), var(--mantine-color-dark-3))';
  return (
    <div className={classes.bars} role="img" aria-label={`${viz.aLabel} ${viz.a}, ${viz.bLabel} ${viz.b}`}>
      <Text size="sm" c="dimmed">{viz.aLabel}</Text>
      <div className={classes.bar} style={{ width: pct(viz.a, max), background: weak }} />
      <Text size="sm" ff="monospace">{viz.a}</Text>
      <Text size="sm" c="dimmed">{viz.bLabel}</Text>
      <div className={classes.bar} style={{ width: pct(viz.b, max), background: strong }} />
      <Text size="sm" ff="monospace" fw={700}>{viz.b}</Text>
    </div>
  );
}

export function OportunidadeCard({ signal, onCta, menu, featured, extra }: CardProps & {
  /** Destaque da semana: o mesmo desenho em preto. */
  featured?: boolean;
  /** Linha extra no corpo (ex.: margem no PDV sugerido). */
  extra?: string;
}) {
  const impact = formatImpact(signal.impact);
  return (
    <Box className={`${classes.oportunidade} ${featured ? classes.featured : ''}`} h="100%">
      <Stack gap={0} h="100%">
        <Box className={classes.oportunidadeBand}>
          <Group justify="space-between" align="flex-start" wrap="nowrap" mb="sm">
            {featured ? (
              <Text component="span" className={classes.tag} c="brand.2">
                <StarIcon size={14} weight="fill" color="white" aria-hidden />
                Destaque da semana · {SIGNAL_META[signal.type].label}
              </Text>
            ) : (
              <NatureTag nature="oportunidade" detail={SIGNAL_META[signal.type].label} c="green.8" />
            )}
            <CardMenu menu={menu} light={featured} />
          </Group>
          <Text fz={32} fw={700} lh={1.1} c={featured ? 'white' : 'green.8'} mb="md">{signal.metric}</Text>
          {signal.viz?.kind === 'peers' && <Peers count={signal.viz.count} of={signal.viz.of} light={featured} />}
          {signal.viz?.kind === 'goal' && <Goal viz={signal.viz} light={featured} />}
          {signal.viz?.kind === 'compare' && <CompareBars viz={signal.viz} tone="green" />}
        </Box>

        <Stack gap="md" p="lg" style={{ flex: 1 }}>
          <Box>
            <Text fw={600} c={featured ? 'white' : undefined} lineClamp={2}>{signal.subject}</Text>
            <Text size="sm" c={featured ? 'brand.3' : 'dimmed'} mt={4}>{signal.context}</Text>
            {extra && <Text size="sm" c={featured ? 'brand.3' : 'dimmed'}>{extra}</Text>}
            {impact && signal.type !== 'frete-gratis' && (
              <Text size="sm" ff="monospace" fw={700} mt="sm" c={featured ? 'white' : undefined}>Potencial: {impact}</Text>
            )}
          </Box>
          <Stack gap={6} mt="auto">
            <Group>
              <Button
                color={featured ? 'gray.0' : 'green.7'}
                c={featured ? 'brand.9' : undefined}
                rightSection={<ArrowRightIcon size={18} />}
                onClick={onCta}
              >
                {signal.ctaLabel}
              </Button>
            </Group>
            <Text size="xs" c={featured ? 'brand.3' : 'dimmed'}>{footerText(signal)}</Text>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
}

// ===========================================================================
// Informativo — "Dá contexto para decidir" · Durante
// ===========================================================================
function Sparkline({ series, label }: { series: number[]; label: string }) {
  const w = 100;
  const h = 32;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const pts = series.map((v, i) => [(i / (series.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg className={classes.sparkline} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={label}>
      <path d={d} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r={2.5} fill="currentColor" />
    </svg>
  );
}

export function InformativoCard({ label, value, subject, context, viz, source, ctaLabel, onCta, menu }: {
  label: string; value: string; subject?: string; context: string; viz?: InsightViz;
  /** Fonte do dado (regra "todo insight tem um porquê e mostra a fonte"). */
  source: string;
  ctaLabel?: string; onCta?: () => void; menu?: ReactNode;
}) {
  return (
    <Box className={classes.informativo}>
      <Stack gap="sm" h="100%">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Text size="sm" c="dimmed" fw={600}>{label}</Text>
          <CardMenu menu={menu} />
        </Group>
        <Box>
          <Text fz={24} fw={700} lh={1.15}>{value}</Text>
          {subject && <Text size="sm" fw={600} mt={2} lineClamp={1}>{subject}</Text>}
          <Text size="sm" c="dimmed" mt={2}>{context}</Text>
        </Box>
        <Box c="gray.6">
          {viz?.kind === 'trend' && <Sparkline series={viz.series} label={viz.seriesLabel} />}
          {viz?.kind === 'compare' && <CompareBars viz={viz} tone="gray" />}
          {viz?.kind === 'meter' && (
            <div className={classes.thinTrack} role="img" aria-label={`${viz.valueLabel} ${pct(viz.value, viz.limit)}`}>
              <div className={classes.thinFill} style={{ width: pct(viz.value, viz.limit) }} />
            </div>
          )}
        </Box>
        <Group justify="space-between" mt="auto" gap="xs">
          <Text size="xs" c="dimmed">Fonte: {source}</Text>
          {ctaLabel && onCta && (
            <Button variant="subtle" color="gray" size="compact-sm" px={4} mr={-4} rightSection={<ArrowRightIcon size={14} />} onClick={onCta}>
              {ctaLabel}
            </Button>
          )}
        </Group>
      </Stack>
    </Box>
  );
}

/** Informativo a partir de um sinal do motor (benchmark, fechamento). */
export function InformativoSignalCard({ signal, onCta, menu }: CardProps) {
  return (
    <InformativoCard
      label={SIGNAL_META[signal.type].label}
      value={signal.metric}
      subject={signal.subject}
      context={signal.context}
      viz={signal.viz}
      source={updatedText(signal.updatedHoursAgo)}
      ctaLabel={signal.ctaLabel}
      onCta={onCta}
      menu={menu}
    />
  );
}

// ===========================================================================
// Resolvido — fica 24 h e sai do Radar
// ===========================================================================
export function ResolvedRow({ signal }: { signal: RadarSignal }) {
  return (
    <div className={classes.resolved}>
      <CheckCircleIcon size={20} weight="fill" color="var(--mantine-color-teal-7)" aria-hidden />
      <Box miw={0} style={{ flex: 1 }}>
        <Text size="sm" fw={600} lineClamp={1}>{SIGNAL_META[signal.type].label} · {signal.subject}</Text>
        <Text size="xs" c="dimmed">Resolvido · sai do Radar em até 24 h</Text>
      </Box>
    </div>
  );
}

/** Contagem por natureza no período: mostra o equilíbrio do Radar ("um Radar saudável equilibra as cinco"). */
export function NatureBalance({ counts }: { counts: Partial<Record<Nature, number>> }) {
  const order: Nature[] = ['corretivo', 'proativo', 'preventivo', 'oportunidade', 'informativo'];
  const items = order.filter(n => (counts[n] ?? 0) > 0);
  if (items.length === 0) return null;
  return (
    <Group gap="lg" wrap="wrap" aria-label="Insights por natureza">
      {items.map(n => {
        const NIcon = NATURE_ICON[n];
        const meta = NATURE_META[n];
        return (
          <Group key={n} gap={6} wrap="nowrap">
            <NIcon size={16} weight="bold" color={`var(--mantine-color-${meta.color}-7)`} aria-hidden />
            <Text size="sm"><Text span inherit fw={700}>{counts[n]}</Text> {meta.label.toLowerCase()}{counts[n]! > 1 ? 's' : ''}</Text>
          </Group>
        );
      })}
    </Group>
  );
}
