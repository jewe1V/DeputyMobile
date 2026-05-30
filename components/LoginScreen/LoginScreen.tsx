import { router } from "expo-router";
import React, {useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Animated, Easing,
    Image,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { styles } from './style';
import {Profile} from "@/models/ProfileModel"
import Toast from "react-native-toast-message";
import {LinearGradient} from "expo-linear-gradient";
import {apiClient, apiUrl, xAppSecret} from "@/api/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Адаптер для кроссплатформенного хранения
class StorageAdapter {
    private static isWeb = Platform.OS === 'web';
    private static memoryStorage: Map<string, string> = new Map();

    static async getItem(key: string): Promise<string | null> {
        if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
            return localStorage.getItem(key);
        }

        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            // Fallback на память если AsyncStorage недоступен
            return this.memoryStorage.get(key) || null;
        }
    }

    static async setItem(key: string, value: string): Promise<void> {
        if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem(key, value);
            return;
        }

        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            this.memoryStorage.set(key, value);
        }
    }

    static async multiSet(keyValuePairs: [string, string][]): Promise<void> {
        if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
            keyValuePairs.forEach(([key, value]) => {
                localStorage.setItem(key, value);
            });
            return;
        }

        try {
            await AsyncStorage.multiSet(keyValuePairs);
        } catch (error) {
            keyValuePairs.forEach(([key, value]) => {
                this.memoryStorage.set(key, value);
            });
        }
    }

    static async multiRemove(keys: string[]): Promise<void> {
        if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
            keys.forEach(key => localStorage.removeItem(key));
            return;
        }

        try {
            await AsyncStorage.multiRemove(keys);
        } catch (error) {
            keys.forEach(key => this.memoryStorage.delete(key));
        }
    }

    static async removeItem(key: string): Promise<void> {
        if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem(key);
            return;
        }

        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            this.memoryStorage.delete(key);
        }
    }

    static async clear(): Promise<void> {
        if (this.isWeb && typeof window !== 'undefined' && window.localStorage) {
            localStorage.clear();
            return;
        }

        try {
            await AsyncStorage.clear();
        } catch (error) {
            this.memoryStorage.clear();
        }
    }
}

class AuthManager {
    private static token: string | null = null;
    private static refreshToken: string | null = null;
    private static role: string | null = null;
    private static userId: string | null = null;
    private static listeners: ((token: string | null) => void)[] = [];
    private static initialized = false;

    static async initialize() {
        // Защита от двойной инициализации
        if (this.initialized) return;

        // Проверка окружения
        if (!this.isValidEnvironment()) {
            console.log('AuthManager: Invalid environment for storage');
            this.initialized = true;
            return;
        }

        try {
            const [token, refreshToken, role, userId] = await Promise.all([
                StorageAdapter.getItem('authToken'),
                StorageAdapter.getItem('refreshToken'),
                StorageAdapter.getItem('userRole'),
                StorageAdapter.getItem('userId')
            ]);

            if (token && refreshToken) {
                this.token = token;
                this.refreshToken = refreshToken;
                this.role = role;
                this.userId = userId;
            } else {
                await this.clearAuth();
            }
        } catch (e) {
            console.error('Auth initialization error:', e);
        } finally {
            this.initialized = true;
        }
    }

    private static isValidEnvironment(): boolean {
        // Для web - проверяем наличие localStorage
        if (Platform.OS === 'web') {
            if (typeof window === 'undefined' || !window.localStorage) {
                console.warn('AuthManager: localStorage not available');
                return false;
            }
            return true;
        }

        // Для native - всегда true (но AsyncStorage может упать)
        return true;
    }

    static getToken() { return this.token; }
    static getRefreshToken() { return this.refreshToken; }
    static getRole() { return this.role; }
    static getUserId() { return this.userId; }
    static isInitialized() { return this.initialized; }

    static async setAuth(token: string, refreshToken: string, userId: string, roles: any[]) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.role = roles.length > 0 ? roles[0].role.name : null;

        try {
            await StorageAdapter.multiSet([
                ['authToken', token],
                ['refreshToken', refreshToken],
                ['userId', userId],
                ['userRole', this.role || '']
            ]);
        } catch (e) {
            console.error('Error saving auth data:', e);
        }

        this.notifyListeners();
    }

    static async clearAuth() {
        this.token = null;
        this.refreshToken = null;
        this.role = null;
        this.userId = null;
        try {
            await StorageAdapter.multiRemove([
                'authToken',
                'refreshToken',
                'userRole',
                'userData',
                'userId'
            ]);
        } catch (e) {
            console.error('Error clearing auth:', e);
        }
        this.notifyListeners();
    }

    static async refreshAuthTokens(): Promise<string | null> {
        if (!this.token || !this.refreshToken) {
            await this.clearAuth();
            return null;
        }

        try {
            const response = await fetch(`${apiUrl}/api/Auth/refresh`, {
                method: 'POST',
                headers: {
                    'accept': 'text/plain',
                    'Content-Type': 'application/json-patch+json',
                    'Authorization': `Bearer ${this.token}`,
                    'X-App-Secret': xAppSecret
                },
                body: JSON.stringify({
                    access_token: this.token,
                    refresh_token: this.refreshToken
                })
            });

            if (!response.ok) {
                throw new Error('Refresh failed');
            }

            const data = await response.json();

            await this.setAuth(
                data.token,
                data.refresh_token,
                data.user.id,
                data.user.user_roles || []
            );

            await StorageAdapter.setItem('userData', JSON.stringify(data));

            return data.token;
        } catch (error) {
            console.error('Token refresh error:', error);
            await this.clearAuth();
            return null;
        }
    }

    static addListener(listener: (token: string | null) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private static notifyListeners() {
        this.listeners.forEach(l => l(this.token));
    }

    static isTokenValid(): boolean {
        return this.token !== null;
    }
}

// Отложенная инициализация для кроссплатформенности
if (typeof window !== 'undefined' || Platform.OS !== 'web') {
    // Используем setTimeout для отложенной инициализации
    setTimeout(() => {
        AuthManager.initialize().catch(console.error);
    }, 0);
}

interface AuthResponse {
    token: string;
    refresh_token: string;
    user: Profile;
}

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // Состояния фокуса для инпутов
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    // Анимации
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const formFadeAnim = useRef(new Animated.Value(0)).current;

    // Инициализация AuthManager при монтировании
    useEffect(() => {
        const initAuth = async () => {
            if (!AuthManager.isInitialized()) {
                await AuthManager.initialize();
            }
            setIsAuthReady(true);
        };

        initAuth();
    }, []);

    useEffect(() => {
        if (!isAuthReady) return;

        Animated.sequence([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: Platform.OS !== "web",
            }),
            Animated.parallel([
                Animated.timing(formFadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ])
        ]).start();
    }, [isAuthReady]);

    const handleLogin = async () => {
        if (!email || !password) {
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Пожалуйста, заполните все поля'
            });
            return;
        }

        setIsLoading(true);
        try {
            const response = await apiClient.post<AuthResponse>('/api/Auth/login', {
                email: email,
                password: password
            });
            const data = response.data;
            await AuthManager.setAuth(
                data.token,
                data.refresh_token,
                data.user.id,
                // @ts-ignore
                data.user.user_roles || []
            );
            await StorageAdapter.setItem('userData', JSON.stringify(data));
            console.log('Успешная авторизация, токены сохранены');

            // Используем router.replace чтобы нельзя было вернуться на логин
            router.replace('/(screens)/DashboardScreen');
        } catch (error: any) {
            console.error('Ошибка авторизации:', error);
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: error.response?.data?.message || 'Не удалось войти. Проверьте логин и пароль'
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAuthReady) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#095a25" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View
                style={styles.backgroundAccent}
            />

            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <View style={styles.emblemContainer}>
                    <Image
                        style={styles.emblem}
                        resizeMode="contain"
                        source={require('@/assets/images/duma-emblem.png')}
                    />
                </View>
                {/*<Text style={styles.subtitle}>Екатеринбургская городская Дума</Text>*/}
                <Text style={styles.title}>Цифровой кабинет{'\n'}депутата</Text>
            </Animated.View>

            <Animated.View
                style={[
                    styles.formContainer,
                    {
                        opacity: formFadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}
            >
                <View style={styles.formCard}>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>Электронная почта</Text>
                        <TextInput
                            placeholderTextColor="#9CA3AF"
                            style={[
                                styles.input,
                                isEmailFocused && styles.inputFocused
                            ]}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoComplete="email"
                            onFocus={() => setIsEmailFocused(true)}
                            onBlur={() => setIsEmailFocused(false)}
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Text style={styles.inputLabel}>Пароль</Text>
                        <TextInput
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry
                            style={[
                                styles.input,
                                isPasswordFocused && styles.inputFocused
                            ]}
                            value={password}
                            onChangeText={setPassword}
                            autoComplete="password"
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => setIsPasswordFocused(false)}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.loginButton, isLoading && styles.disabledButton]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                            <Text style={styles.loginButtonText}>Войти</Text>
                        )}
                    </TouchableOpacity>

                </View>
            </Animated.View>
        </KeyboardAvoidingView>
    );
};

export { AuthManager, LoginScreen, StorageAdapter };