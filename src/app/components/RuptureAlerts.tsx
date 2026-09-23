import { useState } from "react";
import { Paper, Group, Box, Stack, Text, Title, Center, UnstyledButton, SimpleGrid, Progress, SegmentedControl } from "@mantine/core";
import { AlertTriangle, UserX, PackageX, TrendingDown, Settings2, ChevronRight, MapPin, Box as BoxIcon, AlertOctagon } from "lucide-react";
import { formatCurrency } from "../data/mockData";
import classes from "./RuptureAlerts.module.css";

type Profile = 'rep' | 'admin';
type TabKey = 'risco' | 'encalhe' | 'meta' | 'ruptura';

interface RuptureAlertsProps {
  profile: Profile;
}

// ---------- MOCK DATA ----------
const riskClientsRep = [
  { id: 'C001', name: 'Calçados Beira Rio', city: 'Porto Alegre, RS', lastVisit: 62, lastOrder: 78, value: 48200, severity: 'alta' },
  { id: 'C002', name: 'Sapataria Central', city: 'Florianópolis, SC', lastVisit: 51, lastOrder: 55, value: 31500, severity: 'alta' },
  { id: 'C003', name: 'Loja Modelo SP', city: 'São Paulo, SP', lastVisit: 44, lastOrder: 49, value: 22800, severity: 'media' },
  { id: 'C004', name: 'Calçados Estrela', city: 'Curitiba, PR', lastVisit: 38, lastOrder: 42, value: 18900, severity: 'media' },
];

const riskClientsAdmin = [
  { group: 'Sul', count: 28, value: 412000, reps: 4 },
  { group: 'Sudeste', count: 41, value: 689000, reps: 7 },
  { group: 'Nordeste', count: 19, value: 287000, reps: 3 },
  { group: 'Centro-Oeste', count: 11, value: 158000, reps: 2 },
];

const stalledProductsRep = [
  { sku: 'SKU-8821', name: 'Bota Chelsea Couro Preta', line: 'Flow XL', days: 67, stock: 142 },
  { sku: 'SKU-7745', name: 'Oxford Clássico Marrom', line: 'Hertz Art', days: 54, stock: 98 },
  { sku: 'SKU-9012', name: 'Derby Casual Urban', line: 'Flow', days: 48, stock: 76 },
];

const stalledProductsAdmin = [
  { group: 'Flow XL', count: 14, units: 2840, value: 312000 },
  { group: 'Hertz Art', count: 9, units: 1620, value: 198000 },
  { group: 'Flow', count: 7, units: 1180, value: 142000 },
  { group: 'Urban Series', count: 5, units: 720, value: 86000 },
];

const repMonthlyRep = [
  { month: 'Abr', meta: 480, real: 412 },
  { month: 'Mai', meta: 480, real: 398 },
  { month: 'Jun', meta: 480, real: 421 },
];

// Ruptura no Catálogo — produtos indisponíveis para compra
const catalogRuptureRep = [
  { sku: 'SKU-001', name: 'Bota Chelsea Couro Preta', line: 'Flow XL', lastStock: 0, clientsAffected: 3, lastSale: 12 },
  { sku: 'SKU-002', name: 'Oxford Clássico Marrom', line: 'Hertz Art', lastStock: 0, clientsAffected: 2, lastSale: 8 },
  { sku: 'SKU-003', name: 'Derby Casual Urban', line: 'Flow', lastStock: 0, clientsAffected: 5, lastSale: 5 },
];

const catalogRuptureAdmin = [
  { group: 'Flow XL', count: 4, skus: 'SKU-001, SKU-008, SKU-015, SKU-022', totalClients: 18 },
  { group: 'Hertz Art', count: 3, skus: 'SKU-002, SKU-009, SKU-016', totalClients: 12 },
  { group: 'Flow', count: 2, skus: 'SKU-003, SKU-010', totalClients: 9 },
  { group: 'Urban Series', count: 1, skus: 'SKU-004', totalClients: 4 },
];

const repsBelowAdmin = [
  { name: 'Roberto Silva', region: 'Sul', manager: 'João Lima', months: 4, gap: -18 },
  { name: 'Patrícia Mendes', region: 'Nordeste', manager: 'Marina Costa', months: 3, gap: -22 },
  { name: 'Lucas Ferreira', region: 'Sudeste', manager: 'João Lima', months: 3, gap: -12 },
];

const severityColor = (s: string) =>
  s === 'alta' ? { bg: 'yellow.1', c: 'yellow.8' } : s === 'media' ? { bg: 'yellow.0', c: 'yellow.7' } : { bg: 'gray.2', c: 'black' };

const TABULAR = { fontVariantNumeric: 'tabular-nums' } as const;

function Pill({ bg, c, children }: { bg: string; c: string; children: React.ReactNode }) {
  return (
    <Text component="span" bg={bg} c={c} px={6} py={2} fz="0.62rem" fw={700} style={{ borderRadius: 9999, lineHeight: 1.4 }}>
      {children}
    </Text>
  );
}

function IconBox({ size, round, bg, children }: { size: number; round?: boolean; bg: string; children: React.ReactNode }) {
  return (
    <Center w={size} h={size} bg={bg} style={{ borderRadius: round ? '50%' : 'var(--mantine-radius-md)', flexShrink: 0 }}>
      {children}
    </Center>
  );
}

export function RuptureAlerts({ profile }: RuptureAlertsProps) {
  const [tab, setTab] = useState<TabKey>('risco');
  const [groupBy, setGroupBy] = useState<'regiao' | 'segmento' | 'rep'>('regiao');
  const [stalledGroupBy, setStalledGroupBy] = useState<'linha' | 'marca' | 'regiao'>('linha');
  const [ruptureGroupBy, setRuptureGroupBy] = useState<'linha' | 'marca' | 'regiao'>('linha');

  const tabs: { key: TabKey; label: string; icon: any; count: number }[] = [
    { key: 'risco', label: 'Risco de Cliente', icon: UserX, count: profile === 'rep' ? riskClientsRep.length : 99 },
    { key: 'encalhe', label: 'Encalhe de Produto', icon: PackageX, count: profile === 'rep' ? stalledProductsRep.length : 35 },
    { key: 'meta', label: 'Meta Inatingível', icon: TrendingDown, count: profile === 'rep' ? 1 : repsBelowAdmin.length },
    { key: 'ruptura', label: 'Ruptura no Catálogo', icon: AlertOctagon, count: profile === 'rep' ? catalogRuptureRep.length : 10 },
  ];

  return (
    <Paper withBorder radius="lg" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <Group justify="space-between" wrap="nowrap" px={20} py="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        <Group gap={10} wrap="nowrap">
          <IconBox size={32} bg="yellow.0">
            <AlertTriangle size={16} color="var(--mantine-color-yellow-7)" />
          </IconBox>
          <div>
            <Title order={3} fw={600} fz="0.9rem">Alerta de Riscos</Title>
            <Text c="dimmed" fz="0.72rem">
              {profile === 'rep' ? 'Sinais críticos na sua carteira' : 'Sinais críticos consolidados'}
            </Text>
          </div>
        </Group>
        <UnstyledButton className={classes.textBtn} fz="0.72rem">
          <Settings2 size={14} /> Limiares
        </UnstyledButton>
      </Group>

      {/* Tabs */}
      <Group gap={4} px={20} wrap="nowrap" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
        {tabs.map(t => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <UnstyledButton
              key={t.key}
              onClick={() => setTab(t.key)}
              className={classes.tab}
              data-active={active || undefined}
              fz="0.78rem"
              fw={500}
            >
              <Icon size={14} />
              {t.label}
              <Text component="span" ml={4} px={6} py={2} bg={active ? 'gray.2' : 'gray.1'} c={active ? 'gray.9' : 'dimmed'} fz="0.62rem" fw={700} style={{ borderRadius: 9999, lineHeight: 1.4 }}>
                {t.count}
              </Text>
            </UnstyledButton>
          );
        })}
      </Group>

      {/* Body */}
      <Box p={20}>
        {tab === 'risco' && (profile === 'rep' ? (
          <Stack gap={8}>
            {riskClientsRep.map(c => {
              const sev = severityColor(c.severity);
              return (
              <Group key={c.id} gap="sm" wrap="nowrap" p="sm" className={classes.riskRow}>
                <Box flex={1} miw={0}>
                  <Group gap={8} wrap="nowrap">
                    <Text truncate fz="0.83rem" fw={500}>{c.name}</Text>
                    <Pill bg={sev.bg} c={sev.c}>{c.severity}</Pill>
                  </Group>
                  <Text c="dimmed" mt={2} fz="0.72rem">
                    <MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />{c.city} · sem visita há <Text span c="yellow.7" fw={600} inherit>{c.lastVisit}d</Text> · sem pedido há <Text span c="yellow.7" fw={600} inherit>{c.lastOrder}d</Text>
                  </Text>
                </Box>
                <Box ta="right" style={{ flexShrink: 0 }}>
                  <Text fz="0.8rem" fw={600} style={TABULAR}>{formatCurrency(c.value)}</Text>
                  <Text c="dimmed" fz="0.65rem">histórico 12m</Text>
                </Box>
                <ChevronRight size={16} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
              </Group>
              );
            })}
          </Stack>
        ) : (
          <>
            <GroupBySwitch value={groupBy} onChange={setGroupBy} options={[{v:'regiao',l:'Região'},{v:'segmento',l:'Segmento'},{v:'rep',l:'Rep responsável'}]} />
            <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="sm">
              {riskClientsAdmin.map(g => (
                <Box key={g.group} p="sm" className={classes.clickItem}>
                  <Text c="dimmed" fz="0.7rem">{g.group}</Text>
                  <Text mt={4} fz="1.3rem" fw={700} lts="-0.02em">{g.count}</Text>
                  <Text c="dimmed" fz="0.7rem">clientes em risco</Text>
                  <Group justify="space-between" wrap="nowrap" mt={8} pt={8} style={{ borderTop: '1px solid var(--mantine-color-gray-2)' }}>
                    <Text component="span" fz="0.72rem" fw={600} style={TABULAR}>{formatCurrency(g.value)}</Text>
                    <Text component="span" c="dimmed" fz="0.65rem">{g.reps} reps</Text>
                  </Group>
                </Box>
              ))}
            </SimpleGrid>
          </>
        ))}

        {tab === 'encalhe' && (profile === 'rep' ? (
          <Stack gap={8}>
            {stalledProductsRep.map(p => (
              <Group key={p.sku} gap="sm" wrap="nowrap" p="sm" className={classes.clickItem}>
                <IconBox size={36} bg="gray.1">
                  <PackageX size={16} color="var(--mantine-color-dimmed)" />
                </IconBox>
                <Box flex={1} miw={0}>
                  <Text truncate fz="0.83rem" fw={500}>{p.name}</Text>
                  <Text c="dimmed" fz="0.7rem">{p.sku} · {p.line}</Text>
                </Box>
                <Box ta="right" style={{ flexShrink: 0 }}>
                  <Text c="yellow.7" fz="0.78rem" fw={600}>{p.days}d sem venda</Text>
                  <Text c="dimmed" fz="0.68rem" style={TABULAR}>{p.stock} un. estoque</Text>
                </Box>
              </Group>
            ))}
            <Text c="dimmed" ta="center" pt={8} fz="0.72rem">
              Você não vendeu esses produtos nos últimos 60 dias
            </Text>
          </Stack>
        ) : (
          <>
            <GroupBySwitch value={stalledGroupBy} onChange={setStalledGroupBy} options={[{v:'linha',l:'Linha'},{v:'marca',l:'Marca'},{v:'regiao',l:'Região'}]} />
            <Stack gap={8}>
              {stalledProductsAdmin.map(g => (
                <Group key={g.group} gap="sm" wrap="nowrap" p="sm" className={classes.item}>
                  <Box flex={1}>
                    <Text fz="0.83rem" fw={500}>{g.group}</Text>
                    <Text c="dimmed" fz="0.7rem">{g.count} SKUs parados · {g.units.toLocaleString('pt-BR')} un.</Text>
                  </Box>
                  <Box ta="right">
                    <Text fz="0.82rem" fw={600} style={TABULAR}>{formatCurrency(g.value)}</Text>
                    <Text c="dimmed" fz="0.65rem">capital parado</Text>
                  </Box>
                </Group>
              ))}
            </Stack>
          </>
        ))}

        {tab === 'meta' && (profile === 'rep' ? (
          <div>
            <Group align="flex-start" gap="sm" wrap="nowrap" p="sm" mb="sm" bg="yellow.0" style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-yellow-2)' }}>
              <AlertTriangle size={16} color="var(--mantine-color-yellow-7)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <Text fz="0.82rem" fw={600}>3 meses consecutivos abaixo da meta</Text>
                <Text c="dimmed" fz="0.72rem">Risco estrutural identificado. Gap médio: -15%</Text>
              </div>
            </Group>
            <SimpleGrid cols={3} spacing={8}>
              {repMonthlyRep.map(m => {
                const pct = Math.round((m.real / m.meta) * 100);
                return (
                  <Box key={m.month} p="sm" ta="center" className={classes.item}>
                    <Text c="dimmed" fz="0.7rem">{m.month}/26</Text>
                    <Text mt={4} fz="1.1rem" fw={700}>{pct}%</Text>
                    <Text c="dimmed" fz="0.65rem" style={TABULAR}>{m.real}k / {m.meta}k</Text>
                    <Progress value={pct} size={4} radius="xl" color="yellow.5" bg="gray.1" mt={8} />
                  </Box>
                );
              })}
            </SimpleGrid>
          </div>
        ) : (
          <Stack gap={8}>
            {repsBelowAdmin.map(r => (
              <Group key={r.name} gap="sm" wrap="nowrap" p="sm" className={classes.clickItem}>
                <IconBox size={36} round bg="yellow.1">
                  <Text component="span" c="yellow.7" fz="0.7rem" fw={700}>
                    {r.name.split(' ').map(p=>p[0]).slice(0,2).join('')}
                  </Text>
                </IconBox>
                <Box flex={1} miw={0}>
                  <Text fz="0.83rem" fw={500}>{r.name}</Text>
                  <Text c="dimmed" fz="0.7rem">{r.region} · gestor: {r.manager}</Text>
                </Box>
                <Box ta="right" style={{ flexShrink: 0 }}>
                  <Text c="yellow.7" fz="0.8rem" fw={700}>{r.months} meses</Text>
                  <Text c="dimmed" fz="0.68rem" style={TABULAR}>gap {r.gap}%</Text>
                </Box>
              </Group>
            ))}
          </Stack>
        ))}

        {tab === 'ruptura' && (profile === 'rep' ? (
          <Stack gap={8}>
            <Group align="flex-start" gap="sm" wrap="nowrap" p="sm" mb={8} bg="yellow.0" style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-yellow-2)' }}>
              <AlertOctagon size={16} color="var(--mantine-color-yellow-7)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <Text fz="0.82rem" fw={600}>Produtos indisponíveis para compra</Text>
                <Text c="dimmed" fz="0.72rem">Notifique clientes da sua carteira para evitar vendas perdidas e frustração.</Text>
              </div>
            </Group>
            {catalogRuptureRep.map(p => (
              <Group key={p.sku} gap="sm" wrap="nowrap" p="sm" className={classes.ruptureRow}>
                <IconBox size={36} bg="yellow.1">
                  <BoxIcon size={16} color="var(--mantine-color-yellow-7)" />
                </IconBox>
                <Box flex={1} miw={0}>
                  <Group gap={8} wrap="nowrap">
                    <Text truncate fz="0.83rem" fw={500}>{p.name}</Text>
                    <Pill bg="yellow.1" c="yellow.7">Ruptura</Pill>
                  </Group>
                  <Text c="dimmed" fz="0.7rem">{p.sku} · {p.line} · estoque zerado</Text>
                </Box>
                <Box ta="right" style={{ flexShrink: 0 }}>
                  <Text c="yellow.7" fz="0.8rem" fw={700}>{p.clientsAffected} clientes</Text>
                  <Text c="dimmed" fz="0.68rem">última venda há {p.lastSale}d</Text>
                </Box>
                <ChevronRight size={16} color="var(--mantine-color-dimmed)" style={{ flexShrink: 0 }} />
              </Group>
            ))}
          </Stack>
        ) : (
          <>
            <GroupBySwitch value={ruptureGroupBy} onChange={setRuptureGroupBy} options={[{v:'linha',l:'Linha'},{v:'marca',l:'Marca'},{v:'regiao',l:'Região'}]} />
            <SimpleGrid cols={{ base: 2, lg: 4 }} spacing="sm">
              {catalogRuptureAdmin.map(g => (
                <Box key={g.group} p="sm" bg="yellow.0" className={classes.warnCard}>
                  <Text c="dimmed" fz="0.7rem">{g.group}</Text>
                  <Text mt={4} fz="1.3rem" fw={700} lts="-0.02em">{g.count}</Text>
                  <Text c="yellow.7" fz="0.7rem" fw={600}>SKUs em ruptura</Text>
                  <Group justify="space-between" wrap="nowrap" mt={8} pt={8} style={{ borderTop: '1px solid var(--mantine-color-yellow-1)' }}>
                    <Text component="span" fz="0.72rem" fw={600}>{g.totalClients} clientes</Text>
                    <Text component="span" c="dimmed" fz="0.65rem">{g.skus}</Text>
                  </Group>
                </Box>
              ))}
            </SimpleGrid>
          </>
        ))}
      </Box>
    </Paper>
  );
}

function GroupBySwitch<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { v: T; l: string }[];
}) {
  return (
    <Group gap={8} mb="sm">
      <Text component="span" c="dimmed" fz="0.72rem">Agrupar por:</Text>
      <SegmentedControl
        value={value}
        onChange={v => onChange(v as T)}
        size="xs"
        radius="md"
        bg="gray.1"
        p={2}
        data={options.map(o => ({ value: o.v, label: o.l }))}
        styles={{ label: { fontSize: '0.72rem', fontWeight: 500 } }}
      />
    </Group>
  );
}
