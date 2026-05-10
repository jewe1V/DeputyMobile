import {apiClient, apiUrl, xAppSecret} from "@/api/api";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import React, {useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Animated, Easing,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { styles } from './style';
import {Profile} from "@/models/ProfileModel"
import Toast from "react-native-toast-message";
import {LinearGradient} from "expo-linear-gradient";

class AuthManager {
    private static token: string | null = null;
    private static refreshToken: string | null = null;
    private static role: string | null = null;
    private static userId: string | null = null;
    private static listeners: ((token: string | null) => void)[] = [];

    static async initialize() {
        try {
            const [token, refreshToken, role, userId] = await Promise.all([
                AsyncStorage.getItem('authToken'),
                AsyncStorage.getItem('refreshToken'),
                AsyncStorage.getItem('userRole'),
                AsyncStorage.getItem('userId')
            ]);

            if (token && refreshToken) {
                this.token = token;
                this.refreshToken = refreshToken;
                this.role = role;
                this.userId = userId;
                console.log('[AuthManager] Initialized with tokens');
            } else {
                console.log('[AuthManager] No tokens found');
                await this.clearAuth();
            }
        } catch (e) {
            console.error('Auth initialization error:', e);
        }
    }

    static getToken() { return this.token; }
    static getRefreshToken() { return this.refreshToken; }
    static getRole() { return this.role; }
    static getUserId() { return this.userId; }

    static async setAuth(token: string, refreshToken: string, userId: string, roles: any[]) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.role = roles.length > 0 ? roles[0].role.name : null;

        try {
            await AsyncStorage.multiSet([
                ['authToken', token],
                ['refreshToken', refreshToken],
                ['userId', userId],
                ['userRole', this.role || '']
            ]);
            console.log('[AuthManager] Tokens saved successfully');
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
            await AsyncStorage.multiRemove([
                'authToken',
                'refreshToken',
                'userRole',
                'userData',
                'userId'
            ]);
            console.log('[AuthManager] Auth data cleared');
        } catch (e) {
            console.error('Error clearing auth:', e);
        }
        this.notifyListeners();
    }

    static async refreshAuthTokens(): Promise<string> {
        console.log('[AuthManager] Starting token refresh...');

        if (!this.token || !this.refreshToken) {
            console.log('[AuthManager] No tokens available for refresh');
            await this.clearAuth();
            throw new Error('No tokens available');
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

            console.log('[AuthManager] Refresh response status:', response.status);

            if (response.status === 401) {
                console.log('[AuthManager] Refresh token expired');
                await this.clearAuth();
                throw new Error('Refresh token expired');
            }

            if (!response.ok) {
                throw new Error(`Refresh failed with status: ${response.status}`);
            }

            const data = await response.json();
            console.log('[AuthManager] Refresh successful, new token received');

            // Проверяем структуру ответа
            if (!data.token || !data.refresh_token) {
                throw new Error('Invalid refresh response structure');
            }

            // Сохраняем новые токены
            await this.setAuth(
                data.token,
                data.refresh_token,
                data.user.id,
                data.user.user_roles || []
            );

            // Обновляем userData в сторадже
            await AsyncStorage.setItem('userData', JSON.stringify(data));

            return data.token;
        } catch (error) {
            console.error('[AuthManager] Token refresh error:', error);
            await this.clearAuth();
            throw error; // Прокидываем ошибку, а не возвращаем null
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

    static async logout() {
        await this.clearAuth();
        router.replace('/login');
        Toast.show({
            type: 'info',
            text1: 'Выход',
            text2: 'Вы вышли из системы'
        });
    }
}

// Отложенная инициализация
setTimeout(() => {
    AuthManager.initialize().catch(console.error);
}, 0);

interface AuthResponse {
    token: string;
    refresh_token: string;
    user: Profile;
}

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Состояния фокуса для инпутов
    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    // Анимации
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const formFadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
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
    }, []);

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
            await AsyncStorage.setItem('userData', JSON.stringify(data));
            console.log('Успешная авторизация, токены сохранены');
            router.push('/(screens)/DashboardScreen');
        } catch (error: any) {
            console.error('Ошибка авторизации:', error);
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Не удалось войти. Проверьте логин и пароль'
            });
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={['#095a25', '#489a4d']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.backgroundAccent}
            />

            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
                <View style={styles.emblemContainer}>
                    <Image
                        style={styles.emblem}
                        resizeMode="contain"
                        source={require('@/assets/images/ekb-emblem.png')} // Ваш путь
                    />
                </View>
                <Text style={styles.subtitle}>Екатеринбургская городская Дума</Text>
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

export { AuthManager, LoginScreen };

