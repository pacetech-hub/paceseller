import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import teslaLogo from "../../assets/tesla-footwear-logo.png";

type Profile = "admin" | "rep" | "lojista";

interface LoginPageProps {
  onLogin: (profile: Profile) => void;
}

const profiles = [
  { id: "admin" as Profile, label: "Indústria" },
  { id: "rep" as Profile, label: "Representante" },
  { id: "lojista" as Profile, label: "Lojista" },
];

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
    <div className="min-h-screen bg-background flex relative">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-gradient-to-br from-primary/10 via-background to-background flex-col justify-between p-12 border-r border-border">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, oklch(0.6 0.22 262 / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, oklch(0.72 0.15 48 / 0.2) 0%, transparent 40%)`,
          }}
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src={teslaLogo} alt="Tesla Footwear" className="h-8 w-auto object-contain" />
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1
              className="text-foreground mb-4"
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.03em",
              }}
            >
              Venda mais.
              <br />
              Com mais inteligência.
            </h1>
            <p className="text-muted-foreground" style={{ fontSize: "1rem", lineHeight: 1.6 }}>
              Catálogo digital, pedidos por grade, marketing com IA e inteligência de sell-out em
              uma única plataforma.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Pedidos por grade em menos de 2 minutos",
              "Sell-out em tempo real por loja e região",
              "Campanhas criadas com IA generativa",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-muted-foreground" style={{ fontSize: "0.875rem" }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {["MA", "FL", "CM", "AS"].map((initials, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-background flex items-center justify-center"
                  style={{
                    background: `oklch(${0.55 + i * 0.05} 0.18 ${262 + i * 30})`,
                    fontSize: "0.65rem",
                    fontWeight: 600,
                    color: "white",
                  }}
                >
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
              <span className="text-foreground" style={{ fontWeight: 600 }}>
                247 lojistas
              </span>{" "}
              ativos esta temporada
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <img src={teslaLogo} alt="Tesla Footwear" className="h-7 w-auto object-contain" />
          </div>

          <div>
            <div className="mb-8">
              <h2
                className="text-foreground mb-1"
                style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}
              >
                Bem-vindo
              </h2>
              <div className="flex items-center gap-2">
                <Label htmlFor="login-profile" className="text-muted-foreground font-normal">
                  Acessando como
                </Label>
                <Select
                  value={selectedProfile}
                  onValueChange={(value) => setSelectedProfile(value as Profile)}
                >
                  <SelectTrigger id="login-profile" size="sm" className="w-auto font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-muted-foreground">
                  E-mail
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-lg"
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-muted-foreground">
                  Senha
                </Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 rounded-lg pr-10"
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-1 top-1/2 -translate-y-1/2 size-8 text-muted-foreground hover:text-foreground hover:bg-transparent"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs">
                    Esqueceu a senha?
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full rounded-lg font-semibold"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    Entrar <ArrowRight />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-muted-foreground text-center" style={{ fontSize: "0.78rem" }}>
                Pace Seller desenvolvido por Pace Tech
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
