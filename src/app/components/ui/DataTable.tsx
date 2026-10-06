import { Card, Group, Paper, Table, Text } from "@mantine/core";
import sticky from "./stickyTable.module.css";

// Padrão único de tabela do app (o mesmo de Meu Estoque, Pedidos e Pagamentos e Boletos):
// cartão com borda, cabeçalho fixo em cinza e caixa-alta, 1ª coluna sempre visível,
// texto sem quebra e rolagem lateral no celular (a tabela não vira lista de cartões).
// Colunas numéricas (e "Ações") ficam alinhadas à direita no cabeçalho; nas células use ta="right".

export function DataTableHeader({ labels, numeric = [] }: { labels: string[]; numeric?: string[] }) {
  return (
    <Table.Thead>
      <Table.Tr>
        {labels.map((h, i) => (
          // fundo em cada Th (não no Thead) para o cabeçalho fixo e a 1ª coluna fixa ficarem iguais
          <Table.Th key={`${h}-${i}`} bg="var(--mantine-color-gray-0)"
            ta={numeric.includes(h) || h === 'Ações' ? 'right' : undefined}>
            <Text c="dimmed" size="sm" fw={600} tt="uppercase">{h}</Text>
          </Table.Th>
        ))}
      </Table.Tr>
    </Table.Thead>
  );
}

interface DataTableProps {
  headers: string[];
  /** Cabeçalhos alinhados à direita (valores, quantidades). "Ações" já é alinhado. */
  numeric?: string[];
  /** Largura mínima antes de aparecer a rolagem lateral. */
  minWidth?: number;
  /** Altura máxima com cabeçalho fixo; omita para tabelas curtas. */
  maxHeight?: number;
  /** Mantém a 1ª coluna fixa ao rolar para o lado (padrão: sim). */
  stickyFirstCol?: boolean;
  children: React.ReactNode;
}

export function DataTable({ headers, numeric, minWidth = 900, maxHeight = 560, stickyFirstCol = true, children }: DataTableProps) {
  return (
    <Card withBorder padding={0}>
      <Table.ScrollContainer minWidth={minWidth} maxHeight={maxHeight}>
        <Table className={stickyFirstCol ? sticky.firstCol : undefined} stickyHeader stickyHeaderOffset={0}
          highlightOnHover verticalSpacing="sm" horizontalSpacing="md" style={{ whiteSpace: 'nowrap' }}>
          <DataTableHeader labels={headers} numeric={numeric} />
          <Table.Tbody>{children}</Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Card>
  );
}

/** Linha de largura total para estado vazio (busca/filtro sem resultado). */
export function DataTableEmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <Table.Tr>
      <Table.Td colSpan={colSpan} px="md" style={{ whiteSpace: 'normal' }}>{children}</Table.Td>
    </Table.Tr>
  );
}

/** Barra de busca e filtros acima da tabela. */
export function TableToolbar({ children }: { children: React.ReactNode }) {
  return (
    <Paper withBorder p="sm">
      <Group gap="sm" wrap="wrap">{children}</Group>
    </Paper>
  );
}
