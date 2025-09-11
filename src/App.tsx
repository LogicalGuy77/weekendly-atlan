import { ThemeProvider } from "./components/theme-provider";
import { WeekendView } from "./components/WeekendView";

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="weekendly-ui-theme">
      <WeekendView />
    </ThemeProvider>
  );
}

export default App;
