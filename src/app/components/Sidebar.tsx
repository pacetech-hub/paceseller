import { useState, useEffect } from "react";
import { Group, Button, ActionIcon, Indicator, Menu, Text, Box, Flex, Stack, UnstyledButton, Badge, Kbd } from "@mantine/core";
import {
  LayoutDashboard, Package2, ShoppingBag, ShoppingBasket, Clock,
  Sparkles, BarChart3, Settings, Users, Store, ChevronDown, ChevronRight,
  Bell, Search, Menu as MenuIcon, X, Building2, LogOut, ChevronLeft,
  UserCheck, Tag, Shield, Boxes, Receipt, FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
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
  icon: LucideIcon;
  badge?: number;
}

const profileLabels: Record<Profile, { label: string; icon: LucideIcon; color: string }> = {
  admin: { label: 'Indústria Admin', icon: Building2, color: 'var(--mantine-color-black)' },
  rep: { label: 'Representante', icon: Users, color: 'var(--mantine-color-yellow-7)' },
  lojista: { label: 'Lojista', icon: Store, color: 'var(--mantine-color-teal-7)' },
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
    <Flex direction="column" h="100%">
      {/* Logo */}
      <Group
        wrap="nowrap"
        gap={collapsed ? 0 : 'sm'}
        justify={collapsed ? 'center' : undefined}
        px="md"
        h={56}
        style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}
      >
        <Flex align="center" justify="center" w={collapsed ? 28 : undefined} h={collapsed ? 28 : 32} style={{ flexShrink: 0 }}>
          <img src={teslaLogo} alt="Tesla Footwear" style={{ height: collapsed ? 24 : 28, width: 'auto', objectFit: 'contain' }} />
        </Flex>
        {!collapsed && (
          <UnstyledButton onClick={() => setCollapsed(true)} className={classes.iconButton} ml="auto">
            <ChevronLeft size={16} />
          </UnstyledButton>
        )}
      </Group>

      {/* Profile pill */}
      {!collapsed && (
        <Box mx="sm" mt="sm" px="sm" py={8} bg="gray.1" style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-gray-3)' }}>
          <Group gap={8} wrap="nowrap">
            <ProfileIcon size={14} color={profileInfo.color} />
            <Text component="span" truncate fz="0.78rem" fw={500}>{profileInfo.label}</Text>
          </Group>
        </Box>
      )}

      {/* Selected client chip — rep only */}
      {!collapsed && profile === 'rep' && selectedClient && (
        <Box mx="sm" mt={8} px="sm" py={8} bg="gray.0" style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-gray-3)' }}>
          <Text c="dimmed" fz="0.62rem" fw={500} tt="uppercase" lts="0.06em">Pedindo para</Text>
          <Text c="gray.9" truncate mt={2} fz="0.82rem" fw={600}>{selectedClient.name}</Text>
        </Box>
      )}

      {/* Search */}
      {!collapsed && (
        <Box mx="sm" mt="sm">
          <Group gap={8} wrap="nowrap" px="sm" py={8} c="dimmed" bg="gray.0" style={{ borderRadius: 'var(--mantine-radius-md)', border: '1px solid var(--mantine-color-gray-3)' }}>
            <Search size={14} style={{ flexShrink: 0 }} />
            <Text component="span" fz="0.78rem">Buscar...</Text>
            <Kbd ml="auto" c="gray.5" fz="0.6rem" px={4} py={0} bg="transparent" style={{ borderRadius: 'var(--mantine-radius-sm)', borderBottomWidth: 1 }}>⌘K</Kbd>
          </Group>
        </Box>
      )}

      {/* Nav */}
      <Stack component="nav" gap={2} flex={1} px={8} py="sm" style={{ overflowY: 'auto' }}>
        {visibleItems.map(item => {
          const Icon = item.icon;
          const active = currentView === item.id;
          return (
            <UnstyledButton
              key={item.label}
              onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
              className={classes.navItem}
              data-active={active || undefined}
              data-collapsed={collapsed || undefined}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {!collapsed && (
                <>
                  <Text component="span" flex={1} ta="left" truncate fz="0.83rem" fw={active ? 600 : 400}>
                    {item.label}
                  </Text>
                  {item.badge && (
                    <Badge size="sm" radius="xl" variant="light" tt="none" fz="0.65rem" fw={600}>
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </UnstyledButton>
          );
        })}
      </Stack>

      {/* Bottom */}
      <Stack gap={4} p={8} style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
        {!collapsed && (
          <Group gap={8} wrap="nowrap" px="sm" py={8}>
            <Flex w={28} h={28} align="center" justify="center" bg="gray.2" style={{ borderRadius: '50%', flexShrink: 0 }}>
              <Text component="span" c="gray.9" fz="0.65rem" fw={700}>TF</Text>
            </Flex>
            <Box flex={1} miw={0}>
              <Text truncate fz="0.78rem" fw={500}>Tesla Footwear</Text>
              <Text truncate c="dimmed" fz="0.7rem">admin@tesla.com.br</Text>
            </Box>
            <UnstyledButton onClick={onLogout} className={classes.logoutButton} title="Sair">
              <LogOut size={14} />
            </UnstyledButton>
          </Group>
        )}
        {collapsed && (
          <UnstyledButton onClick={() => setCollapsed(false)} className={classes.expandButton}>
            <ChevronRight size={16} />
          </UnstyledButton>
        )}
      </Stack>
    </Flex>
  );

  return (
    <>
      <ActionIcon
        onClick={() => setMobileOpen(true)}
        hiddenFrom="lg"
        variant="default"
        size={34}
        radius="md"
        pos="fixed"
        top={16}
        left={16}
        style={{ zIndex: 50 }}
      >
        <MenuIcon size={16} />
      </ActionIcon>

      {mobileOpen && (
        <Flex hiddenFrom="lg" pos="fixed" inset={0} style={{ zIndex: 50 }}>
          <Box pos="absolute" inset={0} bg="rgba(0, 0, 0, 0.6)" onClick={() => setMobileOpen(false)} />
          <Box pos="relative" w={256} h="100%" bg="white" style={{ borderRight: '1px solid var(--mantine-color-gray-3)' }}>
            <UnstyledButton onClick={() => setMobileOpen(false)} className={classes.iconButton} pos="absolute" top={12} right={12}>
              <X size={16} />
            </UnstyledButton>
            <SidebarContent />
          </Box>
        </Flex>
      )}

      <Box component="aside" visibleFrom="lg" className={classes.aside} data-collapsed={collapsed || undefined}>
        <SidebarContent />
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
}

export function TopBar({ title, subtitle, profile, currentView, notifications = 4, actions, onNavigate, onLogout, cartCount = 0, selectedClient }: TopBarProps) {
  const profileInfo = profileLabels[profile];
  const ProfileIcon = profileInfo.icon;

  type DropdownItem = { label: string; icon: LucideIcon; view?: View; action?: () => void };
  type HeaderItem = { label: string; icon: LucideIcon; view: View };

  const headerItems: HeaderItem[] =
    profile === 'admin'
      ? [
          { icon: BarChart3, label: 'Indicadores', view: 'dashboard' as View },
          { icon: Users, label: 'Clientes', view: 'clients' as View },
          { icon: Package2, label: 'Catálogo', view: 'catalog' as View },
          { icon: Sparkles, label: 'Marketing IA', view: 'marketing' as View },
          { icon: Shield, label: 'Administração', view: 'admin' as View },
        ]
      : profile === 'rep'
      ? [
          { icon: BarChart3, label: 'Indicadores', view: 'dashboard' as View },
          { icon: Store, label: 'Clientes', view: 'clients' as View },
          { icon: Package2, label: 'Catálogo', view: 'catalog' as View },
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
          { icon: FileText, label: 'Ficha Técnica', view: 'ficha-tecnica' },
          { icon: Users, label: 'Meu Perfil', view: 'profile' },
          { icon: LogOut, label: 'Sair', action: onLogout },
        ]
      : profile === 'rep'
      ? [
          { icon: Clock, label: 'Pedidos', view: 'history' },
          { icon: FileText, label: 'Ficha Técnica', view: 'ficha-tecnica' },
          { icon: Users, label: 'Meu Perfil', view: 'profile' },
          { icon: LogOut, label: 'Sair', action: onLogout },
        ]
      : [
          { icon: ShoppingBag, label: 'Pedidos', view: 'history' },
          { icon: Receipt, label: 'Pagamentos e Boletos', view: 'boletos' },
          { icon: FileText, label: 'Ficha Técnica', view: 'ficha-tecnica' },
          { icon: Users, label: 'Meu Perfil', view: 'profile' },
          { icon: LogOut, label: 'Sair', action: onLogout },
        ];

  const handleDropdownItem = (item: DropdownItem) => {
    if (item.action) { item.action(); return; }
    if (item.view) onNavigate(item.view);
  };

  return (
    <Box component="header" className={classes.topBar} h={56} px="lg" style={{ flexShrink: 0 }}>
      <Group h="100%" gap="sm" wrap="nowrap">
        <Group style={{ flex: 1, minWidth: 0 }} gap="sm" wrap="nowrap">
          {currentView !== 'catalog' && (
            <Box pr="sm" mr={4} h={32} style={{ display: 'flex', alignItems: 'center', flexShrink: 0, borderRight: '1px solid var(--mantine-color-gray-3)' }}>
              <img src={teslaLogo} alt="Tesla Footwear" style={{ height: 24, width: 'auto', objectFit: 'contain' }} />
            </Box>
          )}
          {/* Nav items à esquerda quando existem, caso contrário título */}
          {headerItems.length > 0 ? (
            <Group gap={4} wrap="nowrap">
              {headerItems.map(item => {
                const Icon = item.icon;
                const active = currentView === item.view;
                return (
                  <Button
                    key={item.label}
                    onClick={() => onNavigate(item.view)}
                    variant={active ? 'light' : 'subtle'}
                   
                    size="sm"
                    leftSection={<Icon size={14} />}
                    title={item.label}
                    styles={{ label: { fontWeight: active ? 600 : 500 } }}
                  >
                    <Box component="span" visibleFrom="md">{item.label}</Box>
                  </Button>
                );
              })}
            </Group>
          ) : (
            <Box style={{ minWidth: 0 }}>
              <Text truncate fw={600} size="0.95rem" style={{ letterSpacing: '-0.01em' }}>{title}</Text>
              {subtitle && <Text truncate c="dimmed" size="0.75rem" visibleFrom="sm">{subtitle}</Text>}
            </Box>
          )}
        </Group>

        <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
          {actions}

          {/* Cart(s) — todos os perfis usam multi-carrinhos */}
          <Indicator label={cartCount} disabled={cartCount === 0} size={16} offset={4}>
            <ActionIcon onClick={() => onNavigate('carts')} variant="subtle" size="lg" title="Carrinhos">
              <ShoppingBasket size={16} />
            </ActionIcon>
          </Indicator>

          {/* Notifications */}
          <Indicator disabled={notifications === 0} size={8} offset={6}>
            <ActionIcon variant="subtle" size="lg" title="Notificações">
              <Bell size={16} />
            </ActionIcon>
          </Indicator>

          {/* Client chip — before avatar */}
          {selectedClient && (
            <Button
              onClick={() => onNavigate('history')}
              variant="default"
             
              size="sm"
              leftSection={<Store size={14} />}
              title="Ver histórico de pedidos deste cliente"
            >
              {selectedClient.name}
            </Button>
          )}

          {/* Avatar + dropdown */}
          <Menu position="bottom-end" offset={8} shadow="md" width={192}>
            <Menu.Target>
              <ActionIcon
                variant="light"
                data-testid="user-menu"
               
                radius="xl"
                size={32}
                ml={4}
                style={{ borderRadius: '50%', borderLeft: '1px solid var(--mantine-color-gray-3)' }}
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
    </Box>
  );
}
