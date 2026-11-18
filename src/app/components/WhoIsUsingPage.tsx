import { useEffect, useState } from "react";
import { Anchor, Avatar, Badge, Box, Button, Group, Image, Paper, SimpleGrid, Stack, Text, Title, UnstyledButton } from "@mantine/core";
import { BackspaceIcon, CaretLeftIcon, CaretRightIcon, PlusIcon } from "@phosphor-icons/react";
import teslaLogo from "../../assets/tesla-footwear-logo.png";
import loginBanner from "../../assets/banner-edicao-limitada.webp";
import { linkedUsers, type LinkedUser } from "../data/linkedUsers";
import loginClasses from "./LoginPage.module.css";
import classes from "./WhoIsUsingPage.module.css";

/** PIN de demonstração, igual para todos os prepostos (mock até existir cadastro de PIN). */
const DEMO_PIN = '1234';
const PIN_LENGTH = 4;

const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();

/** Pessoas ativas vinculadas à conta do representante: o titular primeiro, depois os prepostos. */
export function accountPeople(repName: string): LinkedUser[] {
  return linkedUsers
    .filter(u => u.ownerType === 'representante' && u.ownerName === repName && u.status === 'ativo')
    .sort((a, b) => Number(b.name === repName) - Number(a.name === repName));
}

interface WhoIsUsingPageProps {
  /** Nome do titular da conta. */
  repName: string;
  /** Entra no app operando como esta pessoa. */
  onSelect: (person: LinkedUser) => void;
  /** Entra como titular e abre Permissões, onde se cadastra um preposto. */
  onAddAssistant: (titular: LinkedUser) => void;
  onLogout: () => void;
}

/**
 * Quem está usando agora (0.4) e PIN do preposto (0.5).
 * A conta do representante é compartilhada com a equipe; cada ação fica registrada em nome de quem opera.
 * O PIN só identifica a pessoa na sessão: não substitui a senha da conta.
 */
export function WhoIsUsingPage({ repName, onSelect, onAddAssistant, onLogout }: WhoIsUsingPageProps) {
  const people = accountPeople(repName);
  const titular = people.find(p => p.name === repName) ?? people[0];
  const [pinFor, setPinFor] = useState<LinkedUser | null>(null);

  const choose = (person: LinkedUser) => {
    if (person.id === titular?.id) onSelect(person);
    else setPinFor(person);
  };

  return (
    <Box mih="100dvh" bg={`var(--mantine-color-dark-7) url(${loginBanner})`} bgsz="cover" bgp="30% center">
      <Paper className={loginClasses.form} px={{ base: 'lg', xs: 'xl' }} pb="xl" pt={{ base: 48, sm: 80 }}>
        <Box mb={{ base: 'xl', sm: 48 }}>
          <Image src={teslaLogo} alt="Tesla Footwear" h={32} w="auto" fit="contain" />
        </Box>

        {pinFor && titular ? (
          <PinStep
            person={pinFor}
            titular={titular}
            onBack={() => setPinFor(null)}
            onConfirm={() => onSelect(pinFor)}
            onEnterAsTitular={() => onSelect(titular)}
          />
        ) : (
          <>
            <Title order={1} mb={4}>Quem está usando agora?</Title>
            <Text c="dimmed" size="sm" mb="xl">
              A conta de {repName} é usada pela equipe. Cada pedido, comentário e ajuste fica registrado em nome de quem você escolher.
            </Text>

            <Stack gap="sm" role="list">
              {people.map(person => {
                const isTitular = person.id === titular?.id;
                return (
                  <UnstyledButton key={person.id} role="listitem" className={classes.person} onClick={() => choose(person)}>
                    <Avatar size={44} radius="xl" color="neutral" variant={isTitular ? 'filled' : 'light'}>
                      {initials(person.name)}
                    </Avatar>
                    <Box flex={1} miw={0}>
                      <Group gap="xs" wrap="nowrap">
                        <Text fw={600} truncate>{person.name}</Text>
                        <Badge variant={isTitular ? 'filled' : 'default'} color="neutral" styles={{ label: { textTransform: 'none' } }}>
                          {isTitular ? 'Titular' : 'Preposto'}
                        </Badge>
                      </Group>
                      <Text c="dimmed" size="sm" truncate>{isTitular ? 'Entra direto' : 'Confirma com PIN'}</Text>
                    </Box>
                    <CaretRightIcon size={18} aria-hidden />
                  </UnstyledButton>
                );
              })}
            </Stack>

            <Button variant="default" mt="md" leftSection={<PlusIcon size={16} />} onClick={() => titular && onAddAssistant(titular)}>
              Adicionar preposto
            </Button>
            <Text c="dimmed" size="sm" mt={6}>Abre Permissões como {repName}.</Text>

            <Anchor component="button" type="button" mt="xl" size="sm" onClick={onLogout} style={{ alignSelf: 'flex-start' }}>
              Sair e entrar com outra conta
            </Anchor>
          </>
        )}
      </Paper>
    </Box>
  );
}

function PinStep({ person, titular, onBack, onConfirm, onEnterAsTitular }: {
  person: LinkedUser;
  titular: LinkedUser;
  onBack: () => void;
  onConfirm: () => void;
  onEnterAsTitular: () => void;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const press = (digit: string) => {
    setError(null);
    setPin(p => (p.length < PIN_LENGTH ? p + digit : p));
  };
  const erase = () => {
    setError(null);
    setPin(p => p.slice(0, -1));
  };

  // Ao completar 4 dígitos, confere; errado, limpa e avisa
  useEffect(() => {
    if (pin.length < PIN_LENGTH) return;
    if (pin === DEMO_PIN) { onConfirm(); return; }
    setError('PIN incorreto. Digite de novo.');
    setPin('');
  }, [pin, onConfirm]);

  // Teclado físico também funciona
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') erase();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <Button variant="subtle" color="gray" ml={-12} mb="md" leftSection={<CaretLeftIcon size={16} />} onClick={onBack} style={{ alignSelf: 'flex-start' }}>
        Trocar pessoa
      </Button>

      <Stack align="center" gap={4}>
        <Avatar size={64} radius="xl" color="neutral" variant="light">{initials(person.name)}</Avatar>
        <Title order={1} size="h2" mt="sm" ta="center">Olá, {person.name.split(' ')[0]}</Title>
        <Text c="dimmed" size="sm" ta="center">Digite seu PIN de 4 dígitos para confirmar que é você.</Text>
        <Text c="dimmed" size="sm" ta="center">Para testar, use 1234.</Text>
      </Stack>

      <Group justify="center" gap="md" mt="xl" role="status" aria-label={`${pin.length} de ${PIN_LENGTH} dígitos digitados`}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <span key={i} className={classes.dot} data-filled={i < pin.length || undefined} data-error={error ? true : undefined} />
        ))}
      </Group>
      <Text c="red" size="sm" ta="center" mt="sm" mih={20} aria-live="polite">{error}</Text>

      <SimpleGrid cols={3} spacing="sm" mt="md" maw={300} mx="auto" w="100%">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
          <Button key={d} variant="default" h={56} fz="xl" className="mono" onClick={() => press(d)}>{d}</Button>
        ))}
        <Box />
        <Button variant="default" h={56} fz="xl" className="mono" onClick={() => press('0')}>0</Button>
        <Button variant="subtle" color="neutral" h={56} onClick={erase} aria-label="Apagar dígito">
          <BackspaceIcon size={22} />
        </Button>
      </SimpleGrid>

      <Text size="sm" ta="center" mt="xl">
        Esqueceu o PIN?{' '}
        <Anchor component="button" type="button" size="sm" onClick={onEnterAsTitular}>
          Entrar como {titular.name}
        </Anchor>
      </Text>
    </>
  );
}
