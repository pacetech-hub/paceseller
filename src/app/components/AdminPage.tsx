import React, { useState, useMemo } from "react";
import {
  UsersIcon,
  WarehouseIcon,
  TagIcon,
  GearIcon,
  ShieldIcon,
  PlusIcon,
  PencilSimpleLineIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CaretRightIcon,
  ArrowLeftIcon,
  InfoIcon,
  MapPinIcon,
  UserCircleIcon,
  StackIcon,
  PackageIcon,
  LockIcon,
  BuildingsIcon,
  BriefcaseIcon,
  StorefrontIcon,
  PlugChargingIcon,
} from "@phosphor-icons/react";

import { clients, formatDate } from "../data/mockData";
import { visoes, profileDescriptions, defaultPermissions, type VisaoKey, type PermissionsState } from "../data/permissions";
import { linkedUsers } from "../data/linkedUsers";
import { PermissionMatrixTable } from "./PermissionMatrixTable";
import { IndustryStockTable } from "./IndustryStockTable";
import { ClientStockTab } from "./ClientStockTab";

const tabs = [
  { id: 'industry-stock', label: 'Estoque Industrial', icon: WarehouseIcon },
  { id: 'client-stock', label: 'Estoque do Cliente', icon: StorefrontIcon },
  { id: 'pricing', label: 'Campanhas Comerciais', icon: TagIcon },
  { id: 'policies', label: 'Políticas', icon: LockIcon },
  { id: 'permissions', label: 'Permissões', icon: ShieldIcon },
  { id: 'settings', label: 'Configurações', icon: GearIcon },
];

function ErpSyncNotice({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
      <PlugChargingIcon className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
      <p className="text-foreground" style={{ fontSize: '0.78rem', lineHeight: 1.55 }}>{text}</p>
    </div>
  );
}

const mockUsers = [
  { id: 'U001', name: 'Marcos Andrade', email: 'marcos@tesla.com.br', role: 'Representante', region: 'Sudeste', status: 'ativo', lastLogin: '2026-06-11' },
  { id: 'U002', name: 'Fernanda Lima', email: 'fernanda@tesla.com.br', role: 'Representante', region: 'Sul', status: 'ativo', lastLogin: '2026-06-10' },
  { id: 'U003', name: 'Carlos Mendes', email: 'carlos@tesla.com.br', role: 'Representante', region: 'Sudeste', status: 'ativo', lastLogin: '2026-06-11' },
  { id: 'U004', name: 'Ana Santos', email: 'ana@tesla.com.br', role: 'Representante', region: 'Nordeste', status: 'ativo', lastLogin: '2026-06-09' },
  { id: 'U005', name: 'Rafael Costa', email: 'rafael@tesla.com.br', role: 'Admin', region: 'Nacional', status: 'ativo', lastLogin: '2026-06-11' },
];

const pricePolicies = [
  { id: 'P001', name: 'Política Padrão', discount: '0%', minOrder: 'R$ 1.000', payment: '30 DDL', clients: 180 },
  { id: 'P002', name: 'Cliente Premium', discount: '12%', minOrder: 'R$ 2.000', payment: '30/60/90 DDL', clients: 42 },
  { id: 'P003', name: 'Distribuidor Exclusivo', discount: '20%', minOrder: 'R$ 5.000', payment: '60/90/120 DDL', clients: 8 },
  { id: 'P004', name: 'Novos Clientes', discount: '5%', minOrder: 'R$ 500', payment: '30 DDL', clients: 17 },
];

type PolicyCriteria = {
  clients: string[];
  regions: string[];
  reps: string[];
  lines: string[];
  products: string[];
};

const initialCriteria: Record<string, PolicyCriteria> = {
  P001: { clients: [], regions: ['Norte', 'Centro-Oeste', 'Nordeste'], reps: [], lines: ['Coil', 'Hertz'], products: [] },
  P002: {
    clients: ['Calçados Beira Rio', 'Sapataria Central', 'Loja Modelo SP'],
    regions: ['Sul', 'Sudeste'],
    reps: ['Carlos Mendes', 'Ana Souza'],
    lines: ['Flow XL', 'Flow', 'Hertz Art'],
    products: [],
  },
  P003: { clients: [], regions: [], reps: ['Rafael Costa'], lines: ['Flow XL'], products: [] },
  P004: { clients: [], regions: [], reps: [], lines: ['Coil'], products: [] },
};

const coveredClientsMock = [
  { name: 'Calçados Beira Rio', city: 'Porto Alegre, RS', rep: 'Carlos Mendes' },
  { name: 'Sapataria Central', city: 'Florianópolis, SC', rep: 'Carlos Mendes' },
  { name: 'Loja Modelo SP', city: 'São Paulo, SP', rep: 'Ana Souza' },
  { name: 'Calçados Estrela', city: 'Curitiba, PR', rep: 'Carlos Mendes' },
];

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('industry-stock');
  const [search, setSearch] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const criteriaState = initialCriteria;
  const [activeView, setActiveView] = useState<VisaoKey>('industria');
  const [permissionsState, setPermissionsState] = useState<PermissionsState>(defaultPermissions);

  const togglePermission = (visao: VisaoKey, perfil: string, modulo: string) => {
    setPermissionsState(prev => ({
      ...prev,
      [visao]: {
        ...prev[visao],
        [perfil]: {
          ...prev[visao][perfil],
          [modulo]: !prev[visao][perfil][modulo],
        },
      },
    }));
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto w-full space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors flex-shrink-0 ${activeTab === tab.id ? 'bg-secondary/60 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}`}
              style={{ fontSize: '0.82rem', fontWeight: activeTab === tab.id ? 600 : 400 }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Estoque Industrial Tab */}
      {activeTab === 'industry-stock' && (
        <IndustryStockTable />
      )}

      {/* Estoque do Cliente Tab */}
      {activeTab === 'client-stock' && (
        <ClientStockTab />
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && !selectedPolicyId && (
        <div className="space-y-4">
          <ErpSyncNotice text="Campanhas comerciais são somente leitura neste momento — os dados vêm diretamente das regras cadastradas no ERP da Tesla." />
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground" style={{ fontSize: '0.85rem' }}>Políticas de preço ativas</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pricePolicies.map(policy => (
              <button
                key={policy.id}
                onClick={() => setSelectedPolicyId(policy.id)}
                className="text-left bg-card border border-border rounded-xl p-5 hover:border-primary/60 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{policy.name}</h3>
                  <CaretRightIcon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: 'Desconto', value: policy.discount, highlight: true },
                    { label: 'Pedido mín.', value: policy.minOrder, mono: true },
                    { label: 'Pagamento', value: policy.payment },
                  ].map(detail => (
                    <div key={detail.label}>
                      <p className="text-muted-foreground" style={{ fontSize: '0.7rem' }}>{detail.label}</p>
                      <p className={`${detail.highlight ? 'text-primary' : 'text-foreground'} ${detail.mono ? 'mono' : ''}`} style={{ fontSize: '0.85rem', fontWeight: detail.highlight ? 700 : 500 }}>
                        {detail.value}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>
                  <span className="text-foreground font-semibold">{policy.clients}</span> clientes nesta política
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'pricing' && selectedPolicyId && (() => {
        const policy = pricePolicies.find(p => p.id === selectedPolicyId)!;
        const criteria = criteriaState[selectedPolicyId] ?? { clients: [], regions: [], reps: [], lines: [], products: [] };
        const covered = selectedPolicyId === 'P002' ? coveredClientsMock : coveredClientsMock.slice(0, Math.min(policy.clients, coveredClientsMock.length));

        const Section = ({ icon: Icon, title, hint, children }: any) => (
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-3.5 h-3.5 text-primary" />
              <h4 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{title}</h4>
            </div>
            {hint && <p className="text-muted-foreground mb-3" style={{ fontSize: '0.72rem' }}>{hint}</p>}
            <div className="mt-3">{children}</div>
          </div>
        );

        const Chips = ({ items }: { items: string[] }) => (
          <div className="flex flex-wrap gap-1.5">
            {items.length === 0 && <span className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>Nenhum item nesta condição</span>}
            {items.map(v => (
              <span key={v} className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20" style={{ fontSize: '0.75rem', fontWeight: 500 }}>
                {v}
              </span>
            ))}
          </div>
        );

        return (
          <div className="space-y-5">
            <button onClick={() => setSelectedPolicyId(null)} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: '0.78rem' }}>
              <ArrowLeftIcon className="w-3.5 h-3.5" /> Voltar para políticas
            </button>

            <ErpSyncNotice text="Esta política é somente leitura — a regra ativa vem do ERP da Tesla." />

            {/* Identidade */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="mb-4">
                <h2 className="text-foreground mb-1" style={{ fontWeight: 700, fontSize: '1.15rem' }}>{policy.name}</h2>
                <p className="text-muted-foreground" style={{ fontSize: '0.78rem' }}>Configuração da política comercial</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Desconto', value: policy.discount, highlight: true },
                  { label: 'Pedido mínimo', value: policy.minOrder, mono: true },
                  { label: 'Pagamento', value: policy.payment },
                  { label: 'Clientes cobertos', value: String(policy.clients) },
                ].map(d => (
                  <div key={d.label} className="rounded-lg bg-secondary/30 p-3">
                    <p className="text-muted-foreground mb-1" style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{d.label}</p>
                    <p className={`${d.highlight ? 'text-primary' : 'text-foreground'} ${d.mono ? 'mono' : ''}`} style={{ fontSize: '1rem', fontWeight: d.highlight ? 700 : 600 }}>{d.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Aviso precedência */}
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3.5">
              <InfoIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-foreground" style={{ fontSize: '0.78rem', lineHeight: 1.55 }}>
                <span style={{ fontWeight: 600 }}>Precedência:</span> critérios mais específicos sobrepõem os mais amplos.
                Clientes específicos &gt; Representantes &gt; Regiões. Produtos específicos &gt; Linhas de produto.
              </p>
            </div>

            {/* Critérios */}
            <div>
              <h3 className="text-foreground mb-3" style={{ fontWeight: 600, fontSize: '0.95rem' }}>Critérios de aplicação</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Section icon={UserCircleIcon} title="Clientes específicos" hint="Lojistas vinculados diretamente. Sobrepõe qualquer outro critério.">
                  <Chips items={criteria.clients} />
                </Section>

                <Section icon={MapPinIcon} title="Regiões" hint="Vale para todos os clientes da região.">
                  <Chips items={criteria.regions} />
                </Section>

                <Section icon={UsersIcon} title="Representantes" hint="Aplica a toda a carteira do rep.">
                  <Chips items={criteria.reps} />
                </Section>

                <Section icon={StackIcon} title="Linhas de produto" hint="A política se aplica apenas a estas linhas.">
                  <Chips items={criteria.lines} />
                </Section>

                <div className="lg:col-span-2">
                  <Section icon={PackageIcon} title="Produtos específicos (SKU)" hint="Granularidade por SKU. Se vazio, vale para todas as linhas marcadas acima.">
                    <Chips items={criteria.products} />
                  </Section>
                </div>
              </div>
            </div>

            {/* Clientes cobertos */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.95rem' }}>Clientes cobertos</h3>
                <p className="text-muted-foreground mt-1" style={{ fontSize: '0.75rem' }}>
                  Resultado consolidado dos critérios acima · {policy.clients} lojistas · somente leitura
                </p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/20">
                    {['Lojista', 'Cidade/UF', 'Representante'].map(c => (
                      <th key={c} className="text-left px-4 py-2.5 text-muted-foreground" style={{ fontSize: '0.7rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {covered.map(c => (
                    <tr key={c.name} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 text-foreground" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: '0.78rem' }}>{c.city}</td>
                      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: '0.78rem' }}>{c.rep}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}



      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <ErpSyncNotice text="Políticas são somente leitura neste momento — os valores exibidos refletem as regras vigentes no ERP da Tesla." />
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-foreground mb-4" style={{ fontWeight: 600 }}>Configurações de aprovação</h3>
            <div className="space-y-4">
              {[
                { label: 'Aprovação automática até', desc: 'Pedidos abaixo deste valor são aprovados automaticamente', value: 'R$ 5.000' },
                { label: 'Prazo de aprovação', desc: 'Tempo máximo para aprovação manual de pedidos', value: '48 horas' },
                { label: 'Desconto máximo por rep', desc: 'Desconto máximo que um representante pode conceder', value: '15%' },
              ].map(setting => (
                <div key={setting.label} className="flex items-center justify-between p-4 rounded-lg border border-border/60 bg-secondary/20">
                  <div>
                    <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 500 }}>{setting.label}</p>
                    <p className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>{setting.desc}</p>
                  </div>
                  <span className="text-primary mono" style={{ fontWeight: 700 }}>{setting.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-foreground mb-1" style={{ fontWeight: 600 }}>Inadimplência</h3>
            <p className="text-muted-foreground mb-4" style={{ fontSize: '0.78rem' }}>Define o comportamento do sistema para clientes com pagamentos em atraso.</p>
            <div className="flex items-center justify-between p-4 rounded-lg border border-border/60 bg-secondary/20">
              <div>
                <p className="text-foreground" style={{ fontSize: '0.85rem', fontWeight: 500 }}>Clientes inadimplentes</p>
                <p className="text-muted-foreground" style={{ fontSize: '0.75rem' }}>Condição de pagamento aplicada automaticamente a clientes com débitos em aberto</p>
              </div>
              <span className="px-3 py-2 rounded-lg border border-border bg-secondary/30 text-foreground" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                Apenas pagamento à vista
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* Usuários */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 gap-3">
              <h3 className="text-foreground" style={{ fontWeight: 600 }}>Usuários</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar usuário..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-surface text-foreground outline-none focus:border-primary"
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
                <button
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  style={{ fontSize: '0.82rem', fontWeight: 600 }}
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Novo usuário
                </button>
              </div>
            </div>
            {showAddUser && (
              <div className="bg-secondary/20 border border-primary/30 rounded-xl p-4 mb-4 space-y-3">
                <h4 className="text-foreground" style={{ fontWeight: 600, fontSize: '0.88rem' }}>Adicionar usuário</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Nome completo', placeholder: 'Nome do usuário' },
                    { label: 'E-mail', placeholder: 'email@tesla.com.br' },
                  ].map(field => (
                    <div key={field.label}>
                      <label className="block text-muted-foreground mb-1" style={{ fontSize: '0.75rem' }}>{field.label}</label>
                      <input type="text" placeholder={field.placeholder} className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground placeholder-muted-foreground outline-none focus:border-primary" style={{ fontSize: '0.82rem' }} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-muted-foreground mb-1" style={{ fontSize: '0.75rem' }}>Perfil</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground outline-none focus:border-primary" style={{ fontSize: '0.82rem' }}>
                      <option>Representante</option><option>Preposto</option><option>Lojista</option><option>Comprador</option><option>Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-muted-foreground mb-1" style={{ fontSize: '0.75rem' }}>Região</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground outline-none focus:border-primary" style={{ fontSize: '0.82rem' }}>
                      <option>Sudeste</option><option>Sul</option><option>Nordeste</option><option>Centro-Oeste</option><option>Norte</option><option>Nacional</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowAddUser(false)} className="px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors" style={{ fontSize: '0.82rem' }}>Cancelar</button>
                  <button onClick={() => setShowAddUser(false)} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontSize: '0.82rem', fontWeight: 600 }}>Criar usuário</button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/20">
                    {['Nome', 'E-mail', 'Perfil', 'Região', 'Status', 'Último acesso', ''].map(col => (
                      <th key={col} className="text-left px-4 py-3 text-muted-foreground" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())).map(user => (
                    <tr key={user.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary" style={{ fontSize: '0.62rem', fontWeight: 700 }}>{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                          </div>
                          <span className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: '0.78rem' }}>{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full ${user.role === 'Admin' ? 'bg-purple-400/10 text-purple-400' : 'bg-black/10 text-black'}`} style={{ fontSize: '0.65rem', fontWeight: 600 }}>{user.role}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: '0.78rem' }}>{user.region}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400" style={{ fontSize: '0.65rem', fontWeight: 600 }}>{user.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground mono" style={{ fontSize: '0.75rem' }}>{formatDate(user.lastLogin)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"><PencilSimpleLineIcon className="w-3.5 h-3.5" /></button>
                          <button className="p-1.5 rounded text-muted-foreground hover:text-red-400 transition-colors"><TrashIcon className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Usuários vinculados a representantes e lojistas */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-foreground" style={{ fontWeight: 600 }}>Usuários vinculados</h3>
            <p className="text-muted-foreground mt-1 mb-4" style={{ fontSize: '0.78rem' }}>
              Contas registradas sob um representante ou lojista (ex.: prepostos e compradores). Cada um gerencia o perfil de acesso da própria equipe.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/20">
                    {['Usuário', 'E-mail', 'Perfil', 'Vinculado a', 'Status', 'Último acesso'].map(col => (
                      <th key={col} className="text-left px-4 py-3 text-muted-foreground" style={{ fontSize: '0.72rem', fontWeight: 500 }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {linkedUsers.map(user => (
                    <tr key={user.id} className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary" style={{ fontSize: '0.62rem', fontWeight: 700 }}>{user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                          </div>
                          <span className="text-foreground" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground" style={{ fontSize: '0.78rem' }}>{user.email}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary" style={{ fontSize: '0.65rem', fontWeight: 600 }}>{user.profile}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full ${user.ownerType === 'representante' ? 'bg-amber-400/10 text-amber-500' : 'bg-emerald-400/10 text-emerald-500'}`} style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                          {user.ownerType === 'representante' ? 'Rep · ' : 'Lojista · '}{user.ownerName}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full ${user.status === 'ativo' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-muted text-muted-foreground'}`} style={{ fontSize: '0.65rem', fontWeight: 600 }}>{user.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground mono" style={{ fontSize: '0.75rem' }}>{user.lastLogin === '—' ? '—' : formatDate(user.lastLogin)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-foreground mb-4" style={{ fontWeight: 600 }}>Informações da empresa</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Nome da empresa', value: 'Tesla Footwear Indústria LTDA' },
                { label: 'CNPJ', value: '12.345.678/0001-90' },
                { label: 'Website', value: 'teslafootwear.com.br' },
                { label: 'Suporte', value: 'suporte@tesla.com.br' },
              ].map(field => (
                <div key={field.label}>
                  <label className="block text-muted-foreground mb-1" style={{ fontSize: '0.75rem' }}>{field.label}</label>
                  <input
                    type="text"
                    defaultValue={field.value}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-foreground outline-none focus:border-primary"
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              ))}
            </div>
            <button className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
              Salvar alterações
            </button>
          </div>

        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          {/* Visão selector */}
          <div className="grid grid-cols-3 gap-3">
            {visoes.map(v => {
              const Icon = v.icon;
              const active = activeView === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => setActiveView(v.id)}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-colors text-left ${active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/30'}`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-primary/20' : 'bg-secondary/60'}`}>
                    <Icon className={`w-4 h-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <p className={`${active ? 'text-primary' : 'text-foreground'}`} style={{ fontSize: '0.85rem', fontWeight: 600 }}>{v.label}</p>
                    <p className="text-muted-foreground" style={{ fontSize: '0.72rem' }}>{v.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Permission matrix */}
          <PermissionMatrixTable
            matrix={permissionsState[activeView]}
            onToggle={(perfil, modulo) => togglePermission(activeView, perfil, modulo)}
            onReset={() => setPermissionsState(prev => ({ ...prev, [activeView]: defaultPermissions[activeView] }))}
          />
        </div>
      )}
    </div>
  );
}
