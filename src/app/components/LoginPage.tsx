import { useState } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import {
  Anchor,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Group,
  Image,
  Paper,
  PasswordInput,
  Text,
  Title,
} from "@mantine/core";
import teslaLogo from "../../assets/tesla-footwear-logo.png";
import loginBanner from "../../assets/banner-edicao-limitada.webp";
import classes from "./LoginPage.module.css";

type Profile = "admin" | "rep" | "lojista";

interface LoginPageProps {
  onLogin: (profile: Profile) => void;
}

// Contas de demonstração: o tipo de usuário vem do servidor, aqui simulado pelo e-mail.
const demoAccounts: Record<string, Profile> = {
  "industria@teslafootwear.com.br": "admin",
  "representante@teslafootwear.com.br": "rep",
  "lojista@teslafootwear.com.br": "lojista",
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState("••••••••");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const profile = demoAccounts[email.trim().toLowerCase()];
    if (!profile) {
      setEmailError("Usuário não encontrado");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(profile);
    }, 1000);
  };

  return (
    <Box mih="100dvh" bg={`var(--mantine-color-dark-7) url(${loginBanner})`} bgsz="cover" bgp="30% center">
      <Paper className={classes.form} radius={0} px={{ base: 'lg', xs: 30 }} pb={30} pt={{ base: 48, sm: 80 }}>
        <Box mb={{ base: 32, sm: 50 }}>
          <Image src={teslaLogo} alt="Tesla Footwear" h={32} w="auto" fit="contain" />
        </Box>

        <Title order={2} lts="-0.02em" mb={4}>
          Bem-vindo de volta!
        </Title>
        <Text c="dimmed" size="sm" mb={{ base: 28, sm: 40 }}>
          Catálogo digital, pedidos por grade, marketing com IA e sell-out em uma única plataforma.
        </Text>

        <Box component="form" onSubmit={handleLogin}>
          <Autocomplete
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            data={Object.keys(demoAccounts)}
            value={email}
            onChange={(value) => {
              setEmail(value);
              setEmailError(null);
            }}
            error={emailError}
            size="md"
          />
          <PasswordInput
            label="Senha"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            mt="md"
            size="md"
          />

          <Group justify="space-between" mt="xl" gap="sm">
            <Checkbox
              label="Manter conectado"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.currentTarget.checked)}
              size="md"
            />
            <Anchor component="button" type="button" size="sm" fw={600}>
              Esqueceu a senha?
            </Anchor>
          </Group>

          <Button
            type="submit"
            fullWidth
            mt="xl"
            size="md"
            radius="md"
            loading={loading}
            rightSection={<ArrowRightIcon size={16} />}
          >
            Entrar
          </Button>
        </Box>

        <Box mt="auto" pt="xl">
          <Text ta="center" c="dimmed" size="xs">
            Pace Seller desenvolvido por Pace Tech
          </Text>
        </Box>
      </Paper>
    </Box>
  );
}
