import { Group, Stack, Text, Badge, Table, Checkbox, Card, Divider, Button } from "@mantine/core";
import { profileDescriptions } from "../data/permissions";

interface PermissionMatrixTableProps {
  matrix: Record<string, Record<string, boolean>>;
  onToggle: (perfil: string, modulo: string) => void;
  onReset: () => void;
}

export function PermissionMatrixTable({ matrix, onToggle, onReset }: PermissionMatrixTableProps) {
  const perfis = Object.keys(matrix);
  const modulos = Object.keys(matrix[perfis[0]]);

  return (
    <Card withBorder radius="md" padding={0}>
      <Stack gap={8} p={{ base: 'md', sm: 'lg' }}>
        <Group gap="sm">
          {perfis.map(perfil => (
            <Badge key={perfil} color="neutral" variant="light">{perfil}</Badge>
          ))}
        </Group>
        <Stack gap={2}>
          {perfis.map(perfil => (
            <Text key={perfil} c="dimmed" size="0.72rem">
              <Text component="span" fw={600} c="var(--mantine-color-text)">{perfil}:</Text> {profileDescriptions[perfil]}
            </Text>
          ))}
        </Stack>
      </Stack>
      <Divider color="var(--mantine-color-default-border)" />

      <Table.ScrollContainer minWidth={120 + perfis.length * 110}>
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
                      aria-label={`${modulo} · ${perfil}`}
                      styles={{ input: { cursor: 'pointer' } }}
                    />
                  </Table.Td>
                );
              })}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      </Table.ScrollContainer>

      <Divider color="var(--mantine-color-default-border)" />
      <Group justify="space-between" gap="xs" p={{ base: 'md', sm: 'lg' }}>
        <Text c="dimmed" size="0.72rem">Clique em qualquer célula para alternar a permissão</Text>
        {/* Ação de baixa ênfase: não compete com as demais ações da página */}
        <Button onClick={onReset} variant="subtle" color="gray" size="xs">
          Restaurar permissões padrão
        </Button>
      </Group>
    </Card>
  );
}
