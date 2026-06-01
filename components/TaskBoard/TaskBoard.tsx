import { taskService } from '@/api/taskService';
import { TaskCard } from "@/components/TaskBoard/TaskCard";
import { Select } from "@/components/ui/Shared/Select";
import { SkeletonLoader } from "@/components/ui/Shared/SkeletonLoader";
import { Task } from '@/models/TaskBoardModel';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
    AlertCircle,
    Clock,
    Plus,
    RotateCcw
} from 'lucide-react-native';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    FlatList,
    Text,
    TouchableOpacity,
    View,
    RefreshControl, InteractionManager
} from 'react-native';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from './task-board-style';
import { AuthManager } from "@/components/LoginScreen/LoginScreen";
import { declOfNum } from '@/utils';
import { Filters } from '../ui/Shared/Filters';

type TaskMode = 'all' | 'my_tasks' | 'assigned' | 'authored';
type StatusItem = { name: string; isDefault: boolean };

export function TaskBoard() {
    const userRole = AuthManager.getRole();
    const params = useLocalSearchParams<{ isMine?: string }>();

    // Используем ref для хранения предыдущего состояния параметра
    const prevIsMineParamRef = useRef<string | undefined>(undefined);

    const [taskMode, setTaskMode] = useState<TaskMode>('all'); // По умолчанию все задачи
    const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [statuses, setStatuses] = useState<StatusItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const insets = useSafeAreaInsets();
    const [isReady, setIsReady] = useState(false);

    // Функция для определения начального режима при заходе на экран
    const getInitialTaskMode = useCallback((): TaskMode => {
        // Если параметр isMine = "true" ИЛИ пользователь не админ, показываем только мои задачи
        const isMineActive = params.isMine === "true";

        if (isMineActive || userRole !== 'Admin') {
            return 'my_tasks';
        }

        // Иначе (админ и нет параметра isMine) показываем все задачи
        return 'all';
    }, [params.isMine, userRole]);

    // Эффект для обновления режима при изменении параметров (каждый фокус)
    useFocusEffect(
        useCallback(() => {
            const newTaskMode = getInitialTaskMode();

            // Проверяем, изменился ли режим
            setTaskMode(prevMode => {
                if (prevMode !== newTaskMode) {
                    return newTaskMode;
                }
                return prevMode;
            });

            // Сбрасываем фильтр статуса при каждом заходе (опционально)
            // setFilterStatus('all');
        }, [getInitialTaskMode])
    );

    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                // @ts-ignore
                const data = await taskService.getStatuses();
                setStatuses(data);
            } catch (err) {
                console.error('Ошибка при загрузке статусов:', err);
            }
        };

        fetchStatuses();
    }, []);

    const loadTasks = useCallback(async (isSilentRefresh = false) => {
        if (!isSilentRefresh) setLoading(true);
        setError(null);

        try {
            let apiData: Task[] = [];

            switch (taskMode) {
                case 'all':
                    // @ts-ignore
                    apiData = userRole === 'Admin'
                        ? await taskService.getAllTasks()
                        : await taskService.getTasksByCurrentUser();
                    break;
                case 'my_tasks':
                    // @ts-ignore
                    apiData = await taskService.getTasksByCurrentUser();
                    break;
                case 'assigned':
                    // @ts-ignore
                    apiData = await taskService.getAssignedTasks();
                    break;
                case 'authored':
                    // @ts-ignore
                    apiData = await taskService.getAuthorTasks();
                    break;
                default:
                    // @ts-ignore
                    apiData = await taskService.getTasksByCurrentUser();
            }

            setTasks(apiData);
        } catch (error: any) {
            console.error('Ошибка при загрузке задач:', error);
            const errorMessage = error?.message || 'Не удалось загрузить задачи';
            setError(errorMessage);
            setTasks([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [taskMode, userRole]);

    useFocusEffect(
        useCallback(() => {
            loadTasks(true);
        }, [loadTasks])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadTasks(true);
    }, [loadTasks]);

    useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            setIsReady(true);
        });

        return () => task.cancel();
    }, []);

    // Фильтрация
    let filteredTasks = filterStatus === 'all'
        ? [...tasks]
        : tasks.filter(task => task.status.toLowerCase() === filterStatus.toLowerCase());

    // Сортировка
    if (sortBy === 'priority') {
        filteredTasks.sort((a, b) => a.priority - b.priority);
    } else {
        filteredTasks.sort((a, b) => new Date(a.expected_end_date).getTime() - new Date(b.expected_end_date).getTime());
    }

    const handleTaskPress = (id: string) => {
        router.push({ pathname: '/(screens)/TaskBoardScreen/TaskDetailScreen', params: { id: id } });
    };

    const handleNewTask = () => {
        router.push('/(screens)/TaskBoardScreen/NewTaskScreen');
    };

    // Формируем список режимов (все доступные варианты)
    const taskModeItems = [
        ...(userRole === 'Admin' ? [{ label: 'Все', value: 'all' }] : []),
        { label: 'Мои задачи', value: 'my_tasks' },
        { label: 'Назначенные мной', value: 'assigned' },
        { label: 'Созданные мной', value: 'authored' },
    ];

    // Динамически формируем список статусов для селекта
    const statusItems = [
        { label: 'Все', value: 'all' },
        ...statuses.map(s => ({ label: s.name, value: s.name }))
    ];

    if (!isReady) {
        return <View style={{flex: 1, backgroundColor: 'white'}} />;
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.header, { paddingTop: insets.top + 15 }]}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Задачи</Text>
                    <Text style={styles.headerSubtitle}>
                        {loading ? 'Загрузка...' : `${filteredTasks.length} ${declOfNum(filteredTasks.length, ['задача', 'задачи', 'задач'])}`}
                    </Text>
                </View>
                <TouchableOpacity style={styles.newTaskButton} onPress={handleNewTask}>
                    <View pointerEvents="none">
                        <Plus size={20} color="white" />
                    </View>
                </TouchableOpacity>
            </LinearGradient>

            {!error && (
                <Filters
                    title1={"Источник"}
                    title2={"Статус"}
                    selectComponent1={
                        <Select
                            value={taskMode}
                            onValueChange={(v) => setTaskMode(v as TaskMode)}
                            items={taskModeItems}
                            placeholder="Источник"
                        />
                    }
                    selectComponent2={
                        <Select
                            value={filterStatus}
                            onValueChange={(v) => setFilterStatus(v as string | 'all')}
                            items={statusItems}
                            placeholder="Статус"
                        />
                    }
                />
            )}

            {error ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
                    <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
                    <Text style={{ fontSize: 16, fontWeight: '600', textAlign: 'center' }}>Ошибка загрузки</Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginVertical: 8 }}>{error}</Text>
                    <TouchableOpacity onPress={() => loadTasks()}>
                        <RotateCcw size={16} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 8 }}>Повторить</Text>
                    </TouchableOpacity>
                </View>
            ) : loading && !refreshing ? (
                <View style={{ flex: 1, marginTop: -10}}>
                    <SkeletonLoader count={5} itemHeight={96} itemMargin={12} />
                </View>
            ) : (
                <FlatList
                    data={filteredTasks}
                    keyExtractor={(item) => item.task_id}
                    renderItem={({ item }) => (
                        <TaskCard
                            task={item}
                            onPress={() => handleTaskPress(item.task_id)}
                        />
                    )}
                    contentContainerStyle={styles.taskList}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#2A6E3F']}
                            tintColor="#2A6E3F"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Clock size={32} color="#9CA3AF" />
                            </View>
                            <Text style={styles.emptyTitle}>Задач не найдено</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}