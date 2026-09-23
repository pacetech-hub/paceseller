import { useState } from "react";
import { WarehouseIcon, StorefrontIcon, EyeIcon } from "@phosphor-icons/react";
import { clients } from "../data/mockData";
import { IndustryStockTable } from "./IndustryStockTable";
import { ClientStockTab } from "./ClientStockTab";

const tabs = [
  { id: 'industrial', label: 'Estoque Industrial', icon: WarehouseIcon },
  { id: 'cliente', label: 'Estoque do Cliente', icon: StorefrontIcon },
] as const;

export function RepStockPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['id']>('industrial');
  const myClients = clients.filter(c => c.rep === 'Marcos Andrade');

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-secondary/60 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}`}
                style={{ fontSize: '0.82rem', fontWeight: activeTab === tab.id ? 600 : 400 }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
          <EyeIcon className="w-3 h-3" /> Somente visualização
        </span>
      </div>

      {activeTab === 'industrial' ? (
        <IndustryStockTable readOnly />
      ) : (
        <ClientStockTab readOnly scopeClients={myClients} />
      )}
    </div>
  );
}
