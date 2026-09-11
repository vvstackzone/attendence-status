import { createContext } from "react";

export interface ThemeContextValue {
    theme: ThemeMode;
    resolvedTheme: "light" | "dark";
    setTheme: (theme: ThemeMode) => void;
    toggleTheme: () => void;
}

export type ThemeMode = "light" | "dark" | "system";

export const ThemeContext = createContext<ThemeContextValue | null>(null);
