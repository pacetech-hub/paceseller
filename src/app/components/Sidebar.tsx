import { useState, useEffect } from "react";
import {
  Group, Button, ActionIcon, Affix, Indicator, Menu, Text, Box, Stack, Paper, NavLink, Badge,
  Avatar, Kbd, Tooltip, Drawer, Image, ScrollArea, UnstyledButton, Divider, Burger,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  SquaresFourIcon,
  PackageIcon,
  ShoppingBagIcon,
  BasketIcon,
  ClockIcon,
  SparkleIcon,
  ChartBarIcon,
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
  FunnelIcon,
  type Icon,
} from "@phosphor-icons/react";
import type { Client } from "../data/mockData";
import teslaLogo from "../../assets/tesla-footwear-logo.png";
import classes from "./Sidebar.module.css";

export type View =
  | 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'carts' | 'history'
  | 'marketing' | 'sellout' | 'admin' | 'clients' | 'client-detail' | 'profile' | 'stock'
  | 'industry-stock' | 'permissions' | 'boletos' | 'order-detail' | 'ficha-tecnica' | 'sales-team';

type Profile = 'admin' | 'rep' | 'lojista';

interface NavItem {
  id: View;
  label: string;
  icon: Icon;
  badge?: number;
}

const profileLabels: Record<Profile, { label: string; icon: Icon; color: string }> = {
  admin: { label: 'Indústria Admin', icon: BuildingsIcon, color: 'var(--mantine-color-black)' },
  rep: { label: 'Representante', icon: UsersIcon, color: 'var(--mantine-color-yellow-5)' },
  lojista: { label: 'Lojista', icon: StorefrontIcon, color: 'var(--mantine-color-teal-4)' },
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

  // No drawer mobile o menu sempre aparece expandido
  const renderContent = (isCollapsed: boolean) => (
    <Stack gap={0} h="100%">
      {/* Logo */}
      {/* 55px + divisória de 1px = 56px, alinhado ao cabeçalho */}
      <Group
        h={55}
        px="md"
        gap="sm"
        wrap="nowrap"
        justify={isCollapsed ? 'center' : 'flex-start'}
        flex="none"
      >
        <Image src={teslaLogo} alt="Tesla Footwear" h={isCollapsed ? 24 : 28} w="auto" fit="contain" />
        {!isCollapsed && (
          <ActionIcon
            onClick={() => setCollapsed(true)}
            variant="subtle"
            color="gray"
            size="sm"
            ml="auto"
            visibleFrom="lg"
            title="Recolher menu"
          >
            <CaretLeftIcon size={16} />
          </ActionIcon>
        )}
      </Group>
      <Divider color={BORDER_COLOR} />

      {/* Profile pill */}
      {!isCollapsed && (
        <Paper withBorder radius="md" mx="sm" mt="sm" px="sm" py={8} bg="var(--mantine-color-default-hover)">
          <Group gap={8} wrap="nowrap">
            <ProfileIcon size={14} color={profileInfo.color} />
            <Text size="0.78rem" fw={500} truncate>{profileInfo.label}</Text>
          </Group>
        </Paper>
      )}

      {/* Selected client chip — rep only */}
      {!isCollapsed && profile === 'rep' && selectedClient && (
        <Paper withBorder radius="md" mx="sm" mt={8} px="sm" py={8}>
          <Text c="dimmed" size="0.62rem" fw={500} tt="uppercase" lts="0.06em">Pedindo para</Text>
          <Text size="0.82rem" fw={600} truncate mt={2}>{selectedClient.name}</Text>
        </Paper>
      )}

      {/* Search */}
      {!isCollapsed && (
        <UnstyledButton mx="sm" mt="sm">
          <Paper withBorder radius="md" px="sm" py={8}>
            <Group gap={8} wrap="nowrap" c="dimmed">
              <MagnifyingGlassIcon size={14} />
              <Text size="0.78rem" c="dimmed">Buscar...</Text>
              <Kbd size="xs" ml="auto">⌘K</Kbd>
            </Group>
          </Paper>
        </UnstyledButton>
      )}

      {/* Nav */}
      <ScrollArea component="nav" flex={1} px={8} py="sm">
        <Stack gap={2} align={isCollapsed ? 'center' : 'stretch'}>
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
                    size={36}
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
                rightSection={item.badge ? <Badge size="xs" variant="light" color="neutral" circle>{item.badge}</Badge> : undefined}
                styles={{
                  root: { borderRadius: 'var(--mantine-radius-sm)' },
                  label: { fontSize: '0.83rem', fontWeight: active ? 600 : 400 },
                }}
              />
            );
          })}
        </Stack>
      </ScrollArea>

      {/* Bottom */}
      <Divider color={BORDER_COLOR} />
      <Box p={8} flex="none">
        {isCollapsed ? (
          <Group justify="center">
            <ActionIcon onClick={() => setCollapsed(false)} variant="subtle" color="gray" size={36} title="Expandir menu">
              <CaretRightIcon size={16} />
            </ActionIcon>
          </Group>
        ) : (
          <Group gap={8} px="sm" py={8} wrap="nowrap">
            <Avatar size={28} radius="xl" color="neutral" variant="light" styles={{ placeholder: { fontSize: '0.65rem', fontWeight: 700 } }}>
              TF
            </Avatar>
            <Box flex={1} miw={0}>
              <Text size="0.78rem" fw={500} truncate>Tesla Footwear</Text>
              <Text size="0.7rem" c="dimmed" truncate>admin@tesla.com.br</Text>
            </Box>
            <ActionIcon onClick={onLogout} variant="subtle" color="red" size="sm" title="Sair">
              <SignOutIcon size={14} />
            </ActionIcon>
          </Group>
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
          size="lg"
          aria-label="Abrir menu"
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
        withCloseButton={false}
        styles={{ body: { height: '100%' } }}
      >
        {renderContent(false)}
      </Drawer>

      <Box
        component="aside"
        visibleFrom="lg"
        h="100%"
        w={collapsed ? 52 : 260}
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
  selectedClient?: Client | null;
  /** Quando informado (catálogo), mostra o botão que abre o Drawer de filtros abaixo do breakpoint lg */
  onOpenFilters?: () => void;
}

export function TopBar({ title, subtitle, profile, currentView, notifications = 4, actions, onNavigate, onLogout, cartCount = 0, selectedClient, onOpenFilters }: TopBarProps) {
  const [navOpened, { toggle: toggleNav, close: closeNav }] = useDisclosure(false);
  const profileInfo = profileLabels[profile];
  const ProfileIcon = profileInfo.icon;

  type DropdownItem = { label: string; icon: Icon; view?: View; action?: () => void };
  type HeaderItem = { label: string; icon: Icon; view: View };

  const headerItems: HeaderItem[] =
    profile === 'admin'
      ? [
          { icon: ChartBarIcon, label: 'Indicadores', view: 'dashboard' as View },
          { icon: UsersIcon, label: 'Clientes', view: 'clients' as View },
          { icon: PackageIcon, label: 'Catálogo', view: 'catalog' as View },
          { icon: SparkleIcon, label: 'Marketing IA', view: 'marketing' as View },
          { icon: ShieldIcon, label: 'Administração', view: 'admin' as View },
        ]
      : profile === 'rep'
      ? [
          { icon: ChartBarIcon, label: 'Indicadores', view: 'dashboard' as View },
          { icon: StorefrontIcon, label: 'Clientes', view: 'clients' as View },
          { icon: PackageIcon, label: 'Catálogo', view: 'catalog' as View },
          { icon: WarehouseIcon, label: 'Estoque', view: 'industry-stock' as View },
          { icon: SparkleIcon, label: 'Marketing IA', view: 'marketing' as View },
          { icon: ShieldIcon, label: 'Permissões', view: 'permissions' as View },
        ]
      : [
          { icon: ChartBarIcon, label: 'Indicadores', view: 'dashboard' },
          { icon: PackageIcon, label: 'Catálogo', view: 'catalog' },
          { icon: WarehouseIcon, label: 'Meu Estoque', view: 'stock' },
          { icon: SparkleIcon, label: 'Marketing IA', view: 'marketing' },
          { icon: ShieldIcon, label: 'Permissões', view: 'permissions' },
        ];

  const dropdownItems: DropdownItem[] =
    profile === 'admin'
      ? [
          { icon: ClockIcon, label: 'Pedidos', view: 'history' },
          { icon: ReceiptIcon, label: 'Pagamentos e Boletos', view: 'boletos' },
          { icon: FileTextIcon, label: 'Ficha Técnica', view: 'ficha-tecnica' },
          { icon: UsersIcon, label: 'Meu Perfil', view: 'profile' },
          { icon: SignOutIcon, label: 'Sair', action: onLogout },
        ]
      : profile === 'rep'
      ? [
          { icon: ClockIcon, label: 'Pedidos', view: 'history' },
          { icon: FileTextIcon, label: 'Ficha Técnica', view: 'ficha-tecnica' },
          { icon: UsersIcon, label: 'Meu Perfil', view: 'profile' },
          { icon: SignOutIcon, label: 'Sair', action: onLogout },
        ]
      : [
          { icon: ShoppingBagIcon, label: 'Pedidos', view: 'history' },
          { icon: ReceiptIcon, label: 'Pagamentos e Boletos', view: 'boletos' },
          { icon: FileTextIcon, label: 'Ficha Técnica', view: 'ficha-tecnica' },
          { icon: UsersIcon, label: 'Meu Perfil', view: 'profile' },
          { icon: SignOutIcon, label: 'Sair', action: onLogout },
        ];

  const handleDropdownItem = (item: DropdownItem) => {
    if (item.action) { item.action(); return; }
    if (item.view) onNavigate(item.view);
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
          {/* Abaixo do breakpoint sm a navegação principal vai para o Drawer do Burger */}
          {headerItems.length > 0 && (
            <Burger
              opened={navOpened}
              onClick={toggleNav}
              hiddenFrom="sm"
              size="sm"
              aria-label="Abrir navegação"
            />
          )}
          {onOpenFilters && (
            <ActionIcon
              onClick={onOpenFilters}
              hiddenFrom="lg"
              variant="default"
              size="lg"
              aria-label="Abrir filtros"
              title="Filtros"
            >
              <FunnelIcon size={16} />
            </ActionIcon>
          )}
          {currentView !== 'catalog' && (
            <Group pr="sm" mr={4} h={32} flex="none" wrap="nowrap" className={classes.headerLogo}>
              <Image src={teslaLogo} alt="Tesla Footwear" h={{ base: 20, sm: 24 }} w="auto" fit="contain" />
            </Group>
          )}
          {/* Nav items à esquerda quando existem, caso contrário título */}
          {headerItems.length > 0 ? (
            <Group gap={4} wrap="nowrap" visibleFrom="sm">
              {headerItems.map(item => {
                const Icon = item.icon;
                const active = currentView === item.view;
                return (
                  <Button
                    key={item.label}
                    onClick={() => onNavigate(item.view)}
                    variant={active ? 'light' : 'subtle'}
                    color="neutral"
                    size="sm"
                    leftSection={<Icon size={14} />}
                    title={item.label}
                    styles={{ label: { fontWeight: active ? 600 : 500 } }}
                  >
                    <Text span visibleFrom="md" inherit>{item.label}</Text>
                  </Button>
                );
              })}
            </Group>
          ) : (
            <Box miw={0}>
              <Text truncate fw={600} size="0.95rem" lts="-0.01em">{title}</Text>
              {subtitle && <Text truncate c="dimmed" size="0.75rem" visibleFrom="sm">{subtitle}</Text>}
            </Box>
          )}
        </Group>

        <Group gap={4} wrap="nowrap" flex="none">
          {actions}

          {/* Cart(s) — todos os perfis usam multi-carrinhos */}
          <Indicator label={cartCount} disabled={cartCount === 0} size={16} color="neutral" offset={4}>
            <ActionIcon onClick={() => onNavigate('carts')} variant="subtle" color="neutral" size="lg" title="Carrinhos">
              <BasketIcon size={16} />
            </ActionIcon>
          </Indicator>

          {/* Notifications */}
          <Indicator disabled={notifications === 0} size={8} color="neutral" offset={6}>
            <ActionIcon variant="subtle" color="neutral" size="lg" title="Notificações">
              <BellIcon size={16} />
            </ActionIcon>
          </Indicator>

          {/* Client chip — before avatar */}
          {selectedClient && (
            <>
              <Button
                onClick={() => onNavigate('history')}
                variant="default"
                color="neutral"
                size="sm"
                maw={{ sm: 180, lg: 260 }}
                visibleFrom="sm"
                leftSection={<StorefrontIcon size={14} />}
                title="Ver histórico de pedidos deste cliente"
                styles={{ label: { overflow: 'hidden', textOverflow: 'ellipsis' } }}
              >
                {selectedClient.name}
              </Button>
              <ActionIcon
                onClick={() => onNavigate('history')}
                hiddenFrom="sm"
                variant="default"
                color="neutral"
                size="lg"
                aria-label={`Ver histórico de pedidos de ${selectedClient.name}`}
                title={selectedClient.name}
              >
                <StorefrontIcon size={16} />
              </ActionIcon>
            </>
          )}

          {/* Avatar + dropdown */}
          <Menu position="bottom-end" offset={8} shadow="md" width={192}>
            <Menu.Target>
              <ActionIcon
                variant="light"
                color="neutral"
                radius="xl"
                size={32}
                ml={4}
                className={classes.avatarButton}
              >
                <ProfileIcon size={14} color={profileInfo.color} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{profileInfo.label}</Menu.Label>
              {dropdownItems.map(item => {
                const Icon = item.icon;
                return (
                  <Menu.Item
                    key={item.label}
                    leftSection={<Icon size={14} />}
                    color={item.label === 'Sair' ? 'red' : undefined}
                    onClick={() => handleDropdownItem(item)}
                  >
                    {item.label}
                  </Menu.Item>
                );
              })}
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Group>

      <Drawer
        opened={navOpened}
        onClose={closeNav}
        hiddenFrom="sm"
        size={280}
        title={<Image src={teslaLogo} alt="Tesla Footwear" h={24} w="auto" fit="contain" />}
      >
        <Stack gap={2}>
          {headerItems.map(item => {
            const Icon = item.icon;
            const active = currentView === item.view;
            return (
              <NavLink
                key={item.label}
                component="button"
                onClick={() => { onNavigate(item.view); closeNav(); }}
                active={active}
                color="neutral"
                variant="light"
                label={item.label}
                leftSection={<Icon size={16} />}
                styles={{
                  root: { borderRadius: 'var(--mantine-radius-sm)' },
                  label: { fontSize: '0.88rem', fontWeight: active ? 600 : 400 },
                }}
              />
            );
          })}
        </Stack>
      </Drawer>
    </Box>
  );
}
