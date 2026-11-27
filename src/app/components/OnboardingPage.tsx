import { useState, type ReactNode } from "react";
import {
  Alert, Box, Button, Chip, Divider, Group, Loader, Select, Stack, Stepper, Text, TextInput, Title, UnstyledButton,
} from "@mantine/core";
import { ArrowRightIcon, CaretRightIcon, CheckCircleIcon, StackIcon, WarningIcon } from "@phosphor-icons/react";
import {
  AUDIENCES, CHANNELS, DIFFERENTIALS, REGIONS, SEGMENTS, STORE_SIZES, finishOnboarding, goToStep, saveProfile,
  setStockConnected, skipOnboarding, useOnboarding, type StoreProfile,
} from "../data/onboarding";
import { useSmallerThan } from "../lib/responsive";
import classes from "./OnboardingPage.module.css";

/** Campo do formulário: rótulo, conteúdo e o erro embaixo. */
function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <Box>
      <Text size="sm" fw={600} mb={8}>{label}</Text>
      {children}
      {hint && <Text size="xs" c="dimmed" mt={6}>{hint}</Text>}
      {error && <Text size="sm" c="red.7" mt={6}>{error}</Text>}
    </Box>
  );
}

function SingleChips({ options, value, onChange }: { options: string[]; value: string | null; onChange: (v: string) => void }) {
  return (
    <Chip.Group multiple={false} value={value ?? ''} onChange={onChange}>
      <Group gap={8}>{options.map(o => <Chip key={o} value={o} variant="outline" size="sm">{o}</Chip>)}</Group>
    </Chip.Group>
  );
}

function MultiChips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <Chip.Group multiple value={value} onChange={onChange}>
      <Group gap={8}>{options.map(o => <Chip key={o} value={o} variant="outline" size="sm">{o}</Chip>)}</Group>
    </Chip.Group>
  );
}

// ---------------------------------------------------------------------------
// Etapa 1: perfil da loja
// ---------------------------------------------------------------------------
function ProfileStep({ initial }: { initial: StoreProfile }) {
  const [p, setP] = useState(initial);
  const [tried, setTried] = useState(false);
  const errors = {
    name: !p.name.trim() ? 'Informe o nome da loja' : undefined,
    segment: !p.segment ? 'Escolha um segmento' : undefined,
    size: !p.size ? 'Escolha o porte' : undefined,
    region: !p.region ? 'Escolha a região' : undefined,
  };
  const valid = !Object.values(errors).some(Boolean);
  const err = (k: keyof typeof errors) => (tried ? errors[k] : undefined);

  return (
    <Stack gap="xl">
      <Box>
        <Title order={1}>Perfil da loja</Title>
        <Text c="dimmed" mt={6}>Alimenta o Radar e a curva de tamanhos sugerida no catálogo</Text>
      </Box>

      <TextInput
        label="Nome da loja"
        value={p.name}
        onChange={e => setP({ ...p, name: e.currentTarget.value })}
        error={err('name')}
        maw={560}
      />

      <Group align="flex-start" gap="xl" wrap="wrap">
        <Box flex="1 1 280px">
          <Field label="Segmento" error={err('segment')}>
            <SingleChips options={SEGMENTS} value={p.segment} onChange={v => setP({ ...p, segment: v })} />
          </Field>
        </Box>
        <Box flex="1 1 280px">
          <Field label="Porte" hint="Pelo faturamento anual: até R$ 4,8 mi é pequena, até R$ 300 mi é média" error={err('size')}>
            <SingleChips options={STORE_SIZES} value={p.size} onChange={v => setP({ ...p, size: v })} />
          </Field>
        </Box>
      </Group>

      <Select
        label="Região"
        data={REGIONS}
        value={p.region}
        onChange={v => setP({ ...p, region: v })}
        error={err('region')}
        allowDeselect={false}
        maw={400}
      />

      <Field label="Público">
        <MultiChips options={AUDIENCES} value={p.audience} onChange={v => setP({ ...p, audience: v })} />
      </Field>

      <Field label="O que diferencia sua loja">
        <MultiChips options={DIFFERENTIALS} value={p.differentials} onChange={v => setP({ ...p, differentials: v })} />
      </Field>

      <Field label="Como você vende hoje">
        <SingleChips options={CHANNELS} value={p.channel} onChange={v => setP({ ...p, channel: v })} />
      </Field>

      <Group>
        <Button
          size="md"
          rightSection={<ArrowRightIcon size={18} />}
          onClick={() => { setTried(true); if (valid) saveProfile(p); }}
        >
          Continuar
        </Button>
      </Group>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Etapa 2: integração de dados
// ---------------------------------------------------------------------------
function DataStep({ connected }: { connected: boolean }) {
  const [connecting, setConnecting] = useState(false);
  const connect = () => {
    if (connected || connecting) return;
    setConnecting(true);
    // mock da autorização no Pace Stock
    setTimeout(() => { setConnecting(false); setStockConnected(true); }, 1200);
  };

  return (
    <Stack gap="xl">
      <Box>
        <Title order={1}>Integração de dados</Title>
        <Text c="dimmed" mt={6}>Com o estoque conectado, o Radar recomenda pela venda real da loja</Text>
      </Box>

      <Stack gap="md">
        <Text size="sm" fw={600}>Estoque e vendas</Text>
        <UnstyledButton
          className={classes.connect}
          data-connected={connected || undefined}
          data-disabled={connected || undefined}
          onClick={connect}
          aria-busy={connecting}
        >
          <span className={classes.connectIcon} aria-hidden>
            {connected ? <CheckCircleIcon size={22} weight="fill" color="var(--mantine-color-teal-7)" /> : <StackIcon size={20} />}
          </span>
          <Box flex={1} miw={0}>
            <Text fw={600}>{connected ? 'Estoque conectado via Pace Stock' : 'Conectar meu estoque via Pace Stock'}</Text>
            <Text size="sm" c="dimmed">
              {connected ? '316 pares sincronizados agora' : 'Recomendações pela venda real desde o primeiro dia'}
            </Text>
          </Box>
          {connecting ? <Loader size="sm" /> : !connected && <CaretRightIcon size={18} color="var(--mantine-color-dimmed)" />}
        </UnstyledButton>
        {connected && (
          <Group>
            <Button variant="subtle" color="gray" size="compact-sm" onClick={() => setStockConnected(false)}>Desconectar</Button>
          </Group>
        )}

        {!connected && (
          <>
            <Divider label="ou continue sem conectar" labelPosition="center" />
            <Alert color="yellow" variant="light" icon={<WarningIcon size={20} />}>
              Sem conectar, o Radar começa sem dados de venda. As recomendações ficam genéricas até a loja
              ter pedidos suficientes no Pace Seller, o que costuma levar alguns meses.
            </Alert>
          </>
        )}
      </Stack>

      <Group gap="sm">
        <Button size="md" variant="default" onClick={() => goToStep(0)}>Voltar</Button>
        <Button size="md" onClick={finishOnboarding} rightSection={<ArrowRightIcon size={18} />}>Ir para o Radar</Button>
      </Group>
    </Stack>
  );
}

/**
 * Configuração da loja (lojista): abre no primeiro acesso. "Já configurei, ir pro Radar" pula
 * e o Radar passa a mostrar um aviso para retomar.
 */
export function OnboardingPage() {
  const ob = useOnboarding();
  const mobile = useSmallerThan('sm');

  return (
    <div className={classes.page}>
      <aside className={classes.rail}>
        <Stack gap="lg">
          <Box>
            <Text size="sm" c="dimmed">Configuração da loja</Text>
            <Title order={2} mt={6}>Conte sobre sua loja</Title>
            <Text size="sm" c="dimmed" mt={8}>Assim o Radar traz oportunidades certas desde o primeiro dia</Text>
          </Box>
          <Group>
            <Button variant="default" radius="xl" size="sm" rightSection={<ArrowRightIcon size={16} />} onClick={skipOnboarding}>
              Já configurei, ir pro Radar
            </Button>
          </Group>
          <Stepper
            active={ob.step}
            onStepClick={s => { if (s === 0 || ob.profileSaved) goToStep(s as 0 | 1); }}
            orientation={mobile ? 'horizontal' : 'vertical'}
            size="sm"
            color="brand"
            mt="md"
          >
            <Stepper.Step label="Perfil da loja" description={mobile ? undefined : "Segmento, região e diferenciais"} />
            <Stepper.Step label="Integração de dados" description={mobile ? undefined : "Estoque e vendas"} allowStepSelect={ob.profileSaved} />
          </Stepper>
        </Stack>
      </aside>

      <main className={classes.content}>
        {ob.step === 0
          ? <ProfileStep initial={ob.profile} />
          : <DataStep connected={ob.stockConnected} />}
      </main>
    </div>
  );
}
