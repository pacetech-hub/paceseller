import { useState } from "react";
import {
  Avatar, Box, Button, Flex, Group, PasswordInput, Select, Stack, Text, TextInput, Title, UnstyledButton,
} from "@mantine/core";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import teslaLogo from "../../assets/tesla-footwear-logo.png";
import classes from "./LoginPage.module.css";

type Profile = "admin" | "rep" | "lojista";

interface LoginPageProps {
  onLogin: (profile: Profile) => void;
}

const profiles = [
  { id: "admin" as Profile, label: "Indústria" },
  { id: "rep" as Profile, label: "Representante" },
  { id: "lojista" as Profile, label: "Lojista" },
];

const avatarColors = ["indigo", "violet", "grape", "pink"];

const inputStyles = {
  label: { fontSize: "0.8rem", fontWeight: 500, color: "var(--mantine-color-dimmed)", marginBottom: 6 },
  input: { height: 42, fontSize: "0.875rem", backgroundColor: "var(--mantine-color-gray-0)" },
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("admin@teslafootwear.com.br");
  const [password, setPassword] = useState("••••••••");
  const [selectedProfile, setSelectedProfile] = useState<Profile>("admin");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(selectedProfile);
    }, 1000);
  };

  return (
    <Flex mih="100vh" bg="white" pos="relative">
      {/* Left Panel */}
      <Flex
        visibleFrom="lg"
        w="45%"
        pos="relative"
        direction="column"
        justify="space-between"
        p={48}
        style={{
          backgroundImage: "linear-gradient(to bottom right, var(--mantine-color-gray-1), white, white)",
          borderRight: "1px solid var(--mantine-color-gray-3)",
        }}
      >
        <Box
          pos="absolute"
          inset={0}
          style={{
            opacity: 0.2,
            backgroundImage: `radial-gradient(circle at 20% 50%, color-mix(in srgb, var(--mantine-color-indigo-6) 30%, transparent) 0%, transparent 50%), radial-gradient(circle at 80% 20%, color-mix(in srgb, var(--mantine-color-orange-5) 20%, transparent) 0%, transparent 40%)`,
          }}
        />
        <Box pos="relative" style={{ zIndex: 10 }}>
          <Group gap="sm">
            <img src={teslaLogo} alt="Tesla Footwear" style={{ height: 32, width: "auto", objectFit: "contain" }} />
          </Group>
        </Box>

        <Stack pos="relative" gap={32} style={{ zIndex: 10 }}>
          <Box>
            <Title
              order={1}
              mb="md"
              fz="2.5rem"
              fw={700}
              lh={1.15}
              style={{ letterSpacing: "-0.03em" }}
            >
              Venda mais.
              <br />
              Com mais inteligência.
            </Title>
            <Text c="dimmed" fz="1rem" lh={1.6}>
              Catálogo digital, pedidos por grade, marketing com IA e inteligência de sell-out em
              uma única plataforma.
            </Text>
          </Box>

          <Stack gap="sm">
            {[
              "Pedidos por grade em menos de 2 minutos",
              "Sell-out em tempo real por loja e região",
              "Campanhas criadas com IA generativa",
            ].map((item, i) => (
              <Group key={i} gap="sm" wrap="nowrap">
                <Box w={6} h={6} bg="gray.9" style={{ borderRadius: "50%", flexShrink: 0 }} />
                <Text component="span" c="dimmed" fz="0.875rem">
                  {item}
                </Text>
              </Group>
            ))}
          </Stack>
        </Stack>

        <Box pos="relative" style={{ zIndex: 10 }}>
          <Group gap="md" wrap="nowrap">
            <Avatar.Group spacing={8}>
              {["MA", "FL", "CM", "AS"].map((initials, i) => (
                <Avatar
                  key={i}
                  size={32}
                  radius="xl"
                  variant="filled"
                  color={avatarColors[i]}
                  styles={{ root: { borderColor: "white" }, placeholder: { fontSize: "0.65rem", fontWeight: 600, color: "white" } }}
                >
                  {initials}
                </Avatar>
              ))}
            </Avatar.Group>
            <Text c="dimmed" fz="0.8rem">
              <Text component="span" c="var(--mantine-color-text)" fw={600} fz="inherit">
                247 lojistas
              </Text>{" "}
              ativos esta temporada
            </Text>
          </Group>
        </Box>
      </Flex>

      {/* Right Panel */}
      <Flex flex={1} align="center" justify="center" p={32}>
        <Box w="100%" maw={384}>
          <Group hiddenFrom="lg" gap="xs" mb={40}>
            <img src={teslaLogo} alt="Tesla Footwear" style={{ height: 28, width: "auto", objectFit: "contain" }} />
          </Group>

          <Box>
            <Box mb={32}>
              <Title order={2} mb={4} fz="1.5rem" fw={700} style={{ letterSpacing: "-0.02em" }}>
                Bem-vindo
              </Title>
              <Group gap={8} wrap="nowrap">
                <Text c="dimmed" fz="0.875rem">
                  Acessando como
                </Text>
                <Select
                  data-testid="profile-select"
                  value={selectedProfile}
                  onChange={(value) => {
                    if (value) setSelectedProfile(value as Profile);
                  }}
                  data={profiles.map((profile) => ({ value: profile.id, label: profile.label }))}
                  allowDeselect={false}
                  size="xs"
                  radius="sm"
                  w={150}
                  styles={{ input: { height: 32, minHeight: 32, fontSize: "0.8rem", fontWeight: 600, backgroundColor: "var(--mantine-color-gray-0)" } }}
                />
              </Group>
            </Box>

            <form onSubmit={handleLogin}>
              <Stack gap="md">
                <TextInput
                  type="email"
                  label="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  placeholder="seu@email.com"
                  radius="md"
                  styles={inputStyles}
                />

                <Box>
                  <PasswordInput
                    label="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    placeholder="••••••••"
                    radius="md"
                    visible={showPassword}
                    onVisibilityChange={() => setShowPassword(!showPassword)}
                    visibilityToggleIcon={({ reveal }) => (reveal ? <EyeOff size={16} /> : <Eye size={16} />)}
                    styles={inputStyles}
                  />
                  <Group justify="flex-end" mt={6}>
                    <UnstyledButton type="button" className={classes.forgotLink}>
                      Esqueceu a senha?
                    </UnstyledButton>
                  </Group>
                </Box>

                <Button
                  type="submit"
                  loading={loading}
                  fullWidth
                  h={42}
                  radius="md"
                  rightSection={<ArrowRight size={16} />}
                  styles={{ label: { fontWeight: 600, fontSize: "0.875rem" } }}
                >
                  Entrar
                </Button>
              </Stack>
            </form>

            <Box mt={24} pt={24} style={{ borderTop: "1px solid var(--mantine-color-gray-3)" }}>
              <Text c="dimmed" ta="center" fz="0.78rem">
                Pace Seller desenvolvido por Pace Tech
              </Text>
            </Box>
          </Box>
        </Box>
      </Flex>
    </Flex>
  );
}
