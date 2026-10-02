import { useState } from "react";
import { Box, Stack } from "@mantine/core";
import classes from "./App.module.css";
import { LoginPage } from "./components/LoginPage";
import { TopBar } from "./components/Sidebar";
import type { View } from "./components/Sidebar";
import { clients as clientsList, orders as ordersList, type Client, type Order } from "./data/mockData";
import { DashboardAdmin } from "./components/DashboardAdmin";
import { DashboardRep, CURRENT_REP_NAME } from "./components/DashboardRep";
import { SalesTeamPage } from "./components/SalesTeamPage";
import { getNetworkEntities, getRepTeamEntities } from "./components/SalesIndicatorsSection";
import { DashboardLojista } from "./components/DashboardLojista";
import { CatalogPage } from "./components/CatalogPage";
import { OrderGrade } from "./components/OrderGrade";
import { CartPage } from "./components/CartPage";
import { CartsListPage } from "./components/CartsListPage";
import { CartDrawer } from "./components/CartDrawer";
import { GradeSheet } from "./components/SizeGrade";
import { isOpen, toContext, getCart, useCartStore, type CartContext, type CartCreator } from "./data/cartStore";
import { useRadar, isCritical, type CtaTarget } from "./data/radar";
import { ShopContext, type GradeRequest, type ShopContextValue } from "./lib/shop";
import type { CatalogEntry } from "./components/CatalogPage";
import { OrderHistory } from "./components/OrderHistory";
import { LojistaHistoryDashboard } from "./components/LojistaHistoryDashboard";
import { MarketingStudio } from "./components/MarketingStudio";
import { SelloutDashboard } from "./components/SelloutDashboard";
import { AdminPage } from "./components/AdminPage";
import { ClientsPage } from "./components/ClientsPage";
import { ClientDetailPage } from "./components/ClientDetailPage";
import { ProfilePage } from "./components/ProfilePage";
import { BoletosPage } from "./components/BoletosPage";
import { OrderDetailPage } from "./components/OrderDetailPage";
import { FichaTecnicaPage } from "./components/FichaTecnicaPage";
import { defaultFilters, type CatalogFilters } from "./components/CatalogFiltersBar";
import { StockPage } from "./components/StockPage";
import { RepStockPage } from "./components/RepStockPage";
import { AccessPermissionsPage } from "./components/AccessPermissionsPage";
import { RadarPage } from "./components/RadarPage";

type Profile = 'admin' | 'rep' | 'lojista';

// Nome do usuário lojista logado (mock até existir autenticação real).
const CURRENT_LOJISTA_NAME = 'Juliana';

const viewTitles: Record<View, { title: string; subtitle?: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Visão geral do seu negócio' },
  catalog: { title: 'Catálogo' },
  'order-grade': { title: 'Pedido por Grade', subtitle: 'Monte pedidos em menos de 2 minutos' },
  cart: { title: 'Carrinho', subtitle: 'Revise e finalize seu pedido' },
  carts: { title: 'Meus carrinhos', subtitle: 'Carrinhos compartilhados com o representante' },
  history: { title: 'Pedidos', subtitle: 'Todos os seus pedidos' },
  marketing: { title: 'Estúdio de Marketing IA', subtitle: 'Crie campanhas profissionais automaticamente' },
  sellout: { title: 'Sell-out Intelligence', subtitle: 'Análise de performance comercial' },
  admin: { title: 'Gestão', subtitle: 'Usuários, produtos, políticas e configurações' },
  clients: { title: 'Clientes', subtitle: 'Sua carteira de clientes' },
  'client-detail': { title: 'Cliente', subtitle: 'Informações e ações rápidas' },
  profile: { title: 'Meu Perfil', subtitle: 'Seus dados, preferências e acesso' },
  boletos: { title: 'Pagamentos e Boletos', subtitle: 'Suas faturas, boletos e histórico de pagamentos' },
  stock: { title: 'Meu Estoque', subtitle: 'Cadastre ou integre seu estoque da marca' },
  'industry-stock': { title: 'Estoque', subtitle: 'Estoque industrial e por cliente — somente visualização' },
  permissions: { title: 'Permissões de Acesso', subtitle: 'Controle o que os usuários vinculados à sua conta podem acessar' },
  'order-detail': { title: 'Pedido', subtitle: 'Detalhes do pedido' },
  'ficha-tecnica': { title: 'Ficha Técnica', subtitle: 'Informações completas, imagens e medidas dos produtos' },
  'sales-team': { title: 'Vendedores', subtitle: 'Representantes e prepostos' },
  radar: { title: 'Radar', subtitle: 'O que precisa de ação na sua loja, por quando agir' },
};

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [profile, setProfile] = useState<Profile>('admin');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeCart, setActiveCart] = useState<CartContext | null>(null);
  const { carts } = useCartStore();
  const radar = useRadar();
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>(defaultFilters);
  const [orderStatusFilter, setOrderStatusFilter] = useState('todos');
  const [catalogEntry, setCatalogEntry] = useState<CatalogEntry | undefined>(undefined);
  const [catalogKey, setCatalogKey] = useState(0);
  const [catalogSortBy, setCatalogSortBy] = useState<string | null>(null);
  const [gradeRequest, setGradeRequest] = useState<GradeRequest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const viewerRole: CartCreator = profile === 'lojista' ? 'lojista' : 'rep';
  // Lojista não seleciona cliente — ele é o próprio cliente da sua loja.
  const cartsClient = profile === 'lojista' ? clientsList[0] : selectedClient;
  const clientCarts = cartsClient ? carts.filter(c => c.clientId === cartsClient.id && isOpen(c)) : [];

  const openCart = (cartId: string) => {
    const cart = getCart(cartId);
    if (!cart) return;
    if (profile !== 'lojista' && (!selectedClient || selectedClient.id !== cart.clientId)) {
      const c = clientsList.find(x => x.id === cart.clientId) ?? null;
      if (c) setSelectedClient(c);
    }
    setActiveCart(toContext(cart));
    setDrawerOpen(false);
    setGradeRequest(null);
    setCurrentView('cart');
  };

  const shop: ShopContextValue = {
    role: viewerRole,
    clientId: cartsClient?.id ?? null,
    openGrade: (req) => setGradeRequest(req),
    openCart,
    openDrawer: () => setDrawerOpen(true),
  };

  const handleLogin = (selectedProfile: Profile) => {
    setProfile(selectedProfile);
    setAuthenticated(true);
    // Lojista entra no Radar (a home da loja); Rep entra direto na lista de clientes
    if (selectedProfile === 'lojista') setCurrentView('radar');
    else if (selectedProfile === 'rep') setCurrentView('clients');
    else setCurrentView('dashboard');
    setSelectedClient(null);
    setCatalogFilters(defaultFilters);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setCurrentView('dashboard');
    setSelectedClient(null);
    setSelectedOrder(null);
  };

  const openOrder = (order: Order) => {
    setSelectedOrder(order);
    setCurrentView('order-detail');
  };

  const navigate = (view: View) => {
    setCatalogEntry(undefined);
    setCatalogSortBy(null);
    setDrawerOpen(false);
    if (view === 'catalog') setCatalogKey(k => k + 1);
    setCurrentView(view);
  };

  const openOrderById = (orderId: string) => {
    const order = ordersList.find(o => o.id === orderId);
    if (order) openOrder(order);
  };

  // Todo CTA do Radar abre o destino com o contexto aplicado (FR-108): filtro, grade preenchida, carrinho aberto.
  const handleRadarCta = (target: CtaTarget) => {
    switch (target.kind) {
      case 'order': openOrderById(target.orderId); return;
      case 'carts': navigate('carts'); return;
      case 'cart': openCart(target.cartId); return;
      case 'catalog':
        setCatalogSortBy(null);
        setCatalogFilters(f => ({
          ...defaultFilters,
          priceTable: f.priceTable,
          line: target.line ?? defaultFilters.line,
          radar: target.radarFilter ? [target.radarFilter] : [],
        }));
        setCatalogEntry({ fromRadar: true });
        setCatalogKey(k => k + 1);
        setCurrentView('catalog');
        return;
      case 'product':
        setCatalogSortBy(null);
        setCatalogEntry({ productId: target.productId, prefill: target.prefill, block: target.block, fromRadar: true });
        setCatalogKey(k => k + 1);
        setCurrentView('catalog');
        return;
    }
  };

  const viewInfo = currentView === 'dashboard'
    ? {
        title: 'Indicadores',
        subtitle:
          profile === 'admin' ? 'Visão geral da indústria' :
          profile === 'rep' ? 'Sua performance e carteira' :
          'Sua loja em números',
      }
    : currentView === 'order-detail' && selectedOrder
    ? { title: selectedOrder.id, subtitle: 'Detalhes do pedido' }
    : currentView === 'client-detail' && selectedClient
    ? { title: selectedClient.name, subtitle: 'Informações e ações rápidas' }
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
      case 'dashboard': {
        const openClientDetail = (client: Client) => { setSelectedClient(client); navigate('client-detail'); };
        const openOrderStatus = (status: string) => { setOrderStatusFilter(status); navigate('history'); };
        if (profile === 'admin') return <DashboardAdmin onNavigate={navigate} onSelectClient={openClientDetail} onOpenOrderStatus={openOrderStatus} />;
        if (profile === 'rep') return <DashboardRep onNavigate={navigate} selectedClient={selectedClient} onSelectClient={openClientDetail} onOpenOrderStatus={openOrderStatus} />;
        return <DashboardLojista onNavigate={navigate} />;
      }
      case 'catalog':
        return (
          <CatalogPage
            key={catalogKey}
            onNavigate={navigate}
            selectedClient={selectedClient}
            filters={catalogFilters}
            onFiltersChange={setCatalogFilters}
            entry={catalogEntry}
            initialSortBy={catalogSortBy}
            onBackToRadar={() => navigate('radar')}
          />
        );
      case 'order-grade':
        return <OrderGrade onNavigate={navigate} selectedClient={selectedClient} />;
      case 'cart':
        return (
          <CartPage
            onNavigate={navigate}
            cartContext={activeCart}
            onSwitchCart={setActiveCart}
            viewerRole={viewerRole}
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
            onOpenCart={(ctx) => openCart(ctx.id)}
            onCartCreated={(ctx) => {
              if (profile !== 'lojista' && (!selectedClient || selectedClient.id !== ctx.clientId)) {
                const c = clientsList.find(x => x.id === ctx.clientId) ?? null;
                if (c) setSelectedClient(c);
              }
              setActiveCart(ctx);
              navigate('catalog');
            }}
          />
        );
      case 'history':
        return (
          <OrderHistory
            onNavigate={navigate}
            onSelectOrder={openOrder}
            profile={profile}
            initialSearch={profile !== 'lojista' && selectedClient ? selectedClient.name : ''}
            initialStatusFilter={orderStatusFilter}
          />
        );
      case 'order-detail':
        return <OrderDetailPage order={selectedOrder} onNavigate={navigate} profile={profile} />;
      case 'marketing':
        return <MarketingStudio profile={profile} />;
      case 'sellout':
        return <SelloutDashboard />;
      case 'admin':
        return <AdminPage />;
      case 'clients':
        return <ClientsPage onNavigate={navigate} selectedClient={selectedClient} setSelectedClient={setSelectedClient} />;
      case 'client-detail':
        return <ClientDetailPage client={selectedClient} onNavigate={navigate} cartCount={clientCarts.length} />;
      case 'sales-team':
        return (
          <SalesTeamPage
            scope={profile === 'admin' ? 'network' : 'own'}
            entities={profile === 'admin' ? getNetworkEntities() : getRepTeamEntities(CURRENT_REP_NAME)}
            onBack={() => navigate('dashboard')}
          />
        );
      case 'profile':
        return <ProfilePage profile={profile} />;
      case 'boletos':
        return (
          <BoletosPage
            profile={profile}
            initialSearch={profile !== 'lojista' && selectedClient ? selectedClient.name : ''}
          />
        );
      case 'ficha-tecnica':
        return <FichaTecnicaPage profile={profile} />;
      case 'stock':
        return <StockPage />;
      case 'industry-stock':
        return <RepStockPage />;
      case 'radar':
        return (
          <RadarPage
            profile={profile}
            userName={CURRENT_LOJISTA_NAME}
            onCta={handleRadarCta}
          />
        );
      case 'permissions':
        return <AccessPermissionsPage profile={profile === 'lojista' ? 'lojista' : 'rep'} />;
      default:
        return (
          <DashboardAdmin
            onNavigate={navigate}
            onSelectClient={(client) => { setSelectedClient(client); navigate('client-detail'); }}
            onOpenOrderStatus={(status) => { setOrderStatusFilter(status); navigate('history'); }}
          />
        );
    }
  };

  // FR-801: sino = críticos em aberto + carrinhos em "Aguardando você"
  const bellCount = profile === 'lojista'
    ? radar.open.filter(isCritical).length + clientCarts.filter(c => c.stage === 'aguardando-voce').length
    : 4;

  return (
    <ShopContext.Provider value={shop}>
    <Box h="100dvh" display="flex" className={classes.shell}>
      <Stack gap={0} flex={1} miw={0}>
        <TopBar
          title={viewInfo.title}
          subtitle={viewInfo.subtitle}
          profile={profile}
          currentView={currentView}
          notifications={bellCount}
          onNavigate={navigate}
          onLogout={handleLogout}
          onOpenCartDrawer={() => setDrawerOpen(true)}
          cartCount={cartsClient ? clientCarts.length : carts.filter(isOpen).length}
          selectedClient={['catalog', 'order-grade', 'cart', 'carts'].includes(currentView) ? selectedClient : null}
        />
        <Box component="main" flex={1} className={classes.main}>
          {renderView()}
        </Box>
      </Stack>
      <CartDrawer opened={drawerOpen} onClose={() => setDrawerOpen(false)} onViewCarts={() => navigate('carts')} />
      <GradeSheet request={gradeRequest} onClose={() => setGradeRequest(null)} />
    </Box>
    </ShopContext.Provider>
  );
}
