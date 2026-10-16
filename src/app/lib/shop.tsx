import { createContext, useContext } from "react";
import type { CartCreator } from "../data/cartStore";

// Contexto da jornada de compra: quem está comprando (lojista ou representante), para qual
// cliente, e os atalhos que qualquer tela usa — abrir a grade (todo "Adicionar" passa por ela,
// BR-20), abrir um carrinho e abrir a gaveta do carrinho.
export interface GradeRequest {
  productId: string;
  /** "edit" troca a grade da linha do carrinho; "add" soma ao carrinho de destino. */
  mode?: 'add' | 'edit';
  cartId?: string;
  /** Grade inicial; sem ela, abre com a sugestão do Radar quando houver sinal (BR-21). */
  initial?: Record<string, number>;
  /** Pares extras sugeridos (ex.: "Igualar ano passado" abre a grade com +10 pares). */
  extraPairs?: number;
}

export interface ShopContextValue {
  role: CartCreator;
  /** Cliente dos carrinhos (o próprio lojista, ou o cliente selecionado pelo representante). */
  clientId: string | null;
  openGrade: (req: GradeRequest) => void;
  openCart: (cartId: string) => void;
  openDrawer: () => void;
}

export const ShopContext = createContext<ShopContextValue>({
  role: 'lojista',
  clientId: null,
  openGrade: () => {},
  openCart: () => {},
  openDrawer: () => {},
});

export const useShop = () => useContext(ShopContext);
