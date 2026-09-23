import { useState } from "react";
import {
  Stack, Group, Box, Paper, ThemeIcon, Text, Alert, Button, TextInput,
  Table, Avatar, Badge, Select, ActionIcon, SimpleGrid,
} from "@mantine/core";
import {
  UsersIcon,
  StorefrontIcon,
  InfoIcon,
  UserPlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import { visoes, defaultPermissions, type VisaoKey, type PermissionsState } from "../data/permissions";
import { linkedUsers as initialLinkedUsers, type LinkedUser } from "../data/linkedUsers";
import { clients, formatDate } from "../data/mockData";
import { PermissionMatrixTable } from "./PermissionMatrixTable";

type Profile = 'rep' | 'lojista';

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
  icon: React.ComponentType<{ className?: string }>;
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

  const removeUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  const inviteUser = () => {
    if (!inviteName.trim() || !inviteEmail.trim()) return;
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
  };

  const Icon = scope.icon;
  const visaoInfo = visoes.find(v => v.id === scope.visao)!;

  return (
    <Stack gap="lg" maw={1400} mx="auto" p="lg">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size={40} radius="md" variant="light" color="neutral">
          <Icon className="w-5 h-5" />
        </ThemeIcon>
        <Box>
          <Text fw={700} size="1.05rem" style={{ letterSpacing: '-0.01em' }}>{scope.title}</Text>
          <Text c="dimmed" size="0.78rem">{scope.subtitle}</Text>
        </Box>
      </Group>

      <Alert icon={<InfoIcon className="w-4 h-4" />} color="neutral" radius="md" variant="light">
        Estes usuários são registrados pela indústria e vinculados à sua conta. Aqui você escolhe o perfil de acesso de cada um — o que cada perfil pode fazer é definido na tabela abaixo.
      </Alert>

      {/* Usuários vinculados */}
      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        <Group justify="space-between" p="lg" className="border-b border-border" wrap="wrap">
          <Box>
            <Text fw={600} size="0.9rem">Usuários vinculados</Text>
            <Text c="dimmed" size="0.75rem" mt={2}>{scope.usersHint}</Text>
          </Box>
          <Button
            onClick={() => setShowInvite(v => !v)}
            color="neutral"
            size="sm"
            leftSection={<UserPlusIcon className="w-3.5 h-3.5" />}
          >
            Convidar usuário
          </Button>
        </Group>

        {showInvite && (
          <Stack gap="sm" p="lg" className="bg-secondary/20 border-b border-border">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              <TextInput
                label="Nome completo"
                value={inviteName}
                onChange={e => setInviteName(e.currentTarget.value)}
                placeholder="Nome do usuário"
              />
              <TextInput
                label="E-mail"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.currentTarget.value)}
                placeholder="email@exemplo.com.br"
              />
            </SimpleGrid>
            <Text c="dimmed" size="0.72rem">
              Será convidado com o perfil <Text component="span" fw={500} c="var(--mantine-color-text)">{subProfile}</Text>. Você pode trocar o perfil depois de criado.
            </Text>
            <Group justify="flex-end" gap="sm">
              <Button onClick={() => setShowInvite(false)} variant="default" color="neutral" size="sm">Cancelar</Button>
              <Button onClick={inviteUser} color="neutral" size="sm">Convidar</Button>
            </Group>
          </Stack>
        )}

        <Table verticalSpacing="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Usuário</Table.Th>
              <Table.Th>Perfil de acesso</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Último acesso</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map(u => (
              <Table.Tr key={u.id}>
                <Table.Td>
                  <Group gap="sm" wrap="nowrap">
                    <Avatar radius="xl" size={28} color="neutral">{initials(u.name)}</Avatar>
                    <Box style={{ minWidth: 0 }}>
                      <Text fw={500} size="0.82rem" truncate>{u.name}</Text>
                      <Text c="dimmed" size="0.72rem" truncate>{u.email}</Text>
                    </Box>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Select
                    value={u.profile}
                    onChange={v => v && changeUserProfile(u.id, v)}
                    data={availableProfiles}
                    size="xs"
                    w={160}
                    allowDeselect={false}
                  />
                </Table.Td>
                <Table.Td>
                  <Badge size="sm" color={u.status === 'ativo' ? 'green' : 'gray'} variant="light">{u.status}</Badge>
                </Table.Td>
                <Table.Td>
                  <Text c="dimmed" size="0.75rem" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {u.lastLogin === '—' ? '—' : formatDate(u.lastLogin)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <ActionIcon onClick={() => removeUser(u.id)} variant="subtle" color="red" title="Remover vínculo">
                    <TrashIcon className="w-3.5 h-3.5" />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
            {users.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5}>
                  <Text c="dimmed" ta="center" py="lg" size="0.82rem">
                    Nenhum usuário vinculado ainda. Convide o primeiro acima.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* O que cada perfil pode acessar */}
      <Box>
        <Text fw={600} size="0.95rem" mb={4}>O que cada perfil pode acessar</Text>
        <Text c="dimmed" size="0.75rem" mb="sm">{visaoInfo.desc}. Alterar aqui afeta todos os usuários com o perfil correspondente.</Text>
        <PermissionMatrixTable
          matrix={permissionsState[scope.visao]}
          onToggle={togglePermission}
          onReset={() => setPermissionsState(prev => ({ ...prev, [scope.visao]: defaultPermissions[scope.visao] }))}
        />
      </Box>
    </Stack>
  );
}
