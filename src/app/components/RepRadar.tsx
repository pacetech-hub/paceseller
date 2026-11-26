import { useMemo, useState } from "react";
import { TabCount } from "./ui/TabCount";
import {
  ActionIcon, Badge, Box, Button, Checkbox, Divider, Flex, Group, Menu, Modal, NumberInput, Paper, SimpleGrid, Stack, Tabs, Text, ThemeIcon, Title, UnstyledButton,
} from "@mantine/core";
import {
  ArrowCounterClockwiseIcon, ArrowRightIcon, CalendarCheckIcon, CheckIcon, ClockIcon, CurrencyCircleDollarIcon, DotsThreeVerticalIcon,
  HandshakeIcon, HourglassIcon, InfoIcon, PackageIcon, PaperPlaneTiltIcon, PhoneCallIcon, StarIcon, TrendDownIcon,
  type Icon,
} from "@phosphor-icons/react";
import { RepSalesSection } from "./RepSalesSection";
import { KpiSkeleton } from "./ui/Skeletons";
import { useMockLoading } from "../lib/useMockLoading";
import { useShop } from "../lib/shop";
import { toast } from "../lib/toast";
import { clients, formatCurrency, type Client } from "../data/mockData";
import { SEVERITY_META, actByText, bucketOf, days, updatedText, type Bucket, type CtaTarget } from "../data/radar";
import {
  CART_PARAMS, addComment, addToCart, cartPairs, cartValue, createCart, getCartsState, productById, repConfirmConditions, setTargetCart,
  useCartStore, type Cart,
} from "../data/cartStore";
import {
  CONTACT_REASON_META, carteiraOpportunity, markContacted, snoozeContact, undoContactAction, useRepRadar,
  type ContactPriority, type ContactReason,
} from "../data/repRadar";

const CONTACT_ICON: Record<ContactReason, Icon> = {
  'carrinho-esperando': ClockIcon,
  cobranca: CurrencyCircleDollarIcon,
  'recompra-atrasada': HourglassIcon,
  'queda-compras': TrendDownIcon,
  reativacao: ArrowCounterClockwiseIcon,
  'sugestao-sem-resposta': PaperPlaneTiltIcon,
  'reposicao-cliente': PackageIcon,
  'pos-venda': HandshakeIcon,
  'recompra-prevista': CalendarCheckIcon,
};

type Filter = 'todas' | Bucket;
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'hoje', label: 'Hoje' },
  { value: '15d', label: 'Em 15 dias' },
  { value: '30d', label: 'Nos próximos 30 dias' },
];

const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);

/** Link terciário com seta, o mesmo dos cartões do Radar. */
function LinkCta({ label, onClick, color = 'blue', c }: { label: string; onClick: () => void; color?: string; c?: string }) {
  return (
    <Button variant="transparent" color={color} c={c} px={0} fw={600} size="sm" rightSection={<ArrowRightIcon size={16} />} onClick={onClick}>
      {label}
    </Button>
  );
}

/**
 * Radar do representante: o que está esperando você (pedidos para aprovar), uma oportunidade
 * na carteira, e a carteira inteira loja por loja, cada uma com o próximo passo.
 */
export function RepRadar({ userName, onCta }: { userName: string; greetName?: string; onCta: (target: CtaTarget) => void }) {
  const loading = useMockLoading();
  const radar = useRepRadar(userName);
  const { carts } = useCartStore();
  const carteira = clients.filter(c => c.rep === userName);
  const attention = new Set(radar.contacts.map(c => c.clientId)).size;

  // pedidos enviados pelo lojista esperando as condições do representante, o mais antigo primeiro
  const waiting = carts
    .filter(c => c.stage === 'aguardando-rep' && carteira.some(cl => cl.id === c.clientId))
    .sort((a, b) => a.stageSince.localeCompare(b.stageSince));
  const opportunity = carteiraOpportunity(userName, carts);

  return (
    <Stack gap="xl">
      <Box>
        <Title order={1}>
          {attention === 0 ? 'Carteira em dia' : `${attention} ${attention === 1 ? 'loja precisa' : 'lojas precisam'} de atenção`}
        </Title>
        <Text c="dimmed" mt={4}>
          {carteira.length} {carteira.length === 1 ? 'loja' : 'lojas'} na carteira
          {radar.urgent > 0 && (
            <Text span inherit c="red.7" fw={600}> · {radar.urgent} {radar.urgent === 1 ? 'contato urgente' : 'contatos urgentes'} hoje</Text>
          )}
        </Text>
      </Box>

      {loading ? (
        <KpiSkeleton count={2} cols={{ base: 1, lg: 2 }} />
      ) : (
        <SimpleGrid cols={{ base: 1, lg: opportunity ? 2 : 1 }} spacing="md">
          <WaitingCard carts={waiting} onCta={onCta} />
          {opportunity && (
            <OpportunityCard productId={opportunity.productId} reason={opportunity.reason} stores={opportunity.clients} onCta={onCta} />
          )}
        </SimpleGrid>
      )}

      {!loading && <CarteiraCard carteira={carteira} contacts={radar.contacts} contacted={radar.contacted} onCta={onCta} />}

      {/* Tema complementar: vendas, vendedores e pedidos do período vs. ano anterior */}
      <RepSalesSection repName={userName} onCta={onCta} />
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Aguardando você
// ---------------------------------------------------------------------------
function WaitingCard({ carts, onCta }: { carts: Cart[]; onCta: (t: CtaTarget) => void }) {
  const [confirming, setConfirming] = useState(false);
  const total = carts.reduce((s, c) => s + cartValue(c), 0);

  const approveAll = () => {
    const ok = carts.filter(c => repConfirmConditions(c.id)).length;
    setConfirming(false);
    toast.success(
      ok === 1 ? 'Condições confirmadas' : `${ok} pedidos com condições confirmadas`,
      'Os lojistas já podem seguir para o pagamento.',
    );
  };

  return (
    <Paper withBorder p="lg" h="100%">
      <Group justify="space-between" wrap="nowrap">
        <Text fw={600}>Aguardando você</Text>
        <Badge variant="light" color={carts.length ? 'blue' : 'gray'} circle={carts.length < 10}>{carts.length}</Badge>
      </Group>
      <Divider my="sm" />

      {carts.length === 0 ? (
        <Group gap="sm" wrap="nowrap" py="xs">
          <ThemeIcon variant="light" color="teal" radius="xl" size={28}><CheckIcon size={16} /></ThemeIcon>
          <Text c="dimmed" size="sm">Nenhum pedido esperando você. Quando um lojista enviar um carrinho, ele aparece aqui.</Text>
        </Group>
      ) : (
        <Stack gap={0}>
          {carts.map((cart, i) => {
            const waited = daysSince(cart.stageSince);
            return (
              <Box key={cart.id}>
                {i > 0 && <Divider />}
                <Flex gap="xs" py="sm" direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'flex-start' }}>
                  <Group gap="sm" wrap="nowrap" align="flex-start" flex={1} miw={0}>
                  <ClockIcon size={18} style={{ marginTop: 2, flex: 'none' }} color={waited >= 2 ? 'var(--mantine-color-red-7)' : undefined} />
                  <Box flex={1} miw={0}>
                    <Text fw={600} size="sm">"{cart.cartName}" está aguardando sua aprovação</Text>
                    <Text c="dimmed" size="sm">
                      {cart.clientName} · {cartPairs(cart)} pares · {formatCurrency(cartValue(cart))}
                      {' · '}
                      <Text span inherit c={waited >= 2 ? 'red.7' : undefined}>{waited === 0 ? 'enviado hoje' : `há ${days(waited)}`}</Text>
                    </Text>
                  </Box>
                  </Group>
                  <Box flex="none" pl={{ base: 30, sm: 0 }}><LinkCta label="Revisar pedido" onClick={() => onCta({ kind: 'cart', cartId: cart.id })} /></Box>
                </Flex>
              </Box>
            );
          })}
          <Box pt="xs">
            <LinkCta label={carts.length === 1 ? 'Aprovar' : `Aprovar todos (${carts.length})`} onClick={() => setConfirming(true)} />
          </Box>
        </Stack>
      )}

      <Modal opened={confirming} onClose={() => setConfirming(false)} centered title={<Text fw={600}>Confirmar condições comerciais</Text>}>
        <Stack gap="sm">
          <Text size="sm">
            {carts.length === 1 ? 'O pedido abaixo libera' : `Os ${carts.length} pedidos abaixo liberam`} o pagamento para o lojista, nas condições padrão da tabela dele.
          </Text>
          {carts.map(c => (
            <Group key={c.id} justify="space-between" wrap="nowrap">
              <Text size="sm" truncate>"{c.cartName}" · {c.clientName}</Text>
              <Text size="sm" className="mono" flex="none">{formatCurrency(cartValue(c))}</Text>
            </Group>
          ))}
          <Text size="sm" c="dimmed">Total {formatCurrency(total)}. Para ajustar itens ou condições, revise cada pedido antes.</Text>
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setConfirming(false)}>Cancelar</Button>
            <Button onClick={approveAll} leftSection={<CheckIcon size={16} />}>
              {carts.length === 1 ? 'Confirmar' : `Confirmar ${carts.length} pedidos`}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}

// ---------------------------------------------------------------------------
// Oportunidade na carteira (cartão de destaque, em preto)
// ---------------------------------------------------------------------------

/** Grade inicial: a grade mínima distribuída pela disponibilidade de cada número (BR-20: sempre editável). */
function initialGrade(available: Record<string, number>, pairs: number): Record<string, number> {
  const total = Object.values(available).reduce((a, b) => a + b, 0);
  const sizes = Object.keys(available);
  const grade = Object.fromEntries(sizes.map(s => [s, Math.floor((available[s] / total) * pairs)]));
  // completa o que faltou pelo arredondamento, nos números com mais pares disponíveis
  let missing = pairs - Object.values(grade).reduce((a, b) => a + b, 0);
  for (const s of [...sizes].sort((a, b) => available[b] - available[a])) {
    if (missing <= 0) break;
    grade[s] += 1;
    missing -= 1;
  }
  return grade;
}

function OpportunityCard({ productId, reason, stores, onCta }: { productId: string; reason: string; stores: Client[]; onCta: (t: CtaTarget) => void }) {
  const product = productById(productId);
  const [open, setOpen] = useState(false);
  if (!product) return null;
  const n = stores.length;

  return (
    <Paper p="lg" h="100%" bg="brand.9" style={{ borderColor: 'light-dark(var(--mantine-color-brand-9), var(--mantine-color-brand-7))' }} withBorder>
      <Stack gap="sm" h="100%">
        <Text size="sm" fw={600} c="brand.3">Oportunidade na carteira</Text>
        <Title order={3} c="white">{product.category} {product.name}</Title>
        <Text size="sm" c="brand.2">
          {reason} — {n} {n === 1 ? 'loja da sua carteira ainda não tem' : 'lojas da sua carteira ainda não têm'} esse produto
        </Text>
        <Group gap={6}>
          {stores.map(s => (
            <UnstyledButton
              key={s.id}
              onClick={() => onCta({ kind: 'client', clientId: s.id })}
              px="sm"
              py={4}
              bg="brand.7"
              c="white"
              fz="sm"
              style={{ borderRadius: 'var(--mantine-radius-xl)' }}
              aria-label={`Ver ${s.name}`}
            >
              {s.name}
            </UnstyledButton>
          ))}
        </Group>
        <Box mt="auto">
          <LinkCta label={`Sugerir ${n === 1 ? 'pra 1 loja' : `pras ${n} lojas`}`} color="white" c="white" onClick={() => setOpen(true)} />
        </Box>
      </Stack>
      <SuggestModal key={String(open)} opened={open} onClose={() => setOpen(false)} productId={productId} stores={stores} />
    </Paper>
  );
}

/** Sugestão para várias lojas: uma grade (BR-20, já preenchida e editável) e um carrinho de sugestão por loja. */
function SuggestModal({ opened, onClose, productId, stores }: { opened: boolean; onClose: () => void; productId: string; stores: Client[] }) {
  const product = productById(productId)!;
  const { actorName } = useShop();
  const [selected, setSelected] = useState<string[]>(stores.map(s => s.id));
  const [grade, setGrade] = useState(() => initialGrade(product.grades, CART_PARAMS.minOrderPairs));
  const pairs = Object.values(grade).reduce((a, b) => a + b, 0);
  const belowMin = pairs < CART_PARAMS.minOrderPairs;

  const send = () => {
    const previousTarget = getCartsState().targetCartId;
    selected.forEach(clientId => {
      const cart = createCart({ clientId, name: `Sugestão · ${product.name}`, createdBy: 'rep' });
      addToCart(cart.id, productId, grade, 'rep');
      const client = clients.find(c => c.id === clientId);
      addComment(cart.id, 'rep', actorName ?? client?.rep ?? '', `${product.name} está em alta demanda e sua loja ainda não tem. Montei uma grade inicial: ajuste os números e aprove quando puder.`);
    });
    // a sugestão não troca o carrinho em que o representante está trabalhando
    setTargetCart(previousTarget);
    toast.success(
      selected.length === 1 ? 'Sugestão enviada' : `Sugestão enviada para ${selected.length} lojas`,
      'Cada lojista recebe um carrinho para revisar e aprovar.',
    );
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} centered size="lg" title={<Text fw={600}>Sugerir {product.name}</Text>}>
      <Stack gap="md">
        <Box>
          <Text size="sm" fw={600} mb={6}>Lojas</Text>
          <Checkbox.Group value={selected} onChange={setSelected}>
            <Stack gap={6}>
              {stores.map(s => <Checkbox key={s.id} value={s.id} label={`${s.name} · ${s.city}, ${s.state}`} />)}
            </Stack>
          </Checkbox.Group>
        </Box>

        <Box>
          <Group justify="space-between" mb={6}>
            <Text size="sm" fw={600}>Grade por loja</Text>
            <Text size="sm" c={belowMin ? 'red.7' : 'dimmed'} className="mono">{pairs} pares · {formatCurrency(pairs * product.price)}</Text>
          </Group>
          <SimpleGrid cols={{ base: 4, sm: 6 }} spacing="xs">
            {Object.keys(product.grades).map(size => (
              <NumberInput
                key={size}
                label={size}
                min={0}
                max={product.grades[size]}
                value={grade[size] ?? 0}
                onChange={v => setGrade(g => ({ ...g, [size]: Number(v) || 0 }))}
                hideControls
                classNames={{ input: 'mono' }}
              />
            ))}
          </SimpleGrid>
          <Text size="sm" c={belowMin ? 'red.7' : 'dimmed'} mt={6}>
            {belowMin
              ? `Abaixo da grade mínima de ${CART_PARAMS.minOrderPairs} pares: o lojista não consegue enviar o pedido assim.`
              : 'Distribuída pela disponibilidade de cada número. O lojista pode ajustar antes de aprovar.'}
          </Text>
        </Box>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancelar</Button>
          <Button onClick={send} disabled={selected.length === 0 || pairs === 0} leftSection={<PaperPlaneTiltIcon size={16} />}>
            {selected.length === 1 ? 'Enviar sugestão' : `Enviar para ${selected.length} lojas`}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Carteira: todas as lojas, uma linha por loja com o próximo passo
// ---------------------------------------------------------------------------
function CarteiraCard({ carteira, contacts, contacted, onCta }: {
  carteira: Client[]; contacts: ContactPriority[]; contacted: ContactPriority[]; onCta: (t: CtaTarget) => void;
}) {
  const [filter, setFilter] = useState<Filter>('todas');
  const [why, setWhy] = useState<ContactPriority | null>(null);

  const byClient = useMemo(() => new Map(contacts.map(c => [c.clientId, c])), [contacts]);
  const contactedByClient = useMemo(() => new Map(contacted.map(c => [c.clientId, c])), [contacted]);
  const count = (b: Bucket) => contacts.filter(c => bucketOf(c.actByDays) === b).length;

  // lojas com pendência primeiro (na ordem do Radar), depois as em dia
  const rows = filter === 'todas'
    ? [...contacts.map(c => carteira.find(cl => cl.id === c.clientId)!).filter(Boolean), ...carteira.filter(cl => !byClient.has(cl.id))]
    : contacts.filter(c => bucketOf(c.actByDays) === filter).map(c => carteira.find(cl => cl.id === c.clientId)!).filter(Boolean);

  return (
    <Paper withBorder p="lg">
      <Text fw={600}>Carteira</Text>
      <Tabs value={filter} onChange={v => v && setFilter(v as typeof filter)} mt="xs">
        <Tabs.List aria-label="Prazo de contato">
          {FILTERS.map(f => {
            const n = f.value === 'todas' ? null : count(f.value);
            return (
              <Tabs.Tab key={f.value} value={f.value} rightSection={n !== null ? <TabCount value={n} /> : undefined}>
                {f.label}
              </Tabs.Tab>
            );
          })}
        </Tabs.List>
      </Tabs>

      {rows.length === 0 ? (
        <Text c="dimmed" size="sm" py="md">Nenhuma loja com contato neste período.</Text>
      ) : (
        <Stack gap={0}>
          {rows.map((client, i) => {
            const contact = byClient.get(client.id);
            const done = contactedByClient.get(client.id);
            const RowIcon = contact ? CONTACT_ICON[contact.reason] : CheckIcon;
            const sev = contact ? SEVERITY_META[contact.severity] : null;
            return (
              <Box key={client.id}>
                {i > 0 && <Divider />}
                <Flex gap="xs" py="sm" direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'flex-start' }}>
                  <Group gap="sm" wrap="nowrap" align="flex-start" flex={1} miw={0}>
                  <ThemeIcon variant="light" color={sev?.color ?? 'gray'} radius="md" size={32} style={{ flex: 'none' }} aria-hidden>
                    <RowIcon size={18} />
                  </ThemeIcon>
                  <Box flex={1} miw={0}>
                    <Group gap="xs" wrap="wrap">
                      <Text fw={600} size="sm">{client.name}</Text>
                      {contact && (
                        <Badge size="sm" variant="light" color={sev!.color} styles={{ label: { textTransform: 'none' } }}>
                          {sev!.label} · {CONTACT_REASON_META[contact.reason].label}
                        </Badge>
                      )}
                    </Group>
                    <Text c="dimmed" size="sm">
                      {client.city}, {client.state} · {contact
                        ? `${contact.context} · ${actByText(contact.actByDays).replace('agir', 'contatar')}`
                        : done ? 'Contatado nas últimas 24 h' : 'Tudo em dia — nenhuma pendência agora'}
                    </Text>
                  </Box>
                  </Group>
                  <Group gap={4} wrap="nowrap" flex="none" pl={{ base: 44, sm: 0 }} justify="space-between">
                    <LinkCta
                      label={contact ? contact.ctaLabel : 'Atender esta loja'}
                      onClick={() => onCta(contact ? contact.cta : { kind: 'client', clientId: client.id })}
                    />
                    {contact && (
                      <Menu position="bottom-end" withinPortal shadow="md">
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="brand" aria-label={`Mais opções · ${client.name}`}>
                            <DotsThreeVerticalIcon size={18} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item leftSection={<InfoIcon size={16} />} onClick={() => setWhy(contact)}>Por que isso aparece</Menu.Item>
                          <Menu.Item
                            leftSection={<PhoneCallIcon size={16} />}
                            onClick={() => {
                              markContacted(contact.id);
                              toast.successWithAction('Contato registrado', `${client.name} sai das prioridades.`, { label: 'Desfazer', onClick: () => undoContactAction(contact.id) });
                            }}
                          >
                            Marcar como contatado
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Label>Adiar</Menu.Label>
                          {[1, 3, 7].map(d => (
                            <Menu.Item
                              key={d}
                              leftSection={<ClockIcon size={16} />}
                              onClick={() => {
                                snoozeContact(contact.id, d);
                                toast.successWithAction('Contato adiado', `Volta às prioridades em ${days(d)}.`, { label: 'Desfazer', onClick: () => undoContactAction(contact.id) });
                              }}
                            >
                              Adiar {days(d)}
                            </Menu.Item>
                          ))}
                        </Menu.Dropdown>
                      </Menu>
                    )}
                  </Group>
                </Flex>
              </Box>
            );
          })}
        </Stack>
      )}

      <Modal opened={!!why} onClose={() => setWhy(null)} centered title={<Text fw={600}>Por que isso aparece</Text>}>
        {why && (
          <Stack gap="sm">
            <Text fw={600}>{CONTACT_REASON_META[why.reason].code} · {CONTACT_REASON_META[why.reason].label} · {why.clientName}</Text>
            <Text>{why.why}</Text>
            <Text size="sm">O que oferecer: {why.suggestion} · {why.channel}</Text>
            {why.otherReasons.length > 0 && (
              <Text size="sm">Também: {why.otherReasons.map(r => CONTACT_REASON_META[r].label).join(', ')}</Text>
            )}
            <Text size="sm" c="dimmed">{actByText(why.actByDays).replace('agir', 'contatar')} · {updatedText(why.updatedHoursAgo)}</Text>
          </Stack>
        )}
      </Modal>
    </Paper>
  );
}
