import {apiUrl} from '@/api/api'
import {AuthManager} from '@/components/LoginScreen/LoginScreen';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserX, LogOut, Mail, Shield, Calendar, ListTodo, ChevronRight } from 'lucide-react-native';


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
    const { id } = useLocalSearchParams<{ id: string }>();
    const navigation = useNavigation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [profile, setProfile] = useState<any | null>(null); // Замените any на ProfileScreenDto
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadProfile = useCallback(async () => {
        try {
            const token = AuthManager.getToken();
            const url = id ? `${apiUrl}/api/Auth/${id}` : `${apiUrl}/api/Auth/current`;

            const response = await fetch(url, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();
            setProfile(data);
        } catch (error) {
            console.error('Profile load error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        loadProfile();
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
                onPress: async () => {
                    await AuthManager.clearAuth();
                    router.push("/login");
                }
            },
        ]);
    };

    if (loading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2A6E3F" />
                </View>
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.errorContainer}>
                    <UserX size={48} color="#94a3b8" />
                    <Text style={styles.errorTitle}>Профиль не найден</Text>
                    <TouchableOpacity onPress={() => router.push('/login')} style={styles.errorButton}>
                        <Text style={styles.errorButtonText}>Войти</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
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
                <LinearGradient
                    colors={['#2A6E3F', '#349339']}
                    style={[styles.header, { paddingTop: insets.top + 15 }]}
                >
                    <View style={styles.headerTopRow}>
                        <Text style={styles.headerTitle}>Профиль</Text>
                        {!id && ( // Показываем кнопку выхода, если это свой профиль
                            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
                                <LogOut size={20} color="white" />
                            </TouchableOpacity>
                        )}
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Profile Card */}
                    <View style={styles.card}>
                        <View style={styles.avatarContainer}>
                            <View style={styles.avatarBase}>
                                <Text style={styles.avatarText}>
                                    {getInitials(profile.full_name || '?')}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.userInfo}>
                            <Text style={styles.userName}>{profile.full_name}</Text>
                            <Text style={styles.userTitle}>{profile.job_title || 'Сотрудник'}</Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Основная информация */}
                        <View style={styles.infoSection}>
                            <View style={styles.infoRow}>
                                <View style={[styles.infoIconBox, { backgroundColor: '#f1f5f9' }]}>
                                    <Mail size={18} color="#64748b" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Email</Text>
                                    <Text style={styles.infoValue}>{profile.email}</Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <View style={[styles.infoIconBox, { backgroundColor: '#f1f5f9' }]}>
                                    <Shield size={18} color="#64748b" />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Роли в системе</Text>
                                    <View style={styles.rolesList}>
                                        {profile.roles?.map((userRole: string, index: number) => (
                                            <View key={index} style={styles.roleBadge}>
                                                <Text style={styles.roleText}>{userRole}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Быстрые действия */}
                    <Text style={styles.sectionTitle}>Активность</Text>

                    <View style={[styles.card, { padding: 0, overflow: 'hidden' }]}>
                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('EventsScreen' as never)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#f5f3ff' }]}>
                                <Calendar size={20} color="#7c3aed" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>События</Text>
                                <Text style={styles.actionSubtitle}>
                                    Участвует в {profile.event_count || 0} мероприятиях
                                </Text>
                            </View>
                            <ChevronRight size={20} color="#cbd5e1" />
                        </TouchableOpacity>

                        <View style={styles.actionDivider} />

                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('CatalogScreen' as never)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#f0fdf4' }]}>
                                <ListTodo size={20} color="#16a34a" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>Задачи</Text>
                                <Text style={styles.actionSubtitle}>
                                    Назначено {profile.task_count || 0} задач
                                </Text>
                            </View>
                            <ChevronRight size={20} color="#cbd5e1" />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginTop: 16,
        marginBottom: 8,
    },
    errorButton: {
        backgroundColor: '#2A6E3F',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    errorButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },

    // Header
    header: {
        paddingHorizontal: 20,
        paddingBottom: 70, // Оставляем место под карточку
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Content wrapper
    content: {
        paddingHorizontal: 16,
        marginTop: -55,
    },

    // Unified Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },

    // Profile specifics
    avatarContainer: {
        alignItems: 'center',
        marginTop: -40, // Поднимаем аватар над карточкой
        marginBottom: 12,
    },
    avatarBase: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2A6E3F',
        borderWidth: 4,
        borderColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '700',
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
        textAlign: 'center',
    },
    userTitle: {
        fontSize: 14,
        color: '#64748b',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginVertical: 16,
    },

    // Info Section
    infoSection: {
        gap: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: '#64748b',
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    rolesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginTop: 4,
    },
    roleBadge: {
        backgroundColor: '#dcfce7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#166534',
    },

    // Actions Section
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 12,
        marginLeft: 4,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
    },
    actionSubtitle: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 2,
    },
    actionDivider: {
        height: 1,
        backgroundColor: '#f1f5f9',
        marginLeft: 70, // Линия начинается после иконки
    },
});
