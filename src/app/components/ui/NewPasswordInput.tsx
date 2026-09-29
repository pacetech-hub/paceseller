import { useState } from "react";
import { Box, Group, PasswordInput, Progress, Stack, Text, type PasswordInputProps } from "@mantine/core";
import { CheckIcon, CircleIcon } from "@phosphor-icons/react";

// Campo de NOVA senha: em vez de listar as exigências antes (ou com asteriscos), guia a pessoa
// enquanto ela digita — cada requisito vira "atendido" em tempo real, com barra de progresso.
// Sempre com o botão de mostrar/ocultar senha (do próprio PasswordInput).

export const PASSWORD_RULES = [
  { id: 'len', label: 'Pelo menos 8 caracteres', test: (v: string) => v.length >= 8 },
  { id: 'upper', label: 'Uma letra maiúscula', test: (v: string) => /[A-ZÀ-Ý]/.test(v) },
  { id: 'lower', label: 'Uma letra minúscula', test: (v: string) => /[a-zà-ý]/.test(v) },
  { id: 'number', label: 'Um número', test: (v: string) => /\d/.test(v) },
] as const;

export const isStrongPassword = (v: string) => PASSWORD_RULES.every(r => r.test(v));

export function NewPasswordInput({ value, onChange, ...props }: Omit<PasswordInputProps, 'value' | 'onChange'> & {
  value: string;
  onChange: (value: string) => void;
}) {
  const [touched, setTouched] = useState(false);
  const met = PASSWORD_RULES.filter(r => r.test(value)).length;
  const show = touched || value.length > 0;

  return (
    <Box>
      <PasswordInput
        value={value}
        onChange={e => { setTouched(true); onChange(e.currentTarget.value); }}
        autoComplete="new-password"
        visibilityToggleButtonProps={{ 'aria-label': 'Mostrar ou ocultar senha' }}
        {...props}
      />
      {show && (
        <Stack gap={6} mt="sm" aria-live="polite">
          <Progress
            value={(met / PASSWORD_RULES.length) * 100}
            color={met === PASSWORD_RULES.length ? 'teal' : met >= 2 ? 'yellow' : 'red'}
            size="sm"
            aria-label={`${met} de ${PASSWORD_RULES.length} requisitos atendidos`}
          />
          {PASSWORD_RULES.map(r => {
            const ok = r.test(value);
            return (
              <Group key={r.id} gap={8} wrap="nowrap" c={ok ? 'teal.7' : 'dimmed'}>
                {ok ? <CheckIcon size={16} /> : <CircleIcon size={16} />}
                <Text size="sm" c="inherit">{r.label}{ok ? ' — ok' : ''}</Text>
              </Group>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
