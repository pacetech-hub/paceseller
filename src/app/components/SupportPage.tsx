import {
  HeadsetIcon,
  PhoneIcon,
  EnvelopeSimpleIcon,
  WhatsappLogoIcon,
  ArrowUpRightIcon,
  FloppyDiskIcon,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Stack, Group, Box, Paper, Text, Title, ThemeIcon, Avatar, Anchor, SimpleGrid, TextInput, Button } from "@mantine/core";
import { toast } from "../lib/toast";
import {
  useSupportContacts, saveSupportContact, saveRepContact,
  telHref, whatsappHref, initialsOf, isValidPhone, isValidEmail,
  type SupportContact, type RepContact,
} from "../data/supportContacts";

type Profile = 'admin' | 'rep' | 'lojista';

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

function SupportContacts({ support }: { support: SupportContact }) {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      <ContactCard
        icon={PhoneIcon}
        label="Telefone"
        value={support.phone}
        hint={support.hours}
        actionLabel="Ligar agora"
        href={telHref(support.phone)}
      />
      <ContactCard
        icon={EnvelopeSimpleIcon}
        label="E-mail"
        value={support.email}
        hint={support.hours}
        actionLabel="Escrever e-mail"
        href={`mailto:${support.email}`}
      />
    </SimpleGrid>
  );
}

function RepContacts({ rep }: { rep: RepContact }) {
  return (
    <>
      <Group gap="sm" wrap="nowrap">
        <Avatar color="neutral" radius="xl">{initialsOf(rep.name)}</Avatar>
        <Box miw={0}>
          <Text fw={600} truncate>{rep.name}</Text>
          <Text c="dimmed" size="sm" truncate>{[rep.role, rep.region].filter(Boolean).join(' · ')}</Text>
        </Box>
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        <ContactCard
          icon={PhoneIcon}
          label="Telefone"
          value={rep.phone}
          actionLabel="Ligar"
          href={telHref(rep.phone)}
        />
        <ContactCard
          icon={WhatsappLogoIcon}
          label="WhatsApp"
          value={rep.whatsapp}
          actionLabel="Abrir conversa"
          href={whatsappHref(rep.whatsapp)}
          external
        />
        <ContactCard
          icon={EnvelopeSimpleIcon}
          label="E-mail"
          value={rep.email}
          actionLabel="Escrever e-mail"
          href={`mailto:${rep.email}`}
        />
      </SimpleGrid>
    </>
  );
}

// ---------- formulários de edição (indústria e representante) ----------

type FieldDef<T> = {
  key: keyof T & string;
  label: string;
  placeholder: string;
  description?: string;
  type?: 'tel' | 'email' | 'text';
  autoComplete?: string;
  validate?: (v: string) => string | null;
};

const required = (label: string) => (v: string) => v.trim() ? null : `Informe ${label}`;
const phoneRule = (v: string) => !v.trim() ? 'Informe o telefone' : isValidPhone(v) ? null : 'Telefone com DDD, ex.: (11) 3456-7890';
const emailRule = (v: string) => !v.trim() ? 'Informe o e-mail' : isValidEmail(v) ? null : 'E-mail inválido, ex.: nome@empresa.com.br';

const SUPPORT_FIELDS: FieldDef<SupportContact>[] = [
  { key: 'phone', label: 'Telefone', placeholder: '(11) 3456-7890', type: 'tel', validate: phoneRule },
  { key: 'email', label: 'E-mail', placeholder: 'suporte@empresa.com.br', type: 'email', validate: emailRule },
  { key: 'hours', label: 'Horário de atendimento', placeholder: 'Seg a sex, 8h às 18h', description: 'Aparece abaixo do telefone e do e-mail', validate: required('o horário') },
];

const REP_FIELDS: FieldDef<RepContact>[] = [
  { key: 'name', label: 'Nome', placeholder: 'ex.: Marina Costa', autoComplete: 'name', validate: required('o nome') },
  { key: 'role', label: 'Cargo', placeholder: 'Representante comercial', validate: required('o cargo') },
  { key: 'region', label: 'Região de atendimento', placeholder: 'ex.: Sudeste — SP Capital' },
  { key: 'phone', label: 'Telefone', placeholder: '(11) 98765-4321', type: 'tel', autoComplete: 'tel', validate: phoneRule },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '(11) 98765-4321', type: 'tel', description: 'Número usado no botão "Abrir conversa"', validate: phoneRule },
  { key: 'email', label: 'E-mail', placeholder: 'nome@empresa.com.br', type: 'email', autoComplete: 'email', validate: emailRule },
];

interface ContactFormProps<T extends object> {
  title: string;
  description: string;
  fields: FieldDef<T>[];
  value: T;
  onSave: (v: T) => void;
}

function ContactForm<T extends object>({ title, description, fields, value, onSave }: ContactFormProps<T>) {
  const [draft, setDraft] = useState<T>(value);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const get = (k: string) => String((draft as Record<string, unknown>)[k] ?? '');
  const dirty = fields.some(f => get(f.key).trim() !== String((value as Record<string, unknown>)[f.key] ?? ''));

  const submit = () => {
    const next: Partial<Record<string, string>> = {};
    for (const f of fields) {
      const err = f.validate?.(get(f.key));
      if (err) next[f.key] = err;
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    const trimmed = { ...draft } as Record<string, unknown>;
    for (const f of fields) trimmed[f.key] = get(f.key).trim();
    setDraft(trimmed as T);
    onSave(trimmed as T);
  };

  const discard = () => { setDraft(value); setErrors({}); };

  return (
    <Paper withBorder p={{ base: 'md', sm: 'lg' }}>
      <Box component="form" onSubmit={(e: React.FormEvent) => { e.preventDefault(); submit(); }}>
        <Text fw={600} size="lg">{title}</Text>
        <Text c="dimmed" size="sm" mt={4} mb="md">{description}</Text>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {fields.map(f => (
            <TextInput
              key={f.key}
              label={f.label}
              description={f.description}
              placeholder={f.placeholder}
              type={f.type ?? 'text'}
              inputMode={f.type === 'tel' ? 'tel' : undefined}
              autoComplete={f.autoComplete}
              maxLength={120}
              value={get(f.key)}
              onChange={e => {
                const v = e.currentTarget.value;
                setDraft(d => ({ ...d, [f.key]: v }));
                setErrors(p => ({ ...p, [f.key]: undefined }));
              }}
              error={errors[f.key]}
            />
          ))}
        </SimpleGrid>
        <Group justify="flex-end" gap="sm" mt="lg">
          <Button variant="default" onClick={discard} disabled={!dirty}>Descartar</Button>
          <Button type="submit" color="neutral" leftSection={<FloppyDiskIcon size={16} />} disabled={!dirty}>
            Salvar Alterações
          </Button>
        </Group>
      </Box>
    </Paper>
  );
}

function PageHeader({ subtitle }: { subtitle: string }) {
  return (
    <Group gap="sm" wrap="nowrap">
      <ThemeIcon size={40} variant="light" color="neutral">
        <HeadsetIcon size={20} />
      </ThemeIcon>
      <Box>
        <Title order={1}>Suporte</Title>
        <Text c="dimmed" size="sm">{subtitle}</Text>
      </Box>
    </Group>
  );
}

export function SupportPage({ profile }: { profile: Profile }) {
  const { support, rep } = useSupportContacts();

  // Indústria: edita o atendimento Tesla Footwear
  if (profile === 'admin') {
    return (
      <Stack gap="xl" maw={1400} mx="auto" p={{ base: 'md', sm: 'lg' }} w="100%">
        <PageHeader subtitle="Contatos de atendimento exibidos para os lojistas" />
        <ContactForm
          title="Atendimento Tesla Footwear"
          description="Telefone, e-mail e horário que o lojista vê na página Suporte"
          fields={SUPPORT_FIELDS}
          value={support}
          onSave={v => {
            saveSupportContact(v);
            toast.success('Atendimento atualizado', 'Os lojistas já veem os novos contatos na página Suporte');
          }}
        />
        <Stack gap="sm">
          <SectionLabel>Como o lojista vê</SectionLabel>
          <SupportContacts support={support} />
        </Stack>
      </Stack>
    );
  }

  // Representante: edita os próprios dados ("Seu representante")
  if (profile === 'rep') {
    return (
      <Stack gap="xl" maw={1400} mx="auto" p={{ base: 'md', sm: 'lg' }} w="100%">
        <PageHeader subtitle="Seus contatos exibidos para os lojistas da sua carteira" />
        <ContactForm
          title="Seu representante"
          description="Dados que os lojistas da sua carteira veem na página Suporte"
          fields={REP_FIELDS}
          value={rep}
          onSave={v => {
            saveRepContact(v);
            toast.success('Seus contatos foram atualizados', 'Os lojistas já veem os novos dados na página Suporte');
          }}
        />
        <Stack gap="sm">
          <SectionLabel>Como o lojista vê</SectionLabel>
          <RepContacts rep={rep} />
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack gap="xl" maw={1400} mx="auto" p={{ base: 'md', sm: 'lg' }} w="100%">
      <PageHeader subtitle="Fale com a Tesla Footwear ou com o seu representante" />

      <Stack gap="sm">
        <SectionLabel>Atendimento Tesla Footwear</SectionLabel>
        <SupportContacts support={support} />
      </Stack>

      <Stack gap="sm">
        <SectionLabel>Seu representante</SectionLabel>
        <RepContacts rep={rep} />
      </Stack>
    </Stack>
  );
}
