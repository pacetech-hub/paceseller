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
    const normalized = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setEmailError("Informe um e-mail válido, ex.: nome@loja.com.br");
      return;
    }
    const profile = demoAccounts[normalized];
    if (!profile) {
      setEmailError("Não encontramos uma conta com este e-mail. Confira o endereço ou escolha uma das contas de demonstração na lista.");
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

        <Title order={1} mb={4}>
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
          />
          <PasswordInput
            label="Senha"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            mt="md"
          />

          <Group justify="space-between" mt="xl" gap="sm">
            <Checkbox
              label="Manter conectado"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.currentTarget.checked)}
            />
            <Anchor component="button" type="button" fw={600} py={8}>
              Esqueceu a senha?
            </Anchor>
          </Group>

          <Button
            type="submit"
            fullWidth
            mt="xl"
            loading={loading}
            rightSection={<ArrowRightIcon size={16} />}
          >
            Entrar
          </Button>
        </Box>

        <Box mt="auto" pt="xl">
          <Text ta="center" c="dimmed" size="sm">
            Pace Seller desenvolvido por Pace Tech
          </Text>
        </Box>
      </Paper>
    </Box>
  );
}
