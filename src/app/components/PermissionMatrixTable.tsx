import { Paper, Group, Stack, Text, Badge, Table, Checkbox } from "@mantine/core";
import { profileDescriptions } from "../data/permissions";
import interactive from "./interactive.module.css";

interface PermissionMatrixTableProps {
  matrix: Record<string, Record<string, boolean>>;
  onToggle: (perfil: string, modulo: string) => void;
  onReset: () => void;
}

export function PermissionMatrixTable({ matrix, onToggle, onReset }: PermissionMatrixTableProps) {
  const perfis = Object.keys(matrix);
  const modulos = Object.keys(matrix[perfis[0]]);

  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
      <Stack gap={8} p="lg" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
        <Group gap="sm">
          {perfis.map(perfil => (
            <Badge key={perfil} color="neutral" variant="light">{perfil}</Badge>
          ))}
        </Group>
        <Stack gap={2}>
          {perfis.map(perfil => (
            <Text key={perfil} c="dimmed" size="0.72rem">
              <Text component="span" fw={500} c="var(--mantine-color-text)">{perfil}:</Text> {profileDescriptions[perfil]}
            </Text>
          ))}
        </Stack>
      </Stack>

      <Table verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Módulo</Table.Th>
            {perfis.map(p => (
              <Table.Th key={p} ta="center">{p}</Table.Th>
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
                  <Table.Td key={perfil} ta="center">
                    <Checkbox
                      checked={allowed}
                      onChange={() => onToggle(perfil, modulo)}
                      color="neutral"
                      title={allowed ? 'Clique para revogar' : 'Clique para conceder'}
                      styles={{ input: { cursor: 'pointer' } }}
                    />
                  </Table.Td>
                );
              })}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Group justify="space-between" p="lg" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Text c="dimmed" size="0.72rem">Clique em qualquer célula para alternar a permissão</Text>
        <Text
          component="button"
          onClick={onReset}
          c="dimmed"
          size="0.72rem"
          style={{ cursor: 'pointer', background: 'none', border: 'none' }}
          className={interactive.hoverText}
        >
          Restaurar padrões
        </Text>
      </Group>
    </Paper>
  );
}
