import { useState } from "react";
import { ArrowRightIcon } from "@phosphor-icons/react";
import {
  Anchor,
  Box,
  Button,
  Checkbox,
  Group,
  Image,
  Paper,
  PasswordInput,
  Select,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import teslaLogo from "../../assets/tesla-footwear-logo.png";
import classes from "./LoginPage.module.css";

type Profile = "admin" | "rep" | "lojista";

interface LoginPageProps {
  onLogin: (profile: Profile) => void;
}

const profiles: { value: Profile; label: string }[] = [
  { value: "admin", label: "Indústria" },
  { value: "rep", label: "Representante" },
  { value: "lojista", label: "Lojista" },
];

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("admin@teslafootwear.com.br");
  const [password, setPassword] = useState("••••••••");
  const [selectedProfile, setSelectedProfile] = useState<Profile>("admin");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
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
    <div className={classes.wrapper}>
      <Paper className={classes.form} radius={0} px={30} pb={30} pt={{ base: 48, sm: 80 }}>
        <Box mb={50}>
          <Image src={teslaLogo} alt="Tesla Footwear" h={32} w="auto" fit="contain" />
        </Box>

        <Title order={2} className={classes.title} mb={4}>
          Bem-vindo de volta!
        </Title>
        <Text c="dimmed" size="sm" mb={40}>
          Catálogo digital, pedidos por grade, marketing com IA e sell-out em uma única plataforma.
        </Text>

        <form onSubmit={handleLogin}>
          <Select
            label="Acessando como"
            data={profiles}
            value={selectedProfile}
            onChange={(value) => value && setSelectedProfile(value as Profile)}
            allowDeselect={false}
            size="md"
            radius="md"
          />
          <TextInput
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            mt="md"
            size="md"
            radius="md"
          />
          <PasswordInput
            label="Senha"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            mt="md"
            size="md"
            radius="md"
          />

          <Group justify="space-between" mt="xl">
            <Checkbox
              label="Manter conectado"
              checked={keepLoggedIn}
              onChange={(e) => setKeepLoggedIn(e.currentTarget.checked)}
              size="md"
            />
            <Anchor component="button" type="button" size="sm" fw={500}>
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
        </form>

        <Box mt="auto" pt="xl">
          <Text ta="center" c="dimmed" size="xs">
            Pace Seller desenvolvido por Pace Tech
          </Text>
        </Box>
      </Paper>
    </div>
  );
}
