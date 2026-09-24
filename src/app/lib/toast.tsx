import { notifications } from "@mantine/notifications";
import { CheckIcon, XIcon } from "@phosphor-icons/react";

// Mesma API usada antes com o sonner (toast.success / toast.error),
// agora exibida pelo sistema de notificações do Mantine.
export const toast = {
  success: (message: string) =>
    notifications.show({ message, color: "teal", icon: <CheckIcon size={16} weight="bold" /> }),
  error: (message: string) =>
    notifications.show({ message, color: "red", icon: <XIcon size={16} weight="bold" /> }),
};
