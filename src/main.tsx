// Os estilos do Mantine precisam vir antes de qualquer componente, para que os
// CSS modules dos componentes sobrescrevam os estilos padrão.
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./styles/global.css";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import App from "./app/App.tsx";
import { mantineTheme } from "./mantine/theme";

createRoot(document.getElementById("root")!).render(
  <MantineProvider theme={mantineTheme}>
    <Notifications position="bottom-right" />
    <App />
  </MantineProvider>
);
