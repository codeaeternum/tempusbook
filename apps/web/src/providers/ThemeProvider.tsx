'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    toggleTheme: () => { },
    setTheme: () => { },
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');

    useEffect(() => {
        // Read from localStorage or system preference
        const stored = localStorage.getItem('tempusbook-theme') as Theme | null;
        if (stored) {
            setThemeState(stored);
            document.documentElement.setAttribute('data-theme', stored);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setThemeState('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
        }
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('tempusbook-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
