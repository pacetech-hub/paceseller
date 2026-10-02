import { Anchor } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { CheckIcon, XIcon } from "@phosphor-icons/react";

// Mesma API usada antes com o sonner (toast.success / toast.error),
// agora exibida pelo sistema de notificações do Mantine.
// `message` diz o que aconteceu; `next` (opcional) diz onde encontrar o resultado
// ou o que dá para fazer em seguida — ex.: toast.success('Pedido enviado', 'Acompanhe em Pedidos').
export const toast = {
  success: (message: string, next?: string) =>
    notifications.show({
      title: next ? message : undefined,
      message: next ?? message,
      color: "teal",
      icon: <CheckIcon size={16} />,
    }),
  /** Sucesso com um link de próximo passo dentro do aviso (ex.: "Ver carrinho"). */
  successWithAction: (message: string, next: string, action: { label: string; onClick: () => void }) => {
    const id = `toast-${Date.now()}`;
    notifications.show({
      id,
      title: message,
      message: (
        <>
          {next}{' '}
          <Anchor component="button" type="button" fw={600} inherit onClick={() => { notifications.hide(id); action.onClick(); }}>
            {action.label}
          </Anchor>
        </>
      ),
      color: "teal",
      icon: <CheckIcon size={16} />,
    });
  },
  error: (message: string, next?: string) =>
    notifications.show({
      title: next ? message : undefined,
      message: next ?? message,
      color: "red",
      icon: <XIcon size={16} />,
      // Erros ficam na tela até a pessoa fechar, para dar tempo de ler o que fazer.
      autoClose: false,
    }),
};
