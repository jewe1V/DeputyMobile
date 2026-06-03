import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const themeColors = {
    light: {
        background: '#f8fafc',
        card: '#ffffff',
        text: '#1e293b',
        subtext: '#64748b',
        primary: '#2A6E3F',
        secondary: '#349339',
        border: '#f1f5f9',
        iconBox: '#f1f5f9',
        roleBadge: '#dcfce7',
        roleText: '#166534',
        divider: '#f1f5f9',
        actionIcon: {
            events: '#f5f3ff',
            tasks: '#f0fdf4',
        },
        actionIconColor: {
            events: '#7c3aed',
            tasks: '#087530',
        }
    },
    dark: {
        background: '#0f172a',
        card: '#1e293b',
        text: '#f8fafc',
        subtext: '#94a3b8',
        primary: '#1d4d2c',
        secondary: '#256929',
        border: '#334155',
        iconBox: '#334155',
        roleBadge: '#064e3b',
        roleText: '#dcfce7',
        divider: '#334155',
        actionIcon: {
            events: '#2e1065',
            tasks: '#064e3b',
        },
        actionIconColor: {
            events: '#a78bfa',
            tasks: '#4ade80',
        }
    }
};

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    theme: ResolvedTheme;
    colors: typeof themeColors.light;
    isDark: boolean;
    setThemeMode: (mode: ThemeMode) => Promise<void>;
    toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'user-theme-mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [mode, setMode] = useState<ThemeMode>('system');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadThemeMode = async () => {
            try {
                const savedMode = await AsyncStorage.getItem(STORAGE_KEY);
                if (
                    savedMode === 'light' ||
                    savedMode === 'dark' ||
                    savedMode === 'system'
                ) {
                    setMode(savedMode);
                }
            } catch (e) {
                console.error('Ошибка загрузки темы:', e);
            } finally {
                setIsLoaded(true);
            }
        };

        loadThemeMode();
    }, []);

    const resolvedTheme: ResolvedTheme = useMemo(() => {
        if (mode === 'system') {
            return systemColorScheme === 'dark' ? 'dark' : 'light';
        }
        return mode;
    }, [mode, systemColorScheme]);

    const setThemeMode = async (newMode: ThemeMode) => {
        try {
            setMode(newMode);
            await AsyncStorage.setItem(STORAGE_KEY, newMode);
        } catch (e) {
            console.error('Ошибка сохранения темы:', e);
        }
    };

    const toggleTheme = async () => {
        const newMode: ThemeMode = resolvedTheme === 'light' ? 'dark' : 'light';
        await setThemeMode(newMode);
    };

    const colors = themeColors[resolvedTheme];
    const isDark = resolvedTheme === 'dark';

    // Необязательно, но полезно для web:
    // синхронизируем фон body/html, чтобы не было белых краёв
    useEffect(() => {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
            document.documentElement.style.backgroundColor = colors.background;
            document.body.style.backgroundColor = colors.background;
            document.documentElement.setAttribute('data-theme', resolvedTheme);
        }
    }, [resolvedTheme, colors.background]);

    if (!isLoaded) {
        return null;
    }

    return (
        <ThemeContext.Provider
            value={{
                mode,
                theme: resolvedTheme,
                colors,
                isDark,
                setThemeMode,
                toggleTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};