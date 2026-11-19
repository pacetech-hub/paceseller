import { useMemo, useState } from "react";
import {
  Badge, Box, Button, Group, Modal, SegmentedControl, SimpleGrid, Stack, Table, Tabs, Text, Textarea, TextInput, Title, Tooltip, ActionIcon,
} from "@mantine/core";
import { CakeIcon, MagnifyingGlassIcon, MegaphoneIcon, RepeatIcon, UserMinusIcon, WhatsappLogoIcon } from "@phosphor-icons/react";
import { RadarCard } from "./RadarPage";
import { DataTable, DataTableEmptyRow } from "./ui/DataTable";
import { formatCurrency, products } from "../data/mockData";
import {
  BIRTHDAY_WINDOW_DAYS, LAPSED_DAYS, SEGMENT_MESSAGE, SEGMENT_META, customersIn, dayLabel, inSegment, mostRebought, storeCustomers,
  type CustomerSegment, type StoreCustomer,
} from "../data/posVenda";
import { toast } from "../lib/toast";

const SEGMENTS: CustomerSegment[] = ['todos', 'aniversariantes', 'sumidos', 'fieis', 'novos'];
const HEADERS = ['Cliente', 'Última compra', 'Compras 12m', 'Gasto 12m', 'Aniversário', 'Último produto', 'Ações'];

const firstName = (name: string) => name.split(' ')[0];
const productName = (id: string) => products.find(p => p.id === id)?.name ?? '—';
const daysText = (n: number) => (n === 0 ? 'hoje' : n === 1 ? '1 dia' : `${n} dias`);

interface Campaign {
  title: string;
  recipients: StoreCustomer[];
  message: string;
}

/**
 * Pós-venda — Radar de fidelização (item 14 da proposta).
 * Mesmo padrão do Radar: cartões que dizem quem chamar e por quê, cada um com uma ação,
 * e abaixo a lista de clientes por segmento com a campanha personalizada.
 */
export function PosVendaPage() {
  const [segment, setSegment] = useState<CustomerSegment>('todos');
  const [search, setSearch] = useState('');
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  const birthdays = customersIn('aniversariantes').sort((a, b) => a.birthdayInDays - b.birthdayInDays);
  const lapsed = customersIn('sumidos');
  const lapsedSpend = lapsed.reduce((s, c) => s + c.spent12m, 0);
  const rebought = mostRebought();

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return storeCustomers
      .filter(c => inSegment(c, segment))
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
      .sort((a, b) => (segment === 'aniversariantes' ? a.birthdayInDays - b.birthdayInDays : b.lastPurchaseDaysAgo - a.lastPurchaseDaysAgo));
  }, [segment, search]);

  const openSegmentCampaign = (s: CustomerSegment) => setCampaign({
    title: s === 'todos' ? 'Campanha para todos os clientes' : `Campanha · ${SEGMENT_META[s].label}`,
    recipients: customersIn(s),
    message: SEGMENT_MESSAGE[s],
  });

  return (
    <Stack gap="xl" p={{ base: 'md', sm: 'lg' }} maw={1200} mx="auto" w="100%">
      <Box>
        <Title order={2}>Quem chamar esta semana</Title>
        <Text c="dimmed" mt={4}>
          <Text span inherit c={lapsed.length ? 'red.7' : 'dimmed'} fw={600}>{lapsed.length} clientes sumidos</Text>
          {' '}· {storeCustomers.length} clientes na base · {birthdays.length} aniversariantes
        </Text>
      </Box>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        <RadarCard
          icon={UserMinusIcon}
          color="red"
          eyebrow={`Risco · ${LAPSED_DAYS}+ dias sem compra`}
          metric={`${lapsed.length} clientes`}
          subject="Sumiram da loja"
          context={`Gastaram ${formatCurrency(lapsedSpend)} nos últimos 12 meses e não voltaram há mais de ${LAPSED_DAYS} dias.`}
          suggestion="Sugestão: convite com a coleção nova"
          ctaLabel="Chamar de volta"
          onCta={() => openSegmentCampaign('sumidos')}
          footer="Atualizado hoje"
        />
        <RadarCard
          icon={CakeIcon}
          color="teal"
          eyebrow={`Oportunidade · próximos ${BIRTHDAY_WINDOW_DAYS} dias`}
          metric={`${birthdays.length} aniversariantes`}
          subject={birthdays[0] ? `${birthdays[0].name}${birthdays[0].birthdayInDays === 0 ? ' faz aniversário hoje' : `, em ${daysText(birthdays[0].birthdayInDays)}`}` : 'Nenhum no período'}
          context={`Aniversários até ${dayLabel(BIRTHDAY_WINDOW_DAYS)} — parabéns com uma oferta é o contato que mais traz cliente de volta.`}
          suggestion="Sugestão: 10% na semana do aniversário"
          ctaLabel="Enviar parabéns"
          onCta={() => openSegmentCampaign('aniversariantes')}
          footer="Atualizado hoje"
        />
        <RadarCard
          icon={RepeatIcon}
          color="blue"
          eyebrow="Informação · últimos 12 meses"
          metric={`${rebought.share}% recompram`}
          subject={`${rebought.product.name} é o mais recomprado`}
          context={`${rebought.repeat} de ${rebought.buyers.length} clientes que levaram este modelo voltaram para comprar de novo.`}
          suggestion="Sugestão: avise quem comprou há 60+ dias"
          ctaLabel="Avisar quem comprou"
          onCta={() => setCampaign({
            title: `Campanha · quem comprou ${rebought.product.name}`,
            recipients: rebought.buyers,
            message: `Oi, {nome}! O ${rebought.product.name} que você levou voltou com cores novas. Quer que eu separe o seu número?`,
          })}
          footer="Atualizado hoje"
        />
      </SimpleGrid>

      <Stack gap="md">
        <Group justify="space-between" align="flex-end" gap="sm">
          <Box>
            <Title order={2}>Clientes</Title>
            <Text c="dimmed" size="sm">{SEGMENT_META[segment].hint}</Text>
          </Box>
          <Button leftSection={<MegaphoneIcon size={16} />} onClick={() => openSegmentCampaign(segment)} disabled={customersIn(segment).length === 0}>
            Enviar campanha personalizada
          </Button>
        </Group>

        <Group justify="space-between" gap="sm" wrap="wrap">
          <Tabs value={segment} onChange={(v) => v && setSegment(v as CustomerSegment)} variant="pills">
            <Tabs.List>
              {SEGMENTS.map(s => (
                <Tabs.Tab key={s} value={s} rightSection={<Badge size="xs" variant={segment === s ? 'white' : 'filled'} color="neutral" px={6}>{customersIn(s).length}</Badge>}>
                  {SEGMENT_META[s].label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>
          <TextInput
            placeholder="Buscar por nome ou telefone"
            leftSection={<MagnifyingGlassIcon size={16} />}
            value={search}
            onChange={e => setSearch(e.currentTarget.value)}
            w={{ base: '100%', sm: 280 }}
            aria-label="Buscar cliente"
          />
        </Group>

        <DataTable headers={HEADERS} numeric={['Compras 12m', 'Gasto 12m']} minWidth={980}>
          {rows.length === 0 ? (
            <DataTableEmptyRow colSpan={HEADERS.length}>
              <Text c="dimmed" size="sm" py="sm">Nenhum cliente encontrado neste segmento.</Text>
            </DataTableEmptyRow>
          ) : rows.map(c => (
            <Table.Tr key={c.id}>
              <Table.Td>
                <Text fw={600}>{c.name}</Text>
                <Text c="dimmed" size="sm" className="mono">{c.phone}</Text>
              </Table.Td>
              <Table.Td>
                <Text>{dayLabel(-c.lastPurchaseDaysAgo)}</Text>
                <Text size="sm" c={c.lastPurchaseDaysAgo >= LAPSED_DAYS ? 'red.7' : 'dimmed'}>há {daysText(c.lastPurchaseDaysAgo)}</Text>
              </Table.Td>
              <Table.Td ta="right" className="mono">{c.purchases12m}</Table.Td>
              <Table.Td ta="right" className="mono">{formatCurrency(c.spent12m)}</Table.Td>
              <Table.Td>
                <Text>{dayLabel(c.birthdayInDays)}</Text>
                {c.birthdayInDays <= BIRTHDAY_WINDOW_DAYS && (
                  <Text size="sm" c="teal.8">{c.birthdayInDays === 0 ? 'hoje' : `em ${daysText(c.birthdayInDays)}`}</Text>
                )}
              </Table.Td>
              <Table.Td>{productName(c.lastProductId)}</Table.Td>
              <Table.Td ta="right">
                {c.optIn ? (
                  <Tooltip label={`Enviar mensagem para ${firstName(c.name)}`} withArrow>
                    <ActionIcon
                      variant="subtle"
                      color="neutral"
                      aria-label={`Enviar mensagem para ${c.name}`}
                      onClick={() => setCampaign({
                        title: `Mensagem para ${c.name}`,
                        recipients: [c],
                        message: SEGMENT_MESSAGE[(['aniversariantes', 'sumidos', 'novos', 'fieis'] as CustomerSegment[]).find(s => inSegment(c, s)) ?? 'todos'],
                      })}
                    >
                      <WhatsappLogoIcon size={18} />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <Text size="sm" c="dimmed">Sem autorização</Text>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </DataTable>
      </Stack>

      <CampaignModal campaign={campaign} onClose={() => setCampaign(null)} />
    </Stack>
  );
}

/** Campanha personalizada: canal, mensagem com {nome} e prévia; quem não autorizou contato fica de fora (LGPD). */
function CampaignModal({ campaign, onClose }: { campaign: Campaign | null; onClose: () => void }) {
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [message, setMessage] = useState('');
  const [lastTitle, setLastTitle] = useState<string | null>(null);

  // Ao abrir outra campanha, recomeça com a mensagem sugerida dela
  if (campaign && campaign.title !== lastTitle) {
    setLastTitle(campaign.title);
    setMessage(campaign.message);
    setChannel('whatsapp');
  }

  const allowed = campaign?.recipients.filter(c => c.optIn) ?? [];
  const blocked = (campaign?.recipients.length ?? 0) - allowed.length;
  const preview = allowed[0] ? message.split('{nome}').join(firstName(allowed[0].name)) : message;

  const send = () => {
    toast.success(
      allowed.length === 1 ? `Mensagem enviada para ${firstName(allowed[0].name)}` : `Campanha enviada para ${allowed.length} clientes`,
      channel === 'whatsapp' ? 'Pelo WhatsApp da loja. As respostas chegam lá.' : 'Por e-mail. As respostas chegam na caixa da loja.',
    );
    setLastTitle(null);
    onClose();
  };
  const close = () => { setLastTitle(null); onClose(); };

  return (
    <Modal opened={!!campaign} onClose={close} title={campaign?.title} size="lg">
      <Stack gap="md">
        <Text size="sm">
          <Text span fw={600} inherit>{allowed.length} {allowed.length === 1 ? 'cliente' : 'clientes'}</Text>
          {blocked > 0 && <Text span c="dimmed" inherit> · {blocked} sem autorização para contato {blocked === 1 ? 'fica' : 'ficam'} de fora</Text>}
        </Text>

        <Box>
          <Text size="sm" fw={600} mb={6}>Canal</Text>
          <SegmentedControl
            value={channel}
            onChange={v => setChannel(v as 'whatsapp' | 'email')}
            data={[{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'email', label: 'E-mail' }]}
          />
        </Box>

        <Textarea
          label="Mensagem"
          description="{nome} vira o primeiro nome de cada cliente"
          value={message}
          onChange={e => setMessage(e.currentTarget.value)}
          autosize
          minRows={3}
          maxLength={500}
        />

        {allowed[0] && (
          <Box p="sm" bg="var(--mantine-color-default-hover)" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
            <Text size="xs" c="dimmed" mb={4}>Prévia para {allowed[0].name}</Text>
            <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>{preview}</Text>
          </Box>
        )}

        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={close}>Cancelar</Button>
          <Button onClick={send} disabled={allowed.length === 0 || !message.trim()} leftSection={<MegaphoneIcon size={16} />}>
            {allowed.length === 1 ? 'Enviar mensagem' : `Enviar para ${allowed.length} clientes`}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
