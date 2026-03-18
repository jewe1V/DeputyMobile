import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    StatusBar,
    RefreshControl,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiUrl } from "@/api/api";
import { Profile } from "@/models/ProfileModel";
import { AuthManager } from "@/components/LoginScreen/LoginScreen";

const UsersListScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [users, setUsers] = useState<Profile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Добавляем недостающие состояния для фильтрации
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    const token = AuthManager.getToken();

    // Выносим фильтрацию в отдельную функцию, чтобы не дублировать логику
    const applyFilters = useCallback((allUsers: Profile[], query: string, role: string) => {
        let result = [...allUsers];

        if (role !== 'all') {
            result = result.filter(u => u.roles && u.roles.includes(role));
        }

        if (query.trim()) {
            const lowerQuery = query.toLowerCase();
            result = result.filter(u =>
                u.full_name?.toLowerCase().includes(lowerQuery) ||
                u.email?.toLowerCase().includes(lowerQuery)
            );
        }

        setFilteredUsers(result);
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/Auth/all`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            // ПРОВЕРКА: Если ответ пустой или не OK, не пытаемся парсить JSON
            if (!response.ok) {
                Toast.show()
                setUsers([]);
                setFilteredUsers([]);
                return;
            }

            const text = await response.text(); // Сначала берем как текст
            const data = text ? JSON.parse(text) : []; // Если текст есть — парсим, иначе пустой массив

            setUsers(data);
            applyFilters(data, searchQuery, roleFilter);
        } catch (error) {
            console.error("Ошибка при загрузке:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUsers();
    };

    const getRoleStyles = (roles: string[] | null) => {
        const role = roles?.[0];
        switch (role) {
            case 'Admin': return { bg: '#fee2e2', text: '#ef4444', label: 'Админ' };
            case 'Deputy': return { bg: '#dcfce7', text: '#166534', label: 'Депутат' };
            case 'Helper': return { bg: '#e0f2fe', text: '#0369a1', label: 'Помощник' };
            default: return { bg: '#f1f5f9', text: '#64748b', label: 'Сотрудник' };
        }
    };

    const renderUserItem = ({ item }: { item: Profile }) => {
        const roleStyle = getRoleStyles(item.roles);

        return (
            <TouchableOpacity
                style={styles.userCard}
                onPress={() => router.push({ pathname: '/(screens)/ProfileScreen', params: { id: item.id } })}
            >
                <View style={[styles.avatar, { backgroundColor: '#dcfce7' }]}>
                    <Text style={styles.avatarText}>
                        {(item.full_name || item.email || '?').charAt(0).toUpperCase()}
                    </Text>
                </View>

                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>
                        {item.full_name || 'Без имени'}
                    </Text>
                    <Text style={styles.jobText} numberOfLines={1}>
                        {item.job_title || item.email}
                    </Text>
                </View>

                <View style={[styles.roleBadge, { backgroundColor: "#f1f5f9" }]}>
                    <Text style={[styles.roleBadgeText, { color: "#64748b" }]}>
                        {roleStyle.label}
                    </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <StatusBar barStyle="light-content" translucent />

            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 15 }]}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Пользователи</Text>
                    <Text style={styles.headerSubtitle}>
                        {loading ? 'Загрузка...' : `${filteredUsers.length} человек`}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.newTaskButton}
                    onPress={() => router.push('/(forms)/CreateUserScreen')}
                >
                    <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
            </LinearGradient>

            <LinearGradient colors={['#ebfdeb', '#fff']} style={styles.filtersSection}>
                <Text style={styles.filtersLabel}>Поиск</Text>
                <View style={styles.searchWrapper}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Имя или email"
                        value={searchQuery}
                        onChangeText={(t) => {
                            setSearchQuery(t);
                            applyFilters(users, t, roleFilter);
                        }}
                    />
                </View>
            </LinearGradient>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2A6E3F" />
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item.id}
                    renderItem={renderUserItem}
                    contentContainerStyle={styles.taskList}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2A6E3F']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                            <Text style={styles.emptyTitle}>Никого не нашли</Text>
                            <Text style={styles.emptySubtitle}>Измените параметры поиска</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingHorizontal: 30,
        paddingBottom: 50,
    },
    headerContent: { marginLeft: 0 },
    headerTitle: { fontSize: 24, fontWeight: '600', color: '#FFFFFF' },
    headerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 },
    newTaskButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: "auto"
    },
    filtersSection: {
        padding: 12,
        marginTop: -40,
        borderRadius: 20,
        marginHorizontal: 15,
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    filtersLabel: {
        marginLeft: 6,
        marginBottom: 2,
        fontSize: 14,
        fontWeight: '600',
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        paddingHorizontal: 10,
        height: 40,
    },
    searchInput: { flex: 1, fontSize: 14, fontWeight: 600, borderColor: '#000000' },
    taskList: { padding: 15, paddingTop: 10 },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: { fontWeight: '700', color: '#166534', fontSize: 16 },
    userInfo: { flex: 1 },
    userName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
    jobText: { fontSize: 13, color: '#64748b', marginTop: 1 },
    roleBadge: { paddingHorizontal: 4, borderRadius: 4, marginLeft: 8 },
    roleBadgeText: { fontSize: 11, fontWeight: '700' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: '#4b5563', marginTop: 12 },
    emptySubtitle: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
});

export default UsersListScreen;
