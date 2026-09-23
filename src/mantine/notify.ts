import { notifications } from "@mantine/notifications";

// Atalhos para as notificações do Mantine com as cores semânticas do tema.
export const notify = {
  success: (message: string) => notifications.show({ message, color: "success" }),
  error: (message: string) => notifications.show({ message, color: "danger" }),
  info: (message: string) => notifications.show({ message }),
};
