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
    private static tokenListeners: ((token: string | null) => void)[] = [];

    static async initialize() {
        try {
            const storedToken = await AsyncStorage.getItem('authToken');
            const tokenExpiry = await AsyncStorage.getItem('authTokenExpiry');

            if (storedToken && tokenExpiry) {
                const expiryTime = parseInt(tokenExpiry, 10);
                if (Date.now() < expiryTime) {
                    this.token = storedToken;
                    this.scheduleTokenCleanup(expiryTime - Date.now());
                } else {
                    // Токен просрочен, очищаем
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

    static async setToken(token: string, expiresInMs: number = 60 * 60 * 1000) {
        this.token = token;

        const expiryTime = Date.now() + expiresInMs;

        try {
            await AsyncStorage.setItem('authToken', token);
            await AsyncStorage.setItem('authTokenExpiry', expiryTime.toString());
        } catch (error) {
            console.error('Error saving auth token:', error);
        }

        this.scheduleTokenCleanup(expiresInMs);

        this.notifyListeners();
    }

    static async clearToken() {
        this.token = null;

        if (this.tokenExpiryTimer) {
            clearTimeout(this.tokenExpiryTimer);
            this.tokenExpiryTimer = null;
        }

        try {
            await AsyncStorage.multiRemove(['authToken', 'authTokenExpiry']);
        } catch (error) {
            console.error('Error clearing auth token:', error);
        }
        this.notifyListeners();
    }

    private static scheduleTokenCleanup(expiresInMs: number) {
        if (this.tokenExpiryTimer) {
            clearTimeout(this.tokenExpiryTimer);
        }

        // @ts-ignore
        this.tokenExpiryTimer = setTimeout(() => {
            this.clearToken();
            console.log('Token automatically cleared after 1 hour');
        }, expiresInMs);
    }

    static addListener(listener: (token: string | null) => void) {
        this.tokenListeners.push(listener);

        // Возвращаем функцию для удаления слушателя
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

