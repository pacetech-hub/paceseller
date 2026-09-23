import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import App from "./app/App.tsx";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "./styles/index.css";
import "./styles/global.css";
import { mantineTheme } from "./mantine/theme";

createRoot(document.getElementById("root")!).render(
  <MantineProvider theme={mantineTheme}>
    <Notifications position="bottom-right" />
    <App />
  </MantineProvider>
);
