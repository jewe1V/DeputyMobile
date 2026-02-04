import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
} from 'react-native';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Edit,
    Trash2,
    ChevronLeft,
} from 'lucide-react-native';
import {currentUser, mockTasks} from '@/data/mockData';
import { TaskStatus, TaskPriority } from '@/data/types';
import Toast from 'react-native-toast-message';
import { styles } from './task-detail-style';
import {router, useLocalSearchParams} from "expo-router";
import {LinearGradient} from "expo-linear-gradient";

const priorityConfig: Record<TaskPriority, { label: string; dotColor: string; textColor: string }> = {
    low: {
        label: 'Низкий',
        dotColor: '#9CA3AF', // gray-400
        textColor: '#6B7280', // gray-600
    },
    medium: {
        label: 'Средний',
        dotColor: '#3B82F6', // blue-500
        textColor: '#2563EB', // blue-600
    },
    high: {
        label: 'Высокий',
        dotColor: '#F97316', // orange-500
        textColor: '#EA580C', // orange-600
    },
    urgent: {
        label: 'Срочный',
        dotColor: '#EF4444', // red-500
        textColor: '#DC2626', // red-600
    },
};

const statusConfig: Record<TaskStatus, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
    created: {
        label: 'Новая',
        bgColor: '#F3F4F6', // gray-100
        textColor: '#374151', // gray-700
        borderColor: '#D1D5DB', // gray-300
    },
    in_progress: {
        label: 'В работе',
        bgColor: '#DBEAFE', // blue-100
        textColor: '#1E40AF', // blue-700
        borderColor: '#93C5FD', // blue-300
    },
    approval: {
        label: 'На согласовании',
        bgColor: '#FEF3C7', // amber-100
        textColor: '#92400E', // amber-700
        borderColor: '#FCD34D', // amber-300
    },
    completed: {
        label: 'Завершена',
        bgColor: '#D1FAE5', // green-100
        textColor: '#065F46', // green-700
        borderColor: '#53c161', // green-300
    },
};

const StatusButton = ({
                          status,
                          isActive,
                          onPress,
                      }: {
    status: TaskStatus;
    isActive: boolean;
    onPress: () => void;
}) => {
    const config = statusConfig[status];

    return (
        <TouchableOpacity
            style={[
                styles.statusButton,
                isActive
                    ? {
                        backgroundColor: config.bgColor,
                        borderColor: config.borderColor,
                        borderWidth: 2,
                    }
                    : {
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E5E7EB',
                        borderWidth: 2,
                    },
            ]}
            onPress={onPress}
        >
            <Text
                style={[
                    styles.statusButtonText,
                    isActive
                        ? { color: config.textColor, fontWeight: '600' }
                        : { color: '#6B7280' },
                ]}
            >
                {config.label}
            </Text>
        </TouchableOpacity>
    );
};

export function TaskDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const task = mockTasks.find((t) => t.id === id);
    const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task?.status || 'created');

    if (!task) {
        return (
            <View style={styles.container}>
                <StatusBar backgroundColor="#2A6E3F" barStyle="light-content" />
                <View style={[styles.header, { backgroundColor: '#2A6E3F' }]}>
                    <TouchableOpacity  onPress={() => router.push("/TaskBoardScreen")}>
                        <ChevronLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.taskTitle}>Задача не найдена</Text>
                </View>
            </View>
        );
    }

    const dueDate = new Date(task.dueDate);
    const createdDate = new Date(task.createdAt);
    const today = new Date();
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysLeft < 0 && currentStatus !== 'completed';

    const getInitials = (name: string) => {
        const parts = name.split(' ');
        return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name[0];
    };

    const formatDateTime = (date: Date) => {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleStatusChange = (newStatus: TaskStatus) => {
        setCurrentStatus(newStatus);
        Toast.show({
            type: 'success',
            text1: 'Статус изменён',
            text2: `Задача теперь "${statusConfig[newStatus].label}"`,
        });
    };

    const handleEdit = () => {
        router.push({pathname: '/NewTaskScreen', params: { id: task.id, isEdit: 1 }});
    };

    const handleDelete = () => {
        Alert.alert(
            'Удалить задачу',
            'Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.',
            [
                { text: 'Отмена', style: 'cancel' },
                {
                    text: 'Удалить',
                    style: 'destructive',
                    onPress: () => {
                        Toast.show({
                            type: 'success',
                            text1: 'Задача удалена',
                        });
                        router.push('/TaskBoardScreen');
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                style={styles.header}
                colors={['#2A6E3F', '#349339']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => router.push("/TaskBoardScreen")}>
                        <ArrowLeft size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text
                            style={styles.taskTitle}
                            numberOfLines={5}
                            ellipsizeMode="tail"
                        >
                            {task.title}
                        </Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>
                                {statusConfig[currentStatus].label}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.headerButton}
                        onPress={handleEdit}
                    >
                        <Edit size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>


            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Описание */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Описание</Text>
                    <Text style={styles.descriptionText}>{task.description}</Text>
                </View>

                {/* Блок метаданных */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Метаданные</Text>

                    {/* Приоритет */}
                    <View style={styles.metadataItem}>
                        <View
                            style={[
                                styles.priorityDot,
                                { backgroundColor: priorityConfig[task.priority].dotColor },
                            ]}
                        />
                        <View style={styles.metadataContent}>
                            <Text style={styles.metadataLabel}>Приоритет</Text>
                            <Text
                                style={[
                                    styles.metadataValue,
                                    { color: priorityConfig[task.priority].textColor },
                                ]}
                            >
                                {priorityConfig[task.priority].label}
                            </Text>
                        </View>
                    </View>

                    {/* Даты */}
                    <View style={styles.metadataRow}>
                        <View style={styles.dateItem}>
                            <Calendar size={16} color="#9CA3AF" />
                            <View style={styles.dateContent}>
                                <Text style={styles.dateLabel}>Дата создания</Text>
                                <Text style={styles.dateValue}>
                                    {formatDateTime(createdDate)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.dateItem}>
                            <Clock size={16} color={isOverdue ? '#EF4444' : '#9CA3AF'} />
                            <View style={styles.dateContent}>
                                <Text style={styles.dateLabel}>Крайний срок</Text>
                                <Text style={[styles.dateValue, isOverdue && styles.overdueText]}>
                                    {formatDateTime(dueDate)}
                                    {isOverdue && (
                                        <Text style={styles.overdueDays}>
                                            {' '}(Просрочено на {Math.abs(daysLeft)} дн.)
                                        </Text>
                                    )}
                                </Text>
                            </View>
                        </View>

                        {task.completedAt && (
                            <View style={styles.dateItem}>
                                <Clock size={16} color="#10B981" />
                                <View style={styles.dateContent}>
                                    <Text style={styles.dateLabel}>Дата завершения</Text>
                                    <Text style={[styles.dateValue, { color: '#065F46' }]}>
                                        {formatDateTime(new Date(task.completedAt))}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Сегментированный контрол для смены статуса */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Изменить статус задачи</Text>
                    <View style={styles.statusGrid}>
                        <StatusButton
                            status="created"
                            isActive={currentStatus === 'created'}
                            onPress={() => handleStatusChange('created')}
                        />
                        <StatusButton
                            status="in_progress"
                            isActive={currentStatus === 'in_progress'}
                            onPress={() => handleStatusChange('in_progress')}
                        />
                        <StatusButton
                            status="approval"
                            isActive={currentStatus === 'approval'}
                            onPress={() => handleStatusChange('approval')}
                        />
                        <StatusButton
                            status="completed"
                            isActive={currentStatus === 'completed'}
                            onPress={() => handleStatusChange('completed')}
                        />
                    </View>
                </View>

                {/* Участники */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Участники</Text>

                    <View style={styles.participantsContainer}>
                        <View style={styles.participantItem}>
                            <View style={[styles.avatar, { backgroundColor: '#2A6E3F' }]}>
                                <Text style={styles.avatarText}>
                                    {getInitials(task.assignedToProfile?.fullName || '')}
                                </Text>
                            </View>
                            <View style={styles.participantInfo}>
                                <Text style={styles.participantName}>
                                    {task.assignedToProfile?.fullName}
                                </Text>
                                <Text style={styles.participantRole}>Исполнитель</Text>
                            </View>
                        </View>

                        <View style={styles.participantItem}>
                            <View style={[styles.avatar, { backgroundColor: '#E5E7EB' }]}>
                                <Text style={[styles.avatarText, { color: '#6B7280' }]}>
                                    {getInitials(task.createdByProfile?.fullName || '')}
                                </Text>
                            </View>
                            <View style={styles.participantInfo}>
                                <Text style={styles.participantName}>
                                    {task.createdByProfile?.fullName}
                                </Text>
                                <Text style={styles.participantRole}>Постановщик</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Действия */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleDelete}
                >
                    <Trash2 size={16} color="#DC2626" />
                    <Text style={styles.deleteButtonText}>Удалить задачу</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
