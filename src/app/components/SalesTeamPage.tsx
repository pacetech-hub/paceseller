import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { PERIOD_OPTIONS, scaleValue, brl, type Period, type SalesEntity } from "./SalesIndicatorsSection";

interface SalesTeamPageProps {
  scope: 'network' | 'own';
  entities: SalesEntity[];
  onBack: () => void;
}

export function SalesTeamPage({ scope, entities, onBack }: SalesTeamPageProps) {
  const [period, setPeriod] = useState<Period>('dia');

  const ranked = entities
    .map(e => ({ ...e, value: scaleValue(e.monthlySales, period) }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        style={{ fontSize: '0.82rem', fontWeight: 500 }}
      >
        <ChevronLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-foreground" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
          {scope === 'network' ? 'Representantes e prepostos' : 'Meu time'}
        </h2>
        <div className="inline-flex flex-wrap rounded-lg bg-secondary p-1">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => setPeriod(opt.id)}
              className={`px-2.5 py-1 rounded-md transition-colors ${period === opt.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
              style={{ fontSize: '0.7rem', fontWeight: 600 }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <div className="space-y-2">
          {ranked.map((e, i) => (
            <div key={e.id} className="flex items-center gap-3 py-1">
              <span className="text-muted-foreground w-6 text-right flex-shrink-0" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate" style={{ fontSize: '0.85rem', fontWeight: 500 }}>{e.name}</p>
                <p className="text-muted-foreground truncate" style={{ fontSize: '0.7rem' }}>
                  {e.role === 'representante' ? 'Representante' : `Preposto de ${e.parentRep}`}
                </p>
              </div>
              <span className="text-foreground mono flex-shrink-0" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{brl(e.value)}</span>
            </div>
          ))}
          {ranked.length === 0 && (
            <p className="text-muted-foreground text-center py-6" style={{ fontSize: '0.8rem' }}>Nenhum vendedor encontrado</p>
          )}
        </div>
      </div>
    </div>
  );
}
