import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard, Package2, ShoppingBag, ShoppingBasket, Clock,
  Sparkles, BarChart3, Settings, Users, Store, ChevronDown, ChevronRight,
  Bell, Search, Menu, X, Building2, LogOut, ChevronLeft,
  UserCheck, Tag, Shield, Boxes, Receipt,
} from "lucide-react";
import type { Client } from "../data/mockData";
import teslaLogo from "../../assets/tesla-footwear-logo.png";

export type View =
  | 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'carts' | 'history'
  | 'marketing' | 'sellout' | 'admin' | 'clients' | 'profile' | 'stock'
  | 'industry-stock' | 'permissions' | 'boletos';

type Profile = 'admin' | 'rep' | 'lojista';

interface NavItem {
  id: View;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const profileLabels: Record<Profile, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  admin: { label: 'Indústria Admin', icon: Building2, color: 'text-black' },
  rep: { label: 'Representante', icon: Users, color: 'text-amber-400' },
  lojista: { label: 'Lojista', icon: Store, color: 'text-emerald-400' },
};

interface SidebarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  profile: Profile;
  onLogout: () => void;
  notifications?: number;
  selectedClient?: Client | null;
}

export function Sidebar({ currentView, onNavigate, profile, onLogout, notifications = 4, selectedClient }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-collapse sidebar when lojista enters the cart
  useEffect(() => {
    if (profile === 'lojista' && currentView === 'cart') {
      setCollapsed(true);
    }
  }, [profile, currentView]);

  const profileInfo = profileLabels[profile];
  const ProfileIcon = profileInfo.icon;

  const getVisibleItems = (): NavItem[] => {
    if (profile === 'rep') {
      if (!selectedClient) {
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'clients', label: 'Selecionar Cliente', icon: Store },
        ];
      }
      return [
        { id: 'catalog', label: 'Catálogo', icon: Package2 },
        { id: 'order-grade', label: 'Novo Pedido', icon: ShoppingBag },
      ];
    }
    if (profile === 'lojista') {
      return [
        { id: 'dashboard', label: 'Indicadores', icon: LayoutDashboard },
        { id: 'catalog', label: 'Catálogo', icon: Package2 },
      ];
    }
    return [
      { id: 'catalog', label: 'Catálogo', icon: Package2 },
      { id: 'history', label: 'Pedidos', icon: ShoppingBag },
      { id: 'clients', label: 'Clientes', icon: Users },
      { id: 'admin', label: 'Representantes', icon: UserCheck },
      { id: 'admin', label: 'Política Comercial', icon: Tag },
    ];
  };

  const visibleItems = getVisibleItems();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center border-b border-sidebar-border px-4 h-14 ${collapsed ? 'justify-center' : 'gap-3'}`}>
        <div className={`flex items-center justify-center flex-shrink-0 ${collapsed ? 'w-7 h-7' : 'h-8'}`}>
          <img src={teslaLogo} alt="Tesla Footwear" className={collapsed ? 'h-6 w-auto object-contain' : 'h-7 w-auto object-contain'} />
        </div>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Profile pill */}
      {!collapsed && (
        <div className="mx-3 mt-3 rounded-lg bg-secondary/60 border border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <ProfileIcon className={`w-3.5 h-3.5 ${profileInfo.color}`} />
            <span className="text-foreground truncate" style={{ fontSize: '0.78rem', fontWeight: 500 }}>{profileInfo.label}</span>
          </div>
        </div>
      )}

      {/* Selected client chip — rep only */}
      {!collapsed && profile === 'rep' && selectedClient && (
        <div className="mx-3 mt-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
          <p className="text-muted-foreground" style={{ fontSize: '0.62rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pedindo para</p>
          <p className="text-primary truncate mt-0.5" style={{ fontSize: '0.82rem', fontWeight: 600 }}>{selectedClient.name}</p>
        </div>
      )}

      {/* Search */}
      {!collapsed && (
        <div className="mx-3 mt-3">
          <div className="flex items-center gap-2 rounded-lg bg-secondary/40 border border-border px-3 py-2 text-muted-foreground">
            <Search className="w-3.5 h-3.5 flex-shrink-0" />
            <span style={{ fontSize: '0.78rem' }}>Buscar...</span>
            <kbd className="ml-auto text-muted-foreground/60 border border-border rounded px-1" style={{ fontSize: '0.6rem' }}>⌘K</kbd>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <button
              key={item.label}
              onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
              className={`w-full flex items-center rounded-md transition-all duration-150 ${collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-3 py-2.5'} ${
                active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate" style={{ fontSize: '0.83rem', fontWeight: active ? 600 : 400 }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-sidebar-border p-2 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-primary" style={{ fontSize: '0.65rem', fontWeight: 700 }}>TF</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-foreground truncate" style={{ fontSize: '0.78rem', fontWeight: 500 }}>Tesla Footwear</div>
              <div className="text-muted-foreground truncate" style={{ fontSize: '0.7rem' }}>admin@tesla.com.br</div>
            </div>
            <button onClick={onLogout} className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded" title="Sair">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="w-full flex items-center justify-center p-2.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-secondary/60"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border text-foreground"
      >
        <Menu className="w-4 h-4" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full bg-sidebar border-r border-sidebar-border">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1">
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      <aside className={`hidden lg:flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-200 flex-shrink-0 ${collapsed ? 'w-[52px]' : 'w-[260px]'}`}>
        <SidebarContent />
      </aside>
    </>
  );
}

interface TopBarProps {
  title: string;
  subtitle?: string;
  profile: Profile;
  currentView: View;
  notifications?: number;
  actions?: React.ReactNode;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  cartCount?: number;
  selectedClient?: Client | null;
}

export function TopBar({ title, subtitle, profile, currentView, notifications = 4, actions, onNavigate, onLogout, cartCount = 0, selectedClient }: TopBarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const avatarRef = useRef<HTMLButtonElement>(null);
  const profileInfo = profileLabels[profile];
  const ProfileIcon = profileInfo.icon;

  type DropdownItem = { label: string; icon: React.ComponentType<{ className?: string }>; view?: View; action?: () => void };
  type HeaderItem = { label: string; icon: React.ComponentType<{ className?: string }>; view: View };

  const headerItems: HeaderItem[] =
    profile === 'admin'
      ? [
          { icon: BarChart3, label: 'Indicadores', view: 'dashboard' as View },
          { icon: Users, label: 'Clientes', view: 'clients' as View },
          ...(selectedClient ? [{ icon: Package2, label: 'Catálogo', view: 'catalog' as View }] : []),
          { icon: Sparkles, label: 'Marketing IA', view: 'marketing' as View },
          { icon: Shield, label: 'Administração', view: 'admin' as View },
        ]
      : profile === 'rep'
      ? [
          { icon: BarChart3, label: 'Meus Indicadores', view: 'dashboard' as View },
          { icon: Store, label: 'Carteira de Clientes', view: 'clients' as View },
          ...(selectedClient ? [{ icon: Package2, label: 'Catálogo', view: 'catalog' as View }] : []),
          { icon: Boxes, label: 'Estoque', view: 'industry-stock' as View },
          { icon: Sparkles, label: 'Marketing IA', view: 'marketing' as View },
          { icon: Shield, label: 'Permissões', view: 'permissions' as View },
        ]
      : [
          { icon: BarChart3, label: 'Indicadores', view: 'dashboard' },
          { icon: Package2, label: 'Catálogo', view: 'catalog' },
          { icon: Boxes, label: 'Meu Estoque', view: 'stock' },
          { icon: Sparkles, label: 'Marketing IA', view: 'marketing' },
          { icon: Shield, label: 'Permissões', view: 'permissions' },
        ];

  const dropdownItems: DropdownItem[] =
    profile === 'admin'
      ? [
          { icon: Clock, label: 'Pedidos', view: 'history' },
          { icon: Receipt, label: 'Pagamentos e Boletos', view: 'boletos' },
          { icon: Users, label: 'Meu Perfil', view: 'profile' },
          { icon: LogOut, label: 'Sair', action: onLogout },
        ]
      : profile === 'rep'
      ? [
          { icon: Clock, label: 'Pedidos', view: 'history' },
          { icon: Receipt, label: 'Pagamentos e Boletos', view: 'boletos' },
          { icon: Users, label: 'Meu Perfil', view: 'profile' },
          { icon: LogOut, label: 'Sair', action: onLogout },
        ]
      : [
          { icon: ShoppingBag, label: 'Meus Pedidos', view: 'history' },
          { icon: Receipt, label: 'Pagamentos e Boletos', view: 'boletos' },
          { icon: Users, label: 'Meu Perfil', view: 'profile' },
          { icon: LogOut, label: 'Sair', action: onLogout },
        ];

  const handleDropdownItem = (item: DropdownItem) => {
    setProfileOpen(false);
    if (item.action) { item.action(); return; }
    if (item.view) onNavigate(item.view);
  };

  return (
    <header className="h-14 border-b border-border bg-background/80 backdrop-blur flex items-center px-6 gap-3 flex-shrink-0">
      <div className="flex-1 min-w-0 flex items-center gap-3">
        {currentView !== 'catalog' && (
          <div className="flex items-center pr-3 mr-1 border-r border-border h-8 flex-shrink-0">
            <img src={teslaLogo} alt="Tesla Footwear" className="h-6 w-auto object-contain" />
          </div>
        )}
        {/* Nav items à esquerda quando existem, caso contrário título */}
        {headerItems.length > 0 ? (
          <div className="flex items-center gap-1">
            {headerItems.map(item => {
          const Icon = item.icon;
          const active = currentView === item.view;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.view)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
              style={{ fontSize: '0.78rem', fontWeight: active ? 600 : 500 }}
              title={item.label}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
            })}
          </div>
        ) : (
          <>
            <h1 className="text-foreground truncate" style={{ fontSize: '0.95rem', fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</h1>
            {subtitle && <p className="text-muted-foreground truncate hidden sm:block" style={{ fontSize: '0.75rem' }}>{subtitle}</p>}
          </>
        )}

      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {actions}

        {/* Cart(s) — todos os perfis usam multi-carrinhos */}
        <button
          onClick={() => onNavigate('carts')}
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          title="Carrinhos"
        >
          <ShoppingBasket className="w-4 h-4" />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center" style={{ fontSize: '0.6rem', fontWeight: 700 }}>
              {cartCount}
            </span>
          )}
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
          <Bell className="w-4 h-4" />
          {notifications > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />}
        </button>

        {/* Client chip — before avatar */}
        {selectedClient && (
          <button
            onClick={() => onNavigate('history')}
            className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border border-border/60 rounded-lg flex-shrink-0 hover:bg-secondary/60 hover:border-primary/30 transition-colors"
            title="Ver histórico de pedidos deste cliente"
          >
            <Store className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground hover:text-foreground" style={{ fontSize: '0.82rem', fontWeight: 500 }}>{selectedClient.name}</span>
          </button>
        )}

        {/* Avatar + dropdown */}
        <div className="relative pl-2 border-l border-border ml-1">
          <button
            ref={avatarRef}
            onClick={() => {
              if (avatarRef.current) {
                const rect = avatarRef.current.getBoundingClientRect();
                setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
              }
              setProfileOpen(o => !o);
            }}
            className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors"
          >
            <ProfileIcon className={`w-3.5 h-3.5 ${profileInfo.color}`} />
          </button>

          {profileOpen && createPortal(
            <>
              <div className="fixed inset-0 z-[9998]" onClick={() => setProfileOpen(false)} />
              <div className="fixed w-48 bg-card border border-border rounded-xl shadow-lg z-[9999] py-1.5 overflow-hidden" style={{ top: dropdownPos.top, right: dropdownPos.right }}>
                <p className="px-3 pb-1.5 pt-0.5 text-muted-foreground border-b border-border mb-1" style={{ fontSize: '0.7rem' }}>
                  {profileInfo.label}
                </p>
                {dropdownItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => handleDropdownItem(item)}
                      className={`w-full text-left px-3 py-2 hover:bg-secondary/60 transition-colors flex items-center gap-2.5 ${item.label === 'Sair' ? 'text-destructive' : 'text-foreground'}`}
                      style={{ fontSize: '0.82rem' }}
                    >
                      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </>,
            document.body
          )}
        </div>
      </div>
    </header>
  );
}
