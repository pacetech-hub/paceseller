import { Group, Stack, Box, Text, Badge, Table, Checkbox, Paper, Button } from "@mantine/core";
import { profileDescriptions } from "../data/permissions";
import { toast } from "../lib/toast";
import { useMockLoading } from "../lib/useMockLoading";
import { TableSkeleton } from "./ui/Skeletons";
import { DataTable } from "./ui/DataTable";

interface PermissionMatrixTableProps {
  matrix: Record<string, Record<string, boolean>>;
  onToggle: (perfil: string, modulo: string) => void;
  onReset: () => void;
}

export function PermissionMatrixTable({ matrix, onToggle, onReset }: PermissionMatrixTableProps) {
  const perfis = Object.keys(matrix);
  const modulos = Object.keys(matrix[perfis[0]]);
  const headers = ['Módulo', ...perfis];
  const loading = useMockLoading();

  return (
    <Stack gap="sm">
      {/* Legenda dos perfis acima da tabela */}
      <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
        <Stack gap="xs">
          <Group gap="sm">
            {perfis.map(perfil => (
              <Badge key={perfil} color="neutral" variant="light" styles={{ root: { minWidth: 'max-content' } }}>{perfil}</Badge>
            ))}
          </Group>
          <Stack gap={4}>
            {perfis.map(perfil => (
              <Text key={perfil} c="dimmed" size="sm">
                <Text component="span" fw={600} c="var(--mantine-color-text)">{perfil}:</Text> {profileDescriptions[perfil]}
              </Text>
            ))}
          </Stack>
        </Stack>
      </Paper>

      {/* Skeleton só da matriz; legenda e ação de restaurar continuam visíveis */}
      {loading ? <TableSkeleton rows={modulos.length} cols={headers.length} /> : (
        // Mantida no celular, com rolagem lateral e a coluna Módulo sempre visível
        <DataTable headers={headers} minWidth={220 + perfis.length * 160}>
          {modulos.map(modulo => (
            <Table.Tr key={modulo}>
              <Table.Td><Text fw={600}>{modulo}</Text></Table.Td>
              {perfis.map(perfil => (
                <Table.Td key={perfil} p={0}>
                  {/* A célula inteira é a área de clique (label envolve o checkbox), com no mínimo 44px de altura;
                      px="md" = mesmo recuo do rótulo do perfil no cabeçalho */}
                  <Box
                    component="label"
                    display="flex"
                    mih={44}
                    px="md"
                    style={{ alignItems: 'center', justifyContent: 'flex-start', cursor: 'pointer' }}
                  >
                    <Checkbox
                      checked={matrix[perfil][modulo]}
                      onChange={() => onToggle(perfil, modulo)}
                      color="neutral"
                      aria-label={`${modulo} · ${perfil}`}
                      styles={{ input: { cursor: 'pointer' } }}
                    />
                  </Box>
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </DataTable>
      )}

      <Group justify="space-between" gap="sm">
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
    </Stack>
  );
}
