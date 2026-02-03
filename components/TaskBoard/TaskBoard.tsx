import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList, StatusBar, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    Clock,
    ChevronDown, Plus,
} from 'lucide-react-native';
import {currentUser, mockTasks} from '@/data/mockData';
import { Task, TaskStatus, TaskPriority } from '@/data/types';
import { styles } from './task-board-style';
import {router} from "expo-router";
import {LinearGradient} from "expo-linear-gradient";
import {TaskCard} from "@/components/TaskBoard/TaskCard";

type RootStackParamList = {
    Home: undefined;
    TaskDetail: { taskId: string };
    NewTask: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

    const handleTaskPress = (id: string) => {
        router.push({
            pathname: '/TaskDetailScreen',
            params: { id },
    });
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
        <View>
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
                <TouchableOpacity style={styles.newTaskButton} onPress={handleNewTask}>
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
        </View>
    );
}
