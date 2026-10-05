import {
  HeadsetIcon,
  PhoneIcon,
  EnvelopeSimpleIcon,
  WhatsappLogoIcon,
  ArrowUpRightIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { Stack, Group, Box, Paper, Text, Title, ThemeIcon, Avatar, Anchor, SimpleGrid } from "@mantine/core";

// Contatos mock até existirem no cadastro do lojista (mesmo representante do Meu Perfil)
const SUPPORT = {
  phone: '(11) 3456-7890',
  phoneHref: 'tel:+551134567890',
  email: 'suporte@tesla.com.br',
  hours: 'Seg a sex, 8h às 18h',
};

const REP = {
  name: 'Marina Costa',
  initials: 'MC',
  role: 'Representante comercial',
  region: 'Sudeste — SP Capital',
  phone: '(11) 98765-4321',
  phoneHref: 'tel:+5511987654321',
  whatsappHref: 'https://wa.me/5511987654321',
  email: 'marina.costa@tesla.com.br',
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.06em' }}>
      {children}
    </Text>
  );
}

interface ContactCardProps {
  icon: PhosphorIcon;
  label: string;
  value: string;
  hint?: string;
  actionLabel: string;
  href: string;
  external?: boolean;
}

function ContactCard({ icon: Icon, label, value, hint, actionLabel, href, external }: ContactCardProps) {
  return (
    <Paper withBorder p="lg">
      <Stack gap="xs" h="100%">
        <Group gap={6} wrap="nowrap" c="dimmed">
          <Icon size={14} />
          <Text size="xs" fw={700} tt="uppercase" style={{ letterSpacing: '0.06em' }}>{label}</Text>
        </Group>
        <Box miw={0}>
          <Text fw={600} size="lg" truncate title={value}>{value}</Text>
          {hint && <Text c="dimmed" size="sm" mt={4}>{hint}</Text>}
        </Box>
        <Anchor
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
          size="sm"
          c="var(--mantine-color-text)"
          mt="auto"
        >
          <Group gap={4} wrap="nowrap" component="span">
            {actionLabel}
            <ArrowUpRightIcon size={12} />
          </Group>
        </Anchor>
      </Stack>
    </Paper>
  );
}

export function SupportPage() {
  return (
    <Stack gap="xl" maw={1400} mx="auto" p={{ base: 'md', sm: 'lg' }} w="100%">
      <Group gap="sm" wrap="nowrap">
        <ThemeIcon size={40} variant="light" color="neutral">
          <HeadsetIcon size={20} />
        </ThemeIcon>
        <Box>
          <Title order={1}>Suporte</Title>
          <Text c="dimmed" size="sm">Fale com a Tesla Footwear ou com o seu representante</Text>
        </Box>
      </Group>

      <Stack gap="sm">
        <SectionLabel>Atendimento Tesla Footwear</SectionLabel>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          <ContactCard
            icon={PhoneIcon}
            label="Telefone"
            value={SUPPORT.phone}
            hint={SUPPORT.hours}
            actionLabel="Ligar agora"
            href={SUPPORT.phoneHref}
          />
          <ContactCard
            icon={EnvelopeSimpleIcon}
            label="E-mail"
            value={SUPPORT.email}
            hint={SUPPORT.hours}
            actionLabel="Escrever e-mail"
            href={`mailto:${SUPPORT.email}`}
          />
        </SimpleGrid>
      </Stack>

      <Stack gap="sm">
        <SectionLabel>Seu representante</SectionLabel>
        <Group gap="sm" wrap="nowrap">
          <Avatar color="neutral" radius="xl">{REP.initials}</Avatar>
          <Box miw={0}>
            <Text fw={600} truncate>{REP.name}</Text>
            <Text c="dimmed" size="sm" truncate>{REP.role} · {REP.region}</Text>
          </Box>
        </Group>
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          <ContactCard
            icon={PhoneIcon}
            label="Telefone"
            value={REP.phone}
            actionLabel="Ligar"
            href={REP.phoneHref}
          />
          <ContactCard
            icon={WhatsappLogoIcon}
            label="WhatsApp"
            value={REP.phone}
            actionLabel="Abrir conversa"
            href={REP.whatsappHref}
            external
          />
          <ContactCard
            icon={EnvelopeSimpleIcon}
            label="E-mail"
            value={REP.email}
            actionLabel="Escrever e-mail"
            href={`mailto:${REP.email}`}
          />
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
