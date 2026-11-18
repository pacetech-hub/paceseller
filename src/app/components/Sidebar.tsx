import { useState, useLayoutEffect, useRef } from "react";
import {
  Group, Button, ActionIcon, Indicator, Text, Box, Stack, NavLink, Tooltip, Drawer, Image, UnstyledButton, Divider, Menu, ThemeIcon, Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  PackageIcon,
  ShoppingBagIcon,
  ClockIcon,
  SparkleIcon,
  UsersIcon,
  StorefrontIcon,
  CaretDownIcon,
  BellIcon,
  ListIcon,
  BuildingsIcon,
  SignOutIcon,
  ShieldIcon,
  WarehouseIcon,
  ReceiptIcon,
  FileTextIcon,
  CrosshairIcon,
  ShoppingCartIcon,
  HeadsetIcon,
  UserCircleIcon,
  type Icon,
} from "@phosphor-icons/react";
import type { Client } from "../data/mockData";
import teslaLogo from "../../assets/tesla-footwear-logo.png";
import classes from "./Sidebar.module.css";

export type View =
  | 'dashboard' | 'catalog' | 'order-grade' | 'cart' | 'carts' | 'history'
  | 'marketing' | 'sellout' | 'admin' | 'clients' | 'client-detail' | 'profile' | 'stock'
  | 'industry-stock' | 'permissions' | 'boletos' | 'order-detail' | 'ficha-tecnica' | 'sales-team' | 'radar' | 'support';

type Profile = 'admin' | 'rep' | 'lojista';


// Perfil não é status: ícone sempre neutro (amarelo/verde ficam reservados para atenção/sucesso)
const profileLabels: Record<Profile, { label: string; icon: Icon; color: string }> = {
  admin: { label: 'Indústria', icon: BuildingsIcon, color: 'currentColor' },
  rep: { label: 'Representante', icon: UsersIcon, color: 'currentColor' },
  lojista: { label: 'Lojista', icon: StorefrontIcon, color: 'currentColor' },
};


interface TopBarProps {
  profile: Profile;
  currentView: View;
  notifications?: number;
  actions?: React.ReactNode;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  cartCount?: number;
  /** Usuário logado, mostrado no menu da conta. */
  userName: string;
  /** Mostra o carrinho: só no Catálogo e nas páginas do processo de compra. */
  showCart?: boolean;
  selectedClient?: Client | null;
  /** Abre a gaveta do carrinho (FR-401); sem ela, o ícone leva à lista de carrinhos. */
  onOpenCartDrawer?: () => void;
}

interface MenuPage {
  label: string;
  icon: Icon;
  view: View;
}

/** Páginas do menu principal, na ordem de prioridade (as últimas vão primeiro para o "Mais"). */
function mainPages(profile: Profile): MenuPage[] {
  if (profile === 'admin') return [
    { icon: CrosshairIcon, label: 'Radar', view: 'radar' },
    { icon: UsersIcon, label: 'Clientes', view: 'clients' },
    { icon: PackageIcon, label: 'Catálogo', view: 'catalog' },
    { icon: WarehouseIcon, label: 'Estoque', view: 'industry-stock' },
    { icon: ClockIcon, label: 'Pedidos', view: 'history' },
    { icon: ReceiptIcon, label: 'Pagamentos e Boletos', view: 'boletos' },
    { icon: FileTextIcon, label: 'Ficha Técnica', view: 'ficha-tecnica' },
    { icon: SparkleIcon, label: 'Marketing IA', view: 'marketing' },
  ];
  if (profile === 'rep') return [
    { icon: CrosshairIcon, label: 'Radar', view: 'radar' },
    { icon: StorefrontIcon, label: 'Clientes', view: 'clients' },
    { icon: PackageIcon, label: 'Catálogo', view: 'catalog' },
    { icon: WarehouseIcon, label: 'Estoque', view: 'industry-stock' },
    { icon: ClockIcon, label: 'Pedidos', view: 'history' },
    { icon: FileTextIcon, label: 'Ficha Técnica', view: 'ficha-tecnica' },
    { icon: SparkleIcon, label: 'Marketing IA', view: 'marketing' },
  ];
  return [
    { icon: CrosshairIcon, label: 'Radar', view: 'radar' },
    { icon: PackageIcon, label: 'Catálogo', view: 'catalog' },
    { icon: WarehouseIcon, label: 'Meu Estoque', view: 'stock' },
    { icon: ShoppingBagIcon, label: 'Pedidos', view: 'history' },
    { icon: ReceiptIcon, label: 'Pagamentos e Boletos', view: 'boletos' },
    { icon: FileTextIcon, label: 'Ficha Técnica', view: 'ficha-tecnica' },
    { icon: SparkleIcon, label: 'Marketing IA', view: 'marketing' },
  ];
}

/** Páginas da conta: ficam no menu do usuário, não na barra. */
function accountPages(profile: Profile): MenuPage[] {
  return [
    { icon: UserCircleIcon, label: 'Meu Perfil', view: 'profile' },
    profile === 'admin'
      ? { icon: ShieldIcon, label: 'Administração', view: 'admin' }
      : { icon: ShieldIcon, label: 'Permissões', view: 'permissions' },
    { icon: HeadsetIcon, label: 'Suporte', view: 'support' },
  ];
}

const NAV_GAP = 4;

/**
 * Menu horizontal clássico. Mostra quantas páginas couberem na largura disponível;
 * as que não cabem vão, da última para a primeira, para o menu "Mais".
 */
function PriorityNav({ pages, currentView, onSelect }: { pages: MenuPage[]; currentView: View; onSelect: (view: View) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(pages.length);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;
    const compute = () => {
      const available = container.clientWidth;
      const widths = Array.from(measure.children).map(c => (c as HTMLElement).offsetWidth);
      const moreWidth = widths.pop() ?? 0; // o último item medido é o botão "Mais"
      const all = widths.reduce((sum, w) => sum + w + NAV_GAP, 0) - NAV_GAP;
      if (all <= available) { setVisibleCount(widths.length); return; }
      let used = moreWidth;
      let count = 0;
      for (const w of widths) {
        if (used + w + NAV_GAP > available) break;
        used += w + NAV_GAP;
        count++;
      }
      setVisibleCount(count);
    };
    compute();
    const observer = new ResizeObserver(compute);
    observer.observe(container);
    return () => observer.disconnect();
  }, [pages]);

  const visible = pages.slice(0, visibleCount);
  const hidden = pages.slice(visibleCount);
  const hiddenActive = hidden.some(p => p.view === currentView);

  return (
    <Box ref={containerRef} component="nav" aria-label="Páginas" className={classes.nav}>
      {/* Cópia invisível de todos os itens, só para medir a largura de cada um */}
      <div ref={measureRef} className={classes.navMeasure} aria-hidden>
        {pages.map(p => <span key={p.view} className={classes.navLink}>{p.label}</span>)}
        <span className={classes.navLink}>Mais <CaretDownIcon size={14} /></span>
      </div>

      {visible.map(p => {
        const active = p.view === currentView;
        return (
          <UnstyledButton
            key={p.view}
            className={classes.navLink}
            data-active={active || undefined}
            aria-current={active ? 'page' : undefined}
            onClick={() => onSelect(p.view)}
          >
            {p.label}
          </UnstyledButton>
        );
      })}

      {hidden.length > 0 && (
        <Menu position="bottom-start" offset={4} shadow="md" withinPortal>
          <Menu.Target>
            <UnstyledButton className={classes.navLink} data-active={hiddenActive || undefined} aria-label="Mais páginas">
              Mais <CaretDownIcon size={14} />
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            {hidden.map(p => {
              const ItemIcon = p.icon;
              const active = p.view === currentView;
              return (
                <Menu.Item
                  key={p.view}
                  leftSection={<ItemIcon size={16} />}
                  onClick={() => onSelect(p.view)}
                  fw={active ? 600 : undefined}
                  aria-current={active ? 'page' : undefined}
                >
                  {p.label}
                </Menu.Item>
              );
            })}
          </Menu.Dropdown>
        </Menu>
      )}
    </Box>
  );
}

/** Título da página, numa faixa logo abaixo do menu. */
export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Box flex="none" className={classes.pageTitle}>
      <Box maw={1400} mx="auto" px={{ base: 'md', sm: 'lg' }} py="sm">
        <Title order={1} size="h3" lh={1.3}>{title}</Title>
        {subtitle && <Text c="dimmed" size="sm" mt={2}>{subtitle}</Text>}
      </Box>
    </Box>
  );
}

/** Páginas de detalhe marcam no menu a seção de onde vieram. */
const PARENT_VIEW: Partial<Record<View, View>> = { 'order-detail': 'history', 'client-detail': 'clients' };

export function TopBar({ profile, userName, currentView: view, notifications = 4, actions, onNavigate, onLogout, cartCount = 0, showCart = false, selectedClient, onOpenCartDrawer }: TopBarProps) {
  const [navOpened, { open: openNav, close: closeNav }] = useDisclosure(false);
  const currentView = PARENT_VIEW[view] ?? view;
  const profileInfo = profileLabels[profile];
  const ProfileIcon = profileInfo.icon;
  const pages = mainPages(profile);
  const account = accountPages(profile);

  const selectPage = (view: View) => {
    onNavigate(view);
    closeNav();
  };
  const logout = () => {
    closeNav();
    onLogout();
  };
  const openCart = () => (onOpenCartDrawer ? onOpenCartDrawer() : onNavigate('carts'));

  const drawerLink = (p: MenuPage) => {
    const ItemIcon = p.icon;
    const active = p.view === currentView;
    return (
      <NavLink
        key={p.view}
        onClick={() => selectPage(p.view)}
        active={active}
        color="neutral"
        variant="light"
        label={p.label}
        leftSection={<ItemIcon size={18} />}
        aria-current={active ? 'page' : undefined}
        classNames={{ root: classes.drawerLink, label: classes.drawerLabel }}
        styles={{ label: { fontWeight: active ? 600 : 400 } }}
      />
    );
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
      <Group h="100%" gap="sm" wrap="nowrap">
        {/* Celular: o menu inteiro fica na gaveta */}
        <ActionIcon onClick={openNav} hiddenFrom="sm" variant="subtle" color="neutral" size="lg" aria-label="Abrir Menu" aria-expanded={navOpened}>
          <ListIcon size={20} weight="bold" />
        </ActionIcon>

        <UnstyledButton onClick={() => onNavigate('radar')} className={classes.logo} aria-label="Ir para o Radar">
          <Image src={teslaLogo} alt="Tesla Footwear" h={{ base: 20, sm: 24 }} w="auto" fit="contain" />
        </UnstyledButton>

        {/* A partir de sm: menu horizontal, com o que não couber em "Mais" */}
        <Box flex={1} miw={0} h="100%" visibleFrom="sm">
          <PriorityNav pages={pages} currentView={currentView} onSelect={selectPage} />
        </Box>
        <Box flex={1} hiddenFrom="sm" />

        <Group gap="xs" wrap="nowrap" flex="none">
          {actions}

          {/* Carrinho só no Catálogo e no processo de compra (FR-401: abre a gaveta e mostra os carrinhos abertos) */}
          {showCart && (
            <Indicator label={cartCount} disabled={cartCount === 0} size={16} color="neutral" offset={4}>
              <Tooltip label="Ver Carrinho" withArrow>
                <ActionIcon onClick={openCart} variant="subtle" color="neutral" size="lg" aria-label={`Ver Carrinho · ${cartCount} abertos`}>
                  <ShoppingCartIcon size={18} />
                </ActionIcon>
              </Tooltip>
            </Indicator>
          )}

          <Indicator label={notifications} disabled={notifications === 0} size={16} color="red" offset={4}>
            <Tooltip label="Ver Notificações" withArrow>
              <ActionIcon variant="subtle" color="neutral" size="lg" aria-label={`Ver Notificações · ${notifications}`}>
                <BellIcon size={18} />
              </ActionIcon>
            </Tooltip>
          </Indicator>

          {/* Cliente em atendimento (rep), leva aos pedidos dele */}
          {selectedClient && (
            <Button
              onClick={() => onNavigate('history')}
              variant="default"
              maw={{ sm: 180, lg: 260 }}
              visibleFrom="md"
              leftSection={<StorefrontIcon size={16} />}
              aria-label={`Ver Histórico de Pedidos de ${selectedClient.name}`}
              styles={{ label: { overflow: 'hidden' } }}
            >
              <Stack gap={0} miw={0} align="flex-start">
                <Text span size="sm" c="dimmed" lh={1.2}>Ver pedidos de</Text>
                <Text span fw={600} lh={1.2} truncate maw="100%">{selectedClient.name}</Text>
              </Stack>
            </Button>
          )}

          {/* Menu da conta: perfil, permissões/administração, suporte e sair */}
          <Box visibleFrom="sm">
            <Menu position="bottom-end" offset={6} shadow="md" width={240} withinPortal>
              <Menu.Target>
                <UnstyledButton className={classes.accountButton} aria-label={`Menu da conta · ${userName}`}>
                  <ThemeIcon size={32} radius="xl" variant="light" color="neutral" aria-hidden>
                    <ProfileIcon size={16} />
                  </ThemeIcon>
                  <Text size="sm" fw={600} truncate maw={140} visibleFrom="lg">{userName}</Text>
                  <CaretDownIcon size={14} aria-hidden />
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                <Box px="sm" py="xs">
                  <Text size="xs" c="dimmed">{profileInfo.label}</Text>
                  <Text size="sm" fw={600} truncate>{userName}</Text>
                </Box>
                <Menu.Divider />
                {account.map(p => {
                  const ItemIcon = p.icon;
                  return (
                    <Menu.Item key={p.view} leftSection={<ItemIcon size={16} />} onClick={() => onNavigate(p.view)} fw={p.view === currentView ? 600 : undefined}>
                      {p.label}
                    </Menu.Item>
                  );
                })}
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<SignOutIcon size={16} />} onClick={onLogout}>
                  Sair
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Box>
        </Group>
      </Group>

      <Drawer
        opened={navOpened}
        onClose={closeNav}
        hiddenFrom="sm"
        position="left"
        size={300}
        title={<Image src={teslaLogo} alt="Tesla Footwear" h={24} w="auto" fit="contain" />}
      >
        <Stack gap={0} component="nav" aria-label="Páginas">
          {pages.map(drawerLink)}
          <Divider my="sm" />
          {account.map(drawerLink)}
          <Divider my="sm" />
          <Group gap="sm" wrap="nowrap" px="sm" py="xs">
            <ThemeIcon size={32} radius="xl" variant="light" color="neutral" aria-hidden>
              <ProfileIcon size={16} />
            </ThemeIcon>
            <Box flex={1} miw={0}>
              <Text size="xs" c="dimmed">{profileInfo.label}</Text>
              <Text size="sm" fw={600} truncate>{userName}</Text>
            </Box>
            <Button variant="subtle" color="red" px="sm" leftSection={<SignOutIcon size={16} />} onClick={logout}>
              Sair
            </Button>
          </Group>
        </Stack>
      </Drawer>
    </Box>
  );
}
