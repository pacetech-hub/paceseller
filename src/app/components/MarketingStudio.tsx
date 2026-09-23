import { useState, useEffect, type CSSProperties } from "react";
import { toast } from "sonner";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "./ui/alert-dialog";
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
  'lançamento': 'text-primary bg-primary/10',
  'alto giro': 'text-emerald-400 bg-emerald-400/10',
  'estoque parado': 'text-amber-400 bg-amber-400/10',
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

type Mode = 'home' | 'wizard' | 'campaigns';

function MarketingHome({ history, onCreate, onManageCampaigns, onDelete }: { history: HistoryItem[]; onCreate: () => void; onManageCampaigns: () => void; onDelete: (id: string) => void }) {
  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
      {/* Header */}
      <div className="rounded-xl bg-secondary/40 border border-border p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <SparkleIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: '1rem' }}>Estúdio de Marketing com IA</h2>
            <p className="text-muted-foreground" style={{ fontSize: '0.8rem' }}>Crie campanhas profissionais em menos de 2 minutos</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onManageCampaigns}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
            style={{ fontSize: '0.82rem', fontWeight: 600 }}
          >
            <PencilSimpleIcon className="w-4 h-4" /> Gerenciar campanhas
          </button>
          <button
            onClick={onCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            style={{ fontSize: '0.85rem', fontWeight: 600 }}
          >
            <SparkleIcon className="w-4 h-4" /> Criar campanha
          </button>
        </div>
      </div>

      {/* Histórico */}
      <div>
        <p className="text-muted-foreground mb-3" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Histórico
        </p>
        {history.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {history.map(item => (
              <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="relative aspect-square bg-secondary/40">
                  <img src={item.image} alt={item.formatLabel} className="w-full h-full object-cover" />
                  <button
                    onClick={() => onDelete(item.id)}
                    aria-label="Excluir"
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-foreground truncate" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.formatLabel}</p>
                  <p className="text-muted-foreground mb-2" style={{ fontSize: '0.72rem', ...clampStyle }}>{item.copy}</p>
                  <button
                    onClick={() => toast.success('Arquivo baixado')}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
                    style={{ fontSize: '0.78rem', fontWeight: 500 }}
                  >
                    <DownloadSimpleIcon className="w-3.5 h-3.5" /> Baixar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
            <ImageIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-foreground" style={{ fontWeight: 600 }}>Nenhuma campanha criada ainda</p>
            <p className="text-muted-foreground mt-1" style={{ fontSize: '0.85rem' }}>Clique em "Criar campanha" para começar</p>
          </div>
        )}
      </div>
    </div>
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
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontSize: '0.82rem', fontWeight: 500 }}
      >
        <CaretLeftIcon className="w-4 h-4" /> Voltar para Marketing IA
      </button>

      <div>
        <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: '1rem' }}>Gerenciar campanhas</h2>
        <p className="text-muted-foreground" style={{ fontSize: '0.8rem' }}>Configure os objetivos de campanha e os cenários fotográficos usados como fundo das peças</p>
      </div>

      <div className="flex items-start gap-5">
        {/* Left panel: campaign list */}
        <div className="w-64 flex-shrink-0 bg-card border border-border rounded-xl p-2">
          <div className="space-y-0.5">
            {campaigns.map(c => (
              <div
                key={c.id}
                className={`group flex items-center rounded-lg transition-colors ${selectedId === c.id ? 'bg-primary/15' : 'hover:bg-secondary/60'}`}
              >
                <button
                  onClick={() => onSelect(c.id)}
                  className="flex-1 min-w-0 text-left px-3 py-2.5"
                >
                  <span className={`block truncate ${selectedId === c.id ? 'text-primary' : 'text-foreground'}`} style={{ fontSize: '0.85rem', fontWeight: selectedId === c.id ? 600 : 500 }}>
                    {c.name}
                  </span>
                </button>
                <button
                  onClick={() => setDeleteTarget(c)}
                  aria-label={`Excluir ${c.name}`}
                  className="mr-1.5 p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition-all flex-shrink-0"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => setCreating(true)}
            className="w-full flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-primary hover:bg-primary/10 transition-colors mt-1"
            style={{ fontSize: '0.85rem', fontWeight: 600 }}
          >
            <PlusIcon className="w-4 h-4" /> Nova campanha
          </button>
        </div>

        {/* Main content: selected campaign detail */}
        <div className="flex-1 min-w-0 space-y-4">
          {selected ? (
            <>
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="text-foreground" style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selected.name}</h3>
                <p className="text-muted-foreground mt-1" style={{ fontSize: '0.82rem' }}>
                  {selected.description || 'Sem descrição.'}
                </p>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <p className="text-muted-foreground" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {selected.photos.length} {selected.photos.length === 1 ? 'cenário fotográfico' : 'cenários fotográficos'}
                  </p>
                  <label
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors cursor-pointer"
                    style={{ fontSize: '0.78rem', fontWeight: 500 }}
                  >
                    <UploadSimpleIcon className="w-3.5 h-3.5" /> Enviar cenário
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                </div>

                {selected.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selected.photos.map((photo, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-secondary/40">
                        <img src={photo} alt={`${selected.name} — cenário ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => onDeletePhoto(selected.id, idx)}
                          aria-label="Excluir cenário"
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/30 mb-2" />
                    <p className="text-muted-foreground" style={{ fontSize: '0.8rem' }}>Nenhum cenário enviado ainda</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card border border-border rounded-xl">
              <ImageIcon className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-foreground" style={{ fontWeight: 600 }}>Nenhuma campanha selecionada</p>
              <p className="text-muted-foreground mt-1" style={{ fontSize: '0.85rem' }}>Selecione uma campanha à esquerda ou crie uma nova</p>
            </div>
          )}
        </div>
      </div>

      {/* Create campaign dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle style={{ fontSize: '0.95rem' }}>Nova campanha</DialogTitle>
            <DialogDescription style={{ fontSize: '0.78rem' }}>
              Defina o nome e a descrição deste objetivo de campanha
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="block text-muted-foreground mb-1" style={{ fontSize: '0.72rem' }}>Nome</label>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ex.: Dia dos Pais"
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-foreground placeholder-muted-foreground outline-none focus:border-primary"
                style={{ fontSize: '0.82rem' }}
              />
            </div>
            <div>
              <label className="block text-muted-foreground mb-1" style={{ fontSize: '0.72rem' }}>Descrição</label>
              <textarea
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                rows={3}
                placeholder="Descreva o objetivo desta campanha"
                className="w-full px-3 py-2 rounded-md border border-border bg-surface text-foreground placeholder-muted-foreground outline-none focus:border-primary resize-none"
                style={{ fontSize: '0.82rem' }}
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => { setCreating(false); setNewName(''); setNewDescription(''); }}
              className="px-3 py-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              style={{ fontSize: '0.82rem', fontWeight: 500 }}
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              className="px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              style={{ fontSize: '0.82rem', fontWeight: 600 }}
            >
              Salvar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete campaign confirmation */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent className="sm:max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontSize: '0.95rem' }}>Excluir campanha</AlertDialogTitle>
            <AlertDialogDescription style={{ fontSize: '0.78rem' }}>
              Tem certeza que deseja excluir "{deleteTarget?.name}"? Os cenários fotográficos associados também serão removidos. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-3 py-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
              style={{ fontSize: '0.82rem', fontWeight: 500 }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                if (deleteTarget) onDeleteCampaign(deleteTarget.id);
                setDeleteTarget(null);
              }}
              className="px-3 py-2 rounded-md bg-red-500 text-white hover:bg-red-600 transition-colors"
              style={{ fontSize: '0.82rem', fontWeight: 600 }}
            >
              Excluir
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontSize: '0.82rem', fontWeight: 500 }}
      >
        <CaretLeftIcon className="w-4 h-4" /> Voltar para Marketing IA
      </button>

      {/* Stepper */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => s.n <= step && setStep(s.n)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${step > s.n ? 'bg-primary text-primary-foreground' : step === s.n ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-card' : 'bg-secondary text-muted-foreground'}`}
                  style={{ fontSize: '0.72rem', fontWeight: 700 }}
                >
                  {step > s.n ? <CheckIcon className="w-3.5 h-3.5" /> : s.n}
                </button>
                <span className={`hidden sm:block ${step >= s.n ? 'text-foreground' : 'text-muted-foreground'}`} style={{ fontSize: '0.76rem', fontWeight: step === s.n ? 600 : 400 }}>
                  {s.label}
                </span>
              </div>
              {i < WIZARD_STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${step > s.n ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-card border border-border rounded-xl p-5">
        {/* Step 1: Campanha */}
        {step === 1 && (
          <div>
            <h3 className="text-foreground mb-1" style={{ fontWeight: 600 }}>Campanha</h3>
            <p className="text-muted-foreground mb-4" style={{ fontSize: '0.78rem' }}>Para qual campanha esta peça será criada?</p>
            {campaigns.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {campaigns.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCampaignId(c.id)}
                    className={`rounded-xl border overflow-hidden text-left transition-all ${campaignId === c.id ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-border/60'}`}
                  >
                    <div className="aspect-[4/5] bg-secondary/40 flex items-center justify-center">
                      {c.photos.length > 0 ? (
                        <img src={c.photos[0]} alt={c.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="p-3 bg-secondary/20 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-foreground truncate" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</p>
                        <p className="text-muted-foreground truncate" style={{ fontSize: '0.72rem' }}>{c.description || 'Sem descrição'}</p>
                      </div>
                      {campaignId === c.id && <CheckIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground" style={{ fontSize: '0.8rem' }}>Nenhuma campanha cadastrada</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: '0.72rem' }}>Crie uma em Gerenciar campanhas</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Formato (multi-select) */}
        {step === 2 && (
          <div>
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <h3 className="text-foreground" style={{ fontWeight: 600 }}>Formato da peça</h3>
              <span className="text-muted-foreground" style={{ fontSize: '0.78rem' }}>{selectedFormats.size} selecionado(s)</span>
            </div>
            <p className="text-muted-foreground mb-4" style={{ fontSize: '0.78rem' }}>Onde esta campanha será usada? Selecione um ou mais formatos.</p>
            <div className="space-y-5">
              {FORMAT_GROUPS.map(group => (
                <div key={group}>
                  <p className="text-muted-foreground mb-2" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {group}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {FORMATS.filter(f => f.group === group).map(f => {
                      const Icon = f.icon;
                      const isSelected = selectedFormats.has(f.id);
                      return (
                        <button
                          key={f.id}
                          onClick={() => toggleFormat(f.id)}
                          className={`rounded-xl border p-4 text-left transition-all ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-border/60'}`}
                        >
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <p className="text-foreground mt-2" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{f.label}</p>
                          <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{f.description}</p>
                          <p className="text-muted-foreground mt-0.5" style={{ fontSize: '0.68rem' }}>{f.spec}</p>
                          {isSelected && <CheckIcon className="w-4 h-4 text-primary mt-2" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Produtos */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-foreground" style={{ fontWeight: 600 }}>Selecionar produtos</h3>
                <p className="text-muted-foreground" style={{ fontSize: '0.78rem' }}>Escolha até 3 produtos para a campanha</p>
              </div>
              <span className="text-muted-foreground" style={{ fontSize: '0.78rem' }}>{selectedProducts.size}/3 selecionados</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {sortedProducts.map(p => {
                const isSelected = selectedProducts.has(p.id);
                const meta = productMeta[p.id];
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-border/60 bg-secondary/20'}`}
                  >
                    <div className="relative h-24 rounded-lg overflow-hidden bg-secondary mb-2">
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                          <CheckIcon className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    {meta && (
                      <span className={`inline-block px-1.5 py-0.5 rounded-full mb-1 capitalize ${tagColors[meta.tag]}`} style={{ fontSize: '0.62rem', fontWeight: 600 }}>
                        {meta.tag}
                      </span>
                    )}
                    <p className="text-foreground truncate" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{p.name}</p>
                    <p className="text-primary mono" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{formatCurrency(p.price)}</p>
                    {meta && <p className="text-muted-foreground" style={{ fontSize: '0.68rem' }}>Estoque: {meta.stock} pares</p>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Tema (cenário fotográfico da campanha escolhida na Etapa 1) */}
        {step === 4 && (
          <div>
            <h3 className="text-foreground mb-1" style={{ fontWeight: 600 }}>Tema visual</h3>
            <p className="text-muted-foreground mb-4" style={{ fontSize: '0.78rem' }}>
              Escolha um cenário fotográfico de {selectedCampaign ? `"${selectedCampaign.name}"` : 'sua campanha'}
            </p>
            {selectedCampaign && selectedCampaign.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {selectedCampaign.photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() => setScenarioIndex(idx)}
                    className={`rounded-xl border overflow-hidden transition-all ${scenarioIndex === idx ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-border/60'}`}
                  >
                    <div className="aspect-[4/5] bg-secondary/40">
                      <img src={photo} alt={`Cenário ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3 bg-secondary/20 flex items-center justify-between">
                      <span className="text-foreground" style={{ fontSize: '0.8rem', fontWeight: 500 }}>Cenário {idx + 1}</span>
                      {scenarioIndex === idx && <CheckIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-muted-foreground" style={{ fontSize: '0.8rem' }}>Nenhum cenário disponível para esta campanha</p>
                <p className="text-muted-foreground mt-1" style={{ fontSize: '0.72rem' }}>Adicione cenários em Gerenciar campanhas</p>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Texto */}
        {step === 5 && (
          <div>
            <h3 className="text-foreground mb-1" style={{ fontWeight: 600 }}>Texto assistido por IA</h3>
            <p className="text-muted-foreground mb-4" style={{ fontSize: '0.78rem' }}>Descreva o tom da campanha ou use uma sugestão</p>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground placeholder-muted-foreground outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 resize-none mb-3"
              style={{ fontSize: '0.88rem', lineHeight: 1.6 }}
            />
            <div className="mb-4">
              <p className="text-muted-foreground mb-2" style={{ fontSize: '0.75rem', fontWeight: 500 }}>Sugestões da IA:</p>
              <div className="space-y-2">
                {AI_PROMPTS.map((sugg, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(sugg)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${prompt === sugg ? 'border-purple-400/50 bg-purple-400/5 text-foreground' : 'border-border text-muted-foreground hover:text-foreground hover:border-border/60'}`}
                    style={{ fontSize: '0.78rem', lineHeight: 1.5 }}
                  >
                    {sugg}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-secondary/40 p-3 text-muted-foreground" style={{ fontSize: '0.75rem' }}>
              <MagicWandIcon className="inline w-3.5 h-3.5 mr-1.5 text-purple-400" />
              A IA irá gerar textos, adaptar o layout e compor a lâmina automaticamente usando os produtos selecionados.
            </div>
          </div>
        )}

        {/* Step 6: Resultado — cards like Histórico, one per selected format */}
        {step === 6 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-foreground" style={{ fontWeight: 600 }}>Resultado da campanha</h3>
                <p className="text-muted-foreground" style={{ fontSize: '0.78rem' }}>
                  {selectedFormatList.length} {selectedFormatList.length === 1 ? 'peça gerada' : 'peças geradas'}
                </p>
              </div>
              <button
                onClick={() => setStep(5)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                style={{ fontSize: '0.78rem' }}
              >
                <ArrowsClockwiseIcon className="w-3.5 h-3.5" /> Regenerar
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {selectedFormatList.map(f => (
                <div key={f.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="aspect-square bg-secondary/40">
                    <img src={campaignPreviewMock} alt={f.label} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3">
                    <p className="text-foreground truncate" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{f.label}</p>
                    <p className="text-muted-foreground mb-2" style={{ fontSize: '0.72rem', ...clampStyle }}>{prompt}</p>
                    <button
                      onClick={() => toast.success('Arquivo baixado')}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
                      style={{ fontSize: '0.78rem', fontWeight: 500 }}
                    >
                      <DownloadSimpleIcon className="w-3.5 h-3.5" /> Baixar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-40"
          style={{ fontSize: '0.85rem', fontWeight: 500 }}
        >
          <CaretLeftIcon className="w-4 h-4" /> Voltar
        </button>

        {step < 5 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={
              (step === 1 && !campaignId) ||
              (step === 2 && selectedFormats.size === 0) ||
              (step === 3 && selectedProducts.size === 0) ||
              (step === 4 && (!selectedCampaign || selectedCampaign.photos.length === 0))
            }
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
            style={{ fontSize: '0.85rem', fontWeight: 600 }}
          >
            Continuar <CaretRightIcon className="w-4 h-4" />
          </button>
        ) : step === 5 ? (
          <button
            onClick={handleGenerate}
            disabled={generating || !prompt}
            className="flex items-center gap-1.5 px-6 py-2 rounded-lg text-white hover:opacity-90 transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.22 285), oklch(0.6 0.22 262))', fontWeight: 700, fontSize: '0.9rem' }}
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <SparkleIcon className="w-4 h-4" /> Gerar com IA
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            style={{ fontSize: '0.85rem', fontWeight: 600 }}
          >
            <CheckIcon className="w-4 h-4" /> Concluir
          </button>
        )}
      </div>
    </div>
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
