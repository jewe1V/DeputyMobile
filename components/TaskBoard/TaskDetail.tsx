import React, { useCallback, useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
    ArrowLeft,
    Edit,
    Trash2,
    Calendar,
    Clock,
    AlertCircle,
    User,
    CheckCircle2
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { taskService } from '@/api/taskService';
import { Task, TaskStatus } from '@/data/types';
import { priorityConfig, statusConfig } from '@/consts';
import { styles } from './task-detail-style'; // Обнови стили ниже

export function TaskDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();

    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadTask = useCallback(async () => {
        if (!id) return;
        try {
            const data = await taskService.getTaskById(id);
            setTask(data);
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Ошибка загрузки', text2: error.message });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => { loadTask(); }, [loadTask]);

    const onRefresh = () => {
        setRefreshing(true);
        loadTask();
    };

    const handleStatusChange = async (newStatus: TaskStatus) => {
        try {
            // logic: await taskService.updateStatus(id, newStatus);
            setTask(prev => prev ? { ...prev, status: newStatus } : null);
            Toast.show({ type: 'success', text1: 'Статус обновлен' });
        } catch (e) {
            Toast.show({ type: 'error', text1: 'Не удалось обновить статус' });
        }
    };

    const handleDelete = () => {
        Alert.alert('Удаление', 'Вы уверены?', [
            { text: 'Отмена', style: 'cancel' },
            {
                text: 'Удалить',
                style: 'destructive',
                onPress: async () => {
                    await taskService.deleteTask(id as string);
                    router.back();
                }
            },
        ]);
    };

    if (loading) return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2A6E3F" />
        </View>
    );

    if (!task) return <View style={styles.container}><Text>Задача не найдена</Text></View>;

    const config = statusConfig[task.status];
    const priority = priorityConfig[task.priority];

    return (
        <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <StatusBar barStyle="light-content" />

            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Header аналогичный Events */}
                <LinearGradient
                    colors={['#2A6E3F', '#349339']}
                    style={[styles.header, { paddingTop: insets.top + 15 }]}
                >
                    <View style={styles.headerTopRow}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <ArrowLeft size={24} color="white" />
                        </TouchableOpacity>

                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.iconButton} onPress={() => router.push({pathname: '/NewTaskScreen', params: { id, isEdit: 1 }})}>
                                <Edit size={20} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.iconButton, { marginLeft: 10 }]} onPress={handleDelete}>
                                <Trash2 size={20} color="#ff8a8a" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle} numberOfLines={3}>{task.title}</Text>
                        <View style={[styles.statusTag, { backgroundColor: config.bgColor }]}>
                            <Text style={[styles.statusTagText, { color: config.textColor }]}>{config.label}</Text>
                        </View>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    {/* Сроки (Time Row Style) */}
                    <View style={styles.card}>
                        <View style={styles.timeRow}>
                            <View style={styles.timeContent}>
                                <Text style={styles.label}>Создано</Text>
                                <Text style={styles.value}>{new Date(task.createdAt).toLocaleDateString('ru-RU')}</Text>
                            </View>
                            <View style={styles.timeDividerVertical} />
                            <View style={styles.timeContent}>
                                <Text style={styles.label}>Крайний срок</Text>
                                <Text style={[styles.value, { color: '#ef4444' }]}>{new Date(task.dueDate).toLocaleDateString('ru-RU')}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Описание */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Описание</Text>
                        <Text style={styles.description}>{task.description || 'Описание отсутствует'}</Text>

                        <View style={styles.priorityBadge}>
                            <View style={[styles.dot, { backgroundColor: priority.dotColor }]} />
                            <Text style={[styles.priorityText, { color: priority.textColor }]}>
                                Приоритет: {priority.label}
                            </Text>
                        </View>
                    </View>

                    {/* Исполнители (Attendee Style) */}
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Участники</Text>
                        {/* Автор */}
                        <View style={styles.attendeeRow}>
                            <View style={[styles.avatar, { backgroundColor: '#e2e8f0' }]}>
                                <User size={18} color="#64748b" />
                            </View>
                            <View style={styles.attendeeInfo}>
                                <Text style={styles.attendeeName}>{task.authorName}</Text>
                                <Text style={styles.statusText}>Постановщик</Text>
                            </View>
                        </View>
                        {/* Список исполнителей */}
                        {task.users?.map((user, idx) => (
                            <View key={idx} style={styles.attendeeRow}>
                                <View style={[styles.avatar, { backgroundColor: '#dcfce7' }]}>
                                    <Text style={styles.avatarText}>{user.name?.charAt(0)}</Text>
                                </View>
                                <View style={styles.attendeeInfo}>
                                    <Text style={styles.attendeeName}>{user.fullName || user.name}</Text>
                                    <Text style={styles.statusText}>Исполнитель</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Кнопки смены статуса (Action Group Style) */}
                    <Text style={[styles.sectionTitle, { marginLeft: 8, marginBottom: 12 }]}>Обновить статус</Text>
                    <View style={styles.statusGrid}>
                        {(['in_progress', 'approval', 'completed'] as TaskStatus[]).map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.statusButton, task.status === s && { backgroundColor: statusConfig[s].bgColor, borderColor: statusConfig[s].borderColor }]}
                                onPress={() => handleStatusChange(s)}
                            >
                                <Text style={[styles.statusButtonText, task.status === s && { color: statusConfig[s].textColor }]}>
                                    {statusConfig[s].label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
