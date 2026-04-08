import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    RefreshControl,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiUrl } from "@/api/api";
import { Profile } from "@/models/ProfileModel";
import { AuthManager } from "@/components/LoginScreen/LoginScreen";
import Toast from "react-native-toast-message";
import {renderUserItem} from "@/components/UsersScreen/RenderUserItem";
import { AddUserPopup } from "./AddUserPopup";
import {ArrowLeft, Plus} from "lucide-react-native";
import {declOfNum} from "@/utils";

const DepartmentDetailScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id, name } = useLocalSearchParams<{ id: string; name: string }>();

    const [users, setUsers] = useState<Profile[]>([]);
    const [allUsers, setAllUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [addUserModal, setAddUserModal] = useState(false);
    const [addingUser, setAddingUser] = useState(false);

    const userRole = AuthManager.getRole();
    const token = AuthManager.getToken();

    const fetchDepartmentUsers = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/Department/get-users/${id}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                setUsers([]);
                return;
            }

            const text = await response.text();
            const data = text ? JSON.parse(text) : [];
            setUsers(data);
        } catch (error) {
            console.error("Ошибка при загрузке пользователей отдела:", error);
        }
    };

    const handleAddPress = (userId: string) => {
        const user = allUsers.find(u => u.id === userId);
        Alert.alert(
            'Добавить пользователя',
            `Добавить ${user?.full_name || user?.email} в отдел?`,
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Добавить',
                    onPress: () => addUsersToDepartment([userId])
                }
            ]
        );
    };

    const fetchAllUsers = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/Auth/all`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                setAllUsers([]);
                return;
            }

            const text = await response.text();
            const data = text ? JSON.parse(text) : [];
            setAllUsers(data);
        } catch (error) {
            console.error("Ошибка при загрузке всех пользователей:", error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        await Promise.all([fetchDepartmentUsers(), fetchAllUsers()]);
        setLoading(false);
    };

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const onRefresh = () => {
        setRefreshing(true);
        loadData().finally(() => setRefreshing(false));
    };

    const addUsersToDepartment = async (userIds: string[]) => {
        setAddingUser(true);
        try {
            const response = await fetch(`${apiUrl}/api/Department/add-users/${id}`, {
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json-patch+json'
                },
                body: JSON.stringify(userIds)
            });

            if (response.ok) {
                Toast.show({
                    type: 'success',
                    text1: 'Успешно',
                    text2: 'Пользователи добавлены в отдел'
                });
                setAddUserModal(false);
                await fetchDepartmentUsers();
            } else {
                throw new Error('Ошибка при добавлении');
            }
        } catch (error) {
            console.error("Ошибка при добавлении пользователей:", error);
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Не удалось добавить пользователей'
            });
        } finally {
            setAddingUser(false);
        }
    };

    const getAvailableUsers = () => {
        const departmentUserIds = new Set(users.map(u => u.id));
        return allUsers.filter(user => !departmentUserIds.has(user.id));
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <StatusBar barStyle="light-content" translucent />
            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                style={[styles.header, { paddingTop: insets.top + 15 }]}
            >
                <View style={styles.headerTopRow}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <View pointerEvents="none">
                            <ArrowLeft size={24} color="white" />
                        </View>
                    </TouchableOpacity>

                    {(userRole === "Admin") && (
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                style={styles.iconButton}
                                onPress={() => setAddUserModal(true)}
                            >
                                <View pointerEvents="none">
                                    <Plus size={20} color="white" />
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle} numberOfLines={3}>{name}</Text>
                    <Text style={styles.headerSubtitle}>
                        {users.length} {declOfNum(users.length, ['сотрудник', 'сотрудника', 'сотрудников'])}
                    </Text>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2A6E3F" />
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={renderUserItem}
                    contentContainerStyle={styles.listContainer}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2A6E3F']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={48} color="#9CA3AF" />
                            <Text style={styles.emptyTitle}>Нет сотрудников</Text>
                            <Text style={styles.emptySubtitle}>Добавьте пользователей в отдел</Text>
                        </View>
                    }
                />
            )}

            <AddUserPopup
                visible={addUserModal}
                onClose={() => setAddUserModal(false)}
                availableUsers={getAvailableUsers()}
                onAdd={handleAddPress}
                loading={addingUser}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    header: { paddingHorizontal: 20, paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
    headerActions: { flexDirection: 'row' },
    iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
    headerContent: {},
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF'},
    headerSubtitle: { fontSize: 13, fontWeight: '400', color: '#FFFFFF' },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: { padding: 16 },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    availableUserCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: { fontWeight: '700', color: '#166534', fontSize: 18 },
    userInfo: { flex: 1 },
    userName: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
    userEmail: { fontSize: 13, color: '#64748b', marginBottom: 2 },
    userJob: { fontSize: 12, color: '#94a3b8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyState: { alignItems: 'center', marginTop: 60 },
    emptyTitle: { fontSize: 16, fontWeight: '600', color: '#4b5563', marginTop: 12 },
    emptySubtitle: { fontSize: 14, color: '#9ca3af', marginTop: 4 },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '95%',
        maxHeight: '80%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: { fontSize: 18, fontWeight: '600', color: '#1e293b' },
    modalBody: { flex: 1, maxHeight: 500 },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
});

export default DepartmentDetailScreen;
