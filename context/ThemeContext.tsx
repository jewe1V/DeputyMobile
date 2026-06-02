import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
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
            tasks: '#16a34a',
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

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
    theme: ThemeType;
    colors: typeof themeColors.light;
    isDark: boolean;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [theme, setTheme] = useState<ThemeType>(systemColorScheme || 'light');

    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('user-theme');
            if (savedTheme) {
                setTheme(savedTheme as ThemeType);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        await AsyncStorage.setItem('user-theme', newTheme);
    };

    const colors = themeColors[theme];
    const isDark = theme === 'dark';

    return (
        <ThemeContext.Provider value={{ theme, colors, isDark, toggleTheme }}>
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
