import { useState } from "react";
import { ArrowRightIcon, EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import {
  Anchor,
  Avatar,
  Box,
  Button,
  Divider,
  Group,
  PasswordInput,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import teslaLogo from "../../assets/tesla-footwear-logo.png";

type Profile = "admin" | "rep" | "lojista";

interface LoginPageProps {
  onLogin: (profile: Profile) => void;
}

const profiles = [
  { value: "admin", label: "Indústria" },
  { value: "rep", label: "Representante" },
  { value: "lojista", label: "Lojista" },
];

const highlights = [
  "Pedidos por grade em menos de 2 minutos",
  "Sell-out em tempo real por loja e região",
  "Campanhas criadas com IA generativa",
];

// Mantém as cores do design atual (tokens de src/styles/theme.css) em vez dos cinzas padrão do Mantine.
const muted = "var(--muted-foreground)";
const fieldInput = { backgroundColor: "var(--surface)", borderColor: "var(--border)" };

const inputStyles = {
  label: { fontSize: "0.8rem", fontWeight: 500, color: muted, marginBottom: 6 },
  input: { ...fieldInput, fontSize: "0.875rem" },
};

export function LoginPage({ onLogin }: LoginPageProps) {
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
    <div className="min-h-screen bg-background flex relative">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-primary/10 via-background to-background flex-col justify-between p-12 border-r border-border">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, oklch(0.6 0.22 262 / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, oklch(0.72 0.15 48 / 0.2) 0%, transparent 40%)`,
          }}
        />
        <Box pos="relative" style={{ zIndex: 10 }}>
          <img src={teslaLogo} alt="Tesla Footwear" className="h-8 w-auto object-contain" />
        </Box>

        <Stack gap="xl" pos="relative" style={{ zIndex: 10 }}>
          <div>
            <Title
              order={1}
              mb="md"
              style={{ fontSize: "2.5rem", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.03em" }}
            >
              Venda mais.
              <br />
              Com mais inteligência.
            </Title>
            <Text c={muted} size="1rem" lh={1.6}>
              Catálogo digital, pedidos por grade, marketing com IA e inteligência de sell-out em
              uma única plataforma.
            </Text>
          </div>

          <Stack gap="sm">
            {highlights.map((item) => (
              <Group key={item} gap="sm" wrap="nowrap">
                <Box w={6} h={6} bg="var(--mantine-primary-color-filled)" style={{ borderRadius: "50%" }} />
                <Text c={muted} size="0.875rem">
                  {item}
                </Text>
              </Group>
            ))}
          </Stack>
        </Stack>

        <Group gap="md" pos="relative" style={{ zIndex: 10 }}>
          <Avatar.Group spacing={8}>
            {["MA", "FL", "CM", "AS"].map((initials, i) => (
              <Avatar
                key={initials}
                size={32}
                radius="xl"
                styles={{
                  root: { border: "2px solid var(--mantine-color-body)" },
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
          <Text c={muted} size="0.8rem">
            <Text span fw={600} c="var(--mantine-color-text)" inherit>
              247 lojistas
            </Text>{" "}
            ativos esta temporada
          </Text>
        </Group>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Box w="100%" maw={384}>
          <Box hiddenFrom="lg" mb={40}>
            <img src={teslaLogo} alt="Tesla Footwear" className="h-7 w-auto object-contain" />
          </Box>

          <Box mb="xl">
            <Title order={2} mb={4} style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Bem-vindo
            </Title>
            <Group gap="xs" wrap="nowrap">
              <Text c={muted} size="0.875rem">
                Acessando como
              </Text>
              <Select
                aria-label="Perfil de acesso"
                data={profiles}
                value={selectedProfile}
                onChange={(value) => value && setSelectedProfile(value as Profile)}
                allowDeselect={false}
                size="xs"
                w={150}
                comboboxProps={{ withinPortal: true }}
                styles={{ input: { ...fieldInput, fontSize: "0.8rem", fontWeight: 600 } }}
              />
            </Group>
          </Box>

          <form onSubmit={handleLogin}>
            <Stack gap="md">
              <TextInput
                type="email"
                label="E-mail"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                size="md"
                styles={inputStyles}
              />

              <div>
                <PasswordInput
                  label="Senha"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  size="md"
                  styles={inputStyles}
                  visibilityToggleIcon={({ reveal }) =>
                    reveal ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />
                  }
                />
                <Group justify="flex-end" mt={6}>
                  <Anchor component="button" type="button" size="0.78rem">
                    Esqueceu a senha?
                  </Anchor>
                </Group>
              </div>

              <Button
                type="submit"
                fullWidth
                size="md"
                loading={loading}
                rightSection={<ArrowRightIcon className="w-4 h-4" />}
                styles={{ label: { fontWeight: 600, fontSize: "0.875rem" } }}
              >
                Entrar
              </Button>
            </Stack>
          </form>

          <Divider mt="lg" mb="lg" />
          <Text c={muted} ta="center" size="0.78rem">
            Pace Seller desenvolvido por Pace Tech
          </Text>
        </Box>
      </div>
    </div>
  );
}
