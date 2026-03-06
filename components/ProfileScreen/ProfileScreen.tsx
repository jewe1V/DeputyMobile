import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    SafeAreaView,
    Alert,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import {apiUrl} from '@/api/api.ts'
import {AuthTokenManager} from '@/components/LoginScreen/LoginScreen';
import { styles } from './style';
import {Profile} from '@/data/types';

// Кастомные компоненты
interface ButtonProps {
    variant?: 'default' | 'outline';
    onPress: () => void;
    style?: any;
    children: React.ReactNode;
    disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({
                                           variant = 'default',
                                           onPress,
                                           style,
                                           children,
                                           disabled
                                       }) => (
    <TouchableOpacity
        style={[
            styles.buttonBase,
            variant === 'outline' ? styles.buttonOutline : styles.buttonDefault,
            disabled && styles.buttonDisabled,
            style,
        ]}
        onPress={onPress}
        disabled={disabled}
    >
        {children}
    </TouchableOpacity>
);

interface AvatarProps {
    style?: any;
    children: React.ReactNode;
}

const Avatar: React.FC<AvatarProps> = ({ style, children }) => (
    <View style={[styles.avatarBase, style]}>
        {children}
    </View>
);

const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name[0].toUpperCase();
};

export function ProfileScreen() {
    const navigation = useNavigation();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Логика загрузки данных (вынесена в useCallback для стабильности)
    const loadProfile = useCallback(async () => {
        try {
            const token = await AuthTokenManager.getToken();
            if (!token) {
                setProfile(null);
                return;
            }

            const response = await fetch(`${apiUrl}/api/Auth/current`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (response.status === 401) {
                await AuthTokenManager.clearToken();
                setProfile(null);
                return;
            }

            if (!response.ok) throw new Error('Network response was not ok');

            const data = await response.json();

            // Маппинг данных
            setProfile(data);
        } catch (error) {
            console.error('Profile load error:', error);
            // Alert.alert('Ошибка', 'Не удалось загрузить профиль');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Единый эффект для подписки на токен и первичной загрузки
    useEffect(() => {
        const unsubscribe = AuthTokenManager.addListener((newToken) => {
            if (newToken) {
                loadProfile();
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        loadProfile(); // Начальная загрузка

        return () => unsubscribe(); // Важно: вызываем функцию отписки
    }, [loadProfile]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadProfile();
    };

    const handleLogout = () => {
        Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Выйти',
                style: 'destructive',
                onPress: async () => await AuthTokenManager.clearToken()
            },
        ]);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2A6E3F" />
                </View>
            </SafeAreaView>
        );
    }

    if (!profile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Icon name="user-x" size={48} color="#9CA3AF" />
                    <Text style={styles.errorTitle}>Профиль не найден</Text>
                    <Button onPress={() => navigation.navigate('login' as never)} style={styles.errorButton}>
                        <Text style={styles.buttonText}>Войти</Text>
                    </Button>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#2A6E3F']}
                        tintColor="#2A6E3F"
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Профиль</Text>
                        <TouchableOpacity
                            style={styles.settingsButton}
                            onPress={() => navigation.navigate('Settings' as never)}
                        >
                            <Icon name="settings" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.avatarContainer}>
                        <Avatar style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {getInitials(profile.fullName)}
                            </Text>
                        </Avatar>
                    </View>

                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{profile.fullName}</Text>
                        <Text style={styles.userTitle}>{profile.jobTitle}</Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Основная информация */}
                    <View style={styles.infoSection}>

                        <View style={styles.infoRow}>
                            <Icon name="briefcase" size={20} color="#2A6E3F" style={styles.infoIcon} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Должность</Text>
                                <Text style={styles.infoValue}>{profile.jobTitle}</Text>
                            </View>
                        </View>

                        <View style={styles.infoRow}>
                            <Icon name="mail" size={20} color="#2A6E3F" style={styles.infoIcon} />
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Email</Text>
                                <Text style={styles.infoValue}>{profile.email}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Роли */}
                {profile.roles.length > 0 && (
                    <View style={styles.rolesCard}>
                        <View style={styles.rolesHeader}>
                            <Icon name="shield" size={20} color="#2A6E3F" />
                            <Text style={styles.rolesTitle}>Роли в системе</Text>
                        </View>

                        <View style={styles.rolesList}>
                            {profile.roles.map((userRole, index) => (
                                <View key={index} style={styles.roleBadge}>
                                    <Text style={styles.roleText}>{userRole}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Быстрые действия */}
                <View style={styles.actionsCard}>
                    <View style={styles.actionsHeader}>
                        <Text style={styles.actionsTitle}>Быстрые действия</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => navigation.navigate('EventsScreen' as never)}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#F5F3FF' }]}>
                            <Icon name="calendar" size={20} color="#7C3AED" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Мои события</Text>
                            <Text style={styles.actionSubtitle}>
                                {profile.events.length} мероприятий
                            </Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionItem}
                        onPress={() => navigation.navigate('CatalogScreen' as never)}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: '#F0FDF9' }]}>
                            <Icon name="folder" size={20} color="#0D9488" />
                        </View>
                        <View style={styles.actionContent}>
                            <Text style={styles.actionTitle}>Мои документы</Text>
                            <Text style={styles.actionSubtitle}>
                                {profile.documents.length} документов
                            </Text>
                        </View>
                        <Icon name="chevron-right" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* Кнопка выхода */}
                <View style={styles.logoutSection}>
                    <Button
                        variant="outline"
                        onPress={handleLogout}
                        style={styles.logoutButton}
                    >
                        <Icon name="log-out" size={20} color="#DC2626" />
                        <Text style={styles.logoutText}>Выйти из системы</Text>
                    </Button>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
