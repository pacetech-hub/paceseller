import { Group, Stack, Box, Text, Badge, Table, Checkbox, Card, Divider, Button } from "@mantine/core";
import { profileDescriptions } from "../data/permissions";
import { toast } from "../lib/toast";
import { useMockLoading } from "../lib/useMockLoading";
import { ListSkeleton, TableSkeleton } from "./ui/Skeletons";
import { CellList, CellCard } from "./ui/CellView";

interface PermissionMatrixTableProps {
  matrix: Record<string, Record<string, boolean>>;
  onToggle: (perfil: string, modulo: string) => void;
  onReset: () => void;
}

export function PermissionMatrixTable({ matrix, onToggle, onReset }: PermissionMatrixTableProps) {
  const perfis = Object.keys(matrix);
  const modulos = Object.keys(matrix[perfis[0]]);
  const loading = useMockLoading();

  return (
    <Card withBorder padding={0}>
      <Stack gap={8} p={{ base: 'md', sm: 'lg' }}>
        <Group gap="sm">
          {perfis.map(perfil => (
            <Badge key={perfil} color="neutral" variant="light">{perfil}</Badge>
          ))}
        </Group>
        <Stack gap={2}>
          {perfis.map(perfil => (
            <Text key={perfil} c="dimmed" size="sm">
              <Text component="span" fw={600} c="var(--mantine-color-text)">{perfil}:</Text> {profileDescriptions[perfil]}
            </Text>
          ))}
        </Stack>
      </Stack>
      <Divider color="var(--mantine-color-default-border)" />

      {loading ? (
        // Skeleton só da região da matriz; legenda e ação de restaurar continuam visíveis
        <Box p={{ base: 'md', sm: 'lg' }}>
          <Box visibleFrom="sm"><TableSkeleton rows={modulos.length} cols={perfis.length + 1} /></Box>
          <Box hiddenFrom="sm"><ListSkeleton rows={4} withAvatar={false} /></Box>
        </Box>
      ) : (
      <>
      {/* Poucas colunas (módulo + perfis): tabela a partir de sm, cartões por módulo no celular */}
      <Box visibleFrom="sm">
      {/* Sem células centralizadas: checkbox alinhado à esquerda, sob o rótulo do perfil
          (horizontalSpacing="md" = mesmo recuo px="md" da área de clique) */}
      <Table verticalSpacing="sm" horizontalSpacing="md" fz="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Módulo</Table.Th>
            {perfis.map(p => (
              <Table.Th key={p}>{p}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {modulos.map(modulo => (
            <Table.Tr key={modulo}>
              <Table.Td>{modulo}</Table.Td>
              {perfis.map(perfil => {
                const allowed = matrix[perfil][modulo];
                return (
                  <Table.Td key={perfil} p={0}>
                    {/* A célula inteira é a área de clique (label envolve o checkbox), com no mínimo 44px de altura */}
                    <Box
                      component="label"
                      display="flex"
                      mih={44}
                      px="md"
                      style={{ alignItems: 'center', justifyContent: 'flex-start', cursor: 'pointer' }}
                    >
                      <Checkbox
                        checked={allowed}
                        onChange={() => onToggle(perfil, modulo)}
                        color="neutral"
                        aria-label={`${modulo} · ${perfil}`}
                        styles={{ input: { cursor: 'pointer' } }}
                      />
                    </Box>
                  </Table.Td>
                );
              })}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      </Box>
      <Box hiddenFrom="sm" p="md">
        <CellList>
          {modulos.map(modulo => (
            <CellCard key={modulo} title={modulo}>
              <Stack gap="sm">
                {perfis.map(perfil => (
                  <Checkbox
                    key={perfil}
                    label={perfil}
                    checked={matrix[perfil][modulo]}
                    onChange={() => onToggle(perfil, modulo)}
                    color="neutral"
                    aria-label={`${modulo} · ${perfil}`}
                  />
                ))}
              </Stack>
            </CellCard>
          ))}
        </CellList>
      </Box>
      </>
      )}

      <Divider color="var(--mantine-color-default-border)" />
      <Group justify="space-between" gap="sm" p={{ base: 'md', sm: 'lg' }}>
        <Text c="dimmed" size="sm">Marque ou desmarque para conceder ou revogar a permissão</Text>
        {/* Ação de baixa ênfase: não compete com as demais ações da página */}
        <Button
          onClick={() => {
            onReset();
            toast.success('Permissões padrão restauradas', 'Todos os perfis desta tabela voltaram à configuração original');
          }}
          variant="subtle" color="gray">
          Restaurar Permissões Padrão
        </Button>
      </Group>
    </Card>
  );
}
