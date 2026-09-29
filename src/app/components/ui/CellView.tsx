import type { ReactNode } from "react";
import { Box, Group, Paper, Stack, Text, UnstyledButton } from "@mantine/core";
import { CaretRightIcon } from "@phosphor-icons/react";
import interactive from "../interactive.module.css";

// "Cell view": no celular, tabelas de até 6 colunas viram uma lista de cartões empilhados
// (nada de rolagem lateral). Cada cartão tem um título e os demais campos em uma coluna,
// rótulo acima do valor, tudo alinhado à esquerda para leitura rápida pela borda esquerda.
//
// Uso típico:
//   <Table visibleFrom="sm">…</Table>
//   <CellList hiddenFrom="sm">{rows.map(r => <CellCard key={r.id} title={r.name} onClick={…}>
//     <CellField label="Cidade">{r.city}</CellField>
//   </CellCard>)}</CellList>

export function CellList({ children, hiddenFrom = "sm" }: { children: ReactNode; hiddenFrom?: "xs" | "sm" | "md" | "lg" }) {
  return <Stack gap="sm" hiddenFrom={hiddenFrom}>{children}</Stack>;
}

export function CellCard({ title, aside, children, onClick, actions }: {
  /** Informação principal da linha (ex.: nome do cliente). */
  title: ReactNode;
  /** Status/etiqueta ao lado do título. */
  aside?: ReactNode;
  children?: ReactNode;
  /** Quando a linha abre um detalhe, o cartão inteiro é clicável e ganha uma seta. */
  onClick?: () => void;
  /** Botões de ação da linha, exibidos no rodapé do cartão. */
  actions?: ReactNode;
}) {
  const body = (
    <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
      <Stack gap="sm" miw={0} flex={1}>
        <Group gap="sm" wrap="wrap">
          <Text fw={600}>{title}</Text>
          {aside}
        </Group>
        {children}
      </Stack>
      {onClick && <Box mt={2} c="dimmed"><CaretRightIcon size={16} /></Box>}
    </Group>
  );
  return (
    <Paper withBorder>
      {onClick ? (
        <UnstyledButton onClick={onClick} p="md" w="100%" className={interactive.hoverable}>{body}</UnstyledButton>
      ) : (
        <Box p="md">{body}</Box>
      )}
      {actions && (
        <Group gap="sm" justify="flex-end" px="md" pb="md">{actions}</Group>
      )}
    </Paper>
  );
}

/** Campo do cartão: rótulo (14px, discreto) acima do valor (16px). */
export function CellField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Text size="sm" c="dimmed">{label}</Text>
      <Box>{children}</Box>
    </Box>
  );
}
