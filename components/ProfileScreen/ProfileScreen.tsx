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
    Alert, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {UserX, LogOut, Mail, Shield, Calendar, ListTodo, ChevronRight, Building2, Edit} from 'lucide-react-native';
import {Profile} from "@/models/ProfileModel";
import {declOfNum} from "@/utils";
import { useFocusEffect } from '@react-navigation/native';
import {apiClient} from "@/api/api";


const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name[0].toUpperCase();
};

const translateRole = (role: string): string => {
    const roleMap: Record<string, string> = {
        'Admin': 'Администратор',
        'Deputy': 'Депутат',
        'Helper': 'Помощник депутата'
    };
    return roleMap[role] || role;
};


export function ProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const navigation = useNavigation();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const userId = AuthManager.getUserId();
    const userRole = AuthManager.getRole();

    const loadProfile = useCallback(async () => {
        try {
            const url = id ? `/api/Auth/${id}` : '/api/Auth/current';

            const { data } = await apiClient.get(url);
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

    useFocusEffect(
        useCallback(() => {
            loadProfile();
        }, [loadProfile])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadProfile();
    };

    const handleLogout = () => {
        if (Platform.OS === 'web') {
            if (window.confirm('Вы уверены, что хотите выйти?')) {
                AuthManager.clearAuth();
                router.push("/login");
            }
        } else {
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
        }
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
        <View style={{ flex: 1, backgroundColor: '#f8fafc', paddingBottom: insets.bottom + 35 }}>
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
                        <View style={styles.headerButtons}>
                            {(profile.id === userId || userRole === "Admin") && (
                                <TouchableOpacity
                                    style={styles.iconButton}
                                    onPress={() => router.push({pathname: '/(screens)/UsersScreen/CreateUserScreen', params: { id: profile.id}})}
                                >
                                    <View pointerEvents={"none"}>
                                        <Edit size={20} color="white" />
                                    </View>
                                </TouchableOpacity>
                            )}
                            {!id && (
                                <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
                                    <View pointerEvents={"none"}>
                                        <LogOut size={20} color="white" />
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>
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
                                                <Text style={styles.roleText}>{translateRole(userRole)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Секция: Подразделение (Департамент) */}
                    {profile.department && profile.department?.name !== "unknown"  && (
                        <>
                            <Text style={styles.sectionTitle}>Подразделение</Text>
                            <TouchableOpacity
                                style={[styles.card, styles.departmentCard]}
                                onPress={() => router.push({
                                    pathname: '/(screens)/DepartmentsScreen/DepartmentDetailsScreen',
                                    params: { id: profile.department?.id, name: profile.department?.name }
                                })}
                            >
                                <View style={styles.departmentIcon}>
                                    <Building2 size={24} color="#2A6E3F" />
                                </View>
                                <View style={styles.departmentInfo}>
                                    <Text style={styles.departmentName}>{profile.department?.name || profile.department}</Text>
                                    <Text style={styles.departmentId}>
                                        ID: {profile.department?.id && profile.department.id !== '00000000-0000-0000-0000-000000000000'
                                        ? `${profile.department.id.slice(0, 8)}...`
                                        : 'Не назначен'}
                                    </Text>
                                </View>
                                <ChevronRight size={20} color="#cbd5e1" />
                            </TouchableOpacity>
                        </>
                    )}

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
                                    Участвует в {profile?.events?.length || profile?.event_count || 0} {
                                    declOfNum(
                                        profile?.events?.length || profile?.event_count || 0,
                                        ['мероприятии', 'мероприятиях', 'мероприятиях']
                                    )
                                }
                                </Text>
                            </View>
                            <ChevronRight size={20} color="#cbd5e1" />
                        </TouchableOpacity>

                        <View style={styles.actionDivider} />

                        <TouchableOpacity
                            style={styles.actionItem}
                            onPress={() => navigation.navigate('TaskBoardScreen' as never)}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#f0fdf4' }]}>
                                <ListTodo size={20} color="#16a34a" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>Задачи</Text>
                                <Text style={styles.actionSubtitle}>
                                    Назначено {profile?.tasks?.length || profile?.task_count || 0} {
                                    declOfNum(
                                        profile?.tasks?.length || profile?.task_count || 0,
                                        ['задача', 'задачи', 'задач']
                                    )
                                }
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
    headerButtons: {
        flexDirection: 'row',
        gap: 15,
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
    departmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    departmentIcon: {
        width: 36,
        height: 36,
        borderRadius: 14,
        backgroundColor: '#f0fdf4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    departmentInfo: {
        flex: 1,
    },
    departmentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    departmentId: {
        fontSize: 13,
        color: '#94a3b8',
    },
});
