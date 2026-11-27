import { useState, type ReactNode } from "react";
import {
  Alert, Box, Button, Chip, Divider, Group, Loader, Progress, Select, Stack, Stepper, Text, TextInput, Title, UnstyledButton,
} from "@mantine/core";
import { ArrowRightIcon, CaretRightIcon, CheckCircleIcon, StackIcon, WarningIcon } from "@phosphor-icons/react";
import {
  AUDIENCES, CHANNELS, DIFFERENTIALS, LAST_STEP, ONBOARDING_STEPS, REGIONS, SEGMENTS, STORE_SIZES, answerStep,
  finishOnboarding, goToStep, setStockConnected, skipOnboarding, useOnboarding, type OnboardingStepKey, type StoreProfile,
} from "../data/onboarding";
import { useSmallerThan } from "../lib/responsive";
import classes from "./OnboardingPage.module.css";

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
// Perguntas do perfil: uma por etapa
// ---------------------------------------------------------------------------
interface Question {
  title: string;
  help?: string;
  /** Mensagem quando a resposta obrigatória está vazia. */
  missing?: string;
  isEmpty: (p: StoreProfile) => boolean;
  render: (p: StoreProfile, set: (patch: Partial<StoreProfile>) => void, submit: () => void) => ReactNode;
}

const QUESTIONS: Record<Exclude<OnboardingStepKey, 'stock'>, Question> = {
  name: {
    title: 'Qual o nome da sua loja?',
    missing: 'Informe o nome da loja',
    isEmpty: p => !p.name.trim(),
    render: (p, set, submit) => (
      <TextInput
        aria-label="Nome da loja"
        value={p.name}
        onChange={e => set({ name: e.currentTarget.value })}
        onKeyDown={e => { if (e.key === 'Enter') submit(); }}
        data-autofocus
        autoFocus
        size="md"
        maw={480}
      />
    ),
  },
  segment: {
    title: 'Qual o segmento da loja?',
    missing: 'Escolha um segmento',
    isEmpty: p => !p.segment,
    render: (p, set) => <SingleChips options={SEGMENTS} value={p.segment} onChange={v => set({ segment: v })} />,
  },
  size: {
    title: 'Qual o porte da loja?',
    help: 'Pelo faturamento anual: até R$ 4,8 mi é pequena, até R$ 300 mi é média',
    missing: 'Escolha o porte',
    isEmpty: p => !p.size,
    render: (p, set) => <SingleChips options={STORE_SIZES} value={p.size} onChange={v => set({ size: v })} />,
  },
  region: {
    title: 'Onde fica a loja?',
    missing: 'Escolha a região',
    isEmpty: p => !p.region,
    render: (p, set) => (
      <Select aria-label="Região" data={REGIONS} value={p.region} onChange={v => set({ region: v })} allowDeselect={false} size="md" maw={400} />
    ),
  },
  audience: {
    title: 'Quem compra na sua loja?',
    help: 'Escolha quantos quiser',
    isEmpty: p => p.audience.length === 0,
    render: (p, set) => <MultiChips options={AUDIENCES} value={p.audience} onChange={v => set({ audience: v })} />,
  },
  differentials: {
    title: 'O que diferencia sua loja?',
    help: 'Escolha quantos quiser',
    isEmpty: p => p.differentials.length === 0,
    render: (p, set) => <MultiChips options={DIFFERENTIALS} value={p.differentials} onChange={v => set({ differentials: v })} />,
  },
  channel: {
    title: 'Como você vende hoje?',
    isEmpty: p => !p.channel,
    render: (p, set) => <SingleChips options={CHANNELS} value={p.channel} onChange={v => set({ channel: v })} />,
  },
};

function QuestionStep({ stepKey, required, initial, step }: {
  stepKey: Exclude<OnboardingStepKey, 'stock'>; required: boolean; initial: StoreProfile; step: number;
}) {
  const q = QUESTIONS[stepKey];
  const [p, setP] = useState(initial);
  const [tried, setTried] = useState(false);
  const set = (patch: Partial<StoreProfile>) => setP(prev => ({ ...prev, ...patch }));
  const empty = q.isEmpty(p);
  const submit = () => {
    setTried(true);
    if (required && empty) return;
    answerStep(p);
  };

  return (
    <Stack gap="xl">
      <Box>
        <Title order={1}>{q.title}</Title>
        {q.help && <Text c="dimmed" mt={6}>{q.help}</Text>}
      </Box>
      <Box>
        {q.render(p, set, submit)}
        {tried && required && empty && <Text size="sm" c="red.7" mt={8}>{q.missing}</Text>}
      </Box>
      <Group gap="sm">
        {step > 0 && <Button size="md" variant="default" onClick={() => goToStep(step - 1)}>Voltar</Button>}
        <Button size="md" rightSection={<ArrowRightIcon size={18} />} onClick={submit}>Continuar</Button>
        {!required && empty && (
          <Button size="md" variant="subtle" color="gray" onClick={() => answerStep(p)}>Pular</Button>
        )}
      </Group>
    </Stack>
  );
}

// ---------------------------------------------------------------------------
// Última etapa: estoque
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
        <Title order={1}>Conecte o estoque da loja</Title>
        <Text c="dimmed" mt={6}>Com o estoque conectado, o Radar recomenda pela venda real da loja</Text>
      </Box>

      <Stack gap="md">
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
        <Button size="md" variant="default" onClick={() => goToStep(LAST_STEP - 1)}>Voltar</Button>
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
  const current = ONBOARDING_STEPS[ob.step];

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
          {mobile ? (
            <Box>
              <Group justify="space-between" mb={6}>
                <Text size="sm" fw={600}>{ONBOARDING_STEPS[ob.step].label}</Text>
                <Text size="sm" c="dimmed">{ob.step + 1} de {ONBOARDING_STEPS.length}</Text>
              </Group>
              <Progress value={((ob.step + 1) / ONBOARDING_STEPS.length) * 100} size="sm" color="brand" aria-label={`Etapa ${ob.step + 1} de ${ONBOARDING_STEPS.length}`} />
            </Box>
          ) : (
            <Stepper
              active={ob.step}
              onStepClick={goToStep}
              orientation="vertical"
              size="xs"
              color="brand"
              mt="md"
              // oito etapas: passos mais baixos para a lista caber na tela
              styles={{ step: { minHeight: 52 }, stepDescription: { marginTop: 0 } }}
            >
              {ONBOARDING_STEPS.map((st, i) => (
                <Stepper.Step
                  key={st.key}
                  label={st.label}
                  description={st.required ? undefined : 'Opcional'}
                  allowStepSelect={i <= Math.min(ob.completed, LAST_STEP)}
                />
              ))}
            </Stepper>
          )}
        </Stack>
      </aside>

      <main className={classes.content}>
        {current.key === 'stock'
          ? <DataStep connected={ob.stockConnected} />
          : <QuestionStep key={current.key} stepKey={current.key} required={current.required} initial={ob.profile} step={ob.step} />}
      </main>
    </div>
  );
}
