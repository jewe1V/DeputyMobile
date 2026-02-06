import { apiUrl } from "@/api/api";
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold, useFonts } from '@expo-google-fonts/playfair-display';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { styles } from './style';

class AuthTokenManager {
    private static token: string | null = null;
    private static tokenExpiryTimer: NodeJS.Timeout | null = null;
    private static dailyCheckTimer: NodeJS.Timeout | null = null;
    private static tokenListeners: ((token: string | null) => void)[] = [];

    static async initialize() {
        try {
            const storedToken = await AsyncStorage.getItem('authToken');
            const tokenExpiry = await AsyncStorage.getItem('authTokenExpiry');

            if (storedToken && tokenExpiry) {
                const expiryTime = parseInt(tokenExpiry, 10);
                const now = Date.now();

                console.log(`Token expiry: ${expiryTime}, Now: ${now}, Diff: ${expiryTime - now}`);

                if (now < expiryTime) {
                    this.token = storedToken;

                    // Проверяем время до истечения
                    const timeUntilExpiry = expiryTime - now;

                    // Если до истечения меньше 1 дня, используем точный таймер
                    if (timeUntilExpiry > 0 && timeUntilExpiry <= 24 * 60 * 60 * 1000) {
                        this.scheduleTokenCleanup(timeUntilExpiry);
                    }

                    // В любом случае запускаем ежедневную проверку
                    this.scheduleDailyCleanupCheck();
                } else {
                    console.log('Token expired, clearing...');
                    await this.clearToken();
                }
            }
        } catch (error) {
            console.error('Error initializing auth token:', error);
        }
    }

    static getToken(): string | null {
        return this.token;
    }

    static async setToken(token: string, expiresInDays: number = 30) {
        this.token = token;

        // Рассчитываем дату истечения
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiresInDays);

        // Устанавливаем время на конец дня для точности
        expiryDate.setHours(23, 59, 59, 999);

        // Сохраняем как timestamp
        const expiryTimestamp = expiryDate.getTime();

        console.log(`Setting token with expiry: ${expiryTimestamp} (${expiryDate.toISOString()})`);

        try {
            await AsyncStorage.setItem('authToken', token);
            await AsyncStorage.setItem('authTokenExpiry', expiryTimestamp.toString());
        } catch (error) {
            console.error('Error saving auth token:', error);
        }

        // Очищаем старые таймеры
        if (this.tokenExpiryTimer) {
            clearTimeout(this.tokenExpiryTimer);
            this.tokenExpiryTimer = null;
        }

        // Рассчитываем время до истечения
        const timeUntilExpiry = expiryTimestamp - Date.now();

        console.log(`Time until expiry: ${timeUntilExpiry}ms (${Math.round(timeUntilExpiry / (24 * 60 * 60 * 1000))} days)`);

        // Если до истечения меньше 24 часов, устанавливаем точный таймер
        if (timeUntilExpiry > 0 && timeUntilExpiry <= 24 * 60 * 60 * 1000) {
            this.scheduleTokenCleanup(timeUntilExpiry);
        }

        // Запускаем/перезапускаем ежедневную проверку
        this.scheduleDailyCleanupCheck();
        this.notifyListeners();
    }

    private static scheduleDailyCleanupCheck() {
        if (this.dailyCheckTimer) {
            clearTimeout(this.dailyCheckTimer);
        }

        const checkAndCleanup = async () => {
            try {
                const expiryStr = await AsyncStorage.getItem('authTokenExpiry');
                if (expiryStr) {
                    const expiryTime = parseInt(expiryStr, 10);
                    const now = Date.now();

                    console.log(`Daily check: Now=${now}, Expiry=${expiryTime}, Valid=${now < expiryTime}`);

                    if (now > expiryTime) {
                        console.log('Token expired in daily check, clearing...');
                        await this.clearToken();
                    } else {
                        // Если токен скоро истечет (меньше суток), устанавливаем точный таймер
                        const timeUntilExpiry = expiryTime - now;
                        if (timeUntilExpiry > 0 && timeUntilExpiry <= 24 * 60 * 60 * 1000 && !this.tokenExpiryTimer) {
                            this.scheduleTokenCleanup(timeUntilExpiry);
                        }
                    }
                }
            } catch (error) {
                console.error('Error in daily token check:', error);
            }

            const ONE_DAY = 24 * 60 * 60 * 1000;
            this.dailyCheckTimer = setTimeout(checkAndCleanup, ONE_DAY);
        };

        setTimeout(checkAndCleanup, 1000);
    }

    private static scheduleTokenCleanup(expiresInMs: number) {
        if (this.tokenExpiryTimer) {
            clearTimeout(this.tokenExpiryTimer);
        }

        const MAX_SETTIMEOUT = 2147483647;

        if (expiresInMs > MAX_SETTIMEOUT) {
            console.log(`Timeout too long (${expiresInMs}ms), will rely on daily check`);
            return;
        }

        this.tokenExpiryTimer = setTimeout(async () => {
            console.log('Token expired by timer, clearing...');
            await this.clearToken();
        }, expiresInMs);
    }

    static async clearToken() {
        console.log('Clearing token...');

        this.token = null;

        if (this.tokenExpiryTimer) {
            clearTimeout(this.tokenExpiryTimer);
            this.tokenExpiryTimer = null;
        }

        if (this.dailyCheckTimer) {
            clearTimeout(this.dailyCheckTimer);
            this.dailyCheckTimer = null;
        }

        try {
            await AsyncStorage.multiRemove(['authToken', 'authTokenExpiry']);
        } catch (error) {
            console.error('Error clearing auth token:', error);
        }

        this.notifyListeners();
    }

    static addListener(listener: (token: string | null) => void) {
        this.tokenListeners.push(listener);

        return () => {
            this.tokenListeners = this.tokenListeners.filter(l => l !== listener);
        };
    }

    private static notifyListeners() {
        this.tokenListeners.forEach(listener => {
            try {
                listener(this.token);
            } catch (error) {
                console.error('Error in token listener:', error);
            }
        });
    }

    static isTokenValid(): boolean {
        return this.token !== null;
    }

    // Новый метод для принудительной проверки
    static async checkTokenValidity(): Promise<boolean> {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const expiryStr = await AsyncStorage.getItem('authTokenExpiry');

            if (!token || !expiryStr) {
                if (this.token) await this.clearToken();
                return false;
            }

            const expiryTime = parseInt(expiryStr, 10);
            const isValid = Date.now() < expiryTime;

            if (!isValid && this.token) {
                await this.clearToken();
            } else if (isValid && !this.token) {
                this.token = token;
                this.notifyListeners();
            }

            return isValid;
        } catch (error) {
            console.error('Error checking token validity:', error);
            return false;
        }
    }
}

AuthTokenManager.initialize();

interface User {
    id: string;
    email: string;
    jobTitle: string;
    passwordHash: string;
    salt: string;
    fullName: string;
    createdAt: string;
    userRoles: any[];
    posts: any[];
    documents: any[];
    eventsOrganized: any[];
}

interface AuthResponse {
    token: string;
    user: User;
}

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [fontsLoaded] = useFonts({
        PlayfairDisplay_700Bold,
        Inter_400Regular,
        Inter_600SemiBold,
    });

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${apiUrl}/api/Auth/login`, {
                method: 'POST',
                headers: {
                    'accept': 'text/plain',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }

            const data: AuthResponse = await response.json();

            await AuthTokenManager.setToken(data.token);
            await AsyncStorage.setItem('userData', JSON.stringify(data.user));

            console.log('Успешная авторизация, токен сохранен в глобальное хранилище');
            router.push('/(screens)/DashboardScreen');
        } catch (error) {
            console.error('Ошибка авторизации:', error);
            Alert.alert('Ошибка', 'Не удалось войти. Проверьте логин и пароль');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <Image
                    style={styles.emblem}
                    resizeMode="contain"
                    source={require('@/assets/images/ekb-emblem.png')}
                />
                <Text style={styles.title}>Цифровой кабинет депутата {apiUrl}</Text>
            </View>

            <View style={styles.form}>
                <TextInput
                    placeholder="Email"
                    placeholderTextColor="#9CA3AF"
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                />
                <TextInput
                    placeholder="Пароль"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    autoComplete="password"
                />

                <TouchableOpacity
                    style={[styles.loginButton, isLoading && styles.disabledButton]}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.loginButtonText}>Войти</Text>
                    )}
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export { AuthTokenManager, LoginScreen };

