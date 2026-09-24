import { useState, useEffect } from "react";
import {
  Stack, Group, Flex, Box, Paper, Card, Text, Title, Button, ActionIcon, SimpleGrid, ThemeIcon, Badge, Divider,
  Modal, TextInput, Textarea, FileButton, UnstyledButton, AspectRatio, Loader, Center, Image, Tooltip,
} from "@mantine/core";
import { toast } from "../lib/toast";
import {
  SparkleIcon,
  CheckIcon,
  CaretRightIcon,
  CaretLeftIcon,
  InstagramLogoIcon,
  ChatCircleIcon,
  PrinterIcon,
  MagicWandIcon,
  ArrowsClockwiseIcon,
  DownloadSimpleIcon,
  PencilSimpleIcon,
  PlusIcon,
  ImageIcon,
  MusicNoteIcon,
  DeviceMobileIcon,
  TrashIcon,
  UploadSimpleIcon,
} from "@phosphor-icons/react";
import { products, formatCurrency, type Product } from "../data/mockData";
import interactive from "./interactive.module.css";
import classes from "./MarketingStudio.module.css";
import campaignPreviewMock from "@/assets/campaign-preview-mock.png";
import bannerLimitedEdition from "@/assets/banner-edicao-limitada.webp";

type Profile = 'admin' | 'rep' | 'lojista';

const FORMAT_GROUPS = ['WhatsApp', 'Instagram', 'TikTok', 'Impressão'] as const;

const FORMATS = [
  { id: 'whatsapp', group: 'WhatsApp', label: 'WhatsApp', description: 'Status e disparo para lista de clientes', spec: '1080 × 1080', icon: ChatCircleIcon },
  { id: 'instagram-feed', group: 'Instagram', label: 'Instagram Feed 4:5', description: 'Publicação no feed, formato vertical', spec: '1080 × 1350 · 4:5', icon: InstagramLogoIcon },
  { id: 'story', group: 'Instagram', label: 'Instagram Story 9:16', description: 'Tela cheia, com espaço para o dedo tocar', spec: '1080 × 1920 · 9:16', icon: DeviceMobileIcon },
  { id: 'tiktok', group: 'TikTok', label: 'TikTok', description: 'Vertical cheia, texto grande para vídeo', spec: '1080 × 1920 · 9:16 · 5s', icon: MusicNoteIcon },
  { id: 'impressao-a3', group: 'Impressão', label: 'Impressão A3', description: 'Cartaz grande para vitrine', spec: '29,7 × 42 cm · PDF', icon: PrinterIcon },
  { id: 'impressao-a4', group: 'Impressão', label: 'Impressão A4', description: 'Cartaz para parede e balcão', spec: '21 × 29,7 cm · PDF', icon: PrinterIcon },
  { id: 'impressao-a5', group: 'Impressão', label: 'Impressão A5', description: 'Panfleto de balcão e sacola', spec: '14,8 × 21 cm · PDF', icon: PrinterIcon },
];

interface Campaign {
  id: string;
  name: string;
  description: string;
  photos: string[];
}

const initialCampaigns: Campaign[] = [
  { id: 'lancamentos', name: 'Lançamentos', description: 'Peças e materiais para o lançamento de novas coleções.', photos: [campaignPreviewMock] },
  { id: 'volta-as-aulas', name: 'Volta às Aulas', description: 'Campanha sazonal voltada para o público de volta às aulas.', photos: [bannerLimitedEdition] },
];

const AI_PROMPTS = [
  'Nova coleção Inverno 2026 com exclusividade e sofisticação para distribuidores selecionados.',
  'Qualidade premium para calçados que combinam conforto e estilo nas estações frias.',
  'Descubra a nova linha Tesla Footwear — onde tradição encontra inovação.',
];

type ProductTag = 'lançamento' | 'alto giro' | 'estoque parado';

const productMeta: Record<string, { tag: ProductTag; stock: number }> = {
  'P001': { tag: 'lançamento', stock: 180 },
  'P002': { tag: 'alto giro', stock: 95 },
  'P003': { tag: 'estoque parado', stock: 620 },
  'P004': { tag: 'alto giro', stock: 140 },
  'P005': { tag: 'alto giro', stock: 210 },
  'P006': { tag: 'estoque parado', stock: 480 },
  'P007': { tag: 'estoque parado', stock: 390 },
  'P008': { tag: 'lançamento', stock: 160 },
};


const tagColors: Record<ProductTag, string> = {
  'lançamento': 'neutral',
  'alto giro': 'teal',
  'estoque parado': 'yellow',
};


function sortProductsForProfile(profile: Profile): Product[] {
  const priority = (id: string): number => {
    const tag = productMeta[id]?.tag;
    if (profile === 'lojista') {
      if (tag === 'estoque parado') return 0;
      if (tag === 'alto giro') return 1;
      if (tag === 'lançamento') return 2;
      return 3;
    }
    if (tag === 'lançamento') return 0;
    if (tag === 'estoque parado') return 1;
    return 2;
  };
  return [...products].sort((a, b) => priority(a.id) - priority(b.id));
}

interface HistoryItem {
  id: string;
  image: string;
  formatLabel: string;
  copy: string;
  createdAt: string;
}

const initialHistory: HistoryItem[] = [
  { id: 'hist-1', image: campaignPreviewMock, formatLabel: 'Instagram Feed 4:5', copy: AI_PROMPTS[0], createdAt: '18 de jun' },
  { id: 'hist-2', image: bannerLimitedEdition, formatLabel: 'WhatsApp', copy: AI_PROMPTS[1], createdAt: '12 de jun' },
  { id: 'hist-3', image: campaignPreviewMock, formatLabel: 'Instagram Story 9:16', copy: AI_PROMPTS[2], createdAt: '05 de jun' },
  { id: 'hist-4', image: bannerLimitedEdition, formatLabel: 'Impressão A4', copy: AI_PROMPTS[0], createdAt: '28 de mai' },
];

const WIZARD_STEPS = [
  { n: 1, label: 'Campanha' },
  { n: 2, label: 'Formato' },
  { n: 3, label: 'Produtos' },
  { n: 4, label: 'Tema' },
  { n: 5, label: 'Texto' },
  { n: 6, label: 'Resultado' },
];

type Mode = 'home' | 'wizard' | 'campaigns';


const DIMMED = 'var(--mantine-color-dimmed)';
const BORDER_COLOR = 'var(--mantine-color-default-border)';

function EmptyState({ title, subtitle, iconSize = 32, withCard = false, py = 40, strongTitle = false }: {
  title: string; subtitle?: string; iconSize?: number; withCard?: boolean; py?: number; strongTitle?: boolean;
}) {
  const content = (
    <Stack align="center" justify="center" gap={0} py={py} ta="center">
      <Box mb={strongTitle ? 12 : 8} lh={0}>
        <ImageIcon size={iconSize} color={DIMMED} opacity={0.3} />
      </Box>
      {strongTitle ? (
        <Text fw={600}>{title}</Text>
      ) : (
        <Text c="dimmed" size="0.8rem">{title}</Text>
      )}
      {subtitle && <Text c="dimmed" size={strongTitle ? '0.85rem' : '0.72rem'} mt={4}>{subtitle}</Text>}
    </Stack>
  );
  return withCard ? <Paper withBorder radius="lg">{content}</Paper> : content;
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <Group>
      <Button
        onClick={onClick}
        variant="subtle"
        color="gray"
        size="compact-sm"
        ml={-8}
        leftSection={<CaretLeftIcon size={16} />}
        styles={{ label: { fontSize: '0.82rem' } }}
      >
        Voltar para Marketing IA
      </Button>
    </Group>
  );
}

function PieceInfo({ label, copy }: { label: string; copy: string }) {
  return (
    <Box p="sm">
      <Text size="0.82rem" fw={600} truncate>{label}</Text>
      <Text c="dimmed" size="0.72rem" mb={8} lineClamp={2}>{copy}</Text>
      <Button
        onClick={() => toast.success('Arquivo baixado')}
        variant="default"
        size="xs"
        fullWidth
        leftSection={<DownloadSimpleIcon size={14} />}
        styles={{ label: { fontSize: '0.78rem' } }}
      >
        Baixar peça
      </Button>
    </Box>
  );
}

function MarketingHome({ history, onCreate, onManageCampaigns, onDelete }: { history: HistoryItem[]; onCreate: () => void; onManageCampaigns: () => void; onDelete: (id: string) => void }) {
  return (
    <Stack gap="lg" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      {/* Header */}
      <Paper withBorder radius="lg" p={{ base: 'md', sm: 'lg' }} bg="var(--mantine-color-default-hover)">
        <Group justify="space-between" wrap="wrap" gap="md">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon variant="light" color="neutral" size={40} radius="md">
              <SparkleIcon size={20} />
            </ThemeIcon>
            <Box>
              <Title order={2} fw={700} fz="1rem">Estúdio de Marketing com IA</Title>
              <Text c="dimmed" size="0.8rem">Crie campanhas profissionais em menos de 2 minutos</Text>
            </Box>
          </Group>
          <Group gap={8} wrap="wrap">
            <Button
              onClick={onManageCampaigns}
              variant="subtle"
              leftSection={<PencilSimpleIcon size={16} />}
              styles={{ label: { fontSize: '0.82rem' } }}
            >
              Gerenciar campanhas
            </Button>
            <Button
              onClick={onCreate}
              leftSection={<SparkleIcon size={16} />}
              styles={{ label: { fontSize: '0.85rem' } }}
            >
              Criar campanha
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Histórico */}
      <Box>
        <Text c="dimmed" size="0.7rem" fw={600} mb="sm" tt="uppercase" lts="0.04em">
          Histórico
        </Text>
        {history.length > 0 ? (
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
            {history.map(item => (
              <Card key={item.id} withBorder radius="lg" padding={0}>
                <AspectRatio ratio={1}>
                  <Box pos="relative" bg="var(--mantine-color-default-hover)">
                    <Image src={item.image} alt={item.formatLabel} h="100%" />
                    <Tooltip label="Excluir peça do histórico" withArrow>
                      <ActionIcon
                        onClick={() => onDelete(item.id)}
                        aria-label="Excluir peça do histórico"
                        size={28}
                        radius="md"
                        variant="transparent"
                        pos="absolute"
                        top={8}
                        right={8}
                        className={classes.overlayDelete}
                      >
                        <TrashIcon size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Box>
                </AspectRatio>
                <PieceInfo label={item.formatLabel} copy={item.copy} />
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <EmptyState withCard strongTitle iconSize={40} py={64} title="Nenhuma campanha criada ainda" subtitle={'Clique em "Criar campanha" para começar'} />
        )}
      </Box>
    </Stack>
  );
}

function CampaignsManager({ campaigns, selectedId, onSelect, onBack, onCreateCampaign, onAddPhotos, onDeletePhoto, onDeleteCampaign }: {
  campaigns: Campaign[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onBack: () => void;
  onCreateCampaign: (name: string, description: string) => void;
  onAddPhotos: (campaignId: string, photos: string[]) => void;
  onDeletePhoto: (campaignId: string, photoIndex: number) => void;
  onDeleteCampaign: (id: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);

  const selected = campaigns.find(c => c.id === selectedId) ?? null;

  const handleCreate = () => {
    if (!newName.trim()) return;
    onCreateCampaign(newName.trim(), newDescription.trim());
    setNewName('');
    setNewDescription('');
    setCreating(false);
  };

  const handleFiles = (files: File[]) => {
    if (!selected) return;
    if (!files || files.length === 0) return;
    onAddPhotos(selected.id, files.map(f => URL.createObjectURL(f)));
  };

  const inputStyles = {
    label: { fontSize: '0.72rem', fontWeight: 400, color: 'var(--mantine-color-dimmed)' },
    input: { fontSize: '0.82rem' },
  };

  return (
    <Stack gap="lg" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      <BackLink onClick={onBack} />

      <Box>
        <Title order={2} fw={700} fz="1rem">Gerenciar campanhas</Title>
        <Text c="dimmed" size="0.8rem">Configure os objetivos de campanha e os cenários fotográficos usados como fundo das peças</Text>
      </Box>

      {/* Lista à esquerda e detalhe à direita a partir de sm; empilhados abaixo disso */}
      <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'flex-start' }} gap="lg">
        {/* Left panel: campaign list */}
        <Paper withBorder radius="lg" p={8} w={{ base: '100%', sm: 220, md: 256 }} flex="none">
          <Stack gap={2}>
            {campaigns.map(c => {
              const active = selectedId === c.id;
              return (
                <Group
                  key={c.id}
                  gap={0}
                  wrap="nowrap"
                  className={classes.campaignRow}
                  data-active={active || undefined}
                >
                  <UnstyledButton onClick={() => onSelect(c.id)} px="sm" py={10} flex={1} miw={0}>
                    <Text size="0.85rem" fw={active ? 600 : 400} truncate>
                      {c.name}
                    </Text>
                  </UnstyledButton>
                  <Tooltip label="Excluir campanha" withArrow>
                    <ActionIcon
                      onClick={() => setDeleteTarget(c)}
                      aria-label={`Excluir campanha ${c.name}`}
                      variant="subtle"
                      color="red"
                      size={26}
                      mr={6}
                      className={classes.rowDelete}
                    >
                      <TrashIcon size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              );
            })}
          </Stack>
          <Button
            onClick={() => setCreating(true)}
            variant="subtle"
            fullWidth
            justify="flex-start"
            mt={4}
            px="sm"
            leftSection={<PlusIcon size={16} />}
            styles={{ label: { fontSize: '0.85rem' } }}
          >
            Nova campanha
          </Button>
        </Paper>

        {/* Main content: selected campaign detail */}
        <Stack gap="md" flex={1} miw={0}>
          {selected ? (
            <>
              <Paper withBorder radius="lg" p="md">
                <Title order={3} fw={700} fz="0.95rem">{selected.name}</Title>
                <Text c="dimmed" size="0.82rem" mt={4}>
                  {selected.description || 'Sem descrição.'}
                </Text>
              </Paper>

              <Paper withBorder radius="lg" p="md">
                <Group justify="space-between" wrap="wrap" gap={8} mb="sm">
                  <Text c="dimmed" size="0.7rem" fw={600} tt="uppercase" lts="0.04em">
                    {selected.photos.length} {selected.photos.length === 1 ? 'cenário fotográfico' : 'cenários fotográficos'}
                  </Text>
                  <FileButton onChange={handleFiles} accept="image/*" multiple>
                    {props => (
                      <Button
                        {...props}
                        variant="default"
                        size="xs"
                        leftSection={<UploadSimpleIcon size={14} />}
                        styles={{ label: { fontSize: '0.78rem' } }}
                      >
                        Enviar cenário
                      </Button>
                    )}
                  </FileButton>
                </Group>

                {selected.photos.length > 0 ? (
                  <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                    {selected.photos.map((photo, idx) => (
                      <AspectRatio key={idx} ratio={1}>
                        <Card bd={`1px solid ${BORDER_COLOR}`} radius="md" padding={0} pos="relative" bg="var(--mantine-color-default-hover)">
                          <Image src={photo} alt={`${selected.name} — cenário ${idx + 1}`} h="100%" />
                          <Tooltip label="Excluir cenário" withArrow>
                            <ActionIcon
                              onClick={() => onDeletePhoto(selected.id, idx)}
                              aria-label={`Excluir cenário ${idx + 1}`}
                              size={24}
                              radius="sm"
                              variant="transparent"
                              pos="absolute"
                              top={6}
                              right={6}
                              className={classes.overlayDelete}
                            >
                              <TrashIcon size={12} />
                            </ActionIcon>
                          </Tooltip>
                        </Card>
                      </AspectRatio>
                    ))}
                  </SimpleGrid>
                ) : (
                  <EmptyState title="Nenhum cenário enviado ainda" />
                )}
              </Paper>
            </>
          ) : (
            <EmptyState withCard strongTitle iconSize={40} py={64} title="Nenhuma campanha selecionada" subtitle="Selecione uma campanha à esquerda ou crie uma nova" />
          )}
        </Stack>
      </Flex>

      {/* Create campaign dialog */}
      <Modal
        opened={creating}
        onClose={() => setCreating(false)}
        size="sm"
        centered
        title={
          <Box>
            <Text fw={600} size="0.95rem">Nova campanha</Text>
            <Text c="dimmed" size="0.78rem">Defina o nome e a descrição deste objetivo de campanha</Text>
          </Box>
        }
      >
        <Stack gap="md" py={4}>
          <TextInput
            data-autofocus
            label="Nome"
            value={newName}
            onChange={e => setNewName(e.currentTarget.value)}
            placeholder="Ex.: Dia dos Pais"
            styles={inputStyles}
          />
          <Textarea
            label="Descrição (opcional)"
            value={newDescription}
            onChange={e => setNewDescription(e.currentTarget.value)}
            rows={3}
            placeholder="Descreva o objetivo desta campanha"
            styles={inputStyles}
          />
        </Stack>
        <Group justify="flex-end" gap={8} mt="lg">
          <Button
            onClick={() => { setCreating(false); setNewName(''); setNewDescription(''); }}
            variant="default"
            styles={{ label: { fontSize: '0.82rem' } }}
          >
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!newName.trim()} styles={{ label: { fontSize: '0.82rem' } }}>
            Criar campanha
          </Button>
        </Group>
      </Modal>

      {/* Delete campaign confirmation */}
      <Modal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        size="sm"
        centered
        withCloseButton={false}
      >
        <Text fw={600} size="0.95rem">Excluir campanha</Text>
        <Text c="dimmed" size="0.78rem" mt={6}>
          Tem certeza que deseja excluir "{deleteTarget?.name}"? Os cenários fotográficos associados também serão removidos. Esta ação não pode ser desfeita.
        </Text>
        <Group justify="flex-end" gap={8} mt="lg">
          <Button
            onClick={() => setDeleteTarget(null)}
            variant="default"
            styles={{ label: { fontSize: '0.82rem' } }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (deleteTarget) onDeleteCampaign(deleteTarget.id);
              setDeleteTarget(null);
            }}
            color="red"
            styles={{ label: { fontSize: '0.82rem' } }}
          >
            Excluir campanha
          </Button>
        </Group>
      </Modal>
    </Stack>
  );
}

function StepHeader({ title, subtitle, right, mb = 'md' }: { title: string; subtitle?: string; right?: React.ReactNode; mb?: string }) {
  return (
    <Group justify="space-between" align={right ? 'center' : 'flex-start'} wrap="wrap" gap={8} mb={mb}>
      <Box>
        <Title order={3} fw={600} fz="1rem">{title}</Title>
        {subtitle && <Text c="dimmed" size="0.78rem" mt={4}>{subtitle}</Text>}
      </Box>
      {right}
    </Group>
  );
}

function CampaignWizard({ profile, campaigns, onBack, onFinish }: { profile: Profile; campaigns: Campaign[]; onBack: () => void; onFinish: (items: HistoryItem[]) => void }) {
  const [step, setStep] = useState(1);
  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? '');
  const [selectedFormats, setSelectedFormats] = useState<Set<string>>(new Set(['instagram-feed']));
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set([products[0].id]));
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [prompt, setPrompt] = useState(AI_PROMPTS[0]);
  const [generating, setGenerating] = useState(false);

  const sortedProducts = sortProductsForProfile(profile);
  const selectedFormatList = FORMATS.filter(f => selectedFormats.has(f.id));
  const selectedCampaign = campaigns.find(c => c.id === campaignId) ?? null;

  useEffect(() => {
    setScenarioIndex(0);
  }, [campaignId]);

  const toggleFormat = (id: string) => {
    setSelectedFormats(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else { next.add(id); }
      return next;
    });
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < 3) { next.add(id); }
      return next;
    });
  };

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setStep(6);
    }, 2200);
  };

  const handleFinish = () => {
    const items: HistoryItem[] = selectedFormatList.map(f => ({
      id: `hist-${Math.round(Math.random() * 1e6)}-${f.id}`,
      image: campaignPreviewMock,
      formatLabel: f.label,
      copy: prompt,
      createdAt: 'agora',
    }));
    onFinish(items);
    toast.success(items.length === 1 ? 'Peça salva no histórico' : `${items.length} peças salvas no histórico`);
    onBack();
  };

  const optionClass = `${interactive.cardButton} ${classes.option}`;

  return (
    <Stack gap="lg" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      <BackLink onClick={onBack} />

      {/* Stepper */}
      <Paper withBorder radius="lg" p="md">
        <Group justify="space-between" wrap="nowrap" gap={0}>
          {WIZARD_STEPS.map((s, i) => {
            const done = step > s.n;
            const current = step === s.n;
            return (
              <Group key={s.n} gap={0} wrap="nowrap" flex={1}>
                <Group gap={8} wrap="nowrap">
                  <ActionIcon
                    onClick={() => s.n <= step && setStep(s.n)}
                    size={28}
                    radius="xl"
                    variant={done || current ? 'filled' : 'light'}
                    color={done || current ? 'neutral' : 'gray'}
                    aria-label={`Etapa ${s.n}: ${s.label}`}
                    flex="none"
                    fz="0.72rem"
                    fw={700}
                    c={done || current ? undefined : 'dimmed'}
                    className={classes.stepDot}
                    data-current={current || undefined}
                  >
                    {done ? <CheckIcon size={14} /> : s.n}
                  </ActionIcon>
                  <Text
                    visibleFrom="sm"
                    size="0.76rem"
                    fw={current ? 600 : 400}
                    c={step >= s.n ? undefined : 'dimmed'}
                  >
                    {s.label}
                  </Text>
                </Group>
                {i < WIZARD_STEPS.length - 1 && (
                  <Divider mx={8} flex={1} color={done ? 'var(--mantine-color-neutral-9)' : BORDER_COLOR} />
                )}
              </Group>
            );
          })}
        </Group>
        {/* No celular os rótulos das etapas ficam ocultos: mostra a etapa atual por extenso */}
        <Text hiddenFrom="sm" size="0.8rem" fw={600} mt="sm" aria-live="polite">
          Etapa {step} de {WIZARD_STEPS.length} · {WIZARD_STEPS[step - 1].label}
        </Text>
      </Paper>

      {/* Step Content */}
      <Paper withBorder radius="lg" p={{ base: 'md', sm: 'lg' }}>
        {/* Step 1: Campanha */}
        {step === 1 && (
          <Box>
            <StepHeader title="Campanha" subtitle="Para qual campanha esta peça será criada?" />
            {campaigns.length > 0 ? (
              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                {campaigns.map(c => {
                  const isSelected = campaignId === c.id;
                  return (
                    <Paper
                      key={c.id}
                      component="button"
                      type="button"
                      withBorder
                      radius="lg"
                      onClick={() => setCampaignId(c.id)}
                      className={optionClass}
                      data-selected={isSelected || undefined}
                    >
                      <AspectRatio ratio={4 / 5}>
                        <Center bg="var(--mantine-color-default-hover)">
                          {c.photos.length > 0 ? (
                            <Image src={c.photos[0]} alt={c.name} h="100%" flex={1} />
                          ) : (
                            <ImageIcon size={32} color={DIMMED} opacity={0.3} />
                          )}
                        </Center>
                      </AspectRatio>
                      <Group p="sm" justify="space-between" align="flex-start" gap={8} wrap="nowrap" bg="var(--mantine-color-default-hover)">
                        <Box miw={0}>
                          <Text size="0.85rem" fw={600} truncate>{c.name}</Text>
                          <Text c="dimmed" size="0.72rem" truncate>{c.description || 'Sem descrição'}</Text>
                        </Box>
                        {isSelected && <Box display="flex" mt={2}><CheckIcon size={16} /></Box>}
                      </Group>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            ) : (
              <EmptyState title="Nenhuma campanha cadastrada" subtitle="Crie uma em Gerenciar campanhas" />
            )}
          </Box>
        )}

        {/* Step 2: Formato (multi-select) */}
        {step === 2 && (
          <Box>
            <Group justify="space-between" wrap="wrap" gap={8} mb={4}>
              <Title order={3} fw={600} fz="1rem">Formato da peça</Title>
              <Text c="dimmed" size="0.78rem">{selectedFormats.size} selecionado(s)</Text>
            </Group>
            <Text c="dimmed" size="0.78rem" mb="md">Onde esta campanha será usada? Selecione um ou mais formatos.</Text>
            <Stack gap="lg">
              {FORMAT_GROUPS.map(group => (
                <Box key={group}>
                  <Text c="dimmed" size="0.7rem" fw={600} mb={8} tt="uppercase" lts="0.04em">
                    {group}
                  </Text>
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                    {FORMATS.filter(f => f.group === group).map(f => {
                      const Icon = f.icon;
                      const isSelected = selectedFormats.has(f.id);
                      return (
                        <Paper
                          key={f.id}
                          component="button"
                          type="button"
                          withBorder
                          radius="lg"
                          p="md"
                          onClick={() => toggleFormat(f.id)}
                          className={`${optionClass} ${classes.optionTinted}`}
                          data-selected={isSelected || undefined}
                        >
                          <ThemeIcon variant="light" color="neutral" size={36} radius="md">
                            <Icon size={20} />
                          </ThemeIcon>
                          <Text size="0.85rem" fw={600} mt={8}>{f.label}</Text>
                          <Text c="dimmed" size="0.72rem">{f.description}</Text>
                          <Text c="dimmed" size="0.68rem" mt={2}>{f.spec}</Text>
                          {isSelected && <Box mt={8}><CheckIcon size={16} /></Box>}
                        </Paper>
                      );
                    })}
                  </SimpleGrid>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Step 3: Produtos */}
        {step === 3 && (
          <Box>
            <StepHeader
              title="Selecionar produtos"
              subtitle="Escolha até 3 produtos para a campanha"
              right={<Text c="dimmed" size="0.78rem">{selectedProducts.size}/3 selecionados</Text>}
            />
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
              {sortedProducts.map(p => {
                const isSelected = selectedProducts.has(p.id);
                const meta = productMeta[p.id];
                return (
                  <Paper
                    key={p.id}
                    component="button"
                    type="button"
                    withBorder
                    radius="lg"
                    p="sm"
                    onClick={() => toggleProduct(p.id)}
                    className={`${optionClass} ${classes.optionTinted}`}
                    data-selected={isSelected || undefined}
                    bg={isSelected ? undefined : 'var(--mantine-color-default-hover)'}
                  >
                    <Card radius="md" padding={0} pos="relative" h={96} mb={8} bg="var(--mantine-color-gray-2)">
                      <Image src={p.image} alt={p.name} h="100%" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      {isSelected && (
                        <Center pos="absolute" inset={0} bg="rgba(0, 0, 0, 0.3)">
                          <CheckIcon size={24} color="#fff" />
                        </Center>
                      )}
                    </Card>
                    {meta && (
                      <Badge
                        variant="light"
                        color={tagColors[meta.tag]}
                        size="xs"
                        mb={4}
                        styles={{ label: { textTransform: 'capitalize', fontSize: '0.62rem', fontWeight: 600 } }}
                      >
                        {meta.tag}
                      </Badge>
                    )}
                    <Text size="0.75rem" fw={600} truncate>{p.name}</Text>
                    <Text size="0.72rem" fw={600} className="mono">{formatCurrency(p.price)}</Text>
                    {meta && <Text c="dimmed" size="0.68rem">Estoque: {meta.stock} pares</Text>}
                  </Paper>
                );
              })}
            </SimpleGrid>
          </Box>
        )}

        {/* Step 4: Tema (cenário fotográfico da campanha escolhida na Etapa 1) */}
        {step === 4 && (
          <Box>
            <StepHeader
              title="Tema visual"
              subtitle={`Escolha um cenário fotográfico de ${selectedCampaign ? `"${selectedCampaign.name}"` : 'sua campanha'}`}
            />
            {selectedCampaign && selectedCampaign.photos.length > 0 ? (
              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                {selectedCampaign.photos.map((photo, idx) => {
                  const isSelected = scenarioIndex === idx;
                  return (
                    <Paper
                      key={idx}
                      component="button"
                      type="button"
                      withBorder
                      radius="lg"
                      onClick={() => setScenarioIndex(idx)}
                      className={optionClass}
                      data-selected={isSelected || undefined}
                    >
                      <AspectRatio ratio={4 / 5}>
                        <Box bg="var(--mantine-color-default-hover)">
                          <Image src={photo} alt={`Cenário ${idx + 1}`} h="100%" />
                        </Box>
                      </AspectRatio>
                      <Group p="sm" justify="space-between" wrap="nowrap" bg="var(--mantine-color-default-hover)">
                        <Text size="0.8rem" fw={600}>Cenário {idx + 1}</Text>
                        {isSelected && <CheckIcon size={14} />}
                      </Group>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            ) : (
              <EmptyState title="Nenhum cenário disponível para esta campanha" subtitle="Adicione cenários em Gerenciar campanhas" />
            )}
          </Box>
        )}

        {/* Step 5: Texto */}
        {step === 5 && (
          <Box>
            <StepHeader title="Texto assistido por IA" subtitle="Descreva o tom da campanha ou use uma sugestão" />
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.currentTarget.value)}
              rows={4}
              mb="sm"
              styles={{ input: { fontSize: '0.88rem', lineHeight: 1.6, padding: '12px 16px' } }}
            />
            <Box mb="md">
              <Text c="dimmed" size="0.75rem" fw={600} mb={8}>Sugestões da IA:</Text>
              <Stack gap={8}>
                {AI_PROMPTS.map((sugg, i) => (
                  <Paper
                    key={i}
                    component="button"
                    type="button"
                    withBorder
                    radius="md"
                    p="sm"
                    onClick={() => setPrompt(sugg)}
                    className={`${interactive.cardButton} ${classes.suggestion}`}
                    data-selected={prompt === sugg || undefined}
                    fz="0.78rem"
                    lh={1.5}
                  >
                    {sugg}
                  </Paper>
                ))}
              </Stack>
            </Box>
            <Paper radius="md" p="sm" bg="var(--mantine-color-default-hover)">
              <Text c="dimmed" size="0.75rem">
                <MagicWandIcon size={14} color="var(--mantine-color-violet-5)" className={classes.inlineIcon} />
                A IA irá gerar textos, adaptar o layout e compor a lâmina automaticamente usando os produtos selecionados.
              </Text>
            </Paper>
          </Box>
        )}

        {/* Step 6: Resultado — cards like Histórico, one per selected format */}
        {step === 6 && (
          <Box>
            <StepHeader
              title="Resultado da campanha"
              subtitle={`${selectedFormatList.length} ${selectedFormatList.length === 1 ? 'peça gerada' : 'peças geradas'}`}
              right={
                <Button
                  onClick={() => setStep(5)}
                  variant="subtle"
                  color="gray"
                  size="compact-sm"
                  leftSection={<ArrowsClockwiseIcon size={14} />}
                  styles={{ label: { fontSize: '0.78rem' } }}
                >
                  Regenerar peças
                </Button>
              }
            />

            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
              {selectedFormatList.map(f => (
                <Card key={f.id} withBorder radius="lg" padding={0}>
                  <AspectRatio ratio={1}>
                    <Box bg="var(--mantine-color-default-hover)">
                      <Image src={campaignPreviewMock} alt={f.label} h="100%" />
                    </Box>
                  </AspectRatio>
                  <PieceInfo label={f.label} copy={prompt} />
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Paper>

      {/* Navigation */}
      <Group justify="space-between" gap="sm">
        <Button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          variant="default"
          leftSection={<CaretLeftIcon size={16} />}
          styles={{ label: { fontSize: '0.85rem' } }}
        >
          {step > 1 ? `Voltar para ${WIZARD_STEPS[step - 2].label}` : 'Voltar'}
        </Button>

        {step < 5 ? (
          <Button
            onClick={() => setStep(s => s + 1)}
            disabled={
              (step === 1 && !campaignId) ||
              (step === 2 && selectedFormats.size === 0) ||
              (step === 3 && selectedProducts.size === 0) ||
              (step === 4 && (!selectedCampaign || selectedCampaign.photos.length === 0))
            }
            rightSection={<CaretRightIcon size={16} />}
            styles={{ label: { fontSize: '0.85rem' } }}
          >
            Avançar para {WIZARD_STEPS[step].label}
          </Button>
        ) : step === 5 ? (
          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt}
            leftSection={generating ? <Loader size={16} color="white" /> : <SparkleIcon size={16} />}
            styles={{
              root: {
                background: 'linear-gradient(135deg, oklch(0.55 0.22 285), oklch(0.6 0.22 262))',
                color: '#fff',
                opacity: generating || !prompt ? 0.6 : 1,
              },
              label: { fontSize: '0.9rem', fontWeight: 700 },
            }}
          >
            {generating ? 'Gerando peças...' : 'Gerar peças'}
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            leftSection={<CheckIcon size={16} />}
            styles={{ label: { fontSize: '0.85rem' } }}
          >
            Salvar no histórico
          </Button>
        )}
      </Group>
    </Stack>
  );
}

export function MarketingStudio({ profile }: { profile: Profile }) {
  const [mode, setMode] = useState<Mode>('home');
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialCampaigns[0]?.id ?? null);

  const handleDeleteCampaign = (id: string) => {
    const idx = campaigns.findIndex(c => c.id === id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
    if (selectedCampaignId === id) {
      const fallback = campaigns[idx + 1] ?? campaigns[idx - 1] ?? null;
      setSelectedCampaignId(fallback ? fallback.id : null);
    }
    toast.success('Campanha excluída');
  };

  if (mode === 'campaigns') {
    return (
      <CampaignsManager
        campaigns={campaigns}
        selectedId={selectedCampaignId}
        onSelect={setSelectedCampaignId}
        onBack={() => setMode('home')}
        onCreateCampaign={(name, description) => {
          const id = `camp-${Date.now()}`;
          setCampaigns(prev => [{ id, name, description, photos: [] }, ...prev]);
          setSelectedCampaignId(id);
          toast.success('Campanha criada');
        }}
        onAddPhotos={(campaignId, photos) => {
          setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, photos: [...photos, ...c.photos] } : c));
          toast.success(photos.length > 1 ? `${photos.length} fotos adicionadas` : 'Foto adicionada');
        }}
        onDeletePhoto={(campaignId, photoIndex) => {
          setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, photos: c.photos.filter((_, i) => i !== photoIndex) } : c));
          toast.success('Cenário removido');
        }}
        onDeleteCampaign={handleDeleteCampaign}
      />
    );
  }

  if (mode === 'wizard') {
    return (
      <CampaignWizard
        profile={profile}
        campaigns={campaigns}
        onBack={() => setMode('home')}
        onFinish={items => setHistory(prev => [...items, ...prev])}
      />
    );
  }

  return (
    <MarketingHome
      history={history}
      onCreate={() => setMode('wizard')}
      onManageCampaigns={() => setMode('campaigns')}
      onDelete={id => {
        setHistory(prev => prev.filter(item => item.id !== id));
        toast.success('Peça excluída do histórico');
      }}
    />
  );
}
