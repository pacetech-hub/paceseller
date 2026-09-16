
  import { createRoot } from "react-dom/client";
  import { MantineProvider } from "@mantine/core";
  import App from "./app/App.tsx";
  import "@mantine/core/styles.css";
  import "./styles/index.css";
  import { mantineTheme } from "./mantine/theme";

  createRoot(document.getElementById("root")!).render(
    <MantineProvider theme={mantineTheme}>
      <App />
    </MantineProvider>
  );
