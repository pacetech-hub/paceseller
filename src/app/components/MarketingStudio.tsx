import { useState, useEffect } from "react";
import {
  Stack, Group, Flex, Box, Paper, Card, Text, Title, Button, ActionIcon, SimpleGrid, ThemeIcon, Badge, Divider,
  Modal, TextInput, Textarea, FileButton, UnstyledButton, AspectRatio, Loader, Center, Image,
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

function EmptyState({ title, subtitle, action, iconSize = 32, withCard = false, py = 40, strongTitle = false }: {
  title: string; subtitle?: string; action?: React.ReactNode; iconSize?: number; withCard?: boolean; py?: number; strongTitle?: boolean;
}) {
  const content = (
    <Stack align="center" justify="center" gap={0} py={py} ta="center">
      <Box mb={strongTitle ? 12 : 8} lh={0}>
        <ImageIcon size={iconSize} color={DIMMED} opacity={0.3} />
      </Box>
      {strongTitle ? (
        <Text fw={600}>{title}</Text>
      ) : (
        <Text c="dimmed">{title}</Text>
      )}
      {subtitle && <Text c="dimmed" size="sm" mt={4}>{subtitle}</Text>}
      {action && <Box mt="md">{action}</Box>}
    </Stack>
  );
  return withCard ? <Paper withBorder>{content}</Paper> : content;
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <Group>
      <Button
        onClick={onClick}
        variant="subtle"
        color="gray"
        ml={-8}
        leftSection={<CaretLeftIcon size={16} />}
      >
        Voltar para Marketing IA
      </Button>
    </Group>
  );
}

function PieceInfo({ label, copy }: { label: string; copy: string }) {
  return (
    <Box p="sm">
      <Text fw={600} truncate>{label}</Text>
      <Text c="dimmed" size="sm" mb={8} lineClamp={2}>{copy}</Text>
      <Button
        onClick={() => toast.success(`Download de "${label}" iniciado`, 'O arquivo vai para a pasta de downloads do navegador')}
        variant="default"
        fullWidth
        leftSection={<DownloadSimpleIcon size={16} />}
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
      <Paper withBorder p={{ base: 'md', sm: 'lg' }} bg="var(--mantine-color-default-hover)">
        <Group justify="space-between" wrap="wrap" gap="md">
          <Group gap="sm" wrap="nowrap">
            <ThemeIcon variant="light" color="neutral" size={40}>
              <SparkleIcon size={20} />
            </ThemeIcon>
            <Box>
              <Title order={1}>Estúdio de Marketing com IA</Title>
              <Text c="dimmed" size="sm">Crie campanhas profissionais em menos de 2 minutos</Text>
            </Box>
          </Group>
          <Group gap={8} wrap="wrap">
            <Button
              onClick={onManageCampaigns}
              variant="subtle"
              leftSection={<PencilSimpleIcon size={16} />}
            >
              Gerenciar campanhas
            </Button>
            <Button
              onClick={onCreate}
              leftSection={<SparkleIcon size={16} />}
            >
              Criar campanha
            </Button>
          </Group>
        </Group>
      </Paper>

      {/* Histórico */}
      <Box>
        <Title order={2} mb="sm">Histórico de peças</Title>
        {history.length > 0 ? (
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
            {history.map(item => (
              <Card key={item.id} withBorder padding={0}>
                <AspectRatio ratio={1}>
                  <Box pos="relative" bg="var(--mantine-color-default-hover)">
                    <Image src={item.image} alt={item.formatLabel} h="100%" />
                    <Button
                      onClick={() => onDelete(item.id)}
                      aria-label={`Excluir peça ${item.formatLabel} do histórico`}
                      variant="transparent"
                      pos="absolute"
                      top={8}
                      right={8}
                      leftSection={<TrashIcon size={16} />}
                      className={classes.overlayDelete}
                    >
                      Excluir
                    </Button>
                  </Box>
                </AspectRatio>
                <PieceInfo label={item.formatLabel} copy={item.copy} />
              </Card>
            ))}
          </SimpleGrid>
        ) : (
          <EmptyState
            withCard
            strongTitle
            iconSize={40}
            py={64}
            title="Nenhuma peça no histórico ainda"
            subtitle="As peças que você salvar ao final do assistente aparecem aqui"
            action={
              <Button onClick={onCreate} variant="default" leftSection={<SparkleIcon size={16} />}>
                Criar campanha
              </Button>
            }
          />
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
  const [nameError, setNameError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);

  const selected = campaigns.find(c => c.id === selectedId) ?? null;

  const handleCreate = () => {
    if (!newName.trim()) {
      setNameError('Informe o nome da campanha, ex.: Dia dos Pais');
      return;
    }
    onCreateCampaign(newName.trim(), newDescription.trim());
    setNewName('');
    setNewDescription('');
    setNameError(null);
    setCreating(false);
  };

  const closeCreate = () => {
    setCreating(false);
    setNewName('');
    setNewDescription('');
    setNameError(null);
  };

  const handleFiles = (files: File[]) => {
    if (!selected) return;
    if (!files || files.length === 0) return;
    onAddPhotos(selected.id, files.map(f => URL.createObjectURL(f)));
  };

  const uploadButton = (
    <FileButton onChange={handleFiles} accept="image/*" multiple>
      {props => (
        <Button {...props} variant="default" leftSection={<UploadSimpleIcon size={16} />}>
          Enviar cenário
        </Button>
      )}
    </FileButton>
  );

  return (
    <Stack gap="lg" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      <BackLink onClick={onBack} />

      <Box>
        <Title order={1}>Gerenciar campanhas</Title>
        <Text c="dimmed" size="sm">Configure os objetivos de campanha e os cenários fotográficos usados como fundo das peças</Text>
      </Box>

      {/* Lista à esquerda e detalhe à direita a partir de sm; empilhados abaixo disso */}
      <Flex direction={{ base: 'column', sm: 'row' }} align={{ base: 'stretch', sm: 'flex-start' }} gap="lg">
        {/* Left panel: campaign list */}
        <Paper withBorder p={8} w={{ base: '100%', sm: 220, md: 256 }} flex="none">
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
                    <Text fw={active ? 600 : 400} truncate>
                      {c.name}
                    </Text>
                  </UnstyledButton>
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
          >
            Nova campanha
          </Button>
        </Paper>

        {/* Main content: selected campaign detail */}
        <Stack gap="md" flex={1} miw={0}>
          {selected ? (
            <>
              <Paper withBorder p="md">
                <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
                  <Box miw={0} flex={1}>
                    <Title order={2}>{selected.name}</Title>
                    <Text c="dimmed" mt={4}>
                      {selected.description || 'Sem descrição.'}
                    </Text>
                  </Box>
                  <Button
                    onClick={() => setDeleteTarget(selected)}
                    variant="default"
                    c="red"
                    leftSection={<TrashIcon size={16} />}
                  >
                    Excluir campanha
                  </Button>
                </Group>
              </Paper>

              <Paper withBorder p="md">
                <Group justify="space-between" wrap="wrap" gap={8} mb="sm">
                  <Text fw={600}>
                    {selected.photos.length} {selected.photos.length === 1 ? 'cenário fotográfico' : 'cenários fotográficos'}
                  </Text>
                  {/* Com a lista vazia o botão aparece no estado vazio, abaixo */}
                  {selected.photos.length > 0 && uploadButton}
                </Group>

                {selected.photos.length > 0 ? (
                  <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                    {selected.photos.map((photo, idx) => (
                      <AspectRatio key={idx} ratio={1}>
                        <Card bd={`1px solid ${BORDER_COLOR}`} padding={0} pos="relative" bg="var(--mantine-color-default-hover)">
                          <Image src={photo} alt={`${selected.name} — cenário ${idx + 1}`} h="100%" />
                          <Button
                            onClick={() => onDeletePhoto(selected.id, idx)}
                            aria-label={`Excluir cenário ${idx + 1}`}
                            variant="transparent"
                            pos="absolute"
                            top={8}
                            right={8}
                            leftSection={<TrashIcon size={16} />}
                            className={classes.overlayDelete}
                          >
                            Excluir
                          </Button>
                        </Card>
                      </AspectRatio>
                    ))}
                  </SimpleGrid>
                ) : (
                  <EmptyState
                    title="Nenhum cenário enviado ainda"
                    subtitle="Envie fotos de ambiente para usar como fundo das peças desta campanha"
                    action={uploadButton}
                  />
                )}
              </Paper>
            </>
          ) : (
            <EmptyState
              withCard
              strongTitle
              iconSize={40}
              py={64}
              title="Nenhuma campanha selecionada"
              subtitle="Selecione uma campanha na lista ou crie uma nova para enviar cenários"
              action={
                <Button onClick={() => setCreating(true)} variant="default" leftSection={<PlusIcon size={16} />}>
                  Nova campanha
                </Button>
              }
            />
          )}
        </Stack>
      </Flex>

      {/* Create campaign dialog */}
      <Modal
        opened={creating}
        onClose={closeCreate}
        size="sm"
        centered
        title={
          <Box>
            <Text fw={600} size="lg">Nova campanha</Text>
            <Text c="dimmed" size="sm">Defina o nome e a descrição deste objetivo de campanha</Text>
          </Box>
        }
      >
        <Stack gap="md" py={4}>
          <TextInput
            data-autofocus
            label="Nome"
            value={newName}
            onChange={e => { setNewName(e.currentTarget.value); setNameError(null); }}
            placeholder="Ex.: Dia dos Pais"
            error={nameError}
          />
          <Textarea
            label="Descrição (opcional)"
            value={newDescription}
            onChange={e => setNewDescription(e.currentTarget.value)}
            rows={3}
            placeholder="Descreva o objetivo desta campanha"
          />
        </Stack>
        <Group justify="flex-end" gap={8} mt="lg">
          <Button onClick={closeCreate} variant="default">
            Cancelar
          </Button>
          <Button onClick={handleCreate}>
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
        <Text fw={600} size="lg">Excluir campanha</Text>
        <Text c="dimmed" mt={6}>
          Tem certeza que deseja excluir "{deleteTarget?.name}"? Os cenários fotográficos associados também serão removidos. Esta ação não pode ser desfeita.
        </Text>
        <Group justify="flex-end" gap={8} mt="lg">
          <Button onClick={() => setDeleteTarget(null)} variant="default">
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (deleteTarget) onDeleteCampaign(deleteTarget.id);
              setDeleteTarget(null);
            }}
            color="red"
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
        <Title order={2}>{title}</Title>
        {subtitle && <Text c="dimmed" size="sm" mt={4}>{subtitle}</Text>}
      </Box>
      {right}
    </Group>
  );
}

function CampaignWizard({ profile, campaigns, onBack, onManageCampaigns, onFinish }: { profile: Profile; campaigns: Campaign[]; onBack: () => void; onManageCampaigns: () => void; onFinish: (items: HistoryItem[]) => void }) {
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
    toast.success(items.length === 1 ? 'Peça salva no histórico' : `${items.length} peças salvas no histórico`, 'Veja em Histórico de peças');
    onBack();
  };

  const optionClass = `${interactive.cardButton} ${classes.option}`;

  // Motivo pelo qual o botão principal está desativado, mostrado ao lado da navegação
  const blockedReason =
    step === 1 && !campaignId ? 'Crie uma campanha em Gerenciar campanhas para continuar' :
    step === 2 && selectedFormats.size === 0 ? 'Selecione ao menos um formato para continuar' :
    step === 3 && selectedProducts.size === 0 ? 'Selecione ao menos um produto para continuar' :
    step === 4 && (!selectedCampaign || selectedCampaign.photos.length === 0) ? 'Adicione um cenário à campanha para continuar' :
    step === 5 && !prompt.trim() ? 'Escreva o texto da campanha ou escolha uma sugestão' :
    null;

  const manageCampaignsButton = (
    <Button onClick={onManageCampaigns} variant="default" leftSection={<PencilSimpleIcon size={16} />}>
      Gerenciar campanhas
    </Button>
  );

  return (
    <Stack gap="lg" p={{ base: 'md', sm: 'lg' }} maw={1400} mx="auto" w="100%">
      <BackLink onClick={onBack} />

      {/* Stepper */}
      <Paper withBorder p="md">
        <Group justify="space-between" wrap="nowrap" gap={0}>
          {WIZARD_STEPS.map((s, i) => {
            const done = step > s.n;
            const current = step === s.n;
            return (
              <Group key={s.n} gap={0} wrap="nowrap" flex={1}>
                <Group gap={8} wrap="nowrap">
                  <ActionIcon
                    onClick={() => s.n <= step && setStep(s.n)}
                    size="input-sm"
                    variant={done || current ? 'filled' : 'light'}
                    color={done || current ? 'neutral' : 'gray'}
                    aria-label={`Etapa ${s.n}: ${s.label}`}
                    flex="none"
                    fz="md"
                    fw={700}
                    c={done || current ? undefined : 'dimmed'}
                    className={classes.stepDot}
                    data-current={current || undefined}
                  >
                    {done ? <CheckIcon size={16} /> : s.n}
                  </ActionIcon>
                  <Text
                    visibleFrom="sm"
                    size="sm"
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
        <Text hiddenFrom="sm" fw={600} mt="sm" aria-live="polite">
          Etapa {step} de {WIZARD_STEPS.length} · {WIZARD_STEPS[step - 1].label}
        </Text>
      </Paper>

      {/* Step Content */}
      <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
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
                          <Text fw={600} truncate>{c.name}</Text>
                          <Text c="dimmed" size="sm" truncate>{c.description || 'Sem descrição'}</Text>
                        </Box>
                        {isSelected && <Box display="flex" mt={2}><CheckIcon size={16} /></Box>}
                      </Group>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            ) : (
              <EmptyState
                title="Nenhuma campanha cadastrada"
                subtitle="A peça precisa de uma campanha com cenários fotográficos. Crie uma para continuar."
                action={manageCampaignsButton}
              />
            )}
          </Box>
        )}

        {/* Step 2: Formato (multi-select) */}
        {step === 2 && (
          <Box>
            <Group justify="space-between" wrap="wrap" gap={8} mb={4}>
              <Title order={2}>Formato da peça</Title>
              <Text c="dimmed" size="sm">{selectedFormats.size} selecionado(s)</Text>
            </Group>
            <Text c="dimmed" size="sm" mb="md">Onde esta campanha será usada? Selecione um ou mais formatos.</Text>
            <Stack gap="lg">
              {FORMAT_GROUPS.map(group => (
                <Box key={group}>
                  <Text c="dimmed" size="sm" fw={600} mb={8} tt="uppercase">
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
                          p="md"
                          onClick={() => toggleFormat(f.id)}
                          className={`${optionClass} ${classes.optionTinted}`}
                          data-selected={isSelected || undefined}
                        >
                          <ThemeIcon variant="light" color="neutral" size={36}>
                            <Icon size={20} />
                          </ThemeIcon>
                          <Text fw={600} mt={8}>{f.label}</Text>
                          <Text c="dimmed" size="sm">{f.description}</Text>
                          <Text c="dimmed" size="sm" mt={2}>{f.spec}</Text>
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
              right={
                <Text c="dimmed" size="sm">
                  {selectedProducts.size}/3 selecionados
                  {selectedProducts.size >= 3 && ' · desmarque um para trocar'}
                </Text>
              }
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
                    p="sm"
                    onClick={() => toggleProduct(p.id)}
                    className={`${optionClass} ${classes.optionTinted}`}
                    data-selected={isSelected || undefined}
                    bg={isSelected ? undefined : 'var(--mantine-color-default-hover)'}
                  >
                    <Card padding={0} pos="relative" h={96} mb={8} bg="var(--mantine-color-gray-2)">
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
                        mb={4}
                      >
                        {meta.tag.charAt(0).toUpperCase() + meta.tag.slice(1)}
                      </Badge>
                    )}
                    <Text fw={600} truncate>{p.name}</Text>
                    <Text fw={600} className="mono">{formatCurrency(p.price)}</Text>
                    {meta && <Text c="dimmed" size="sm">Estoque: {meta.stock} pares</Text>}
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
                        <Text fw={600}>Cenário {idx + 1}</Text>
                        {isSelected && <CheckIcon size={16} />}
                      </Group>
                    </Paper>
                  );
                })}
              </SimpleGrid>
            ) : (
              <EmptyState
                title="Esta campanha ainda não tem cenários"
                subtitle="Envie ao menos um cenário fotográfico em Gerenciar campanhas para usar como fundo da peça"
                action={manageCampaignsButton}
              />
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
              aria-label="Texto da campanha"
            />
            <Box mb="md">
              <Text c="dimmed" size="sm" fw={600} mb={8}>Sugestões da IA:</Text>
              <Stack gap={8}>
                {AI_PROMPTS.map((sugg, i) => (
                  <Paper
                    key={i}
                    component="button"
                    type="button"
                    withBorder
                    p="sm"
                    onClick={() => setPrompt(sugg)}
                    className={`${interactive.cardButton} ${classes.suggestion}`}
                    data-selected={prompt === sugg || undefined}
                    lh={1.5}
                  >
                    {sugg}
                  </Paper>
                ))}
              </Stack>
            </Box>
            <Paper p="sm" bg="var(--mantine-color-default-hover)">
              <Text c="dimmed" size="sm">
                <MagicWandIcon size={16} color="var(--mantine-color-violet-5)" className={classes.inlineIcon} />
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
              subtitle={`${selectedFormatList.length} ${selectedFormatList.length === 1 ? 'peça gerada' : 'peças geradas'} · baixe cada uma ou salve todas no histórico`}
              right={
                <Button
                  onClick={() => setStep(5)}
                  variant="subtle"
                  color="gray"
                  leftSection={<ArrowsClockwiseIcon size={16} />}
                >
                  Regenerar peças
                </Button>
              }
            />

            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
              {selectedFormatList.map(f => (
                <Card key={f.id} withBorder padding={0}>
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

      {/* Navegação: secundária à esquerda, principal à direita; no celular empilha com a principal por último (embaixo) */}
      <Stack gap={8}>
        {blockedReason && (
          <Text c="dimmed" size="sm" ta={{ base: 'left', xs: 'right' }} aria-live="polite">
            {blockedReason}
          </Text>
        )}
        <Flex direction={{ base: 'column', xs: 'row' }} justify="flex-end" gap="sm">
          {step > 1 && (
            <Button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              variant="default"
              leftSection={<CaretLeftIcon size={16} />}
            >
              Voltar para {WIZARD_STEPS[step - 2].label}
            </Button>
          )}

          {step < 5 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={blockedReason !== null}
              rightSection={<CaretRightIcon size={16} />}
            >
              Avançar para {WIZARD_STEPS[step].label}
            </Button>
          ) : step === 5 ? (
            <Button
              onClick={handleGenerate}
              disabled={generating || blockedReason !== null}
              leftSection={generating ? <Loader size={16} color="white" /> : <SparkleIcon size={16} />}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, oklch(0.55 0.22 285), oklch(0.6 0.22 262))',
                  color: '#fff',
                  opacity: generating || blockedReason !== null ? 0.6 : 1,
                },
              }}
            >
              {generating ? 'Gerando peças...' : 'Gerar peças'}
            </Button>
          ) : (
            <Button onClick={handleFinish} leftSection={<CheckIcon size={16} />}>
              Salvar no histórico
            </Button>
          )}
        </Flex>
      </Stack>
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
    toast.success('Campanha excluída', 'Para criar outra, use "Nova campanha"');
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
          toast.success('Campanha criada', 'Agora envie os cenários fotográficos dela em "Enviar cenário"');
        }}
        onAddPhotos={(campaignId, photos) => {
          setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, photos: [...photos, ...c.photos] } : c));
          toast.success(photos.length > 1 ? `${photos.length} cenários adicionados` : 'Cenário adicionado', 'Ele já pode ser escolhido na etapa Tema ao criar uma peça');
        }}
        onDeletePhoto={(campaignId, photoIndex) => {
          setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, photos: c.photos.filter((_, i) => i !== photoIndex) } : c));
          toast.success('Cenário removido', 'Envie outro em "Enviar cenário" quando quiser');
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
        onManageCampaigns={() => setMode('campaigns')}
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
        toast.success('Peça excluída do histórico', 'Para criar uma nova peça, use "Criar campanha"');
      }}
    />
  );
}
