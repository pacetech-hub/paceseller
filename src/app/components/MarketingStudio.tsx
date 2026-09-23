import { useState, useEffect, type CSSProperties } from "react";
import {
  ActionIcon, Badge, Box, Button, Center, Group, Loader, Modal, Paper, SimpleGrid, Stack,
  Text, TextInput, Textarea, ThemeIcon, Title, UnstyledButton, type BadgeProps,
} from "@mantine/core";
import { toast } from "@/lib/toast";
import {
  Sparkles, Check, ChevronRight, ChevronLeft, Instagram, MessageCircle, Printer,
  Wand2, RefreshCw, Download, Pencil, Plus, Image as ImageIcon,
  Music2, Smartphone, Trash2, Upload,
} from "lucide-react";
import { products, formatCurrency, type Product } from "../data/mockData";
import classes from "./MarketingStudio.module.css";
import campaignPreviewMock from "@/assets/campaign-preview-mock.png";
import bannerLimitedEdition from "@/assets/banner-edicao-limitada.webp";

type Profile = 'admin' | 'rep' | 'lojista';

const FORMAT_GROUPS = ['WhatsApp', 'Instagram', 'TikTok', 'Impressão'] as const;

const FORMATS = [
  { id: 'whatsapp', group: 'WhatsApp', label: 'WhatsApp', description: 'Status e disparo para lista de clientes', spec: '1080 × 1080', icon: MessageCircle },
  { id: 'instagram-feed', group: 'Instagram', label: 'Instagram Feed 4:5', description: 'Publicação no feed, formato vertical', spec: '1080 × 1350 · 4:5', icon: Instagram },
  { id: 'story', group: 'Instagram', label: 'Instagram Story 9:16', description: 'Tela cheia, com espaço para o dedo tocar', spec: '1080 × 1920 · 9:16', icon: Smartphone },
  { id: 'tiktok', group: 'TikTok', label: 'TikTok', description: 'Vertical cheia, texto grande para vídeo', spec: '1080 × 1920 · 9:16 · 5s', icon: Music2 },
  { id: 'impressao-a3', group: 'Impressão', label: 'Impressão A3', description: 'Cartaz grande para vitrine', spec: '29,7 × 42 cm · PDF', icon: Printer },
  { id: 'impressao-a4', group: 'Impressão', label: 'Impressão A4', description: 'Cartaz para parede e balcão', spec: '21 × 29,7 cm · PDF', icon: Printer },
  { id: 'impressao-a5', group: 'Impressão', label: 'Impressão A5', description: 'Panfleto de balcão e sacola', spec: '14,8 × 21 cm · PDF', icon: Printer },
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

const tagBadge: Record<ProductTag, Pick<BadgeProps, 'color' | 'c'>> = {
  'lançamento': { color: 'gray', c: 'gray.9' },
  'alto giro': { color: 'teal', c: 'teal.7' },
  'estoque parado': { color: 'yellow', c: 'yellow.8' },
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

const clampStyle: CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const coverImg: CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };

const sectionLabelStyle: CSSProperties = { fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' };

const dialogFieldStyles = {
  label: { fontSize: '0.72rem', color: 'var(--mantine-color-dimmed)', fontWeight: 400, marginBottom: 4 },
  input: { fontSize: '0.82rem', backgroundColor: 'var(--mantine-color-gray-0)' } as CSSProperties,
};

type Mode = 'home' | 'wizard' | 'campaigns';

function MarketingHome({ history, onCreate, onManageCampaigns, onDelete }: { history: HistoryItem[]; onCreate: () => void; onManageCampaigns: () => void; onDelete: (id: string) => void }) {
  return (
    <Stack p="lg" maw={1400} mx="auto" w="100%" gap={20}>
      {/* Header */}
      <Group justify="space-between" wrap="wrap" gap="md" p={20} bg="gray.0" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: 'var(--mantine-radius-lg)' }}>
        <Group gap="sm" wrap="nowrap">
          <ThemeIcon size={40} radius="lg" variant="light" color="gray" bg="gray.1">
            <Sparkles size={20} color="var(--mantine-color-gray-9)" />
          </ThemeIcon>
          <Box>
            <Title order={2} fw={700} fz="1rem">Estúdio de Marketing com IA</Title>
            <Text c="dimmed" fz="0.8rem">Crie campanhas profissionais em menos de 2 minutos</Text>
          </Box>
        </Group>
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Button
            onClick={onManageCampaigns}
            variant="subtle"
            px="sm"
            fz="0.82rem"
            fw={600}
            leftSection={<Pencil size={16} />}
          >
            Gerenciar campanhas
          </Button>
          <Button
            onClick={onCreate}
            fz="0.85rem"
            fw={600}
            leftSection={<Sparkles size={16} />}
          >
            Criar campanha
          </Button>
        </Group>
      </Group>

      {/* Histórico */}
      <Box>
        <Text c="dimmed" mb="sm" style={sectionLabelStyle}>
          Histórico
        </Text>
        {history.length > 0 ? (
          <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="md">
            {history.map(item => (
              <Paper key={item.id} withBorder radius="lg" style={{ overflow: 'hidden' }}>
                <Box pos="relative" bg="gray.0" style={{ aspectRatio: '1 / 1' }}>
                  <img src={item.image} alt={item.formatLabel} style={coverImg} />
                  <ActionIcon
                    onClick={() => onDelete(item.id)}
                    aria-label="Excluir"
                    size={28}
                    radius="md"
                    variant="transparent"
                    pos="absolute"
                    className={classes.overlayDelete}
                    style={{ top: 8, right: 8 }}
                  >
                    <Trash2 size={14} />
                  </ActionIcon>
                </Box>
                <Box p="sm">
                  <Text truncate fz="0.82rem" fw={600}>{item.formatLabel}</Text>
                  <Text c="dimmed" mb="xs" fz="0.72rem" style={clampStyle}>{item.copy}</Text>
                  <Button
                    onClick={() => toast.success('Arquivo baixado')}
                    fullWidth
                    variant="default"
                    size="xs"
                    fz="0.78rem"
                    fw={500}
                    leftSection={<Download size={14} />}
                  >
                    Baixar
                  </Button>
                </Box>
              </Paper>
            ))}
          </SimpleGrid>
        ) : (
          <Paper withBorder radius="lg" py={64}>
            <Stack align="center" justify="center" ta="center" gap={0}>
              <ImageIcon size={40} color="var(--mantine-color-gray-4)" style={{ marginBottom: 12 }} />
              <Text fw={600}>Nenhuma campanha criada ainda</Text>
              <Text c="dimmed" mt={4} fz="0.85rem">Clique em "Criar campanha" para começar</Text>
            </Stack>
          </Paper>
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    onAddPhotos(selected.id, Array.from(files).map(f => URL.createObjectURL(f)));
    e.target.value = '';
  };

  return (
    <Stack p="lg" maw={1400} mx="auto" w="100%" gap={20}>
      <UnstyledButton
        onClick={onBack}
        className={classes.backLink}
        fz="0.82rem"
        fw={500}
      >
        <ChevronLeft size={16} /> Voltar para Marketing IA
      </UnstyledButton>

      <Box>
        <Title order={2} fw={700} fz="1rem">Gerenciar campanhas</Title>
        <Text c="dimmed" fz="0.8rem">Configure os objetivos de campanha e os cenários fotográficos usados como fundo das peças</Text>
      </Box>

      <Group align="flex-start" gap={20} wrap="nowrap">
        {/* Left panel: campaign list */}
        <Paper withBorder radius="lg" p="xs" w={256} style={{ flexShrink: 0 }}>
          <Stack gap={2}>
            {campaigns.map(c => (
              <Box
                key={c.id}
                className={selectedId === c.id ? `${classes.campaignItem} ${classes.campaignItemActive}` : classes.campaignItem}
              >
                <UnstyledButton
                  onClick={() => onSelect(c.id)}
                  flex={1}
                  miw={0}
                  ta="left"
                  px="sm"
                  py={10}
                >
                  <Text truncate c={selectedId === c.id ? 'gray.9' : undefined} fz="0.85rem" fw={selectedId === c.id ? 600 : 500}>
                    {c.name}
                  </Text>
                </UnstyledButton>
                <ActionIcon
                  onClick={() => setDeleteTarget(c)}
                  aria-label={`Excluir ${c.name}`}
                  variant="transparent"
                  size={26}
                  radius="sm"
                  className={classes.campaignItemDelete}
                >
                  <Trash2 size={14} />
                </ActionIcon>
              </Box>
            ))}
          </Stack>
          <Button
            onClick={() => setCreating(true)}
            fullWidth
            variant="subtle"
            justify="flex-start"
            mt={4}
            px="sm"
            h={40}
            fz="0.85rem"
            fw={600}
            leftSection={<Plus size={16} />}
          >
            Nova campanha
          </Button>
        </Paper>

        {/* Main content: selected campaign detail */}
        <Stack flex={1} miw={0} gap="md">
          {selected ? (
            <>
              <Paper withBorder radius="lg" p="md">
                <Title order={3} fw={700} fz="0.95rem">{selected.name}</Title>
                <Text c="dimmed" mt={4} fz="0.82rem">
                  {selected.description || 'Sem descrição.'}
                </Text>
              </Paper>

              <Paper withBorder radius="lg" p="md">
                <Group justify="space-between" wrap="wrap" gap="xs" mb="sm">
                  <Text c="dimmed" style={sectionLabelStyle}>
                    {selected.photos.length} {selected.photos.length === 1 ? 'cenário fotográfico' : 'cenários fotográficos'}
                  </Text>
                  <Button
                    component="label"
                    variant="default"
                    size="xs"
                    fz="0.78rem"
                    fw={500}
                    leftSection={<Upload size={14} />}
                    className={classes.uploadLabel}
                  >
                    Enviar cenário
                    <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
                  </Button>
                </Group>

                {selected.photos.length > 0 ? (
                  <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
                    {selected.photos.map((photo, idx) => (
                      <Box key={idx} pos="relative" bg="gray.0" style={{ aspectRatio: '1 / 1', borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden', border: '1px solid var(--mantine-color-gray-3)' }}>
                        <img src={photo} alt={`${selected.name} — cenário ${idx + 1}`} style={coverImg} />
                        <ActionIcon
                          onClick={() => onDeletePhoto(selected.id, idx)}
                          aria-label="Excluir cenário"
                          size={24}
                          radius="sm"
                          variant="transparent"
                          pos="absolute"
                          className={classes.overlayDelete}
                          style={{ top: 6, right: 6 }}
                        >
                          <Trash2 size={12} />
                        </ActionIcon>
                      </Box>
                    ))}
                  </SimpleGrid>
                ) : (
                  <Stack align="center" justify="center" py={40} ta="center" gap={0}>
                    <ImageIcon size={32} color="var(--mantine-color-gray-4)" style={{ marginBottom: 8 }} />
                    <Text c="dimmed" fz="0.8rem">Nenhum cenário enviado ainda</Text>
                  </Stack>
                )}
              </Paper>
            </>
          ) : (
            <Paper withBorder radius="lg" py={64}>
              <Stack align="center" justify="center" ta="center" gap={0}>
                <ImageIcon size={40} color="var(--mantine-color-gray-4)" style={{ marginBottom: 12 }} />
                <Text fw={600}>Nenhuma campanha selecionada</Text>
                <Text c="dimmed" mt={4} fz="0.85rem">Selecione uma campanha à esquerda ou crie uma nova</Text>
              </Stack>
            </Paper>
          )}
        </Stack>
      </Group>

      {/* Create campaign dialog */}
      <Modal
        opened={creating}
        onClose={() => setCreating(false)}
        centered
        size="sm"
        title={
          <Stack gap={4}>
            <Text fw={600} fz="0.95rem">Nova campanha</Text>
            <Text c="dimmed" fz="0.78rem">
              Defina o nome e a descrição deste objetivo de campanha
            </Text>
          </Stack>
        }
      >
        <Stack gap="sm" py="xs">
          <TextInput
            data-autofocus
            label="Nome"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Ex.: Dia dos Pais"
            radius="sm"
            styles={dialogFieldStyles}
          />
          <Textarea
            label="Descrição"
            value={newDescription}
            onChange={e => setNewDescription(e.target.value)}
            rows={3}
            placeholder="Descreva o objetivo desta campanha"
            radius="sm"
            styles={{ ...dialogFieldStyles, input: { ...dialogFieldStyles.input, resize: 'none' } }}
          />
        </Stack>
        <Group justify="flex-end" mt="md" gap="xs">
          <Button
            onClick={() => { setCreating(false); setNewName(''); setNewDescription(''); }}
            variant="default"
            radius="sm"
            c="dimmed"
            fz="0.82rem"
            fw={500}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            radius="sm"
            fz="0.82rem"
            fw={600}
          >
            Salvar
          </Button>
        </Group>
      </Modal>

      {/* Delete campaign confirmation */}
      <Modal
        opened={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        centered
        size="sm"
        withCloseButton={false}
        closeOnClickOutside={false}
      >
        <Stack gap="xs">
          <Text fw={600} fz="0.95rem">Excluir campanha</Text>
          <Text c="dimmed" fz="0.78rem">
            Tem certeza que deseja excluir "{deleteTarget?.name}"? Os cenários fotográficos associados também serão removidos. Esta ação não pode ser desfeita.
          </Text>
        </Stack>
        <Group justify="flex-end" mt="md" gap="xs">
          <Button
            onClick={() => setDeleteTarget(null)}
            variant="default"
            radius="sm"
            c="dimmed"
            fz="0.82rem"
            fw={500}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (deleteTarget) onDeleteCampaign(deleteTarget.id);
              setDeleteTarget(null);
            }}
            color="red"
            radius="sm"
            fz="0.82rem"
            fw={600}
          >
            Excluir
          </Button>
        </Group>
      </Modal>
    </Stack>
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

  return (
    <Stack p="lg" maw={1400} mx="auto" w="100%" gap={20}>
      <UnstyledButton
        onClick={onBack}
        className={classes.backLink}
        fz="0.82rem"
        fw={500}
      >
        <ChevronLeft size={16} /> Voltar para Marketing IA
      </UnstyledButton>

      {/* Stepper */}
      <Paper withBorder radius="lg" p="md">
        <Group justify="space-between" wrap="nowrap" gap={0}>
          {WIZARD_STEPS.map((s, i) => (
            <Group key={s.n} flex={1} gap={0} wrap="nowrap">
              <Group gap="xs" wrap="nowrap">
                <UnstyledButton
                  onClick={() => s.n <= step && setStep(s.n)}
                  className={`${classes.stepDot} ${step > s.n ? classes.stepDotDone : step === s.n ? classes.stepDotCurrent : ''}`}
                >
                  {step > s.n ? <Check size={14} /> : s.n}
                </UnstyledButton>
                <Text span visibleFrom="sm" c={step >= s.n ? undefined : 'dimmed'} fz="0.76rem" fw={step === s.n ? 600 : 400}>
                  {s.label}
                </Text>
              </Group>
              {i < WIZARD_STEPS.length - 1 && <Box className={step > s.n ? `${classes.stepLine} ${classes.stepLineDone}` : classes.stepLine} />}
            </Group>
          ))}
        </Group>
      </Paper>

      {/* Step Content */}
      <Paper withBorder radius="lg" p={20}>
        {/* Step 1: Campanha */}
        {step === 1 && (
          <Box>
            <Title order={3} mb={4} fw={600} fz="1rem">Campanha</Title>
            <Text c="dimmed" mb="md" fz="0.78rem">Para qual campanha esta peça será criada?</Text>
            {campaigns.length > 0 ? (
              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                {campaigns.map(c => (
                  <UnstyledButton
                    key={c.id}
                    onClick={() => setCampaignId(c.id)}
                    className={campaignId === c.id ? `${classes.selectCard} ${classes.selectCardRing}` : classes.selectCard}
                  >
                    <Center bg="gray.0" style={{ aspectRatio: '4 / 5' }}>
                      {c.photos.length > 0 ? (
                        <img src={c.photos[0]} alt={c.name} style={coverImg} />
                      ) : (
                        <ImageIcon size={32} color="var(--mantine-color-gray-4)" />
                      )}
                    </Center>
                    <Group p="sm" bg="gray.0" align="flex-start" justify="space-between" gap="xs" wrap="nowrap">
                      <Box miw={0}>
                        <Text truncate fw={600} fz="0.85rem">{c.name}</Text>
                        <Text truncate c="dimmed" fz="0.72rem">{c.description || 'Sem descrição'}</Text>
                      </Box>
                      {campaignId === c.id && <Check size={16} color="var(--mantine-color-gray-9)" style={{ flexShrink: 0, marginTop: 2 }} />}
                    </Group>
                  </UnstyledButton>
                ))}
              </SimpleGrid>
            ) : (
              <Stack align="center" justify="center" py={40} ta="center" gap={0}>
                <ImageIcon size={32} color="var(--mantine-color-gray-4)" style={{ marginBottom: 8 }} />
                <Text c="dimmed" fz="0.8rem">Nenhuma campanha cadastrada</Text>
                <Text c="dimmed" mt={4} fz="0.72rem">Crie uma em Gerenciar campanhas</Text>
              </Stack>
            )}
          </Box>
        )}

        {/* Step 2: Formato (multi-select) */}
        {step === 2 && (
          <Box>
            <Group justify="space-between" mb={4} wrap="wrap" gap="xs">
              <Title order={3} fw={600} fz="1rem">Formato da peça</Title>
              <Text span c="dimmed" fz="0.78rem">{selectedFormats.size} selecionado(s)</Text>
            </Group>
            <Text c="dimmed" mb="md" fz="0.78rem">Onde esta campanha será usada? Selecione um ou mais formatos.</Text>
            <Stack gap={20}>
              {FORMAT_GROUPS.map(group => (
                <Box key={group}>
                  <Text c="dimmed" mb="xs" style={sectionLabelStyle}>
                    {group}
                  </Text>
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                    {FORMATS.filter(f => f.group === group).map(f => {
                      const Icon = f.icon;
                      const isSelected = selectedFormats.has(f.id);
                      return (
                        <UnstyledButton
                          key={f.id}
                          onClick={() => toggleFormat(f.id)}
                          p="md"
                          className={isSelected ? `${classes.selectCard} ${classes.selectCardFilled}` : classes.selectCard}
                        >
                          <ThemeIcon size={36} radius="md" variant="light" color="gray" bg="gray.1">
                            <Icon size={20} color="var(--mantine-color-gray-9)" />
                          </ThemeIcon>
                          <Text mt="xs" fw={600} fz="0.85rem">{f.label}</Text>
                          <Text c="dimmed" fz="0.72rem">{f.description}</Text>
                          <Text c="dimmed" mt={2} fz="0.68rem">{f.spec}</Text>
                          {isSelected && <Check size={16} color="var(--mantine-color-gray-9)" style={{ marginTop: 8 }} />}
                        </UnstyledButton>
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
            <Group justify="space-between" mb="md" wrap="nowrap">
              <Box>
                <Title order={3} fw={600} fz="1rem">Selecionar produtos</Title>
                <Text c="dimmed" fz="0.78rem">Escolha até 3 produtos para a campanha</Text>
              </Box>
              <Text span c="dimmed" fz="0.78rem">{selectedProducts.size}/3 selecionados</Text>
            </Group>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm">
              {sortedProducts.map(p => {
                const isSelected = selectedProducts.has(p.id);
                const meta = productMeta[p.id];
                return (
                  <UnstyledButton
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    p="sm"
                    bg={isSelected ? undefined : 'gray.0'}
                    className={isSelected ? `${classes.selectCard} ${classes.selectCardFilled}` : classes.selectCard}
                  >
                    <Box pos="relative" h={96} bg="gray.1" mb="xs" style={{ borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}>
                      <img src={p.image} alt={p.name} style={coverImg} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      {isSelected && (
                        <Center pos="absolute" inset={0} style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
                          <Check size={24} color="var(--mantine-color-white)" />
                        </Center>
                      )}
                    </Box>
                    {meta && (
                      <Badge {...tagBadge[meta.tag]} variant="light" radius="xl" size="xs" tt="capitalize" mb={4} fz="0.62rem" fw={600} px={6}>
                        {meta.tag}
                      </Badge>
                    )}
                    <Text truncate fz="0.75rem" fw={500}>{p.name}</Text>
                    <Text c="gray.9" fz="0.72rem" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(p.price)}</Text>
                    {meta && <Text c="dimmed" fz="0.68rem">Estoque: {meta.stock} pares</Text>}
                  </UnstyledButton>
                );
              })}
            </SimpleGrid>
          </Box>
        )}

        {/* Step 4: Tema (cenário fotográfico da campanha escolhida na Etapa 1) */}
        {step === 4 && (
          <Box>
            <Title order={3} mb={4} fw={600} fz="1rem">Tema visual</Title>
            <Text c="dimmed" mb="md" fz="0.78rem">
              Escolha um cenário fotográfico de {selectedCampaign ? `"${selectedCampaign.name}"` : 'sua campanha'}
            </Text>
            {selectedCampaign && selectedCampaign.photos.length > 0 ? (
              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                {selectedCampaign.photos.map((photo, idx) => (
                  <UnstyledButton
                    key={idx}
                    onClick={() => setScenarioIndex(idx)}
                    className={scenarioIndex === idx ? `${classes.selectCard} ${classes.selectCardRing}` : classes.selectCard}
                  >
                    <Box bg="gray.0" style={{ aspectRatio: '4 / 5' }}>
                      <img src={photo} alt={`Cenário ${idx + 1}`} style={coverImg} />
                    </Box>
                    <Group p="sm" bg="gray.0" justify="space-between" wrap="nowrap">
                      <Text span fz="0.8rem" fw={500}>Cenário {idx + 1}</Text>
                      {scenarioIndex === idx && <Check size={14} color="var(--mantine-color-gray-9)" style={{ flexShrink: 0 }} />}
                    </Group>
                  </UnstyledButton>
                ))}
              </SimpleGrid>
            ) : (
              <Stack align="center" justify="center" py={40} ta="center" gap={0}>
                <ImageIcon size={32} color="var(--mantine-color-gray-4)" style={{ marginBottom: 8 }} />
                <Text c="dimmed" fz="0.8rem">Nenhum cenário disponível para esta campanha</Text>
                <Text c="dimmed" mt={4} fz="0.72rem">Adicione cenários em Gerenciar campanhas</Text>
              </Stack>
            )}
          </Box>
        )}

        {/* Step 5: Texto */}
        {step === 5 && (
          <Box>
            <Title order={3} mb={4} fw={600} fz="1rem">Texto assistido por IA</Title>
            <Text c="dimmed" mb="md" fz="0.78rem">Descreva o tom da campanha ou use uma sugestão</Text>
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              radius="lg"
              mb="sm"
              classNames={{ input: classes.promptInput }}
              styles={{ input: { fontSize: '0.88rem', lineHeight: 1.6, padding: '12px 16px', backgroundColor: 'var(--mantine-color-gray-0)', resize: 'none' } }}
            />
            <Box mb="md">
              <Text c="dimmed" mb="xs" fz="0.75rem" fw={500}>Sugestões da IA:</Text>
              <Stack gap="xs">
                {AI_PROMPTS.map((sugg, i) => (
                  <UnstyledButton
                    key={i}
                    onClick={() => setPrompt(sugg)}
                    className={prompt === sugg ? `${classes.suggestion} ${classes.suggestionActive}` : classes.suggestion}
                  >
                    {sugg}
                  </UnstyledButton>
                ))}
              </Stack>
            </Box>
            <Box p="sm" bg="gray.0" c="dimmed" fz="0.75rem" style={{ borderRadius: 'var(--mantine-radius-md)' }}>
              <Wand2 size={14} color="var(--mantine-color-violet-6)" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
              A IA irá gerar textos, adaptar o layout e compor a lâmina automaticamente usando os produtos selecionados.
            </Box>
          </Box>
        )}

        {/* Step 6: Resultado — cards like Histórico, one per selected format */}
        {step === 6 && (
          <Box>
            <Group justify="space-between" mb="md" wrap="nowrap">
              <Box>
                <Title order={3} fw={600} fz="1rem">Resultado da campanha</Title>
                <Text c="dimmed" fz="0.78rem">
                  {selectedFormatList.length} {selectedFormatList.length === 1 ? 'peça gerada' : 'peças geradas'}
                </Text>
              </Box>
              <UnstyledButton
                onClick={() => setStep(5)}
                className={classes.backLink}
                fz="0.78rem"
                style={{ alignSelf: 'center' }}
              >
                <RefreshCw size={14} /> Regenerar
              </UnstyledButton>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
              {selectedFormatList.map(f => (
                <Paper key={f.id} withBorder radius="lg" style={{ overflow: 'hidden' }}>
                  <Box bg="gray.0" style={{ aspectRatio: '1 / 1' }}>
                    <img src={campaignPreviewMock} alt={f.label} style={coverImg} />
                  </Box>
                  <Box p="sm">
                    <Text truncate fz="0.82rem" fw={600}>{f.label}</Text>
                    <Text c="dimmed" mb="xs" fz="0.72rem" style={clampStyle}>{prompt}</Text>
                    <Button
                      onClick={() => toast.success('Arquivo baixado')}
                      fullWidth
                      variant="default"
                      size="xs"
                      fz="0.78rem"
                      fw={500}
                      leftSection={<Download size={14} />}
                    >
                      Baixar
                    </Button>
                  </Box>
                </Paper>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Paper>

      {/* Navigation */}
      <Group justify="space-between">
        <Button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          variant="default"
          c="dimmed"
          className={classes.fadeDisabled}
          fz="0.85rem"
          fw={500}
          leftSection={<ChevronLeft size={16} />}
        >
          Voltar
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
            px={20}
            fz="0.85rem"
            fw={600}
            className={classes.fadeDisabled}
            rightSection={<ChevronRight size={16} />}
          >
            Continuar
          </Button>
        ) : step === 5 ? (
          <Button
            onClick={handleGenerate}
            disabled={generating || !prompt}
            variant="gradient"
            gradient={{ from: 'violet.7', to: 'indigo.6', deg: 135 }}
            px="lg"
            fw={700}
            className={classes.fadeDisabledSoft}
            fz="0.9rem"
            leftSection={generating ? <Loader size={16} color="white" /> : <Sparkles size={16} />}
          >
            {generating ? 'Gerando...' : 'Gerar com IA'}
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            px={20}
            fz="0.85rem"
            fw={600}
            leftSection={<Check size={16} />}
          >
            Concluir
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
