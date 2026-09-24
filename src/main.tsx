
  import { createRoot } from "react-dom/client";
  import { MantineProvider } from "@mantine/core";
  import { DatesProvider } from "@mantine/dates";
  import { Notifications } from "@mantine/notifications";
  import { IconContext } from "@phosphor-icons/react";
  import dayjs from "dayjs";
  import "dayjs/locale/pt-br";
  import App from "./app/App.tsx";
  import "@mantine/core/styles.css";
  import "@mantine/dates/styles.css";
  import "@mantine/notifications/styles.css";
  import "@mantine/charts/styles.css";
  import "./styles/index.css";
  import { mantineTheme } from "./mantine/theme";

  dayjs.locale("pt-br");

  createRoot(document.getElementById("root")!).render(
    <MantineProvider theme={mantineTheme}>
      <DatesProvider settings={{ locale: "pt-br" }}>
        {/* Ícones Phosphor no estilo regular em todo o app; tamanho padrão 24px */}
        <IconContext.Provider value={{ size: 24, weight: "regular" }}>
          <Notifications position="top-center" autoClose={6000} />
          <App />
        </IconContext.Provider>
      </DatesProvider>
    </MantineProvider>
  );
