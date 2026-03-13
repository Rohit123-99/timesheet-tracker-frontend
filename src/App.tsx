import { RouterProvider } from "react-router";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DateProvider } from "./contexts/DateContext";
import { router } from "./routes";

export default function App() {
  return (
    <ThemeProvider>
      <DateProvider>
        <RouterProvider router={router} />
      </DateProvider>
    </ThemeProvider>
  );
}
