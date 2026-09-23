import { notifications } from "@mantine/notifications";

// Atalho no formato do antigo `sonner` (toast.success / toast.error) sobre as notificações do Mantine.
export const toast = {
  success: (message: string) => notifications.show({ message, color: "green" }),
  error: (message: string) => notifications.show({ message, color: "red" }),
  info: (message: string) => notifications.show({ message }),
};
