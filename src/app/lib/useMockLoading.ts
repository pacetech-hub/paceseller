import { useEffect, useState } from "react";

/**
 * Simula o carregamento de dados ao abrir uma tela (os dados do protótipo são mock e locais).
 * Enquanto `true`, a tela mostra um skeleton com o mesmo formato do conteúdo que vai aparecer,
 * em vez de uma tela vazia ou um spinner. Quando houver API, troque pelo estado real da requisição.
 */
export function useMockLoading(ms = 600): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}
