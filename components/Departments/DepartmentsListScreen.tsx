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
    Modal,
    Alert, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiUrl } from "@/api/api";
import { Department } from "@/models/DepartmentModel";
import { AuthManager } from "@/components/LoginScreen/LoginScreen";
import Toast from "react-native-toast-message";
import {Building2, Plus, Trash2} from "lucide-react-native";
import {CreateDepartmentPopup} from "@/components/Departments/CreateDepartmentPopup";
import { declOfNum } from '@/utils';
import {Search} from "@/components/ui/Shared/Search";

const DepartmentsListScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const [modalVisible, setModalVisible] = useState(false);
    const [creating, setCreating] = useState(false);

    const token = AuthManager.getToken();

    const applyFilters = useCallback((allDepartments: Department[], query: string) => {
        if (!query.trim()) {
            setFilteredDepartments(allDepartments);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const result = allDepartments.filter(dept =>
            dept.name.toLowerCase().includes(lowerQuery)
        );
        setFilteredDepartments(result);
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/Department/get-all`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                setDepartments([]);
                setFilteredDepartments([]);
                return;
            }

            const text = await response.text();
            const data = text ? JSON.parse(text) : [];

            setDepartments(data);
            applyFilters(data, searchQuery);
        } catch (error) {
            console.error("Ошибка при загрузке отделов:", error);
            Toast.show({
                type: 'error',
                text1: 'Ошибка',
                text2: 'Не удалось загрузить список отделов'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const createDepartment = async (name: string) => {
        setCreating(true);
        try {
            const response = await fetch(
                `${apiUrl}/api/Department/create?department=${encodeURIComponent(name.trim())}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.ok) {
                Toast.show({ type: 'success', text1: 'Успешно', text2: 'Отдел создан' });
                await fetchDepartments();
                // Закрытие модалки произойдет внутри CreateDepartmentPopup после вызова handleCreate
            } else {
                throw new Error('Ошибка сервера');
            }
        } catch (error) {
            Toast.show({ type: 'error', text1: 'Ошибка', text2: 'Не удалось создать отдел' });
            throw error; // Чтобы попап не закрылся при ошибке
        } finally {
            setCreating(false);
        }
    };

    const deleteDepartment = (departmentId: string, departmentName: string) => {
        Alert.alert(
            'Удаление отдела',
            `Вы уверены, что хотите удалить отдел "${departmentName}"?`,
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await fetch(
                                `${apiUrl}/api/Department/delete/${departmentId}`,
                                {
                                    method: 'DELETE',
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    }
                                }
                            );

                            if (response.ok) {
                                Toast.show({
                                    type: 'success',
                                    text1: 'Успешно',
                                    text2: 'Отдел удален'
                                });
                                await fetchDepartments();
                            } else {
                                throw new Error('Ошибка при удалении');
                            }
                        } catch (error) {
                            console.error("Ошибка при удалении отдела:", error);
                            Toast.show({
                                type: 'error',
                                text1: 'Ошибка',
                                text2: 'Не удалось удалить отдел'
                            });
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDepartments();
    };

    const renderDepartmentItem = ({ item }: { item: Department }) => (
        <TouchableOpacity
            style={styles.departmentCard}
            onPress={() => router.push({
                pathname: '/(screens)/DepartmentsScreen/DepartmentDetailsScreen',
                params: { id: item.id, name: item.name }
            })}
        >
            <View style={styles.departmentIcon}>
                <Building2 size={22} color="#2A6E3F" />
            </View>

            <View style={styles.departmentInfo}>
                <Text style={styles.departmentName}>{item.name}</Text>
                <Text style={styles.departmentId}>ID: {item.id.slice(0, 8)}...</Text>
            </View>

            <TouchableOpacity
                onPress={() => deleteDepartment(item.id, item.name)}
                style={styles.deleteButton}
            >
                <View pointerEvents={"none"}>
                    <Trash2 size={16} color="#000" />
                </View>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#fff', paddingBottom: insets.bottom + 50 }}>
            <StatusBar barStyle="light-content" translucent />

            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 15 }]}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Отделы</Text>
                    <Text style={styles.headerSubtitle}>
                        {loading ? 'Загрузка...' : `${filteredDepartments.length} ${declOfNum(filteredDepartments.length, ['отдел', 'отдела', 'отделов'])}`}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.newTaskButton}
                    onPress={() => setModalVisible(true)}
                >
                    <View pointerEvents={"none"}>
                        <Plus size={20} color="white" />
                    </View>
                </TouchableOpacity>
            </LinearGradient>
            <Search
                placeholder={"Название отдела"}
                searchQuery={searchQuery}
                onChangeText={(t) => {
                    setSearchQuery(t);
                    applyFilters(departments, t);
                }}
            />

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2A6E3F" />
                </View>
            ) : (
                <FlatList
                    data={filteredDepartments}
                    keyExtractor={(item) => item.id}
                    renderItem={renderDepartmentItem}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2A6E3F']} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="business-outline" size={48} color="#9CA3AF" />
                            <Text style={styles.emptyTitle}>Нет отделов</Text>
                            <Text style={styles.emptySubtitle}>Создайте первый отдел</Text>
                        </View>
                    }
                />
            )}

            <CreateDepartmentPopup
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onCreate={createDepartment}
                loading={creating}
            />
        </View>
    );
};

const styles = StyleSheet.create({
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
    listContainer: { padding: 15, paddingTop: 10 },
    departmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    departmentIcon: {
        width: 40,
        height: 40,
        borderRadius: 25,
        backgroundColor: '#ebfdeb',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    departmentInfo: { flex: 1 },
    departmentName: { fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 4 },
    departmentId: { fontSize: 12, color: '#64748b' },
    deleteButton: {
        padding: 8,
        borderRadius: 8,
    },
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
        width: '90%',
        maxWidth: 400,
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
    modalBody: { padding: 20 },
    inputLabel: { fontSize: 14, fontWeight: '500', color: '#64748b', marginBottom: 8 },
    modalInput: {
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    modalFooter: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: { backgroundColor: '#f1f5f9' },
    cancelButtonText: { color: '#64748b', fontWeight: '500' },
    createButton: { backgroundColor: '#2A6E3F' },
    createButtonText: { color: '#fff', fontWeight: '500' },
});

export default DepartmentsListScreen;
