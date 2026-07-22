import { useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
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
              <p
                className="text-muted-foreground flex items-center gap-2"
                style={{ fontSize: "0.875rem" }}
              >
                Acessando como
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value as Profile)}
                  className="h-8 rounded-md border border-border bg-surface px-2 text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  style={{ fontSize: "0.8rem", fontWeight: 600 }}
                >
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.label}
                    </option>
                  ))}
                </select>
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  className="block text-muted-foreground mb-1.5"
                  style={{ fontSize: "0.8rem", fontWeight: 500 }}
                >
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border px-3.5 py-2.5 bg-surface text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                  style={{ fontSize: "0.875rem" }}
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <label
                  className="block text-muted-foreground mb-1.5"
                  style={{ fontSize: "0.8rem", fontWeight: 500 }}
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-border px-3.5 py-2.5 bg-surface text-foreground placeholder-muted-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary pr-10"
                    style={{ fontSize: "0.875rem" }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    className="text-primary hover:text-primary/80 transition-colors"
                    style={{ fontSize: "0.78rem" }}
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
                style={{ fontWeight: 600, fontSize: "0.875rem" }}
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <>
                    Entrar <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
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
