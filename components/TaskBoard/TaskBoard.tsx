import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    ArrowLeft,
    Plus,
    SlidersHorizontal,
    Calendar,
    Clock,
    ChevronDown, Bell
} from 'lucide-react-native';
import {currentUser, mockTasks} from '@/data/mockData';
import { Task, TaskStatus, TaskPriority } from '@/data/types';
import { styles } from './task-board-style';
import {router} from "expo-router";
import {LinearGradient} from "expo-linear-gradient";
import Animated, {FadeInUp} from "react-native-reanimated";

// Типы для навигации
type RootStackParamList = {
    Home: undefined;
    TaskDetail: { taskId: string };
    NewTask: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Цветовая палитра приоритетов в стиле Госуслуг
const priorityConfig: Record<TaskPriority, { label: string; color: string; dotColor: string }> = {
    low: {
        label: 'Низкий',
        color: '#9CA3AF', // gray-400
        dotColor: '#9CA3AF'
    },
    medium: {
        label: 'Средний',
        color: '#3B82F6', // blue-500
        dotColor: '#3B82F6'
    },
    high: {
        label: 'Высокий',
        color: '#F97316', // orange-500
        dotColor: '#F97316'
    },
    urgent: {
        label: 'Срочный',
        color: '#EF4444', // red-500
        dotColor: '#EF4444'
    },
};

// Визуальная тема карточки в зависимости от статуса
const statusTheme: Record<TaskStatus, { bgColor: string }> = {
    created: { bgColor: '#FFFFFF' },
    in_progress: { bgColor: 'rgba(59, 130, 246, 0.1)' }, // blue-50/30
    approval: { bgColor: 'rgba(251, 191, 36, 0.1)' }, // amber-50/30
    completed: { bgColor: 'rgba(34, 197, 94, 0.15)' }, // green-50/40
};

interface TaskCardProps {
    task: Task;
    onPress: () => void;
}

function TaskCard({ task, onPress }: TaskCardProps) {
    const dueDate = new Date(task.dueDate);
    const startDate = new Date(task.createdAt);
    const today = new Date();
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysLeft < 0 && task.status !== 'completed';
    const isUrgent = daysLeft <= 2 && daysLeft >= 0 && task.status !== 'completed';

    const priorityColor = priorityConfig[task.priority].color;
    const statusBg = statusTheme[task.status].bgColor;

    // Обрезаем описание до 70 символов
    const truncatedDescription = task.description.length > 70
        ? task.description.substring(0, 70) + '...'
        : task.description;

    // Форматирование даты
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
        });
    };

    return (
        <TouchableOpacity
            style={[
                styles.taskCard,
                {
                    backgroundColor: statusBg,
                    borderLeftColor: priorityColor,
                    borderLeftWidth: 4,
                },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Заголовок */}
            <Text style={styles.taskTitle} numberOfLines={2}>
                {task.title}
            </Text>

            {/* Приоритет с точкой */}
            <View style={styles.priorityContainer}>
                <View
                    style={[
                        styles.priorityDot,
                        { backgroundColor: priorityConfig[task.priority].dotColor },
                    ]}
                />
                <Text style={styles.priorityText}>
                    Приоритет: {priorityConfig[task.priority].label}
                </Text>
            </View>

            {/* Сроки */}
            <View style={styles.datesContainer}>
                <View style={styles.dateItem}>
                    <Calendar size={14} color="#9CA3AF" />
                    <Text style={styles.dateText}>
                        Создана: {formatDate(startDate)}
                    </Text>
                </View>
                <View style={styles.dateItem}>
                    <Clock size={14} color={isOverdue ? '#EF4444' : isUrgent ? '#F97316' : '#9CA3AF'} />
                    <Text style={[
                        styles.dateText,
                        isOverdue && styles.overdueText,
                        isUrgent && styles.urgentText
                    ]}>
                        Дедлайн: {formatDate(dueDate)}
                        {isOverdue && ' (просрочено)'}
                    </Text>
                </View>
            </View>

            {/* Описание */}
            <Text style={styles.description} numberOfLines={3}>
                {truncatedDescription}
            </Text>

            {/* Исполнитель и статус */}
            <View style={styles.footer}>
                <Text style={styles.assigneeText}>
                    Исполнитель: {task.assignedToProfile?.fullName.split(' ').slice(0, 2).join(' ')}
                </Text>
                {isOverdue && task.status !== 'completed' && (
                    <View style={styles.overdueBadge}>
                        <Text style={styles.overdueBadgeText}>Просрочено</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

interface SelectProps {
    value: string;
    onValueChange: (value: string) => void;
    items: Array<{ label: string; value: string }>;
    placeholder?: string;
}

function Select({ value, onValueChange, items, placeholder }: SelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedItem = items.find(item => item.value === value);

    return (
        <View style={styles.selectContainer}>
            <TouchableOpacity
                style={styles.selectTrigger}
                onPress={() => setIsOpen(!isOpen)}
            >
                <Text style={styles.selectValue}>
                    {selectedItem?.label || placeholder || 'Выберите...'}
                </Text>
                <ChevronDown size={16} color="#6B7280" />
            </TouchableOpacity>
            {isOpen && (
                <View style={[styles.selectContent]}>
                    {items.map((item) => (
                        <TouchableOpacity
                            key={item.value}
                            style={styles.selectItem}
                            onPress={() => {
                                onValueChange(item.value);
                                setIsOpen(false);
                            }}
                        >
                            <Text style={styles.selectItemText}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

export function TaskBoard() {
    const navigation = useNavigation<NavigationProp>();
    const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
    const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

    // Фильтрация
    let filteredTasks = filterStatus === 'all'
        ? [...mockTasks]
        : mockTasks.filter(task => task.status === filterStatus);

    // Сортировка
    if (sortBy === 'priority') {
        const priorityOrder: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else {
        filteredTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    }

    const handleTaskPress = (taskId: string) => {
        router.push('/TaskDetailScreen', { taskId });
    };

    const handleNewTask = () => {
        router.push('/NewTaskScreen');
    };

    const filterItems = [
        { label: 'Все задачи', value: 'all' },
        { label: 'Новые', value: 'created' },
        { label: 'В работе', value: 'in_progress' },
        { label: 'На согласовании', value: 'approval' },
        { label: 'Завершенные', value: 'completed' },
    ];

    const sortItems = [
        { label: 'По дате', value: 'date' },
        { label: 'По приоритету', value: 'priority' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#2A6E3F" barStyle="light-content" />

            {/* Header */}

            <LinearGradient
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.headerTitle}>Задачи</Text>
                    <Text style={styles.headerSubtitle}>{filteredTasks.length} задач</Text>
                </View>
                <TouchableOpacity style={styles.newTaskButton}>
                    <Plus size={20} color="white" />
                </TouchableOpacity>
            </LinearGradient>

            {/* Фильтры и сортировка */}
            <LinearGradient colors={['#ebfdeb','#fff']} style={styles.filtersSection}>
                <View style={styles.filtersGrid}>
                    {/* Фильтр по статусу */}
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Фильтр</Text>
                        <Select
                            value={filterStatus}
                            onValueChange={(v) => setFilterStatus(v as TaskStatus | 'all')}
                            items={filterItems}
                            placeholder="Все задачи"
                        />
                    </View>

                    {/* Сортировка */}
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>Сортировка</Text>
                        <Select
                            value={sortBy}
                            onValueChange={(v) => setSortBy(v as 'date' | 'priority')}
                            items={sortItems}
                            placeholder="По дате"
                        />
                    </View>
                </View>
                </LinearGradient>

            {/* Список задач */}
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
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <Clock size={32} color="#9CA3AF" />
                        </View>
                        <Text style={styles.emptyTitle}>Задач не найдено</Text>
                        <Text style={styles.emptySubtitle}>Попробуйте изменить фильтры</Text>
                    </View>
                }
                showsVerticalScrollIndicator={false}
            />

            {/* FAB кнопка для создания задачи */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleNewTask}
                activeOpacity={0.8}
            >
                <Plus size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}
