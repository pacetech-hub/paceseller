import { useState, useEffect } from "react";
import {
  Group, Button, ActionIcon, Affix, Indicator, Text, Box, Stack, Paper, NavLink, Badge,
  Avatar, Kbd, Tooltip, Drawer, Image, ScrollArea, UnstyledButton, Divider, Burger, CloseButton, Popover,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  SquaresFourIcon,
  PackageIcon,
  ShoppingBagIcon,
  ClockIcon,
  SparkleIcon,
  GearIcon,
  UsersIcon,
  StorefrontIcon,
  CaretDownIcon,
  CaretRightIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ListIcon,
  BuildingsIcon,
  SignOutIcon,
  CaretLeftIcon,
  UserCheckIcon,
  TagIcon,
  ShieldIcon,
  WarehouseIcon,
  ReceiptIcon,
  FileTextIcon,
  CrosshairIcon,
  ShoppingCartIcon,
  XIcon,
  UserCircleIcon,
  HeadsetIcon,
  type Icon,
} from "@phosphor-icons/react";
import type { Client } from "../data/mockData";
import teslaLogo from "../../assets/tesla-footwear-logo.png";
import classes from "./Sidebar.module.css";
import { AppsGridMenu, type AppsGridItem } from "./AppsGridMenu";

export type View =
  | 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'carts' | 'history'
  | 'marketing' | 'sellout' | 'admin' | 'clients' | 'client-detail' | 'profile' | 'stock'
  | 'industry-stock' | 'permissions' | 'boletos' | 'order-detail' | 'ficha-tecnica' | 'sales-team' | 'radar' | 'support';

type Profile = 'admin' | 'rep' | 'lojista';

interface NavItem {
  id: View;
  label: string;
  icon: Icon;
  badge?: number;
}

// Perfil não é status: ícone sempre neutro (amarelo/verde ficam reservados para atenção/sucesso)
const profileLabels: Record<Profile, { label: string; icon: Icon; color: string }> = {
  admin: { label: 'Indústria Admin', icon: BuildingsIcon, color: 'currentColor' },
  rep: { label: 'Representante', icon: UsersIcon, color: 'currentColor' },
  lojista: { label: 'Lojista', icon: StorefrontIcon, color: 'currentColor' },
};

const BORDER_COLOR = 'var(--mantine-color-default-border)';

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
          { id: 'dashboard', label: 'Dashboard', icon: SquaresFourIcon },
          { id: 'clients', label: 'Selecionar Cliente', icon: StorefrontIcon },
        ];
      }
      return [
        { id: 'catalog', label: 'Catálogo', icon: PackageIcon },
        { id: 'order-grade', label: 'Novo Pedido', icon: ShoppingBagIcon },
      ];
    }
    if (profile === 'lojista') {
      return [
        { id: 'dashboard', label: 'Indicadores', icon: SquaresFourIcon },
        { id: 'catalog', label: 'Catálogo', icon: PackageIcon },
      ];
    }
    return [
      { id: 'catalog', label: 'Catálogo', icon: PackageIcon },
      { id: 'history', label: 'Pedidos', icon: ShoppingBagIcon },
      { id: 'clients', label: 'Clientes', icon: UsersIcon },
      { id: 'admin', label: 'Representantes', icon: UserCheckIcon },
      { id: 'admin', label: 'Política Comercial', icon: TagIcon },
    ];
  };

  const visibleItems = getVisibleItems();

  // No drawer mobile o menu sempre aparece expandido e ganha o X e o botão "Fechar Menu"
  const renderContent = (isCollapsed: boolean, inDrawer = false) => (
    <Stack gap={0} h="100%">
      {/* Logo */}
      {/* 55px + divisória de 1px = 56px, alinhado ao cabeçalho.
          No drawer, 60px para o X de 44px ter 8px de folga em volta */}
      <Group
        h={inDrawer ? 60 : 55}
        px="md"
        gap="sm"
        wrap="nowrap"
        justify={isCollapsed ? 'center' : inDrawer ? 'space-between' : 'flex-start'}
        flex="none"
      >
        <Image src={teslaLogo} alt="Tesla Footwear" h={isCollapsed ? 24 : 28} w="auto" fit="contain" />
        {inDrawer && <CloseButton onClick={() => setMobileOpen(false)} aria-label="Fechar" />}
      </Group>
      <Divider color={BORDER_COLOR} />

      {/* Profile pill */}
      {!isCollapsed && (
        <Paper withBorder mx="sm" mt="sm" px="sm" py="xs" bg="var(--mantine-color-default-hover)">
          <Group gap="xs" wrap="nowrap">
            <ProfileIcon size={16} color={profileInfo.color} />
            <Text size="sm" fw={600} truncate>{profileInfo.label}</Text>
          </Group>
        </Paper>
      )}

      {/* Selected client chip — rep only */}
      {!isCollapsed && profile === 'rep' && selectedClient && (
        <Paper withBorder mx="sm" mt="xs" px="sm" py="xs">
          <Text c="dimmed" size="sm">Pedindo para</Text>
          <Text fw={600} truncate mt={4}>{selectedClient.name}</Text>
        </Paper>
      )}

      {/* Search */}
      {!isCollapsed && (
        <UnstyledButton mx="sm" mt="sm">
          <Paper withBorder px="sm" mih={42} display="flex" style={{ alignItems: 'center' }}>
            <Group gap="xs" wrap="nowrap" c="dimmed" w="100%">
              <MagnifyingGlassIcon size={16} />
              <Text c="dimmed" truncate>Buscar por produto ou cliente</Text>
              <Kbd ml="auto">⌘K</Kbd>
            </Group>
          </Paper>
        </UnstyledButton>
      )}

      {/* Nav */}
      <ScrollArea component="nav" flex={1} px="xs" py="sm">
        <Stack gap={4} align={isCollapsed ? 'center' : 'stretch'}>
          {visibleItems.map(item => {
            const ItemIcon = item.icon;
            const active = currentView === item.id;
            const handleClick = () => { onNavigate(item.id); setMobileOpen(false); };

            if (isCollapsed) {
              return (
                <Tooltip key={item.label} label={item.label} position="right" withArrow>
                  <ActionIcon
                    onClick={handleClick}
                    variant={active ? 'light' : 'subtle'}
                    color={active ? 'neutral' : 'gray'}
                    aria-label={item.label}
                  >
                    <ItemIcon size={16} />
                  </ActionIcon>
                </Tooltip>
              );
            }

            return (
              <NavLink
                key={item.label}
                onClick={handleClick}
                active={active}
                color="neutral"
                variant="light"
                label={item.label}
                leftSection={<ItemIcon size={16} />}
                rightSection={item.badge ? <Badge variant="light" color="neutral">{item.badge}</Badge> : undefined}
                classNames={{ root: classes.navLink, label: classes.navLabel }}
                styles={{ label: { fontWeight: active ? 600 : 400 } }}
              />
            );
          })}
        </Stack>
      </ScrollArea>

      {/* Bottom */}
      <Divider color={BORDER_COLOR} />
      <Box p="xs" flex="none">
        {isCollapsed ? (
          <Group justify="center">
            <Tooltip label="Expandir Menu" position="right" withArrow>
              <ActionIcon onClick={() => setCollapsed(false)} variant="subtle" color="gray" aria-label="Expandir Menu">
                <CaretRightIcon size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        ) : (
          <>
          {/* Recolher fica embaixo, no mesmo lugar do "Expandir menu" do modo recolhido
              (no topo não cabe ícone + texto ao lado do logo) */}
          <Button
            onClick={() => setCollapsed(true)}
            variant="subtle"
            color="gray"
            fullWidth
            justify="flex-start"
            px="sm"
            visibleFrom="lg"
            leftSection={<CaretLeftIcon size={16} />}
          >
            Recolher Menu
          </Button>
          {/* No drawer, fechar fica no mesmo lugar do "Recolher Menu" (além do X e do clique fora) */}
          {inDrawer && (
            <Button
              onClick={() => setMobileOpen(false)}
              variant="subtle"
              color="gray"
              fullWidth
              justify="flex-start"
              px="sm"
              leftSection={<XIcon size={16} />}
            >
              Fechar Menu
            </Button>
          )}
          <Group gap="xs" px="sm" py="xs" wrap="nowrap">
            <Avatar size={32} color="neutral" variant="light">
              TF
            </Avatar>
            <Box flex={1} miw={0}>
              <Text size="sm" fw={600} truncate>Tesla Footwear</Text>
              <Text size="sm" c="dimmed" truncate>admin@tesla.com.br</Text>
            </Box>
            <Button
              onClick={onLogout}
              variant="subtle"
              color="red"
              px="sm"
              flex="none"
              leftSection={<SignOutIcon size={16} />}
              aria-label="Sair da conta"
            >
              Sair
            </Button>
          </Group>
          </>
        )}
      </Box>
    </Stack>
  );

  return (
    <>
      <Affix position={{ top: 16, left: 16 }} zIndex={50} hiddenFrom="lg">
        <ActionIcon
          onClick={() => setMobileOpen(true)}
          variant="default"
          aria-label="Abrir Menu"
        >
          <ListIcon size={16} />
        </ActionIcon>
      </Affix>

      <Drawer
        opened={mobileOpen}
        onClose={() => setMobileOpen(false)}
        hiddenFrom="lg"
        size={256}
        padding={0}
        // Cabeçalho próprio (logo + X); fecha também com clique fora e Esc (padrão do tema)
        withCloseButton={false}
        styles={{ body: { height: '100%' } }}
      >
        {renderContent(false, true)}
      </Drawer>

      <Box
        component="aside"
        visibleFrom="lg"
        h="100%"
        w={collapsed ? 60 : 260}
        bg="var(--mantine-color-body)"
        flex="none"
        className={classes.aside}
      >
        {renderContent(collapsed)}
      </Box>
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
  /** Mostra o carrinho: só no Catálogo e nas páginas do processo de compra. */
  showCart?: boolean;
  selectedClient?: Client | null;
  /** Abre a gaveta do carrinho (FR-401); sem ela, o ícone leva à lista de carrinhos. */
  onOpenCartDrawer?: () => void;
}

export function TopBar({ title, subtitle, profile, currentView, notifications = 4, actions, onNavigate, onLogout, cartCount = 0, showCart = false, selectedClient, onOpenCartDrawer }: TopBarProps) {
  const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure(false);
  const profileInfo = profileLabels[profile];
  const ProfileIcon = profileInfo.icon;

  // Menu único: todas as páginas do perfil
  const menuItems: AppsGridItem<View>[] =
    profile === 'admin'
      ? [
          { icon: CrosshairIcon, label: 'Radar', view: 'radar' },
          { icon: UsersIcon, label: 'Clientes', view: 'clients' },
          { icon: PackageIcon, label: 'Catálogo', view: 'catalog' },
          { icon: ClockIcon, label: 'Pedidos', view: 'history' },
          { icon: ReceiptIcon, label: 'Pagamentos e Boletos', view: 'boletos' },
          { icon: FileTextIcon, label: 'Ficha Técnica', view: 'ficha-tecnica' },
          { icon: SparkleIcon, label: 'Marketing IA', view: 'marketing' },
          { icon: ShieldIcon, label: 'Administração', view: 'admin' },
          { icon: HeadsetIcon, label: 'Suporte', view: 'support' },
          { icon: UserCircleIcon, label: 'Meu Perfil', view: 'profile' },
        ]
      : profile === 'rep'
      ? [
          { icon: CrosshairIcon, label: 'Radar', view: 'radar' },
          { icon: StorefrontIcon, label: 'Clientes', view: 'clients' },
          { icon: PackageIcon, label: 'Catálogo', view: 'catalog' },
          { icon: ClockIcon, label: 'Pedidos', view: 'history' },
          { icon: WarehouseIcon, label: 'Estoque', view: 'industry-stock' },
          { icon: FileTextIcon, label: 'Ficha Técnica', view: 'ficha-tecnica' },
          { icon: SparkleIcon, label: 'Marketing IA', view: 'marketing' },
          { icon: ShieldIcon, label: 'Permissões', view: 'permissions' },
          { icon: HeadsetIcon, label: 'Suporte', view: 'support' },
          { icon: UserCircleIcon, label: 'Meu Perfil', view: 'profile' },
        ]
      : [
          { icon: CrosshairIcon, label: 'Radar', view: 'radar' },
          { icon: PackageIcon, label: 'Catálogo', view: 'catalog' },
          { icon: ShoppingBagIcon, label: 'Pedidos', view: 'history' },
          { icon: WarehouseIcon, label: 'Meu Estoque', view: 'stock' },
          { icon: ReceiptIcon, label: 'Pagamentos e Boletos', view: 'boletos' },
          { icon: FileTextIcon, label: 'Ficha Técnica', view: 'ficha-tecnica' },
          { icon: SparkleIcon, label: 'Marketing IA', view: 'marketing' },
          { icon: ShieldIcon, label: 'Permissões', view: 'permissions' },
          { icon: HeadsetIcon, label: 'Suporte', view: 'support' },
          { icon: UserCircleIcon, label: 'Meu Perfil', view: 'profile' },
        ];

  const [appsOpened, setAppsOpened] = useState(false);
  const selectPage = (view: View) => {
    onNavigate(view);
    setAppsOpened(false);
    closeNav();
  };
  const logout = () => {
    setAppsOpened(false);
    closeNav();
    onLogout();
  };

  return (
    <Box
      component="header"
      h={56}
      px={{ base: 'sm', sm: 'lg' }}
      flex="none"
      bg="color-mix(in srgb, var(--mantine-color-body) 80%, transparent)"
      className={classes.header}
    >
      <Group h="100%" gap="xs" wrap="nowrap">
        <Group flex={1} miw={0} gap="xs" wrap="nowrap">
          {/* Abaixo do breakpoint sm todas as páginas ficam no Drawer do Burger */}
          {menuItems.length > 0 && (
            <Burger
              opened={navOpened}
              onClick={toggleNav}
              hiddenFrom="sm"
              aria-label="Abrir Navegação"
            />
          )}
          <Group pr="sm" mr={4} h={32} flex="none" wrap="nowrap" className={classes.headerLogo}>
            <Image src={teslaLogo} alt="Tesla Footwear" h={{ base: 20, sm: 24 }} w="auto" fit="contain" />
          </Group>
          {/* Título da página; a navegação fica toda no menu (sem acessos duplicados no topo) */}
          <Box miw={0}>
            <Text truncate fw={600}>{title}</Text>
            {subtitle && <Text truncate c="dimmed" size="sm" visibleFrom="sm">{subtitle}</Text>}
          </Box>
        </Group>

        <Group gap="sm" wrap="nowrap" flex="none">
          {actions}

          {/* Carrinho só no Catálogo e no processo de compra (carrinho, carrinhos e grade).
              FR-401: o ícone abre a gaveta do carrinho e mostra quantos carrinhos estão abertos.
              Ícone + texto em telas largas; abaixo disso, só ícone com tooltip */}
          {showCart && (
            <>
            <Indicator label={cartCount} disabled={cartCount === 0} size={16} color="neutral" offset={4} className={classes.wideOnly}>
              <Button onClick={() => (onOpenCartDrawer ? onOpenCartDrawer() : onNavigate('carts'))} variant="subtle" color="neutral" px="sm" leftSection={<ShoppingCartIcon size={16} />} aria-label={`Carrinho · ${cartCount} abertos`}>
                Carrinho
              </Button>
            </Indicator>
            <Indicator label={cartCount} disabled={cartCount === 0} size={16} color="neutral" offset={4} className={classes.narrowOnly}>
              <Tooltip label="Ver Carrinho" withArrow>
                <ActionIcon onClick={() => (onOpenCartDrawer ? onOpenCartDrawer() : onNavigate('carts'))} variant="subtle" color="neutral" aria-label={`Ver Carrinho · ${cartCount} abertos`}>
                  <ShoppingCartIcon size={16} />
                </ActionIcon>
              </Tooltip>
            </Indicator>
            </>
          )}

          {/* Notifications: ícone + texto em telas largas, só ícone abaixo */}
          <Indicator label={notifications} disabled={notifications === 0} size={16} color="red" offset={4} className={classes.wideOnly}>
            <Button variant="subtle" color="neutral" px="sm" leftSection={<BellIcon size={16} />}>
              Notificações
            </Button>
          </Indicator>
          <Indicator label={notifications} disabled={notifications === 0} size={16} color="red" offset={4} className={classes.narrowOnly}>
            <Tooltip label="Ver Notificações" withArrow>
              <ActionIcon variant="subtle" color="neutral" aria-label="Ver Notificações">
                <BellIcon size={16} />
              </ActionIcon>
            </Tooltip>
          </Indicator>

          {/* Client chip — before avatar */}
          {selectedClient && (
            <>
              <Button
                onClick={() => onNavigate('history')}
                variant="default"
                color="neutral"
                maw={{ sm: 180, lg: 260 }}
                visibleFrom="sm"
                leftSection={<StorefrontIcon size={16} />}
                aria-label={`Ver Histórico de Pedidos de ${selectedClient.name}`}
                styles={{ label: { overflow: 'hidden' } }}
              >
                {/* O que o botão faz fica visível (antes estava só num title) */}
                <Stack gap={0} miw={0} align="flex-start">
                  <Text span size="sm" c="dimmed" lh={1.2}>Ver pedidos de</Text>
                  <Text span fw={600} lh={1.2} truncate maw="100%">{selectedClient.name}</Text>
                </Stack>
              </Button>
              <Tooltip label="Ver Histórico de Pedidos" withArrow>
                <ActionIcon
                  onClick={() => onNavigate('history')}
                  hiddenFrom="sm"
                  variant="default"
                  color="neutral"
                  aria-label={`Ver Histórico de Pedidos de ${selectedClient.name}`}
                >
                  <StorefrontIcon size={16} />
                </ActionIcon>
              </Tooltip>
            </>
          )}

          {/* Menu único com todas as páginas (a partir de sm; no celular o Burger abre o mesmo menu) */}
          <Popover
            opened={appsOpened}
            onChange={setAppsOpened}
            position="bottom-end"
            offset={8}
            shadow="md"
            width={360}
            withinPortal
          >
            <Popover.Target>
              <ActionIcon
                onClick={() => setAppsOpened(o => !o)}
                visibleFrom="sm"
                variant="light"
                color="neutral"
                aria-label="Abrir Menu"
                aria-expanded={appsOpened}
                className={classes.avatarButton}
              >
                <ProfileIcon size={16} color={profileInfo.color} />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown p={0} bd={0} bg="transparent">
              <AppsGridMenu
                title={profileInfo.label}
                items={menuItems}
                currentView={currentView}
                onSelect={selectPage}
                onLogout={logout}
              />
            </Popover.Dropdown>
          </Popover>
        </Group>
      </Group>

      <Drawer
        opened={navOpened}
        onClose={closeNav}
        hiddenFrom="sm"
        size={340}
        title={<Image src={teslaLogo} alt="Tesla Footwear" h={24} w="auto" fit="contain" />}
      >
        <Stack gap="sm">
          <AppsGridMenu
            title={profileInfo.label}
            items={menuItems}
            currentView={currentView}
            onSelect={selectPage}
            onLogout={logout}
          />
          {/* Terceira forma de fechar, além do X e do clique fora */}
          <Button onClick={closeNav} variant="default" fullWidth leftSection={<XIcon size={16} />}>
            Fechar Menu
          </Button>
        </Stack>
      </Drawer>
    </Box>
  );
}
