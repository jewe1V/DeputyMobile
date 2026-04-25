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
import {renderUserItem} from "@/components/UsersScreen/RenderUserItem";
import {declOfNum} from "@/utils";
import {Plus} from "lucide-react-native";
import {Search} from "@/components/ui/Shared/Search";

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


    return (
        <View style={{ flex: 1, backgroundColor: '#fff', paddingBottom: insets.bottom + 50 }}>
            <StatusBar barStyle="light-content" translucent />

            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 15 }]}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Пользователи</Text>
                    <Text style={styles.headerSubtitle}>
                        {loading ? 'Загрузка...' : `${filteredUsers.length} ${declOfNum(filteredUsers.length, ['человек', 'человека', 'человек'])}`}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.newTaskButton}
                    onPress={() => router.push('/(screens)/UsersScreen/CreateUserScreen')}
                >
                    <View pointerEvents={"none"}>
                        <Plus size={20} color="white" />
                    </View>
                </TouchableOpacity>
            </LinearGradient>

            <Search
                placeholder={"Имя или email"}
                searchQuery={searchQuery}
                onChangeText={(t) => {
                    setSearchQuery(t);
                    applyFilters(users, t, roleFilter);
                }}
            />

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

export const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        paddingBottom: 40, // Увеличил padding, чтобы фильтр красиво перекрывал градиент
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    headerContent: {
        marginLeft: 10
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 1,
    },
    newTaskButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: "auto"
    },
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
