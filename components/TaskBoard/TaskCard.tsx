import { styles } from "@/components/TaskBoard/task-board-style";
import { Task, TaskPriority } from "@/data/types";
import { Calendar, Clock } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface TaskCardProps {
    task: Task;
    onPress: () => void;
}

export function TaskCard({ task, onPress }: TaskCardProps) {
    const dueDate = new Date(task.dueDate);
    const startDate = new Date(task.createdAt);
    const today = new Date();
    const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysLeft < 0 && task.status !== 'completed';
    const isUrgent = daysLeft <= 2 && daysLeft >= 0 && task.status !== 'completed';

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
                    Исполнители: {task.users && task.users.length > 0 ? task.users.map((u: any) => u.fullName || u.name).join(', ') : 'не назначены'}
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
