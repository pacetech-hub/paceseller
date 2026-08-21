import { useState } from "react";
import { Toaster } from "./components/ui/sonner";
import { LoginPage } from "./components/LoginPage";
import { Sidebar, TopBar } from "./components/Sidebar";
import type { View } from "./components/Sidebar";
import { clients as clientsList, type Client } from "./data/mockData";
import { DashboardAdmin } from "./components/DashboardAdmin";
import { DashboardRep } from "./components/DashboardRep";
import { DashboardLojista } from "./components/DashboardLojista";
import { CatalogPage } from "./components/CatalogPage";
import { OrderGrade } from "./components/OrderGrade";
import { CartPage } from "./components/CartPage";
import { CartsListPage, mockCarts, type CartContext, type CartCreator } from "./components/CartsListPage";
import { OrderHistory } from "./components/OrderHistory";
import { LojistaHistoryDashboard } from "./components/LojistaHistoryDashboard";
import { MarketingStudio } from "./components/MarketingStudio";
import { SelloutDashboard } from "./components/SelloutDashboard";
import { AdminPage } from "./components/AdminPage";
import { ClientsPage } from "./components/ClientsPage";
import { ProfilePage } from "./components/ProfilePage";
import { BoletosPage } from "./components/BoletosPage";
import { LojistaFiltersSidebar, defaultFilters, type CatalogFilters } from "./components/LojistaFiltersSidebar";
import { StockPage } from "./components/StockPage";
import { RepStockPage } from "./components/RepStockPage";
import { AccessPermissionsPage } from "./components/AccessPermissionsPage";

type Profile = 'admin' | 'rep' | 'lojista';

const viewTitles: Record<View, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral do seu negócio' },
  catalog: { title: 'Catálogo' },
  'order-grade': { title: 'Pedido por Grade', subtitle: 'Monte pedidos em menos de 2 minutos' },
  cart: { title: 'Carrinho', subtitle: 'Revise e finalize seu pedido' },
  carts: { title: 'Carrinhos', subtitle: 'Selecione um carrinho ou crie um novo' },
  history: { title: 'Histórico de Pedidos', subtitle: 'Todos os seus pedidos' },
  marketing: { title: 'Estúdio de Marketing IA', subtitle: 'Crie campanhas profissionais automaticamente' },
  sellout: { title: 'Sell-out Intelligence', subtitle: 'Análise de performance comercial' },
  admin: { title: 'Gestão', subtitle: 'Usuários, produtos, políticas e configurações' },
  clients: { title: 'Clientes', subtitle: 'Sua carteira de clientes' },
  profile: { title: 'Meu Perfil', subtitle: 'Seus dados, preferências e acesso' },
  boletos: { title: 'Pagamentos e Boletos', subtitle: 'Suas faturas, boletos e histórico de pagamentos' },
  stock: { title: 'Meu Estoque', subtitle: 'Cadastre ou integre seu estoque da marca' },
  'industry-stock': { title: 'Estoque', subtitle: 'Estoque industrial e por cliente — somente visualização' },
  permissions: { title: 'Permissões de Acesso', subtitle: 'Controle o que os usuários vinculados à sua conta podem acessar' },
};

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState<Profile>('admin');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [activeCart, setActiveCart] = useState<CartContext | null>(null);
  const [carts, setCarts] = useState<CartContext[]>(() =>
    mockCarts.map(({ id, clientId, clientName, cartName, createdBy }) => ({ id, clientId, clientName, cartName, createdBy }))
  );
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>(defaultFilters);

  // Todos os perfis suportam múltiplos carrinhos.
  const multiCart = true;
  const viewerRole: CartCreator = profile === 'lojista' ? 'lojista' : 'rep';
  // Lojista não seleciona cliente — ele é o próprio cliente da sua loja.
  const cartsClient = profile === 'lojista' ? clientsList[0] : selectedClient;
  const clientCarts = cartsClient ? carts.filter(c => c.clientId === cartsClient.id) : [];

  const createCart = (name: string, client?: Client | null): CartContext | null => {
    const c = client ?? cartsClient;
    if (!c) return null;
    const ctx: CartContext = {
      id: `CART-NEW-${Date.now()}`,
      clientId: c.id,
      clientName: c.name,
      cartName: name?.trim() || 'Novo carrinho',
      createdBy: viewerRole,
    };
    setCarts(prev => [ctx, ...prev]);
    return ctx;
  };

  const handleLogin = (selectedProfile: Profile) => {
    setProfile(selectedProfile);
    setAuthenticated(true);
    // Lojista entra direto no catálogo; Rep entra direto na lista de clientes
    if (selectedProfile === 'lojista') setCurrentView('catalog');
    else if (selectedProfile === 'rep') setCurrentView('clients');
    else setCurrentView('dashboard');
    setSelectedClient(null);
    setCatalogFilters(defaultFilters);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setCurrentView('dashboard');
    setSelectedClient(null);
  };

  const navigate = (view: View) => setCurrentView(view);

  const viewInfo = currentView === 'dashboard'
    ? {
        title: 'Indicadores',
        subtitle:
          profile === 'admin' ? 'Visão geral da indústria' :
          profile === 'rep' ? 'Sua performance e carteira' :
          'Sua loja em números',
      }
    : viewTitles[currentView];

  if (!authenticated) {
    return (
      <div>
        {/* MARKER-MAKE-KIT-INVOKED */}
        <LoginPage onLogin={handleLogin} />
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        if (profile === 'admin') return <DashboardAdmin onNavigate={navigate} />;
        if (profile === 'rep') return <DashboardRep onNavigate={navigate} selectedClient={selectedClient} />;
        return <DashboardLojista onNavigate={navigate} />;
      case 'catalog': {
        const useFilters = true;
        return (
          <CatalogPage
            onNavigate={navigate}
            selectedClient={selectedClient}
            externalFilters={useFilters ? catalogFilters : undefined}
            onExternalFiltersChange={useFilters ? setCatalogFilters : undefined}
            clientCarts={cartsClient ? clientCarts : carts}
            activeCartId={activeCart?.id ?? null}
            onPickCart={(ctx) => {
              if (profile !== 'lojista' && (!selectedClient || selectedClient.id !== ctx.clientId)) {
                const c = clientsList.find(x => x.id === ctx.clientId) ?? null;
                if (c) setSelectedClient(c);
              }
              setActiveCart(ctx);
            }}
            onCreateCart={(name) => {
              const ctx = createCart(name);
              if (ctx) setActiveCart(ctx);
              return ctx;
            }}
          />
        );
      }
      case 'order-grade':
        return <OrderGrade onNavigate={navigate} selectedClient={selectedClient} />;
      case 'cart':
        return (
          <CartPage
            onNavigate={navigate}
            cartContext={activeCart}
            multiCart={multiCart}
            viewerRole={viewerRole}
            onCreateNewCart={(name) => {
              const ctx = createCart(name);
              if (ctx) {
                setActiveCart(ctx);
                setCurrentView('catalog');
              }
            }}
            selectedPriceTable={catalogFilters.priceTable}
          />
        );
      case 'carts':
        return (
          <CartsListPage
            selectedClient={cartsClient}
            viewerRole={viewerRole}
            lockClient={profile === 'lojista'}
            onNavigateClients={profile === 'lojista' ? undefined : () => setCurrentView('clients')}
            onSelectClient={profile === 'lojista' ? undefined : (c) => setSelectedClient(c)}
            onOpenCart={(ctx) => {
              if (profile !== 'lojista' && (!selectedClient || selectedClient.id !== ctx.clientId)) {
                const c = clientsList.find(x => x.id === ctx.clientId) ?? null;
                if (c) setSelectedClient(c);
              }
              setActiveCart(ctx);
              setCurrentView('cart');
            }}
            onCreateCart={(ctx) => {
              setCarts(prev => [ctx, ...prev]);
              if (profile !== 'lojista' && (!selectedClient || selectedClient.id !== ctx.clientId)) {
                const c = clientsList.find(x => x.id === ctx.clientId) ?? null;
                if (c) setSelectedClient(c);
              }
              setActiveCart(ctx);
              setCurrentView('catalog');
            }}
            onGoToCatalog={(ctx) => {
              if (profile !== 'lojista' && (!selectedClient || selectedClient.id !== ctx.clientId)) {
                const c = clientsList.find(x => x.id === ctx.clientId) ?? null;
                if (c) setSelectedClient(c);
              }
              setActiveCart(ctx);
              setCurrentView('catalog');
            }}
          />
        );
      case 'history':
        return <OrderHistory onNavigate={navigate} profile={profile} />;
      case 'marketing':
        return <MarketingStudio />;
      case 'sellout':
        return <SelloutDashboard />;
      case 'admin':
        return <AdminPage />;
      case 'clients':
        return <ClientsPage onNavigate={navigate} selectedClient={selectedClient} setSelectedClient={setSelectedClient} />;
      case 'profile':
        return <ProfilePage profile={profile} />;
      case 'boletos':
        return <BoletosPage profile={profile} />;
      case 'stock':
        return <StockPage />;
      case 'industry-stock':
        return <RepStockPage />;
      case 'permissions':
        return <AccessPermissionsPage profile={profile === 'lojista' ? 'lojista' : 'rep'} />;
      default:
        return <DashboardAdmin onNavigate={navigate} />;
    }
  };

  const isFiltersCatalog = currentView === 'catalog';
  const hideSidebar = currentView !== 'catalog';

  return (
    <div className="h-screen flex bg-background text-foreground overflow-hidden">
      <Toaster position="top-center" duration={4000} />
      {isFiltersCatalog ? (
        <LojistaFiltersSidebar
          filters={catalogFilters}
          onChange={setCatalogFilters}
          onLogout={handleLogout}
          profile={profile as 'lojista' | 'rep' | 'admin'}
          selectedClient={selectedClient}
        />
      ) : hideSidebar ? null : (
        <Sidebar
          currentView={currentView}
          onNavigate={navigate}
          profile={profile}
          onLogout={handleLogout}
          notifications={4}
          selectedClient={selectedClient}
        />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={viewInfo.title}
          subtitle={viewInfo.subtitle}
          profile={profile}
          currentView={currentView}
          notifications={4}
          onNavigate={navigate}
          onLogout={handleLogout}
          cartCount={cartsClient ? clientCarts.length : carts.length}
          selectedClient={['catalog', 'order-grade', 'cart', 'carts'].includes(currentView) ? selectedClient : null}
        />
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
      </div>
    </div>
  );
}
