import { taskService } from '@/api/taskService';
import { TaskCard } from "@/components/TaskBoard/TaskCard";
import { Select } from "@/components/ui/Select";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { Task, TaskPriority, TaskStatus } from '@/data/types';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
    AlertCircle,
    Clock,
    Plus,
    RotateCcw
} from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react'; // Добавлен useCallback
import {
    FlatList,
    Text,
    TouchableOpacity,
    View,
    RefreshControl // Добавлен RefreshControl
} from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from './task-board-style';

export function TaskBoard() {
    const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false); // Состояние для pull-to-refresh
    const [error, setError] = useState<string | null>(null);
    const insets = useSafeAreaInsets();

    // Загрузка задач с API
    const loadTasks = async (isSilentRefresh = false) => {
        // Если это не фоновое обновление, показываем полный лоадер/скелетон
        if (!isSilentRefresh) setLoading(true);

        setError(null);
        try {
            const apiData = await taskService.getAllTasks();
            const adaptedData: Task[] = (apiData as any[]).map((item: any) => ({
                id: item.taskId,
                authorId: item.authorId || '',
                authorName: item.authorName || '',
                title: item.title,
                description: item.description,
                status: (item.status || 'created') as TaskStatus,
                priority: (item.priority === 0 ? 'low' : item.priority === 1 ? 'medium' : item.priority === 2 ? 'high' : 'urgent') as TaskPriority,
                assignedTo: item.assignedTo || '',
                createdAt: item.startDate || new Date().toISOString(),
                dueDate: item.expectedEndDate || new Date().toISOString(),
                tags: item.tags || [],
                users: item.users || [],
            }));
            setTasks(adaptedData);
        } catch (error: any) {
            console.error('Ошибка при загрузке задач:', error);
            const errorMessage = error?.message || 'Не удалось загрузить задачи';
            setError(errorMessage);
            setTasks([]);
        } finally {
            setLoading(false);
            setRefreshing(false); // Выключаем индикатор обновления
        }
    };

    // Обработчик Pull-to-Refresh
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadTasks(true); // Загружаем "тихо" (без скелетона на весь экран)
    }, []);

    useEffect(() => {
        loadTasks();
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadTasks(true); // При фокусе обновляем без перекрытия экрана скелетоном
        }, [])
    );

    // Фильтрация и сортировка (без изменений)
    let filteredTasks = filterStatus === 'all'
        ? [...tasks]
        : tasks.filter(task => task.status === filterStatus);

    if (sortBy === 'priority') {
        const priorityOrder: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        filteredTasks.sort((a, b) => priorityOrder[a.priority as TaskPriority] - priorityOrder[b.priority as TaskPriority]);
    } else {
        filteredTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }

    const handleTaskPress = (id: string) => {
        router.push({ pathname: '/TaskDetailScreen', params: { id } });
    };

    const handleNewTask = () => {
        router.push('/NewTaskScreen');
    };

    // Рендер компонента
    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Header */}
            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 5 }]}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Задачи</Text>
                    <Text style={styles.headerSubtitle}>
                        {loading ? 'Загрузка...' : `${filteredTasks.length} задач`}
                    </Text>
                </View>
                <TouchableOpacity style={styles.newTaskButton} onPress={handleNewTask}>
                    <Plus size={20} color="white" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Фильтры показываем всегда, если нет ошибки */}
            {!error && (
                <LinearGradient colors={['#ebfdeb', '#fff']} style={styles.filtersSection}>
                    <View style={styles.filtersGrid}>
                        <View style={styles.filterGroup}>
                            <Text style={styles.filterLabel}>Фильтр</Text>
                            <Select
                                value={filterStatus}
                                onValueChange={(v) => setFilterStatus(v as TaskStatus | 'all')}
                                items={[
                                    { label: 'Все задачи', value: 'all' },
                                    { label: 'Новые', value: 'created' },
                                    { label: 'В работе', value: 'in_progress' },
                                    { label: 'На согласовании', value: 'approval' },
                                    { label: 'Завершенные', value: 'completed' },
                                ]}
                                placeholder="Все задачи"
                            />
                        </View>
                        <View style={styles.filterGroup}>
                            <Text style={styles.filterLabel}>Сортировка</Text>
                            <Select
                                value={sortBy}
                                onValueChange={(v) => setSortBy(v as 'date' | 'priority')}
                                items={[
                                    { label: 'По дате', value: 'date' },
                                    { label: 'По приоритету', value: 'priority' },
                                ]}
                                placeholder="По дате"
                            />
                        </View>
                    </View>
                </LinearGradient>
            )}

            {/* Контент: Ошибка / Скелетон / Список */}
            {error ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
                    <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
                    <Text style={{ fontSize: 16, fontWeight: '600', textAlign: 'center' }}>Ошибка загрузки</Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginVertical: 8 }}>{error}</Text>
                    <TouchableOpacity style={styles.errorButton} onPress={() => loadTasks()}>
                        <RotateCcw size={16} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Повторить</Text>
                    </TouchableOpacity>
                </View>
            ) : loading && !refreshing ? (
                /* Скелетон карточек при первой загрузке */
                <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
                    <SkeletonLoader count={5} itemHeight={110} itemMargin={12} />
                </View>
            ) : (
                <FlatList
                    data={filteredTasks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TaskCard
                            task={item}
                            onPress={() => handleTaskPress(item.id)}
                        />
                    )}
                    contentContainerStyle={styles.taskList}
                    showsVerticalScrollIndicator={false}
                    // Pull to refresh логика
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#2A6E3F']} // Android
                            tintColor="#2A6E3F"  // iOS
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Clock size={32} color="#9CA3AF" />
                            </View>
                            <Text style={styles.emptyTitle}>Задач не найдено</Text>
                            <Text style={styles.emptySubtitle}>Попробуйте изменить фильтры</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
