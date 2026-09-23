import { useState } from "react";
import { ArrowRightIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import {
  Anchor,
  Avatar,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Group,
  Image,
  List,
  PasswordInput,
  Select,
  Stack,
  Text,
  ThemeIcon,
  TextInput,
  Title,
} from "@mantine/core";
import { isEmail, isNotEmpty, useForm } from "@mantine/form";
import teslaLogo from "../../assets/tesla-footwear-logo.png";

type Profile = "admin" | "rep" | "lojista";

interface LoginPageProps {
  onLogin: (profile: Profile) => void;
}

const profiles: { value: Profile; label: string }[] = [
  { value: "admin", label: "Indústria" },
  { value: "rep", label: "Representante" },
  { value: "lojista", label: "Lojista" },
];

const highlights = [
  "Pedidos por grade em menos de 2 minutos",
  "Sell-out em tempo real por loja e região",
  "Campanhas criadas com IA generativa",
];

const activeRetailers = ["MA", "FL", "CM", "AS"];

export function LoginPage({ onLogin }: LoginPageProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm({
    mode: "uncontrolled",
    initialValues: {
      profile: "admin" as Profile,
      email: "admin@teslafootwear.com.br",
      password: "••••••••",
    },
    validate: {
      email: isEmail("Informe um e-mail válido"),
      password: isNotEmpty("Informe sua senha"),
    },
  });

  const handleSubmit = form.onSubmit(({ profile }) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(profile);
    }, 1000);
  });

  return (
    <Flex mih="100vh" bg="var(--background)">
      {/* Painel esquerdo */}
      <Flex
        visibleFrom="lg"
        w="45%"
        direction="column"
        justify="space-between"
        p={48}
        pos="relative"
        style={{
          borderRight: "1px solid var(--border)",
          backgroundImage:
            "radial-gradient(circle at 20% 50%, oklch(0.6 0.22 262 / 0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, oklch(0.72 0.15 48 / 0.04) 0%, transparent 40%), linear-gradient(to bottom right, color-mix(in oklch, var(--primary) 10%, transparent), var(--background))",
        }}
      >
        <Image src={teslaLogo} alt="Tesla Footwear" h={32} w="auto" fit="contain" style={{ alignSelf: "flex-start" }} />

        <Stack gap="xl">
          <Box>
            <Title order={1} fz="2.5rem" fw={700} lh={1.15} mb="md" style={{ letterSpacing: "-0.03em" }}>
              Venda mais.
              <br />
              Com mais inteligência.
            </Title>
            <Text c="dimmed" size="md" lh={1.6}>
              Catálogo digital, pedidos por grade, marketing com IA e inteligência de sell-out em uma
              única plataforma.
            </Text>
          </Box>

          <List
            spacing="sm"
            size="sm"
            c="dimmed"
            center
            icon={<ThemeIcon size={6} radius="xl" color="neutral" />}
          >
            {highlights.map((item) => (
              <List.Item key={item}>{item}</List.Item>
            ))}
          </List>
        </Stack>

        <Group gap="md">
          <Avatar.Group spacing={8}>
            {activeRetailers.map((initials, i) => (
              <Avatar
                key={initials}
                size={32}
                radius="xl"
                variant="filled"
                styles={{
                  root: { border: "2px solid var(--background)" },
                  placeholder: {
                    background: `oklch(${0.55 + i * 0.05} 0.18 ${262 + i * 30})`,
                    color: "white",
                    fontSize: "0.65rem",
                    fontWeight: 600,
                  },
                }}
              >
                {initials}
              </Avatar>
            ))}
          </Avatar.Group>
          <Text c="dimmed" size="0.8rem">
            <Text span c="var(--foreground)" fw={600} inherit>
              247 lojistas
            </Text>{" "}
            ativos esta temporada
          </Text>
        </Group>
      </Flex>

      {/* Painel direito */}
      <Center p="xl" style={{ flex: 1 }}>
        <Box w="100%" maw={384}>
          <Image hiddenFrom="lg" src={teslaLogo} alt="Tesla Footwear" h={28} w="auto" fit="contain" mb={40} />

          <Box mb="xl">
            <Title order={2} fz="1.5rem" fw={700} mb={4} style={{ letterSpacing: "-0.02em" }}>
              Bem-vindo
            </Title>
            <Group gap="xs">
              <Text c="dimmed" size="sm">
                Acessando como
              </Text>
              <Select
                aria-label="Perfil de acesso"
                data={profiles}
                allowDeselect={false}
                checkIconPosition="right"
                size="xs"
                w={150}
                styles={{ input: { fontWeight: 600 } }}
                key={form.key("profile")}
                {...form.getInputProps("profile")}
              />
            </Group>
          </Box>

          <form onSubmit={handleSubmit} noValidate>
            <Stack gap="md">
              <TextInput
                type="email"
                label="E-mail"
                placeholder="seu@email.com"
                autoComplete="email"
                key={form.key("email")}
                {...form.getInputProps("email")}
              />

              <Box>
                <PasswordInput
                  label="Senha"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  visibilityToggleIcon={({ reveal }) =>
                    reveal ? <EyeSlashIcon size={16} /> : <EyeIcon size={16} />
                  }
                  key={form.key("password")}
                  {...form.getInputProps("password")}
                />
                <Group justify="flex-end" mt={6}>
                  <Anchor component="button" type="button" size="0.78rem" c="neutral">
                    Esqueceu a senha?
                  </Anchor>
                </Group>
              </Box>

              <Button
                type="submit"
                fullWidth
                color="neutral"
                loading={loading}
                rightSection={<ArrowRightIcon size={16} />}
              >
                Entrar
              </Button>
            </Stack>
          </form>

          <Divider my="lg" />
          <Text c="dimmed" size="0.78rem" ta="center">
            Pace Seller desenvolvido por Pace Tech
          </Text>
        </Box>
      </Center>
    </Flex>
  );
}
