import { useState } from "react";
import { toast } from "sonner";
import {
  Sparkles, Check, ChevronRight, ChevronLeft, Share2, Instagram, MessageCircle, Printer,
  Wand2, RefreshCw, Rocket, Tag, Trophy, Zap, Download, Palette, Plus, Image as ImageIcon,
} from "lucide-react";
import { products, formatCurrency } from "../data/mockData";
import campaignPreviewMock from "@/assets/campaign-preview-mock.png";
import bannerLimitedEdition from "@/assets/banner-edicao-limitada.webp";

const OBJECTIVES = [
  { id: 'lancamento', label: 'Lançamento de coleção', icon: Rocket, description: 'Apresente novidades com destaque' },
  { id: 'promocao', label: 'Promoção / Liquidação', icon: Tag, description: 'Ofertas e descontos especiais' },
  { id: 'reposicao', label: 'Reposição rápida', icon: Zap, description: 'Destaque produtos disponíveis' },
  { id: 'institucional', label: 'Institucional de marca', icon: Trophy, description: 'Fortalecimento de brand' },
];

const FORMATS = [
  { id: 'instagram-post', label: 'Post Instagram', dimensions: '1080 × 1080', icon: Instagram },
  { id: 'instagram-story', label: 'Story Instagram', dimensions: '1080 × 1920', icon: Instagram },
  { id: 'whatsapp', label: 'Banner WhatsApp', dimensions: '1080 × 1080', icon: MessageCircle },
  { id: 'impressao', label: 'Impressão', dimensions: 'A4 / PDF', icon: Printer },
];

const THEMES = [
  { id: 'premium', label: 'Premium Dark', colors: ['#0A0A0F', '#1a1a2e', '#4F6EF7'], photoCount: 8 },
  { id: 'clean', label: 'Clean Minimal', colors: ['#FAFAFA', '#F0F0F0', '#1a1a1a'], photoCount: 5 },
  { id: 'bold', label: 'Bold Impact', colors: ['#1a0533', '#6B21A8', '#F59E0B'], photoCount: 6 },
  { id: 'nature', label: 'Natural & Warm', colors: ['#1C1208', '#A16207', '#FEF3C7'], photoCount: 4 },
  { id: 'ocean', label: 'Ocean Blue', colors: ['#0C1A2E', '#0E4D8A', '#38BDF8'], photoCount: 7 },
  { id: 'sport', label: 'Sport Energy', colors: ['#0F0F0F', '#16A34A', '#DCFCE7'], photoCount: 6 },
];

const AI_PROMPTS = [
  'Nova coleção Inverno 2026 com exclusividade e sofisticação para distribuidores selecionados.',
  'Qualidade premium para calçados que combinam conforto e estilo nas estações frias.',
  'Descubra a nova linha Tesla Footwear — onde tradição encontra inovação.',
];

interface HistoryItem {
  id: string;
  image: string;
  formatLabel: string;
  createdAt: string;
}

const initialHistory: HistoryItem[] = [
  { id: 'hist-1', image: campaignPreviewMock, formatLabel: 'Post Instagram', createdAt: '18 de jun' },
  { id: 'hist-2', image: bannerLimitedEdition, formatLabel: 'Banner WhatsApp', createdAt: '12 de jun' },
  { id: 'hist-3', image: campaignPreviewMock, formatLabel: 'Story Instagram', createdAt: '05 de jun' },
  { id: 'hist-4', image: bannerLimitedEdition, formatLabel: 'Impressão', createdAt: '28 de mai' },
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

function MarketingHome({ history, onCreate, onManageCampaigns }: { history: HistoryItem[]; onCreate: () => void; onManageCampaigns: () => void }) {
  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-purple-500/10 via-primary/5 to-transparent border border-purple-500/20 p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
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
            <Palette className="w-4 h-4" /> Campanhas
          </button>
          <button
            onClick={onCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            style={{ fontSize: '0.85rem', fontWeight: 600 }}
          >
            <Sparkles className="w-4 h-4" /> Criar campanha
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
                <div className="aspect-square bg-secondary/40">
                  <img src={item.image} alt={item.formatLabel} className="w-full h-full object-cover" />
                </div>
                <div className="p-3">
                  <p className="text-foreground truncate" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.formatLabel}</p>
                  <p className="text-muted-foreground mb-2" style={{ fontSize: '0.7rem' }}>{item.createdAt}</p>
                  <button
                    onClick={() => toast.success('Arquivo baixado')}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
                    style={{ fontSize: '0.78rem', fontWeight: 500 }}
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar
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

function CampaignsManager({ onBack }: { onBack: () => void }) {
  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontSize: '0.82rem', fontWeight: 500 }}
      >
        <ChevronLeft className="w-4 h-4" /> Voltar para Marketing IA
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-foreground" style={{ fontWeight: 700, fontSize: '1rem' }}>Campanhas</h2>
          <p className="text-muted-foreground" style={{ fontSize: '0.8rem' }}>Gerencie os temas visuais e sets fotográficos usados nas campanhas</p>
        </div>
        <button
          onClick={() => toast.success('Em breve: criação de novos temas')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          style={{ fontSize: '0.85rem', fontWeight: 600 }}
        >
          <Plus className="w-4 h-4" /> Novo tema
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {THEMES.map(t => (
          <div key={t.id} className="rounded-xl border border-border overflow-hidden bg-card">
            <div
              className="h-24 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${t.colors[0]} 0%, ${t.colors[1]} 100%)` }}
            >
              <div className="flex gap-1.5">
                {t.colors.map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border-2 border-white/20" style={{ background: c }} />
                ))}
              </div>
            </div>
            <div className="p-3">
              <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t.label}</p>
              <p className="text-muted-foreground mb-2" style={{ fontSize: '0.72rem' }}>Set fotográfico · {t.photoCount} fotos</p>
              <button
                onClick={() => toast.success('Em breve: edição de temas')}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
                style={{ fontSize: '0.78rem', fontWeight: 500 }}
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CampaignWizard({ onBack, onFinish }: { onBack: () => void; onFinish: (item: HistoryItem) => void }) {
  const [step, setStep] = useState(1);
  const [objective, setObjective] = useState('lancamento');
  const [format, setFormat] = useState('instagram-post');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set([products[0].id, products[4].id]));
  const [theme, setTheme] = useState('premium');
  const [prompt, setPrompt] = useState(AI_PROMPTS[0]);
  const [generating, setGenerating] = useState(false);

  const selectedFormat = FORMATS.find(f => f.id === format)!;

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else if (next.size < 4) { next.add(id); }
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
    onFinish({
      id: `hist-${Math.round(Math.random() * 1e6)}`,
      image: campaignPreviewMock,
      formatLabel: selectedFormat.label,
      createdAt: 'agora',
    });
    toast.success('Campanha salva no histórico');
    onBack();
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontSize: '0.82rem', fontWeight: 500 }}
      >
        <ChevronLeft className="w-4 h-4" /> Voltar para Marketing IA
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
                  {step > s.n ? <Check className="w-3.5 h-3.5" /> : s.n}
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
        {/* Step 1: Campanha (Objetivo) */}
        {step === 1 && (
          <div>
            <h3 className="text-foreground mb-1" style={{ fontWeight: 600 }}>Objetivo da campanha</h3>
            <p className="text-muted-foreground mb-4" style={{ fontSize: '0.78rem' }}>Qual é o propósito desta peça?</p>
            <div className="grid grid-cols-2 gap-3">
              {OBJECTIVES.map(obj => {
                const Icon = obj.icon;
                return (
                  <button
                    key={obj.id}
                    onClick={() => setObjective(obj.id)}
                    className={`rounded-xl border p-4 text-left transition-all ${objective === obj.id ? 'border-primary bg-primary/10' : 'border-border hover:border-border/60'}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-foreground mt-2" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{obj.label}</p>
                    <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{obj.description}</p>
                    {objective === obj.id && <Check className="w-4 h-4 text-primary mt-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Formato */}
        {step === 2 && (
          <div>
            <h3 className="text-foreground mb-1" style={{ fontWeight: 600 }}>Formato da peça</h3>
            <p className="text-muted-foreground mb-4" style={{ fontSize: '0.78rem' }}>Onde esta campanha será usada?</p>
            <div className="grid grid-cols-2 gap-3">
              {FORMATS.map(f => {
                const Icon = f.icon;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`rounded-xl border p-4 text-left transition-all ${format === f.id ? 'border-primary bg-primary/10' : 'border-border hover:border-border/60'}`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-foreground mt-2" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{f.label}</p>
                    <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{f.dimensions}</p>
                    {format === f.id && <Check className="w-4 h-4 text-primary mt-2" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Produtos */}
        {step === 3 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-foreground" style={{ fontWeight: 600 }}>Selecionar produtos</h3>
                <p className="text-muted-foreground" style={{ fontSize: '0.78rem' }}>Escolha até 4 produtos para a campanha</p>
              </div>
              <span className="text-muted-foreground" style={{ fontSize: '0.78rem' }}>{selectedProducts.size}/4 selecionados</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {products.map(p => {
                const isSelected = selectedProducts.has(p.id);
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
                          <Check className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-foreground truncate" style={{ fontSize: '0.75rem', fontWeight: 500 }}>{p.name}</p>
                    <p className="text-primary mono" style={{ fontSize: '0.72rem', fontWeight: 600 }}>{formatCurrency(p.price)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Tema */}
        {step === 4 && (
          <div>
            <h3 className="text-foreground mb-1" style={{ fontWeight: 600 }}>Tema visual</h3>
            <p className="text-muted-foreground mb-4" style={{ fontSize: '0.78rem' }}>Escolha a identidade visual da peça</p>
            <div className="grid grid-cols-3 gap-3">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`rounded-xl border overflow-hidden transition-all ${theme === t.id ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-border/60'}`}
                >
                  <div
                    className="h-20 flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${t.colors[0]} 0%, ${t.colors[1]} 100%)` }}
                  >
                    <div className="flex gap-1.5">
                      {t.colors.map((c, i) => (
                        <div key={i} className="w-5 h-5 rounded-full border-2 border-white/20" style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-secondary/20 flex items-center justify-between">
                    <span className="text-foreground" style={{ fontSize: '0.8rem', fontWeight: 500 }}>{t.label}</span>
                    {theme === t.id && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
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
              <Wand2 className="inline w-3.5 h-3.5 mr-1.5 text-purple-400" />
              A IA irá gerar textos, adaptar o layout e compor a lâmina automaticamente usando os produtos selecionados.
            </div>
          </div>
        )}

        {/* Step 6: Resultado */}
        {step === 6 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-foreground" style={{ fontWeight: 600 }}>Resultado da campanha</h3>
                <p className="text-muted-foreground" style={{ fontSize: '0.78rem' }}>{selectedFormat.label} · {selectedFormat.dimensions}</p>
              </div>
              <button
                onClick={() => setStep(5)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                style={{ fontSize: '0.78rem' }}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Regenerar
              </button>
            </div>

            {/* Generated banner mockup */}
            <div className="rounded-2xl overflow-hidden border border-border mb-5 mx-auto" style={{ maxWidth: 340 }}>
              <img src={campaignPreviewMock} alt="Preview da campanha" className="w-full h-auto block" />
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => toast.success('Arquivo baixado')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary/60 transition-colors"
                style={{ fontSize: '0.82rem', fontWeight: 500 }}
              >
                <Download className="w-4 h-4" /> Baixar
              </button>
              <button
                onClick={() => toast.success('Em breve: compartilhamento direto')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                style={{ fontSize: '0.82rem', fontWeight: 600 }}
              >
                <Share2 className="w-4 h-4" /> Compartilhar
              </button>
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
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>

        {step < 5 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={step === 3 && selectedProducts.size === 0}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
            style={{ fontSize: '0.85rem', fontWeight: 600 }}
          >
            Continuar <ChevronRight className="w-4 h-4" />
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
                <Sparkles className="w-4 h-4" /> Gerar com IA
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            style={{ fontSize: '0.85rem', fontWeight: 600 }}
          >
            <Check className="w-4 h-4" /> Concluir
          </button>
        )}
      </div>
    </div>
  );
}

export function MarketingStudio() {
  const [mode, setMode] = useState<Mode>('home');
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);

  if (mode === 'campaigns') {
    return <CampaignsManager onBack={() => setMode('home')} />;
  }

  if (mode === 'wizard') {
    return (
      <CampaignWizard
        onBack={() => setMode('home')}
        onFinish={item => setHistory(prev => [item, ...prev])}
      />
    );
  }

  return (
    <MarketingHome
      history={history}
      onCreate={() => setMode('wizard')}
      onManageCampaigns={() => setMode('campaigns')}
    />
  );
}
