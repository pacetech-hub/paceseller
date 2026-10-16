import { useState } from "react";
import {
  Stack, Group, Box, ThemeIcon, Text, Title, Alert, Button, TextInput,
  Table, Avatar, Badge, SegmentedControl, Paper,
} from "@mantine/core";
import {
  UsersIcon,
  StorefrontIcon,
  InfoIcon,
  UserPlusIcon,
  TrashIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { visoes, defaultPermissions, type VisaoKey, type PermissionsState } from "../data/permissions";
import { linkedUsers as initialLinkedUsers, type LinkedUser } from "../data/linkedUsers";
import { clients, formatDate } from "../data/mockData";
import { PermissionMatrixTable } from "./PermissionMatrixTable";
import { toast } from "../lib/toast";
import { useMockLoading } from "../lib/useMockLoading";
import { TableSkeleton } from "./ui/Skeletons";
import { DataTable, DataTableEmptyRow } from "./ui/DataTable";
import { EmptyState } from "./ui/EmptyState";

type Profile = 'rep' | 'lojista';

const USER_HEADERS = ['Usuário', 'Perfil de acesso', 'Status', 'Último acesso', 'Ações'];

interface AccessPermissionsPageProps {
  profile: Profile;
}

const scopeCopy: Record<Profile, {
  visao: VisaoKey;
  ownerType: LinkedUser['ownerType'];
  ownerName: string;
  /** Perfil que representa o próprio dono da conta (rep ou lojista), usado para sugerir o perfil padrão de novos convites. */
  ownerProfile: string;
  title: string;
  subtitle: string;
  usersHint: string;
  icon: PhosphorIcon;
}> = {
  rep: {
    visao: 'representante',
    ownerType: 'representante',
    ownerName: 'Marcos Andrade',
    ownerProfile: 'Representante',
    title: 'Usuários e permissões da minha equipe',
    subtitle: 'Gerencie os prepostos vinculados à sua conta e o que cada um pode acessar',
    usersHint: 'Usuários vinculados à sua conta de representante (ex.: prepostos que vendem em seu nome).',
    icon: UsersIcon,
  },
  lojista: {
    visao: 'lojista',
    ownerType: 'lojista',
    ownerName: clients[0].name,
    ownerProfile: 'Lojista',
    title: 'Usuários e permissões da minha loja',
    subtitle: 'Gerencie os compradores vinculados à sua conta e o que cada um pode acessar',
    usersHint: 'Usuários vinculados à sua conta de lojista (ex.: compradores que fazem pedidos pela loja).',
    icon: StorefrontIcon,
  },
};

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export function AccessPermissionsPage({ profile }: AccessPermissionsPageProps) {
  const scope = scopeCopy[profile];
  const [permissionsState, setPermissionsState] = useState<PermissionsState>(defaultPermissions);
  const [users, setUsers] = useState<LinkedUser[]>(() =>
    initialLinkedUsers.filter(u => u.ownerType === scope.ownerType && u.ownerName === scope.ownerName)
  );
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteErrors, setInviteErrors] = useState<{ name?: string; email?: string }>({});
  const loading = useMockLoading();

  const availableProfiles = Object.keys(permissionsState[scope.visao]);
  const subProfile = availableProfiles.find(p => p !== scope.ownerProfile) ?? availableProfiles[availableProfiles.length - 1];

  const togglePermission = (perfil: string, modulo: string) => {
    setPermissionsState(prev => ({
      ...prev,
      [scope.visao]: {
        ...prev[scope.visao],
        [perfil]: {
          ...prev[scope.visao][perfil],
          [modulo]: !prev[scope.visao][perfil][modulo],
        },
      },
    }));
  };

  const changeUserProfile = (id: string, newProfile: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, profile: newProfile } : u));
  };

  const removeUser = (user: LinkedUser) => {
    setUsers(prev => prev.filter(u => u.id !== user.id));
    toast.success(`Vínculo de ${user.name} removido`, 'Ele perdeu o acesso à sua conta. Para reativar, convide-o novamente.');
  };

  const inviteUser = () => {
    // Erros ao lado do campo, dizendo como corrigir
    const errors: { name?: string; email?: string } = {};
    if (!inviteName.trim()) errors.name = 'Informe o nome completo do usuário';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())) errors.email = 'Informe um e-mail válido, ex.: nome@loja.com.br';
    setInviteErrors(errors);
    if (errors.name || errors.email) return;
    const newUser: LinkedUser = {
      id: `LU-NEW-${Date.now()}`,
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      profile: subProfile,
      status: 'ativo',
      lastLogin: '—',
      ownerType: scope.ownerType,
      ownerName: scope.ownerName,
    };
    setUsers(prev => [newUser, ...prev]);
    setShowInvite(false);
    setInviteName('');
    setInviteEmail('');
    toast.success(`Convite enviado para ${newUser.email}`, `${newUser.name} já aparece na lista de usuários vinculados com o perfil ${subProfile}`);
  };

  const lastLogin = (u: LinkedUser) => (u.lastLogin === '—' ? '—' : formatDate(u.lastLogin));

  const Icon = scope.icon;
  const visaoInfo = visoes.find(v => v.id === scope.visao)!;

  return (
    <Stack gap="xl" maw={1400} mx="auto" p={{ base: 'md', sm: 'lg' }}>
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size={40} variant="light" color="neutral">
          <Icon size={20} />
        </ThemeIcon>
        <Box>
          <Title order={1}>{scope.title}</Title>
          <Text c="dimmed" size="sm">{scope.subtitle}</Text>
        </Box>
      </Group>

      <Alert icon={<InfoIcon size={16} />} color="neutral" variant="light">
        Estes usuários são registrados pela indústria e vinculados à sua conta. Aqui você escolhe o perfil de acesso de cada um — o que cada perfil pode fazer é definido na tabela abaixo.
      </Alert>

      {/* Usuários vinculados: cabeçalho e convite acima, lista no padrão único de tabela */}
      <Stack gap="sm">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Box>
            <Title order={2}>Usuários vinculados</Title>
            <Text c="dimmed" size="sm" mt={4}>{scope.usersHint}</Text>
          </Box>
          {/* Abre o formulário: ação secundária (a principal é "Enviar Convite", dentro dele) */}
          <Button
            onClick={() => setShowInvite(v => !v)}
            variant="default"
            leftSection={<UserPlusIcon size={16} />}
          >
            Convidar Usuário
          </Button>
        </Group>

        {showInvite && (
          // Formulário de convite em coluna única
          <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
            <Stack gap="md">
              <TextInput
                label="Nome completo"
                value={inviteName}
                onChange={e => { setInviteName(e.currentTarget.value); setInviteErrors(p => ({ ...p, name: undefined })); }}
                placeholder="ex.: Maria Silva"
                maxLength={100}
                error={inviteErrors.name}
              />
              <TextInput
                label="E-mail"
                value={inviteEmail}
                onChange={e => { setInviteEmail(e.currentTarget.value); setInviteErrors(p => ({ ...p, email: undefined })); }}
                placeholder={profile === 'lojista' ? 'nome@loja.com.br' : 'nome@empresa.com.br'}
                error={inviteErrors.email}
              />
              <Text c="dimmed" size="sm">
                Será convidado com o perfil <Text component="span" fw={600} c="var(--mantine-color-text)">{subProfile}</Text>. Você pode trocar o perfil depois de criado.
              </Text>
              <Group justify="flex-end" gap="sm">
                <Button onClick={() => { setShowInvite(false); setInviteErrors({}); }} variant="default">Cancelar</Button>
                <Button onClick={inviteUser} color="neutral">Enviar Convite</Button>
              </Group>
            </Stack>
          </Paper>
        )}

        {/* Skeleton só da lista; título e botão de convite continuam visíveis */}
        {loading ? <TableSkeleton rows={3} cols={USER_HEADERS.length} /> : (
          // Mantida no celular, com rolagem lateral e a coluna Usuário sempre visível
          <DataTable headers={USER_HEADERS} minWidth={900}>
            {users.map(u => (
              <Table.Tr key={u.id}>
                <Table.Td maw={280}>
                  <Group gap="sm" wrap="nowrap">
                    <Avatar size={28} color="neutral">{initials(u.name)}</Avatar>
                    <Box miw={0}>
                      <Text fw={600} truncate>{u.name}</Text>
                      <Text c="dimmed" size="sm" truncate>{u.email}</Text>
                    </Box>
                  </Group>
                </Table.Td>
                <Table.Td>
                  {/* Poucos perfis fixos: opções visíveis em vez de lista suspensa */}
                  <SegmentedControl
                    value={u.profile}
                    onChange={v => changeUserProfile(u.id, v)}
                    data={availableProfiles}
                    color="neutral"
                    aria-label={`Perfil de acesso de ${u.name}`}
                  />
                </Table.Td>
                <Table.Td>
                  <Badge color={u.status === 'ativo' ? 'teal' : 'gray'} variant="light"
                    styles={{ root: { minWidth: 'max-content' } }}>{u.status}</Badge>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" className="mono">{lastLogin(u)}</Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Button
                    onClick={() => removeUser(u)}
                    variant="default"
                    size="sm"
                    leftSection={<TrashIcon size={16} />}
                    aria-label={`Remover vínculo de ${u.name}`}
                  >
                    Remover
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
            {users.length === 0 && (
              // Estado vazio: explica o motivo e oferece a ação
              <DataTableEmptyRow colSpan={USER_HEADERS.length}>
                <EmptyState
                  icon={UsersIcon}
                  title="Nenhum usuário vinculado ainda"
                  description={`Convide alguém da sua equipe para acessar com o perfil ${subProfile}. Você pode trocar o perfil depois.`}
                  // Abre o formulário de convite aqui mesmo (ação no lugar, sem seta)
                  action={showInvite ? undefined : { label: 'Convidar Usuário', onClick: () => setShowInvite(true), forward: false }}
                  withBorder={false}
                />
              </DataTableEmptyRow>
            )}
          </DataTable>
        )}
      </Stack>

      {/* O que cada perfil pode acessar */}
      <Box>
        <Title order={2} mb={4}>O que cada perfil pode acessar</Title>
        <Text c="dimmed" size="sm" mb="sm">{visaoInfo.desc}. Alterar aqui afeta todos os usuários com o perfil correspondente.</Text>
        <PermissionMatrixTable
          matrix={permissionsState[scope.visao]}
          onToggle={togglePermission}
          onReset={() => setPermissionsState(prev => ({ ...prev, [scope.visao]: defaultPermissions[scope.visao] }))}
        />
      </Box>
    </Stack>
  );
}
